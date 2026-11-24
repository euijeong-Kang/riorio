begin;
lock table public.christmas_reservations_2026, public.christmas_waitlist_2026 in share row exclusive mode;
do $$
declare
  function_oid regprocedure;
  definition text;
  updated_definition text;
begin
  if exists (select 1 from public.christmas_reservations_2026 where reservation_time in ('17:30', '19:30') and status <> 'cancelled') or exists (select 1 from public.christmas_waitlist_2026 where reservation_time in ('17:30', '19:30') and status <> 'cancelled') then
    raise exception 'Active reservations or waitlist entries exist for the old dinner times';
  end if;
  alter table public.christmas_reservations_2026 drop constraint christmas_reservations_2026_reservation_time_check;
  alter table public.christmas_reservations_2026 add constraint christmas_reservations_2026_reservation_time_check check (reservation_time in ('11:00', '13:00', '11:30', '13:30', '17:00', '19:00', '17:30', '19:30'));
  alter table public.christmas_waitlist_2026 drop constraint christmas_waitlist_2026_reservation_time_check;
  alter table public.christmas_waitlist_2026 add constraint christmas_waitlist_2026_reservation_time_check check (reservation_time in ('11:00', '13:00', '11:30', '13:30', '17:00', '19:00', '17:30', '19:30'));
  foreach function_oid in array array[
    'public.christmas_reservation_create_2026(uuid,date,time,smallint,smallint,text,text)'::regprocedure,
    'public.christmas_reservation_availability_2026(date,smallint)'::regprocedure,
    'public.christmas_waitlist_create_2026(uuid,date,time,smallint,text,text)'::regprocedure
  ] loop
    select pg_catalog.pg_get_functiondef(function_oid) into definition;
    updated_definition := replace(replace(definition, '''17:30''', '''17:00'''), '''19:30''', '''19:00''');
    if updated_definition = definition then raise exception 'Dinner times not found in %', function_oid; end if;
    execute updated_definition;
  end loop;
end $$;
commit;
