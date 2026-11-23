\set ON_ERROR_STOP on
DO $$ BEGIN
  IF current_database() <> 'riorio_reservation_fixture' OR current_user <> 'riorio_test' THEN
    RAISE EXCEPTION 'Fixture may only run in the dedicated local test database';
  END IF;
END $$;

BEGIN;
CREATE TABLE policy_fixture.test_slot_starts (
  slot_id integer PRIMARY KEY REFERENCES policy_fixture.event_slots(slot_id),
  starts_at timestamptz NOT NULL
);

CREATE FUNCTION policy_fixture.test_book_with_slot_start(test_event text, test_slot integer, test_key text, test_digest text) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  event_record policy_fixture.events%ROWTYPE;
  slot_start timestamptz;
BEGIN
  SELECT * INTO event_record FROM policy_fixture.events WHERE id = test_event FOR SHARE;
  IF NOT FOUND OR NOT event_record.is_open OR clock_timestamp() < event_record.opens_at OR clock_timestamp() >= event_record.closes_at THEN RETURN 'closed'; END IF;
  SELECT starts.starts_at INTO slot_start FROM policy_fixture.test_slot_starts starts JOIN policy_fixture.event_slots slots ON slots.slot_id = starts.slot_id WHERE slots.event_id = test_event AND slots.slot_id = test_slot FOR SHARE OF starts, slots;
  IF NOT FOUND OR event_record.closes_at > slot_start OR clock_timestamp() >= event_record.closes_at OR clock_timestamp() >= slot_start THEN RETURN 'closed'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(test_key, 0));
  PERFORM 1 FROM allocation_fixture.slots WHERE id = test_slot FOR UPDATE;
  IF NOT FOUND OR clock_timestamp() >= event_record.closes_at OR clock_timestamp() >= slot_start THEN RETURN 'closed'; END IF;
  RETURN policy_fixture.book_with_expected_price(test_event, test_slot, test_key, 'fixture-hash', 4, 0, 'v1', test_digest, clock_timestamp() + interval '1 hour', 1000, 300);
END $$;

CREATE FUNCTION policy_fixture.test_change_slot(test_event text, test_slot integer, new_start timestamptz) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  event_close timestamptz;
BEGIN
  SELECT closes_at INTO event_close FROM policy_fixture.events WHERE id = test_event FOR SHARE;
  IF NOT FOUND THEN RETURN 'unavailable'; END IF;
  PERFORM 1 FROM policy_fixture.test_slot_starts starts JOIN policy_fixture.event_slots slots ON slots.slot_id = starts.slot_id WHERE slots.event_id = test_event AND slots.slot_id = test_slot FOR UPDATE OF starts, slots;
  IF NOT FOUND THEN RETURN 'unavailable'; END IF;
  IF new_start IS NULL OR NOT isfinite(new_start) OR new_start <= clock_timestamp() OR new_start < event_close THEN RETURN 'invalid_start'; END IF;
  IF EXISTS (SELECT 1 FROM allocation_fixture.bookings WHERE slot_id = test_slot) THEN RETURN 'has_bookings'; END IF;
  UPDATE policy_fixture.test_slot_starts SET starts_at = new_start WHERE slot_id = test_slot;
  RETURN 'changed';
END $$;

CREATE TABLE policy_fixture.test_slot_audit (
  event_id text NOT NULL,
  slot_id integer NOT NULL,
  actor_id text NOT NULL CHECK (actor_id <> 'fixture-audit-failure'),
  new_start timestamptz NOT NULL
);

CREATE FUNCTION policy_fixture.test_change_slot_with_audit(test_event text, test_slot integer, new_start timestamptz, test_actor text) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  result text;
BEGIN
  PERFORM 1 FROM admin_fixture.grants WHERE event_id = test_event AND actor_id = test_actor AND active = true FOR SHARE;
  IF NOT FOUND THEN RETURN 'denied'; END IF;
  result := policy_fixture.test_change_slot(test_event, test_slot, new_start);
  IF result = 'changed' THEN
    INSERT INTO policy_fixture.test_slot_audit VALUES (test_event, test_slot, test_actor, new_start);
  END IF;
  RETURN result;
END $$;

INSERT INTO allocation_fixture.slots VALUES (399991, 4);
INSERT INTO allocation_fixture.combinations VALUES (399991, 1, 4, ARRAY['A','B']);
INSERT INTO policy_fixture.events VALUES ('slot-start-fixture', true, current_timestamp - interval '1 hour', current_timestamp + interval '1 hour', 'v1', 1000, 300);
INSERT INTO policy_fixture.event_slots VALUES ('slot-start-fixture', 399991);
INSERT INTO admin_fixture.grants VALUES ('slot-start-fixture', 'fixture-admin', true), ('slot-start-fixture', 'fixture-audit-failure', true);

