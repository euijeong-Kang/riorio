do $$
declare
  definition text;
  updated_definition text;
  slot_lock text := 'perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_date::text || '':'' || p_time::text, 1));';
begin
  select pg_catalog.pg_get_functiondef('public.christmas_reservation_create_2026(uuid,date,time,smallint,smallint,text,text)'::regprocedure) into definition;
  updated_definition := replace(definition, slot_lock, slot_lock || E'\n  ' || 'if exists (select 1 from public.christmas_reservations_2026 where reservation_date = p_date and reservation_time = p_time and phone = p_phone and status <> ''cancelled'') then return ''duplicate_phone''; end if;');
  if updated_definition = definition then raise exception 'Reservation slot lock not found'; end if;
  execute updated_definition;
end $$;
