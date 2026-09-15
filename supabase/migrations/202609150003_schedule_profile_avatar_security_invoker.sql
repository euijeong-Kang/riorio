drop policy if exists "employees update own schedule profile" on public.schedule_employee_profiles;
create policy "employees update own schedule profile"
on public.schedule_employee_profiles for update to authenticated
using (user_id = (select auth.uid()) and active = true)
with check (user_id = (select auth.uid()) and active = true);

grant update (nickname, emoji, avatar_path, updated_at)
on public.schedule_employee_profiles to authenticated;

create or replace function public.update_my_schedule_profile(
  p_nickname text,
  p_emoji text,
  p_avatar_path text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_nickname, ''))) > 12 then
    raise exception 'nickname is too long';
  end if;
  if length(trim(coalesce(p_emoji, ''))) > 8 then
    raise exception 'emoji is too long';
  end if;
  if p_avatar_path is not null and p_avatar_path <> auth.uid()::text || '/avatar.webp' then
    raise exception 'invalid avatar path' using errcode = '42501';
  end if;

  update public.schedule_employee_profiles
  set nickname = nullif(trim(p_nickname), ''),
      emoji = coalesce(nullif(trim(p_emoji), ''), '🙂'),
      avatar_path = p_avatar_path,
      updated_at = now()
  where user_id = auth.uid() and active = true;

  if not found then
    raise exception 'active employee profile not found' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.update_my_schedule_profile(text, text, text) from public, anon;
grant execute on function public.update_my_schedule_profile(text, text, text) to authenticated;
