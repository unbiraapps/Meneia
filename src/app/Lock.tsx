import { Marca } from './Marca';
import { useEffect, useState } from 'react';
import { biometricAvailable, hashPin, verifyBiometric, withBio, type BioName } from '../privacy';

/** Pantalla de bloqueo: huella o Face ID si hay, y PIN de respaldo. */
export function Lock({ pinHash, onUnlock }: { pinHash: string; onUnlock: () => void }) {
  const [pin, setPin] = useState('');
  const [bio, setBio] = useState<BioName | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    biometricAvailable().then(ok => { setBio(ok); if (ok) verifyBiometric().then(v => { if (v) onUnlock(); }); });
  }, [onUnlock]);

  async function press(k: string) {
    setErr('');
    if (k === 'del') return setPin(pin.slice(0, -1));
    if (k === 'bio') { if (await verifyBiometric()) onUnlock(); return; }
    const next = (pin + k).slice(0, 6);
    setPin(next);
    if (next.length >= 4 && (await hashPin(next)) === pinHash) { onUnlock(); return; }
    if (next.length === 6) { setErr('PIN incorrecto'); setPin(''); }
  }

  return (
    <div className="lock" role="dialog" aria-modal="true" aria-label="Meneia bloqueada">
      <Marca size={64} />
      <div className="stack" style={{ alignItems: 'center' }}>
        <h1 style={{ fontSize: 22 }}>Ingresá tu PIN</h1>
        <span className="muted" style={{ fontSize: 13 }} role="status">{err || (bio ? `o usá ${withBio(bio)}` : ' ')}</span>
      </div>
      <div className="pin-dots" aria-label={pin.length + ' números ingresados'}>{Array.from({ length: Math.max(4, pin.length) }, (_, i) => <span key={i} className={i < pin.length ? 'on' : ''} />)}</div>
      <div className="keypad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', bio ? 'bio' : '', '0', 'del'].map((k, i) => k === '' ? <span key={i} /> : (
          <button key={i} type="button" className={'key' + (k === 'bio' || k === 'del' ? ' alt' : '')} aria-label={k === 'del' ? 'Borrar' : k === 'bio' ? 'Usar ' + (bio ?? 'huella') : k} onClick={() => press(k)}>{k === 'del' ? '⌫' : k === 'bio' ? (bio === 'huella' ? 'Huella' : bio) : k}</button>
        ))}
      </div>
    </div>
  );
}
