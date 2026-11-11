// Período pendiente, tests y embarazo registrado.
// Nada cambia solo: ni un atraso ni un test cambian el estado. El embarazo se registra con una acción explícita y se puede deshacer.
import { useState } from 'react';
import {
  activePregnancy, cycleRegistros, fmtLong, fmtShort, isPending, plural, showsPregnancy, NOTE_MAX, TEST_RESULTS,
  type Registro, type TestResult,
} from '../calc';
import { addRegistro, deleteRegistro, saveProfile, updateRegistro } from '../db';
import { useStore, type ProfileData } from './store';
import { DateField, Sheet, useToast } from './ui';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const RESULT_LABEL: Record<TestResult, string> = { positivo: 'Positivo', negativo: 'Negativo', inconcluso: 'Inconcluso' };

/** Anota "todavía no me vino" para hoy (una vez por día). */
export function useNotYet(d: ProfileData | null) {
  const { today, refresh } = useStore();
  const toast = useToast();
  return async () => {
    if (!d) return;
    const { A, profile, registros } = d;
    if (!registros.some(r => r.tipo === 'todavia-no' && r.fecha === today)) await addRegistro({ profileId: profile.id, tipo: 'todavia-no', fecha: today });
    await refresh();
    const who = profile.kind === 'child' ? 'Sus' : 'Tus';
    toast(A.rangeEnd && today <= A.rangeEnd ? `Anotado. ${who} posibles días siguen hasta el ${fmtShort(A.rangeEnd)}` : 'Anotado. La fecha era una estimación');
  };
}

const checkedToday = (rs: Registro[], today: string) => rs.some(r => r.tipo === 'todavia-no' && r.fecha === today);

/** Tarjeta "Período pendiente" de Hoy: pasaron los posibles días sin período anotado. */
export function PendingCard({ d, onCameIn }: { d: ProfileData; onCameIn: () => void }) {
  const { today } = useStore();
  const notYet = useNotYet(d);
  const { A, profile, registros } = d;
  if (!isPending(A) || !A.rangeStart || !A.rangeEnd) return null;
  const child = profile.kind === 'child';
  return (
    <div className="card pend" role="status">
      <span className="pill-tag">Período pendiente</span>
      <h2>{plural(A.late, 'día', 'días')} después de lo estimado</h2>
      <p style={{ fontSize: 14 }}>Lo esperábamos entre el {fmtShort(A.rangeStart)} y el {fmtShort(A.rangeEnd)}. <span className="muted">Era una estimación según {child ? 'sus' : 'tus'} ciclos: un corrimiento así puede pasar.</span></p>
      <div className="btns">
        <button type="button" className={'btn ' + (child ? 'fam' : 'period')} onClick={onCameIn}>{child ? `Le vino a ${profile.name}` : 'Me vino'}</button>
        {!checkedToday(registros, today) && <button type="button" className="btn ghost" onClick={notYet}>Todavía no</button>}
      </div>
      {checkedToday(registros, today) && <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>Hoy anotaste que todavía no {child ? 'le' : 'te'} vino.</p>}
    </div>
  );
}

/** Tests del ciclo actual. Solo con "Buscar embarazo" (perfil propio, 18+). */
export function TestsCard({ d }: { d: ProfileData }) {
  const { today } = useStore();
  const [sheet, setSheet] = useState<false | 'new' | Registro | 'preg'>(false);
  const { A, profile, registros } = d;
  if (!showsPregnancy(profile, today, registros) || A.pregnantSince) return null;
  const tests = cycleRegistros(registros, A).filter(r => r.tipo === 'test');
  const checked = cycleRegistros(registros, A).some(r => r.tipo === 'todavia-no');
  if (!isPending(A) && !checked && !tests.length) return null;
  return (
    <>
      <div className="card">
        <div className="top">
          <h2 style={{ fontSize: 17 }}>Tests</h2>
          <button type="button" className="btn link" style={{ minHeight: 40, fontSize: 14 }} onClick={() => setSheet('new')}>{tests.length ? '+ Registrar otro' : '+ Registrar un test'}</button>
        </div>
        {tests.length ? (
          <ul className="tests" aria-label="Tests registrados">
            {tests.map(t => (
              <li key={t.id}>
                <span>{cap(fmtLong(t.fecha))}</span>
                <span className={'res ' + t.resultado}>{RESULT_LABEL[t.resultado!]}</span>
                <button type="button" className="btn link" style={{ minHeight: 40, fontSize: 13.5, marginLeft: 'auto' }} aria-label={`Editar el test del ${fmtLong(t.fecha)}`} onClick={() => setSheet(t)}>Editar</button>
              </li>
            ))}
          </ul>
        ) : <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>Si querés, anotá un test. Es opcional.</p>}
      </div>
      <button type="button" className="btn ghost" onClick={() => setSheet('preg')}>Registrar embarazo confirmado</button>
      {(sheet === 'new' || (sheet && typeof sheet === 'object')) && <TestSheet d={d} editing={typeof sheet === 'object' ? sheet : undefined} onClose={() => setSheet(false)} />}
      {sheet === 'preg' && <ConfirmPregnancySheet d={d} onClose={() => setSheet(false)} />}
    </>
  );
}

