import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, MapPin } from 'lucide-react';
import './home.css';

const place = 'https://m.place.naver.com/restaurant/2066851037';

export default function Home({ english = false }: { english?: boolean }) {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const t = (ko: string, en: string) => english ? en : ko;
  const menuPath = `/menu/${english ? 'en' : 'ko'}`;

  useEffect(() => {
    document.documentElement.lang = english ? 'en' : 'ko';
    document.title = 'RIORIO | Spanish Casual Dining';
  }, [english]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); menuButton.current?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  const prefix = english ? '/en' : '';
  const [showEvent, setShowEvent] = useState(() => Date.now() < Date.parse('2026-12-26T00:00:00+09:00'));
  useEffect(() => {
    const updateEvent = () => setShowEvent(Date.now() < Date.parse('2026-12-26T00:00:00+09:00'));
    const interval = window.setInterval(updateEvent, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return <div className="editorial-home">
    <section className="editorial-hero">
      <div className="editorial-hero-scenes" aria-hidden="true">
        <img className="editorial-hero-image scene-one" src="/images/home-interior.webp" alt="" fetchPriority="high" />
        <img className="editorial-hero-image scene-two" src="/images/home-exterior.webp" alt="" />
        <img className="editorial-hero-image scene-three" src="/images/home-terrace.webp" alt="" />
        <img className="editorial-hero-image scene-four" src="/images/home-bottles.webp" alt="" />
        <img className="editorial-hero-image scene-five" src="/images/home-message.webp" alt="" />
      </div>
      <header className="editorial-header">
        <button ref={menuButton} type="button" className="editorial-menu-button" aria-expanded={open} aria-controls="home-navigation" onClick={() => setOpen(!open)}><span aria-hidden="true">{open ? '×' : '☰'}</span> <span className="editorial-menu-label">Menu</span></button>
        <Link className="editorial-logo" to={`${prefix}/`} aria-label="RIORIO home">RIORIO</Link>
        <a className="editorial-place" href={place} target="_blank" rel="noreferrer">{t('네이버 플레이스', 'Naver Place')} ↗</a>
      </header>
      {open && <nav id="home-navigation" className="editorial-navigation" aria-label={t('주요 메뉴', 'Main navigation')}>
        <Link to={menuPath} onClick={() => setOpen(false)}>{t('음식 메뉴', 'Food menu')} <span>↗</span></Link>
        <a href={place} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>{t('네이버 플레이스', 'Naver Place')} <span>↗</span></a>
        {showEvent && <Link to={`${prefix}/events/christmas-2026/`} onClick={() => setOpen(false)}>{t('크리스마스 초대장', 'Christmas invitation')} <span>↗</span></Link>}
        <Link to={english ? '/' : '/en/'} onClick={() => setOpen(false)} lang={english ? 'ko' : 'en'}>{english ? '한국어' : 'English'} <span>↗</span></Link>
      </nav>}
      <div className="editorial-hero-title"><h1>RIORIO</h1><p>Tapas &amp; Wine<br />Casual Dining</p></div>
      <a className="editorial-scroll" href="#our-story">SCROLL <span aria-hidden="true">↓</span></a>
    </section>
    <main>
      <section className="editorial-identity" id="our-story">
        <p className="editorial-eyebrow">OUR STORY <span> · </span> GWANGMYEONG</p>
        <h2>{t('두 형제의 이야기', 'A story of two brothers')}</h2>
        <div className="editorial-identity-copy">
          {english ? <><p>“Río” means river in Spanish, and “Kang” is both the brothers’ family name and the Korean word for river.<br className="editorial-wide-break" /> Together, they became RIORIO.</p><p>In Iljik-dong, Gwangmyeong, where we grew up, we wanted to share the Spanish food we love.<br className="editorial-wide-break" /> Around a warm, welcoming table, we hope you feel a little of the magic of stepping into a Spanish street.</p></> : <><p>스페인어로 강을 뜻하는 ‘Río’와 강씨 형제의 성.<br />두 이름이 만나 리오리오가 되었습니다.</p><p>나고 자란 광명 일직동에서 우리가 좋아하는 스페인 요리를<br className="editorial-wide-break" /> 더 많은 분과 나누고 싶었습니다.<br />따뜻하고 편안한 식탁에서, 잠시 스페인의 골목에 들어온 듯한<br className="editorial-wide-break" /> 특별함을 전합니다.</p></>}
        </div>
      </section>
      <section className="editorial-table">
        <div className="editorial-intro"><p className="editorial-kicker">La mesa</p><h2>{t('리오리오의 식탁', 'The RIORIO table')}</h2><p>{t('세계 4대 진미로 꼽히는 이베리코 중에서도 가장 높은 등급인 베요타 100%를 사용하고, 김제 신동진쌀과 완도 전복으로 깊은 풍미를 담습니다. 요리를 완성하는 소스도 매장에서 직접 만듭니다.', 'We serve 100% Ibérico Bellota, the highest grade of Ibérico pork, celebrated as one of the world’s four great delicacies, and bring depth to our dishes with Gimje Sindongjin rice and Wando abalone. Our sauces are made in-house.')}</p></div>
        <img className="editorial-dish" src="/images/home-cod-new.webp" alt={t('삐스또와 아이올리를 곁들인 꿀대구', 'Honey cod with pisto and aioli')} loading="lazy" />
        <div className="editorial-dish-copy"><div className="editorial-dish-heading"><h3>{t('꿀대구', 'Honey cod')}</h3><Link to={menuPath}>{t('메뉴 보기', 'View menu')} ↗</Link></div><p>{t('부드러운 대구에 직접 만든 삐스또와 아이올리, 꿀을 곁들였습니다.', 'Tender cod served with house-made pisto, aioli and honey.')}</p></div>
      </section>
      <section className="editorial-story"><img className="editorial-kitchen" src="/images/home-feast-new.webp" alt={t('전복 빠에야와 여러 요리가 놓인 식탁', 'Abalone paella and dishes set on the table')} loading="lazy" /><div className="editorial-story-copy"><p className="editorial-eyebrow">AT OUR TABLE</p><h2>{t('함께 나누는 한 끼', 'A meal made to share')}</h2><p>{t('타파스와 빠에야, 한 잔의 와인까지. 좋아하는 사람들과 천천히 나누는 시간을 준비합니다.', 'From tapas and paella to a glass of wine, we prepare food for unhurried moments with the people you love.')}</p><a href={place} target="_blank" rel="noreferrer" className="editorial-story-link">{t('네이버 플레이스', 'Naver Place')} ↗</a></div></section>
      {showEvent && <section className="editorial-event" aria-label={t('크리스마스 코스 초대장', 'Christmas course invitation')}><Link className="editorial-envelope" to={`${prefix}/events/christmas-2026/`}><span className="editorial-envelope-flap" aria-hidden="true" /><span className="editorial-envelope-content"><span className="editorial-envelope-brand">RIORIO</span><span className="editorial-envelope-title">Christmas</span><span className="editorial-envelope-subtitle">{t('당신을 위한 크리스마스 초대장', 'A Christmas invitation for you')}</span><span className="editorial-envelope-action">{t('크리스마스 코스 보기', 'Explore the Christmas course')} ↗</span></span></Link></section>}
    </main>
    <footer className="editorial-footer">
      <div className="editorial-footer-main">
        <div className="editorial-footer-brand"><strong>RIORIO</strong><p>Tapas &amp; Wine · Casual Dining</p></div>
        <div className="editorial-footer-visit"><p className="editorial-footer-label">VISIT US</p><address>{t('경기도 광명시 양지로 11 A-142', 'A-142, 11 Yangji-ro, Gwangmyeong-si, Gyeonggi-do')}</address><div className="editorial-footer-links"><a href={place} target="_blank" rel="noreferrer"><MapPin size={16} aria-hidden="true" /> {t('네이버 플레이스', 'Naver Place')} ↗</a>{showEvent && <Link to={`${prefix}/events/christmas-2026/`}>{t('크리스마스 초대장', 'Christmas invitation')} ↗</Link>}</div></div>
        <div className="editorial-footer-social"><p className="editorial-footer-label">FOLLOW US</p><a href="https://www.instagram.com/riorio_oficial/" target="_blank" rel="noreferrer" aria-label={t('리오리오 인스타그램 새 창 열기', 'Open RIORIO Instagram in a new tab')}><Instagram size={22} aria-hidden="true" /> <span>Instagram ↗</span></a></div>
      </div>
      <div className="editorial-footer-bottom">RIORIO · GWANGMYEONG</div>
    </footer>
  </div>;
}
