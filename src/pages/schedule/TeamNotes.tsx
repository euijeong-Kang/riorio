import { useEffect, useState } from 'react';
import { LogIn, MessageCircleMore, PenLine, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Employee } from './data';
import { createScheduleTeamNote, getEmployeeSession, isSupabaseScheduleConfigured, loadScheduleTeamNotes, type ScheduleTeamNote } from './scheduleBackend';

export default function TeamNotes({ weekStart, employees, nicknames, emojis }: { weekStart: string; employees: Employee[]; nicknames: Record<string, string>; emojis: Record<string, string> }) {
  const [notes, setNotes] = useState<ScheduleTeamNote[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const refresh = () => loadScheduleTeamNotes(weekStart).then(setNotes).catch(() => setError('공유노트를 불러오지 못했습니다.'));

  useEffect(() => {
    refresh();
    const onNoteCreated = () => refresh();
    window.addEventListener('riorio:schedule-note-created', onNoteCreated);
    return () => window.removeEventListener('riorio:schedule-note-created', onNoteCreated);
  }, [weekStart]);
  useEffect(() => { if (isSupabaseScheduleConfigured) getEmployeeSession().then((session) => setSignedIn(Boolean(session))); }, []);

  const submit = async () => {
    if (!content.trim()) return;
    setBusy(true); setError('');
    try { await createScheduleTeamNote(weekStart, content.trim()); setContent(''); setOpen(false); await refresh(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : '공유노트를 등록하지 못했습니다.'); }
    finally { setBusy(false); }
  };
  const nameFor = (id: string) => nicknames[id] || employees.find((employee) => employee.id === id)?.displayName || '직원';

  return <aside className="relative overflow-hidden rounded-[24px] bg-[#153B32] px-5 py-5 text-white shadow-[0_14px_35px_rgba(12,42,35,0.16)]" aria-labelledby="team-notes-title"><div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#CBB676]/15" aria-hidden="true" /><div className="relative"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[#E4D28F]"><MessageCircleMore className="h-5 w-5" aria-hidden="true" /></div><div><p className="text-[11px] font-bold tracking-[0.08em] text-[#D8C78F]">TEAM NOTE</p><h2 id="team-notes-title" className="text-[19px] font-extrabold">이번 주 공유노트</h2></div></div>{signedIn ? <button type="button" onClick={() => setOpen((value) => !value)} className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 text-[13px] font-extrabold text-[#153B32]"><PenLine className="h-4 w-4" />남기기</button> : <Link to="/schedule/login" className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 text-[13px] font-extrabold text-[#153B32]"><LogIn className="h-4 w-4" />로그인</Link>}</div>{notes.length ? <ul className="mt-4 space-y-2.5">{notes.map((note) => <li key={note.id} className="rounded-2xl bg-white/10 p-3.5"><div className="flex items-center gap-2"><span className="text-[16px]">{emojis[note.employeeId] || '🙂'}</span><strong className="text-[13px]">{nameFor(note.employeeId)}</strong><time className="ml-auto text-[10px] text-white/45">{new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul' }).format(new Date(note.createdAt))}</time></div><p className="mt-2 whitespace-pre-wrap break-words text-[14px] leading-6 text-white/80">{note.content}</p></li>)}</ul> : <p className="mt-4 rounded-2xl bg-white/8 px-4 py-4 text-[13px] leading-6 text-white/65">아직 남겨진 내용이 없어요.<br />교대, 준비사항, 서로에게 전할 말을 공유해 보세요.</p>}{open && <div className="mt-4 rounded-2xl bg-white p-4 text-[#17231F]"><p className="text-[12px] font-bold text-[#587068]">작성자는 로그인한 직원으로 자동 표시됩니다.</p><label className="mt-3 block text-[12px] font-bold">공유할 내용<textarea value={content} onChange={(event) => setContent(event.target.value.slice(0, 200))} maxLength={200} rows={3} placeholder="이번 주 팀이 함께 알면 좋은 내용을 적어주세요" className="mt-1.5 w-full resize-none rounded-xl border border-[#DDE2DF] bg-[#F8F9F8] p-3 text-[14px] leading-6" /></label><div className="mt-1 text-right text-[10px] text-[#8A928E]">{content.length}/200</div>{error && <p className="mt-2 text-[12px] font-bold text-[#A33A2C]" role="alert">{error}</p>}<button type="button" disabled={busy || !content.trim()} onClick={submit} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#153B32] text-[14px] font-extrabold text-white disabled:bg-[#AEB6B2]"><Send className="h-4 w-4" />{busy ? '공유 중…' : '팀에 공유하기'}</button></div>}</div></aside>;
}
