\set ON_ERROR_STOP on
DO $$ BEGIN
  IF current_database() <> 'riorio_reservation_fixture' OR current_user <> 'riorio_test' THEN
    RAISE EXCEPTION 'Fixture may only run in the dedicated local test database';
  END IF;
END $$;

CREATE SCHEMA allocation_fixture;
CREATE TABLE allocation_fixture.slots (id integer PRIMARY KEY, capacity integer NOT NULL CHECK (capacity > 0));
CREATE TABLE allocation_fixture.combinations (slot_id integer NOT NULL REFERENCES allocation_fixture.slots(id), combination_id integer NOT NULL, guests integer NOT NULL CHECK (guests BETWEEN 2 AND 4), table_ids text[] NOT NULL CHECK (cardinality(table_ids) > 0), PRIMARY KEY (slot_id, combination_id));
CREATE TABLE allocation_fixture.bookings (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, slot_id integer NOT NULL REFERENCES allocation_fixture.slots(id), request_key text NOT NULL UNIQUE, fingerprint text NOT NULL, guests integer NOT NULL CHECK (guests BETWEEN 2 AND 4));
CREATE TABLE allocation_fixture.occupied_tables (slot_id integer NOT NULL, table_id text NOT NULL, booking_id bigint NOT NULL REFERENCES allocation_fixture.bookings(id), PRIMARY KEY (slot_id, table_id));

INSERT INTO allocation_fixture.slots VALUES (1, 6), (2, 4);
INSERT INTO allocation_fixture.combinations VALUES (1, 1, 2, ARRAY['B']), (1, 2, 4, ARRAY['A','B']), (1, 3, 4, ARRAY['B','C']), (2, 1, 4, ARRAY['A','B']);

CREATE FUNCTION allocation_fixture.book(test_slot integer, test_key text, test_fingerprint text, test_guests integer) RETURNS text
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
  IF COALESCE((SELECT sum(guests) FROM allocation_fixture.bookings WHERE slot_id = test_slot), 0) + test_guests > slot_capacity THEN RETURN 'sold_out'; END IF;
  SELECT combination.table_ids INTO chosen FROM allocation_fixture.combinations combination
    WHERE combination.slot_id = test_slot AND combination.guests = test_guests
      AND NOT EXISTS (SELECT 1 FROM allocation_fixture.occupied_tables occupied WHERE occupied.slot_id = test_slot AND occupied.table_id = ANY(combination.table_ids))
    ORDER BY combination.combination_id LIMIT 1;
  IF chosen IS NULL THEN RETURN 'sold_out'; END IF;
  INSERT INTO allocation_fixture.bookings (slot_id, request_key, fingerprint, guests) VALUES (test_slot, test_key, test_fingerprint, test_guests) RETURNING id INTO booking_id;
  INSERT INTO allocation_fixture.occupied_tables (slot_id, table_id, booking_id) SELECT test_slot, table_id, booking_id FROM unnest(chosen) AS table_id;
  RETURN 'created';
END $$;
