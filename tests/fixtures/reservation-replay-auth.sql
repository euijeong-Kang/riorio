\set ON_ERROR_STOP on
DO $$ BEGIN
  IF current_database() <> 'riorio_reservation_fixture' OR current_user <> 'riorio_test' THEN
    RAISE EXCEPTION 'Fixture may only run in the dedicated local test database';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION policy_fixture.book_with_recovery(test_event text, test_slot integer, test_key text, test_fingerprint text, test_guests integer, test_pairing integer, test_terms text, test_digest text, test_expires timestamptz) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  existing allocation_fixture.bookings%ROWTYPE;
  result text;
BEGIN
  IF test_key IS NULL OR test_key = '' OR test_fingerprint IS NULL OR test_fingerprint = '' OR test_digest IS NULL OR test_digest !~ '^[a-f0-9]{64}$' THEN RETURN 'unavailable'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(test_key, 0));
  SELECT * INTO existing FROM allocation_fixture.bookings WHERE request_key = test_key;
  IF FOUND THEN
    IF NOT EXISTS (SELECT 1 FROM policy_fixture.recovery_tokens token JOIN policy_fixture.event_slots slot ON slot.slot_id = existing.slot_id WHERE token.request_key = test_key AND token.token_digest = test_digest AND NOT token.revoked AND token.expires_at > current_timestamp AND slot.event_id = test_event AND existing.slot_id = test_slot) THEN RETURN 'unavailable'; END IF;
    IF existing.fingerprint IS DISTINCT FROM test_fingerprint THEN RETURN 'conflict'; END IF;
    RETURN 'replay';
  END IF;
  IF test_expires IS NULL OR test_expires <= current_timestamp THEN RETURN 'invalid'; END IF;
  result := policy_fixture.book(test_event, test_slot, test_key, test_fingerprint, test_guests, test_pairing, test_terms);
  IF result = 'created' THEN
    INSERT INTO policy_fixture.recovery_tokens VALUES (test_key, test_digest, test_expires, false);
  END IF;
  RETURN result;
END $$;

INSERT INTO allocation_fixture.slots VALUES (300007, 4);
INSERT INTO allocation_fixture.combinations VALUES (300007, 1, 4, ARRAY['A','B']);
INSERT INTO policy_fixture.events VALUES ('replay-sample', true, current_timestamp - interval '1 hour', current_timestamp + interval '1 hour', 'v1', 1000, 300);
INSERT INTO policy_fixture.event_slots VALUES ('replay-sample', 300007);

DO $$ BEGIN
  IF policy_fixture.book_with_recovery('replay-sample', 300007, 'replay-key', 'hash-a', 4, 0, 'v1', repeat('1', 64), current_timestamp + interval '1 hour') <> 'created' THEN RAISE EXCEPTION 'Fixture booking failed'; END IF;
  UPDATE policy_fixture.events SET is_open = false WHERE id = 'replay-sample';
  IF policy_fixture.book_with_recovery('replay-sample', 300007, 'replay-key', 'hash-a', 4, 0, 'v1', repeat('2', 64), current_timestamp + interval '1 hour') <> 'unavailable' THEN RAISE EXCEPTION 'Wrong token accepted'; END IF;
  IF policy_fixture.book_with_recovery('replay-sample', 300007, 'replay-key', 'hash-b', 4, 0, 'v1', repeat('2', 64), current_timestamp + interval '1 hour') <> 'unavailable' THEN RAISE EXCEPTION 'Conflict exposed to wrong token'; END IF;
  IF policy_fixture.book_with_recovery('replay-sample', 300007, 'replay-key', 'hash-a', 4, 0, 'v1', repeat('1', 64), current_timestamp + interval '1 hour') <> 'replay' THEN RAISE EXCEPTION 'Authorized retry after close failed'; END IF;
  IF policy_fixture.book_with_recovery('replay-sample', 300007, 'replay-key', 'hash-b', 4, 0, 'v1', repeat('1', 64), current_timestamp + interval '1 hour') <> 'conflict' THEN RAISE EXCEPTION 'Authorized conflict not detected'; END IF;
  IF (SELECT count(*) FROM allocation_fixture.bookings WHERE request_key = 'replay-key') <> 1 THEN RAISE EXCEPTION 'Duplicate booking'; END IF;
  UPDATE policy_fixture.recovery_tokens SET revoked = true WHERE request_key = 'replay-key';
  IF policy_fixture.book_with_recovery('replay-sample', 300007, 'replay-key', 'hash-a', 4, 0, 'v1', repeat('1', 64), current_timestamp + interval '1 hour') <> 'unavailable' THEN RAISE EXCEPTION 'Revoked token accepted'; END IF;
END $$;
