import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, CalendarDays, Check, Clock3, RefreshCw, Send, Sparkles, UserRound, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { sampleSchedule, type DateEmployeeStatus, type PublishedSchedule, type Shift } from './data';
import { loadScheduleCollection } from './scheduleApi';
import { LOCAL_SCHEDULE_EVENT } from './scheduleStore';
import TeamWeekViewB from './TeamWeekViewB';
import { createScheduleTeamNote, getMyScheduleEmployeeId, isSupabaseScheduleConfigured, loadSharedScheduleProfiles, updateSharedScheduleProfile } from './scheduleBackend';

const STORAGE_KEY = 'riorio.schedule.employee-id';
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

type Scenario = 'today-work' | 'today-off' | 'ended' | 'next-week' | 'split' | 'changed' | 'needs-review' | 'failure';

const scenarios: { id: Scenario; label: string; employeeId: string; now: string }[] = [
  { id: 'today-work', label: '오늘 근무 있음', employeeId: 'seohyeon', now: '2026-09-09T17:20:00+09:00' },
  { id: 'today-off', label: '오늘 근무 없음', employeeId: 'mingyeong', now: '2026-09-09T12:00:00+09:00' },
  { id: 'ended', label: '오늘 일정 종료', employeeId: 'seohyeon', now: '2026-09-09T22:10:00+09:00' },
  { id: 'next-week', label: '다음 주 미게시', employeeId: 'changju', now: '2026-09-13T23:10:00+09:00' },
  { id: 'split', label: '하루 2개 구간', employeeId: 'dayeong', now: '2026-09-12T12:00:00+09:00' },
  { id: 'changed', label: '변경된 일정', employeeId: 'sua', now: '2026-09-12T10:00:00+09:00' },
  { id: 'needs-review', label: '확인 필요', employeeId: 'seohyeon', now: '2026-09-09T12:00:00+09:00' },
  { id: 'failure', label: '불러오기 실패', employeeId: 'seohyeon', now: '2026-09-09T12:00:00+09:00' },
];

function toKstDateKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

function parseShift(date: string, time: string) {
  return new Date(`${date}T${time}:00+09:00`);
}

function formatDate(dateKey: string, includeYear = false) {
  const date = new Date(`${dateKey}T12:00:00+09:00`);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = DAY_NAMES[date.getDay()];
  return `${includeYear ? `${date.getFullYear()}년 ` : ''}${month}월 ${day}일 ${weekday}요일`;
}

function getScenarioShifts(baseShifts: Shift[], scenario: Scenario) {
  const shifts = baseShifts.map((shift) => ({ ...shift }));
  if (scenario === 'split') {
    shifts.push({
      id: 'd-sat-extra', employeeId: 'dayeong', date: '2026-09-12', start: '19:00', end: '21:00',
      sourceSheet: '시제품 검증 데이터', sourceRange: 'DEV-SPLIT', reviewStatus: 'reviewed',
    });
  }
  if (scenario === 'changed') {
    const target = shifts.find((shift) => shift.id === 's-sat');
    if (target) {
      target.start = '12:00';
      target.changed = true;
      target.previousTime = '11:30–16:00';
    }
  }
  if (scenario === 'needs-review') {
    const target = shifts.find((shift) => shift.id === 'h-wed');
    if (target) target.reviewStatus = 'needs_review';
  }
  return shifts;
}

