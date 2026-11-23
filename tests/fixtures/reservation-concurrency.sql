\set ON_ERROR_STOP on
DO $$ BEGIN
  IF current_database() <> 'riorio_reservation_fixture' OR current_user <> 'riorio_test' THEN
    RAISE EXCEPTION 'Fixture may only run in the dedicated local test database';
  END IF;
END $$;

CREATE SCHEMA reservation_fixture;
CREATE TABLE reservation_fixture.slots (id integer PRIMARY KEY, capacity integer NOT NULL CHECK (capacity > 0));
CREATE TABLE reservation_fixture.bookings (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, slot_id integer NOT NULL REFERENCES reservation_fixture.slots(id), request_key text NOT NULL UNIQUE);
INSERT INTO reservation_fixture.slots (id, capacity) VALUES (1, 1);

CREATE FUNCTION reservation_fixture.book(test_request_key text) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  slot_capacity integer;
  existing_key text;
BEGIN
  SELECT capacity INTO slot_capacity FROM reservation_fixture.slots WHERE id = 1 FOR UPDATE;
  SELECT request_key INTO existing_key FROM reservation_fixture.bookings WHERE request_key = test_request_key;
  IF existing_key IS NOT NULL THEN RETURN 'replay'; END IF;
  IF (SELECT count(*) FROM reservation_fixture.bookings WHERE slot_id = 1) >= slot_capacity THEN RETURN 'sold_out'; END IF;
  INSERT INTO reservation_fixture.bookings (slot_id, request_key) VALUES (1, test_request_key);
  RETURN 'created';
END $$;
