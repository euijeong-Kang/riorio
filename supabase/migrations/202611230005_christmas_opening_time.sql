do $$
declare
  definition text;
  updated_definition text;
  gate text := 'if not coalesce((select booking_enabled from public.christmas_reservation_settings_2026 where id = true), false) then';
begin
  select pg_catalog.pg_get_functiondef('public.christmas_reservation_create_2026(uuid,date,time,smallint,smallint,text,text)'::regprocedure) into definition;
  updated_definition := replace(definition, gate, 'if pg_catalog.clock_timestamp() < timestamptz ''2026-11-24 00:00:00+09'' then return ''closed''; end if;' || E'\n  ' || gate);
  if updated_definition = definition then raise exception 'Reservation opening gate not found'; end if;
  execute updated_definition;

  select pg_catalog.pg_get_functiondef('public.christmas_reservation_availability_2026(date,smallint)'::regprocedure) into definition;
  updated_definition := replace(definition, gate, 'if pg_catalog.clock_timestamp() < timestamptz ''2026-11-24 00:00:00+09'' then return null; end if;' || E'\n  ' || gate);
  if updated_definition = definition then raise exception 'Availability opening gate not found'; end if;
  execute updated_definition;
end $$;
