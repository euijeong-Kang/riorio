create function public.christmas_reservation_status_2026(p_request_key uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select pg_catalog.jsonb_build_object('status', status, 'guests', guests)
  from public.christmas_reservations_2026
  where request_key = p_request_key
$$;

revoke all on function public.christmas_reservation_status_2026(uuid) from public, anon, authenticated;
grant execute on function public.christmas_reservation_status_2026(uuid) to service_role;
