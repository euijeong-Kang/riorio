import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteFooter from '../../../components/SiteFooter';
import ChristmasInvitation from './ChristmasInvitation';
import { christmas, naverReservationUrl, totalPrice } from '../event';
import './christmas.css';

const won = (amount: number) => `₩${amount.toLocaleString('en-US')}`;

function Header({ english }: { english: boolean }) {
  return <header className="xmas-header">
    <Link className="xmas-logo" to={english ? '/en/' : '/'} aria-label={english ? 'RIORIO home' : '리오리오 홈'}>RIORIO</Link>
    <nav aria-label={english ? 'Event navigation' : '행사 메뉴'}>
      <a href="#course">{english ? 'Course' : '코스'}</a>
      <a href="#wine">{english ? 'Wine' : '와인'}</a>
      <a href="#visit">{english ? 'Visit' : '방문 안내'}</a>
      <Link className="xmas-language" to={english ? '/events/christmas-2026/' : '/en/events/christmas-2026/'} lang={english ? 'ko' : 'en'}>{english ? 'KO' : 'EN'}</Link>
    </nav>
  </header>;
}

function Hero({ english }: { english: boolean }) {
  return <section className="xmas-hero">
    <div className="xmas-hero-copy">
      <p className="xmas-kicker">CHRISTMAS AT RIORIO · {christmas.year}</p>
      <h1 id="letter-title" tabIndex={-1}>{english ? <>For the ones<br />you love.</> : <>사랑하는 이와,<br />오래 기억할 식탁.</>}</h1>
      {!english && <p className="xmas-hero-english" lang="en">For the ones you love.</p>}
      <p className="xmas-hero-intro">{english ? 'A Christmas table with Spanish flavours and wine, prepared for sharing.' : <>소중한 사람과 함께하는 크리스마스<br />좀 더 특별하게 스페인의 감성 담았습니다</>}</p>
      <div className="xmas-hero-actions"><a className="xmas-button" href="#course">{english ? 'Explore the course' : '코스 살펴보기'}</a><span>{english ? 'Reservations coming soon' : '예약 준비 중'}</span></div>
    </div>
    <div className="xmas-hero-art"><img src={`${import.meta.env.BASE_URL}images/christmas-plaza-2026.png`} width="1122" height="1402" alt="" /></div>
  </section>;
}

function EventFacts({ english }: { english: boolean }) {
  return <section className="xmas-facts" aria-label={english ? 'Course at a glance' : '코스 요약'}>
    <div><small>THE COURSE</small><strong>{english ? `${christmas.courses.length} courses` : `${christmas.courses.length}코스`}</strong></div>
    <div><small>DINING TIME</small><strong>{english ? `${christmas.durationHours * 60} minutes` : `식사 시간 ${christmas.durationHours * 60}분`}</strong><span className="xmas-facts-note">{english ? 'Including clearing time' : '정리 시간 포함'}</span></div>
    <div><small>PER PERSON</small><strong>{won(christmas.coursePrice)} <span>{english ? 'proposed' : '예정'}</span></strong></div>
  </section>;
}

function CourseMenu({ english }: { english: boolean }) {
  return <section id="course" className="xmas-section xmas-course">
    <div className="xmas-section-heading"><p className="xmas-kicker">THE CHRISTMAS COURSE</p><h2 id="course-title" tabIndex={-1}>{english ? 'Eight little pleasures' : '여덟 번의 작은 즐거움'}</h2><p>{english ? 'Every course is prepared with carefully selected premium ingredients.' : '모든 메뉴는 엄선한 프리미엄 재료로 준비합니다.'}</p></div>
    <ol className="xmas-course-list">{christmas.courses.map((item, index) => <li key={item[0]}>
      <span className="xmas-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <div><span className="xmas-course-type" lang="en">{item[2]}</span><h3>{english ? item[3] : item[1]}</h3><p>{english ? item[5] : item[4]}</p></div>
    </li>)}</ol>
    <p className="xmas-course-notice">{english ? 'The menu may change depending on preparations.' : '메뉴 구성은 준비 상황에 따라 변경될 수 있습니다.'}</p>
  </section>;
}

