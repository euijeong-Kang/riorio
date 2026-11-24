\set ON_ERROR_STOP on
begin;
update public.christmas_reservation_settings_2026 set booking_enabled = true where id = true;
set local role service_role;
do $$ declare availability jsonb; begin
  availability := public.christmas_reservation_availability_2026('2026-12-24', 2::smallint);
  if not (availability ? '11:00' and availability ? '13:00' and availability ? '17:00' and availability ? '19:00') or availability ? '17:30' or availability ? '19:30' then raise exception 'incorrect seating times'; end if;
  if public.christmas_reservation_create_2026('00000000-0000-4000-8000-000000000021','2026-12-24','17:00',2::smallint,0::smallint,'Fixture','01000000000') <> 'created' then raise exception 'new dinner time rejected'; end if;
  if public.christmas_reservation_create_2026('00000000-0000-4000-8000-000000000022','2026-12-24','19:00',2::smallint,0::smallint,'Fixture','01000000000') <> 'created' then raise exception 'new second dinner time rejected'; end if;
  if public.christmas_reservation_create_2026('00000000-0000-4000-8000-000000000023','2026-12-24','17:30',2::smallint,0::smallint,'Fixture','01000000000') <> 'invalid' then raise exception 'old dinner time accepted'; end if;
end $$;
rollback;
