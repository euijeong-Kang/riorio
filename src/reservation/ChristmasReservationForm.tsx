import { useEffect, useState } from 'react';
import { christmas } from '../pages/public/event';
import { supabase } from '../lib/supabase';
import './christmas-reservation-form.css';

const attemptKey = 'riorio.christmas2026.reservation.submitted';

export function ChristmasReservationForm({ english = false, previewOnly = false, previewCompletion = false }: { english?: boolean; previewOnly?: boolean; previewCompletion?: boolean }) {
  const [date, setDate] = useState(previewOnly && previewCompletion ? '2026-12-24' : '');
  const [time, setTime] = useState(previewOnly && previewCompletion ? '17:30' : '');
  const [guests, setGuests] = useState(2);
  const [pairingGuests, setPairingGuests] = useState(0);
  const [availability, setAvailability] = useState<Record<string, number | null> | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<'idle' | 'received' | 'confirmed' | 'cancelled' | 'uncertain' | 'invalid' | 'soldout' | 'duplicate'>(() => {
    if (previewOnly) return previewCompletion ? 'received' : 'idle';
    try { return sessionStorage.getItem(attemptKey) ? 'uncertain' : 'idle'; }
    catch { return 'uncertain'; }
  });
  const text = (ko: string, en: string) => english ? en : ko;
  const total = guests * christmas.coursePrice + pairingGuests * christmas.pairingPrice;
  const deposit = guests * christmas.depositPerGuest;

  useEffect(() => {
    let active = true;
    setAvailability(null);
    if (previewOnly || !date || !supabase) { setAvailabilityLoading(false); return () => { active = false; }; }
    setAvailabilityLoading(true);
    supabase.functions.invoke('christmas-2026-reservation', { body: { action: 'availability', date, guests } }).then(({ data, error }) => {
      if (!active) return;
      const counts = data?.availability;
      if (!error && counts && christmas.startTimes.every((item) => counts[item] === null || (Number.isInteger(counts[item]) && counts[item] >= 0 && counts[item] <= 5))) {
        setAvailability(counts);
        setTime((current) => current && (counts[current] === null || counts[current] === 0) ? '' : current);
      }
    }).catch(() => {}).finally(() => { if (active) setAvailabilityLoading(false); });
    return () => { active = false; };
  }, [date, guests, previewOnly]);

  const checkStatus = async () => {
    if (!supabase || busy) return;
    setBusy(true);
    try {
      const requestKey = sessionStorage.getItem(attemptKey);
      if (!requestKey) return;
      const { data, error } = await supabase.functions.invoke('christmas-2026-reservation', { body: { action: 'status', requestKey } });
      if (error || !data || ![2, 3, 4].includes(data.guests)) return;
      setGuests(data.guests);
      if (data.status === 'pending') setResult('received');
      if (data.status === 'confirmed') setResult('confirmed');
      if (data.status === 'cancelled') setResult('cancelled');
    } catch { return; }
    finally { setBusy(false); }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (previewOnly || busy || !supabase || !agreed) return;
    if (!name.trim() || !/^[0-9]{10,11}$/.test(phone.replace(/[\s-]/g, ''))) { setResult('invalid'); return; }
    let requestKey: string;
    try {
      if (sessionStorage.getItem(attemptKey)) { setResult('uncertain'); return; }
      requestKey = crypto.randomUUID();
      sessionStorage.setItem(attemptKey, requestKey);
      if (sessionStorage.getItem(attemptKey) !== requestKey) throw new Error('Storage unavailable');
    } catch { setResult('uncertain'); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('christmas-2026-reservation', { body: { requestKey, date, time, guests, pairingGuests, name, phone, termsAccepted: true, expectedCoursePrice: christmas.coursePrice, expectedPairingPrice: christmas.pairingPrice, expectedDepositPerGuest: christmas.depositPerGuest } });
      if (!error && data?.status === 'received') { setResult('received'); return; }
      if (error?.context instanceof Response) {
        const response = error.context;
        const body = await response.json().catch(() => null);
        if ((response.status === 400 && body?.error === 'INVALID_REQUEST') || (response.status === 409 && ['SOLD_OUT', 'DUPLICATE_PHONE'].includes(body?.error))) {
          if (sessionStorage.getItem(attemptKey) === requestKey) sessionStorage.removeItem(attemptKey);
          setResult(response.status === 400 ? 'invalid' : body?.error === 'DUPLICATE_PHONE' ? 'duplicate' : 'soldout');
          return;
        }
      }
      setResult('uncertain');
    } catch { setResult('uncertain'); }
    finally { setBusy(false); }
  };

  if (result === 'received') return <main className="christmas-reservation-form christmas-reservation-result" role="status">
    <header className="christmas-reservation-header"><a href={english ? '/en/' : '/'}>RIORIO</a><span>CHRISTMAS 2026</span></header>
    <div className="reservation-result-content">
      <div className="reservation-result-intro"><p className="reservation-result-kicker">CHRISTMAS AT RIORIO</p><span className="reservation-result-mark" aria-hidden="true">✳</span><h1>{text('신청이 접수되었습니다.', 'Your request has been received.')}</h1><p>{text('소중한 분과 함께할 식탁을 준비하겠습니다.', 'We look forward to preparing your table.')}</p><p className="reservation-result-status">{text('입금 확인 후 관리자가 승인하면 예약이 확정됩니다.', 'Your reservation is confirmed after our team checks your transfer.')}</p></div>
      <div className="reservation-result-details">
        {date && time && <section className="reservation-result-section"><p className="reservation-result-kicker">YOUR CHRISTMAS TABLE</p><h2>{text('신청 내역', 'Your request')}</h2><dl><div><dt>{text('날짜와 회차', 'Date and seating')}</dt><dd>{date} · {time}</dd></div><div><dt>{text('방문 인원', 'Guests')}</dt><dd>{text(`${guests}명`, `${guests} guests`)}</dd></div><div><dt>{text('와인 페어링', 'Wine pairing')}</dt><dd>{text(`${pairingGuests}명`, `${pairingGuests} guests`)}</dd></div><div><dt>{text('총 식사 금액', 'Dining total')}</dt><dd>₩{total.toLocaleString('ko-KR')}</dd></div></dl></section>}
        <section className="reservation-result-section reservation-result-deposit"><p className="reservation-result-kicker">DEPOSIT INFORMATION</p><h2>{text('예약금 안내', 'Deposit details')}</h2><p>{text('신청 후 2시간 이내에 입금해 주세요.', 'Please transfer within 2 hours of your request.')}</p><div className="reservation-result-amount"><span>{text('입금하실 예약금', 'Deposit to transfer')}</span><strong>₩{deposit.toLocaleString('ko-KR')}</strong></div><dl><div><dt>{text('입금 계좌', 'Bank account')}</dt><dd>{text('국민은행', 'KB Kookmin Bank')}<br /><strong>756001-00-178779</strong></dd></div><div><dt>{text('예금주', 'Account holder')}</dt><dd>강의정(리오리오(RIORIO))</dd></div></dl><p className="reservation-result-note">{text('잔액은 방문 시 매장에서 결제합니다.', 'The balance is paid at the restaurant.')}</p></section>
      </div><p className="reservation-result-closing">{text('소중한 사람과 함께할 따뜻한 순간, 리오리오에서 기다리겠습니다.', 'A warm moment with someone special awaits you at RIORIO.')}</p><a className="reservation-result-return" href={english ? '/en/events/christmas-2026/' : '/events/christmas-2026/'}>{text('행사 안내로 돌아가기', 'Return to event details')} <span aria-hidden="true">→</span></a>
    </div>
  </main>;
  if (result === 'confirmed' || result === 'cancelled') return <section className="christmas-reservation-form" role="status"><h1>{result === 'confirmed' ? text('예약이 확정되었습니다.', 'Your reservation is confirmed.') : text('예약이 취소되었습니다.', 'Your reservation was cancelled.')}</h1><p>{text('자세한 사항은 매장으로 문의해 주세요.', 'Please contact the restaurant for details.')}</p></section>;
  if (result === 'uncertain') return <section className="christmas-reservation-form" role="alert"><h1>{text('신청 상태를 확인해 주세요.', 'Please check your request status.')}</h1><p>{text('접수 여부를 확인할 수 없습니다. 중복 신청을 막기 위해 다시 신청하지 말고 상태를 확인하거나 매장으로 문의해 주세요.', 'We cannot confirm whether your request was received. Check its status or contact the restaurant before submitting again.')}</p><button type="button" disabled={busy} onClick={checkStatus}>{busy ? text('확인 중…', 'Checking…') : text('신청 상태 확인', 'Check request status')}</button></section>;

  return <form className="christmas-reservation-form" onSubmit={submit}>
    {previewOnly && <p role="status">{text('개발용 시안 · 실제 예약 불가', 'DEVELOPMENT PREVIEW · NO BOOKINGS')}</p>}
    <header className="christmas-reservation-header"><a href={english ? '/en/' : '/'}>RIORIO</a><span>CHRISTMAS 2026</span></header>
    <div className="christmas-reservation-heading"><p>CHRISTMAS AT RIORIO</p><h1>{text('함께할 자리를 준비합니다.', 'Let’s prepare your place at the table.')}</h1><p>{text('소중한 사람과 마주 앉을 날과 시간을 골라주세요.', 'Choose a day and time to share with someone special.')}</p></div>
    {result === 'invalid' && <p role="alert">{text('신청 정보를 확인해 주세요.', 'Please check your request details.')}</p>}
    {result === 'soldout' && <p role="alert">{text('선택한 회차가 마감되었습니다. 다른 회차를 선택해 주세요.', 'This seating is full. Please choose another.')}</p>}
    {result === 'duplicate' && <p role="alert">{text('같은 연락처로 해당 회차에 이미 신청한 내역이 있습니다. 매장으로 문의해 주세요.', 'A request for this seating already exists for this phone number. Please contact the restaurant.')}</p>}
    <div className="christmas-reservation-layout"><div>
    <section className="christmas-reservation-section"><p>01 · YOUR VISIT</p><h2>{text('함께할 날을 골라주세요.', 'Choose your day.')}</h2>
    <fieldset className="christmas-reservation-choices"><legend>{text('날짜', 'Date')}</legend><div className="christmas-reservation-choice-grid christmas-reservation-date-grid">{christmas.dates.map((item) => <label key={item} className="christmas-reservation-choice"><input type="radio" name="date" value={item} required checked={date === item} onChange={() => { setDate(item); setTime(''); }} /><span>{english ? (item.endsWith('24') ? 'December 24' : 'December 25') : (item.endsWith('24') ? '12월 24일' : '12월 25일')}</span></label>)}</div></fieldset>
    <fieldset className="christmas-reservation-choices"><legend>{text('시작 시각 · 100분', 'Start time · 100 minutes')}</legend><div className="christmas-reservation-choice-grid christmas-reservation-time-grid">{christmas.startTimes.map((item) => { const count = availability?.[item]; const unavailable = availability !== null && (count === 0 || count === null); return <label key={item} className="christmas-reservation-choice"><input type="radio" name="time" value={item} required checked={time === item} disabled={unavailable} onChange={() => setTime(item)} /><span>{item}{availability !== null && <small>{count === null ? text('종료', 'Closed') : count === 0 ? text('마감', 'Full') : text(`${count}건 가능`, `${count} left`)}</small>}</span></label>; })}</div>{date && <p className="christmas-reservation-availability" role="status">{availabilityLoading ? text('예약 가능 수 확인 중', 'Checking availability') : availability ? text('선택 인원 기준 예약 가능 건수입니다. 접수 시 다시 확인합니다.', 'Availability is for your party size and is checked again on submission.') : text('예약 가능 수는 현재 확인할 수 없습니다.', 'Availability is currently unavailable.')}</p>}</fieldset>
    <label>{text('방문 인원 · 기본 2명', 'Guests · default 2')}<select value={guests} onChange={(event) => { const next = Number(event.target.value); setPairingGuests(pairingGuests === guests ? next : Math.min(pairingGuests, next)); setGuests(next); setTime(''); }}>{[2, 3, 4].map((item) => <option key={item} value={item}>{item}{text('명', ' guests')}</option>)}</select></label>
    </section><section className="christmas-reservation-section"><p>02 · WINE PAIRING</p><h2>{text('식탁에 더하는 네 잔', 'Four glasses for the table')}</h2><p>{text('첫 건배부터 달콤한 마무리까지.', 'From the first toast to a sweet finish.')}</p><p>{text('까바, 화이트, 레드, 디저트 와인으로 이어지는 네 잔의 페어링을 준비합니다.', 'A four-glass pairing of cava, white, red and dessert wine.')}</p><p>{text(`와인 4잔 페어링 · 1인 ${christmas.pairingPrice.toLocaleString('ko-KR')}원 추가`, `Four-wine pairing · KRW ${christmas.pairingPrice.toLocaleString('en-US')} per person`)}</p>
    <div className="christmas-reservation-pairing-actions" role="group" aria-label={text('페어링 빠른 선택', 'Quick pairing selection')}><button type="button" aria-pressed={pairingGuests === 0} onClick={() => setPairingGuests(0)}>{text('선택 안 함', 'None')}</button><button type="button" aria-pressed={pairingGuests === guests} onClick={() => setPairingGuests(guests)}>{text('모두 선택', 'Select all')}</button></div>
    <label>{text('와인 페어링 선택 인원', 'Guests choosing wine pairing')}<select value={pairingGuests} onChange={(event) => setPairingGuests(Number(event.target.value))}>{Array.from({ length: guests + 1 }, (_, index) => <option key={index} value={index}>{index}{text('명', ' guests')}</option>)}</select></label>
    <small className="christmas-reservation-pairing-note">{text('와인 페어링은 추후에도 선택하실 수 있습니다.', 'Wine pairing can also be selected later.')}</small>
    <p>{text('페어링 외에도 매장에서 준비된 음료와 주류를 추가 주문하실 수 있습니다.', 'Additional drinks and alcoholic beverages are available at the restaurant.')}</p></section>
    <section className="christmas-reservation-section"><p>03 · YOUR DETAILS</p><h2>{text('예약 안내를 받으실 분', 'Your contact details')}</h2>
    <label>{text('예약자 이름', 'Guest name')}<input required maxLength={80} value={name} autoComplete="name" onChange={(event) => setName(event.target.value)} /></label>
    <label>{text('연락처', 'Phone number')}<input required type="tel" maxLength={32} value={phone} autoComplete="tel" onChange={(event) => setPhone(event.target.value)} /></label>
    </section></div><aside className="christmas-reservation-summary"><p>YOUR CHRISTMAS TABLE</p><h2>{text('준비할 내용을 확인해주세요.', 'Review your selection.')}</h2><dl><div><dt>{text('날짜와 회차', 'Date and seating')}</dt><dd>{date || '—'} {time}</dd></div><div><dt>{text('이용 시간', 'Dining time')}</dt><dd>{text('100분', '100 minutes')}</dd></div><div><dt>{text('방문 인원', 'Guests')}</dt><dd>{guests}</dd></div><div><dt>{text('페어링 선택', 'Wine pairing')}</dt><dd>{pairingGuests}</dd></div><div><dt>{text('총 식사 금액', 'Dining total')}</dt><dd>₩{total.toLocaleString('ko-KR')}</dd></div><div><dt>{text('예약금', 'Deposit')}</dt><dd>₩{deposit.toLocaleString('ko-KR')}</dd></div><div><dt>{text('잔여 금액', 'Remaining amount')}</dt><dd>₩{(total - deposit).toLocaleString('ko-KR')}</dd></div></dl>
    <p>{text('신청 후 2시간 이내 예약금을 입금해 주세요. 잔액은 매장에서 결제합니다.', 'Transfer the deposit within 2 hours of your request. The balance is paid at the restaurant.')}</p>
    <p>{text('3일 전까지 취소 시 전액 환불하며, 세부 기준은 추가 안내합니다.', 'Cancellations up to three days before receive a full refund; further details will be provided.')}</p>
    <label className="christmas-reservation-check"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />{text('예약금과 신청 후 승인 안내를 확인했습니다.', 'I have reviewed the deposit and approval information.')}</label>
    <button type="submit" disabled={previewOnly || busy || !agreed || !supabase}>{busy ? text('신청 중…', 'Submitting…') : text('예약 신청', 'Request reservation')}</button></aside></div>
  </form>;
}
