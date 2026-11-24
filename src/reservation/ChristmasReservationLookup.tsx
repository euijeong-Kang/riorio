import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { christmas } from '../pages/public/event';
import { readReservationReference } from './reservation-reference';
import './christmas-reservation-form.css';

type LookupState = 'loading' | 'missing' | 'unavailable' | 'pending' | 'confirmed' | 'cancelled';

export default function ChristmasReservationLookup({ english = false }: { english?: boolean }) {
  const [status, setStatus] = useState<LookupState>('loading');
  const [guests, setGuests] = useState<number | null>(null);
  const text = (ko: string, en: string) => english ? en : ko;
  const check = async () => {
    setStatus('loading');
    try {
      const requestKey = readReservationReference();
      if (!requestKey) { setStatus('missing'); return; }
      if (!supabase) { setStatus('unavailable'); return; }
      const { data, error } = await supabase.functions.invoke('christmas-2026-reservation', { body: { action: 'status', requestKey } });
      if (error || !data || !['pending', 'confirmed', 'cancelled'].includes(data.status) || ![2, 3, 4].includes(data.guests)) { setStatus('unavailable'); return; }
      setGuests(data.guests); setStatus(data.status);
    } catch { setStatus('unavailable'); }
  };
  useEffect(() => { void check(); }, []);
  return <main className="christmas-reservation-form christmas-reservation-result"><header className="christmas-reservation-header"><Link to={english ? '/en/' : '/'}>RIORIO</Link><span>CHRISTMAS 2026</span></header><div className="reservation-result-content"><div className="reservation-result-intro"><p className="reservation-result-kicker">YOUR CHRISTMAS TABLE</p><h1>{text('나의 예약 확인', 'Check your reservation')}</h1><p>{text('신청한 브라우저에서 예약 상태를 확인합니다.', 'Check your reservation status in the browser used to submit it.')}</p></div><section className="reservation-result-section" aria-live="polite">
    {status === 'loading' && <p>{text('예약 상태를 확인하고 있습니다.', 'Checking your reservation status.')}</p>}
    {status === 'missing' && <p>{text('이 브라우저에 저장된 예약 정보가 없습니다. 다른 기기나 브라우저에서 신청했거나 저장 정보가 삭제된 경우 매장으로 문의해 주세요.', 'No reservation reference was found in this browser. If you used another device or browser, or cleared its data, please contact the restaurant.')}</p>}
    {status === 'unavailable' && <p role="alert">{text('예약 상태를 확인할 수 없습니다. 다시 시도하거나 매장으로 문의해 주세요.', 'We could not retrieve your status. Please retry or contact the restaurant.')}</p>}
    {status === 'pending' && <><h2>{text('신청 접수 · 입금 확인 대기', 'Request received · awaiting transfer review')}</h2><p>{text('아직 예약이 확정되지 않았습니다. 입금 확인 후 관리자가 승인하면 예약이 확정됩니다.', 'Your reservation is not yet confirmed. Our team will confirm it after checking your transfer.')}</p>{guests !== null && <p>{text('예약금', 'Deposit')}: ₩{(guests * christmas.depositPerGuest).toLocaleString('ko-KR')}</p>}<p>{text('국민은행 756001-00-178779 · 강의정(리오리오(RIORIO))', 'KB Kookmin Bank 756001-00-178779 · 강의정(리오리오(RIORIO))')}</p><p>{text('신청 후 2시간 이내에 입금해 주세요.', 'Please transfer within two hours of your request.')}</p></>}
    {status === 'confirmed' && <h2>{text('예약이 확정되었습니다.', 'Your reservation is confirmed.')}</h2>}
    {status === 'cancelled' && <h2>{text('예약이 취소되었습니다.', 'Your reservation was cancelled.')}</h2>}
    {status !== 'loading' && <button type="button" onClick={() => void check()}>{text('다시 확인', 'Check again')}</button>}
  </section><Link className="reservation-result-return" to={english ? '/en/events/christmas-2026/' : '/events/christmas-2026/'}>{text('행사 안내로 돌아가기', 'Return to event details')}</Link></div></main>;
}
