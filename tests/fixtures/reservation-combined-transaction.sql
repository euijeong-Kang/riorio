\set ON_ERROR_STOP on
DO $$ BEGIN
  IF current_database() <> 'riorio_reservation_fixture' OR current_user <> 'riorio_test' THEN
    RAISE EXCEPTION 'Fixture may only run in the dedicated local test database';
  END IF;
END $$;

BEGIN;
CREATE SCHEMA combined_fixture;
CREATE TABLE combined_fixture.settings (
  event_id text PRIMARY KEY REFERENCES policy_fixture.events(id),
  slot_id integer NOT NULL REFERENCES policy_fixture.event_slots(slot_id),
  starts_at timestamptz NOT NULL,
  terms_approved boolean NOT NULL,
  terms_version text NOT NULL,
  deposit_confirmed boolean NOT NULL,
  deposit_per_guest integer NOT NULL CHECK (deposit_per_guest >= 0),
  deposit_version text NOT NULL
);
CREATE TABLE combined_fixture.snapshots (
  request_key text PRIMARY KEY REFERENCES allocation_fixture.bookings(request_key) CHECK (request_key <> 'combined-failure'),
  terms_version text NOT NULL,
  deposit_amount bigint NOT NULL,
  deposit_version text NOT NULL,
  total bigint NOT NULL
);

CREATE FUNCTION combined_fixture.book(test_event text, test_slot integer, test_key text, test_digest text, test_fingerprint text, expected_terms text, accepted boolean, expected_deposit integer, expected_deposit_version text, test_guests integer, test_pairing integer) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  event_record policy_fixture.events%ROWTYPE;
  settings_record combined_fixture.settings%ROWTYPE;
  result text;
  total bigint;
  deposit_total bigint;
BEGIN
  SELECT * INTO event_record FROM policy_fixture.events WHERE id = test_event FOR SHARE;
  IF NOT FOUND OR NOT event_record.is_open THEN RETURN 'closed'; END IF;
  SELECT * INTO settings_record FROM combined_fixture.settings WHERE event_id = test_event FOR SHARE;
  IF NOT FOUND OR settings_record.slot_id <> test_slot OR NOT settings_record.terms_approved OR NOT settings_record.deposit_confirmed THEN RETURN 'closed'; END IF;
  IF settings_record.terms_version IS DISTINCT FROM event_record.terms_version OR settings_record.terms_version IS DISTINCT FROM expected_terms THEN RETURN 'terms_changed'; END IF;
  IF accepted IS DISTINCT FROM true THEN RETURN 'terms_not_accepted'; END IF;
  IF test_guests IS NULL OR test_guests NOT BETWEEN 2 AND 4 OR test_pairing IS NULL OR test_pairing < 0 OR test_pairing > test_guests THEN RETURN 'invalid_guests'; END IF;
  deposit_total := test_guests::bigint * settings_record.deposit_per_guest;
  IF deposit_total IS DISTINCT FROM expected_deposit OR settings_record.deposit_version IS DISTINCT FROM expected_deposit_version THEN RETURN 'deposit_changed'; END IF;
  total := test_guests::bigint * event_record.course_price + test_pairing::bigint * event_record.pairing_price;
  IF deposit_total > total OR event_record.closes_at > settings_record.starts_at THEN RETURN 'closed'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(test_key, 0));
  PERFORM 1 FROM allocation_fixture.slots WHERE id = test_slot FOR UPDATE;
  IF NOT FOUND OR clock_timestamp() < event_record.opens_at OR clock_timestamp() >= event_record.closes_at OR clock_timestamp() >= settings_record.starts_at THEN RETURN 'closed'; END IF;
  result := policy_fixture.book_with_expected_price(test_event, test_slot, test_key, test_fingerprint, test_guests, test_pairing, expected_terms, test_digest, clock_timestamp() + interval '1 hour', 1000, 300);
  IF result = 'created' THEN
    INSERT INTO combined_fixture.snapshots VALUES (test_key, settings_record.terms_version, deposit_total, settings_record.deposit_version, total);
  END IF;
  RETURN result;
END $$;

INSERT INTO allocation_fixture.slots VALUES (399994, 4);
INSERT INTO allocation_fixture.combinations VALUES (399994, 1, 4, ARRAY['A','B']);
INSERT INTO allocation_fixture.combinations VALUES (399994, 2, 2, ARRAY['A']), (399994, 3, 3, ARRAY['A','B']);
INSERT INTO policy_fixture.events VALUES ('combined-test', true, current_timestamp - interval '1 hour', current_timestamp + interval '1 hour', 'v1', 1000, 300);
INSERT INTO policy_fixture.event_slots VALUES ('combined-test', 399994);
INSERT INTO combined_fixture.settings VALUES ('combined-test', 399994, current_timestamp + interval '2 hours', true, 'v1', true, 500, 'deposit-v1');

