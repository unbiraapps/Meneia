import { useState } from 'react';
import { addDays, daysBetween, fmtLong, fmtShort, plural } from '../calc';
import { setSetting } from '../db';
import { useStore, withLast, type Consult, type Health } from './store';
import { Sheet, Switch, useToast } from './ui';

const REASONS = ['Control anual', 'Por mi ciclo', 'Por dolor', 'Por pastillas', 'Otro'];

export function Salud() {
  const { health, today, refresh, afterSave } = useStore();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [sheet, setSheet] = useState<Consult | 'new' | null>(null);
  const [sure, setSure] = useState<number | null>(null);
  const save = async (h: Health, msg?: string) => { await setSetting('health', withLast(h)); await refresh(); if (msg) { toast(msg); afterSave(); } };
  const due = health.lastConsult ? addDays(health.lastConsult, Math.round(health.controlMonths * 30.4)) : '';
  const ago = health.lastConsult ? daysBetween(health.lastConsult, today) : 0;
  const list = [...health.consults].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="screen">
      <h1>Salud</h1>
      <div className="card">
        <span className="eyebrow">Última consulta con la ginecóloga</span>
        {health.lastConsult ? (
          <div className="stack"><b style={{ font: '700 22px var(--display)' }}>{fmtLong(health.lastConsult)}</b>
            <span className="muted" style={{ fontSize: 13 }}>Hace {ago < 60 ? plural(ago, 'día', 'días') : plural(Math.floor(ago / 30.4), 'mes', 'meses')}</span></div>
        ) : <p className="muted" style={{ fontSize: 14 }}>Todavía no anotaste ninguna consulta.</p>}
        <div className="row" style={{ paddingTop: 10, borderTop: '1px solid var(--line)' }}>
          <div className="stack grow"><b style={{ fontSize: 14.5 }}>Aviso del próximo control</b>
            <small className="muted" style={{ fontSize: 12.5 }}>{health.controlOn && due ? `Te aviso el ${fmtLong(due)} de ${due.slice(0, 4)}` : health.controlOn ? 'Anotá una consulta para calcularlo' : 'Apagado'}</small></div>
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

      <div className="stack" style={{ gap: 8 }}>
        <h2>Consultas anteriores</h2>
        {list.length > 0 && (
          <div className="list">
            {list.map((c, i) => (
              <div key={c.date + i} className="setting">
                <div className="stack grow"><b>{c.reason || 'Consulta'}</b><small>{fmtShort(c.date)} {c.date.slice(0, 4)}{c.note ? ' · ' + c.note : ''}</small></div>
                <button type="button" className="btn link" style={{ fontSize: 13 }} onClick={() => setSheet(c)}>Editar</button>
                <button type="button" className={'btn small ' + (sure === i ? 'danger' : 'link')} style={{ fontSize: 13 }} onClick={() => {
                  if (sure !== i) { setSure(i); return; }
                  setSure(null); save({ ...health, lastConsult: '', consults: health.consults.filter(x => x !== c) }, 'Consulta borrada');
                }}>{sure === i ? '¿Borrar?' : 'Borrar'}</button>
              </div>
            ))}
          </div>
        )}
        <button type="button" className="btn ghost" onClick={() => setSheet('new')}>Anotar una consulta</button>
      </div>
      {sheet && <ConsultSheet consult={sheet === 'new' ? null : sheet} onClose={() => setSheet(null)} onSave={async c => {
        const rest = sheet === 'new' ? health.consults : health.consults.filter(x => x !== sheet);
        setSheet(null); await save({ ...health, lastConsult: '', consults: [...rest, c] }, 'Consulta guardada');
      }} />}
    </div>
  );
}

function ConsultSheet({ consult, onClose, onSave }: { consult: Consult | null; onClose: () => void; onSave: (c: Consult) => void }) {
  const { today } = useStore();
  const [date, setDate] = useState(consult?.date ?? today);
  const [reason, setReason] = useState(consult?.reason ?? 'Control anual');
  const [note, setNote] = useState(consult?.note ?? '');
  const [err, setErr] = useState('');
  return (
    <Sheet title={consult ? 'Editar consulta' : 'Anotar una consulta'} onClose={onClose}>
      <label className="field">Fecha<input type="date" value={date} max={today} onChange={e => { setDate(e.target.value); setErr(''); }} /></label>
      <div className="stack" style={{ gap: 6 }}><span className="eyebrow">Motivo</span>
        <div className="chips" role="radiogroup" aria-label="Motivo">{REASONS.map(r => <button key={r} type="button" role="radio" aria-checked={reason === r} className={'chip' + (reason === r ? ' on' : '')} onClick={() => setReason(r)}>{r}</button>)}</div></div>
      <label className="field">Nota (lo que te dijeron, qué tenés que hacer)<textarea rows={3} maxLength={300} value={note} onChange={e => setNote(e.target.value)} /></label>
      {err && <p className="err" role="alert">{err}</p>}
      <button type="button" className="btn" onClick={() => { if (!date || date > today) return setErr('Elegí una fecha que no sea futura.'); onSave({ date, reason, note: note.trim().slice(0, 300) }); }}>Guardar</button>
    </Sheet>
  );
}
