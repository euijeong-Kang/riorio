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

function Envelope({ opening, onFinished }: { opening: boolean; onFinished: () => void }) {
  return <div className={`invitation-envelope${opening ? ' is-opening' : ''}`} aria-hidden="true" onAnimationEnd={event => { if (event.target === event.currentTarget && event.animationName === 'invitation-fade') onFinished(); }}>
    <div className="invitation-shadow" />
    <div className="invitation-envelope-back" />
    <div className="invitation-paper"><span>RIORIO</span><strong>Christmas</strong><em>For the ones you love.</em></div>
    <div className="invitation-front-left" /><div className="invitation-front-right" /><div className="invitation-front-bottom" />
    <div className="invitation-flap" /><div className="invitation-seal">✦</div>
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
    timer.current = setTimeout(() => finish('letter'), 1800);
  };
  const skip = () => { opening.current = true; finish('course'); };
  const concealed = state !== 'opened';

  return <>
    {concealed && <section className={`invitation-scene${state === 'opening' ? ' invitation-scene-opening' : ''}`} aria-label={english ? 'Christmas invitation' : '크리스마스 초대장'}>
      <div className="invitation-top"><span>RIORIO</span><Link to={english ? '/events/christmas-2026/' : '/en/events/christmas-2026/'} lang={english ? 'ko' : 'en'}>{english ? 'KO' : 'EN'}</Link></div>
      <div className="invitation-stage"><p className="invitation-eyebrow">A CHRISTMAS LETTER FROM RIORIO</p><Envelope opening={state === 'opening'} onFinished={() => finish('letter')} /><p className="invitation-message">{english ? 'For the ones you love.' : '사랑하는 이와 함께 열어주세요.'}</p><button className="invitation-open" type="button" onClick={open} disabled={state === 'opening'}>{english ? 'Open your invitation' : '초대장 열기'}</button><button className="invitation-skip" type="button" onClick={skip}>{english ? 'Skip to the course' : '코스 바로 보기'}</button></div>
    </section>}
    <div hidden={concealed} inert={concealed}>{children}</div>
  </>;
}
