import { useState } from 'react';
import { cycleSymptoms, daysBetween, fmtLong, fmtShort, patterns, plural, type Period, type PillEvent, type Row } from '../calc';
import { db } from '../db';
import { useStore } from './store';
import { useToast } from './ui';
import { ProfileChips } from './Hoy';
import { PeriodSheet } from './PeriodSheet';

export function Historial() {
  const { active, today, refresh } = useStore();
  const toast = useToast();
  const [editing, setEditing] = useState<Period | null>(null);
  const [adding, setAdding] = useState(false);
  const [sure, setSure] = useState<string | null>(null);
  if (!active) return null;
  const { profile, A, events } = active;

  type Item = { d: string; r?: Row; e?: PillEvent };
  const items: Item[] = [...A.rows.map((r): Item => ({ d: r.start, r })), ...events.map((e): Item => ({ d: e.date, e }))]
    .sort((a, b) => (a.d === b.d ? (a.e ? -1 : 1) : a.d < b.d ? 1 : -1));
  const ongoing = (r: Row) => !r.end && A.last?.start === r.start && daysBetween(r.start, today) <= 10;

  async function del(key: string, id: number) {
    if (sure !== key) { setSure(key); return; }
    setSure(null);
    if (key.startsWith('p')) await db.periods.delete(id); else await db.events.delete(id);
    await refresh(); toast('Registro borrado');
  }

  const ev = A.lastPill;
  const reps = patterns(active.symptoms, A.rows);
  const nextStart = (r: Row) => { const i = A.rows.findIndex(x => x.start === r.start); return A.rows[i + 1]?.start ?? null; };
  let seguidos = 0, meses = 0;
  if (A.tryingSince) { seguidos = A.rows.filter(r => r.start >= A.tryingSince!).length; meses = Math.floor(daysBetween(A.tryingSince, today) / 30.4); }

  return (
    <div className="screen">
      <div className="top"><h1>Historial</h1><span className="muted num" style={{ fontSize: 13 }}>{plural(A.rows.length, 'período', 'períodos')}</span></div>
      <ProfileChips />
      <div className="fum"><span>FUM · fecha de última menstruación</span><b>{A.last ? fmtLong(A.last.start) : 'Sin datos'}</b></div>

      {profile.kind === 'self' && A.tryingCycles > 0 && (
        <div className="status try"><span aria-hidden="true">♥</span><div className="stack">
          {A.tryingSince ? <><b>Buscando embarazo desde el {fmtLong(A.tryingSince)}</b><span className="muted" style={{ fontSize: 12.5 }}>{seguidos === 1 ? 'Primer ciclo' : `${seguidos} ciclos seguidos`}{meses >= 1 ? ` · ${plural(meses, 'mes', 'meses')}` : ''}</span></>
            : <><b>{plural(A.tryingCycles, 'ciclo', 'ciclos')} buscando embarazo</b><span className="muted" style={{ fontSize: 12.5 }}>En este momento no está activo</span></>}
        </div></div>
      )}
      {ev && (
        <div className="status pill"><span style={{ width: 26, height: 14, borderRadius: 999, background: 'linear-gradient(90deg,var(--plum) 50%,var(--fertile) 50%)', flex: 'none' }} />
          <div className="stack"><b>{ev.type === 'stop' ? 'Dejaste las pastillas el' : 'Tomás pastillas desde el'} {fmtLong(ev.date)}</b>
            <span className="muted" style={{ fontSize: 12.5 }}>{plural(A.rows.filter(r => r.start > ev.date).length, 'período', 'períodos')} desde entonces</span></div></div>
      )}

      {reps.length > 0 && (
        <div className="card soft" style={{ gap: 4 }}>
          <span className="muted" style={{ fontSize: 12 }}>Lo que se repite</span>
          {reps.map((x, i) => <span key={i} style={{ fontSize: 14 }}><b>{x.what}</b> {x.when}, en {x.hits} de tus últimos {x.of} ciclos.</span>)}
        </div>
      )}
      {!items.length ? <div className="empty">Todavía no hay nada anotado{profile.kind === 'child' ? ` para ${profile.name}` : ''}.</div> : (
        <ul className="hist">
          {items.map(({ r, e }) => e ? (
            <li key={'e' + e.id} className="ev">
              <span className="bar" />
              <div className="grow"><div className="when num">{fmtShort(e.date)} · {e.type === 'stop' ? 'Dejaste las pastillas' : 'Empezaste las pastillas'}</div>
                <div className="meta">{e.type === 'stop' ? 'Los ciclos pueden tardar unos meses en acomodarse' : 'Mientras tomás pastillas, la ovulación estimada no aplica'}</div></div>
              <div className="ops"><button type="button" className={'op' + (sure === 'e' + e.id ? ' sure' : '')} onClick={() => del('e' + e.id, e.id!)}>{sure === 'e' + e.id ? '¿Borrar?' : 'Borrar'}</button></div>
            </li>
          ) : (
            <li key={'p' + r!.id} className={r!.trying ? 'trying' : ''}>
              <span className="bar" />
              <div className="grow">
                <div className="when num">{fmtShort(r!.start)}{r!.end ? ' – ' + fmtShort(r!.end) : ongoing(r!) ? ' · en curso' : ''}</div>
                <div className="meta num">{r!.dur ? plural(r!.dur, 'día', 'días') : ongoing(r!) ? 'Todavía sin último día' : 'Falta el último día'} · {r!.flow}{r!.cycle ? ` · ciclo de ${r!.cycle} días` : ' · ciclo actual'}</div>
                {r!.note && <div className="note">{r!.note}</div>}
                {(() => { const sy = cycleSymptoms(active.symptoms, r!.start, nextStart(r!)); return sy.length ? <div className="meta" style={{ marginTop: 4 }}>Síntomas: {sy.join(', ').toLowerCase()}</div> : null; })()}
                {(r!.flags.length > 0 || r!.trying || r!.adapt || r!.atypical) && profile.kind === 'self' && (
                  <div className="flags">{r!.trying && <span className="flag try">♥ Buscando embarazo</span>}{r!.adapt && <span className="flag" style={{ background: 'var(--soft)', color: 'var(--plum)' }}>Ciclo de adaptación</span>}{r!.atypical && <span className="flag" style={{ background: 'var(--soft)', color: 'var(--muted)' }}>Ciclo raro · no cuenta</span>}{r!.flags.map((f, i) => <span key={i} className={'flag ' + f.level}>{f.text}</span>)}</div>
                )}
              </div>
              <div className="ops">
                <button type="button" className="op" onClick={() => setEditing(r!)}>Editar</button>
                <button type="button" className={'op' + (sure === 'p' + r!.id ? ' sure' : '')} onClick={() => del('p' + r!.id, r!.id!)}>{sure === 'p' + r!.id ? '¿Borrar?' : 'Borrar'}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="btn ghost" onClick={() => setAdding(true)}>Anotar un período anterior</button>
      {editing && <PeriodSheet editing={editing} onClose={() => setEditing(null)} />}
      {adding && <PeriodSheet onClose={() => setAdding(false)} />}
    </div>
  );
}