/** Registrar o corregir un test. Guardarlo no cambia nada más en la app. */
export function TestSheet({ d, editing, date, onClose }: { d: ProfileData; editing?: Registro; date?: string; onClose: () => void }) {
  const { today, refresh, afterSave } = useStore();
  const toast = useToast();
  const [fecha, setFecha] = useState(editing?.fecha ?? date ?? today);
  const [res, setRes] = useState<TestResult | ''>(editing?.resultado ?? '');
  const [nota, setNota] = useState(editing?.nota ?? '');
  const [err, setErr] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  async function save() {
    if (!fecha) return setErr('Elegí la fecha del test.');
    if (fecha > today) return setErr('La fecha no puede ser futura.');
    if (!res) return setErr('Elegí el resultado.');
    if (editing?.id != null) await updateRegistro(editing.id, { fecha, resultado: res, nota });
    else await addRegistro({ profileId: d.profile.id, tipo: 'test', fecha, resultado: res, nota });
    onClose(); await refresh(); toast(editing ? 'Test corregido' : 'Test guardado'); afterSave();
  }
  async function del() {
    if (editing?.id == null) return;
    await deleteRegistro(editing.id); onClose(); await refresh(); toast('Test borrado');
  }
  return (
    <Sheet title={editing ? 'Corregir test' : 'Registrar un test'} onClose={onClose}>
      <DateField label="Fecha" value={fecha} max={today} onChange={v => { setFecha(v); setErr(''); }} />
      <div className="stack" style={{ gap: 6 }}>
        <span className="eyebrow" id="res-lbl">Resultado</span>
        <div className="chips" role="radiogroup" aria-labelledby="res-lbl">
          {TEST_RESULTS.map(r => <button key={r.value} type="button" role="radio" aria-checked={res === r.value} className={'chip' + (res === r.value ? ' on' : '')} onClick={() => { setRes(r.value); setErr(''); }}>{r.label}</button>)}
        </div>
      </div>
      <label className="field">Nota (opcional)<input value={nota} maxLength={NOTE_MAX} onChange={e => setNota(e.target.value)} placeholder="Ej.: de farmacia, a la mañana" /></label>
      {err && <p className="err" role="alert">{err}</p>}
      <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>Anotarlo no cambia nada más en la app.</p>
      <button type="button" className="btn" onClick={save}>{editing ? 'Guardar cambios' : 'Guardar test'}</button>
      {editing && (confirmDel
        ? <div className="alert warn"><span className="dot" /><div className="grow">¿Borrar este test?<div className="row" style={{ gap: 8, marginTop: 8 }}><button type="button" className="btn small" onClick={del}>Sí, borrar</button><button type="button" className="btn link" onClick={() => setConfirmDel(false)}>No</button></div></div></div>
        : <button type="button" className="btn link" onClick={() => setConfirmDel(true)}>Borrar test</button>)}
    </Sheet>
  );
}

/** Confirmación explícita. Dice qué se pausa antes de hacerlo. */
export function ConfirmPregnancySheet({ d, onClose }: { d: ProfileData; onClose: () => void }) {
  const { today, refresh, pills } = useStore();
  const toast = useToast();
  const { A, profile, registros } = d;
  const lastPositive = cycleRegistros(registros, A).find(r => r.tipo === 'test' && r.resultado === 'positivo')?.fecha;
  const [fecha, setFecha] = useState(lastPositive ?? today);
  const pillAsk = A.onPill && pills.remind;
  const [pausePills, setPausePills] = useState(true);
  const [stopTrying, setStopTrying] = useState(true);
  const [err, setErr] = useState('');
  async function save() {
    if (!fecha) return setErr('Elegí desde cuándo.');
    if (fecha > today) return setErr('La fecha no puede ser futura.');
    if (A.last && fecha < A.last.start) return setErr(`La fecha no puede ser anterior a tu último período (${fmtShort(A.last.start)}).`);
    await addRegistro({ profileId: profile.id, tipo: 'embarazo', fecha, fin: null, pausoPastillas: pillAsk && pausePills, buscabaAntes: profile.trying });
    if (profile.trying && stopTrying) await saveProfile({ ...profile, trying: false });
    onClose(); await refresh(); toast('Embarazo registrado');
  }
  return (
    <Sheet title="Registrar embarazo" onClose={onClose}>
      <p style={{ fontSize: 14.5, margin: 0 }}>Mientras esté registrado:</p>
      <ul className="plain-list">
        <li>Pausamos las fechas estimadas y la ventana fértil.</li>
        <li>Pausamos los avisos del ciclo.</li>
        <li>Tus registros no se borran.</li>
      </ul>
      <DateField label="Desde" value={fecha} max={today} onChange={v => { setFecha(v); setErr(''); }} />
      {pillAsk && <label className="row check-row"><input type="checkbox" checked={pausePills} onChange={e => setPausePills(e.target.checked)} />Pausar también el aviso de pastillas</label>}
      {profile.trying && <label className="row check-row"><input type="checkbox" checked={stopTrying} onChange={e => setStopTrying(e.target.checked)} />Desactivar "Buscar embarazo"</label>}
      {err && <p className="err" role="alert">{err}</p>}
      <button type="button" className="btn" onClick={save}>Sí, registrar</button>
      <button type="button" className="btn link" onClick={onClose}>Ahora no</button>
      <p className="muted" style={{ fontSize: 12.5, textAlign: 'center', margin: 0 }}>Lo podés deshacer cuando quieras.</p>
    </Sheet>
  );
}

