create table public.christmas_lookup_limits_2026 (
  scope text not null,
  identifier text not null,
  started_at timestamptz not null,
  attempts integer not null,
  primary key (scope, identifier)
);
alter table public.christmas_lookup_limits_2026 enable row level security;
revoke all on public.christmas_lookup_limits_2026 from public, anon, authenticated;
grant select, insert, update, delete on public.christmas_lookup_limits_2026 to service_role;

create function public.christmas_reservation_lookup_2026(p_name text, p_phone text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  global_attempts integer;
  phone_attempts integer;
  results jsonb;
begin
  if p_name is null or char_length(trim(p_name)) not between 1 and 80 or p_phone is null or p_phone !~ '^[0-9]{10,11}$' then
    return pg_catalog.jsonb_build_object('status', 'invalid');
  end if;
  insert into public.christmas_lookup_limits_2026(scope, identifier, started_at, attempts)
    values ('global', 'lookup', pg_catalog.clock_timestamp(), 1)
    on conflict (scope, identifier) do update set
      attempts = case when public.christmas_lookup_limits_2026.started_at <= pg_catalog.clock_timestamp() - interval '1 minute' then 1 else public.christmas_lookup_limits_2026.attempts + 1 end,
      started_at = case when public.christmas_lookup_limits_2026.started_at <= pg_catalog.clock_timestamp() - interval '1 minute' then pg_catalog.clock_timestamp() else public.christmas_lookup_limits_2026.started_at end
    returning attempts into global_attempts;
  if global_attempts > 30 then return pg_catalog.jsonb_build_object('status', 'limited'); end if;
  insert into public.christmas_lookup_limits_2026(scope, identifier, started_at, attempts)
    values ('phone', pg_catalog.md5(p_phone), pg_catalog.clock_timestamp(), 1)
    on conflict (scope, identifier) do update set
      attempts = case when public.christmas_lookup_limits_2026.started_at <= pg_catalog.clock_timestamp() - interval '15 minutes' then 1 else public.christmas_lookup_limits_2026.attempts + 1 end,
      started_at = case when public.christmas_lookup_limits_2026.started_at <= pg_catalog.clock_timestamp() - interval '15 minutes' then pg_catalog.clock_timestamp() else public.christmas_lookup_limits_2026.started_at end
    returning attempts into phone_attempts;
  if phone_attempts > 5 then return pg_catalog.jsonb_build_object('status', 'limited'); end if;
  select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('date', row_data.reservation_date, 'time', row_data.reservation_time, 'guests', row_data.guests, 'pairingGuests', row_data.pairing_guests, 'status', row_data.status, 'coursePrice', row_data.course_price, 'pairingPrice', row_data.pairing_price, 'depositPerGuest', row_data.deposit_per_guest, 'transferDeadline', row_data.transfer_deadline) order by row_data.reservation_date, row_data.reservation_time), '[]'::jsonb)
    into results from (select reservation_date, reservation_time, guests, pairing_guests, status, course_price, pairing_price, deposit_per_guest, transfer_deadline from public.christmas_reservations_2026 where name = trim(p_name) and phone = p_phone order by reservation_date, reservation_time limit 10) row_data;
  return pg_catalog.jsonb_build_object('status', 'ok', 'reservations', results);
end $$;
revoke all on function public.christmas_reservation_lookup_2026(text, text) from public, anon, authenticated;
grant execute on function public.christmas_reservation_lookup_2026(text, text) to service_role;
