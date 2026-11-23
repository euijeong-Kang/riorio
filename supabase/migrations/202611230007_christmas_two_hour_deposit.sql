do $$
declare
  definition text;
  updated_definition text;
begin
  select pg_catalog.pg_get_functiondef('public.christmas_reservation_create_2026(uuid,date,time,smallint,smallint,text,text)'::regprocedure) into definition;
  updated_definition := replace(definition, 'interval ''12 hours''', 'interval ''2 hours''');
  if updated_definition = definition then raise exception 'Deposit deadline expression not found'; end if;
  execute updated_definition;
end $$;
