import { Link } from 'react-router-dom';
import './site-footer.css';

export default function SiteFooter({ english = false }: { english?: boolean }) {
  const year = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Seoul', year: 'numeric' }).format(new Date());
  return <footer className="site-footer">
    <div className="site-footer-inner">
      <div><strong className="site-footer-logo">RIORIO</strong><p>{english ? 'Tapas & Wine Casual Dining' : '타파스 앤 와인 캐주얼 다이닝'}</p><p>{english ? 'Gwangmyeong' : '광명'}</p></div>
      <nav aria-label={english ? 'Footer navigation' : '하단 메뉴'}>
        <Link to={english ? '/en/visit/' : '/visit/'}>{english ? 'Visit' : '방문 안내'}</Link>
        <Link to={english ? '/menu/en' : '/menu/ko'}>{english ? 'Menu' : '메뉴'}</Link>
        <a href="https://www.instagram.com/riorio_oficial/">Instagram</a>
      </nav>
    </div>
    <p className="site-footer-copyright">© {year} RIORIO. All rights reserved.</p>
  </footer>;
}
