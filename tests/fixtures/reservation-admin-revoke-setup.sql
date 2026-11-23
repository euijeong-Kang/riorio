\set ON_ERROR_STOP on
DO $$ BEGIN
  IF current_database() <> 'riorio_reservation_fixture' OR current_user <> 'riorio_test' THEN
    RAISE EXCEPTION 'Fixture may only run in the dedicated local test database';
  END IF;
END $$;
INSERT INTO allocation_fixture.slots VALUES (300005, 4);
INSERT INTO allocation_fixture.combinations VALUES (300005, 1, 4, ARRAY['A','B']);
INSERT INTO policy_fixture.events VALUES ('revoke-sample', true, current_timestamp - interval '1 hour', current_timestamp + interval '1 hour', 'v1', 1000, 300);
INSERT INTO policy_fixture.event_slots VALUES ('revoke-sample', 300005);
INSERT INTO admin_fixture.grants VALUES ('revoke-sample', 'fixture-admin', true);
DO $$ BEGIN
  IF policy_fixture.book_with_recovery('revoke-sample', 300005, 'revoke-booking', 'hash', 4, 0, 'v1', repeat('e', 64), current_timestamp + interval '1 hour') <> 'created' THEN
    RAISE EXCEPTION 'Fixture booking failed';
  END IF;
END $$;
