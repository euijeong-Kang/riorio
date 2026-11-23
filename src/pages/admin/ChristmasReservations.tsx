import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { signInScheduleAdmin } from '../schedule/scheduleBackend';
import { createChristmasAdminApi, type ChristmasReservation } from '../../reservation/christmas-admin-api.mjs';
import { summarizeReservations } from '../../reservation/dashboard-summary.mjs';
import { ChristmasWaitlist } from './ChristmasWaitlist';

export function ChristmasReservations() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [rows, setRows] = useState<ChristmasReservation[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const load = async () => {
    if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.');
    setRows(await createChristmasAdminApi(supabase).list());
  };
  useEffect(() => {
    let active = true;
    if (supabase) void supabase.auth.getUser().then(async ({ data, error }) => {
      if (!active || error || !data.user || !supabase) return;
      try {
        const { data: role, error: roleError } = await supabase.from('schedule_admins').select('user_id').eq('user_id', data.user.id).maybeSingle();
        if (active && !roleError && role) await load();
      } catch { if (active) setError('예약 목록을 불러오지 못했습니다.'); }
    });
    return () => { active = false; };
  }, []);
  const login = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await signInScheduleAdmin(loginId, password); setPassword(''); await load(); }
    catch { setError('관리자 로그인 또는 예약 조회에 실패했습니다.'); }
    finally { setBusy(false); }
  };
  const act = async (row: ChristmasReservation, action: 'confirmed' | 'cancelled') => {
    if (!supabase || !window.confirm(action === 'confirmed' ? '계좌 입금을 확인하고 이 예약을 확정하시겠습니까?' : '이 예약을 취소하시겠습니까? 환불은 별도로 처리해야 합니다.')) return;
    setBusy(true); setError('');
    try {
      const result = await createChristmasAdminApi(supabase).update(row.id, action, checked[row.id] === true);
      if (!['confirmed', 'cancelled', 'already_confirmed', 'already_cancelled'].includes(result)) throw new Error('상태 변경 불가');
      await load();
    } catch { setError('예약 상태를 변경하지 못했습니다. 다시 확인해 주세요.'); }
    finally { setBusy(false); }
  };
  if (rows === null) return <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5"><h2 className="text-lg font-bold">2026 크리스마스 예약 관리</h2><form onSubmit={login} className="mt-3 flex flex-wrap gap-2"><label>관리자 아이디 <input value={loginId} onChange={(event) => setLoginId(event.target.value)} autoComplete="username" required className="border p-2" /></label><label>비밀번호 <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required className="border p-2" /></label><button disabled={busy} className="rounded bg-gray-800 px-3 py-2 text-white">인증 후 조회</button></form>{error && <p role="alert" className="mt-3 text-red-700">{error}</p>}</section>;
  const summary = summarizeReservations(rows);
  return <section className="mt-5"><div className="flex items-center justify-between gap-4"><h2 className="text-lg font-bold">2026 크리스마스 예약 관리</h2><button type="button" disabled={busy} onClick={() => { setBusy(true); load().catch(() => setError('예약 목록을 불러오지 못했습니다.')).finally(() => setBusy(false)); }} className="rounded bg-gray-100 px-3 py-2">새로고침</button></div>
    <div className="my-4 flex flex-wrap gap-4 rounded-lg border border-gray-200 bg-white p-4 text-sm"><span>총 예약: <strong>{summary.activeCount}건</strong></span><span>총인원: <strong>{summary.totalGuests}명</strong></span><span>확정인원: <strong>{summary.confirmedGuests}명</strong></span><span>대기인원: <strong>{summary.pendingGuests}명</strong></span><span>예상매출: <strong>{summary.revenue.toLocaleString('ko-KR')}원</strong></span></div>
    {rows.length === 0 && <p className="rounded-xl bg-white p-8 text-center text-gray-600">접수된 예약이 없습니다.</p>}
    {summary.groups.map(([key, items]) => <div key={key} className="mb-5 overflow-hidden rounded-xl border border-gray-200 bg-white"><h3 className="bg-amber-700 px-4 py-3 font-bold text-white">{key.replace('_', ' · ')} <span className="text-sm font-normal">({items.filter((row) => row.status !== 'cancelled').length}건)</span></h3><div className="divide-y divide-gray-200">{items.map((row) => <article key={row.id} className="p-4"><p className="font-semibold">{row.name} · {row.guests}명 · {row.status === 'pending' ? '입금 확인 대기' : row.status === 'confirmed' ? '예약 확정' : '취소'}</p><p className="mt-1 text-sm text-gray-700">{row.phone} · 페어링 {row.pairing_guests}명 · 예약금 {(row.guests * row.deposit_per_guest).toLocaleString('ko-KR')}원</p><p className="mt-1 text-sm text-gray-600">입금 기한: {new Date(row.transfer_deadline).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>{row.status === 'pending' && <label className="mr-3"><input type="checkbox" checked={checked[row.id] === true} onChange={(event) => setChecked({ ...checked, [row.id]: event.target.checked })} /> 입금 확인</label>}{row.status === 'pending' && <button type="button" disabled={busy || !checked[row.id]} onClick={() => act(row, 'confirmed')} className="mr-3 underline disabled:opacity-40">예약 확정</button>}{row.status !== 'cancelled' && <button type="button" disabled={busy} onClick={() => act(row, 'cancelled')} className="underline">예약 취소</button>}</article>)}</div></div>)}
    {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}<ChristmasWaitlist /></section>;
}
