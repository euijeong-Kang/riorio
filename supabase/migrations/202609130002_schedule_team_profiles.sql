create table if not exists public.schedule_employee_profiles (
  employee_id text primary key,
  original_name text not null,
  nickname text,
  emoji text not null default '🙂',
  edit_pin_hash text,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.schedule_employee_profiles enable row level security;

drop policy if exists "team profiles are public" on public.schedule_employee_profiles;
create policy "team profiles are public"
  on public.schedule_employee_profiles for select
  to anon, authenticated
  using (active = true);

revoke insert, update, delete on public.schedule_employee_profiles from anon, authenticated;
grant select on public.schedule_employee_profiles to anon, authenticated;

create or replace function public.update_own_schedule_profile(
  p_employee_id text,
  p_nickname text,
  p_emoji text,
  p_pin text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  profile public.schedule_employee_profiles;
begin
  select * into profile from public.schedule_employee_profiles where employee_id = p_employee_id and active = true;
  if profile.employee_id is null or profile.edit_pin_hash is null or extensions.crypt(p_pin, profile.edit_pin_hash) <> profile.edit_pin_hash then
    raise exception 'invalid profile pin' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_nickname, ''))) > 12 then raise exception 'nickname is too long'; end if;
  if length(trim(coalesce(p_emoji, ''))) > 8 then raise exception 'emoji is too long'; end if;

  update public.schedule_employee_profiles
  set nickname = nullif(trim(p_nickname), ''), emoji = coalesce(nullif(trim(p_emoji), ''), '🙂'), updated_at = now()
  where employee_id = p_employee_id;
end;
$$;

revoke all on function public.update_own_schedule_profile(text, text, text, text) from public;
grant execute on function public.update_own_schedule_profile(text, text, text, text) to anon, authenticated;

create or replace function public.set_schedule_profile_pin(p_employee_id text, p_original_name text, p_pin text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_schedule_admin(auth.uid()) then
    raise exception 'schedule admin access required' using errcode = '42501';
  end if;
  if p_pin !~ '^[0-9]{4,8}$' then raise exception 'pin must be 4 to 8 digits'; end if;
  insert into public.schedule_employee_profiles(employee_id, original_name, edit_pin_hash)
  values (p_employee_id, p_original_name, extensions.crypt(p_pin, extensions.gen_salt('bf')))
  on conflict (employee_id) do update set original_name = excluded.original_name, edit_pin_hash = excluded.edit_pin_hash, active = true, updated_at = now();
end;
$$;

revoke all on function public.set_schedule_profile_pin(text, text, text) from public, anon;
grant execute on function public.set_schedule_profile_pin(text, text, text) to authenticated;
