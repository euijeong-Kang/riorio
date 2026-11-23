create function public.christmas_reservation_availability_2026(p_date date, p_guests smallint)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  availability jsonb;
begin
  if p_date is null or p_date not in ('2026-12-24', '2026-12-25') or p_guests is null or p_guests not between 2 and 4 then
    return null;
  end if;
  if not coalesce((select booking_enabled from public.christmas_reservation_settings_2026 where id = true), false) then return null; end if;
  select pg_catalog.jsonb_object_agg(pg_catalog.to_char(seating.start_time, 'HH24:MI'),
    case when now() >= ((p_date + seating.start_time) at time zone 'Asia/Seoul') then null else (
      select count(*) from (values (1, 2), (2, 2), (3, 3), (4, 4), (5, 4)) as candidate(number, capacity)
      where candidate.capacity >= p_guests and not exists (
        select 1 from public.christmas_reservations_2026 reservation
        where reservation.reservation_date = p_date and reservation.reservation_time = seating.start_time
          and reservation.table_number = candidate.number and reservation.status <> 'cancelled'
      )
    ) end)
  into availability
  from (values ('11:30'::time), ('13:30'::time), ('17:30'::time), ('19:30'::time)) as seating(start_time);
  return availability;
end $$;

revoke all on function public.christmas_reservation_availability_2026(date, smallint) from public, anon, authenticated;
grant execute on function public.christmas_reservation_availability_2026(date, smallint) to service_role;
