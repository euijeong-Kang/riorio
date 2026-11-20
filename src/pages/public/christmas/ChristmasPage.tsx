import { Link } from 'react-router-dom';
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
      <h1>{english ? <>For the ones<br />you love.</> : <>사랑하는 이와,<br />오래 기억할 식탁.</>}</h1>
      {!english && <p className="xmas-hero-english" lang="en">For the ones you love.</p>}
      <p className="xmas-hero-intro">{english ? 'A Christmas table with Spanish flavours and wine, prepared for sharing.' : '스페인의 맛과 와인을 나누며, 소중한 사람과 함께하는 크리스마스를 준비합니다.'}</p>
      <div className="xmas-hero-actions"><a className="xmas-button" href="#course">{english ? 'Explore the course' : '코스 살펴보기'}</a><span>{english ? 'Reservations coming soon' : '예약 준비 중'}</span></div>
    </div>
    <div className="xmas-hero-art"><img src={`${import.meta.env.BASE_URL}images/christmas-plaza-2026.png`} width="1122" height="1402" alt="" /></div>
  </section>;
}

function EventFacts({ english }: { english: boolean }) {
  return <section className="xmas-facts" aria-label={english ? 'Course at a glance' : '코스 요약'}>
    <div><small>THE COURSE</small><strong>{english ? `${christmas.courses.length} courses` : `${christmas.courses.length}코스`}</strong></div>
    <div><small>DINING TIME</small><strong>{english ? `${christmas.durationHours} hours` : `식사 시간 ${christmas.durationHours}시간`}</strong></div>
    <div><small>PER PERSON</small><strong>{won(christmas.coursePrice)} <span>{english ? 'proposed' : '예정'}</span></strong></div>
  </section>;
}

function CourseMenu({ english }: { english: boolean }) {
  return <section id="course" className="xmas-section xmas-course">
    <div className="xmas-section-heading"><p className="xmas-kicker">THE CHRISTMAS COURSE</p><h2>{english ? 'Eight little pleasures' : '여덟 번의 작은 즐거움'}</h2><p>{english ? 'The menu may change depending on preparations.' : '메뉴 구성은 준비 상황에 따라 변경될 수 있습니다.'}</p></div>
    <ol className="xmas-course-list">{christmas.courses.map((item, index) => <li key={item[0]}>
      <span className="xmas-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <div><span className="xmas-course-type">{english ? item[2] : item[0]}</span><h3>{index === 3 ? (english ? 'Consommé' : '콘소메') : english ? item[3] : item[1]}</h3>
      {index === 3 && <p>{english ? 'Beef or mushroom consommé is under consideration.' : '비프 또는 버섯 콘소메 중 준비할 예정입니다.'}</p>}
      {index === 6 && <p>{english ? 'Spanish-style seafood rice' : 'Arroz de mariscos · 스페인식 해산물 밥'}</p>}</div>
    </li>)}</ol>
  </section>;
}

function WinePairing({ english }: { english: boolean }) {
  return <section id="wine" className="xmas-wine"><div className="xmas-section xmas-wine-inner">
    <div><p className="xmas-kicker">OPTIONAL WINE PAIRING</p><h2>{english ? 'Three glasses for the table' : '식탁에 더하는 세 잔'}</h2><p>{english ? 'An optional pairing of three glasses of wine. The selection will be announced later.' : '선택 추가로 즐기는 와인 3잔 페어링. 와인 구성은 추후 안내합니다.'}</p></div>
    <div className="xmas-wine-prices"><p><span>{english ? 'Wine pairing · per person' : '와인 페어링 · 1인'}</span><strong>+ {won(christmas.pairingPrice)}</strong></p><p><span>{english ? 'Course and pairing · per person' : '코스 포함 · 1인'}</span><strong>{won(totalPrice(christmas))}</strong></p><small>{english ? 'Proposed prices, subject to confirmation.' : '예정가이며 확정 후 안내합니다.'}</small></div>
  </div></section>;
}

function ReservationNotice({ english }: { english: boolean }) {
  return <section id="visit" className="xmas-section xmas-visit"><p className="xmas-kicker">RESERVATIONS & VISIT</p><h2>{english ? 'A seat at our table' : '함께할 날을 기다리며'}</h2><p>{english ? 'Two lunch and two dinner seatings are planned. Dates, start times, capacity, deposit and cancellation terms will be announced once confirmed.' : '점심 2회, 저녁 2회 운영을 계획하고 있습니다. 날짜와 시작 시각, 정원, 예약금과 취소 조건은 확정 후 안내합니다.'}</p><p className="xmas-closed">{english ? 'Christmas reservations coming soon' : '크리스마스 예약 준비 중'}</p><a className="xmas-visit-link" href={naverReservationUrl} onClick={() => { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'naver_place_click', source: 'christmas_event' }); }}>{english ? 'General visits · Naver Place' : '일반 방문 · 네이버 플레이스'}</a></section>;
}

export default function ChristmasPage({ english }: { english: boolean }) {
  return <div className="xmas-page"><Header english={english} /><main><Hero english={english} /><EventFacts english={english} /><CourseMenu english={english} /><WinePairing english={english} /><ReservationNotice english={english} /></main><footer className="xmas-footer"><strong>RIORIO</strong><span>Tapas & Wine · Gwangmyeong</span></footer><aside className="xmas-mobile-bar" aria-label={english ? 'Reservation status' : '예약 상태'}><span><small>{english ? 'Per person · proposed' : '1인 예정가'}</small><strong>{won(christmas.coursePrice)}</strong></span><span className="xmas-bar-status">{english ? 'Reservations coming soon' : '예약 준비 중'}</span></aside></div>;
}
