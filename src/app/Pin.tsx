import { useEffect, useState } from 'react';
import { setSetting, getPrivacy } from '../db';
import { biometricAvailable, hashPin, validPin } from '../privacy';
import { useStore } from './store';
import { Sheet, useToast } from './ui';

/** Elegir un PIN de 4 a 6 números (y usar la huella si el celular la tiene). */
export function PinForm({ onSaved, cta = 'Guardar PIN' }: { onSaved: () => void; cta?: string }) {
  const { refresh } = useStore();
  const toast = useToast();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [err, setErr] = useState('');
  const [bio, setBio] = useState(false);
  useEffect(() => { biometricAvailable().then(setBio); }, []);

  async function ok() {
    if (!validPin(a)) return setErr('El PIN tiene que tener de 4 a 6 números.');
    if (a !== b) return setErr('Los dos PIN no coinciden.');
    const pr = await getPrivacy();
    await setSetting('privacy', { ...pr, lock: true, pinHash: await hashPin(a) });
    await refresh();
    toast(bio ? 'Listo: Meneia se abre con tu huella o tu PIN' : 'Listo: Meneia se abre con tu PIN');
    onSaved();
  }
  return (
    <div className="stack" style={{ gap: 12 }}>
      <label className="field">PIN (4 a 6 números)<input type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={a} onChange={e => { setA(e.target.value.replace(/\D/g, '')); setErr(''); }} /></label>
      <label className="field">Repetilo<input type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={b} onChange={e => { setB(e.target.value.replace(/\D/g, '')); setErr(''); }} /></label>
      {bio && <p className="muted" style={{ fontSize: 13 }}>También vas a poder entrar con tu huella.</p>}
      {err && <p className="err" role="alert">{err}</p>}
      <button type="button" className="btn" onClick={ok}>{cta}</button>
    </div>
  );
}

export function PinSheet({ onClose }: { onClose: () => void }) {
  return <Sheet title="Elegí un PIN" onClose={onClose}><PinForm onSaved={onClose} /></Sheet>;
}
