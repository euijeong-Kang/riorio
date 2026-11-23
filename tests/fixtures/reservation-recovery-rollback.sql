\set ON_ERROR_STOP on
DO $$ BEGIN
  IF current_database() <> 'riorio_reservation_fixture' OR current_user <> 'riorio_test' THEN
    RAISE EXCEPTION 'Fixture may only run in the dedicated local test database';
  END IF;
END $$;
INSERT INTO allocation_fixture.slots VALUES (300003, 4);
INSERT INTO allocation_fixture.combinations VALUES (300003, 1, 4, ARRAY['A','B']);
INSERT INTO policy_fixture.events VALUES ('recovery-rollback', true, current_timestamp - interval '1 hour', current_timestamp + interval '1 hour', 'v1', 1000, 300);
INSERT INTO policy_fixture.event_slots VALUES ('recovery-rollback', 300003);
DO $$ BEGIN
  BEGIN
    PERFORM policy_fixture.book_with_recovery('recovery-rollback', 300003, 'rollback-recovery-key', 'hash', 4, 0, 'v1', repeat('a', 64), current_timestamp + interval '1 hour');
    RAISE EXCEPTION 'Expected duplicate digest error';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;
  IF EXISTS (SELECT 1 FROM allocation_fixture.bookings WHERE request_key = 'rollback-recovery-key') OR EXISTS (SELECT 1 FROM allocation_fixture.occupied_tables WHERE slot_id = 300003) THEN
    RAISE EXCEPTION 'Booking or table remained after token insert failed';
  END IF;
END $$;
