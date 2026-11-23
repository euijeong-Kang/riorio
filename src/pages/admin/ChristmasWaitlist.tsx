import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type WaitlistEntry = { id: string; name: string; phone: string; reservation_date: string; reservation_time: string; guests: number; position: number; status: string };

export function ChristmasWaitlist() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [error, setError] = useState('');
  const load = async () => {
    if (!supabase) return;
    const { data, error: queryError } = await supabase.from('christmas_waitlist_2026').select('id,name,phone,reservation_date,reservation_time,guests,position,status').order('reservation_date').order('reservation_time').order('position');
    if (queryError) { setError('대기열을 불러오지 못했습니다.'); return; }
    setError(''); setEntries(data ?? []);
  };
  const update = async (entry: WaitlistEntry, status: 'contacted' | 'cancelled') => {
    if (!supabase || !window.confirm(status === 'contacted' ? '직접 연락을 완료했나요? 이 버튼은 문자를 발송하지 않습니다.' : '대기 신청을 취소할까요?')) return;
    const { data, error: updateError } = await supabase.rpc('christmas_waitlist_admin_action_2026', { p_waitlist_id: entry.id, p_status: status });
    if (updateError || data !== status) { setError('대기 상태를 변경하지 못했습니다.'); return; }
    await load();
  };
  useEffect(() => { void load(); }, []);
  return <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">2026 대기열</h2><button type="button" onClick={() => void load()} className="underline">새로고침</button></div>{error && <p role="alert">{error}</p>}{!error && entries.length === 0 ? <p className="mt-3 text-gray-600">대기 신청이 없습니다.</p> : entries.map((entry) => <article key={entry.id} className="border-t py-3"><p className="font-semibold">{entry.reservation_date} {entry.reservation_time.slice(0, 5)} · {entry.position}번 · {entry.guests}명</p><p>{entry.name} · {entry.phone} · {entry.status === 'waiting' ? '대기 중' : entry.status === 'contacted' ? '연락 완료' : '취소'}</p>{entry.status === 'waiting' && <div className="mt-2 flex gap-4"><button type="button" onClick={() => void update(entry, 'contacted')} className="underline">직접 연락 완료</button><button type="button" onClick={() => void update(entry, 'cancelled')} className="underline">대기 취소</button></div>}</article>)}</section>;
}
