import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function ChristmasWaitlistForm({ date, time, guests, english, onBack }: { date: string; time: string; guests: number; english: boolean; onBack: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [requestKey] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [error, setError] = useState('');
  const text = (ko: string, en: string) => english ? en : ko;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || busy) return;
    setBusy(true); setError('');
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('christmas-2026-reservation', { body: { action: 'waitlist', requestKey, date, time, guests, name, phone } });
      if (!invokeError && data?.status === 'received' && Number.isInteger(data.position)) { setPosition(data.position); return; }
      if (invokeError?.context instanceof Response) {
        const body = await invokeError.context.json().catch(() => null);
        if (body?.error === 'DUPLICATE') { setError(text('이미 해당 회차의 대기 신청이 있습니다.', 'A waitlist request already exists for this seating.')); return; }
        if (body?.error === 'AVAILABLE') { setError(text('예약 가능한 자리가 생겼습니다. 예약 화면에서 다시 확인해 주세요.', 'A table is now available. Please return to reservations.')); return; }
      }
      setError(text('신청 결과를 확인하지 못했습니다. 같은 화면에서 다시 시도하거나 매장에 문의해 주세요.', 'We could not confirm your request. Retry on this screen or contact the restaurant.'));
    } catch { setError(text('신청 결과를 확인하지 못했습니다. 같은 화면에서 다시 시도하거나 매장에 문의해 주세요.', 'We could not confirm your request. Retry on this screen or contact the restaurant.')); }
    finally { setBusy(false); }
  };
  return <section className="christmas-reservation-form"><h1>{text('대기 신청', 'Join the waitlist')}</h1><p>{date} · {time} · {guests}{text('명', ' guests')}</p>{position !== null ? <div role="status"><h2>{text('대기 신청이 접수되었습니다.', 'Your waitlist request has been received.')}</h2><p>{text(`대기 순번 ${position}번`, `Waitlist number ${position}`)}</p><p>{text('빈자리가 생기면 매장에서 직접 연락드립니다. 예약 확정은 아닙니다.', 'Our team will contact you if a table becomes available. This is not a confirmed reservation.')}</p></div> : <form onSubmit={submit}><label>{text('예약자 이름', 'Guest name')}<input required maxLength={80} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} /></label><label>{text('연락처', 'Phone number')}<input required type="tel" maxLength={32} autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>{error && <p role="alert">{error}</p>}<button type="submit" disabled={busy}>{busy ? text('신청 중…', 'Submitting…') : text('대기 신청', 'Join waitlist')}</button></form>}<button type="button" onClick={onBack}>{text('예약 안내로 돌아가기', 'Back to reservations')}</button></section>;
}