function WinePairing({ english }: { english: boolean }) {
  return <section id="wine" className="xmas-wine"><div className="xmas-section xmas-wine-inner">
    <div><p className="xmas-kicker">OPTIONAL WINE PAIRING</p><h2>{english ? 'Three glasses for the table' : '식탁에 더하는 세 잔'}</h2><p>{english ? 'An optional pairing of three glasses of wine. The selection will be announced later.' : '선택 추가로 즐기는 와인 3잔 페어링. 와인 구성은 추후 안내합니다.'}</p></div>
    <div className="xmas-wine-prices"><p><span>{english ? 'Wine pairing · per person' : '와인 페어링 · 1인'}</span><strong>+ {won(christmas.pairingPrice)}</strong></p><p><span>{english ? 'Course and pairing · per person' : '코스 포함 · 1인'}</span><strong>{won(totalPrice(christmas))}</strong></p><small>{english ? 'Proposed prices, subject to confirmation.' : '예정가이며 확정 후 안내합니다.'}</small></div>
  </div></section>;
}

function ReservationNotice({ english }: { english: boolean }) {
  return <section id="visit" className="xmas-section xmas-visit"><p className="xmas-kicker">RESERVATIONS & VISIT</p><h2>{english ? 'A seat at our table' : '함께할 날을 기다리며'}</h2><p>{english ? 'Two lunch and two dinner seatings are planned. Dates, start times, capacity, deposit and cancellation terms will be announced once confirmed.' : '점심 2회, 저녁 2회 운영을 계획하고 있습니다. 날짜와 시작 시각, 정원, 예약금과 취소 조건은 확정 후 안내합니다.'}</p><OpeningCountdown english={english} /><p className="xmas-closed">{english ? 'Christmas reservations coming soon' : '크리스마스 예약 준비 중'}</p><a className="xmas-visit-link" href={naverReservationUrl} onClick={() => { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'naver_place_click', source: 'christmas_event' }); }}>{english ? 'General visits · Naver Place' : '일반 방문 · 네이버 플레이스'}</a></section>;
}

function daysUntilSeoulDate(date: string, now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const value = (type: string) => Number(parts.find(part => part.type === type)?.value);
  const today = Date.UTC(value('year'), value('month') - 1, value('day'));
  const [year, month, day] = date.split('-').map(Number);
  return Math.round((Date.UTC(year, month - 1, day) - today) / 86400000);
}

function OpeningCountdown({ english }: { english: boolean }) {
  const [days, setDays] = useState<number | null>(null);
  const openingDateLabel = new Intl.DateTimeFormat(english ? 'en-US' : 'ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(`${christmas.bookingOpeningDate}T00:00:00+09:00`));
  useEffect(() => {
    const update = () => setDays(daysUntilSeoulDate(christmas.bookingOpeningDate, new Date()));
    update();
    const timer = window.setInterval(update, 60000);
    return () => window.clearInterval(timer);
  }, []);
  return <div className="xmas-countdown">
    <p className="xmas-kicker">{english ? 'PLANNED RESERVATION OPENING' : '예약 오픈 예정일'}</p>
    <p className="xmas-countdown-date"><time dateTime={christmas.bookingOpeningDate}>{openingDateLabel}</time> <span>{english ? '· Korea time' : '· 한국 시간 기준'}</span></p>
    {days !== null && days > 0 && <p className="xmas-countdown-number" aria-label={english ? `${days} days until the planned opening date` : `오픈 예정일까지 ${days}일`}>D−{days}</p>}
    {days === 0 && <p className="xmas-countdown-message">{english ? 'Planned opening day · details coming soon' : '오픈 예정일 · 상세 안내 준비 중'}</p>}
    {days !== null && days < 0 && <p className="xmas-countdown-message">{english ? 'Reservation details coming soon' : '예약 안내를 준비하고 있습니다'}</p>}
    <p className="xmas-countdown-note">{english ? 'Opening time will be announced later.' : '오픈 시각은 추후 안내합니다.'}</p>
  </div>;
}

export default function ChristmasPage({ english }: { english: boolean }) {
  return <ChristmasInvitation english={english}><div className="xmas-page"><Header english={english} /><main><Hero english={english} /><EventFacts english={english} /><CourseMenu english={english} /><WinePairing english={english} /><ReservationNotice english={english} /></main><SiteFooter english={english} /><aside className="xmas-mobile-bar" aria-label={english ? 'Reservation status' : '예약 상태'}><span><small>{english ? 'Per person · proposed' : '1인 예정가'}</small><strong>{won(christmas.coursePrice)}</strong></span><span className="xmas-bar-status">{english ? 'Reservations coming soon' : '예약 준비 중'}</span></aside></div></ChristmasInvitation>;
}
