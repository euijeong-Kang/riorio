\set ON_ERROR_STOP on
begin;
do $$ begin
  if has_table_privilege('anon', 'public.christmas_lookup_limits_2026', 'SELECT') or has_function_privilege('anon', 'public.christmas_reservation_lookup_2026(text,text)', 'EXECUTE') then raise exception 'anonymous access granted'; end if;
end $$;
set local role service_role;
insert into public.christmas_reservations_2026(request_key,reservation_date,reservation_time,table_number,guests,pairing_guests,name,phone,course_price,pairing_price,deposit_per_guest,transfer_deadline) values ('00000000-0000-4000-8000-000000000001','2026-12-24','11:30',1,2,1,'Sample Guest','01000000000',120000,40000,30000,now()+interval '2 hours');
do $$ declare result jsonb; begin
  result := public.christmas_reservation_lookup_2026('Sample Guest','01000000000');
  if result->>'status' <> 'ok' or jsonb_array_length(result->'reservations') <> 1 then raise exception 'expected matching reservation'; end if;
  if (result->'reservations'->0)->>'name' is not null or (result->'reservations'->0)->>'phone' is not null or (result->'reservations'->0)->>'request_key' is not null then raise exception 'private data returned'; end if;
  result := public.christmas_reservation_lookup_2026('Wrong Guest','01000000000');
  if jsonb_array_length(result->'reservations') <> 0 then raise exception 'unexpected match'; end if;
  perform public.christmas_reservation_lookup_2026('Wrong Guest','01000000000');
  perform public.christmas_reservation_lookup_2026('Wrong Guest','01000000000');
  perform public.christmas_reservation_lookup_2026('Wrong Guest','01000000000');
  result := public.christmas_reservation_lookup_2026('Wrong Guest','01000000000');
  if result->>'status' <> 'limited' then raise exception 'expected rate limit'; end if;
end $$;
rollback;
