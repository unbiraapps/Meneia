import { useState } from 'react';
import { plural } from '../calc';
import { exportBackup, parseBackup, restoreBackup, type Backup } from '../db';
import { isNative } from '../notify';
import { useStore } from './store';
import { SubHeader, useToast } from './ui';
import { CloudCard } from './Nube';

export function Copia({ onBack }: { onBack: () => void }) {
  const { refresh, today } = useStore();
  const toast = useToast();
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [pending, setPending] = useState<Backup | null>(null);
  const json = async () => JSON.stringify(await exportBackup(), null, 1);

  async function copy() {
    const t = await json();
    try { await navigator.clipboard.writeText(t); toast('Copiado. Pegalo en tus notas o en un chat con vos misma'); }
    catch { setText(t); toast('Seleccioná el texto de abajo y copialo'); }
  }
  async function share() {
    const t = await json();
    if (isNative()) {
      try { const { Share } = await import('../share'); await Share(`meneia-copia-${today}.json`, t); return; } catch { /* sigue */ }
    }
    copy();
  }
  async function check() {
    if (pending) { await restoreBackup(pending); setPending(null); setText(''); await refresh(); toast('Copia restaurada'); return; }
    const r = parseBackup(text.trim());
    if (!r.ok) return setErr(r.error);
    setPending(r.data);
  }

  return (
    <div className="screen">
      <SubHeader title="Copia de seguridad" onBack={onBack} />
      <CloudCard />
      <h2 style={{ margin: '6px 0 0' }}>Copia en un archivo</h2>
      <p className="muted" style={{ fontSize: 14 }}>Sin cuenta: guardás vos el archivo donde quieras, por ejemplo en tus notas o en un chat con vos misma.</p>
      <div className="btns">
        <button type="button" className="btn" onClick={share}>{isNative() ? 'Guardar o compartir copia' : 'Copiar mis datos'}</button>
      </div>
      <div className="card">
        <h2>Restaurar una copia</h2>
        <label className="field">Pegá el texto de la copia<textarea rows={4} value={text} onChange={e => { setText(e.target.value); setErr(''); setPending(null); }} placeholder='{"app":"mi-ciclo-lila", ...}' /></label>
        <label className="field">o elegí el archivo<input type="file" accept=".json,application/json,text/plain" onChange={async e => { const f = e.target.files?.[0]; if (f) { setText(await f.text()); setErr(''); setPending(null); } }} /></label>
        {err && <p className="err" role="alert">{err}</p>}
        {pending && <div className="alert warn"><span className="dot" /><div>La copia tiene {plural(pending.periods.length, 'período', 'períodos')}{pending.profiles?.length ? ` y ${plural(pending.profiles.length, 'perfil', 'perfiles')}` : ''}. Va a reemplazar lo que tenés ahora.</div></div>}
        <button type="button" className={'btn ' + (pending ? '' : 'ghost')} onClick={check}>{pending ? 'Sí, restaurar' : 'Revisar copia'}</button>
      </div>
    </div>
  );
}
