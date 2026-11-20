import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { christmas, naverReservationUrl, totalPrice } from './event';
import './public.css';
import ChristmasPage from './christmas/ChristmasPage';

type Kind = 'home' | 'visit' | 'events' | 'christmas' | 'legacy';

export default function PublicPage({ kind, english = false }: { kind: Kind; english?: boolean }) {
  const prefix = english ? '/en' : '';
  const eventPath = `${prefix}/events/christmas-2026/`;
  const languagePath = kind === 'home' ? '/' : kind === 'legacy' ? '/events/' : `/${kind === 'christmas' ? 'events/christmas-2026' : kind}/`;
  const title = kind === 'christmas' ? (english ? 'Christmas Course 2026' : '2026 크리스마스 코스') : kind === 'visit' ? (english ? 'Visit' : '방문 안내') : kind === 'events' ? (english ? 'Events' : '행사 안내') : '';
  useEffect(() => {
    document.documentElement.lang = english ? 'en' : 'ko';
    document.title = title ? `${title} | RIORIO` : 'RIORIO | Tapas & Wine';
  }, [english, title]);

  if (String(kind) === 'christmas') return <ChristmasPage english={english} />;

  return <div className="public-site">
    <header className="public-header"><Link className="public-logo" to={`${prefix}/`}>RIO<span>RIO</span></Link><nav aria-label={english ? 'Main navigation' : '주요 메뉴'}><Link to={`/menu/${english ? 'en' : 'ko'}`}>{english ? 'Menu' : '메뉴'}</Link><Link to={`${prefix}/visit/`}>{english ? 'Visit' : '방문'}</Link><Link to={`${prefix}/events/`}>{english ? 'Events' : '행사'}</Link><Link lang={english ? 'ko' : 'en'} to={english ? languagePath : `/en${languagePath}`}>{english ? '한국어' : 'EN'}</Link></nav></header>
    <main>
      {kind === 'christmas' ? <>
        <section className="event-hero"><div className="event-hero-inner"><p className="eyebrow">RIORIO · CHRISTMAS {christmas.year}</p><h1>{english ? <>A Christmas<br /><em>at RIORIO</em></> : <>리오리오에서<br /><em>맞이하는 크리스마스</em></>}</h1><p>{english ? 'A festive course, thoughtfully paired with wine.' : '크리스마스를 위한 코스와 와인 페어링을 준비하고 있습니다.'}</p><span className="status">{english ? 'Reservations coming soon' : '예약 준비 중'}</span></div><div className="hero-art" aria-hidden="true"><span>✦</span><span>2026</span><span>✦</span></div></section>
        <section className="facts"><div><small>{english ? 'DATE' : '일정'}</small><strong>{english ? 'Details coming soon' : '상세 일정 준비 중'}</strong></div><div><small>{english ? 'DINING TIME' : '식사 시간'}</small><strong>{english ? `${christmas.durationHours} hours per seating` : `회차당 ${christmas.durationHours}시간`}</strong></div><div><small>{english ? (christmas.priceApproved ? 'COURSE' : 'COURSE · PROPOSED PRICE') : (christmas.priceApproved ? '코스' : '코스 · 예정가')}</small><strong>₩{christmas.coursePrice.toLocaleString()}</strong><span>{english ? (christmas.priceApproved ? 'per person' : 'per person · subject to confirmation') : (christmas.priceApproved ? '1인 기준' : '1인 기준 · 확정 전')}</span></div></section>
        <section className="course section"><div className="section-intro"><p className="eyebrow">THE CHRISTMAS COURSE</p><h2>{english ? 'At the table' : '크리스마스 코스'}</h2><p>{english ? 'The menu is a preview and may change.' : '아래 구성은 검토용이며 변경될 수 있습니다.'}</p></div><ol>{christmas.courses.map((item, index)=><li key={item[0]}><span>{String(index + 1).padStart(2, '0')}</span><div><small>{english ? item[2] : item[0]}</small><h3>{english ? item[3] : item[1]}</h3></div></li>)}</ol></section>
        <section className="pairing section"><div><p className="eyebrow">WINE PAIRING</p><h2>{english ? 'A little more to the evening' : '코스에 더하는 와인'}</h2><p>{english ? 'Three glasses of wine, offered as an optional pairing. The selection is being prepared.' : '와인 3잔 페어링을 선택하실 수 있도록 준비 중입니다. 와인 구성은 추후 안내합니다.'}</p></div><div className="price-card"><small>{english ? 'OPTIONAL · PREVIEW PRICE' : '선택 추가 · 예정가'}</small><strong>+ ₩{christmas.pairingPrice.toLocaleString()}</strong><p>{english ? `Course and pairing: ₩${totalPrice(christmas).toLocaleString()} per person, subject to confirmation.` : `코스와 페어링 합계 1인 ${totalPrice(christmas).toLocaleString()}원 예정 · 확정 전`}</p></div></section>
        <section className="section details"><p className="eyebrow">YOUR VISIT</p><h2>{english ? 'Reservations are coming soon' : '예약을 준비하고 있습니다'}</h2><p>{english ? 'Two lunch and two dinner seatings are planned. Dates, start times and capacity will be announced once confirmed.' : '점심 2회, 저녁 2회 운영을 계획하고 있습니다. 날짜와 시작 시각, 정원은 확정 후 안내합니다.'}</p><p>{english ? 'Deposit, confirmation and cancellation details will also be announced when confirmed.' : '예약금, 예약 확정 방식과 취소 안내도 확정 후 안내합니다.'}</p><button disabled>{english ? 'Reservations coming soon' : '크리스마스 코스 예약 준비 중'}</button><div className="text-links"><Link to={`${prefix}/visit/`}>{english ? 'Visit information' : '방문 안내'}</Link></div></section>
      </> : kind === 'legacy' ? <section className="section plain"><p className="eyebrow">PAST EVENT</p><h1>지난 행사 안내</h1><p>2025년 행사는 종료되었습니다. 새로운 행사 정보는 행사 안내에서 확인해 주세요.</p><Link className="button" to="/events/">행사 안내 보기</Link></section> : kind === 'visit' ? <section className="section plain"><p className="eyebrow">VISIT RIORIO</p><h1>{english ? 'Visit' : '방문 안내'}</h1><p>{english ? 'A-142, 11 Yangji-ro, Gwangmyeong-si, Gyeonggi-do' : '경기도 광명시 양지로 11 A-142'}</p><p>{english ? 'Hours and parking information will be updated after confirmation.' : '영업시간과 주차 정보는 확인 후 안내하겠습니다.'}</p><Naver english={english} /></section> : <>
        <section className="home-hero"><p className="eyebrow">TAPAS & WINE · GWANGMYEONG</p><h1>{kind === 'events' ? (english ? 'Events at RIORIO' : '리오리오 행사') : <>RIO<span>RIO</span></>}</h1><p>{kind === 'events' ? (english ? 'Discover our special events.' : '리오리오의 특별한 행사를 만나보세요.') : (english ? 'Tapas & Wine Casual Dining' : '타파스와 와인을 만나는 공간')}</p>{kind === 'home' && <div className="home-actions"><Link className="button" to={`/menu/${english ? 'en' : 'ko'}`}>{english ? 'Explore the menu' : '메뉴 보기'}</Link><Naver english={english} /></div>}</section>
        <section className="section event-card"><div><p className="eyebrow">SPECIAL EVENT · 2026</p><h2>{english ? 'Christmas at RIORIO' : '2026 크리스마스 코스'}</h2><p>{english ? 'Course and wine pairing · Details coming soon' : '코스와 와인 페어링 · 상세 일정 준비 중'}</p><Link className="text-link" to={eventPath}>{english ? 'View preview →' : '미리보기 →'}</Link></div><div className="card-art" aria-hidden="true">✦</div></section>
      </>}
    </main><footer className="public-footer"><strong>RIORIO</strong><span>Tapas & Wine Casual Dining · Gwangmyeong</span><Link to={`${prefix}/visit/`}>{english ? 'Visit' : '방문 안내'}</Link></footer>
  </div>;
}

function Naver({ english }: { english: boolean }) {
  if (!naverReservationUrl) return <span className="naver-pending">{english ? 'Reserve on Naver · link coming soon' : '네이버 예약 링크 준비 중'}</span>;
  return <a className="button button-outline" href={naverReservationUrl} onClick={() => { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'naver_place_click', source: window.location.pathname.includes('visit') ? 'visit' : 'home' }); }}>{english ? 'General visits · Naver Place' : '일반 방문 · 네이버 플레이스'}</a>;
}
