import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { christmas } from '../event';
import './invitation.css';

type InvitationState = 'closed' | 'opening' | 'opened';
const storageKey = `riorio-invitation-${christmas.id}`;

function hasSectionLink() {
  return ['#course', '#wine', '#visit'].includes(window.location.hash);
}

function rememberOpened() {
  try { window.sessionStorage.setItem(storageKey, 'opened'); } catch {}
}

function Envelope({ opening, english, onOpen, onSkip, onFinished }: { opening: boolean; english: boolean; onOpen: () => void; onSkip: () => void; onFinished: () => void }) {
  return <div className={`invitation-envelope${opening ? ' is-opening' : ''}`} onAnimationEnd={event => { if (event.target === event.currentTarget && event.animationName === 'invitation-finish') onFinished(); }}>
    <div className="invitation-envelope-back" aria-hidden="true" />
    <div className="invitation-paper">
      <div className="invitation-paper-content">
        <span className="invitation-embossed-star" aria-hidden="true">✦</span>
        <span className="invitation-sender">RIORIO</span>
        <h1>Christmas</h1>
        <p className="invitation-subtitle">A Christmas Invitation</p>
        <p className="invitation-script">For you, my love.</p>
        <button className="invitation-open" type="button" onClick={onOpen} disabled={opening}>{english ? 'Open your invitation' : '초대장을 펼쳐보세요'}</button>
        <button className="invitation-skip" type="button" onClick={onSkip}>{english ? 'Skip to the course' : '코스 바로 보기'}</button>
      </div>
    </div>
    <div className="invitation-front-left" aria-hidden="true" /><div className="invitation-front-right" aria-hidden="true" />
  </div>;
}

export default function ChristmasInvitation({ english, children }: { english: boolean; children: React.ReactNode }) {
  const [state, setState] = useState<InvitationState>('opened');
  const [focusTarget, setFocusTarget] = useState<'letter' | 'course' | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opening = useRef(false);

  useEffect(() => {
    let seen = false;
    try { seen = window.sessionStorage.getItem(storageKey) === 'opened'; } catch {}
    if (!seen && !hasSectionLink()) setState('closed');
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  useEffect(() => {
    if (state !== 'opened' || !focusTarget) return;
    const target = document.getElementById(focusTarget === 'course' ? 'course-title' : 'letter-title');
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: 'start', behavior: 'auto' });
    setFocusTarget(null);
  }, [state, focusTarget]);

  const finish = (target: 'letter' | 'course') => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    rememberOpened();
    setFocusTarget(target);
    setState('opened');
  };
  const open = () => {
    if (opening.current) return;
    opening.current = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { finish('letter'); return; }
    setState('opening');
    timer.current = setTimeout(() => finish('letter'), 2300);
  };
  const skip = () => { opening.current = true; finish('course'); };
  const concealed = state !== 'opened';

  return <>
    {concealed && <section className={`invitation-scene${state === 'opening' ? ' invitation-scene-opening' : ''}`} aria-label={english ? 'Christmas invitation' : '크리스마스 초대장'}>
      <div className="invitation-top"><Link to={english ? '/events/christmas-2026/' : '/en/events/christmas-2026/'} lang={english ? 'ko' : 'en'}>{english ? 'KO' : 'EN'}</Link></div>
      <Envelope opening={state === 'opening'} english={english} onOpen={open} onSkip={skip} onFinished={() => finish('letter')} />
    </section>}
    <div hidden={concealed} inert={concealed}>{children}</div>
  </>;
}
