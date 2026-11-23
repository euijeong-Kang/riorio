\set ON_ERROR_STOP on
DO $$ BEGIN
  IF current_database() <> 'riorio_reservation_fixture' OR current_user <> 'riorio_test' THEN
    RAISE EXCEPTION 'Fixture may only run in the dedicated local test database';
  END IF;
END $$;

INSERT INTO allocation_fixture.slots VALUES (3, 4);
INSERT INTO allocation_fixture.combinations VALUES (3, 1, 4, ARRAY['A','B']);

CREATE FUNCTION allocation_fixture.move(test_key text, source_slot integer, destination_slot integer) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  target allocation_fixture.bookings%ROWTYPE;
  destination_capacity integer;
  chosen text[];
BEGIN
  IF source_slot = destination_slot THEN RETURN 'invalid'; END IF;
  PERFORM 1 FROM allocation_fixture.slots WHERE id IN (source_slot, destination_slot) ORDER BY id FOR UPDATE;
  SELECT capacity INTO destination_capacity FROM allocation_fixture.slots WHERE id = destination_slot;
  IF NOT FOUND THEN RETURN 'invalid_slot'; END IF;
  SELECT * INTO target FROM allocation_fixture.bookings WHERE request_key = test_key AND slot_id = source_slot FOR UPDATE;
  IF NOT FOUND OR target.state <> 'active' THEN RETURN 'not_found'; END IF;
  IF COALESCE((SELECT sum(guests) FROM allocation_fixture.bookings WHERE slot_id = destination_slot AND state = 'active'), 0) + target.guests > destination_capacity THEN RETURN 'sold_out'; END IF;
  SELECT combination.table_ids INTO chosen FROM allocation_fixture.combinations combination
    WHERE combination.slot_id = destination_slot AND combination.guests = target.guests
      AND NOT EXISTS (SELECT 1 FROM allocation_fixture.occupied_tables occupied WHERE occupied.slot_id = destination_slot AND occupied.table_id = ANY(combination.table_ids))
    ORDER BY combination.combination_id LIMIT 1;
  IF chosen IS NULL THEN RETURN 'sold_out'; END IF;
  DELETE FROM allocation_fixture.occupied_tables WHERE booking_id = target.id;
  UPDATE allocation_fixture.bookings SET slot_id = destination_slot WHERE id = target.id;
  INSERT INTO allocation_fixture.occupied_tables (slot_id, table_id, booking_id) SELECT destination_slot, table_id, target.id FROM unnest(chosen) AS table_id;
  RETURN 'moved';
END $$;
