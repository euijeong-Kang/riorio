\set ON_ERROR_STOP on
DO $$ BEGIN
  IF current_database() <> 'riorio_reservation_fixture' OR current_user <> 'riorio_test' THEN
    RAISE EXCEPTION 'Fixture may only run in the dedicated local test database';
  END IF;
END $$;

INSERT INTO allocation_fixture.slots VALUES (5, 4), (6, 4);
INSERT INTO allocation_fixture.combinations VALUES (5, 1, 4, ARRAY['A','B']), (6, 1, 4, ARRAY['A','B']);

BEGIN;
DO $$ BEGIN
  IF allocation_fixture.book(5, 'rollback-test', 'rollback-hash', 4) <> 'created' THEN
    RAISE EXCEPTION 'Rollback setup failed';
  END IF;
END $$;
ROLLBACK;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM allocation_fixture.bookings WHERE request_key = 'rollback-test') OR
     EXISTS (SELECT 1 FROM allocation_fixture.occupied_tables WHERE slot_id = 5) THEN
    RAISE EXCEPTION 'Rolled-back booking or occupancy remains';
  END IF;
  IF allocation_fixture.book(6, 'cancel-first', 'cancel-first-hash', 4) <> 'created' THEN
    RAISE EXCEPTION 'Cancel-first setup failed';
  END IF;
  IF allocation_fixture.cancel(6, 'cancel-first') <> 'cancelled' THEN
    RAISE EXCEPTION 'Cancellation failed';
  END IF;
  IF allocation_fixture.move('cancel-first', 6, 5) <> 'not_found' THEN
    RAISE EXCEPTION 'Cancelled booking was moved';
  END IF;
  IF EXISTS (SELECT 1 FROM allocation_fixture.occupied_tables WHERE slot_id IN (5, 6)) THEN
    RAISE EXCEPTION 'Cancelled or rolled-back booking still occupies tables';
  END IF;
END $$;
