create table if not exists public.schedule_team_notes (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  employee_id text not null references public.schedule_employee_profiles(employee_id),
  content text not null check (char_length(content) between 1 and 200),
  created_at timestamptz not null default now()
);

create index if not exists schedule_team_notes_week_idx on public.schedule_team_notes(week_start, created_at desc);
alter table public.schedule_team_notes enable row level security;

drop policy if exists "team notes are public" on public.schedule_team_notes;
create policy "team notes are public" on public.schedule_team_notes for select to anon, authenticated using (true);
revoke insert, update, delete on public.schedule_team_notes from anon, authenticated;
grant select on public.schedule_team_notes to anon, authenticated;

create or replace function public.create_schedule_team_note(
  p_week_start date,
  p_employee_id text,
  p_content text,
  p_pin text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  profile public.schedule_employee_profiles;
  new_id uuid;
begin
  select * into profile from public.schedule_employee_profiles where employee_id = p_employee_id and active = true;
  if profile.employee_id is null or profile.edit_pin_hash is null or extensions.crypt(p_pin, profile.edit_pin_hash) <> profile.edit_pin_hash then
    raise exception 'invalid profile pin' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_content, ''))) not between 1 and 200 then
    raise exception 'note must be between 1 and 200 characters';
  end if;
  insert into public.schedule_team_notes(week_start, employee_id, content)
  values (p_week_start, p_employee_id, trim(p_content)) returning id into new_id;
  return new_id;
end;
$$;

revoke all on function public.create_schedule_team_note(date, text, text, text) from public;
grant execute on function public.create_schedule_team_note(date, text, text, text) to anon, authenticated;
