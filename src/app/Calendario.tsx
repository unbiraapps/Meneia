import { useState } from 'react';
import { addDays, daysBetween, dayKinds, fmtLong, iso, toDate, MONTHS_LONG, showsFertility, type DayKind } from '../calc';
import { savePeriod } from '../db';
import { useStore } from './store';
import { useToast } from './ui';
import { PeriodSheet } from './PeriodSheet';
import { SymptomSheet } from './SymptomSheet';

const NAMES: Record<DayKind, string> = { period: 'período', pred: 'período probable', maybe: 'posible período', fertile: 'fértil', ovu: 'ovulación', pill: 'cambio de pastillas', try: 'buscando embarazo', sym: 'síntomas anotados' };

export function Calendario() {
  const { active, today, refresh } = useStore();
  const toast = useToast();
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth());
  const [sel, setSel] = useState(today);
  const [sheet, setSheet] = useState<false | 'edit' | 'sym'>(false);
  if (!active) return null;
  const { profile, A, events } = active;
  const fert = showsFertility(profile);
  const kinds = dayKinds(A, events);
  const symDays = new Set(active.symptoms.map(s => s.date));

  const first = new Date(Date.UTC(y, m, 1));
  const start = iso(new Date(first.getTime() - ((first.getUTCDay() + 6) % 7) * 864e5));
  const cells: string[] = [];
  for (let i = 0; i < 42; i++) { const s = addDays(start, i); if (i === 35 && toDate(s).getUTCMonth() !== m) break; cells.push(s); }
  const move = (d: number) => { let mm = m + d, yy = y; if (mm < 0) { mm = 11; yy--; } if (mm > 11) { mm = 0; yy++; } setM(mm); setY(yy); };

  const selKinds = kinds.get(sel) ?? new Set<DayKind>();
  const inPeriod = A.rows.find(r => sel >= r.start && sel <= (r.end || addDays(r.start, (r.dur ?? A.avgDur) - 1)));
  const prevStart = [...A.rows].reverse().find(r => r.start <= sel);

  async function startHere() {
    await savePeriod({ profileId: profile.id, start: sel, end: '', flow: 'Normal', note: '', trying: profile.trying && daysBetween(sel, today) <= 45 });
    await refresh(); toast('Anotado el ' + fmtLong(sel));
  }
  async function endHere() {
    if (!prevStart) return;
    await savePeriod({ ...prevStart, end: sel });
    await refresh(); toast('Anotado que terminó el ' + fmtLong(sel));
  }

  return (
    <div className="screen">
      <div className="top">
        <h1>Calendario</h1>
        <div className="row" style={{ gap: 6 }}>
          <button type="button" className="icon-btn" aria-label="Mes anterior" onClick={() => move(-1)}>‹</button>
          <span style={{ font: '700 16px var(--display)', minWidth: 104, textAlign: 'center', textTransform: 'capitalize' }}>{MONTHS_LONG[m]} {y}</span>
          <button type="button" className="icon-btn" aria-label="Mes siguiente" onClick={() => move(1)}>›</button>
        </div>
      </div>
      <div className="cal">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i} className="dow" aria-hidden="true">{d}</span>)}
        {cells.map(s => {
          const k = kinds.get(s) ?? new Set<DayKind>();
          let c = 'day';
          if (toDate(s).getUTCMonth() !== m) c += ' out';
          if (k.has('period')) c += ' period';
          else if (fert && k.has('ovu')) c += ' ovu';
          else if (k.has('pred')) c += ' pred';
          else if (k.has('maybe')) c += ' maybe';
          else if (fert && k.has('fertile')) c += ' fertile';
          if (k.has('pill')) c += ' pill';
          if (symDays.has(s)) c += ' sym';
          if (fert && k.has('try') && (k.has('fertile') || k.has('ovu'))) c += ' try';
          if (s === today) c += ' today';
          if (s === sel) c += ' sel';
          const lab = [...k].filter(x => fert || (x !== 'ovu' && x !== 'fertile' && x !== 'try')).map(x => NAMES[x]).join(', ');
          return <button key={s} type="button" className={c} aria-label={fmtLong(s) + (lab ? ', ' + lab : '')} aria-pressed={s === sel} onClick={() => setSel(s)}>{toDate(s).getUTCDate()}</button>;
        })}
      </div>
      <div className="legend">
        <span><i style={{ background: 'var(--period)' }} />Período</span>
        <span><i style={{ border: '2px dashed var(--period)', width: 10, height: 10 }} />Más probable</span>
        <span><i style={{ border: '2px dotted var(--line)', width: 10, height: 10 }} />Posible</span>
        {fert && <><span><i style={{ background: 'var(--fertile)' }} />Fértil</span><span><i style={{ background: 'var(--ovu)' }} />Ovulación</span></>}
        {profile.kind === 'self' && <span><i style={{ background: 'var(--plum)', borderRadius: '50%', width: 9, height: 9 }} />Pastillas</span>}
      </div>
      <div className="card">
        <div className="top">
          <h2>{fmtLong(sel).charAt(0).toUpperCase() + fmtLong(sel).slice(1)}</h2>
          <span className="muted" style={{ fontSize: 12.5 }}>{[...selKinds].filter(x => fert || (x !== 'ovu' && x !== 'fertile' && x !== 'try')).map(x => NAMES[x]).join(' · ')}</span>
        </div>
        {sel > today ? <p className="muted" style={{ fontSize: 14 }}>Es un día futuro: se puede anotar cuando llegue.</p> : (
          <div className="btns">
            {!inPeriod && <button type="button" className="btn period small" onClick={startHere}>Empezó este día</button>}
            {prevStart && !prevStart.end && daysBetween(prevStart.start, sel) <= 20 && <button type="button" className="btn ghost small" onClick={endHere}>Terminó este día</button>}
            {inPeriod && <button type="button" className="btn ghost small" onClick={() => setSheet('edit')}>Editar período</button>}
            <button type="button" className="btn ghost small" onClick={() => setSheet('sym')}>{symDays.has(sel) ? 'Ver síntomas' : 'Cómo estaba'}</button>
          </div>
        )}
      </div>
      {sheet === 'edit' && inPeriod && <PeriodSheet editing={inPeriod} onClose={() => setSheet(false)} />}
      {sheet === 'sym' && <SymptomSheet date={sel} onClose={() => setSheet(false)} />}
    </div>
  );
}
