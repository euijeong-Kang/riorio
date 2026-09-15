import ExcelJS from 'exceljs';
import type { DateEmployeeStatus, Employee, PublishedSchedule, Shift } from './data';

export type EndRule = 'next_boundary' | 'last_label';

export interface ParseIssue {
  level: 'error' | 'warning';
  message: string;
  sourceRange?: string;
}

export interface ParsedWorkbook {
  schedule: PublishedSchedule | null;
  issues: ParseIssue[];
  sheetName?: string;
  memoLines: string[];
}

type RawShiftSegment = Shift & {
  sourceColumn: number;
  startRow: number;
  endRow: number;
};

const weekdayOffsets: Record<string, number> = {
  월요일: 0, 화요일: 1, 수요일: 2, 목요일: 3, 금요일: 4, 토요일: 5, 일요일: 6,
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function timeText(value: ExcelJS.CellValue, displayed: string) {
  if (value instanceof Date) return `${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}`;
  if (typeof value === 'number') {
    const minutes = Math.round(value * 24 * 60) % (24 * 60);
    return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
  }
  const match = displayed.match(/(\d{1,2}):(\d{2})/);
  return match ? `${pad(Number(match[1]))}:${match[2]}` : '';
}

function safeCellText(cell: ExcelJS.Cell) {
  const source = cell.isMerged ? cell.master : cell;
  if (source.value === null || source.value === undefined) return '';
  try {
    return source.text ?? '';
  } catch {
    return typeof source.value === 'object' ? '' : String(source.value);
  }
}

function columnNumber(address: string) {
  const letters = address.match(/^[A-Z]+/)?.[0] ?? '';
  return [...letters].reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0);
}

function parseRange(range: string) {
  const [start, end = start] = range.split(':');
  return {
    startCol: columnNumber(start), endCol: columnNumber(end),
    startRow: Number(start.match(/\d+$/)?.[0]), endRow: Number(end.match(/\d+$/)?.[0]),
  };
}

function hashName(name: string) {
  let hash = 2166136261;
  for (const char of name) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `staff-${(hash >>> 0).toString(36)}`;
}

