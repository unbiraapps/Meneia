// Embarazo registrado, posparto y pausa. Versión sencilla: pocos datos por pantalla.
// Los textos de salud (tamaños, "Esta semana", controles y "Cuándo consultar") son un borrador a revisar por una profesional.
import { useEffect, useState } from 'react';
import { activePregnancy, daysBetween, fmtLong, fmtShort, plural, type Registro } from '../calc';
import { deleteRegistro, getSetting, saveProfile, setSetting, updateRegistro } from '../db';
import {
  CONSULT_SIGNS, POST_CHECKS, afterStage, controlsOf, fmtSize, fruitFor, fumOf, pregnancyInfo, repeatText, repeatedSymptom, sizeFor, weekText,
  type Control,
} from '../embarazo';
import { Fruta } from './Frutas';
import { useStore, type ProfileData } from './store';
import { DateField, Icon, Sheet, SubHeader, Switch, useToast } from './ui';

export type GestView = 'tamano' | 'controles' | 'consultar';

const longDate = (d: string) => fmtLong(d).replace(/^\S+ /, '');
const withYear = (d: string) => `${fmtShort(d)} ${d.slice(0, 4)}`;

/** Comparar con frutas: ajuste de la usuaria (prendido por defecto). */
function useFruits(): [boolean, (v: boolean) => void] {
  const [on, setOn] = useState(true);
  useEffect(() => { getSetting('frutas', true).then(setOn); }, []);
  return [on, (v: boolean) => { setOn(v); setSetting('frutas', v); }];
}

/** Hoy durante el embarazo: semana, barra por trimestres, fecha probable y tamaño. */
export function PregnancyToday({ d, open, onSym }: { d: ProfileData; open: (v: GestView) => void; onSym: () => void }) {
  const { today, refresh } = useStore();
  const [sheet, setSheet] = useState<false | 'medico' | 'terminar'>(false);
  const [fruits] = useFruits();
  const preg = activePregnancy(d.registros);
  if (!preg) return null;
  const fum = fumOf(preg, d.periods.map(p => p.start)) ?? preg.fecha;
  const info = pregnancyInfo(fum, today);
  const size = sizeFor(info.week);
  const fruit = fruits ? fruitFor(info.week) : null;
  const ctrls = controlsOf(preg).filter(c => c.trimestre === info.trimester);
  const rep = repeatedSymptom(d.symptoms, today, fum);
  const repKey = rep ? `${rep.what}:${rep.since}` : '';
  const showRep = rep && !(preg.avisosVistos ?? []).includes(repKey);
  const left = preg.fppMedico ? daysBetween(today, preg.fppMedico) : null;

  return (
    <>
      <div className="card preg-card">
        <span className="eyebrow" style={{ color: 'var(--ok-ink)' }}>Embarazo</span>
        <span className="preg-week">Semana {info.week}</span>
        <div className="tri-bar" role="img" aria-label={`Semana ${info.week} de 40, ${info.trimester}.º trimestre`}><i style={{ width: `${Math.round(info.progress * 100)}%` }} /></div>
        <div className="tri-lbl"><span>1.er trimestre</span><span>2.º</span><span>3.º</span></div>
        <div className="kvs">
          {preg.fppMedico ? (
            <>
              <button type="button" className="kv" onClick={() => setSheet('medico')}><span>{preg.fppTipo === 'programada' ? 'Programada por el médico' : 'Estimada por el médico'}</span><b>{withYear(preg.fppMedico)}</b></button>
              <div className="kv"><span>Fecha probable (calculada)</span><span>{withYear(info.fpp)}</span></div>
              {left != null && left >= 0 && <div className="kv"><span>Faltan</span><b>{left === 0 ? 'Es hoy' : plural(left, 'día', 'días')}</b></div>}
            </>
          ) : <div className="kv"><span>Fecha probable de parto</span><b>{withYear(info.fpp)}</b></div>}
          {size && (fruit ? (
            <button type="button" className="kv size" onClick={() => open('tamano')}>
              <span className="fruit-box"><Fruta id={fruit.id} size={34} /></span>
              <span className="grow" style={{ textAlign: 'left' }}><b>{fmtSize(size)}</b><small>Como {fruit.name}</small></span><Icon.chev />
            </button>
          ) : (
            <button type="button" className="kv" onClick={() => open('tamano')}><span>Tamaño aprox.</span><b>{fmtSize(size)}</b></button>
          ))}
          {!preg.fppMedico && <button type="button" className="kv add" onClick={() => setSheet('medico')}>+ Agregar la fecha del médico</button>}
        </div>
      </div>
      {showRep && rep && (
        <div className="card soft" style={{ gap: 6 }}>
          <p style={{ fontSize: 14, margin: 0 }}>{repeatText(rep)}</p>
          <button type="button" className="btn link" style={{ alignSelf: 'flex-start', minHeight: 36, padding: 0 }} onClick={async () => { await updateRegistro(preg.id!, { avisosVistos: [...(preg.avisosVistos ?? []), repKey] }); await refresh(); }}>Entendido</button>
        </div>
      )}
      <div className="list">
        <button type="button" className="list-item" onClick={() => open('controles')}>
          <span className="grow"><b>Controles</b><small>{ctrls.filter(c => c.hecho).length} de {ctrls.length} hechos este trimestre</small></span><Icon.chev /></button>
      </div>
      <button type="button" className="btn ghost" onClick={onSym}>Cómo estoy</button>
      <button type="button" className="btn link quiet" onClick={() => setSheet('terminar')}>Terminar el embarazo</button>
      {sheet === 'medico' && <DoctorDateSheet preg={preg} onClose={() => setSheet(false)} />}
      {sheet === 'terminar' && <EndSheet d={d} preg={preg} onClose={() => setSheet(false)} />}
    </>
  );
}

