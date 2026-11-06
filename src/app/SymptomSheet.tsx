import { useState } from 'react';
import { BODY, MOOD, PAIN, fmtLong, patterns, type SymptomLog } from '../calc';
import { getSetting, saveSymptoms, setSetting } from '../db';
import { useStore } from './store';
import { Sheet, useToast } from './ui';
import { useEffect } from 'react';

/** Cómo estás hoy (o el día elegido): dolor, cuerpo, ánimo y una nota. Las hijas solo registran dolor y ánimo. */
export function SymptomSheet({ date, onClose }: { date: string; onClose: () => void }) {
  const { active, refresh, afterSave } = useStore();
  const toast = useToast();
  const profile = active!.profile;
  const isChild = profile.kind === 'child';
  const prev = active!.symptoms.find(s => s.date === date);
  const [pain, setPain] = useState(prev?.pain ?? 0);
  const [body, setBody] = useState<string[]>(prev?.body ?? []);
  const [mood, setMood] = useState<string[]>(prev?.mood ?? []);
  const [note, setNote] = useState(prev?.note ?? '');
  const [custom, setCustom] = useState<string[]>([]);
  const [adding, setAdding] = useState('');
  useEffect(() => { getSetting<string[]>('customSymptoms', []).then(setCustom); }, []);
  const toggle = (list: string[], set: (v: string[]) => void, x: string) => set(list.includes(x) ? list.filter(y => y !== x) : [...list, x]);
  const reps = patterns(active!.symptoms, active!.A.rows);

  async function save() {
    const log: SymptomLog = { profileId: profile.id, date, pain, body: isChild ? [] : body, mood, note };
    await saveSymptoms(log);
    onClose(); await refresh();
    const n = (pain ? 1 : 0) + log.body.length + mood.length;
    toast(n || note.trim() ? 'Guardado' : 'Sin síntomas para ese día');
    afterSave();
  }
  async function addCustom() {
    const t = adding.trim().slice(0, 30);
    if (!t || BODY.includes(t) || custom.includes(t)) { setAdding(''); return; }
    const next = [...custom, t]; setCustom(next); setBody([...body, t]); setAdding('');
    await setSetting('customSymptoms', next);
  }

  const Chips = ({ title, items, sel, onTap, single }: { title: string; items: string[]; sel: (x: string) => boolean; onTap: (x: string) => void; single?: boolean }) => (
    <div className="stack" style={{ gap: 8 }}>
      <span className="eyebrow">{title}</span>
      <div className="chips" role={single ? 'radiogroup' : 'group'} aria-label={title}>
        {items.map(x => <button key={x} type="button" role={single ? 'radio' : undefined} aria-checked={single ? sel(x) : undefined} aria-pressed={single ? undefined : sel(x)} className={'chip' + (sel(x) ? ' on' : '')} onClick={() => onTap(x)}>{x}</button>)}
      </div>
    </div>
  );

  return (
    <Sheet title={isChild ? `Cómo está ${profile.name}` : '¿Cómo estás?'} onClose={onClose}>
      <span className="muted" style={{ fontSize: 13, marginTop: -8 }}>{fmtLong(date)}</span>
      <Chips title="Dolor" items={PAIN} sel={x => PAIN[pain] === x} onTap={x => setPain(PAIN.indexOf(x))} single />
      {!isChild && (
        <>
          <Chips title="Cuerpo" items={[...BODY, ...custom]} sel={x => body.includes(x)} onTap={x => toggle(body, setBody, x)} />
          <form className="row" onSubmit={e => { e.preventDefault(); addCustom(); }}>
            <input type="text" className="grow" value={adding} maxLength={30} onChange={e => setAdding(e.target.value)} placeholder="Agregar otro síntoma" aria-label="Agregar otro síntoma" />
            <button type="submit" className="btn small ghost">Agregar</button>
          </form>
        </>
      )}
      <Chips title="Ánimo" items={MOOD} sel={x => mood.includes(x)} onTap={x => toggle(mood, setMood, x)} />
      <label className="field">Nota<textarea rows={2} maxLength={300} value={note} onChange={e => setNote(e.target.value)} placeholder="Opcional" /></label>
      {reps.length > 0 && (
        <div className="card soft" style={{ gap: 4 }}>
          <span className="muted" style={{ fontSize: 12 }}>Lo que se repite</span>
          {reps.slice(0, 2).map((r, i) => <span key={i} style={{ fontSize: 14 }}><b>{r.what}</b> {r.when}, en {r.hits} de tus últimos {r.of} ciclos.</span>)}
        </div>
      )}
      <button type="button" className="btn" onClick={save}>Guardar</button>
    </Sheet>
  );
}
