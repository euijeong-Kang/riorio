\set ON_ERROR_STOP on
DO $$ BEGIN
  IF current_database() <> 'riorio_reservation_fixture' OR current_user <> 'riorio_test' THEN
    RAISE EXCEPTION 'Fixture may only run in the dedicated local test database';
  END IF;
END $$;

INSERT INTO allocation_fixture.slots VALUES (4, 4);
INSERT INTO allocation_fixture.combinations VALUES (4, 1, 4, ARRAY['A','B']);
DO $$ BEGIN
  IF allocation_fixture.book(4, 'race-move-cancel', 'race-fingerprint', 4) <> 'created' THEN
    RAISE EXCEPTION 'Could not set up move-cancel test';
  END IF;
END $$;
