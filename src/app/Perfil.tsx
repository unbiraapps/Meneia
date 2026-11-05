import { useState } from 'react';
import { ageOn, canTry, fmtLong } from '../calc';
import { saveProfile } from '../db';
import { useStore } from './store';
import { Avatar, Icon, Switch, useToast } from './ui';
import { Familia } from './Familia';
import { Privacidad } from './Privacidad';
import { Avisos } from './Avisos';
import { Copia } from './Copia';
import { Pastillas } from './Pastillas';
import { PlanSettings } from './Plan';
import { PinSheet } from './Pin';
import { cloudAvailable, currentUser, signOut } from '../cloud';
import { useEffect } from 'react';

type Sub = null | 'familia' | 'privacidad' | 'avisos' | 'copia' | 'pastillas';

export function Perfil({ onOpenKid, onLock }: { onOpenKid: () => void; onLock: () => void }) {
  const { self, profiles, today, refresh, privacy } = useStore();
  const toast = useToast();
  const [sub, setSub] = useState<Sub>(null);
  const [pin, setPin] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => { if (cloudAvailable()) currentUser().then(setEmail).catch(() => setEmail(null)); }, [sub]);
  if (!self) return null;
  if (sub === 'familia') return <Familia onBack={() => setSub(null)} onOpenKid={onOpenKid} />;
  if (sub === 'privacidad') return <Privacidad onBack={() => setSub(null)} />;
  if (sub === 'avisos') return <Avisos onBack={() => setSub(null)} />;
  if (sub === 'copia') return <Copia onBack={() => setSub(null)} />;
  if (sub === 'pastillas') return <Pastillas onBack={() => setSub(null)} />;

  const me = self.profile;
  const age = ageOn(me.birthDate, today);
  const tryOk = canTry(me, today);
  const kids = profiles.filter(p => p.kind === 'child');
  const ev = self.A.lastPill;

  async function setTrying(v: boolean) { await saveProfile({ ...me, trying: v }); await refresh(); toast(v ? 'Buscar embarazo activado' : 'Buscar embarazo apagado'); }

  return (
    <div className="screen">
      <div className="row"><Avatar name="Yo" color={me.color} lg /><div className="stack"><h1 style={{ fontSize: 22 }}>Mi perfil</h1><span className="muted" style={{ fontSize: 13 }}>Tus datos quedan solo en este celular</span></div></div>

      <div className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">Qué seguís</span>
        <div className="list">
          <div className="setting"><label className="field grow" style={{ gap: 4 }}>Fecha de nacimiento
            <input type="date" value={me.birthDate} max={today} onChange={async e => { const b = e.target.value; const p = { ...me, birthDate: b }; if (!canTry(p, today)) p.trying = false; await saveProfile(p); await refresh(); }} /></label></div>
          <div className="setting" style={me.trying ? { background: 'var(--try-bg)' } : undefined}>
            <div className="stack grow"><b style={{ color: me.trying ? 'var(--try)' : undefined }}>Buscar embarazo</b>
              <small>{!me.birthDate ? 'Cargá tu fecha de nacimiento para activarlo' : !tryOk ? 'Disponible desde los 18 años' : me.trying ? 'Activo: ves los mejores días para buscar' : 'Apagado: no se muestra nada sobre embarazo'}</small></div>
            {tryOk && <Switch on={me.trying} label="Buscar embarazo" variant="try" onChange={setTrying} />}
          </div>
        </div>
        {age != null && age < 18 && <p className="muted" style={{ fontSize: 12.5 }}>Tenés {age} años según la fecha cargada.</p>}
      </div>

      <div className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">Familia</span>
        <button type="button" className="list" style={{ padding: 0, background: 'var(--fam-bg)', borderColor: 'transparent' }} onClick={() => setSub('familia')}>
          <span className="list-item"><span style={{ color: 'var(--fam)' }}><Icon.family /></span>
            <span className="grow"><b style={{ color: 'var(--fam)' }}>{kids.length ? kids.map(k => k.name).join(' y ') : 'Ciclos de mis hijas'}</b><small>{kids.length ? 'Aviso antes de su período y lista de compras' : 'Agregá a tus hijas para saber cuándo les toca'}</small></span><Icon.chev /></span>
        </button>
      </div>

      <div className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">Pastillas anticonceptivas</span>
        <button type="button" className="list" style={{ padding: 0 }} onClick={() => setSub('pastillas')}>
          <span className="list-item"><span style={{ color: 'var(--plum)' }}><Icon.pill /></span>
            <span className="grow"><b>{self.A.onPill ? 'Las estás tomando' : 'Pastillas'}</b><small>{ev ? (ev.type === 'stop' ? `Las dejaste el ${fmtLong(ev.date)}` : `Desde el ${fmtLong(ev.date)} · toma diaria y aviso para comprar`) : 'Toma diaria y aviso para comprar'}</small></span><Icon.chev /></span>
        </button>
      </div>

      <div className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">Versión</span>
        <PlanSettings />
      </div>

      <div className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">Ajustes</span>
        <div className="list">
          <button type="button" className="list-item" onClick={() => setSub('privacidad')}><span style={{ color: 'var(--plum)' }}><Icon.lock /></span><span className="grow"><b>Privacidad</b><small>{privacy.lock ? 'Bloqueo activado' : 'Sin bloqueo'} · {privacy.secureScreen ? 'oculta en recientes' : 'visible en recientes'}</small></span><Icon.chev /></button>
          <button type="button" className="list-item" onClick={() => setSub('avisos')}><span style={{ color: 'var(--plum)' }}><Icon.bell /></span><span className="grow"><b>Avisos</b><small>{privacy.discreet ? 'Discretos' : 'Con detalle'}{privacy.quietFrom !== privacy.quietTo ? ` · sin avisos de ${privacy.quietFrom} a ${privacy.quietTo}` : ''}</small></span><Icon.chev /></button>
          <button type="button" className="list-item" onClick={() => setSub('copia')}><span style={{ color: 'var(--plum)' }}><Icon.save /></span><span className="grow"><b>Copia de seguridad</b><small>Para no perder nada si cambiás de celular</small></span><Icon.chev /></button>
        </div>
      </div>
      <div className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">Sesión</span>
        <div className="list">
          {email != null ? (
            <button type="button" className="list-item" onClick={async () => { await signOut(); setEmail(null); toast('Saliste de tu cuenta. Tu copia sigue guardada'); }}>
              <span style={{ color: 'var(--plum)' }}><Icon.user /></span><span className="grow"><b>Salir de mi cuenta</b><small>{email || 'Copia en la nube'} · la copia queda guardada</small></span></button>
          ) : (
            <button type="button" className="list-item" onClick={() => setSub('copia')}>
              <span style={{ color: 'var(--plum)' }}><Icon.user /></span><span className="grow"><b>Mi cuenta</b><small>Opcional: entrar con Google o con email para la copia en la nube</small></span><Icon.chev /></button>
          )}
          <button type="button" className="list-item" onClick={() => { if (privacy.lock && privacy.pinHash) onLock(); else setPin(true); }}>
            <span style={{ color: 'var(--plum)' }}><Icon.lock /></span><span className="grow"><b>Cerrar sesión</b><small>{privacy.lock && privacy.pinHash ? 'Bloquea Meneia: para volver a entrar te pide el PIN' : 'Primero elegí un PIN para poder cerrar sesión'}</small></span></button>
        </div>
      </div>
      {pin && <PinSheet onClose={() => setPin(false)} />}
      <p className="muted" style={{ fontSize: 12, textAlign: 'center' }}>Las fechas son estimaciones según tus ciclos anteriores. No sirven como método anticonceptivo.</p>
    </div>
  );
}
