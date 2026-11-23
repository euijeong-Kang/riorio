create table public.christmas_reservations_2026 (
  id uuid primary key default gen_random_uuid(),
  request_key uuid not null unique,
  reservation_date date not null check (reservation_date in ('2026-12-24', '2026-12-25')),
  reservation_time time not null check (reservation_time in ('11:30', '13:30', '17:30', '19:30')),
  table_number smallint not null check (table_number between 1 and 5),
  guests smallint not null check (guests between 2 and 4),
  pairing_guests smallint not null check (pairing_guests between 0 and guests),
  name text not null check (char_length(trim(name)) between 1 and 80),
  phone text not null check (phone ~ '^[0-9]{10,11}$'),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  course_price integer not null check (course_price >= 0),
  pairing_price integer not null check (pairing_price >= 0),
  deposit_per_guest integer not null check (deposit_per_guest >= 0),
  created_at timestamptz not null default now(),
  transfer_deadline timestamptz not null,
  check ((table_number in (1, 2) and guests <= 2) or (table_number = 3 and guests <= 3) or table_number in (4, 5))
);

create unique index christmas_reservations_2026_active_table
  on public.christmas_reservations_2026 (reservation_date, reservation_time, table_number)
  where status <> 'cancelled';

create table public.christmas_reservation_audit_2026 (
  id bigint generated always as identity primary key,
  reservation_id uuid not null references public.christmas_reservations_2026(id),
  actor_id uuid not null references auth.users(id),
  action text not null check (action in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table public.christmas_reservation_settings_2026 (
  id boolean primary key default true check (id),
  booking_enabled boolean not null default false
);
insert into public.christmas_reservation_settings_2026 (id) values (true);

alter table public.christmas_reservations_2026 enable row level security;
alter table public.christmas_reservation_audit_2026 enable row level security;
alter table public.christmas_reservation_settings_2026 enable row level security;
revoke all on public.christmas_reservations_2026 from public, anon, authenticated;
revoke all on public.christmas_reservation_audit_2026 from public, anon, authenticated;
revoke all on public.christmas_reservation_settings_2026 from public, anon, authenticated;
grant select, insert, update on public.christmas_reservations_2026 to service_role;
grant select on public.christmas_reservation_settings_2026 to service_role;
grant select on public.christmas_reservations_2026 to authenticated;
create policy christmas_reservations_admin_read on public.christmas_reservations_2026
  for select to authenticated using (public.is_schedule_admin(auth.uid()));

create function public.christmas_reservation_admin_action_2026(p_reservation_id uuid, p_action text, p_transfer_checked boolean default false)
returns text language plpgsql security definer set search_path = '' as $$
declare
  current_status text;
begin
  if auth.uid() is null or not public.is_schedule_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_action is null or p_action not in ('confirmed', 'cancelled') or (p_action = 'confirmed' and p_transfer_checked is distinct from true) then
    raise exception 'invalid request' using errcode = '22023';
  end if;
  select status into current_status from public.christmas_reservations_2026 where id = p_reservation_id for update;
  if not found then return 'not_found'; end if;
  if current_status = p_action then return 'already_' || p_action; end if;
  if current_status = 'cancelled' then return 'not_eligible'; end if;
  update public.christmas_reservations_2026 set status = p_action where id = p_reservation_id;
  insert into public.christmas_reservation_audit_2026 (reservation_id, actor_id, action) values (p_reservation_id, auth.uid(), p_action);
  return p_action;
end $$;

revoke all on function public.christmas_reservation_admin_action_2026(uuid, text, boolean) from public, anon;
grant execute on function public.christmas_reservation_admin_action_2026(uuid, text, boolean) to authenticated;

create function public.christmas_reservation_create_2026(
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
  if now() >= ((p_date + p_time) at time zone 'Asia/Seoul') then return 'closed'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_date::text || ':' || p_time::text, 1));
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

revoke all on function public.christmas_reservation_create_2026(uuid, date, time, smallint, smallint, text, text) from public, anon, authenticated;
grant execute on function public.christmas_reservation_create_2026(uuid, date, time, smallint, smallint, text, text) to service_role;