/** Fecha que da el médico: estimada (ecografía) o programada (cesárea o inducción). La calculada se sigue mostrando. */
function DoctorDateSheet({ preg, onClose }: { preg: Registro; onClose: () => void }) {
  const { today, refresh } = useStore();
  const toast = useToast();
  const [tipo, setTipo] = useState<'estimada' | 'programada'>(preg.fppTipo ?? 'estimada');
  const [fecha, setFecha] = useState(preg.fppMedico ?? '');
  const [err, setErr] = useState('');
  async function save() {
    if (!fecha) return setErr('Elegí la fecha.');
    if (fecha < today) return setErr('La fecha no puede ser pasada.');
    await updateRegistro(preg.id!, { fppMedico: fecha, fppTipo: tipo }); onClose(); await refresh(); toast('Fecha guardada');
  }
  async function del() { await updateRegistro(preg.id!, { fppMedico: null }); onClose(); await refresh(); toast('Fecha borrada'); }
  return (
    <Sheet title="Fecha del médico" onClose={onClose}>
      <div className="chips" role="radiogroup" aria-label="Tipo de fecha">
        {(['estimada', 'programada'] as const).map(t => <button key={t} type="button" role="radio" aria-checked={tipo === t} className={'chip' + (tipo === t ? ' on' : '')} onClick={() => setTipo(t)}>{t === 'estimada' ? 'Fecha estimada' : 'Fecha programada'}</button>)}
      </div>
      <p className="muted" style={{ fontSize: 13, margin: 0 }}>{tipo === 'estimada' ? 'La que te dieron por la ecografía.' : 'Una cesárea o inducción con día fijo.'}</p>
      <DateField label="Fecha" value={fecha} min={today} onChange={v => { setFecha(v); setErr(''); }} />
      <p className="muted" style={{ fontSize: 13, margin: 0 }}>La fecha probable calculada por Meneia se sigue mostrando, para comparar.</p>
      {err && <p className="err" role="alert">{err}</p>}
      <button type="button" className="btn" onClick={save}>Guardar</button>
      {preg.fppMedico && <button type="button" className="btn link" onClick={del}>Borrar la fecha del médico</button>}
    </Sheet>
  );
}

