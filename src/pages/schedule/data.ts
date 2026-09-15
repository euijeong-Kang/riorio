export type ReviewStatus = 'reviewed' | 'needs_review';

export interface Shift {
  id: string;
  employeeId: string;
  date: string;
  start: string;
  end: string;
  sourceSheet: string;
  sourceRange: string;
  reviewStatus: ReviewStatus;
  changed?: boolean;
  previousTime?: string;
}

export interface Employee {
  id: string;
  displayName: string;
}

export interface PublishedWeek {
  id: string;
  startDate: string;
  endDate: string;
  timeZone: 'Asia/Seoul';
  version: string;
  publishedAt: string;
  notice: string;
}

export interface DateEmployeeStatus {
  date: string;
  employeeId: string;
  status: 'published_with_shift' | 'published_no_shift' | 'unpublished' | 'needs_review';
}

export interface PublishedSchedule {
  schemaVersion: 1;
  isSample: boolean;
  week: PublishedWeek;
  employees: Employee[];
  shifts: Shift[];
  dateStatuses: DateEmployeeStatus[];
}

export const employees: Employee[] = [
  { id: 'changju', displayName: '창주' },
  { id: 'mingyeong', displayName: '민경' },
  { id: 'sua', displayName: '수아' },
  { id: 'seohyeon', displayName: '서현' },
  { id: 'jinseo', displayName: '진서' },
  { id: 'dayeong', displayName: '다영' },
];

export const sampleWeek: PublishedWeek = {
  id: '2026-09-07',
  startDate: '2026-09-07',
  endDate: '2026-09-13',
  timeZone: 'Asia/Seoul',
  version: '샘플 v1.0',
  publishedAt: '2026-09-06T18:30:00+09:00',
  notice: '근무 변경이 필요하면 매니저에게 직접 확인해 주세요.',
};

const sourceSheet = '주간 근무스케줄';

export const sampleShifts: Shift[] = [
  { id: 'c-mon', employeeId: 'changju', date: '2026-09-07', start: '10:30', end: '22:30', sourceSheet, sourceRange: 'B5:B29', reviewStatus: 'reviewed' },
  { id: 'm-mon', employeeId: 'mingyeong', date: '2026-09-07', start: '18:00', end: '21:30', sourceSheet, sourceRange: 'B20:B26', reviewStatus: 'reviewed' },
  { id: 'c-tue', employeeId: 'changju', date: '2026-09-08', start: '10:30', end: '22:30', sourceSheet, sourceRange: 'C5:C29', reviewStatus: 'reviewed' },
  { id: 's-tue', employeeId: 'sua', date: '2026-09-08', start: '18:00', end: '21:30', sourceSheet, sourceRange: 'C20:C26', reviewStatus: 'reviewed' },
  { id: 'c-wed', employeeId: 'changju', date: '2026-09-09', start: '10:30', end: '22:30', sourceSheet, sourceRange: 'D5:D29', reviewStatus: 'reviewed' },
  { id: 'h-wed', employeeId: 'seohyeon', date: '2026-09-09', start: '18:00', end: '21:30', sourceSheet, sourceRange: 'D20:D26', reviewStatus: 'reviewed' },
  { id: 'h-thu', employeeId: 'seohyeon', date: '2026-09-10', start: '10:30', end: '22:30', sourceSheet, sourceRange: 'E5:E29', reviewStatus: 'reviewed' },
  { id: 'j-thu', employeeId: 'jinseo', date: '2026-09-10', start: '18:00', end: '21:30', sourceSheet, sourceRange: 'E20:E26', reviewStatus: 'reviewed' },
  { id: 'm-fri', employeeId: 'mingyeong', date: '2026-09-11', start: '10:30', end: '22:30', sourceSheet, sourceRange: 'F5:F29', reviewStatus: 'reviewed' },
  { id: 'j-fri', employeeId: 'jinseo', date: '2026-09-11', start: '18:00', end: '21:30', sourceSheet, sourceRange: 'F20:F26', reviewStatus: 'reviewed' },
  { id: 'c-sat', employeeId: 'changju', date: '2026-09-12', start: '10:30', end: '22:30', sourceSheet, sourceRange: 'G5:G29', reviewStatus: 'reviewed' },
  { id: 's-sat', employeeId: 'sua', date: '2026-09-12', start: '11:30', end: '16:00', sourceSheet, sourceRange: 'H7:H15', reviewStatus: 'reviewed' },
  { id: 'd-sat', employeeId: 'dayeong', date: '2026-09-12', start: '14:00', end: '17:30', sourceSheet, sourceRange: 'I12:I18', reviewStatus: 'reviewed' },
  { id: 'j-sat', employeeId: 'jinseo', date: '2026-09-12', start: '17:00', end: '21:30', sourceSheet, sourceRange: 'H18:H26', reviewStatus: 'reviewed' },
  { id: 'c-sun', employeeId: 'changju', date: '2026-09-13', start: '10:30', end: '22:30', sourceSheet, sourceRange: 'J5:J29', reviewStatus: 'reviewed' },
  { id: 's-sun', employeeId: 'sua', date: '2026-09-13', start: '11:30', end: '16:00', sourceSheet, sourceRange: 'K7:K15', reviewStatus: 'reviewed' },
  { id: 'd-sun', employeeId: 'dayeong', date: '2026-09-13', start: '14:00', end: '17:30', sourceSheet, sourceRange: 'L12:L18', reviewStatus: 'reviewed' },
  { id: 'h-sun', employeeId: 'seohyeon', date: '2026-09-13', start: '17:00', end: '21:30', sourceSheet, sourceRange: 'K18:K26', reviewStatus: 'reviewed' },
];

export const weekDates = [
  '2026-09-07',
  '2026-09-08',
  '2026-09-09',
  '2026-09-10',
  '2026-09-11',
  '2026-09-12',
  '2026-09-13',
];

export const sampleSchedule: PublishedSchedule = {
  schemaVersion: 1,
  isSample: true,
  week: sampleWeek,
  employees,
  shifts: sampleShifts,
  dateStatuses: weekDates.flatMap((date) => employees.map((employee) => ({
    date,
    employeeId: employee.id,
    status: sampleShifts.some((shift) => shift.date === date && shift.employeeId === employee.id)
      ? 'published_with_shift' as const
      : 'published_no_shift' as const,
  }))),
};
