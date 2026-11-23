\set ON_ERROR_STOP on
DO $$ BEGIN
  IF current_database() <> 'riorio_reservation_fixture' OR current_user <> 'riorio_test' THEN
    RAISE EXCEPTION 'Fixture may only run in the dedicated local test database';
  END IF;
END $$;

BEGIN;
CREATE TABLE policy_fixture.test_deposit_settings (
  event_id text PRIMARY KEY REFERENCES policy_fixture.events(id),
  confirmed boolean NOT NULL,
  amount integer NOT NULL CHECK (amount >= 0),
  version text NOT NULL
);
CREATE TABLE policy_fixture.test_deposit_snapshots (
  request_key text PRIMARY KEY REFERENCES allocation_fixture.bookings(request_key),
  amount integer NOT NULL,
  version text NOT NULL
);

CREATE FUNCTION policy_fixture.test_book_with_deposit(test_event text, test_slot integer, test_key text, test_digest text, expected_amount integer, expected_version text) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  event_record policy_fixture.events%ROWTYPE;
  deposit_record policy_fixture.test_deposit_settings%ROWTYPE;
  result text;
BEGIN
  SELECT * INTO event_record FROM policy_fixture.events WHERE id = test_event FOR SHARE;
  IF NOT FOUND THEN RETURN 'closed'; END IF;
  SELECT * INTO deposit_record FROM policy_fixture.test_deposit_settings WHERE event_id = test_event FOR SHARE;
  IF NOT FOUND OR NOT deposit_record.confirmed THEN RETURN 'closed'; END IF;
  IF deposit_record.amount IS DISTINCT FROM expected_amount OR deposit_record.version IS DISTINCT FROM expected_version THEN RETURN 'deposit_changed'; END IF;
  IF deposit_record.amount > 4::bigint * event_record.course_price THEN RETURN 'closed'; END IF;
  result := policy_fixture.book_with_expected_price(test_event, test_slot, test_key, 'fixture-hash', 4, 0, 'v1', test_digest, clock_timestamp() + interval '1 hour', 1000, 300);
  IF result = 'created' THEN
    INSERT INTO policy_fixture.test_deposit_snapshots VALUES (test_key, deposit_record.amount, deposit_record.version);
  END IF;
  RETURN result;
END $$;

INSERT INTO allocation_fixture.slots VALUES (399992, 4);
INSERT INTO allocation_fixture.combinations VALUES (399992, 1, 4, ARRAY['A','B']);
INSERT INTO policy_fixture.events VALUES ('deposit-fixture', true, current_timestamp - interval '1 hour', current_timestamp + interval '1 hour', 'v1', 1000, 300);
INSERT INTO policy_fixture.event_slots VALUES ('deposit-fixture', 399992);

DO $$ DECLARE test_digest text := md5(random()::text) || md5(random()::text); BEGIN
  IF policy_fixture.test_book_with_deposit('deposit-fixture', 399992, 'deposit-test', test_digest, 0, 'v1') <> 'closed' THEN RAISE EXCEPTION 'Missing deposit accepted'; END IF;
  INSERT INTO policy_fixture.test_deposit_settings VALUES ('deposit-fixture', false, 0, 'v1');
  IF policy_fixture.test_book_with_deposit('deposit-fixture', 399992, 'deposit-test', test_digest, 0, 'v1') <> 'closed' THEN RAISE EXCEPTION 'Unconfirmed deposit accepted'; END IF;
  UPDATE policy_fixture.test_deposit_settings SET confirmed = true, amount = 4001 WHERE event_id = 'deposit-fixture';
  IF policy_fixture.test_book_with_deposit('deposit-fixture', 399992, 'deposit-test', test_digest, 4001, 'v1') <> 'closed' THEN RAISE EXCEPTION 'Excessive deposit accepted'; END IF;
  UPDATE policy_fixture.test_deposit_settings SET amount = 500, version = 'v2' WHERE event_id = 'deposit-fixture';
  IF policy_fixture.test_book_with_deposit('deposit-fixture', 399992, 'deposit-test', test_digest, 0, 'v1') <> 'deposit_changed' THEN RAISE EXCEPTION 'Stale deposit accepted'; END IF;
  IF EXISTS (SELECT 1 FROM allocation_fixture.bookings WHERE request_key = 'deposit-test') OR EXISTS (SELECT 1 FROM allocation_fixture.occupied_tables WHERE slot_id = 399992) THEN RAISE EXCEPTION 'Rejected attempt wrote booking or seats'; END IF;
  IF policy_fixture.test_book_with_deposit('deposit-fixture', 399992, 'deposit-test', test_digest, 500, 'v2') <> 'created' THEN RAISE EXCEPTION 'Confirmed deposit rejected'; END IF;
  UPDATE policy_fixture.test_deposit_settings SET amount = 600, version = 'v3' WHERE event_id = 'deposit-fixture';
  IF NOT EXISTS (SELECT 1 FROM policy_fixture.test_deposit_snapshots WHERE request_key = 'deposit-test' AND amount = 500 AND version = 'v2') THEN RAISE EXCEPTION 'Deposit snapshot changed'; END IF;
END $$;
ROLLBACK;
