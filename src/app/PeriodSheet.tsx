import { useState } from 'react';
import { analyze, daysBetween, type Flow, type Period, type PillType } from '../calc';
import { db, savePeriod, savePillEvent, saveProfile } from '../db';
import { notifyNow } from '../notify';
import { useStore } from './store';
import { Sheet, useToast } from './ui';

/** Anotar o editar un período del perfil activo. */
export function PeriodSheet({ editing, defaultStart, onClose }: { editing?: Period; defaultStart?: string; onClose: () => void }) {
  const { active, today, refresh, privacy } = useStore();
  const toast = useToast();
  const profile = active!.profile;
  const isSelf = profile.kind === 'self';
  const [start, setStart] = useState(editing?.start ?? defaultStart ?? '');
  const [end, setEnd] = useState(editing?.end ?? '');
  const [flow, setFlow] = useState<Flow>(editing?.flow ?? 'Normal');
  const [note, setNote] = useState(editing?.note ?? '');
  const [pill, setPill] = useState<PillType | ''>('');
  const [pillDate, setPillDate] = useState('');
  const [err, setErr] = useState('');

  async function save() {
    if (!start && !pill) return setErr('Elegí el primer día del período.');
    if (pill && !pillDate) return setErr('Elegí la fecha en que dejaste o empezaste las pastillas.');
    if (pill && pillDate > today) return setErr('La fecha de las pastillas no puede ser futura.');
    if (start && start > today) return setErr('El primer día no puede ser una fecha futura.');
    if (start && end && end < start) return setErr('El último día no puede ser antes del primero.');
    if (start && end && daysBetween(start, end) > 20) return setErr('Un período de más de 20 días parece un error. Revisá las fechas.');
    const before = new Set(active!.A.rows.flatMap(r => r.flags.map(f => r.start + f.text)));
    try {
      if (start) await savePeriod({ ...(editing?.id != null ? { id: editing.id } : {}), profileId: profile.id, start, end, flow, note: note.trim().slice(0, 500), trying: editing ? !!editing.trying : profile.trying && daysBetween(start, today) <= 45 });
      if (pill) await savePillEvent({ profileId: profile.id, date: pillDate, type: pill });
      if (start && profile.notYet) await saveProfile({ ...profile, notYet: false });
    } catch { return setErr('No se pudo guardar. Probá de nuevo.'); }
    onClose();
    await refresh();
    // ¿Apareció un cambio nuevo en el ciclo? (solo para el perfil propio)
    let msg = editing ? 'Cambios guardados' : start ? 'Período guardado' : 'Cambio de pastillas guardado';
    if (isSelf && start) {
      const periods = await db.periods.where('profileId').equals(profile.id!).toArray();
      const A = analyze(periods, active!.events, today);
      const fresh = A.rows.flatMap(r => r.flags.filter(f => !before.has(r.start + f.text)).map(f => f.text));
      if (fresh.length) { msg += ' · ojo: ' + fresh[0].toLowerCase(); notifyNow('Cambio en tu ciclo', fresh.join(' · '), privacy).catch(() => {}); }
    }
    toast(msg);
  }

  return (
    <Sheet title={editing ? 'Editar período' : 'Anotar período'} onClose={onClose}>
      <div className="grid2">
        <label className="field">Primer día<input type="date" value={start} max={today} onChange={e => { setStart(e.target.value); setErr(''); }} /></label>
        <label className="field">Último día<input type="date" value={end} max={today} onChange={e => { setEnd(e.target.value); setErr(''); }} /></label>
      </div>
      <div className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">Cantidad de flujo</span>
        <div className="chips" role="radiogroup" aria-label="Cantidad de flujo">
          {(['Leve', 'Normal', 'Abundante'] as Flow[]).map(f => <button key={f} type="button" role="radio" aria-checked={flow === f} className={'chip' + (flow === f ? ' on' : '')} onClick={() => setFlow(f)}>{f}</button>)}
        </div>
      </div>
      {isSelf && !editing && (
        <div className="stack" style={{ gap: 6 }}>
          <span className="eyebrow">Pastillas anticonceptivas</span>
          <div className="chips" role="radiogroup" aria-label="Pastillas anticonceptivas">
            {([['', 'Sin cambios'], ['stop', 'Las dejé'], ['start', 'Empecé']] as [PillType | '', string][]).map(([v, l]) => (
              <button key={l} type="button" role="radio" aria-checked={pill === v} className={'chip' + (pill === v ? ' on' : '')}
                onClick={() => { setPill(v); if (v && !pillDate) setPillDate(start || today); setErr(''); }}>{l}</button>
            ))}
          </div>
          {pill && <label className="field">Fecha en que las dejaste o empezaste<input type="date" value={pillDate} max={today} onChange={e => setPillDate(e.target.value)} /></label>}
        </div>
      )}
      {isSelf && profile.trying && !editing && <p className="muted" style={{ fontSize: 13 }}>Este ciclo se marca como "buscando embarazo".</p>}
      <label className="field">Notas<textarea rows={2} maxLength={500} value={note} placeholder="Ej: cólicos fuertes el 1er día" onChange={e => setNote(e.target.value)} /></label>
      {err && <p className="err" role="alert">{err}</p>}
      <button type="button" className="btn" onClick={save}>{editing ? 'Guardar cambios' : 'Guardar'}</button>
    </Sheet>
  );
}
