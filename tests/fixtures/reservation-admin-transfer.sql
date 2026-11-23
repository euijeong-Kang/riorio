\set ON_ERROR_STOP on
DO $$ BEGIN
  IF current_database() <> 'riorio_reservation_fixture' OR current_user <> 'riorio_test' THEN
    RAISE EXCEPTION 'Fixture may only run in the dedicated local test database';
  END IF;
END $$;

CREATE SCHEMA transfer_fixture;
CREATE TABLE transfer_fixture.payments (request_key text PRIMARY KEY REFERENCES allocation_fixture.bookings(request_key), state text NOT NULL CHECK (state IN ('pending', 'confirmed')));
CREATE TABLE transfer_fixture.audit_log (event_id text NOT NULL, request_key text NOT NULL, actor_id text NOT NULL CHECK (actor_id <> 'fixture-audit-failure'), action text NOT NULL CHECK (action = 'confirmed'));

CREATE FUNCTION transfer_fixture.confirm_with_audit(test_event text, test_slot integer, test_key text, test_actor text) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  booking allocation_fixture.bookings%ROWTYPE;
  payment transfer_fixture.payments%ROWTYPE;
BEGIN
  PERFORM 1 FROM admin_fixture.grants WHERE event_id = test_event AND actor_id = test_actor AND active = true FOR SHARE;
  IF NOT FOUND THEN RETURN 'denied'; END IF;
  IF NOT EXISTS (SELECT 1 FROM policy_fixture.event_slots WHERE event_id = test_event AND slot_id = test_slot) THEN RETURN 'not_found'; END IF;
  PERFORM 1 FROM allocation_fixture.slots WHERE id = test_slot FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  SELECT * INTO booking FROM allocation_fixture.bookings WHERE slot_id = test_slot AND request_key = test_key FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF booking.state <> 'active' THEN RETURN 'not_eligible'; END IF;
  SELECT * INTO payment FROM transfer_fixture.payments WHERE request_key = test_key FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_eligible'; END IF;
  IF payment.state = 'confirmed' THEN RETURN 'already_confirmed'; END IF;
  UPDATE transfer_fixture.payments SET state = 'confirmed' WHERE request_key = test_key;
  INSERT INTO transfer_fixture.audit_log VALUES (test_event, test_key, test_actor, 'confirmed');
  RETURN 'confirmed';
END $$;
