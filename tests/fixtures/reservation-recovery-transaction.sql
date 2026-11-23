\set ON_ERROR_STOP on
DO $$ BEGIN
  IF current_database() <> 'riorio_reservation_fixture' OR current_user <> 'riorio_test' THEN
    RAISE EXCEPTION 'Fixture may only run in the dedicated local test database';
  END IF;
END $$;

CREATE TABLE policy_fixture.recovery_tokens (
  request_key text PRIMARY KEY REFERENCES allocation_fixture.bookings(request_key),
  token_digest text NOT NULL UNIQUE CHECK (token_digest ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz NOT NULL,
  revoked boolean NOT NULL DEFAULT false
);

CREATE FUNCTION policy_fixture.book_with_recovery(test_event text, test_slot integer, test_key text, test_fingerprint text, test_guests integer, test_pairing integer, test_terms text, test_digest text, test_expires timestamptz) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  result text;
BEGIN
  IF test_digest IS NULL OR test_digest !~ '^[a-f0-9]{64}$' OR test_expires IS NULL OR test_expires <= current_timestamp THEN RETURN 'invalid'; END IF;
  result := policy_fixture.book(test_event, test_slot, test_key, test_fingerprint, test_guests, test_pairing, test_terms);
  IF result = 'created' THEN
    INSERT INTO policy_fixture.recovery_tokens VALUES (test_key, test_digest, test_expires, false);
  ELSIF result = 'replay' AND NOT EXISTS (SELECT 1 FROM policy_fixture.recovery_tokens WHERE request_key = test_key AND token_digest = test_digest AND NOT revoked AND expires_at > current_timestamp) THEN
    RETURN 'unavailable';
  END IF;
  RETURN result;
END $$;

CREATE FUNCTION policy_fixture.recover(test_digest text) RETURNS text
LANGUAGE sql AS $$
  SELECT COALESCE((SELECT CASE WHEN booking.state = 'active' THEN 'received' WHEN booking.state = 'cancelled' THEN 'cancelled' ELSE 'unavailable' END
    FROM policy_fixture.recovery_tokens token JOIN allocation_fixture.bookings booking ON booking.request_key = token.request_key
    WHERE token.token_digest = test_digest AND token.revoked = false AND token.expires_at > current_timestamp), 'unavailable');
$$;

INSERT INTO allocation_fixture.slots VALUES (300002, 4);
INSERT INTO allocation_fixture.combinations VALUES (300002, 1, 4, ARRAY['A','B']);
INSERT INTO policy_fixture.events VALUES ('recovery-sample', true, current_timestamp - interval '1 hour', current_timestamp + interval '1 hour', 'v1', 1000, 300);
INSERT INTO policy_fixture.event_slots VALUES ('recovery-sample', 300002);

DO $$ BEGIN
  IF policy_fixture.book_with_recovery('recovery-sample', 300002, 'recovery-key', 'hash', 4, 0, 'v1', repeat('a', 64), current_timestamp + interval '1 hour') <> 'created' THEN RAISE EXCEPTION 'Booking failed'; END IF;
  UPDATE policy_fixture.events SET is_open = false WHERE id = 'recovery-sample';
  IF policy_fixture.recover(repeat('a', 64)) <> 'received' THEN RAISE EXCEPTION 'Recovery after close failed'; END IF;
  IF policy_fixture.recover(repeat('b', 64)) <> 'unavailable' THEN RAISE EXCEPTION 'Wrong token accepted'; END IF;
  IF (SELECT count(*) FROM allocation_fixture.bookings WHERE request_key = 'recovery-key') <> 1 THEN RAISE EXCEPTION 'Duplicate booking'; END IF;
  UPDATE policy_fixture.recovery_tokens SET revoked = true WHERE request_key = 'recovery-key';
  IF policy_fixture.recover(repeat('a', 64)) <> 'unavailable' THEN RAISE EXCEPTION 'Revoked token accepted'; END IF;
END $$;
