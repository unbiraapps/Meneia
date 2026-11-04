import { useState } from 'react';
import type { PrivacySettings } from '../calc';
import { setSetting } from '../db';
import { hashPin, setSecureScreen, validPin, biometricAvailable } from '../privacy';
import { isNative } from '../notify';
import { useStore } from './store';
import { Sheet, SubHeader, Switch, useToast } from './ui';
import { useEffect } from 'react';

export function Privacidad({ onBack }: { onBack: () => void }) {
  const { privacy, refresh } = useStore();
  const toast = useToast();
  const [pinSheet, setPinSheet] = useState(false);
  const [bio, setBio] = useState(false);
  useEffect(() => { biometricAvailable().then(setBio); }, []);
  const save = async (p: PrivacySettings, msg?: string) => { await setSetting('privacy', p); if (p.secureScreen !== privacy.secureScreen) await setSecureScreen(p.secureScreen); await refresh(); if (msg) toast(msg); };

  return (
    <div className="screen">
      <SubHeader title="Privacidad" onBack={onBack} />
      <div className="list">
        <div className="setting"><div className="stack grow"><b>Bloqueo con PIN{bio ? ' o huella' : ''}</b><small>Al abrir la app y cada vez que volvés a ella</small></div>
          <Switch on={privacy.lock} label="Bloqueo" onChange={v => v ? setPinSheet(true) : save({ ...privacy, lock: false }, 'Bloqueo apagado')} /></div>
        {privacy.lock && <div className="setting"><div className="stack grow"><b>Cambiar el PIN</b><small>4 a 6 números</small></div><button type="button" className="btn small ghost" onClick={() => setPinSheet(true)}>Cambiar</button></div>}
        <div className="setting"><div className="stack grow"><b>Ocultar en apps recientes</b><small>{isNative() ? 'Tampoco se puede sacar captura de pantalla' : 'Funciona en la app de Android'}</small></div>
          <Switch on={privacy.secureScreen} label="Ocultar en apps recientes" onChange={v => save({ ...privacy, secureScreen: v })} /></div>
        <div className="setting"><div className="stack grow"><b>Tapar con un toque</b><small>El botón del ojo, arriba a la derecha en Hoy, tapa la pantalla al instante</small></div></div>
      </div>
      <p className="muted" style={{ fontSize: 12.5 }}>Si te olvidás el PIN, se puede entrar con la huella. Si tampoco hay huella, hay que borrar los datos de la app desde los ajustes del teléfono: por eso conviene tener una copia de seguridad.</p>
      {pinSheet && <PinSheet onClose={() => setPinSheet(false)} onSet={async hash => { setPinSheet(false); await save({ ...privacy, lock: true, pinHash: hash }, 'Bloqueo activado'); }} />}
    </div>
  );
}

function PinSheet({ onClose, onSet }: { onClose: () => void; onSet: (hash: string) => void }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [err, setErr] = useState('');
  async function ok() {
    if (!validPin(a)) return setErr('El PIN tiene que tener de 4 a 6 números.');
    if (a !== b) return setErr('Los dos PIN no coinciden.');
    onSet(await hashPin(a));
  }
  return (
    <Sheet title="Elegí un PIN" onClose={onClose}>
      <label className="field">PIN (4 a 6 números)<input type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={a} onChange={e => { setA(e.target.value.replace(/\D/g, '')); setErr(''); }} /></label>
      <label className="field">Repetilo<input type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={b} onChange={e => { setB(e.target.value.replace(/\D/g, '')); setErr(''); }} /></label>
      {err && <p className="err" role="alert">{err}</p>}
      <button type="button" className="btn" onClick={ok}>Guardar PIN</button>
    </Sheet>
  );
}
