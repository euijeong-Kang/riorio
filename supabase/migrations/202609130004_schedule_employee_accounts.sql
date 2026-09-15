alter table public.schedule_employee_profiles add column if not exists user_id uuid unique references auth.users(id) on delete set null;
alter table public.schedule_employee_profiles add column if not exists login_id text unique;

create table if not exists public.schedule_employee_invites (
  id uuid primary key default gen_random_uuid(),
  employee_id text not null,
  original_name text not null,
  code_hash text not null,
  expires_at timestamptz not null default (now() + interval '14 days'),
  used_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.schedule_employee_invites enable row level security;
create policy "admins manage employee invites" on public.schedule_employee_invites for all to authenticated
  using (public.is_schedule_admin(auth.uid())) with check (public.is_schedule_admin(auth.uid()));
revoke all on public.schedule_employee_invites from anon;
grant select, insert, update on public.schedule_employee_invites to authenticated;

create or replace function public.update_my_schedule_profile(p_nickname text, p_emoji text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if length(trim(coalesce(p_nickname, ''))) > 12 then raise exception 'nickname is too long'; end if;
  if length(trim(coalesce(p_emoji, ''))) > 8 then raise exception 'emoji is too long'; end if;
  update public.schedule_employee_profiles set nickname = nullif(trim(p_nickname), ''), emoji = coalesce(nullif(trim(p_emoji), ''), '🙂'), updated_at = now()
  where user_id = auth.uid() and active = true;
  if not found then raise exception 'active employee profile not found' using errcode = '42501'; end if;
end; $$;
grant execute on function public.update_my_schedule_profile(text, text) to authenticated;

create or replace function public.create_my_schedule_team_note(p_week_start date, p_content text)
returns uuid language plpgsql security definer set search_path = public as $$
declare profile_id text; new_id uuid;
begin
  select employee_id into profile_id from public.schedule_employee_profiles where user_id = auth.uid() and active = true;
  if profile_id is null then raise exception 'active employee profile not found' using errcode = '42501'; end if;
  if char_length(trim(coalesce(p_content, ''))) not between 1 and 200 then raise exception 'note must be between 1 and 200 characters'; end if;
  insert into public.schedule_team_notes(week_start, employee_id, content) values (p_week_start, profile_id, trim(p_content)) returning id into new_id;
  return new_id;
end; $$;
grant execute on function public.create_my_schedule_team_note(date, text) to authenticated;

create or replace function public.verify_schedule_employee_invite(p_employee_id text, p_original_name text, p_code text)
returns uuid language sql security definer set search_path = public as $$
  select id from public.schedule_employee_invites
  where employee_id = p_employee_id and original_name = p_original_name and used_at is null and expires_at > now()
    and extensions.crypt(p_code, code_hash) = code_hash
  limit 1;
$$;
revoke all on function public.verify_schedule_employee_invite(text, text, text) from public, anon, authenticated;
grant execute on function public.verify_schedule_employee_invite(text, text, text) to service_role;

-- 관리자 가입코드 발급 예시(코드는 직원에게 1회 전달):
-- insert into public.schedule_employee_invites(employee_id, original_name, code_hash, created_by)
-- values ('employee-id', '직원명', extensions.crypt('가입코드', extensions.gen_salt('bf')), auth.uid());
