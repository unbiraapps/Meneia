import { useEffect, useState } from 'react';
import { MIN_PASSWORD, type Envelope } from '../crypt';
import { isIOS } from '../platform';
import { activate, appleAvailable, cloudAvailable, googleAvailable, signInWithApple, MIN_ACCOUNT_PASSWORD, resetAccountPassword, signInWithEmail, signUpWithEmail, currentUser, deleteAccount, fetchEnvelope, getCloud, restoreFromCloud, signInWithGoogle, signOut, unlockExisting, uploadNow, type CloudState } from '../cloud';
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
  if (/invalid login credentials/i.test(m)) return 'Email o contraseña incorrectos.';
  if (/email not confirmed/i.test(m)) return 'Todavía no confirmaste tu email. Buscá el mail de Meneia (fijate en spam).';
  if (/already registered|already exists/i.test(m)) return 'Ya hay una cuenta con ese email. Tocá "Entrar".';
  if (/rate limit|too many/i.test(m)) return 'Demasiados intentos. Esperá unos minutos.';
  if (/valid email|invalid.*email/i.test(m)) return 'Revisá el email.';
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
  if (step.s === 'off' || step.s === 'out') return (
    <div className="card">{head}
      <p style={{ fontSize: 14, margin: 0 }}>Opcional. Entrás a tu cuenta y Meneia guarda una copia <b>cifrada en tu celular</b> antes de subirla. Solo vos podés abrirla, con una contraseña de copia que elegís vos.</p>
      <p className="muted" style={{ fontSize: 13, margin: 0 }}>Sirve si cambiás o perdés el celular. Para usar la app no hace falta cuenta.</p>
      {step.s === 'off' && <div className="alert info"><span className="dot" /><div>Todavía no está activa: falta terminar de configurar el servidor. Mientras tanto podés usar la copia en un archivo.</div></div>}
      <Login disabled={step.s === 'off'} onIn={email => run(() => afterLogin(email))} />
    </div>
  );

  if (step.s === 'new') {
    const valid = pw.length >= MIN_PASSWORD && pw === pw2 && ok;
    return (
      <div className="card">{head}
        <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>Entraste como {step.email || 'tu cuenta'}.</p>
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

/** Entrar con Google o con email y contraseña. */
function Login({ disabled, onIn }: { disabled: boolean; onIn: (email: string) => void }) {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function go(f: () => Promise<void>) {
    setBusy(true); setErr(''); setNote('');
    try { await f(); } catch (e) { setErr(errText(e)); } finally { setBusy(false); }
  }
  const submit = () => go(async () => {
    if (!emailOk) { setErr('Revisá el email.'); return; }
    if (pw.length < MIN_ACCOUNT_PASSWORD) { setErr(`La contraseña tiene que tener al menos ${MIN_ACCOUNT_PASSWORD} caracteres.`); return; }
    if (mode === 'in') { onIn(await signInWithEmail(email, pw)); setPw(''); return; }
    const r = await signUpWithEmail(email, pw);
    if (r.confirm) { setNote(`Te mandamos un mail a ${r.email}. Tocá el link para confirmar y después entrá acá.`); setMode('in'); setPw(''); }
    else { setPw(''); onIn(r.email); }
  });

  return (
    <div className="stack" style={{ gap: 12 }}>
      {appleAvailable() && <>
        <button type="button" className="btn apple" disabled={busy} onClick={() => go(async () => onIn(await signInWithApple()))}>
          <svg width="16" height="19" viewBox="0 0 17 20" aria-hidden="true" style={{ marginRight: 8 }}><path fill="currentColor" d="M14.2 10.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.5 1.3-.1 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.6-1-2.1-4.2zM11.7 3c.7-.8 1.2-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z" /></svg>
          Iniciar sesión con Apple</button>
        <div className="row" style={{ gap: 10, color: 'var(--muted)', fontSize: 12.5 }}><span style={{ flex: 1, height: 1, background: 'var(--line)' }} />o con tu email<span style={{ flex: 1, height: 1, background: 'var(--line)' }} /></div>
      </>}
      {(googleAvailable() || (disabled && !isIOS())) && <>
        <button type="button" className="btn" disabled={disabled || busy} onClick={() => go(async () => onIn(await signInWithGoogle()))}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ marginRight: 8 }}><path fill="currentColor" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" /><path fill="currentColor" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" opacity=".75" /><path fill="currentColor" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14z" opacity=".55" /><path fill="currentColor" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1z" opacity=".9" /></svg>
          Entrar con Google</button>
        <div className="row" style={{ gap: 10, color: 'var(--muted)', fontSize: 12.5 }}><span style={{ flex: 1, height: 1, background: 'var(--line)' }} />o con tu email<span style={{ flex: 1, height: 1, background: 'var(--line)' }} /></div>
      </>}
      <div className="chips" role="tablist" aria-label="Entrar o crear cuenta">
        <button type="button" role="tab" aria-selected={mode === 'in'} className={'chip' + (mode === 'in' ? ' on' : '')} disabled={disabled} onClick={() => { setMode('in'); setErr(''); }}>Entrar</button>
        <button type="button" role="tab" aria-selected={mode === 'up'} className={'chip' + (mode === 'up' ? ' on' : '')} disabled={disabled} onClick={() => { setMode('up'); setErr(''); }}>Crear cuenta</button>
      </div>
      <form className="stack" style={{ gap: 10 }} onSubmit={e => { e.preventDefault(); submit(); }}>
        <label className="field">Email<input type="email" inputMode="email" autoComplete="email" autoCapitalize="none" value={email} disabled={disabled} onChange={e => { setEmail(e.target.value); setErr(''); }} /></label>
        <label className="field">{mode === 'in' ? 'Contraseña' : `Contraseña (al menos ${MIN_ACCOUNT_PASSWORD} caracteres)`}
          <span className="row" style={{ gap: 8 }}>
            <input className="grow" type={show ? 'text' : 'password'} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} value={pw} disabled={disabled} onChange={e => { setPw(e.target.value); setErr(''); }} />
            <button type="button" className="btn ghost small" style={{ flex: 'none' }} disabled={disabled} aria-pressed={show} onClick={() => setShow(!show)}>{show ? 'Ocultar' : 'Ver'}</button>
          </span>
        </label>
        {err && <p className="err" role="alert">{err}</p>}
        {note && <div className="alert ok"><span className="dot" /><div>{note}</div></div>}
        <button type="submit" className="btn ghost" disabled={disabled || busy}>{busy ? 'Un momento…' : mode === 'in' ? 'Entrar' : 'Crear cuenta'}</button>
        {mode === 'in' && <button type="button" className="btn link" disabled={disabled || busy} onClick={() => go(async () => {
          if (!emailOk) { setErr('Escribí tu email arriba y tocá de nuevo.'); return; }
          await resetAccountPassword(email); setNote('Te mandamos un mail para elegir una contraseña nueva.');
        })}>Me olvidé la contraseña</button>}
      </form>
    </div>
  );
}
