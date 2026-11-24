import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './christmas-reservation-form.css';

type Reservation = { date: string; time: string; guests: number; pairingGuests: number; status: 'pending' | 'confirmed' | 'cancelled'; coursePrice: number; pairingPrice: number; depositPerGuest: number; transferDeadline: string };

export default function ChristmasReservationLookup({ english = false }: { english?: boolean }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<Reservation[] | null>(null);
  const text = (ko: string, en: string) => english ? en : ko;
  const search = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError(''); setResults(null);
    const normalizedPhone = phone.replace(/[\s-]/g, '');
    if (!name.trim() || !/^[0-9]{10,11}$/.test(normalizedPhone)) { setError(text('성함과 전화번호를 확인해 주세요.', 'Please check your name and phone number.')); return; }
    if (!supabase) { setError(text('조회 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.', 'The lookup service is unavailable. Please try again later.')); return; }
    setBusy(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('christmas-2026-reservation', { body: { action: 'lookup', name: name.trim(), phone: normalizedPhone } });
      if (invokeError?.context instanceof Response && invokeError.context.status === 429) { setError(text('조회 요청이 많습니다. 잠시 후 다시 시도해 주세요.', 'Too many lookup attempts. Please try again later.')); return; }
      if (invokeError || !Array.isArray(data?.reservations)) throw new Error('Lookup unavailable');
      setResults(data.reservations);
    } catch { setError(text('예약을 조회하지 못했습니다. 잠시 후 다시 시도해 주세요.', 'We could not retrieve your reservation. Please try again later.')); }
    finally { setBusy(false); }
  };
  return <main className="christmas-reservation-form christmas-reservation-result"><header className="christmas-reservation-header"><Link to={english ? '/en/' : '/'}>RIORIO</Link><span>CHRISTMAS 2026</span></header><div className="reservation-result-content"><div className="reservation-result-intro"><p className="reservation-result-kicker">YOUR CHRISTMAS TABLE</p><h1>{text('나의 예약 확인', 'Check your reservation')}</h1><p>{text('예약 신청 시 입력한 성함과 전화번호를 입력해 주세요.', 'Enter the name and phone number used for your request.')}</p></div><section className="reservation-result-section"><form onSubmit={search}><label>{text('예약자 성함', 'Reservation name')}<input required maxLength={80} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} /></label><label>{text('전화번호', 'Phone number')}<input required type="tel" maxLength={32} autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label><button type="submit" disabled={busy}>{busy ? text('조회 중…', 'Searching…') : text('예약 조회', 'Find reservation')}</button></form>{error && <p role="alert">{error}</p>}</section>
    <section className="reservation-result-section" aria-live="polite">{results?.length === 0 && <p>{text('일치하는 예약이 없습니다. 입력한 정보를 확인하거나 매장으로 문의해 주세요.', 'No matching reservation was found. Please check your details or contact the restaurant.')}</p>}{results?.map((reservation, index) => <article key={`${reservation.date}-${reservation.time}-${index}`}><h2>{reservation.status === 'pending' ? text('신청 접수 · 입금 확인 대기', 'Request received · awaiting transfer review') : reservation.status === 'confirmed' ? text('예약 확정', 'Reservation confirmed') : text('예약 취소', 'Reservation cancelled')}</h2><dl><div><dt>{text('날짜와 회차', 'Date and seating')}</dt><dd>{reservation.date} · {reservation.time.slice(0, 5)}</dd></div><div><dt>{text('방문 인원', 'Guests')}</dt><dd>{reservation.guests}{text('명', ' guests')}</dd></div><div><dt>{text('와인 페어링', 'Wine pairing')}</dt><dd>{reservation.pairingGuests}{text('명', ' guests')}</dd></div><div><dt>{text('총 식사 금액', 'Dining total')}</dt><dd>₩{(reservation.guests * reservation.coursePrice + reservation.pairingGuests * reservation.pairingPrice).toLocaleString('ko-KR')}</dd></div><div><dt>{text('예약금', 'Deposit')}</dt><dd>₩{(reservation.guests * reservation.depositPerGuest).toLocaleString('ko-KR')}</dd></div></dl>{reservation.status === 'pending' && <><p>{text('입금 확인 후 관리자가 승인하면 예약이 확정됩니다.', 'Your reservation is confirmed after our team checks your transfer.')}</p><p>{text('입금 기한', 'Transfer deadline')}: {new Date(reservation.transferDeadline).toLocaleString(english ? 'en-US' : 'ko-KR', { timeZone: 'Asia/Seoul' })} {text('(한국 시간)', '(Korea time)')}</p><p>{text('국민은행 756001-00-178779 · 강의정(리오리오(RIORIO))', 'KB Kookmin Bank 756001-00-178779 · 강의정(리오리오(RIORIO))')}</p></>}</article>)}</section><Link className="reservation-result-return" to={english ? '/en/events/christmas-2026/' : '/events/christmas-2026/'}>{text('행사 안내로 돌아가기', 'Return to event details')}</Link></div></main>;
}
