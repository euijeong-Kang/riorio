\set ON_ERROR_STOP on
DO $$ BEGIN
  IF current_database() <> 'riorio_reservation_fixture' OR current_user <> 'riorio_test' THEN
    RAISE EXCEPTION 'Fixture may only run in the dedicated local test database';
  END IF;
END $$;

BEGIN;
CREATE TABLE policy_fixture.test_terms_approvals (
  event_id text PRIMARY KEY REFERENCES policy_fixture.events(id),
  approved boolean NOT NULL,
  version text NOT NULL
);
CREATE TABLE policy_fixture.test_consent_snapshots (
  request_key text PRIMARY KEY REFERENCES allocation_fixture.bookings(request_key) CHECK (request_key <> 'consent-failure'),
  version text NOT NULL,
  accepted boolean NOT NULL CHECK (accepted)
);

CREATE FUNCTION policy_fixture.test_book_with_consent(test_event text, test_slot integer, test_key text, test_digest text, expected_terms text, accepted boolean, test_fingerprint text) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  event_record policy_fixture.events%ROWTYPE;
  terms_record policy_fixture.test_terms_approvals%ROWTYPE;
  result text;
BEGIN
  SELECT * INTO event_record FROM policy_fixture.events WHERE id = test_event FOR SHARE;
  IF NOT FOUND THEN RETURN 'closed'; END IF;
  SELECT * INTO terms_record FROM policy_fixture.test_terms_approvals WHERE event_id = test_event FOR SHARE;
  IF NOT FOUND OR NOT terms_record.approved THEN RETURN 'closed'; END IF;
  IF terms_record.version IS DISTINCT FROM event_record.terms_version OR terms_record.version IS DISTINCT FROM expected_terms THEN RETURN 'terms_changed'; END IF;
  IF accepted IS DISTINCT FROM true THEN RETURN 'terms_not_accepted'; END IF;
  result := policy_fixture.book_with_expected_price(test_event, test_slot, test_key, test_fingerprint, 4, 0, expected_terms, test_digest, clock_timestamp() + interval '1 hour', 1000, 300);
  IF result = 'created' THEN
    INSERT INTO policy_fixture.test_consent_snapshots VALUES (test_key, terms_record.version, true);
  END IF;
  RETURN result;
END $$;

INSERT INTO allocation_fixture.slots VALUES (399993, 4);
INSERT INTO allocation_fixture.combinations VALUES (399993, 1, 4, ARRAY['A','B']);
INSERT INTO policy_fixture.events VALUES ('consent-fixture', true, current_timestamp - interval '1 hour', current_timestamp + interval '1 hour', 'v1', 1000, 300);
INSERT INTO policy_fixture.event_slots VALUES ('consent-fixture', 399993);

DO $$ DECLARE test_digest text := md5(random()::text) || md5(random()::text); BEGIN
  IF policy_fixture.test_book_with_consent('consent-fixture', 399993, 'consent-success', test_digest, 'v1', true, 'fixture-hash') <> 'closed' THEN RAISE EXCEPTION 'Missing approval accepted'; END IF;
  INSERT INTO policy_fixture.test_terms_approvals VALUES ('consent-fixture', false, 'v1');
  IF policy_fixture.test_book_with_consent('consent-fixture', 399993, 'consent-success', test_digest, 'v1', true, 'fixture-hash') <> 'closed' THEN RAISE EXCEPTION 'Unapproved terms accepted'; END IF;
  UPDATE policy_fixture.test_terms_approvals SET approved = true WHERE event_id = 'consent-fixture';
  IF policy_fixture.test_book_with_consent('consent-fixture', 399993, 'consent-success', test_digest, 'old', true, 'fixture-hash') <> 'terms_changed' THEN RAISE EXCEPTION 'Old terms accepted'; END IF;
  IF policy_fixture.test_book_with_consent('consent-fixture', 399993, 'consent-success', test_digest, 'v1', false, 'fixture-hash') <> 'terms_not_accepted' THEN RAISE EXCEPTION 'Missing consent accepted'; END IF;
  BEGIN
    PERFORM policy_fixture.test_book_with_consent('consent-fixture', 399993, 'consent-failure', test_digest, 'v1', true, 'fixture-hash');
    RAISE EXCEPTION 'Expected consent snapshot failure';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  IF EXISTS (SELECT 1 FROM allocation_fixture.bookings WHERE request_key = 'consent-failure') OR EXISTS (SELECT 1 FROM allocation_fixture.occupied_tables WHERE slot_id = 399993) OR EXISTS (SELECT 1 FROM policy_fixture.recovery_tokens WHERE request_key = 'consent-failure') OR EXISTS (SELECT 1 FROM policy_fixture.price_snapshots WHERE request_key = 'consent-failure') THEN RAISE EXCEPTION 'Consent failure left partial data'; END IF;
  IF policy_fixture.test_book_with_consent('consent-fixture', 399993, 'consent-success', test_digest, 'v1', true, 'fixture-hash') <> 'created' THEN RAISE EXCEPTION 'Approved consent rejected'; END IF;
  UPDATE policy_fixture.test_terms_approvals SET approved = false, version = 'v2' WHERE event_id = 'consent-fixture';
  IF NOT EXISTS (SELECT 1 FROM policy_fixture.test_consent_snapshots WHERE request_key = 'consent-success' AND version = 'v1' AND accepted) THEN RAISE EXCEPTION 'Consent snapshot changed'; END IF;
END $$;
ROLLBACK;
