import { useState } from 'react';
import { addDays, daysBetween, fmtLong, plural } from '../calc';
import { setSetting } from '../db';
import { useStore, type Health } from './store';
import { Switch, useToast } from './ui';

export function Salud() {
  const { health, today, refresh } = useStore();
  const toast = useToast();
  const [q, setQ] = useState('');
  const save = async (h: Health, msg?: string) => { await setSetting('health', h); await refresh(); if (msg) toast(msg); };
  const due = health.lastConsult ? addDays(health.lastConsult, Math.round(health.controlMonths * 30.4)) : '';
  const ago = health.lastConsult ? daysBetween(health.lastConsult, today) : 0;

  return (
    <div className="screen">
      <h1>Salud</h1>
      <div className="card">
        <span className="eyebrow">Consultas</span>
        <label className="field">Última consulta con la ginecóloga
          <input type="date" value={health.lastConsult} max={today} onChange={e => save({ ...health, lastConsult: e.target.value }, 'Consulta guardada')} />
        </label>
        {health.lastConsult && <p className="muted" style={{ fontSize: 13 }}>Hace {ago < 60 ? plural(ago, 'día', 'días') : plural(Math.floor(ago / 30.4), 'mes', 'meses')}.</p>}
        <div className="row" style={{ paddingTop: 10, borderTop: '1px solid var(--line)' }}>
          <div className="stack grow"><b style={{ fontSize: 14.5 }}>Aviso del próximo control</b>
            <small className="muted" style={{ fontSize: 12.5 }}>{health.controlOn && due ? `Te aviso el ${fmtLong(due)}` : 'Apagado'}</small></div>
          <Switch on={health.controlOn} label="Aviso del próximo control" onChange={v => save({ ...health, controlOn: v })} />
        </div>
        {health.controlOn && (
          <div className="chips" role="radiogroup" aria-label="Cada cuánto">
            {[6, 12].map(n => <button key={n} type="button" role="radio" aria-checked={health.controlMonths === n} className={'chip' + (health.controlMonths === n ? ' on' : '')} onClick={() => save({ ...health, controlMonths: n })}>{n === 6 ? 'A los 6 meses' : 'Al año'}</button>)}
          </div>
        )}
      </div>

      <div className="card">
        <span className="eyebrow">Para preguntar la próxima vez</span>
        {health.questions.length === 0 && <p className="muted" style={{ fontSize: 14 }}>Anotá acá lo que se te ocurra preguntar, así no te lo olvidás en la consulta.</p>}
        {health.questions.map((x, i) => (
          <div key={i} className="row">
            <input type="checkbox" checked={x.done} aria-label={'Ya la pregunté: ' + x.text} style={{ width: 22, height: 22, accentColor: 'var(--plum)', margin: 0, flex: 'none' }}
              onChange={() => save({ ...health, questions: health.questions.map((y, j) => j === i ? { ...y, done: !y.done } : y) })} />
            <span className="grow" style={{ fontSize: 14.5, textDecoration: x.done ? 'line-through' : 'none', color: x.done ? 'var(--muted)' : 'inherit' }}>{x.text}</span>
            <button type="button" className="btn link" style={{ fontSize: 13 }} onClick={() => save({ ...health, questions: health.questions.filter((_, j) => j !== i) })}>Borrar</button>
          </div>
        ))}
        <form className="row" onSubmit={e => { e.preventDefault(); const t = q.trim(); if (!t) return; setQ(''); save({ ...health, questions: [...health.questions, { text: t.slice(0, 200), done: false }] }); }}>
          <input type="text" className="grow" value={q} onChange={e => setQ(e.target.value)} placeholder="Ej: ¿cuándo me toca el PAP?" aria-label="Nueva pregunta" />
          <button type="submit" className="btn small">Agregar</button>
        </form>
      </div>
    </div>
  );
}
