import { addDays, fmtLong, fmtShort, pillDay, type PillSettings } from '../calc';
import { savePillEvent, savePills, SELF_ID } from '../db';
import { useStore } from './store';
import { SubHeader, Switch, useToast } from './ui';
import { useState } from 'react';

const PACKS: [number, number, string][] = [[21, 7, '21 + 7 de descanso'], [24, 4, '24 + 4'], [28, 0, '28 seguidas']];
const hh = (h: number) => String(h).padStart(2, '0') + ':00';

/** Toma diaria, blíster y aviso para comprar. */
export function PillToday() {
  const { pills, today, refresh, self, afterSave } = useStore();
  const toast = useToast();
  if (!self?.A.onPill || !pills.packStart) return null;
  const pd = pillDay(pills, today);
  if (!pd) return null;
  const taken = pills.taken.includes(today);
  return (
    <div className="card" style={pd.isRest ? undefined : taken ? undefined : { borderColor: 'var(--plum)' }}>
      <div className="row">
        <div className="stack grow">
          <span className="muted" style={{ fontSize: 12.5 }}>Pastilla {pd.day} de {pd.length}</span>
          <b style={{ font: '700 18px var(--display)' }}>{pd.isRest ? 'Día de descanso' : taken ? 'Listo, ya la tomaste' : 'Te falta la de hoy'}</b>
          {pd.buyBy && <span style={{ fontSize: 12.5, color: 'var(--warn-ink)' }}>No te quedan blísters: comprá antes del {fmtShort(pd.buyBy)}</span>}
        </div>
        {!pd.isRest && <button type="button" className={'btn small' + (taken ? ' ghost' : '')} aria-pressed={taken} onClick={async () => {
          await savePills({ ...pills, taken: taken ? pills.taken.filter(d => d !== today) : [...pills.taken, today] });
          await refresh(); if (!taken) { toast('Anotado'); afterSave(); }
        }}>{taken ? 'Deshacer' : 'La tomé'}</button>}
      </div>
    </div>
  );
}

export function Pastillas({ onBack }: { onBack: () => void }) {
  const { pills, today, refresh, self } = useStore();
  const toast = useToast();
  const [start, setStart] = useState(pills.packStart || today);
  const save = async (p: PillSettings, msg?: string) => { await savePills(p); await refresh(); if (msg) toast(msg); };
  const onPill = !!self?.A.onPill;
  const pd = pillDay(pills, today);

  async function begin() {
    if (!onPill) await savePillEvent({ profileId: SELF_ID, date: start, type: 'start' });
    // Las pastillas de días anteriores del blíster se dan por tomadas
    const tmp = { ...pills, packStart: start };
    const pd0 = pillDay(tmp, today);
    const prev: string[] = [];
    if (pd0) for (let i = 0; i < pd0.day - 1; i++) { if (i + 1 <= pills.active) prev.push(addDays(pd0.packStart, i)); }
    await save({ ...tmp, stockDate: today, taken: [...pills.taken, ...prev] }, 'Listo: te aviso cada día');
  }
  async function stop() {
    await savePillEvent({ profileId: SELF_ID, date: today, type: 'stop' });
    await refresh(); toast('Anotado: dejaste las pastillas hoy');
  }

  return (
    <div className="screen">
      <SubHeader title="Pastillas" onBack={onBack} />
      {!onPill || !pills.packStart ? (
        <div className="card">
          <p style={{ fontSize: 14.5 }}>{onPill ? 'Para que te avise cada día, contame cuándo empezaste el blíster que estás usando.' : 'Si tomás pastillas anticonceptivas, la app te recuerda la de cada día y cuándo comprar el próximo blíster.'}</p>
          <label className="field">Primer día del blíster actual<input type="date" value={start} max={today} onChange={e => setStart(e.target.value)} /></label>
          <div className="chips" role="radiogroup" aria-label="Tipo de blíster">{PACKS.map(([a, r, l]) => <button key={l} type="button" role="radio" aria-checked={pills.active === a && pills.rest === r} className={'chip' + (pills.active === a && pills.rest === r ? ' on' : '')} onClick={() => save({ ...pills, active: a, rest: r })}>{l}</button>)}</div>
          <button type="button" className="btn" onClick={begin}>{onPill ? 'Guardar' : 'Empecé a tomarlas'}</button>
        </div>
      ) : (
        <>
          <PillToday />
          {pd && (
            <div className="card">
              <div className="top"><h2>Este blíster</h2><span className="muted" style={{ fontSize: 12.5 }}>empezó el {fmtShort(pd.packStart)}</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 8 }} aria-label={`Pastilla ${pd.day} de ${pd.length}`}>
                {Array.from({ length: pd.length }, (_, i) => {
                  const d = addDays(pd.packStart, i), n = i + 1, rest = n > pills.active, done = pills.taken.includes(d), past = d < today;
                  const st: React.CSSProperties = { aspectRatio: '1', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700 };
                  if (rest) Object.assign(st, { background: 'var(--line)', color: 'var(--muted)' });
                  else if (done) Object.assign(st, { background: 'var(--plum)', color: 'var(--on-plum)' });
                  else Object.assign(st, { border: '2px solid ' + (past ? 'var(--alert-ink)' : 'var(--plum)'), color: past ? 'var(--alert-ink)' : 'var(--plum)' });
                  if (d === today) Object.assign(st, { outline: '2px solid var(--fg)', outlineOffset: 2 });
                  return <span key={i} style={st} title={fmtLong(d)}>{done ? '✓' : n}</span>;
                })}
              </div>
              <div className="legend"><span><i style={{ background: 'var(--plum)', borderRadius: '50%' }} />Tomada</span><span><i style={{ border: '2px solid var(--alert-ink)', borderRadius: '50%', width: 10, height: 10 }} />Sin marcar</span>{pills.rest > 0 && <span><i style={{ background: 'var(--line)', borderRadius: '50%' }} />Descanso</span>}</div>
            </div>
          )}
          <div className="list">
            <div className="setting"><div className="stack grow"><b>Blísters en casa</b><small>{pd?.stockNow ? `Sin contar el que estás usando` : 'Te aviso para comprar antes de que se termine'}</small></div>
              <button type="button" className="icon-btn" aria-label="Uno menos" onClick={() => save({ ...pills, stock: Math.max(0, (pd?.stockNow ?? 0) - 1), stockDate: today })}>−</button>
              <b className="num" style={{ minWidth: 20, textAlign: 'center' }}>{pd?.stockNow ?? 0}</b>
              <button type="button" className="icon-btn" aria-label="Uno más" onClick={() => save({ ...pills, stock: (pd?.stockNow ?? 0) + 1, stockDate: today })}>+</button></div>
            <div className="setting"><div className="stack grow"><b>Recordatorio diario</b><small>Discreto, como los demás avisos</small></div>
              <select aria-label="Hora del recordatorio" value={pills.hour} onChange={e => save({ ...pills, hour: Number(e.target.value) })} style={{ width: 'auto' }}>{Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{hh(h)}</option>)}</select>
              <Switch on={pills.remind} label="Recordatorio diario" onChange={v => save({ ...pills, remind: v })} /></div>
          </div>
          <button type="button" className="btn ghost" onClick={stop}>Las dejé hoy</button>
        </>
      )}
    </div>
  );
}
