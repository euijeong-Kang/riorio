import type { PublishedSchedule } from './data';
import { getLocalSchedules } from './scheduleStore';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function validatePublishedSchedule(value: unknown): PublishedSchedule {
  assert(typeof value === 'object' && value !== null, '게시본이 객체가 아닙니다.');
  const data = value as PublishedSchedule;
  assert(data.schemaVersion === 1, '지원하지 않는 게시본 형식입니다.');
  assert(typeof data.isSample === 'boolean', '샘플 여부가 없습니다.');
  assert(Array.isArray(data.employees) && data.employees.length > 0, '직원 목록이 없습니다.');
  assert(Array.isArray(data.shifts), '근무 목록이 없습니다.');
  assert(Array.isArray(data.dateStatuses), '날짜별 게시 상태가 없습니다.');
  assert(data.week?.timeZone === 'Asia/Seoul', '시간대는 Asia/Seoul이어야 합니다.');
  assert(/^\d{4}-\d{2}-\d{2}$/.test(data.week.startDate), '주간 시작일이 올바르지 않습니다.');
  assert(/^\d{4}-\d{2}-\d{2}$/.test(data.week.endDate), '주간 종료일이 올바르지 않습니다.');

  const employeeIds = new Set(data.employees.map((employee) => employee.id));
  assert(employeeIds.size === data.employees.length, '직원 ID가 중복되었습니다.');
  for (const employee of data.employees) {
    assert(Boolean(employee.id && employee.displayName), '직원 식별 정보가 올바르지 않습니다.');
  }

  for (const shift of data.shifts) {
    assert(employeeIds.has(shift.employeeId), `등록되지 않은 직원 ID: ${shift.employeeId}`);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(shift.date), `잘못된 근무 날짜: ${shift.id}`);
    assert(/^([01]\d|2[0-3]):[0-5]\d$/.test(shift.start), `잘못된 출근 시각: ${shift.id}`);
    assert(/^([01]\d|2[0-3]):[0-5]\d$/.test(shift.end), `잘못된 퇴근 시각: ${shift.id}`);
    assert(shift.start < shift.end, `종료가 시작보다 빠르거나 같습니다: ${shift.id}`);
    assert(Boolean(shift.sourceSheet && shift.sourceRange), `원본 위치가 없습니다: ${shift.id}`);
  }

  const grouped = new Map<string, typeof data.shifts>();
  for (const shift of data.shifts) {
    const key = `${shift.employeeId}:${shift.date}`;
    grouped.set(key, [...(grouped.get(key) ?? []), shift]);
  }
  for (const [key, dayShifts] of grouped) {
    const sorted = [...dayShifts].sort((a, b) => a.start.localeCompare(b.start));
    for (let index = 1; index < sorted.length; index += 1) {
      assert(sorted[index - 1].end <= sorted[index].start, `겹치는 근무 구간: ${key}`);
    }
  }

  const statusKeys = new Set(data.dateStatuses.map((item) => `${item.employeeId}:${item.date}`));
  const expectedCount = data.employees.length * 7;
  assert(statusKeys.size === expectedCount, `날짜별 게시 상태가 완전하지 않습니다. (${statusKeys.size}/${expectedCount})`);
  return data;
}

export async function loadCurrentSchedule(signal?: AbortSignal) {
  const schedules = await loadScheduleCollection(signal);
  return schedules.at(-1)!;
}

export async function loadScheduleCollection(signal?: AbortSignal) {
  if (import.meta.env.DEV) {
    const localSchedules = getLocalSchedules();
    if (localSchedules?.length) return localSchedules.map(validatePublishedSchedule).sort((a, b) => a.week.startDate.localeCompare(b.week.startDate));
  }
  const { isSupabaseScheduleConfigured, loadRemoteSchedules } = await import('./scheduleBackend');
  if (isSupabaseScheduleConfigured) {
    const remoteSchedules = await loadRemoteSchedules();
    if (remoteSchedules?.length) return remoteSchedules;
  }
  const pointerResponse = await fetch('/data/schedule/current.json', { cache: 'no-store', signal });
  if (!pointerResponse.ok) throw new Error('현재 게시 버전을 불러오지 못했습니다.');
  const pointer = await pointerResponse.json() as { file?: string };
  assert(typeof pointer.file === 'string' && /^[a-zA-Z0-9._-]+\.json$/.test(pointer.file), '게시 버전 포인터가 올바르지 않습니다.');

  const response = await fetch(`/data/schedule/${pointer.file}`, { cache: 'no-store', signal });
  if (!response.ok) throw new Error('게시된 근무표를 불러오지 못했습니다.');
  return [validatePublishedSchedule(await response.json())];
}