/** Terminar el embarazo: dos opciones, sin preguntar por qué. "Lo registré por error" lo deshace. */
function EndSheet({ d, preg, onClose }: { d: ProfileData; preg: Registro; onClose: () => void }) {
  const { today, refresh } = useStore();
  const toast = useToast();
  const [kind, setKind] = useState<'nacimiento' | 'terminado' | 'error' | null>(null);
  const [fin, setFin] = useState(today);
  const [err, setErr] = useState('');
  async function save() {
    if (kind === 'error') {
      await deleteRegistro(preg.id!);
      if (!!preg.buscabaAntes !== d.profile.trying) await saveProfile({ ...d.profile, trying: !!preg.buscabaAntes });
      onClose(); await refresh(); toast('Registro deshecho'); return;
    }
    if (!fin) return setErr('Elegí la fecha.');
    if (fin > today) return setErr('La fecha no puede ser futura.');
    if (fin < preg.fecha) return setErr(`No puede ser antes del ${fmtShort(preg.fecha)}, cuando lo registraste.`);
    await updateRegistro(preg.id!, { fin, cierre: kind! });
    onClose(); await refresh();
  }
  return (
    <Sheet title="Terminar el embarazo" onClose={onClose}>
      {!kind ? (
        <>
          <button type="button" className="option" onClick={() => setKind('nacimiento')}><strong>Nació</strong><span>Pasás a posparto.</span></button>
          <button type="button" className="option" onClick={() => setKind('terminado')}><strong>El embarazo terminó</strong><span>Se ocultan las semanas y se frenan los avisos.</span></button>
          <button type="button" className="btn link quiet" onClick={() => setKind('error')}>Lo registré por error</button>
          <button type="button" className="btn link" onClick={onClose}>Cancelar</button>
        </>
      ) : kind === 'error' ? (
        <>
          <p style={{ fontSize: 14.5, margin: 0 }}>Se borra el registro de embarazo del {fmtShort(preg.fecha)}, como si no lo hubieras anotado. Vuelven las fechas estimadas y los avisos. Tus tests y períodos quedan como estaban.</p>
          <button type="button" className="btn" onClick={save}>Sí, borrar el registro</button>
          <button type="button" className="btn link" onClick={() => setKind(null)}>Volver</button>
        </>
      ) : (
        <>
          <DateField label={kind === 'nacimiento' ? '¿Qué día nació?' : '¿Qué día?'} value={fin} max={today} onChange={v => { setFin(v); setErr(''); }} />
          {err && <p className="err" role="alert">{err}</p>}
          <button type="button" className="btn" onClick={save}>Guardar</button>
          <button type="button" className="btn link" onClick={() => setKind(null)}>Volver</button>
        </>
      )}
    </Sheet>
  );
}

/** Pantallas que se abren desde la tarjeta: tamaño, controles y cuándo consultar. */
export function GestationView({ view, d, onBack, open }: { view: GestView; d: ProfileData; onBack: () => void; open: (v: GestView) => void }) {
  const preg = activePregnancy(d.registros);
  if (!preg && view !== 'consultar') { onBack(); return null; }
  if (view === 'consultar') return <ConsultView onBack={onBack} />;
  if (view === 'controles') return <ControlsView preg={preg!} onBack={onBack} />;
  return <SizeView d={d} preg={preg!} onBack={onBack} open={open} />;
}

