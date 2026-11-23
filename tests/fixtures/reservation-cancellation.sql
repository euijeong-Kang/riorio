\set ON_ERROR_STOP on
DO $$ BEGIN
  IF current_database() <> 'riorio_reservation_fixture' OR current_user <> 'riorio_test' THEN
    RAISE EXCEPTION 'Fixture may only run in the dedicated local test database';
  END IF;
END $$;

ALTER TABLE allocation_fixture.bookings ADD COLUMN state text NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'cancelled'));

CREATE OR REPLACE FUNCTION allocation_fixture.book(test_slot integer, test_key text, test_fingerprint text, test_guests integer) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  slot_capacity integer;
  existing allocation_fixture.bookings%ROWTYPE;
  chosen text[];
  booking_id bigint;
BEGIN
  IF test_key IS NULL OR test_key = '' OR test_fingerprint IS NULL OR test_fingerprint = '' OR test_guests IS NULL OR test_guests NOT BETWEEN 2 AND 4 THEN RETURN 'invalid'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(test_key, 0));
  SELECT * INTO existing FROM allocation_fixture.bookings WHERE request_key = test_key;
  IF FOUND THEN
    IF existing.fingerprint = test_fingerprint THEN RETURN 'replay'; ELSE RETURN 'conflict'; END IF;
  END IF;
  SELECT capacity INTO slot_capacity FROM allocation_fixture.slots WHERE id = test_slot FOR UPDATE;
  IF NOT FOUND THEN RETURN 'invalid_slot'; END IF;
  IF COALESCE((SELECT sum(guests) FROM allocation_fixture.bookings WHERE slot_id = test_slot AND state = 'active'), 0) + test_guests > slot_capacity THEN RETURN 'sold_out'; END IF;
  SELECT combination.table_ids INTO chosen FROM allocation_fixture.combinations combination
    WHERE combination.slot_id = test_slot AND combination.guests = test_guests
      AND NOT EXISTS (SELECT 1 FROM allocation_fixture.occupied_tables occupied WHERE occupied.slot_id = test_slot AND occupied.table_id = ANY(combination.table_ids))
    ORDER BY combination.combination_id LIMIT 1;
  IF chosen IS NULL THEN RETURN 'sold_out'; END IF;
  INSERT INTO allocation_fixture.bookings (slot_id, request_key, fingerprint, guests) VALUES (test_slot, test_key, test_fingerprint, test_guests) RETURNING id INTO booking_id;
  INSERT INTO allocation_fixture.occupied_tables (slot_id, table_id, booking_id) SELECT test_slot, table_id, booking_id FROM unnest(chosen) AS table_id;
  RETURN 'created';
END $$;

CREATE FUNCTION allocation_fixture.cancel(test_slot integer, test_key text) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  target allocation_fixture.bookings%ROWTYPE;
BEGIN
  PERFORM 1 FROM allocation_fixture.slots WHERE id = test_slot FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  SELECT * INTO target FROM allocation_fixture.bookings WHERE slot_id = test_slot AND request_key = test_key FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF target.state = 'cancelled' THEN RETURN 'already_cancelled'; END IF;
  UPDATE allocation_fixture.bookings SET state = 'cancelled' WHERE id = target.id;
  DELETE FROM allocation_fixture.occupied_tables WHERE booking_id = target.id;
  RETURN 'cancelled';
END $$;
