alter table public.schedule_employee_profiles
  add column if not exists avatar_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('schedule-avatars', 'schedule-avatars', true, 2097152, array['image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "schedule avatars insert own" on storage.objects;
create policy "schedule avatars insert own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'schedule-avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and storage.filename(name) = 'avatar.webp'
);

drop policy if exists "schedule avatars select own" on storage.objects;
create policy "schedule avatars select own"
on storage.objects for select to authenticated
using (
  bucket_id = 'schedule-avatars'
  and owner_id = (select auth.uid()::text)
);

drop policy if exists "schedule avatars update own" on storage.objects;
create policy "schedule avatars update own"
on storage.objects for update to authenticated
using (
  bucket_id = 'schedule-avatars'
  and owner_id = (select auth.uid()::text)
)
with check (
  bucket_id = 'schedule-avatars'
  and owner_id = (select auth.uid()::text)
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and storage.filename(name) = 'avatar.webp'
);

drop policy if exists "schedule avatars delete own" on storage.objects;
create policy "schedule avatars delete own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'schedule-avatars'
  and owner_id = (select auth.uid()::text)
);

drop function if exists public.update_my_schedule_profile(text, text);

create or replace function public.update_my_schedule_profile(
  p_nickname text,
  p_emoji text,
  p_avatar_path text
)
returns void
language plpgsql
security definer
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