DO $$ DECLARE test_digest text := md5(random()::text) || md5(random()::text); BEGIN
  IF combined_fixture.book('combined-test', 399994, 'combined-success', test_digest, 'hash-a', 'old', true, 2000, 'deposit-v1', 4, 0) <> 'terms_changed' THEN RAISE EXCEPTION 'Stale terms accepted'; END IF;
  IF combined_fixture.book('combined-test', 399994, 'combined-success', test_digest, 'hash-a', 'v1', false, 2000, 'deposit-v1', 4, 0) <> 'terms_not_accepted' THEN RAISE EXCEPTION 'Missing consent accepted'; END IF;
  IF combined_fixture.book('combined-test', 399994, 'combined-success', test_digest, 'hash-a', 'v1', true, 0, 'old', 4, 0) <> 'deposit_changed' THEN RAISE EXCEPTION 'Stale deposit accepted'; END IF;
  UPDATE combined_fixture.settings SET starts_at = current_timestamp + interval '30 minutes' WHERE event_id = 'combined-test';
  IF combined_fixture.book('combined-test', 399994, 'combined-success', test_digest, 'hash-a', 'v1', true, 2000, 'deposit-v1', 4, 0) <> 'closed' THEN RAISE EXCEPTION 'Invalid slot accepted'; END IF;
  UPDATE combined_fixture.settings SET starts_at = current_timestamp + interval '2 hours' WHERE event_id = 'combined-test';
  IF combined_fixture.book('combined-test', 399994, 'combined-invalid', test_digest, 'hash-a', 'v1', true, 500, 'deposit-v1', 1, 0) <> 'invalid_guests' THEN RAISE EXCEPTION 'One guest accepted'; END IF;
  IF combined_fixture.book('combined-test', 399994, 'combined-invalid', test_digest, 'hash-a', 'v1', true, 500, 'deposit-v1', 2, 3) <> 'invalid_guests' THEN RAISE EXCEPTION 'Excess pairing accepted'; END IF;
  BEGIN
    PERFORM combined_fixture.book('combined-test', 399994, 'combined-failure', test_digest, 'hash-a', 'v1', true, 2000, 'deposit-v1', 4, 0);
    RAISE EXCEPTION 'Expected snapshot failure';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  IF EXISTS (SELECT 1 FROM allocation_fixture.bookings WHERE request_key = 'combined-failure') OR EXISTS (SELECT 1 FROM allocation_fixture.occupied_tables WHERE slot_id = 399994) OR EXISTS (SELECT 1 FROM policy_fixture.recovery_tokens WHERE request_key = 'combined-failure') OR EXISTS (SELECT 1 FROM policy_fixture.price_snapshots WHERE request_key = 'combined-failure') THEN RAISE EXCEPTION 'Snapshot failure left partial data'; END IF;
  IF combined_fixture.book('combined-test', 399994, 'combined-two', md5(random()::text) || md5(random()::text), 'hash-two', 'v1', true, 1000, 'deposit-v1', 2, 1) <> 'created' THEN RAISE EXCEPTION 'Two guests rejected'; END IF;
  IF NOT EXISTS (SELECT 1 FROM combined_fixture.snapshots WHERE request_key = 'combined-two' AND total = 2300) THEN RAISE EXCEPTION 'Two guest total invalid'; END IF;
  IF allocation_fixture.cancel(399994, 'combined-two') <> 'cancelled' THEN RAISE EXCEPTION 'Two guest fixture cancellation failed'; END IF;
  IF combined_fixture.book('combined-test', 399994, 'combined-three', md5(random()::text) || md5(random()::text), 'hash-three', 'v1', true, 1500, 'deposit-v1', 3, 3) <> 'created' THEN RAISE EXCEPTION 'Three guests rejected'; END IF;
  IF NOT EXISTS (SELECT 1 FROM combined_fixture.snapshots WHERE request_key = 'combined-three' AND total = 3900) THEN RAISE EXCEPTION 'Three guest total invalid'; END IF;
  IF allocation_fixture.cancel(399994, 'combined-three') <> 'cancelled' THEN RAISE EXCEPTION 'Three guest fixture cancellation failed'; END IF;
  IF combined_fixture.book('combined-test', 399994, 'combined-success', test_digest, 'hash-a', 'v1', true, 2000, 'deposit-v1', 4, 0) <> 'created' THEN RAISE EXCEPTION 'Valid booking rejected'; END IF;
  IF combined_fixture.book('combined-test', 399994, 'combined-success', test_digest, 'hash-a', 'v1', true, 2000, 'deposit-v1', 4, 0) <> 'replay' THEN RAISE EXCEPTION 'Replay failed'; END IF;
  IF combined_fixture.book('combined-test', 399994, 'combined-success', test_digest, 'hash-b', 'v1', true, 2000, 'deposit-v1', 4, 0) <> 'conflict' THEN RAISE EXCEPTION 'Conflict not detected'; END IF;
  IF NOT EXISTS (SELECT 1 FROM combined_fixture.snapshots WHERE request_key = 'combined-success' AND terms_version = 'v1' AND deposit_amount = 2000 AND deposit_version = 'deposit-v1' AND total = 4000) OR (SELECT count(*) FROM allocation_fixture.occupied_tables WHERE slot_id = 399994) <> 2 THEN RAISE EXCEPTION 'Booking snapshot or seats invalid'; END IF;
END $$;
ROLLBACK;
