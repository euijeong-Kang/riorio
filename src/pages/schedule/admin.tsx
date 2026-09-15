import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, FileSpreadsheet, LogOut, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { parseScheduleWorkbook, type EndRule, type ParsedWorkbook } from './excelParser';
import { publishSchedulesLocally } from './scheduleStore';
import { getAdminSession, isSupabaseScheduleConfigured, publishRemoteSchedules, signInScheduleAdmin, signOutScheduleAdmin } from './scheduleBackend';

interface FileResult extends ParsedWorkbook {
  fileName: string;
}

export default function ScheduleAdminPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [endRule, setEndRule] = useState<EndRule | null>(null);
  const [results, setResults] = useState<FileResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [published, setPublished] = useState(false);
  const [activeWeek, setActiveWeek] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(!isSupabaseScheduleConfigured);
  const [authenticated, setAuthenticated] = useState(!isSupabaseScheduleConfigured);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [publishError, setPublishError] = useState('');
  const [publishBusy, setPublishBusy] = useState(false);

  const schedules = results.flatMap((result) => result.schedule ? [result.schedule] : []).sort((a, b) => a.week.startDate.localeCompare(b.week.startDate));
  const hasErrors = results.some((result) => result.issues.some((issue) => issue.level === 'error'));
  const activeSchedule = schedules.find((schedule) => schedule.week.id === activeWeek) ?? schedules[0];
  const activeResult = results.find((result) => result.schedule?.week.id === activeSchedule?.week.id);
  const totalShifts = schedules.reduce((total, schedule) => total + schedule.shifts.length, 0);
  const allNames = useMemo(() => [...new Set(schedules.flatMap((schedule) => schedule.employees.map((employee) => employee.displayName)))].sort(), [schedules]);

  useEffect(() => {
    if (!isSupabaseScheduleConfigured) return;
    getAdminSession().then((session) => setAuthenticated(Boolean(session))).catch(() => setAuthenticated(false)).finally(() => setAuthChecked(true));
  }, []);

  const analyze = async () => {
    if (!files.length || !endRule) return;
    setBusy(true); setPublished(false); setConfirmed(false);
    const parsed = await Promise.all(files.map(async (file): Promise<FileResult> => {
      try { return { ...(await parseScheduleWorkbook(file, endRule)), fileName: file.name }; }
      catch (error) { return { fileName: file.name, schedule: null, memoLines: [], issues: [{ level: 'error', message: error instanceof Error ? error.message : '파일을 읽지 못했습니다.' }] }; }
    }));
    const weekIds = parsed.flatMap((result) => result.schedule?.week.id ? [result.schedule.week.id] : []);
    if (new Set(weekIds).size !== weekIds.length) parsed.push({ fileName: '전체', schedule: null, memoLines: [], issues: [{ level: 'error', message: '같은 주차의 파일이 두 개 이상 선택되었습니다.' }] });
    setResults(parsed);
    setActiveWeek(parsed.find((result) => result.schedule)?.schedule?.week.id ?? null);
    setBusy(false);
  };

  const publish = async () => {
    if (!schedules.length || hasErrors || !confirmed) return;
    setPublishBusy(true); setPublishError('');
    try {
      if (isSupabaseScheduleConfigured) await publishRemoteSchedules(schedules);
      else publishSchedulesLocally(schedules);
      setPublished(true);
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : '게시하지 못했습니다.');
    } finally { setPublishBusy(false); }
  };

  const login = async (event: React.FormEvent) => {
    event.preventDefault(); setAuthError('');
    try { await signInScheduleAdmin(loginId, password); setAuthenticated(true); }
    catch (error) { setAuthError(error instanceof Error ? error.message : '로그인하지 못했습니다.'); }
  };

  if (!authChecked) return <main className="flex min-h-screen items-center justify-center bg-[#F6F7F8]"><p className="text-[15px] font-semibold text-[#66706B]">관리자 권한 확인 중…</p></main>;
  if (!authenticated) return <main className="min-h-screen bg-[#F6F7F8] px-4 py-12 text-[#191F1D]"><section className="mx-auto max-w-[440px] rounded-[24px] bg-white p-6 shadow-[0_16px_50px_rgba(12,42,35,0.09)]"><p className="text-[12px] font-bold tracking-[0.16em] text-[#9A8350]">RIORIO MANAGER</p><h1 className="mt-2 text-[28px] font-extrabold text-[#0C2A23]">관리자 로그인</h1><p className="mt-2 text-[14px] leading-6 text-[#6B7470]">근무표를 검토하고 게시할 수 있는 계정으로 로그인하세요.</p><form onSubmit={login} className="mt-6 space-y-4"><label className="block text-[14px] font-bold">관리자 아이디<input type="text" required value={loginId} onChange={(event) => setLoginId(event.target.value.replace(/[^a-zA-Z0-9._@-]/g, '').slice(0, 50))} className="mt-2 min-h-12 w-full rounded-2xl border border-[#D8DEDB] px-4 text-[16px]" autoComplete="username" placeholder="관리자 아이디" /></label><label className="block text-[14px] font-bold">비밀번호<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-[#D8DEDB] px-4 text-[16px]" autoComplete="current-password" /></label>{authError && <p className="rounded-xl bg-[#FFF0EE] p-3 text-[13px] font-semibold text-[#8E2D22]" role="alert">{authError}</p>}<button type="submit" className="min-h-12 w-full rounded-2xl bg-[#0C2A23] text-[16px] font-bold text-white">로그인</button></form><Link to="/schedule" className="mt-5 block text-center text-[13px] font-semibold text-[#66706B]">직원 화면으로 돌아가기</Link></section></main>;

  return (
    <main className="min-h-screen bg-[#F6F7F8] text-[#191F1D]"><div className="mx-auto w-full max-w-[1100px] px-4 pb-16 pt-6 sm:px-6 sm:pt-9">
      <header className="flex items-center justify-between gap-4"><div><p className="text-[12px] font-bold tracking-[0.16em] text-[#9A8350]">RIORIO MANAGER</p><h1 className="mt-1 text-[28px] font-extrabold tracking-[-0.04em] text-[#0C2A23]">근무표 일괄 검토 및 게시</h1></div><div className="flex items-center gap-2"><Link to="/schedule" className="flex min-h-12 items-center gap-2 rounded-2xl border border-[#DDE2DF] bg-white px-4 text-[14px] font-bold"><ArrowLeft className="h-4 w-4" />직원 화면</Link>{isSupabaseScheduleConfigured && <button type="button" aria-label="관리자 로그아웃" onClick={() => signOutScheduleAdmin().finally(() => setAuthenticated(false))} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#DDE2DF] bg-white"><LogOut className="h-5 w-5" /></button>}</div></header>
      <div className="mt-7 rounded-[20px] border border-[#E1D7B8] bg-[#FFFDF6] px-5 py-4 text-[14px] leading-6 text-[#665A3D]">{isSupabaseScheduleConfigured ? '게시한 일정은 Supabase에 저장되어 모든 직원 기기에 반영됩니다.' : 'Supabase 공개 키가 없어 로컬 검토 모드로 실행 중입니다. 게시 내용은 이 브라우저에만 반영됩니다.'}</div>

      <section className="mt-5 rounded-[24px] bg-white p-5 sm:p-7">
        <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EDF4F1] text-[#0C2A23]"><FileSpreadsheet /></div><div><h2 className="text-[21px] font-bold">1. 주간 엑셀 파일 선택</h2><p className="mt-1 text-[14px] text-[#6B7470]">여러 개의 .xlsx 파일을 한 번에 선택할 수 있어요</p></div></div>
        <label className="mt-5 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-[#C9D0CC] bg-[#FAFBFA] px-4 text-center focus-within:outline focus-within:outline-3 focus-within:outline-[#CBB676]"><Upload className="h-6 w-6 text-[#0C2A23]" /><span className="mt-2 text-[15px] font-bold">{files.length ? `${files.length}개 파일 선택됨` : '파일을 눌러 선택하세요'}</span><input type="file" multiple accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" onChange={(event) => { setFiles([...event.target.files ?? []]); setResults([]); setPublished(false); }} /></label>
        {files.length > 0 && <ul className="mt-3 space-y-1 rounded-2xl bg-[#F6F7F8] p-4 text-[13px] font-semibold text-[#59615D]">{files.map((file) => <li key={`${file.name}-${file.size}`}>• {file.name}</li>)}</ul>}
        <fieldset className="mt-6"><legend className="text-[17px] font-bold">2. 공통 퇴근 시각 규칙</legend><p className="mt-1 text-[13px] leading-6 text-[#6B7470]">선택한 모든 주차에 같은 규칙을 적용합니다.</p><div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className={`cursor-pointer rounded-[18px] border p-4 ${endRule === 'next_boundary' ? 'border-[#0C2A23] bg-[#F0F6F3]' : 'border-[#DDE2DF]'}`}><input type="radio" name="endRule" checked={endRule === 'next_boundary'} onChange={() => { setEndRule('next_boundary'); setResults([]); }} className="mr-2" /><strong>다음 30분 경계</strong><p className="ml-6 mt-1 text-[13px] text-[#6B7470]">21:00 셀까지 → 퇴근 21:30</p></label>
          <label className={`cursor-pointer rounded-[18px] border p-4 ${endRule === 'last_label' ? 'border-[#0C2A23] bg-[#F0F6F3]' : 'border-[#DDE2DF]'}`}><input type="radio" name="endRule" checked={endRule === 'last_label'} onChange={() => { setEndRule('last_label'); setResults([]); }} className="mr-2" /><strong>마지막 표기 시각</strong><p className="ml-6 mt-1 text-[13px] text-[#6B7470]">21:00 셀까지 → 퇴근 21:00</p></label>
        </div></fieldset>
        <button type="button" disabled={!files.length || !endRule || busy} onClick={analyze} className="mt-6 min-h-12 w-full rounded-2xl bg-[#0C2A23] px-5 text-[16px] font-bold text-white disabled:bg-[#AEB6B2]">{busy ? `${files.length}개 파일 해석 중…` : '선택한 파일 모두 해석하기'}</button>
      </section>

      {results.length > 0 && <section className="mt-5 rounded-[24px] bg-white p-5 sm:p-7">
        <h2 className="text-[21px] font-bold">3. 주차별 결과 검토</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="rounded-2xl bg-[#F4F6F5] p-4"><p className="text-[12px] text-[#6B7470]">주차</p><p className="mt-1 text-[22px] font-black">{schedules.length}주</p></div><div className="rounded-2xl bg-[#F4F6F5] p-4"><p className="text-[12px] text-[#6B7470]">전체 이름</p><p className="mt-1 text-[22px] font-black">{allNames.length}개</p></div><div className="rounded-2xl bg-[#F4F6F5] p-4"><p className="text-[12px] text-[#6B7470]">근무 구간</p><p className="mt-1 text-[22px] font-black">{totalShifts}건</p></div><div className="rounded-2xl bg-[#F4F6F5] p-4"><p className="text-[12px] text-[#6B7470]">상태</p><p className={`mt-1 font-black ${hasErrors ? 'text-[#9A3D25]' : 'text-[#17643C]'}`}>{hasErrors ? '확인 필요' : '게시 가능'}</p></div></div>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">{schedules.map((schedule) => <button key={schedule.week.id} type="button" onClick={() => setActiveWeek(schedule.week.id)} className={`min-h-11 shrink-0 rounded-xl px-4 text-[13px] font-bold ${activeSchedule?.week.id === schedule.week.id ? 'bg-[#0C2A23] text-white' : 'bg-[#EEF1EF] text-[#48514C]'}`}>{schedule.week.startDate.slice(5).replace('-', '.')}–{schedule.week.endDate.slice(5).replace('-', '.')}</button>)}</div>
        {results.flatMap((result) => result.issues.map((issue) => ({ ...issue, fileName: result.fileName }))).map((issue, index) => <div key={`${issue.message}-${index}`} className={`mt-3 flex gap-3 rounded-2xl p-4 ${issue.level === 'error' ? 'bg-[#FFF0EE] text-[#8E2D22]' : 'bg-[#FFF8E5] text-[#715600]'}`}><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="text-[12px] font-semibold opacity-75">{issue.fileName}</p><p className="mt-1 text-[14px] font-bold">{issue.message}</p>{issue.sourceRange && <p className="mt-1 text-[12px] opacity-75">원본 {issue.sourceRange}</p>}</div></div>)}
        {activeSchedule && <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{[...new Set(activeSchedule.shifts.map((shift) => shift.date))].sort().map((date) => <article key={date} className="rounded-[18px] border border-[#E4E8E6] p-4"><h3 className="font-extrabold">{date}</h3><div className="mt-3 space-y-2">{activeSchedule.shifts.filter((shift) => shift.date === date).sort((a,b) => a.start.localeCompare(b.start)).map((shift) => <div key={shift.id} className="flex justify-between gap-3 rounded-xl bg-[#F6F7F8] px-3 py-2 text-[13px]"><span className="font-bold">{activeSchedule.employees.find((employee) => employee.id === shift.employeeId)?.displayName}</span><span className="font-semibold tabular-nums">{shift.start}–{shift.end}</span></div>)}</div></article>)}</div>}
        {activeResult?.memoLines.length ? <details className="mt-5 rounded-2xl border border-[#E4E8E6] p-4"><summary className="cursor-pointer text-[14px] font-bold">선택한 주의 원본 메모 {activeResult.memoLines.length}개</summary><ul className="mt-3 space-y-2 text-[13px] leading-6 text-[#59615D]">{activeResult.memoLines.map((memo) => <li key={memo}>• {memo}</li>)}</ul></details> : null}
        {!hasErrors && schedules.length > 0 && <div className="mt-6 rounded-[20px] border border-[#DDE2DF] p-4"><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 h-5 w-5" /><span className="text-[14px] leading-6"><strong className="block text-[16px]">모든 주차를 원본과 대조했습니다</strong>직원 이름, 메모와 출퇴근 시간을 확인했습니다.</span></label><button type="button" disabled={!confirmed || publishBusy} onClick={publish} className="mt-4 min-h-12 w-full rounded-2xl bg-[#0C2A23] px-5 text-[16px] font-bold text-white disabled:bg-[#AEB6B2]">{publishBusy ? '안전하게 게시 중…' : `${schedules.length}주 일정 게시하기`}</button>{publishError && <p className="mt-3 rounded-xl bg-[#FFF0EE] p-3 text-[13px] font-semibold text-[#8E2D22]" role="alert">{publishError}</p>}</div>}
        {published && <div className="mt-5 flex gap-3 rounded-[20px] bg-[#EDF7F1] p-4 text-[#155D37]" role="status"><CheckCircle2 className="h-5 w-5 shrink-0" /><div><p className="font-bold">{schedules.length}주 일정을 게시했습니다</p><Link to="/schedule" className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-[#155D37] px-4 text-[13px] font-bold text-white">전체 일정 확인</Link></div></div>}
      </section>}
    </div></main>
  );
}
