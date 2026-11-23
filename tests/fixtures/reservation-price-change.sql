\set ON_ERROR_STOP on
DO $$ BEGIN
  IF current_database() <> 'riorio_reservation_fixture' OR current_user <> 'riorio_test' THEN
    RAISE EXCEPTION 'Fixture may only run in the dedicated local test database';
  END IF;
END $$;
CREATE FUNCTION policy_fixture.book_with_expected_price(test_event text, test_slot integer, test_key text, test_fingerprint text, test_guests integer, test_pairing integer, test_terms text, test_digest text, test_expires timestamptz, expected_course integer, expected_pairing integer) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  event_record policy_fixture.events%ROWTYPE;
BEGIN
  SELECT * INTO event_record FROM policy_fixture.events WHERE id = test_event FOR SHARE;
  IF NOT FOUND OR NOT event_record.is_open OR current_timestamp < event_record.opens_at OR current_timestamp >= event_record.closes_at THEN RETURN 'closed'; END IF;
  IF event_record.course_price IS DISTINCT FROM expected_course OR event_record.pairing_price IS DISTINCT FROM expected_pairing THEN RETURN 'price_changed'; END IF;
  RETURN policy_fixture.book_with_recovery(test_event, test_slot, test_key, test_fingerprint, test_guests, test_pairing, test_terms, test_digest, test_expires);
END $$;