/** Tarjeta de Hoy mientras hay un embarazo registrado. */
export function PregnancyCard({ d }: { d: ProfileData }) {
  const [sheet, setSheet] = useState<false | 'back' | 'undo'>(false);
  const preg = activePregnancy(d.registros);
  if (!preg) return null;
  return (
    <>
      <div className="card preg" role="status">
        <span className="pill-tag ok">Embarazo registrado</span>
        <h2>Desde el {fmtLong(preg.fecha).replace(/^\S+ /, '')}</h2>
        <p className="muted" style={{ fontSize: 14, margin: 0 }}>Pausamos las fechas estimadas y los avisos del ciclo. Tus consultas y recordatorios de Salud siguen igual.</p>
      </div>
      <div className="stack" style={{ gap: 6 }}>
        <button type="button" className="btn ghost" onClick={() => setSheet('back')}>Volver a seguir mi ciclo</button>
        <button type="button" className="btn link" onClick={() => setSheet('undo')}>Deshacer este registro</button>
      </div>
      {sheet === 'back' && <BackToCycleSheet d={d} preg={preg} onClose={() => setSheet(false)} />}
      {sheet === 'undo' && <UndoPregnancySheet d={d} preg={preg} onClose={() => setSheet(false)} />}
    </>
  );
}

function BackToCycleSheet({ d, preg, onClose }: { d: ProfileData; preg: Registro; onClose: () => void }) {
  const { today, refresh } = useStore();
  const toast = useToast();
  const [fin, setFin] = useState(today);
  const [retry, setRetry] = useState(false);
  const [err, setErr] = useState('');
  async function save() {
    if (!fin) return setErr('Elegí desde cuándo.');
    if (fin > today) return setErr('La fecha no puede ser futura.');
    if (fin < preg.fecha) return setErr(`No puede ser antes del ${fmtShort(preg.fecha)}, cuando lo registraste.`);
    await updateRegistro(preg.id!, { fin });
    if (retry && !d.profile.trying) await saveProfile({ ...d.profile, trying: true });
    onClose(); await refresh(); toast('Listo. Cuando te venga, anotalo');
  }
  return (
    <Sheet title="Volver a seguir tu ciclo" onClose={onClose}>
      <DateField label="¿Desde cuándo?" value={fin} max={today} onChange={v => { setFin(v); setErr(''); }} />
      <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>Cuando anotes tu próximo período, las fechas se calculan de nuevo. Los primeros 3 ciclos tienen un rango más amplio, porque pueden variar.</p>
      {!d.profile.trying && <label className="row check-row"><input type="checkbox" checked={retry} onChange={e => setRetry(e.target.checked)} />Volver a activar "Buscar embarazo"</label>}
      {err && <p className="err" role="alert">{err}</p>}
      <button type="button" className="btn" onClick={save}>Guardar</button>
      <button type="button" className="btn link" onClick={onClose}>Cancelar</button>
    </Sheet>
  );
}

function UndoPregnancySheet({ d, preg, onClose }: { d: ProfileData; preg: Registro; onClose: () => void }) {
  const { refresh } = useStore();
  const toast = useToast();
  async function undo() {
    await deleteRegistro(preg.id!);
    if (!!preg.buscabaAntes !== d.profile.trying) await saveProfile({ ...d.profile, trying: !!preg.buscabaAntes });
    onClose(); await refresh(); toast('Registro deshecho');
  }
  return (
    <Sheet title="Deshacer el registro" onClose={onClose}>
      <p style={{ fontSize: 14.5, margin: 0 }}>Se borra el registro de embarazo del {fmtShort(preg.fecha)}, como si no lo hubieras anotado. Vuelven las fechas estimadas y los avisos. Tus tests y períodos quedan como estaban.</p>
      <button type="button" className="btn" onClick={undo}>Sí, deshacer</button>
      <button type="button" className="btn link" onClick={onClose}>Cancelar</button>
    </Sheet>
  );
}

/** Después de volver al ciclo, hasta que anote el primer período. */
export function AwaitingCard({ onCameIn }: { onCameIn: () => void }) {
  return (
    <div className="card">
      <h2 style={{ fontSize: 18 }}>Volviste a seguir tu ciclo</h2>
      <p className="muted" style={{ fontSize: 14, margin: 0 }}>Cuando te venga, anotalo y empezamos a estimar tus fechas de nuevo.</p>
      <button type="button" className="btn period" onClick={onCameIn}>Me vino</button>
    </div>
  );
}
