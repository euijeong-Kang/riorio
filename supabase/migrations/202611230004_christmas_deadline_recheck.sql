create or replace function public.christmas_reservation_create_2026(
  p_request_key uuid, p_date date, p_time time, p_guests smallint,
  p_pairing_guests smallint, p_name text, p_phone text
) returns text language plpgsql security invoker set search_path = '' as $$
declare
  existing public.christmas_reservations_2026%rowtype;
  selected_table smallint;
begin
  if p_request_key is null or p_date is null or p_date not in ('2026-12-24', '2026-12-25') or p_time is null or p_time not in ('11:30', '13:30', '17:30', '19:30')
    or p_guests is null or p_guests not between 2 and 4 or p_pairing_guests is null or p_pairing_guests not between 0 and p_guests
    or p_name is null or char_length(trim(p_name)) not between 1 and 80 or p_phone is null or p_phone !~ '^[0-9]{10,11}$' then
    return 'invalid';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_request_key::text, 0));
  select * into existing from public.christmas_reservations_2026 where request_key = p_request_key;
  if found then
    if existing.reservation_date = p_date and existing.reservation_time = p_time and existing.guests = p_guests
      and existing.pairing_guests = p_pairing_guests and existing.name = trim(p_name) and existing.phone = p_phone then
      return 'replay';
    end if;
    return 'conflict';
  end if;
  if not coalesce((select booking_enabled from public.christmas_reservation_settings_2026 where id = true), false) then return 'closed'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_date::text || ':' || p_time::text, 1));
  if not coalesce((select booking_enabled from public.christmas_reservation_settings_2026 where id = true), false) then return 'closed'; end if;
  if pg_catalog.clock_timestamp() >= ((p_date + p_time) at time zone 'Asia/Seoul') then return 'closed'; end if;
  select candidate.number into selected_table
  from (values (1, 2), (2, 2), (3, 3), (4, 4), (5, 4)) as candidate(number, capacity)
  where candidate.capacity >= p_guests and not exists (
    select 1 from public.christmas_reservations_2026 r
    where r.reservation_date = p_date and r.reservation_time = p_time and r.table_number = candidate.number and r.status <> 'cancelled'
  ) order by candidate.capacity, candidate.number limit 1;
  if selected_table is null then return 'sold_out'; end if;
  insert into public.christmas_reservations_2026 (request_key, reservation_date, reservation_time, table_number, guests, pairing_guests, name, phone, course_price, pairing_price, deposit_per_guest, transfer_deadline)
  values (p_request_key, p_date, p_time, selected_table, p_guests, p_pairing_guests, trim(p_name), p_phone, 120000, 40000, 30000, now() + interval '12 hours');
  return 'created';
end $$;

