\set ON_ERROR_STOP on
begin;
update public.christmas_reservation_settings_2026 set booking_enabled = true where id = true;
set local role service_role;
do $$ declare availability jsonb; begin
  availability := public.christmas_reservation_availability_2026('2026-12-24', 2::smallint);
  if not (availability ? '11:00' and availability ? '13:00' and availability ? '17:30' and availability ? '19:30') or availability ? '11:30' or availability ? '13:30' then raise exception 'incorrect seating times'; end if;
  if public.christmas_reservation_create_2026('00000000-0000-4000-8000-000000000011','2026-12-24','11:00',2::smallint,0::smallint,'Fixture','01000000000') <> 'created' then raise exception 'new lunch time rejected'; end if;
  if public.christmas_reservation_create_2026('00000000-0000-4000-8000-000000000012','2026-12-24','13:00',2::smallint,0::smallint,'Fixture','01000000000') <> 'created' then raise exception 'new second lunch time rejected'; end if;
  if public.christmas_reservation_create_2026('00000000-0000-4000-8000-000000000013','2026-12-24','11:30',2::smallint,0::smallint,'Fixture','01000000000') <> 'invalid' then raise exception 'old lunch time accepted'; end if;
end $$;
rollback;
