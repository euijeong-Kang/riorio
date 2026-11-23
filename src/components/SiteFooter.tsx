import { Link } from 'react-router-dom';
import './site-footer.css';

export default function SiteFooter({ english = false }: { english?: boolean }) {
  const year = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Seoul', year: 'numeric' }).format(new Date());
  return <footer className="site-footer">
    <div className="site-footer-inner">
      <div><strong className="site-footer-logo">RIORIO</strong><p>Tapas & Wine Casual Dining</p><p>Gwangmyeong</p></div>
      <nav aria-label={english ? 'Footer navigation' : '하단 메뉴'}>
        <a href="https://m.place.naver.com/restaurant/2066851037" target="_blank" rel="noreferrer">{english ? 'Naver Place' : '네이버 플레이스'} ↗</a>
        <Link to={english ? '/menu/en' : '/menu/ko'}>{english ? 'Menu' : '메뉴'}</Link>
        <a href="https://www.instagram.com/riorio_oficial/">Instagram</a>
      </nav>
    </div>
    <p className="site-footer-copyright">© {year} RIORIO. All rights reserved.</p>
  </footer>;
}