function ScheduleRow({ date, shifts, today, status }: { date: string; shifts: Shift[]; today: boolean; status?: DateEmployeeStatus['status'] }) {
  const dateObject = new Date(`${date}T12:00:00+09:00`);
  return (
    <li className={`rounded-[22px] border px-5 py-4 transition-colors ${today ? 'border-[#0C2A23] bg-[#F1F6F4]' : 'border-[#E8EBED] bg-white'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-[86px]">
          <div className="flex items-center gap-2">
            <p className="text-[16px] font-bold text-[#191F1D]">{dateObject.getMonth() + 1}.{dateObject.getDate()}</p>
            {today && <span className="rounded-full bg-[#0C2A23] px-2 py-1 text-[11px] font-bold text-white">오늘</span>}
          </div>
          <p className="mt-1 text-[14px] text-[#6B7470]">{DAY_NAMES[dateObject.getDay()]}요일</p>
        </div>
        <div className="min-w-0 flex-1 text-right">
          {shifts.length === 0 ? (
            <p className={`pt-2 text-[16px] font-semibold ${status === 'needs_review' ? 'text-[#9A3D25]' : 'text-[#8A928E]'}`}>
              {status === 'unpublished' ? '일정 미게시' : status === 'needs_review' ? '확인 필요' : '근무 없음'}
            </p>
          ) : (
            <div className="space-y-3">
              {shifts.map((shift) => (
                <div key={shift.id}>
                  {shift.reviewStatus === 'needs_review' ? (
                    <div role="status">
                      <p className="text-[17px] font-bold text-[#9A3D25]">시간 확인 필요</p>
                      <p className="mt-1 text-[12px] font-medium text-[#6B7470]">확정 전에는 매니저에게 확인해 주세요</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-[20px] font-bold tracking-[-0.02em] text-[#0C2A23]">
                        <span className="sr-only">출근 </span>{shift.start}
                        <span className="mx-2 text-[#A7AEAA]" aria-hidden="true">→</span>
                        <span className="sr-only">퇴근 </span>{shift.end}
                      </p>
                      <p className="mt-1 text-[12px] font-medium text-[#6B7470]">출근 {shift.start} · 퇴근 {shift.end}</p>
                    </>
                  )}
                  {shift.changed && (
                    <p className="mt-2 inline-flex rounded-full bg-[#FFF5D8] px-2.5 py-1 text-[12px] font-bold text-[#795B00]">
                      변경됨 · 이전 {shift.previousTime}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

export default function SchedulePage() {
  const [nicknames, setNicknames] = useState<Record<string, string>>({});
  const [profileEmojis, setProfileEmojis] = useState<Record<string, string>>({});
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [emojiDraft, setEmojiDraft] = useState('🙂');
  const [myEmployeeId, setMyEmployeeId] = useState<string | null>(null);
  const [profileError, setProfileError] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [view, setView] = useState<'team' | 'personal'>('team');
  const [showSkinRequest, setShowSkinRequest] = useState(false);
  const [skinRequest, setSkinRequest] = useState('');
  const [skinRequestBusy, setSkinRequestBusy] = useState(false);
  const [skinRequestError, setSkinRequestError] = useState('');
  const [skinRequestSent, setSkinRequestSent] = useState(false);
  const [scenario, setScenario] = useState<Scenario>('today-work');
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [publishedSchedules, setPublishedSchedules] = useState<PublishedSchedule[]>([]);
  const [activeWeekId, setActiveWeekId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const scenarioConfig = scenarios.find((item) => item.id === scenario) ?? scenarios[0];
  const [selectedId, setSelectedId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [showPicker, setShowPicker] = useState(!selectedId);
  // Fixed scenario times are strictly for the development-only QA controls.
  // Production always follows the current clock in Asia/Seoul.
  const now = import.meta.env.DEV ? new Date(scenarioConfig.now) : currentTime;
  const todayKey = toKstDateKey(now);
  const schedule = publishedSchedules.find((item) => item.week.id === activeWeekId) ?? publishedSchedules[0] ?? sampleSchedule;
  const employees = schedule.employees;
  const weekDates = useMemo(() => [...new Set(schedule.dateStatuses.map((item) => item.date))].sort(), [schedule.dateStatuses]);
  const shifts = useMemo(() => getScenarioShifts(schedule.shifts, scenario), [schedule.shifts, scenario]);
  const selected = employees.find((employee) => employee.id === selectedId);

  useEffect(() => {
    const controller = new AbortController();
    loadScheduleCollection(controller.signal)
      .then((data) => {
        setPublishedSchedules(data);
        const realToday = toKstDateKey(new Date());
        const matching = data.find((item) => item.week.startDate <= realToday && realToday <= item.week.endDate);
        setActiveWeekId((current) => current && data.some((item) => item.week.id === current) ? current : (matching ?? data.at(-1))?.week.id ?? null);
        setLoadError(false);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setLoadError(true);
      })
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, []);
  useEffect(() => { if (isSupabaseScheduleConfigured) getMyScheduleEmployeeId().then((id) => { setMyEmployeeId(id); if (id) setSelectedId(id); }).catch(() => undefined); }, []);

  useEffect(() => {
    const refresh = () => {
      setIsLoading(true);
      loadScheduleCollection().then((data) => { setPublishedSchedules(data); setActiveWeekId((current) => current && data.some((item) => item.week.id === current) ? current : data.at(-1)?.week.id ?? null); }).catch(() => setLoadError(true)).finally(() => setIsLoading(false));
    };
    window.addEventListener(LOCAL_SCHEDULE_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(LOCAL_SCHEDULE_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    localStorage.setItem(STORAGE_KEY, selectedId);
  }, [selectedId]);

  useEffect(() => {
    loadSharedScheduleProfiles().then((profiles) => {
      setNicknames(Object.fromEntries(profiles.filter((item) => item.nickname).map((item) => [item.employeeId, item.nickname!])))
      setProfileEmojis(Object.fromEntries(profiles.map((item) => [item.employeeId, item.emoji])));
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV) return;
    const refreshClock = () => setCurrentTime(new Date());
    const onVisibilityChange = () => { if (document.visibilityState === 'visible') refreshClock(); };
    const interval = window.setInterval(refreshClock, 30_000);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', refreshClock);
    window.addEventListener('pageshow', refreshClock);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', refreshClock);
      window.removeEventListener('pageshow', refreshClock);
    };
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV || publishedSchedules.length === 0) return;
    const matching = publishedSchedules.find((item) => item.week.startDate <= todayKey && todayKey <= item.week.endDate);
    setActiveWeekId((matching ?? publishedSchedules.at(-1))?.week.id ?? null);
  }, [publishedSchedules, todayKey]);

  const personalShifts = useMemo(
    () => shifts.filter((shift) => shift.employeeId === selectedId).sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)),
    [selectedId, shifts],
  );
  const todayShifts = personalShifts.filter((shift) => shift.date === todayKey);
  const nextShift = personalShifts.find((shift) => parseShift(shift.date, shift.start) > now);
  const todayEnded = todayShifts.length > 0 && todayShifts.every((shift) => parseShift(shift.date, shift.end) <= now);
  const activeWindow = todayShifts.find((shift) => parseShift(shift.date, shift.start) <= now && now < parseShift(shift.date, shift.end));
  const beforeTodayShift = todayShifts.find((shift) => now < parseShift(shift.date, shift.start));

  const chooseEmployee = (id: string) => {
    setSelectedId(id);
    setShowPicker(false);
  };

  const setTestScenario = (next: Scenario) => {
    const nextConfig = scenarios.find((item) => item.id === next)!;
    setScenario(next);
    setSelectedId(nextConfig.employeeId);
    setShowPicker(false);
  };

  const saveNickname = async () => {
    if (!selected) return;
    const value = nicknameDraft.trim().slice(0, 12);
    setProfileBusy(true);
    setProfileError('');
    try {
      await updateSharedScheduleProfile(value, emojiDraft);
      const targetId = myEmployeeId ?? selected.id;
      setNicknames((current) => ({ ...current, [targetId]: value }));
      setProfileEmojis((current) => ({ ...current, [targetId]: emojiDraft || '🙂' }));
      setShowProfile(false);
    } catch (error) { setProfileError(error instanceof Error ? error.message : '프로필을 저장하지 못했습니다.'); }
    finally { setProfileBusy(false); }
  };

  const startDate = new Date(`${schedule.week.startDate}T12:00:00+09:00`);
  const publishedAt = new Intl.DateTimeFormat('ko-KR', {
    timeZone: schedule.week.timeZone,
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(schedule.week.publishedAt));
  const activeWeekIndex = publishedSchedules.findIndex((item) => item.week.id === schedule.week.id);
  const previousWeek = activeWeekIndex > 0 ? publishedSchedules[activeWeekIndex - 1] : null;
  const nextWeek = activeWeekIndex >= 0 && activeWeekIndex < publishedSchedules.length - 1 ? publishedSchedules[activeWeekIndex + 1] : null;
  const submitSkinRequest = async () => {
    if (!skinRequest.trim() || !myEmployeeId) return;
    setSkinRequestBusy(true);
    setSkinRequestError('');
    try {
      await createScheduleTeamNote(schedule.week.startDate, `[스킨 제안] ${skinRequest.trim()}`);
      setSkinRequest('');
      setSkinRequestSent(true);
      window.dispatchEvent(new Event('riorio:schedule-note-created'));
    } catch (error) {
      setSkinRequestError(error instanceof Error ? error.message : '의견을 남기지 못했어요.');
    } finally {
      setSkinRequestBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F2F4F1] text-[#191F1D]">
      <div className={`mx-auto w-full px-4 pb-16 pt-5 transition-[max-width] sm:px-6 sm:pt-8 motion-reduce:transition-none ${view === 'team' ? 'max-w-[1180px]' : 'max-w-[680px]'}`}>
        <header className="mb-7 flex items-center justify-between">
          <div className="flex items-center gap-2.5" aria-label="리오리오 직원 근무표">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0C2A23] text-[13px] font-black tracking-tight text-white">RR</div>
            <div>
              <p className="text-[12px] font-bold tracking-[0.16em] text-[#9A8350]">RIORIO</p>
              <p className="text-[14px] font-semibold text-[#515A56]">직원 근무표</p>
            </div>
          </div>
          {schedule.isSample && <span className="rounded-full bg-[#FFF3C8] px-3 py-1.5 text-[12px] font-bold text-[#624B00]">샘플 데이터</span>}
        </header>

        <section aria-labelledby="week-title">
          <p className="text-[14px] font-semibold text-[#6B7470]">{startDate.getFullYear()}년 {startDate.getMonth() + 1}월</p>
          <h1 id="week-title" className="mt-1 text-[30px] font-extrabold leading-tight tracking-[-0.04em] text-[#0C2A23]">주간 근무를 확인하세요</h1>
          <p className="mt-3 flex items-center gap-2 text-[16px] font-semibold text-[#515A56]">
            <CalendarDays className="h-18px w-[18px]" aria-hidden="true" />
            {formatDate(schedule.week.startDate, true)} – {formatDate(schedule.week.endDate)}
          </p>
        </section>

        {publishedSchedules.length > 1 && (
          <div className="mt-5 flex items-center justify-between gap-3 rounded-[18px] border border-[#E1E5E3] bg-white p-2" aria-label="주간 이동">
            <button type="button" disabled={!previousWeek} onClick={() => previousWeek && setActiveWeekId(previousWeek.week.id)} className="min-h-11 rounded-xl px-3 text-[14px] font-bold text-[#46504B] disabled:text-[#BCC2BF]" aria-label="이전 주">← 이전</button>
            <select aria-label="조회할 주 선택" value={schedule.week.id} onChange={(event) => setActiveWeekId(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-xl border-0 bg-[#F3F5F4] px-3 text-center text-[14px] font-bold text-[#0C2A23]">
              {publishedSchedules.map((item) => <option key={item.week.id} value={item.week.id}>{item.week.startDate.slice(5).replace('-', '.')} – {item.week.endDate.slice(5).replace('-', '.')}</option>)}
            </select>
            <button type="button" disabled={!nextWeek} onClick={() => nextWeek && setActiveWeekId(nextWeek.week.id)} className="min-h-11 rounded-xl px-3 text-[14px] font-bold text-[#46504B] disabled:text-[#BCC2BF]" aria-label="다음 주">다음 →</button>
          </div>
        )}

        <nav className="mt-6 grid grid-cols-2 rounded-[18px] bg-[#E9ECEA] p-1" aria-label="근무표 보기 선택">
          <button type="button" onClick={() => setView('team')} aria-pressed={view === 'team'} className={`min-h-12 rounded-[14px] text-[15px] font-bold transition-colors ${view === 'team' ? 'bg-white text-[#0C2A23] shadow-sm' : 'text-[#69716D]'}`}>전체 일정</button>
          <button type="button" onClick={() => setView('personal')} aria-pressed={view === 'personal'} className={`min-h-12 rounded-[14px] text-[15px] font-bold transition-colors ${view === 'personal' ? 'bg-white text-[#0C2A23] shadow-sm' : 'text-[#69716D]'}`}>개인 일정</button>
        </nav>

        {isLoading ? (
          <section className="mt-8 rounded-[24px] bg-white p-6" aria-live="polite" aria-busy="true">
            <div className="h-4 w-24 animate-pulse rounded-full bg-[#E8ECEA] motion-reduce:animate-none" />
            <div className="mt-4 h-8 w-56 animate-pulse rounded-xl bg-[#E8ECEA] motion-reduce:animate-none" />
            <p className="sr-only">게시된 근무표를 불러오는 중입니다.</p>
          </section>
        ) : loadError || scenario === 'failure' ? (
          <section className="mt-8 rounded-[24px] border border-[#F0C9C4] bg-white p-6" role="alert">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF0EE] text-[#B33428]"><AlertCircle aria-hidden="true" /></div>
            <h2 className="mt-5 text-[22px] font-bold">근무표를 불러오지 못했어요</h2>
            <p className="mt-2 text-[16px] leading-7 text-[#59615D]">네트워크를 확인한 뒤 다시 시도해 주세요. 확인 전에는 이전 화면의 일정을 믿지 말아 주세요.</p>
            <button type="button" onClick={() => { setIsLoading(true); setLoadError(false); setTestScenario('today-work'); loadScheduleCollection().then(setPublishedSchedules).catch(() => setLoadError(true)).finally(() => setIsLoading(false)); }} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0C2A23] px-4 text-[16px] font-bold text-white focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#CBB676]">
              <RefreshCw className="h-5 w-5" aria-hidden="true" /> 다시 불러오기
            </button>
          </section>
        ) : (
          <>
            {view === 'team' && <TeamWeekViewB schedule={{ ...schedule, shifts }} todayKey={todayKey} nicknames={nicknames} emojis={profileEmojis} />}
            {view === 'personal' && <>
            {(!selected || showPicker) && (
              <section className="mt-8 rounded-[24px] bg-white p-5 shadow-[0_8px_30px_rgba(12,42,35,0.06)]" aria-labelledby="employee-picker-title">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDF4F1] text-[#0C2A23]"><UserRound className="h-5 w-5" aria-hidden="true" /></div>
                  <div>
                    <h2 id="employee-picker-title" className="text-[20px] font-bold">이름을 선택해 주세요</h2>
                    <p className="mt-0.5 text-[14px] text-[#717975]">선택한 이름만 이 기기에 기억해요</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {employees.map((employee) => (
                    <button key={employee.id} type="button" onClick={() => chooseEmployee(employee.id)}
                      aria-pressed={selectedId === employee.id}
                      className={`min-h-12 rounded-2xl border px-4 text-[16px] font-bold transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#CBB676] motion-reduce:transition-none ${selectedId === employee.id ? 'border-[#0C2A23] bg-[#0C2A23] text-white' : 'border-[#DDE2DF] bg-white text-[#303834] hover:bg-[#F2F5F3]'}`}>
                      {employee.displayName}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {selected && !showPicker && (
              <div className="mt-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[14px] font-semibold text-[#6B7470]">선택한 직원</p>
                    <h2 className="mt-1 text-[26px] font-extrabold tracking-[-0.03em]">{nicknames[selected.id] || selected.displayName}님의 일정</h2>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setNicknameDraft(nicknames[selected.id] ?? ''); setEmojiDraft(profileEmojis[selected.id] ?? '🙂'); setProfileError(''); setShowProfile(true); }} className="min-h-12 shrink-0 rounded-2xl border border-[#DDE2DF] bg-white px-4 text-[14px] font-bold text-[#38413D] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#CBB676]">팀 프로필</button>
                    <button type="button" onClick={() => setShowPicker(true)} className="min-h-12 shrink-0 rounded-2xl bg-[#153B32] px-4 text-[14px] font-bold text-white focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#CBB676]">직원 선택</button>
                  </div>
                </div>

                {showProfile && (
                  <section className="mt-4 rounded-[22px] border border-[#DDE4E0] bg-white p-5" aria-labelledby="profile-title">
                    <div className="flex items-start justify-between gap-4">
                      <div><h3 id="profile-title" className="text-[18px] font-extrabold">팀 프로필</h3><p className="mt-1 text-[13px] leading-5 text-[#707975]">별명과 아이콘은 모든 직원에게 함께 보여요. 원본 이름은 유지됩니다.</p></div>
                      <button type="button" onClick={() => setShowProfile(false)} className="min-h-10 rounded-xl px-3 text-[13px] font-bold text-[#6B7470]">닫기</button>
                    </div>
                    <div className="mt-4 grid grid-cols-[88px_1fr] gap-3"><label className="block text-[13px] font-bold text-[#4D5752]">아이콘<input value={emojiDraft} onChange={(event) => setEmojiDraft(event.target.value.slice(0, 8))} maxLength={8} className="mt-2 min-h-12 w-full rounded-2xl border border-[#D8DEDB] bg-[#F8F9F8] px-3 text-center text-[20px] outline-none focus:border-[#153B32]" /></label><label className="block text-[13px] font-bold text-[#4D5752]">별명<input value={nicknameDraft} onChange={(event) => setNicknameDraft(event.target.value)} maxLength={12} placeholder={selected.displayName} className="mt-2 min-h-12 w-full rounded-2xl border border-[#D8DEDB] bg-[#F8F9F8] px-4 text-[16px] outline-none focus:border-[#153B32]" /></label></div>
                    {!myEmployeeId && <p className="mt-3 rounded-xl bg-[#FFF5D8] p-3 text-[12px] font-semibold text-[#725600]">팀 프로필 수정은 직원 로그인 후 사용할 수 있어요.</p>}
                    {profileError && <p className="mt-3 text-[13px] font-bold text-[#9A3D25]" role="alert">{profileError}</p>}
                    {myEmployeeId ? <button type="button" disabled={profileBusy} onClick={saveNickname} className="mt-3 min-h-12 w-full rounded-2xl bg-[#153B32] text-[15px] font-extrabold text-white disabled:bg-[#AEB6B2]">{profileBusy ? '저장 중…' : '팀 프로필 저장'}</button> : <Link to="/schedule/login" className="mt-3 flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#153B32] text-[15px] font-extrabold text-white">로그인하러 가기</Link>}
                  </section>
                )}

                <section className="mt-5 overflow-hidden rounded-[24px] bg-[#0C2A23] p-6 text-white shadow-[0_14px_34px_rgba(12,42,35,0.18)]" aria-labelledby="today-title">
                  <div className="flex items-center gap-2 text-[#D8C78F]"><Sparkles className="h-4 w-4" aria-hidden="true" /><p className="text-[13px] font-bold">{formatDate(todayKey)}</p></div>
                  <h3 id="today-title" className="mt-4 text-[18px] font-bold text-white/75">
                    {activeWindow ? '오늘 예정된 근무 시간' : beforeTodayShift ? '오늘 출근' : todayEnded ? '오늘 예정 근무 종료' : '오늘은 근무가 없어요'}
                  </h3>
                  {activeWindow && <p className="mt-1 text-[34px] font-black tracking-[-0.04em]">{activeWindow.start}–{activeWindow.end}</p>}
                  {beforeTodayShift && <p className="mt-1 text-[34px] font-black tracking-[-0.04em]">{beforeTodayShift.start}</p>}
                  {todayEnded && <p className="mt-1 text-[34px] font-black tracking-[-0.04em]">{todayShifts.at(-1)?.end}</p>}
                  {!activeWindow && !beforeTodayShift && !todayEnded && <p className="mt-2 text-[16px] leading-7 text-white/75">다음 근무를 아래에서 확인해 주세요.</p>}
                  {(activeWindow || beforeTodayShift || todayEnded) && <p className="mt-3 text-[13px] leading-6 text-white/65">출퇴근 기록이 아닌 게시된 예정 시간입니다.</p>}
                </section>

                <section className="mt-4 rounded-[24px] bg-white p-5" aria-labelledby="next-shift-title">
                  <div className="flex items-center gap-2 text-[#6B7470]"><Clock3 className="h-4 w-4" aria-hidden="true" /><h3 id="next-shift-title" className="text-[14px] font-bold">다음 출근</h3></div>
                  {nextShift ? (
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div><p className="text-[18px] font-bold">{formatDate(nextShift.date)}</p><p className="mt-1 text-[28px] font-black tracking-[-0.04em] text-[#0C2A23]">{nextShift.start}</p></div>
                      <ArrowRight className="mb-2 h-5 w-5 text-[#CBB676]" aria-hidden="true" />
                    </div>
                  ) : (
                    <div className="mt-3"><p className="text-[18px] font-bold">이후 일정은 아직 게시되지 않았어요</p><p className="mt-2 text-[14px] leading-6 text-[#6B7470]">다음 주 근무표가 게시되면 이곳에 표시됩니다.</p></div>
                  )}
                </section>

                <section className="mt-9" aria-labelledby="weekly-list-title">
                  <div className="mb-4 flex items-end justify-between"><div><p className="text-[14px] font-semibold text-[#6B7470]">월요일부터 일요일까지</p><h3 id="weekly-list-title" className="mt-1 text-[22px] font-extrabold">주간 일정</h3></div><span className="text-[12px] font-semibold text-[#7E8782]">24시간제</span></div>
                  <ul className="space-y-3">
                    {weekDates.map((date) => <ScheduleRow key={date} date={date} shifts={personalShifts.filter((shift) => shift.date === date)} today={date === todayKey} status={schedule.dateStatuses.find((item) => item.date === date && item.employeeId === selectedId)?.status} />)}
                  </ul>
                </section>

                <aside className="mt-7 rounded-[22px] border border-[#E1D7B8] bg-[#FFFDF6] p-5" aria-labelledby="notice-title">
                  <div className="flex items-center gap-2"><Check className="h-5 w-5 text-[#786229]" aria-hidden="true" /><h3 id="notice-title" className="text-[16px] font-bold">공통 공지</h3></div>
                  <p className="mt-2 text-[15px] leading-7 text-[#59615D]">{schedule.week.notice}</p>
                </aside>

                <footer className="mt-6 text-center text-[12px] leading-6 text-[#7B837F]">
                  <p>게시 {publishedAt} · {schedule.week.version}</p>
                  <p>기준 시간 {schedule.week.timeZone}</p>
                </footer>
              </div>
            )}
            </>}
          </>
        )}

        <div className="mt-8 flex flex-col items-center gap-1">
          <button type="button" onClick={() => { setShowSkinRequest(true); setSkinRequestSent(false); setSkinRequestError(''); }} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-[12px] font-bold text-[#747D78] transition-colors hover:bg-white/60 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#CBB676]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />원하는 스킨 있으면 만들어드림 ✦
          </button>
          <Link to="/schedule/admin" className="min-h-11 rounded-xl px-4 py-3 text-[13px] font-semibold text-[#6B7470] underline decoration-[#B8C0BC] underline-offset-4">관리자 근무표 업로드</Link>
        </div>

        {showSkinRequest && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#08100D]/40 px-3 pb-3 backdrop-blur-[2px] sm:items-center" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowSkinRequest(false); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="skin-request-title" className="w-full max-w-[430px] rounded-[28px] bg-white p-5 shadow-[0_24px_80px_rgba(5,18,14,0.28)]">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-[11px] font-black tracking-[0.12em] text-[#9A8350]">SKIN REQUEST</p><h2 id="skin-request-title" className="mt-1 text-[23px] font-black tracking-[-0.03em]">어떤 느낌이면 좋겠어요?</h2><p className="mt-1 text-[13px] leading-5 text-[#717975]">색감, 분위기, 좋아하는 앱이나 참고 이미지를 편하게 알려주세요.</p></div>
                <button type="button" onClick={() => setShowSkinRequest(false)} aria-label="스킨 의견 닫기" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F2F4F3] text-[#59625E]"><X className="h-5 w-5" /></button>
              </div>
              {myEmployeeId ? skinRequestSent ? <div role="status" className="mt-5 rounded-2xl bg-[#EEF7F2] p-5 text-center"><Check className="mx-auto h-6 w-6 text-[#26704A]" /><p className="mt-2 text-[15px] font-extrabold">의견 남겨줘서 고마워요!</p><p className="mt-1 text-[12px] text-[#65706B]">공유노트에 스킨 제안으로 등록했어요.</p></div> : <div className="mt-5"><textarea value={skinRequest} onChange={(event) => setSkinRequest(event.target.value.slice(0, 180))} maxLength={180} rows={4} autoFocus placeholder="예: 토스처럼 더 심플하게, 검정 배경에 네온 포인트, 좋아하는 앱 캡처 참고…" className="w-full resize-none rounded-2xl border border-[#DDE2DF] bg-[#F8F9F8] p-4 text-[15px] leading-6 outline-none focus:border-[#0C2A23]" /><div className="mt-1 flex items-center justify-between"><p className="text-[11px] text-[#8A928E]">팀 공유노트에 ‘스킨 제안’으로 올라가요.</p><span className="text-[10px] text-[#9AA19D]">{skinRequest.length}/180</span></div>{skinRequestError && <p role="alert" className="mt-2 text-[12px] font-bold text-[#A33A2C]">{skinRequestError}</p>}<button type="button" disabled={skinRequestBusy || !skinRequest.trim()} onClick={submitSkinRequest} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0C2A23] text-[15px] font-extrabold text-white disabled:bg-[#AEB6B2]"><Send className="h-4 w-4" />{skinRequestBusy ? '남기는 중…' : '이 느낌으로 만들어주세요'}</button></div> : <div className="mt-5 rounded-2xl bg-[#F5F7F5] p-5 text-center"><p className="text-[14px] font-bold">직원 로그인 후 의견을 남길 수 있어요.</p><Link to="/schedule/login" className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0C2A23] px-5 text-[14px] font-extrabold text-white">로그인하기</Link></div>}
            </section>
          </div>
        )}

        {import.meta.env.DEV && (
          <section className="mt-10 rounded-[20px] border border-dashed border-[#B9C1BD] bg-white p-4" aria-label="시제품 상태 검증 도구">
            <p className="text-[12px] font-bold text-[#5F6863]">개발 검증 도구 · 운영 화면에는 표시되지 않음</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {scenarios.map((item) => <button key={item.id} type="button" onClick={() => setTestScenario(item.id)} className={`min-h-10 rounded-xl px-3 text-[12px] font-bold ${scenario === item.id ? 'bg-[#0C2A23] text-white' : 'bg-[#EEF1EF] text-[#434B47]'}`}>{item.label}</button>)}
            </div>
            <p className="mt-3 text-[12px] text-[#7B837F]">검증 기준: {scenarioConfig.now.replace('T', ' ').slice(0, 16)} KST</p>
          </section>
        )}
      </div>
    </main>
  );
}
