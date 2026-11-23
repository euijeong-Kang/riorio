\set ON_ERROR_STOP on
DO $$ BEGIN
  IF current_database() <> 'riorio_reservation_fixture' OR current_user <> 'riorio_test' THEN
    RAISE EXCEPTION 'Fixture may only run in the dedicated local test database';
  END IF;
END $$;

CREATE SCHEMA admin_fixture;
CREATE TABLE admin_fixture.grants (event_id text NOT NULL REFERENCES policy_fixture.events(id), actor_id text NOT NULL, active boolean NOT NULL, PRIMARY KEY (event_id, actor_id));
CREATE TABLE admin_fixture.audit_log (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, event_id text NOT NULL, request_key text NOT NULL, actor_id text NOT NULL CHECK (actor_id <> 'fixture-audit-failure'), action text NOT NULL CHECK (action = 'cancelled'), recorded_at timestamptz NOT NULL DEFAULT current_timestamp);

CREATE FUNCTION admin_fixture.cancel_with_audit(test_event text, test_slot integer, test_key text, test_actor text) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  result text;
BEGIN
  PERFORM 1 FROM admin_fixture.grants WHERE event_id = test_event AND actor_id = test_actor AND active = true FOR SHARE;
  IF NOT FOUND THEN RETURN 'denied'; END IF;
  IF NOT EXISTS (SELECT 1 FROM policy_fixture.event_slots WHERE event_id = test_event AND slot_id = test_slot) THEN RETURN 'not_found'; END IF;
  result := allocation_fixture.cancel(test_slot, test_key);
  IF result = 'cancelled' THEN
    INSERT INTO admin_fixture.audit_log (event_id, request_key, actor_id, action) VALUES (test_event, test_key, test_actor, 'cancelled');
  END IF;
  RETURN result;
END $$;

INSERT INTO allocation_fixture.slots VALUES (300004, 4);
INSERT INTO allocation_fixture.combinations VALUES (300004, 1, 4, ARRAY['A','B']);
INSERT INTO policy_fixture.events VALUES ('audit-sample', true, current_timestamp - interval '1 hour', current_timestamp + interval '1 hour', 'v1', 1000, 300);
INSERT INTO policy_fixture.event_slots VALUES ('audit-sample', 300004);
INSERT INTO admin_fixture.grants VALUES ('audit-sample', 'fixture-admin', true), ('audit-sample', 'fixture-audit-failure', true);

DO $$ BEGIN
  IF policy_fixture.book_with_recovery('audit-sample', 300004, 'audit-booking', 'hash', 4, 0, 'v1', repeat('d', 64), current_timestamp + interval '1 hour') <> 'created' THEN RAISE EXCEPTION 'Fixture booking failed'; END IF;
  IF admin_fixture.cancel_with_audit('audit-sample', 300004, 'audit-booking', 'unknown') <> 'denied' THEN RAISE EXCEPTION 'Unauthorized cancellation accepted'; END IF;
  BEGIN
    PERFORM admin_fixture.cancel_with_audit('audit-sample', 300004, 'audit-booking', 'fixture-audit-failure');
    RAISE EXCEPTION 'Expected audit failure';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  IF NOT EXISTS (SELECT 1 FROM allocation_fixture.bookings WHERE request_key = 'audit-booking' AND state = 'active') OR (SELECT count(*) FROM allocation_fixture.occupied_tables WHERE slot_id = 300004) <> 2 THEN RAISE EXCEPTION 'Cancellation survived failed audit'; END IF;
  IF admin_fixture.cancel_with_audit('audit-sample', 300004, 'audit-booking', 'fixture-admin') <> 'cancelled' THEN RAISE EXCEPTION 'Authorized cancellation failed'; END IF;
  IF admin_fixture.cancel_with_audit('audit-sample', 300004, 'audit-booking', 'fixture-admin') <> 'already_cancelled' THEN RAISE EXCEPTION 'Repeat cancellation failed'; END IF;
  IF (SELECT count(*) FROM admin_fixture.audit_log WHERE request_key = 'audit-booking') <> 1 OR EXISTS (SELECT 1 FROM allocation_fixture.occupied_tables WHERE slot_id = 300004) THEN RAISE EXCEPTION 'Audit or occupancy invariant failed'; END IF;
END $$;
