create table public.christmas_waitlist_2026 (
  id uuid primary key default gen_random_uuid(),
  request_key uuid not null unique,
  name text not null check (char_length(trim(name)) between 1 and 80),
  phone text not null check (phone ~ '^[0-9]{10,11}$'),
  reservation_date date not null check (reservation_date in ('2026-12-24', '2026-12-25')),
  reservation_time time not null check (reservation_time in ('11:30', '13:30', '17:30', '19:30')),
  guests smallint not null check (guests between 2 and 4),
  position integer not null check (position > 0),
  status text not null default 'waiting' check (status in ('waiting', 'contacted', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (reservation_date, reservation_time, position)
);
alter table public.christmas_waitlist_2026 enable row level security;
revoke all on public.christmas_waitlist_2026 from public, anon, authenticated;
grant select on public.christmas_waitlist_2026 to authenticated;
grant select, insert on public.christmas_waitlist_2026 to service_role;
create policy christmas_waitlist_admin_read on public.christmas_waitlist_2026 for select to authenticated using (public.is_schedule_admin(auth.uid()));

create function public.christmas_waitlist_create_2026(p_request_key uuid, p_date date, p_time time, p_guests smallint, p_name text, p_phone text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  existing public.christmas_waitlist_2026%rowtype;
  next_position integer;
begin
  if p_request_key is null or p_date is null or p_date not in ('2026-12-24', '2026-12-25') or p_time is null or p_time not in ('11:30', '13:30', '17:30', '19:30') or p_guests is null or p_guests not between 2 and 4 or p_name is null or char_length(trim(p_name)) not between 1 and 80 or p_phone is null or p_phone !~ '^[0-9]{10,11}$' then return pg_catalog.jsonb_build_object('status', 'invalid'); end if;
  if pg_catalog.clock_timestamp() < timestamptz '2026-11-24 00:00:00+09' or pg_catalog.clock_timestamp() >= ((p_date + p_time) at time zone 'Asia/Seoul') or not coalesce((select booking_enabled from public.christmas_reservation_settings_2026 where id = true), false) then return pg_catalog.jsonb_build_object('status', 'closed'); end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_request_key::text, 2));
  select * into existing from public.christmas_waitlist_2026 where request_key = p_request_key;
  if found then
    if existing.reservation_date = p_date and existing.reservation_time = p_time and existing.guests = p_guests and existing.name = trim(p_name) and existing.phone = p_phone then return pg_catalog.jsonb_build_object('status', 'received', 'position', existing.position); end if;
    return pg_catalog.jsonb_build_object('status', 'conflict');
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_date::text || ':' || p_time::text, 1));
  if not coalesce((select booking_enabled from public.christmas_reservation_settings_2026 where id = true), false) or pg_catalog.clock_timestamp() >= ((p_date + p_time) at time zone 'Asia/Seoul') then return pg_catalog.jsonb_build_object('status', 'closed'); end if;
  if exists (select 1 from public.christmas_waitlist_2026 where reservation_date = p_date and reservation_time = p_time and phone = p_phone and status <> 'cancelled') then return pg_catalog.jsonb_build_object('status', 'duplicate'); end if;
  if exists (select 1 from (values (1, 2), (2, 2), (3, 3), (4, 4), (5, 4)) as candidate(number, capacity) where candidate.capacity >= p_guests and not exists (select 1 from public.christmas_reservations_2026 r where r.reservation_date = p_date and r.reservation_time = p_time and r.table_number = candidate.number and r.status <> 'cancelled')) then return pg_catalog.jsonb_build_object('status', 'available'); end if;
  select coalesce(max(position), 0) + 1 into next_position from public.christmas_waitlist_2026 where reservation_date = p_date and reservation_time = p_time;
  insert into public.christmas_waitlist_2026(request_key, name, phone, reservation_date, reservation_time, guests, position) values (p_request_key, trim(p_name), p_phone, p_date, p_time, p_guests, next_position);
  return pg_catalog.jsonb_build_object('status', 'received', 'position', next_position);
end $$;
revoke all on function public.christmas_waitlist_create_2026(uuid, date, time, smallint, text, text) from public, anon, authenticated;
grant execute on function public.christmas_waitlist_create_2026(uuid, date, time, smallint, text, text) to service_role;