function SizeView({ d, preg, onBack, open }: { d: ProfileData; preg: Registro; onBack: () => void; open: (v: GestView) => void }) {
  const { today } = useStore();
  const [fruits, setFruits] = useFruits();
  const fum = fumOf(preg, d.periods.map(p => p.start)) ?? preg.fecha;
  const info = pregnancyInfo(fum, today);
  const size = sizeFor(info.week);
  const fruit = fruits ? fruitFor(info.week) : null;
  return (
    <div className="screen">
      <SubHeader title="Tamaño" onBack={onBack} />
      <div className="size-hero">
        {fruit && <span className="fruit-box big"><Fruta id={fruit.id} size={64} /></span>}
        {fruit && <b className="size-name">Como {fruit.name}</b>}
        <span style={{ fontSize: 16 }}>{size ? fmtSize(size) : 'Todavía es muy chiquito para medirlo'}</span>
        <span className="muted" style={{ fontSize: 12.5 }}>Semana {info.week} · medidas aproximadas</span>
      </div>
      <div className="card" style={{ gap: 6 }}>
        <span className="eyebrow">Esta semana</span>
        <p style={{ fontSize: 14.5, margin: 0 }}>{weekText(info.week)}</p>
      </div>
      <div className="list">
        <button type="button" className="list-item" onClick={() => open('consultar')}><span className="grow"><b>Cuándo consultar</b><small>Señales para llamar sin esperar al control</small></span><Icon.chev /></button>
        <div className="setting"><div className="stack grow"><b>Comparar con frutas</b><small>Si lo apagás, queda solo la medida</small></div><Switch on={fruits} label="Comparar con frutas" onChange={setFruits} /></div>
      </div>
    </div>
  );
}

