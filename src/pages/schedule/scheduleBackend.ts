import type { Session } from '@supabase/supabase-js';
import { isSupabaseScheduleConfigured, supabase } from '../../lib/supabase';
import type { PublishedSchedule } from './data';
import { validatePublishedSchedule } from './scheduleApi';

export { isSupabaseScheduleConfigured };

export type SharedScheduleProfile = {
  employeeId: string;
  originalName: string;
  nickname: string | null;
  emoji: string;
  avatarPath: string | null;
  avatarUrl: string | null;
};

const SCHEDULE_AVATAR_BUCKET = 'schedule-avatars';

export function getScheduleAvatarUrl(path: string, version?: string) {
  if (!supabase) return null;
  const { data } = supabase.storage.from(SCHEDULE_AVATAR_BUCKET).getPublicUrl(path);
  return version ? `${data.publicUrl}?v=${encodeURIComponent(version)}` : data.publicUrl;
}

export async function loadSharedScheduleProfiles(): Promise<SharedScheduleProfile[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('schedule_employee_profiles').select('employee_id,original_name,nickname,emoji,avatar_path,updated_at').eq('active', true);
  if (error) throw error;
  return (data ?? []).map((item) => ({
    employeeId: item.employee_id,
    originalName: item.original_name,
    nickname: item.nickname,
    emoji: item.emoji,
    avatarPath: item.avatar_path,
    avatarUrl: item.avatar_path ? getScheduleAvatarUrl(item.avatar_path, item.updated_at) : null,
  }));
}

export async function updateSharedScheduleProfile(nickname: string, emoji: string, avatarPath: string | null) {
  if (!supabase) throw new Error('공유 프로필은 Supabase 연결 후 수정할 수 있습니다.');
  const { error } = await supabase.rpc('update_my_schedule_profile', { p_nickname: nickname, p_emoji: emoji, p_avatar_path: avatarPath });
  if (error) throw new Error(error.code === '42501' ? '로그인한 직원 프로필을 확인할 수 없습니다.' : '프로필을 저장하지 못했습니다.');
}

export async function uploadMyScheduleAvatar(image: Blob) {
  if (!supabase) throw new Error('Supabase 연결 후 사진을 저장할 수 있어요.');
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('사진을 저장하려면 직원 로그인이 필요해요.');
  const path = `${user.id}/avatar.webp`;
  const { error } = await supabase.storage.from(SCHEDULE_AVATAR_BUCKET).upload(path, image, {
    contentType: 'image/webp', cacheControl: '3600', upsert: true,
  });
  if (error) throw new Error('사진을 업로드하지 못했어요. 잠시 후 다시 시도해 주세요.');
  return { path, url: getScheduleAvatarUrl(path, Date.now().toString())! };
}

export async function removeMyScheduleAvatar(path: string) {
  if (!supabase) return;
  const { error } = await supabase.storage.from(SCHEDULE_AVATAR_BUCKET).remove([path]);
  if (error) throw new Error('기존 사진을 정리하지 못했어요.');
}

export type ScheduleTeamNote = { id: string; employeeId: string; content: string; createdAt: string };

export async function loadScheduleTeamNotes(weekStart: string): Promise<ScheduleTeamNote[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('schedule_team_notes').select('id,employee_id,content,created_at').eq('week_start', weekStart).order('created_at', { ascending: false }).limit(20);
  if (error) throw error;
  return (data ?? []).map((item) => ({ id: item.id, employeeId: item.employee_id, content: item.content, createdAt: item.created_at }));
}

export async function createScheduleTeamNote(weekStart: string, content: string) {
  if (!supabase) throw new Error('공유노트는 Supabase 연결 후 작성할 수 있습니다.');
  const { error } = await supabase.rpc('create_my_schedule_team_note', { p_week_start: weekStart, p_content: content });
  if (error) throw new Error(error.code === '42501' ? '로그인 후 공유노트를 작성할 수 있습니다.' : '공유노트를 등록하지 못했습니다.');
}

export async function getAdminSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

const employeeEmail = (loginId: string) => `${loginId.toLowerCase()}@staff.riorio.internal`;
export async function getEmployeeSession(): Promise<Session | null> { return getAdminSession(); }
export async function getMyScheduleEmployeeId(): Promise<string | null> {
  if (!supabase) return null;
  const session = await getEmployeeSession();
  if (!session) return null;
  const { data, error } = await supabase.from('schedule_employee_profiles').select('employee_id').eq('user_id', session.user.id).eq('active', true).maybeSingle();
  if (error) throw error;
  return data?.employee_id ?? null;
}
export async function signInScheduleEmployee(loginId: string, password: string) {
  if (!supabase) throw new Error('Supabase 연결 후 로그인할 수 있습니다.');
  const { data, error } = await supabase.auth.signInWithPassword({ email: employeeEmail(loginId), password });
  if (error) throw new Error('아이디 또는 비밀번호를 확인해 주세요.');
  return data.session;
}
export async function activateScheduleEmployee(employeeId: string, originalName: string, inviteCode: string, loginId: string, password: string) {
  if (!supabase) throw new Error('Supabase 연결 후 가입할 수 있습니다.');
  const { data, error } = await supabase.functions.invoke('activate-schedule-account', { body: { employeeId, originalName, inviteCode, loginId, password } });
  if (error || data?.error) throw new Error(data?.error ?? '가입하지 못했습니다.');
}

export async function signInScheduleAdmin(loginId: string, password: string) {
  if (!supabase) throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  const email = loginId.includes('@') ? loginId : `${loginId.toLowerCase()}@admin.riorio.internal`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const { data: role, error: roleError } = await supabase.from('schedule_admins').select('user_id').eq('user_id', data.user.id).maybeSingle();
  if (roleError || !role) {
    await supabase.auth.signOut();
    throw new Error('근무표 관리자 권한이 없는 계정입니다.');
  }
  return data.session;
}

export async function signOutScheduleAdmin() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function loadRemoteSchedules(): Promise<PublishedSchedule[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('schedule_versions')
    .select('payload')
    .eq('status', 'published')
    .order('week_start', { ascending: true });
  if (error) throw error;
  if (!data?.length) return [];
  return data.map((row) => validatePublishedSchedule(row.payload));
}

export async function publishRemoteSchedules(schedules: PublishedSchedule[]) {
  if (!supabase) throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  const { data, error } = await supabase.rpc('publish_schedule_collection', { p_schedules: schedules });
  if (error) throw error;
  return Number(data);
}
