import { useState } from 'react';
import { plural } from '../calc';
import { exportBackup, parseBackup, restoreBackup, type Backup } from '../db';
import { isNative } from '../notify';
import { useStore } from './store';
import { SubHeader, useToast } from './ui';
import { CloudCard } from './Nube';

type View = 'elegir' | 'archivo' | 'nube';

/**
 * Copia de seguridad: primero se elige dónde (archivo o nube), como en la maqueta aprobada.
 * Con `recuperar` (desde "Ya uso Meneia" en la bienvenida) solo ofrece traer una copia existente.
 */
export function Copia({ onBack, recuperar, onRestored }: { onBack: () => void; recuperar?: boolean; onRestored?: () => void }) {
  const { refresh, today, self } = useStore();
  const hasPreg = !!self?.registros.some(r => r.tipo !== 'todavia-no');
  const toast = useToast();
  const [view, setView] = useState<View>('elegir');
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
    if (pending) { await restoreBackup(pending); setPending(null); setText(''); await refresh(); toast('Copia restaurada'); onRestored?.(); return; }
    const r = parseBackup(text.trim());
    if (!r.ok) return setErr(r.error);
    setPending(r.data);
  }

  const back = () => (view === 'elegir' ? onBack() : setView('elegir'));
  const title = recuperar ? 'Recuperar mi copia' : 'Copia de seguridad';

  if (view === 'elegir') return (
    <div className="screen">
      <SubHeader title={title} onBack={back} />
      <p className="step-caption">{recuperar ? 'Elegí dónde está tu copia' : 'Elegí dónde guardar tu copia'}</p>
      <h2 className="serif-title">{recuperar ? 'Tu historia, de vuelta con vos.' : 'Que tu historia siga con vos.'}</h2>
      <p className="muted" style={{ fontSize: 14.5 }}>{recuperar
        ? 'Si guardaste una copia en tu celular anterior, la podés traer a este.'
        : 'Podés guardar una copia de tus registros para recuperarlos si cambiás de celular.'}</p>
      <button type="button" className="option" onClick={() => setView('archivo')}>
        <strong>{recuperar ? 'Desde un archivo' : 'Guardar un archivo'}</strong>
        <span>{recuperar ? 'Elegí el archivo de copia que guardaste.' : 'Descargás una copia y elegís dónde conservarla. Vos cuidás ese archivo.'}</span>
      </button>
      <button type="button" className="option cloud" onClick={() => setView('nube')}>
        <strong>{recuperar ? 'Desde la nube' : 'Guardar en la nube'}</strong>
        <span>{recuperar ? 'Entrás con la misma cuenta y escribís la contraseña de la copia.' : 'La copia queda asociada a tu cuenta. Se protege con una contraseña antes de salir de tu celular.'}</span>
      </button>
      <button type="button" className="btn link" onClick={onBack}>{recuperar ? 'Volver' : 'Ahora no'}</button>
      {!recuperar && <p className="muted" style={{ fontSize: 12.5, textAlign: 'center' }}>Es opcional. Podés seguir usando Meneia sin activar la copia en la nube.</p>}
    </div>
  );

  if (view === 'nube') return (
    <div className="screen">
      <SubHeader title={title} onBack={back} />
      <CloudCard recuperar={recuperar} onRestored={onRestored} />
    </div>
  );

  return (
    <div className="screen">
      <SubHeader title={title} onBack={back} />
      {!recuperar && <>
        <h2 className="serif-title">Una copia en un archivo</h2>
        <p className="muted" style={{ fontSize: 14 }}>Sin cuenta: guardás vos el archivo donde quieras. El archivo no lleva contraseña, así que conservalo en un lugar privado.</p>
        {hasPreg && <div className="alert warn"><span className="dot" /><div>Este archivo incluye tus tests y registros de embarazo. Guardalo en un lugar privado.</div></div>}
        <div className="btns">
          <button type="button" className="btn" onClick={share}>{isNative() ? 'Guardar o compartir copia' : 'Copiar mis datos'}</button>
        </div>
      </>}
      <div className="card">
        <h2>{recuperar ? 'Elegí tu copia' : 'Restaurar una copia'}</h2>
        <label className="field">Elegí el archivo<input type="file" accept=".json,application/json,text/plain" onChange={async e => { const f = e.target.files?.[0]; if (f) { setText(await f.text()); setErr(''); setPending(null); } }} /></label>
        <label className="field">o pegá el texto de la copia<textarea rows={4} value={text} onChange={e => { setText(e.target.value); setErr(''); setPending(null); }} placeholder='{"app":"mi-ciclo-lila", ...}' /></label>
        {err && <p className="err" role="alert">{err}</p>}
        {pending && <div className="alert warn"><span className="dot" /><div>La copia tiene {plural(pending.periods.length, 'período', 'períodos')}{pending.profiles?.length ? ` y ${plural(pending.profiles.length, 'perfil', 'perfiles')}` : ''}. Va a reemplazar lo que tenés ahora.</div></div>}
        <button type="button" className={'btn ' + (pending ? '' : 'ghost')} onClick={check}>{pending ? 'Sí, restaurar' : 'Revisar copia'}</button>
      </div>
    </div>
  );
}
