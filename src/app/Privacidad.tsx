import { useState } from 'react';
import type { PrivacySettings } from '../calc';
import { setSetting } from '../db';
import { setSecureScreen, biometricAvailable, type BioName } from '../privacy';
import { PinSheet } from './Pin';
import { isNative } from '../notify';
import { useStore } from './store';
import { SubHeader, Switch, useToast } from './ui';
import { useEffect } from 'react';

export function Privacidad({ onBack }: { onBack: () => void }) {
  const { privacy, refresh } = useStore();
  const toast = useToast();
  const [pinSheet, setPinSheet] = useState(false);
  const [bio, setBio] = useState<BioName | null>(null);
  useEffect(() => { biometricAvailable().then(setBio); }, []);
  const save = async (p: PrivacySettings, msg?: string) => { await setSetting('privacy', p); if (p.secureScreen !== privacy.secureScreen) await setSecureScreen(p.secureScreen); await refresh(); if (msg) toast(msg); };

  return (
    <div className="screen">
      <SubHeader title="Privacidad" onBack={onBack} />
      <div className="list">
        <div className="setting"><div className="stack grow"><b>Bloqueo con PIN{bio ? ' o ' + bio : ''}</b><small>Al abrir la app y cada vez que volvés a ella</small></div>
          <Switch on={privacy.lock} label="Bloqueo" onChange={v => v ? setPinSheet(true) : save({ ...privacy, lock: false }, 'Bloqueo apagado')} /></div>
        {privacy.lock && <div className="setting"><div className="stack grow"><b>Cambiar el PIN</b><small>4 a 6 números</small></div><button type="button" className="btn small ghost" onClick={() => setPinSheet(true)}>Cambiar</button></div>}
        <div className="setting"><div className="stack grow"><b>Ocultar en apps recientes</b><small>{isNative() ? 'Tampoco se puede sacar captura de pantalla' : 'Funciona en la app del celular'}</small></div>
          <Switch on={privacy.secureScreen} label="Ocultar en apps recientes" onChange={v => save({ ...privacy, secureScreen: v })} /></div>
        <div className="setting"><div className="stack grow"><b>Tapar con un toque</b><small>El botón del ojo, arriba a la derecha en Hoy, tapa la pantalla al instante</small></div></div>
      </div>
      <p className="muted" style={{ fontSize: 12.5 }}>Si te olvidás el PIN, se puede entrar con {bio ? (bio === 'huella' ? 'la huella' : bio) : 'la huella o Face ID'}. Si tampoco tenés eso, hay que borrar la app o sus datos: por eso conviene tener una copia de seguridad.</p>
      {pinSheet && <PinSheet onClose={() => setPinSheet(false)} />}
    </div>
  );
}