function ControlsView({ preg, onBack }: { preg: Registro; onBack: () => void }) {
  const { today, refresh } = useStore();
  const toast = useToast();
  const [adding, setAdding] = useState<false | { tri: 1 | 2 | 3; texto: string; fecha: string }>(false);
  const list = controlsOf(preg);
  const save = async (next: Control[]) => { await updateRegistro(preg.id!, { controles: next }); await refresh(); };
  const tri = preg.fum ? pregnancyInfo(preg.fum, today).trimester : 1;
  return (
    <div className="screen">
      <SubHeader title="Controles" onBack={onBack} />
      <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>Tachalos cuando los hagas. Tu médica te dice cuáles corresponden.</p>
      {([1, 2, 3] as const).map(t => (
        <div key={t} className="stack" style={{ gap: 6 }}>
          <span className="eyebrow">{t === 1 ? 'Primer' : t === 2 ? 'Segundo' : 'Tercer'} trimestre{t === tri ? ' · ahora' : ''}</span>
          <div className="list">
            {list.filter(c => c.trimestre === t).map(c => (
              <div key={c.id} className="setting ctrl">
                <input type="checkbox" checked={c.hecho} aria-label={c.texto} onChange={() => save(list.map(x => x.id === c.id ? { ...x, hecho: !x.hecho } : x))} />
                <span className="grow" style={{ textDecoration: c.hecho ? 'line-through' : 'none', color: c.hecho ? 'var(--muted)' : undefined }}>{c.texto}{c.fecha && <small className="muted" style={{ display: 'block' }}>{fmtLong(c.fecha)}</small>}</span>
                <button type="button" className="btn link" style={{ fontSize: 13, minHeight: 40 }} aria-label={'Borrar ' + c.texto} onClick={() => save(list.filter(x => x.id !== c.id))}>Borrar</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn link" style={{ alignSelf: 'flex-start' }} onClick={() => setAdding({ tri: t, texto: '', fecha: '' })}>+ Agregar un control</button>
        </div>
      ))}
      {adding && (
        <Sheet title="Agregar un control" onClose={() => setAdding(false)}>
          <label className="field">Qué control<input value={adding.texto} maxLength={80} onChange={e => setAdding({ ...adding, texto: e.target.value })} placeholder="Ej.: ecografía, análisis" /></label>
          <DateField label="Fecha (opcional)" value={adding.fecha} min={today} optional onChange={v => setAdding({ ...adding, fecha: v })} />
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>Si le ponés fecha, te avisamos ese día con un aviso discreto.</p>
          <button type="button" className="btn" onClick={async () => {
            const t = adding.texto.trim(); if (!t) return;
            await save([...list, { id: 'u' + Date.now().toString(36), trimestre: adding.tri, texto: t, hecho: false, ...(adding.fecha ? { fecha: adding.fecha } : {}) }]);
            setAdding(false); toast('Control agregado');
          }}>Guardar</button>
        </Sheet>
      )}
    </div>
  );
}

export function ConsultView({ onBack }: { onBack: () => void }) {
  return (
    <div className="screen">
      <SubHeader title="Cuándo consultar" onBack={onBack} />
      <p style={{ fontSize: 15, margin: 0 }}>Llamá a tu médica o andá a la guardia si tenés:</p>
      <ul className="list signs">{CONSULT_SIGNS.map(s => <li key={s} className="list-item">{s}</li>)}</ul>
      <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>Si algo no te cierra, consultá igual. No hace falta esperar al próximo control.</p>
    </div>
  );
}

/** Después del parto, hasta que vuelva el primer período. */
export function PostpartumToday({ d, onSym, onCameIn }: { d: ProfileData; onSym: () => void; onCameIn: () => void }) {
  const { today, refresh } = useStore();
  const { preg } = afterStage(d.registros, d.periods.map(p => p.start));
  if (!preg) return null;
  const week = Math.floor(daysBetween(preg.fin!, today) / 7) + 1;
  const done = preg.postChecks ?? [];
  return (
    <>
      <div className="card" style={{ gap: 6 }}>
        <span className="eyebrow">Posparto</span>
        <span className="preg-week" style={{ fontSize: 30 }}>Semana {week}</span>
        <span className="muted" style={{ fontSize: 13.5 }}>Desde el parto, el {longDate(preg.fin!)}.</span>
      </div>
      <div className="list">
        {POST_CHECKS.map(c => (
          <label key={c.id} className="setting ctrl">
            <input type="checkbox" checked={done.includes(c.id)} onChange={async () => { await updateRegistro(preg.id!, { postChecks: done.includes(c.id) ? done.filter(x => x !== c.id) : [...done, c.id] }); await refresh(); }} />
            <span className="grow" style={{ textDecoration: done.includes(c.id) ? 'line-through' : 'none', color: done.includes(c.id) ? 'var(--muted)' : undefined }}>{c.text}</span>
          </label>
        ))}
      </div>
      <button type="button" className="btn ghost" onClick={onSym}>Cómo estoy</button>
      <button type="button" className="btn period" onClick={onCameIn}>Me vino por primera vez</button>
      <p className="muted" style={{ fontSize: 12.5, textAlign: 'center', margin: 0 }}>Al anotarla vuelve el ciclo, con un rango más amplio los primeros meses.</p>
    </>
  );
}

/** Cuando el embarazo terminó sin nacimiento: una pantalla tranquila, sin anuncios ni nada del embarazo. */
export function PauseToday({ onCameIn }: { onCameIn: () => void }) {
  const [help, setHelp] = useState(false);
  return (
    <>
      <div className="calm">
        <h2 className="serif-title" style={{ fontSize: 26 }}>Tomate el tiempo que necesites.</h2>
        <p className="muted" style={{ fontSize: 14.5, margin: 0 }}>Pausamos los avisos del ciclo. Cuando te venga, anotalo y Meneia vuelve a acompañarte.</p>
        <button type="button" className="btn ghost" onClick={onCameIn}>Me vino</button>
        <button type="button" className="btn link" onClick={() => setHelp(true)}>Si necesitás hablar con alguien</button>
      </div>
      {help && (
        <Sheet title="Hablar ayuda" onClose={() => setHelp(false)}>
          <p style={{ fontSize: 14.5, margin: 0 }}>Contale a tu médica cómo estás, o a alguien de confianza. No hace falta esperar a sentirte peor para pedir ayuda.</p>
          <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>Si tenés fiebre, sangrado fuerte o mucho dolor, andá a una guardia.</p>
          <button type="button" className="btn" onClick={() => setHelp(false)}>Entendido</button>
        </Sheet>
      )}
    </>
  );
}
