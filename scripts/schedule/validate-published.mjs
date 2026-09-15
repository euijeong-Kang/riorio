import fs from 'node:fs/promises';
import path from 'node:path';

const scheduleDir = path.resolve('public/data/schedule');
const pointer = JSON.parse(await fs.readFile(path.join(scheduleDir, 'current.json'), 'utf8'));

if (typeof pointer.file !== 'string' || !/^[a-zA-Z0-9._-]+\.json$/.test(pointer.file)) {
  throw new Error('current.json의 file 값이 올바르지 않습니다.');
}

const publishedPath = path.join(scheduleDir, pointer.file);
const data = JSON.parse(await fs.readFile(publishedPath, 'utf8'));
const fail = (message) => { throw new Error(message); };

if (data.schemaVersion !== 1) fail('schemaVersion은 1이어야 합니다.');
if (data.week?.timeZone !== 'Asia/Seoul') fail('시간대는 Asia/Seoul이어야 합니다.');
if (!Array.isArray(data.employees) || data.employees.length === 0) fail('직원 목록이 없습니다.');
if (!Array.isArray(data.shifts)) fail('근무 목록이 없습니다.');
if (!Array.isArray(data.dateStatuses)) fail('날짜별 게시 상태가 없습니다.');

const employeeIds = new Set(data.employees.map((employee) => employee.id));
if (employeeIds.size !== data.employees.length) fail('직원 ID가 중복되었습니다.');

for (const shift of data.shifts) {
  if (!employeeIds.has(shift.employeeId)) fail(`미등록 직원: ${shift.employeeId}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(shift.date)) fail(`날짜 오류: ${shift.id}`);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(shift.start)) fail(`출근 시각 오류: ${shift.id}`);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(shift.end)) fail(`퇴근 시각 오류: ${shift.id}`);
  if (shift.start >= shift.end) fail(`종료가 시작보다 빠르거나 같습니다: ${shift.id}`);
  if (!shift.sourceSheet || !shift.sourceRange) fail(`원본 위치 누락: ${shift.id}`);
  if (shift.reviewStatus !== 'reviewed') fail(`검토 미완료 근무는 게시할 수 없습니다: ${shift.id}`);
}

const groups = new Map();
for (const shift of data.shifts) {
  const key = `${shift.employeeId}:${shift.date}`;
  groups.set(key, [...(groups.get(key) ?? []), shift]);
}
for (const [key, shifts] of groups) {
  shifts.sort((a, b) => a.start.localeCompare(b.start));
  for (let index = 1; index < shifts.length; index += 1) {
    if (shifts[index - 1].end > shifts[index].start) fail(`겹치는 근무 구간: ${key}`);
  }
}

const statusKeys = new Set(data.dateStatuses.map((item) => `${item.employeeId}:${item.date}`));
const expectedStatusCount = data.employees.length * 7;
if (statusKeys.size !== expectedStatusCount) {
  fail(`날짜별 게시 상태가 완전하지 않습니다. (${statusKeys.size}/${expectedStatusCount})`);
}

for (const status of data.dateStatuses) {
  if (!employeeIds.has(status.employeeId)) fail(`게시 상태의 미등록 직원: ${status.employeeId}`);
  const hasShift = data.shifts.some((shift) => shift.employeeId === status.employeeId && shift.date === status.date);
  if (status.status === 'published_with_shift' && !hasShift) fail(`근무 있음 상태와 근무 목록 불일치: ${status.employeeId}:${status.date}`);
  if (status.status === 'published_no_shift' && hasShift) fail(`근무 없음 상태와 근무 목록 불일치: ${status.employeeId}:${status.date}`);
  if (status.status === 'needs_review' || status.status === 'unpublished') fail(`미확정 날짜 상태는 게시할 수 없습니다: ${status.employeeId}:${status.date}`);
}

console.log(`검증 완료: ${pointer.file}`);
console.log(`직원 ${data.employees.length}명 · 근무 ${data.shifts.length}건 · 날짜 상태 ${data.dateStatuses.length}건`);
