import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './invitation.css';

type InvitationState = 'closed' | 'opening' | 'reading' | 'exiting' | 'opened';

function hasSectionLink() {
  return ['#course', '#wine', '#visit'].includes(window.location.hash);
}

function Envelope({ opening, reading, english, onOpen, onSkip, onContinue, onFinished }: { opening: boolean; reading: boolean; english: boolean; onOpen: () => void; onSkip: () => void; onContinue: () => void; onFinished: () => void }) {
  return <div className={`invitation-envelope${opening || reading ? ' is-opening' : ''}${reading ? ' is-reading' : ''}`} onAnimationEnd={event => { if (event.target === event.currentTarget && event.animationName === 'invitation-finish') onFinished(); }}>
    <div className="invitation-envelope-back" aria-hidden="true" />
    <div className="invitation-paper" aria-hidden={!reading} inert={!reading}>
      <div className="invitation-paper-content">
        <span className="invitation-embossed-star" aria-hidden="true">✦</span>
        <span className="invitation-sender">RIORIO</span>
        <h1 id="invitation-letter-title" tabIndex={-1}>Christmas</h1>
        <p className="invitation-subtitle">A Christmas Invitation</p>
        <p className="invitation-script">For you, my love.</p>
        <p className="invitation-letter-message">{english ? 'A Christmas table prepared for you and the ones you love.' : '소중한 사람과 함께할 크리스마스 식탁에 초대합니다.'}</p>
        <button className="invitation-continue" type="button" onClick={onContinue}>{english ? 'Explore the course' : '코스 안내 보기'}</button>
        <span className="invitation-scroll-hint">{english ? 'or scroll down' : '또는 아래로 스크롤'}</span>
      </div>
    </div>
    <div className="invitation-front-left" aria-hidden="true" /><div className="invitation-front-right" aria-hidden="true" />
    <div className="invitation-closed-cover" aria-hidden="true" />
    <div className="invitation-closed-flap" aria-hidden="true" />
    <div className="invitation-cover-content" aria-hidden={opening || reading} inert={opening || reading}>
      <p className="invitation-cover-sender">RIORIO</p>
      <p className="invitation-cover-title">Christmas</p>
      <p className="invitation-cover-subtitle">{english ? 'A letter for you' : '당신을 위한 크리스마스 초대장'}</p>
      <button className="invitation-open" type="button" onClick={onOpen} disabled={opening}>{english ? 'Open your invitation' : '초대장 열기'}</button>
      <button className="invitation-skip" type="button" onClick={onSkip}>{english ? 'Skip to the course' : '코스 바로 보기'}</button>
    </div>
  </div>;
}

export default function ChristmasInvitation({ english, children }: { english: boolean; children: React.ReactNode }) {
  const [state, setState] = useState<InvitationState>(() => typeof window === 'undefined' || hasSectionLink() ? 'opened' : 'closed');
  const [focusTarget, setFocusTarget] = useState<'letter' | 'course' | null>(null);
  const [arriving, setArriving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opening = useRef(false);
  const transitioning = useRef(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.classList.remove('invitation-loading');
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  useEffect(() => {
    if (state !== 'opened' || !focusTarget) return;
    const target = document.getElementById(focusTarget === 'course' ? 'course-title' : 'letter-title');
    target?.focus({ preventScroll: true });
    if (focusTarget === 'letter') window.scrollTo({ top: 0, behavior: 'auto' });
    else target?.scrollIntoView({ block: 'start', behavior: 'auto' });
    setFocusTarget(null);
  }, [state, focusTarget]);

  useEffect(() => {
    if (state === 'reading') document.getElementById('invitation-letter-title')?.focus({ preventScroll: true });
  }, [state]);

  const finish = (target: 'letter' | 'course') => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setFocusTarget(target);
    setState('opened');
  };
  const open = () => {
    if (opening.current) return;
    opening.current = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setState('reading'); return; }
    setState('opening');
    timer.current = setTimeout(() => setState('reading'), 4500);
  };
  const showLetter = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; setState('reading'); };
  const skip = () => { opening.current = true; finish('course'); };
  const continueToPage = () => {
    if (state !== 'reading' || transitioning.current) return;
    transitioning.current = true;
    setArriving(true);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { finish('letter'); return; }
    setState('exiting');
    timer.current = setTimeout(() => finish('letter'), 450);
  };
  useEffect(() => {
    if (state !== 'reading') return;
    const onWheel = (event: WheelEvent) => { if (event.deltaY > 0) continueToPage(); };
    const onTouchStart = (event: TouchEvent) => { touchStart.current = event.touches[0]?.clientY ?? null; };
    const onTouchEnd = (event: TouchEvent) => {
      const end = event.changedTouches[0]?.clientY;
      if (touchStart.current !== null && end !== undefined && touchStart.current - end > 50) continueToPage();
      touchStart.current = null;
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [state]);
  const replay = () => {
    opening.current = false;
    transitioning.current = false;
    setArriving(false);
    setState('closed');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };
  const concealed = state !== 'opened';

  return <>
    {concealed && <section className={`invitation-scene${state === 'opening' ? ' invitation-scene-opening' : ''}${state === 'reading' || state === 'exiting' ? ' invitation-scene-reading' : ''}${state === 'exiting' ? ' invitation-scene-exiting' : ''}`} aria-label={english ? 'Christmas invitation' : '크리스마스 초대장'}>
      <div className="invitation-top"><Link to={english ? '/events/christmas-2026/' : '/en/events/christmas-2026/'} lang={english ? 'ko' : 'en'}>{english ? 'KO' : 'EN'}</Link></div>
      <Envelope opening={state === 'opening'} reading={state === 'reading' || state === 'exiting'} english={english} onOpen={open} onSkip={skip} onContinue={continueToPage} onFinished={showLetter} />
    </section>}
    <div className={arriving && !concealed ? 'invitation-content-arriving' : undefined} hidden={concealed} inert={concealed}>{children}<div className="invitation-replay-wrap"><button type="button" className="invitation-replay" onClick={replay}>{english ? 'View invitation again' : '초대장 다시 보기'}</button></div></div>
  </>;
}
