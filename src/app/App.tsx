import type React from 'react';
import { syncIfChanged } from '../cloud';
import { useCallback, useEffect, useRef, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import { setSecureScreen } from '../privacy';
import { isNative } from '../notify';
import { bannerAllowed } from '../adrules';
import { ADS_TESTING, hideBanner, showBanner } from '../ads';
import { StoreProvider, useStore } from './store';
import { Icon, ToastProvider } from './ui';
import { Hoy } from './Hoy';
import { Calendario } from './Calendario';
import { Historial } from './Historial';
import { Salud } from './Salud';
import { Perfil } from './Perfil';
import { Inicio } from './Inicio';
import { Lock } from './Lock';
import { Familia } from './Familia';

type Tab = 'hoy' | 'calendario' | 'historial' | 'salud' | 'perfil';
const TABS: [Tab, string, () => React.JSX.Element][] = [
  ['hoy', 'Hoy', Icon.today], ['calendario', 'Calendario', Icon.cal], ['historial', 'Historial', Icon.list], ['salud', 'Salud', Icon.heart], ['perfil', 'Perfil', Icon.user],
];

function Shell() {
  const { ready, privacy, onboarded, ads, today, active, afterNav } = useStore();
  const navRef = useRef<HTMLElement>(null);
  const [tab, setTab] = useState<Tab>('hoy');
  const [famFirst, setFamFirst] = useState(false);
  const [covered, setCovered] = useState(false);
  const [locked, setLocked] = useState(true);
  const lockOn = useRef(false);
  lockOn.current = !!(privacy.lock && privacy.pinHash);

  // Al cargar: aplicar pantalla segura y decidir si arranca bloqueada.
  const started = useRef(false);
  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    setSecureScreen(privacy.secureScreen);
    setLocked(lockOn.current);
  }, [ready, privacy.secureScreen]);

  // Al salir de la app, se bloquea (si el bloqueo está activo).
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState !== 'hidden') return;
      if (lockOn.current) setLocked(true);
      syncIfChanged(); // copia en la nube, si está activada y algo cambió
    };
    document.addEventListener('visibilitychange', onHide);
    let off: (() => void) | undefined;
    if (isNative()) CapApp.addListener('pause', () => { if (lockOn.current) setLocked(true); }).then(h => { off = () => h.remove(); });
    return () => { document.removeEventListener('visibilitychange', onHide); off?.(); };
  }, []);

  const unlock = useCallback(() => { setLocked(false); setCovered(false); }, []);

  // Banner: solo al pie de Calendario e Historial, nunca bloqueada, tapada ni en perfiles de hijas.
  const isLocked = (lockOn.current && locked) || covered;
  const banner = ready && onboarded && bannerAllowed(ads, { today, childActive: active?.profile.kind === 'child', locked: isLocked, testing: ADS_TESTING }, tab);
  useEffect(() => {
    if (banner) showBanner(navRef.current?.offsetHeight ?? 72); else hideBanner();
  }, [banner]);

  if (!ready) return <div className="screen" aria-busy="true" />;
  if (lockOn.current && locked) return <Lock pinHash={privacy.pinHash} onUnlock={unlock} />;
  if (covered) return <button type="button" className="cover" aria-label="Pantalla tapada. Tocá para seguir" onClick={() => { if (lockOn.current) setLocked(true); setCovered(false); }}><span className="dot" /><span style={{ fontSize: 12.5 }}>Tocá para seguir</span></button>;
  if (!onboarded) return <Inicio onDone={() => setTab('hoy')} />;

  return (
    <div className={'app' + (banner ? ' with-ad' : '')}>
      {tab === 'hoy' && <Hoy onCover={() => setCovered(true)} goTo={t => setTab(t)} />}
      {tab === 'calendario' && <Calendario />}
      {tab === 'historial' && <Historial />}
      {tab === 'salud' && <Salud />}
      {tab === 'perfil' && (famFirst ? <Familia onBack={() => setFamFirst(false)} onOpenKid={() => { setFamFirst(false); setTab('hoy'); window.scrollTo(0, 0); }} /> : <Perfil onOpenKid={() => { setTab('hoy'); window.scrollTo(0, 0); }} onLock={() => setLocked(true)} />)}
      <nav className="nav" aria-label="Secciones" ref={navRef}>
        <div className="nav-in">
          {TABS.map(([id, label, Ico]) => (
            <button key={id} type="button" className={'tab' + (tab === id ? ' on' : '')} aria-current={tab === id ? 'page' : undefined} onClick={() => { if (id !== tab) afterNav(); setTab(id); setFamFirst(false); window.scrollTo(0, 0); }}><Ico />{label}</button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function App() {
  return <StoreProvider><ToastProvider><Shell /></ToastProvider></StoreProvider>;
}