export async function parseScheduleWorkbook(file: File, endRule: EndRule): Promise<ParsedWorkbook> {
  const issues: ParseIssue[] = [];
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const worksheet = workbook.worksheets.find((sheet) => sheet.name.includes('근무')) ?? workbook.worksheets[0];
  if (!worksheet) return { schedule: null, issues: [{ level: 'error', message: '읽을 수 있는 시트가 없습니다.' }], memoLines: [] };

  const periodText = `${safeCellText(worksheet.getCell('A2'))} ${safeCellText(worksheet.getCell('E2'))}`;
  const periodMatch = periodText.match(/(20\d{2})년\s*(\d{1,2})월\s*(\d{1,2})일[\s\S]*?(\d{1,2})월\s*(\d{1,2})일/);
  if (!periodMatch) return { schedule: null, sheetName: worksheet.name, issues: [{ level: 'error', message: 'A2/E2에서 주간 날짜 범위를 찾지 못했습니다.' }], memoLines: [] };
  const startDate = new Date(Number(periodMatch[1]), Number(periodMatch[2]) - 1, Number(periodMatch[3]), 12);
  const declaredEnd = new Date(Number(periodMatch[1]), Number(periodMatch[4]) - 1, Number(periodMatch[5]), 12);
  if (dateKey(addDays(startDate, 6)) !== dateKey(declaredEnd)) issues.push({ level: 'error', message: '시작일과 종료일이 7일 주간 범위가 아닙니다.', sourceRange: 'A2:H2' });

  const timeRows: { row: number; time: string }[] = [];
  for (let row = 5; row <= worksheet.rowCount; row += 1) {
    const timeCell = worksheet.getCell(row, 1);
    const time = timeText(timeCell.value, safeCellText(timeCell));
    if (!time) break;
    timeRows.push({ row, time });
  }
  if (timeRows.length < 2) issues.push({ level: 'error', message: 'A열에서 30분 시간축을 찾지 못했습니다.' });
  const lastTimeRow = timeRows.at(-1)?.row ?? 29;
  const mergeRanges = (worksheet.model.merges ?? []).map((range) => ({ text: range, ...parseRange(range) }));

  const weekdayByColumn = new Map<number, number>();
  for (let column = 2; column <= worksheet.columnCount; column += 1) {
    const header = safeCellText(worksheet.getCell(4, column)).trim();
    const offset = weekdayOffsets[header];
    if (offset !== undefined) weekdayByColumn.set(column, offset);
  }

  const rawSegments: RawShiftSegment[] = [];
  const employeeByName = new Map<string, Employee>();
  const handled = new Set<string>();
  for (const [column, offset] of weekdayByColumn) {
    for (const { row, time } of timeRows) {
      const cell = worksheet.getCell(row, column);
      const master = cell.isMerged ? cell.master : cell;
      if (handled.has(master.address)) continue;
      handled.add(master.address);
      const text = safeCellText(master).trim();
      if (!text) continue;
      const merge = mergeRanges.find((item) => item.startRow === master.row && item.startCol === master.col);
      const endRow = merge?.endRow ?? row;
      const nextBoundary = timeRows.find((item) => item.row === endRow + 1)?.time;
      const lastLabel = timeRows.find((item) => item.row === endRow)?.time;
      const end = endRule === 'next_boundary' && nextBoundary ? nextBoundary : lastLabel;
      if (!end || end <= time) {
        issues.push({ level: 'error', message: `종료 시각을 안전하게 해석할 수 없습니다: ${text}`, sourceRange: merge?.text ?? master.address });
        continue;
      }
      const day = dateKey(addDays(startDate, offset));
      for (const rawName of text.split(',').map((name) => name.trim()).filter(Boolean)) {
        const employee = employeeByName.get(rawName) ?? { id: hashName(rawName), displayName: rawName };
        employeeByName.set(rawName, employee);
        rawSegments.push({
          id: `${employee.id}-${day}-${time.replace(':', '')}-${column}`,
          employeeId: employee.id, date: day, start: time, end,
          sourceSheet: worksheet.name, sourceRange: merge?.text ?? master.address, reviewStatus: 'reviewed',
          sourceColumn: column, startRow: row, endRow,
        });
      }
    }
  }

  const mergedSegments: RawShiftSegment[] = [];
  for (const segment of rawSegments.sort((a, b) =>
    `${a.employeeId}:${a.date}:${String(a.sourceColumn).padStart(3, '0')}:${String(a.startRow).padStart(3, '0')}`
      .localeCompare(`${b.employeeId}:${b.date}:${String(b.sourceColumn).padStart(3, '0')}:${String(b.startRow).padStart(3, '0')}`))) {
    const previous = mergedSegments.at(-1);
    // A name can be repeated in adjacent merged cells when the crew composition changes
    // during a continuous shift. Merge by source-row adjacency, not calculated time text:
    // the "last label" rule otherwise creates artificial 30-minute gaps.
    if (previous
      && previous.employeeId === segment.employeeId
      && previous.date === segment.date
      && previous.sourceColumn === segment.sourceColumn
      && previous.endRow + 1 === segment.startRow) {
      previous.end = segment.end;
      previous.endRow = segment.endRow;
      previous.sourceRange = `${previous.sourceRange}, ${segment.sourceRange}`;
    } else {
      mergedSegments.push({ ...segment });
    }
  }

  const shifts: Shift[] = mergedSegments
    .sort((a, b) => `${a.employeeId}${a.date}${a.start}`.localeCompare(`${b.employeeId}${b.date}${b.start}`))
    .map(({ sourceColumn: _sourceColumn, startRow: _startRow, endRow: _endRow, ...shift }) => shift);

  const grouped = new Map<string, Shift[]>();
  for (const shift of shifts) {
    const key = `${shift.employeeId}:${shift.date}`;
    grouped.set(key, [...(grouped.get(key) ?? []), shift]);
  }
  for (const [key, items] of grouped) {
    const sorted = [...items].sort((a, b) => a.start.localeCompare(b.start));
    for (let index = 1; index < sorted.length; index += 1) {
      if (sorted[index - 1].end > sorted[index].start) issues.push({ level: 'error', message: `같은 직원의 시간이 겹칩니다: ${key}`, sourceRange: `${sorted[index - 1].sourceRange}, ${sorted[index].sourceRange}` });
    }
  }

  const memoLines: string[] = [];
  for (let row = lastTimeRow + 2; row <= worksheet.rowCount; row += 1) {
    for (let column = 1; column <= worksheet.columnCount; column += 1) {
      const text = safeCellText(worksheet.getCell(row, column)).trim();
      if (text && !memoLines.includes(text)) memoLines.push(text);
    }
  }
  if (memoLines.length) issues.push({ level: 'warning', message: '휴무·가능 요일·변경 메모는 일정에 자동 적용하지 않았습니다. 미리보기와 함께 확인하세요.' });
  if (lastTimeRow && endRule === 'last_label') issues.push({ level: 'warning', message: '병합 마지막 셀의 표기 시각을 퇴근 시각으로 선택했습니다.' });

  const employees = [...employeeByName.values()];
  for (const employee of employees) {
    if (/\s/.test(employee.displayName)) issues.push({ level: 'warning', message: `공백이 포함된 이름을 확인하세요: “${employee.displayName}”` });
  }
  if (!employees.length) issues.push({ level: 'error', message: '시간표 영역에서 직원 이름을 찾지 못했습니다.' });
  const dates = Array.from({ length: 7 }, (_, index) => dateKey(addDays(startDate, index)));
  const dateStatuses: DateEmployeeStatus[] = dates.flatMap((date) => employees.map((employee) => ({
    date, employeeId: employee.id,
    status: shifts.some((shift) => shift.date === date && shift.employeeId === employee.id) ? 'published_with_shift' : 'published_no_shift',
  })));
  const now = new Date();
  const schedule: PublishedSchedule = {
    schemaVersion: 1,
    isSample: false,
    week: {
      id: dateKey(startDate), startDate: dateKey(startDate), endDate: dateKey(declaredEnd), timeZone: 'Asia/Seoul',
      version: `로컬 ${dateKey(now)}-${pad(now.getHours())}${pad(now.getMinutes())}`,
      publishedAt: now.toISOString(), notice: '변경사항은 매니저에게 직접 확인해 주세요.',
    },
    employees, shifts, dateStatuses,
  };
  return { schedule, issues, sheetName: worksheet.name, memoLines };
}
