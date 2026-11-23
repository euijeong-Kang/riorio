\set ON_ERROR_STOP on
DO $$ BEGIN
  IF current_database() <> 'riorio_reservation_fixture' OR current_user <> 'riorio_test' THEN
    RAISE EXCEPTION 'Fixture may only run in the dedicated local test database';
  END IF;
END $$;

CREATE SCHEMA policy_fixture;
CREATE TABLE policy_fixture.events (
  id text PRIMARY KEY,
  is_open boolean NOT NULL DEFAULT false,
  opens_at timestamptz NOT NULL,
  closes_at timestamptz NOT NULL,
  terms_version text NOT NULL,
  course_price integer NOT NULL CHECK (course_price >= 0),
  pairing_price integer NOT NULL CHECK (pairing_price >= 0),
  CHECK (opens_at < closes_at)
);
CREATE TABLE policy_fixture.event_slots (event_id text NOT NULL REFERENCES policy_fixture.events(id), slot_id integer PRIMARY KEY REFERENCES allocation_fixture.slots(id));
CREATE TABLE policy_fixture.price_snapshots (request_key text PRIMARY KEY REFERENCES allocation_fixture.bookings(request_key), course_price integer NOT NULL, pairing_price integer NOT NULL, guests integer NOT NULL, pairing_guests integer NOT NULL, total bigint NOT NULL);

CREATE FUNCTION policy_fixture.book(test_event text, test_slot integer, test_key text, test_fingerprint text, test_guests integer, test_pairing integer, test_terms text) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  event_record policy_fixture.events%ROWTYPE;
  result text;
BEGIN
  SELECT * INTO event_record FROM policy_fixture.events WHERE id = test_event FOR SHARE;
  IF NOT FOUND OR NOT event_record.is_open OR current_timestamp < event_record.opens_at OR current_timestamp >= event_record.closes_at THEN RETURN 'closed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM policy_fixture.event_slots WHERE event_id = test_event AND slot_id = test_slot) THEN RETURN 'invalid_slot'; END IF;
  IF test_guests IS NULL OR test_guests NOT BETWEEN 2 AND 4 OR test_pairing IS NULL OR test_pairing < 0 OR test_pairing > test_guests THEN RETURN 'invalid_guests'; END IF;
  IF test_terms IS DISTINCT FROM event_record.terms_version THEN RETURN 'terms_changed'; END IF;
  result := allocation_fixture.book(test_slot, test_key, test_fingerprint, test_guests);
  IF result = 'created' THEN
    INSERT INTO policy_fixture.price_snapshots VALUES (test_key, event_record.course_price, event_record.pairing_price, test_guests, test_pairing, test_guests::bigint * event_record.course_price + test_pairing::bigint * event_record.pairing_price);
  END IF;
  RETURN result;
END $$;

INSERT INTO allocation_fixture.slots VALUES (300001, 4);
INSERT INTO allocation_fixture.combinations VALUES (300001, 1, 4, ARRAY['A','B']);
INSERT INTO policy_fixture.events VALUES ('sample', false, current_timestamp - interval '1 hour', current_timestamp + interval '1 hour', 'v1', 1000, 300);
INSERT INTO policy_fixture.event_slots VALUES ('sample', 300001);

DO $$ BEGIN
  IF policy_fixture.book('sample', 300001, 'sample-key', 'hash-a', 4, 2, 'v1') <> 'closed' THEN RAISE EXCEPTION 'Closed event accepted'; END IF;
  IF EXISTS (SELECT 1 FROM allocation_fixture.bookings WHERE request_key = 'sample-key') THEN RAISE EXCEPTION 'Closed event wrote booking'; END IF;
  UPDATE policy_fixture.events SET is_open = true WHERE id = 'sample';
  IF policy_fixture.book('sample', 9, 'other-slot', 'hash', 4, 2, 'v1') <> 'invalid_slot' THEN RAISE EXCEPTION 'Wrong event slot accepted'; END IF;
  IF policy_fixture.book('sample', 300001, 'wrong-guests', 'hash', 1, 0, 'v1') <> 'invalid_guests' THEN RAISE EXCEPTION 'Invalid guests accepted'; END IF;
  IF policy_fixture.book('sample', 300001, 'wrong-terms', 'hash', 4, 2, 'old') <> 'terms_changed' THEN RAISE EXCEPTION 'Old terms accepted'; END IF;
  IF policy_fixture.book('sample', 300001, 'sample-key', 'hash-a', 4, 2, 'v1') <> 'created' THEN RAISE EXCEPTION 'Booking not created'; END IF;
  UPDATE policy_fixture.events SET course_price = 2000 WHERE id = 'sample';
  IF NOT EXISTS (SELECT 1 FROM policy_fixture.price_snapshots WHERE request_key = 'sample-key' AND total = 4600 AND course_price = 1000) THEN RAISE EXCEPTION 'Price snapshot changed'; END IF;
END $$;
