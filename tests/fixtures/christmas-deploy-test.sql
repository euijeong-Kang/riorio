\set ON_ERROR_STOP on
BEGIN;
INSERT INTO auth.users VALUES ('00000000-0000-0000-0000-000000000001');
SET LOCAL ROLE service_role;
DO $$ BEGIN
  IF public.christmas_reservation_create_2026('00000000-0000-0000-0000-000000000002', '2026-12-24', '11:30', 2::smallint, 0::smallint, '가상 고객', '01000000000') <> 'closed' THEN RAISE EXCEPTION 'expected closed'; END IF;
END $$;
RESET ROLE;
UPDATE public.christmas_reservation_settings_2026 SET booking_enabled = true;
SET LOCAL ROLE service_role;
DO $$ BEGIN
  IF public.christmas_reservation_create_2026('00000000-0000-0000-0000-000000000002', '2026-12-24', '11:30', 2::smallint, 0::smallint, '가상 고객', '01000000000') <> 'created' THEN RAISE EXCEPTION 'expected created'; END IF;
  IF public.christmas_reservation_create_2026('00000000-0000-0000-0000-000000000002', '2026-12-24', '11:30', 2::smallint, 0::smallint, '가상 고객', '01000000000') <> 'replay' THEN RAISE EXCEPTION 'expected replay'; END IF;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE reservation_id uuid; BEGIN
  SELECT id INTO reservation_id FROM public.christmas_reservations_2026 WHERE request_key = '00000000-0000-0000-0000-000000000002';
  IF public.christmas_reservation_admin_action_2026(reservation_id, 'confirmed', true) <> 'confirmed' THEN RAISE EXCEPTION 'expected confirmed'; END IF;
END $$;
ROLLBACK;
