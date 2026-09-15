import type { PublishedSchedule } from './data';

const LOCAL_SCHEDULE_KEY = 'riorio.schedule.local-published-v1';
export const LOCAL_SCHEDULE_EVENT = 'riorio:schedule-published';

export function getLocalSchedule(): unknown | null {
  const value = localStorage.getItem(LOCAL_SCHEDULE_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function getLocalSchedules(): unknown[] | null {
  const value = getLocalSchedule();
  if (!value) return null;
  if (Array.isArray(value)) return value;
  return [value];
}

export function publishScheduleLocally(schedule: PublishedSchedule) {
  publishSchedulesLocally([schedule]);
}

export function publishSchedulesLocally(schedules: PublishedSchedule[]) {
  const unique = new Map(schedules.map((schedule) => [schedule.week.id, schedule]));
  const ordered = [...unique.values()].sort((a, b) => a.week.startDate.localeCompare(b.week.startDate));
  localStorage.setItem(LOCAL_SCHEDULE_KEY, JSON.stringify(ordered));
  window.dispatchEvent(new CustomEvent(LOCAL_SCHEDULE_EVENT));
}

export function clearLocalSchedule() {
  localStorage.removeItem(LOCAL_SCHEDULE_KEY);
  window.dispatchEvent(new CustomEvent(LOCAL_SCHEDULE_EVENT));
}
