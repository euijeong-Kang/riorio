\set ON_ERROR_STOP on
DO $$
DECLARE
  fixture_number integer;
BEGIN
  IF current_database() <> 'riorio_reservation_fixture' OR current_user <> 'riorio_test' THEN
    RAISE EXCEPTION 'Fixture may only run in the dedicated local test database';
  END IF;
  FOR fixture_number IN 1..10 LOOP
    INSERT INTO allocation_fixture.slots VALUES (100 + fixture_number, 4), (200 + fixture_number, 4);
    INSERT INTO allocation_fixture.combinations VALUES (100 + fixture_number, 1, 4, ARRAY['A','B']), (200 + fixture_number, 1, 4, ARRAY['A','B']);
    IF allocation_fixture.book(100 + fixture_number, 'batch-' || fixture_number, 'fixture-hash-' || fixture_number, 4) <> 'created' THEN
      RAISE EXCEPTION 'Could not set up batch fixture %', fixture_number;
    END IF;
  END LOOP;
END $$;
