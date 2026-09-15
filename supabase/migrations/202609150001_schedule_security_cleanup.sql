-- Remove the superseded anonymous PIN flow and make authenticated RPC grants explicit.
drop function if exists public.update_own_schedule_profile(text, text, text, text);
drop function if exists public.set_schedule_profile_pin(text, text, text);
drop function if exists public.create_schedule_team_note(date, text, text, text);

alter table public.schedule_employee_profiles
  drop column if exists edit_pin_hash;

revoke all on function public.update_my_schedule_profile(text, text) from public, anon;
grant execute on function public.update_my_schedule_profile(text, text) to authenticated;

revoke all on function public.create_my_schedule_team_note(date, text) from public, anon;
grant execute on function public.create_my_schedule_team_note(date, text) to authenticated;

revoke all on function public.is_schedule_admin(uuid) from public, anon;
grant execute on function public.is_schedule_admin(uuid) to authenticated;

drop policy if exists "published schedules are public" on public.schedule_versions;
drop policy if exists "schedule admins can read all versions" on public.schedule_versions;

create policy "published schedules are public"
  on public.schedule_versions for select
  to anon, authenticated
  using (status = 'published');

create policy "schedule admins can read all versions"
  on public.schedule_versions for select
  to authenticated
  using (public.is_schedule_admin(auth.uid()));
