create function public.christmas_waitlist_admin_action_2026(p_waitlist_id uuid, p_status text)
returns text language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.is_schedule_admin(auth.uid()) then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_status is null or p_status not in ('contacted', 'cancelled') then raise exception 'invalid request' using errcode = '22023'; end if;
  update public.christmas_waitlist_2026 set status = p_status where id = p_waitlist_id and status = 'waiting';
  if not found then return 'not_eligible'; end if;
  return p_status;
end $$;
revoke all on function public.christmas_waitlist_admin_action_2026(uuid, text) from public, anon;
grant execute on function public.christmas_waitlist_admin_action_2026(uuid, text) to authenticated;
