import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { christmas } from '../public/event';
import './home.css';

const place = 'https://m.place.naver.com/restaurant/2066851037';

export default function Home({ english = false }: { english?: boolean }) {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const t = (ko: string, en: string) => english ? en : ko;
  const menuPath = `/menu/${english ? 'en' : 'ko'}`;

  useEffect(() => {
    document.documentElement.lang = english ? 'en' : 'ko';
    document.title = 'RIORIO | Tapas & Wine';
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
  const showEvent = ['announced', 'booking_open', 'sold_out', 'closed'].includes(christmas.status) && new Date() < new Date('2026-12-26T00:00:00+09:00');

  return <div className="editorial-home">
    <section className="editorial-hero">
      <img className="editorial-hero-image" src="/images/home-interior.webp" alt={t('리오리오 매장 내부에 차려진 식탁', 'Tables set inside RIORIO')} />
      <header className="editorial-header">
        <button ref={menuButton} type="button" className="editorial-menu-button" aria-expanded={open} aria-controls="home-navigation" onClick={() => setOpen(!open)}><span aria-hidden="true">{open ? '×' : '☰'}</span> <span className="editorial-menu-label">Menu</span></button>
        <Link className="editorial-logo" to={`${prefix}/`} aria-label="RIORIO home">RIO RIO</Link>
        <a className="editorial-place" href={place} target="_blank" rel="noreferrer">{t('네이버 플레이스', 'Naver Place')} ↗</a>
      </header>
      {open && <nav id="home-navigation" className="editorial-navigation" aria-label={t('주요 메뉴', 'Main navigation')}>
        <Link to={menuPath} onClick={() => setOpen(false)}>{t('음식 메뉴', 'Food menu')} <span>↗</span></Link>
        <Link to={`${prefix}/visit/`} onClick={() => setOpen(false)}>{t('방문 안내', 'Visit')} <span>↗</span></Link>
        {showEvent && <Link to={`${prefix}/events/christmas-2026/`} onClick={() => setOpen(false)}>{t('크리스마스 초대장', 'Christmas invitation')} <span>↗</span></Link>}
        <Link to={english ? '/' : '/en/'} onClick={() => setOpen(false)} lang={english ? 'ko' : 'en'}>{english ? '한국어' : 'English'} <span>↗</span></Link>
      </nav>}
      <h1>{english ? <>A Spanish table in Gwangmyeong,<br />set by two brothers.</> : <>두 형제가 차리는<br className="mobile-break" /> 광명의 스페인 식탁.</>}</h1>
    </section>
    <main>
      <section className="editorial-table">
        <div className="editorial-intro"><p className="editorial-kicker">La mesa</p><h2>{t('리오리오의 식탁', 'The RIORIO table')}</h2><p>{t('완도 전복과 김제 신동진쌀로 빠에야를 짓고, 스페인 와인과 곁들일 작은 접시들을 준비합니다.', 'We make paella with Wando abalone and Gimje Sindongjin rice, alongside small plates to share with Spanish wine.')}</p></div>
        <img className="editorial-dish" src="/images/home-cod.webp" alt={t('삐스또와 아이올리를 곁들인 꿀대구', 'Honey cod with pisto and aioli')} loading="lazy" />
        <div className="editorial-dish-copy"><div className="editorial-dish-heading"><h3>{t('꿀대구', 'Honey cod')}</h3><Link to={menuPath}>{t('메뉴 보기', 'View menu')} ↗</Link></div><p>{t('부드러운 대구에 직접 만든 삐스또와 아이올리, 꿀을 곁들였습니다.', 'Tender cod served with house-made pisto, aioli and honey.')}</p></div>
      </section>
      <section className="editorial-story"><img className="editorial-kitchen" src="/images/home-interior.webp" alt={t('리오리오의 식탁과 매장 내부', 'Tables inside RIORIO')} loading="lazy" /><div className="editorial-story-copy"><p className="editorial-eyebrow">OUR STORY</p><h2>{t('두 형제의 이야기', 'A story of two brothers')}</h2><p>{t('리오리오는 두 형제가 광명에 문을 연 작은 스페인 식당입니다. 오늘도 함께 나눠 드실 한 접시를 준비합니다.', 'RIORIO is a small Spanish restaurant opened by two brothers in Gwangmyeong. Every day, we prepare plates to share around the table.')}</p></div></section>
    </main>
    <footer className="editorial-footer"><div className="editorial-footer-links">{showEvent && <Link to={`${prefix}/events/christmas-2026/`}>{t('크리스마스 초대장', 'Christmas invitation')} ↗</Link>}<Link to={`${prefix}/visit/`}>{t('방문 안내', 'Visit')} ↗</Link></div><span>RIO RIO · GWANGMYEONG</span></footer>
  </div>;
}