DO $$ DECLARE test_digest text := md5(random()::text) || md5(random()::text); original_start timestamptz; BEGIN
  IF policy_fixture.test_book_with_slot_start('slot-start-fixture', 399991, 'slot-start-test', test_digest) <> 'closed' THEN RAISE EXCEPTION 'Missing slot start accepted'; END IF;
  INSERT INTO policy_fixture.test_slot_starts VALUES (399991, current_timestamp - interval '1 hour');
  IF policy_fixture.test_book_with_slot_start('slot-start-fixture', 399991, 'slot-start-test', test_digest) <> 'closed' THEN RAISE EXCEPTION 'Past slot accepted'; END IF;
  UPDATE policy_fixture.test_slot_starts SET starts_at = current_timestamp + interval '30 minutes' WHERE slot_id = 399991;
  IF policy_fixture.test_book_with_slot_start('slot-start-fixture', 399991, 'slot-start-test', test_digest) <> 'closed' THEN RAISE EXCEPTION 'Close after slot accepted'; END IF;
  IF EXISTS (SELECT 1 FROM allocation_fixture.bookings WHERE request_key = 'slot-start-test') OR EXISTS (SELECT 1 FROM allocation_fixture.occupied_tables WHERE slot_id = 399991) THEN RAISE EXCEPTION 'Rejected attempt wrote booking or seats'; END IF;
  IF policy_fixture.test_change_slot('other-event', 399991, current_timestamp + interval '3 hours') <> 'unavailable' THEN RAISE EXCEPTION 'Wrong event accepted'; END IF;
  IF policy_fixture.test_change_slot('slot-start-fixture', 399991, NULL) <> 'invalid_start' THEN RAISE EXCEPTION 'Missing start accepted'; END IF;
  IF policy_fixture.test_change_slot('slot-start-fixture', 399991, current_timestamp + interval '30 minutes') <> 'invalid_start' THEN RAISE EXCEPTION 'Invalid start accepted'; END IF;
  IF policy_fixture.test_change_slot('slot-start-fixture', 399991, current_timestamp + interval '3 hours') <> 'changed' THEN RAISE EXCEPTION 'Valid change rejected'; END IF;
  SELECT starts_at INTO original_start FROM policy_fixture.test_slot_starts WHERE slot_id = 399991;
  IF policy_fixture.test_change_slot_with_audit('slot-start-fixture', 399991, current_timestamp + interval '4 hours', 'unknown') <> 'denied' THEN RAISE EXCEPTION 'Unauthorized change accepted'; END IF;
  BEGIN
    PERFORM policy_fixture.test_change_slot_with_audit('slot-start-fixture', 399991, current_timestamp + interval '4 hours', 'fixture-audit-failure');
    RAISE EXCEPTION 'Expected audit failure';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  IF (SELECT starts_at FROM policy_fixture.test_slot_starts WHERE slot_id = 399991) IS DISTINCT FROM original_start OR EXISTS (SELECT 1 FROM policy_fixture.test_slot_audit) THEN RAISE EXCEPTION 'Audit failure left a change'; END IF;
  IF policy_fixture.test_change_slot_with_audit('slot-start-fixture', 399991, current_timestamp + interval '4 hours', 'fixture-admin') <> 'changed' THEN RAISE EXCEPTION 'Authorized change rejected'; END IF;
  IF (SELECT count(*) FROM policy_fixture.test_slot_audit WHERE event_id = 'slot-start-fixture' AND slot_id = 399991 AND actor_id = 'fixture-admin') <> 1 THEN RAISE EXCEPTION 'Audit not recorded'; END IF;
  UPDATE policy_fixture.test_slot_starts SET starts_at = current_timestamp + interval '2 hours' WHERE slot_id = 399991;
  IF policy_fixture.test_book_with_slot_start('slot-start-fixture', 399991, 'slot-start-test', test_digest) <> 'created' THEN RAISE EXCEPTION 'Valid slot rejected'; END IF;
  IF (SELECT count(*) FROM allocation_fixture.bookings WHERE request_key = 'slot-start-test') <> 1 THEN RAISE EXCEPTION 'Valid booking not stored'; END IF;
  IF policy_fixture.test_change_slot('slot-start-fixture', 399991, current_timestamp + interval '3 hours') <> 'has_bookings' THEN RAISE EXCEPTION 'Existing booking not protected'; END IF;
  IF policy_fixture.test_change_slot_with_audit('slot-start-fixture', 399991, current_timestamp + interval '3 hours', 'fixture-admin') <> 'has_bookings' OR (SELECT count(*) FROM policy_fixture.test_slot_audit) <> 1 THEN RAISE EXCEPTION 'Rejected change wrote audit'; END IF;
END $$;
ROLLBACK;
