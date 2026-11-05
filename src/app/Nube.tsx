import { useEffect, useState } from 'react';
import { MIN_PASSWORD, type Envelope } from '../crypt';
import { activate, cloudAvailable, cloudConfigured, currentUser, deleteAccount, fetchEnvelope, getCloud, restoreFromCloud, signInWithGoogle, signOut, unlockExisting, uploadNow, type CloudState } from '../cloud';
import { restoreBackup, type Backup } from '../db';
import { plural } from '../calc';
import { useStore } from './store';
import { useToast } from './ui';

type Step =
  | { s: 'loading' } | { s: 'off' } | { s: 'out' }
  | { s: 'new'; email: string } | { s: 'found'; email: string; env: Envelope }
  | { s: 'confirm'; email: string; data: Backup }
  | { s: 'on'; c: CloudState };

const when = (iso: string) => iso ? new Date(iso).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'todavía no';
const errText = (e: unknown) => {
  const m = String((e as Error)?.message ?? e);
  if (/cancel/i.test(m)) return 'Cancelaste el ingreso.';
  if (/network|fetch|failed to/i.test(m)) return 'No hay conexión. Probá de nuevo en un rato.';
  return 'No se pudo completar. Probá de nuevo.';
};

/** Copia cifrada en la nube: opcional, con Google, cifrada con una contraseña que solo sabe ella. */
export function CloudCard() {
  const { refresh } = useStore();
  const toast = useToast();
  const [step, setStep] = useState<Step>({ s: 'loading' });
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [sure, setSure] = useState<'' | 'restore' | 'delete'>('');

  async function load() {
    if (!cloudAvailable()) return setStep({ s: 'off' });
    const c = await getCloud();
    const email = await currentUser().catch(() => null);
    if (c && email != null) return setStep({ s: 'on', c });
    if (email == null) return setStep({ s: 'out' });
    await afterLogin(email);
  }
  async function afterLogin(email: string) {
    const env = await fetchEnvelope();
    setStep(env ? { s: 'found', email, env } : { s: 'new', email });
  }
  useEffect(() => { load(); }, []);

  async function run(f: () => Promise<void>) {
    setBusy(true); setErr('');
    try { await f(); } catch (e) { setErr(errText(e)); } finally { setBusy(false); }
  }

  const head = <><h2>Copia en la nube</h2></>;

  if (step.s === 'loading') return null;
  if (step.s === 'off') return (
    <div className="card">{head}
      <p className="muted" style={{ fontSize: 14 }}>{cloudConfigured() ? 'Está disponible en la app de Android.' : 'Muy pronto vas a poder guardar una copia cifrada entrando con Google. Mientras tanto, usá la copia en un archivo.'}</p>
    </div>
  );

  if (step.s === 'out') return (
    <div className="card">{head}
      <p style={{ fontSize: 14, margin: 0 }}>Opcional. Entrás con Google y Meneia guarda una copia <b>cifrada en tu celular</b> antes de subirla. Solo vos podés abrirla, con una contraseña que elegís vos.</p>
      <p className="muted" style={{ fontSize: 13, margin: 0 }}>Sirve si cambiás o perdés el celular. Para usar la app no hace falta cuenta.</p>
      {err && <p className="err" role="alert">{err}</p>}
      <button type="button" className="btn" disabled={busy} onClick={() => run(async () => { const email = await signInWithGoogle(); await afterLogin(email); })}>{busy ? 'Entrando…' : 'Entrar con Google'}</button>
    </div>
  );

  if (step.s === 'new') {
    const valid = pw.length >= MIN_PASSWORD && pw === pw2 && ok;
    return (
      <div className="card">{head}
        <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>Entraste como {step.email || 'tu cuenta de Google'}.</p>
        <p style={{ fontSize: 14, margin: 0 }}>Elegí una <b>contraseña de copia</b>. Con ella se cifran tus datos antes de salir del celular.</p>
        <label className="field">Contraseña de copia<input type="password" autoComplete="new-password" value={pw} onChange={e => { setPw(e.target.value); setErr(''); }} /></label>
        <label className="field">Repetila<input type="password" autoComplete="new-password" value={pw2} onChange={e => { setPw2(e.target.value); setErr(''); }} /></label>
        {pw.length > 0 && pw.length < MIN_PASSWORD && <small className="muted">Tiene que tener al menos {MIN_PASSWORD} caracteres.</small>}
        {pw2.length > 0 && pw !== pw2 && <small className="muted">No coinciden.</small>}
        <div className="alert warn"><span className="dot" /><div><b>Si te olvidás esta contraseña, no podemos recuperar tu copia.</b> Nadie la conoce, ni Meneia. Anotala en un lugar seguro.</div></div>
        <label className="row" style={{ gap: 10, fontSize: 14 }}><input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} style={{ width: 22, height: 22, margin: 0, flex: 'none', accentColor: 'var(--plum)' }} />Entiendo que si la olvido, pierdo la copia</label>
        {err && <p className="err" role="alert">{err}</p>}
        <button type="button" className="btn" disabled={!valid || busy} onClick={() => run(async () => { const c = await activate(pw, step.email); setPw(''); setPw2(''); setStep({ s: 'on', c }); toast('Copia en la nube activada'); })}>{busy ? 'Cifrando y subiendo…' : 'Activar copia'}</button>
        <button type="button" className="btn link" onClick={() => run(async () => { await signOut(); setStep({ s: 'out' }); })}>Salir sin activar</button>
      </div>
    );
  }

  if (step.s === 'found') return (
    <div className="card">{head}
      <p style={{ fontSize: 14, margin: 0 }}>Encontramos una copia de {step.email || 'tu cuenta'}. Escribí tu contraseña de copia para abrirla.</p>
      <label className="field">Contraseña de copia<input type="password" autoComplete="current-password" value={pw} onChange={e => { setPw(e.target.value); setErr(''); }} /></label>
      {err && <p className="err" role="alert">{err}</p>}
      <button type="button" className="btn" disabled={!pw || busy} onClick={() => run(async () => {
        const data = await unlockExisting(step.env, pw, step.email);
        if (!data) { setErr('Esa no es la contraseña de esta copia.'); return; }
        setPw(''); setStep({ s: 'confirm', email: step.email, data });
      })}>{busy ? 'Abriendo…' : 'Abrir copia'}</button>
      <button type="button" className="btn link" onClick={() => run(async () => { await signOut(); setStep({ s: 'out' }); })}>Salir</button>
    </div>
  );

  if (step.s === 'confirm') return (
    <div className="card">{head}
      <p style={{ fontSize: 14, margin: 0 }}>La copia tiene {plural(step.data.periods.length, 'período', 'períodos')}{step.data.profiles?.length ? ` y ${plural(step.data.profiles.length, 'perfil', 'perfiles')}` : ''}.</p>
      <button type="button" className="btn" disabled={busy} onClick={() => run(async () => { await restoreBackup(step.data); await refresh(); await load(); toast('Copia recuperada'); })}>Recuperar y reemplazar lo de este celular</button>
      <button type="button" className="btn ghost" disabled={busy} onClick={() => run(async () => { const c = await uploadNow(); if (c) setStep({ s: 'on', c }); toast('Seguís con lo de este celular'); })}>Seguir con lo de este celular</button>
    </div>
  );

  const c = step.c;
  return (
    <div className="card">{head}
      <div className="alert ok"><span className="dot" /><div>Activada{c.email ? ` con ${c.email}` : ''}. Se sube sola, cifrada, cuando cambia algo.<br /><small>Última copia: {when(c.lastUpload)}</small></div></div>
      {err && <p className="err" role="alert">{err}</p>}
      <button type="button" className="btn ghost" disabled={busy} onClick={() => run(async () => { const n = await uploadNow(); if (n) setStep({ s: 'on', c: n }); toast('Copia subida'); })}>{busy ? 'Subiendo…' : 'Subir copia ahora'}</button>
      <button type="button" className={'btn ' + (sure === 'restore' ? '' : 'ghost')} disabled={busy} onClick={() => {
        if (sure !== 'restore') return setSure('restore');
        setSure(''); run(async () => { if (await restoreFromCloud()) { await refresh(); toast('Copia recuperada'); } else setErr('No se pudo abrir la copia de la nube.'); });
      }}>{sure === 'restore' ? '¿Reemplazar lo de este celular con la copia?' : 'Recuperar desde la nube'}</button>
      <button type="button" className="btn link" disabled={busy} onClick={() => run(async () => { await signOut(); setStep({ s: 'out' }); toast('Sesión cerrada. Tu copia sigue guardada'); })}>Cerrar sesión</button>
      <button type="button" className={'btn ' + (sure === 'delete' ? 'danger' : 'link')} style={sure === 'delete' ? undefined : { color: 'var(--alert-ink)' }} disabled={busy} onClick={() => {
        if (sure !== 'delete') return setSure('delete');
        setSure(''); run(async () => { await deleteAccount(); setStep({ s: 'out' }); toast('Copia y cuenta borradas. Tus datos siguen en este celular'); });
      }}>{sure === 'delete' ? '¿Borrar la copia y la cuenta para siempre?' : 'Borrar mi copia y mi cuenta'}</button>
    </div>
  );
}
