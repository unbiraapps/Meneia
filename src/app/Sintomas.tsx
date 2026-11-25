// "Tus síntomas": qué se repite en los últimos ciclos y en qué días aparece. Durante el embarazo, por trimestre.
// Solo usa lo que ya se anota en "Cómo estoy"; todo se calcula en el celular.
import { useState, type ReactNode } from 'react';
import { activePregnancy, daysBetween, daysList, symptomDetail, symptomGrid, type SymptomLog } from '../calc';
import { fumOf, pregnancyInfo } from '../embarazo';
import { ConsultView } from './Gestacion';
import { useStore, type ProfileData } from './store';
import { Icon, SubHeader } from './ui';

const itemsOf = (l: SymptomLog) => [...l.body, ...l.mood.filter(m => m !== 'Bien')];

/** Fila de entrada en el Historial (solo si hay al menos 3 ciclos con síntomas, o un embarazo con síntomas). */
export function SymptomsEntry({ d, onOpen }: { d: ProfileData; onOpen: () => void }) {
  const { today } = useStore();
  const preg = activePregnancy(d.registros ?? []);
  if (preg) {
    const from = fumOf(preg, d.periods.map(p => p.start)) ?? preg.fecha;
    if (!d.symptoms.some(l => l.date >= from && itemsOf(l).length)) return null;
    return <EntryRow title="Tus síntomas" sub="Del embarazo, por trimestre" onOpen={onOpen} />;
  }
  const g = symptomGrid(d.symptoms, d.A, today);
  const withData = g.cols.filter(c => d.symptoms.some(l => l.date >= c.start && l.date <= c.end && itemsOf(l).length)).length;
  if (withData < 3) return null;
  return <EntryRow title="Tus síntomas" sub={g.repeated.length ? `${g.repeated.length === 1 ? '1 se repite' : g.repeated.length + ' se repiten'} en tus últimos ciclos` : 'Comparalos ciclo a ciclo'} onOpen={onOpen} />;
}

function EntryRow({ title, sub, onOpen }: { title: string; sub: string; onOpen: () => void }) {
  return (
    <div className="list">
      <button type="button" className="list-item" onClick={onOpen}><span className="grow"><b>{title}</b><small>{sub}</small></span><Icon.chev /></button>
    </div>
  );
}

export function SymptomsScreen({ d, onBack }: { d: ProfileData; onBack: () => void }) {
  const [what, setWhat] = useState<string | null>(null);
  const [consult, setConsult] = useState(false);
  const preg = activePregnancy(d.registros ?? []);
  if (consult) return <ConsultView onBack={() => setConsult(false)} />;
  if (preg) return <PregnancySymptoms d={d} onBack={onBack} onConsult={() => setConsult(true)} />;
  if (what) return <SymptomDetailView d={d} what={what} onBack={() => setWhat(null)} />;
  return <CycleSymptoms d={d} onBack={onBack} onPick={setWhat} />;
}

function CycleSymptoms({ d, onBack, onPick }: { d: ProfileData; onBack: () => void; onPick: (w: string) => void }) {
  const { today } = useStore();
  const g = symptomGrid(d.symptoms, d.A, today);
  const n = g.cols.length;
  return (
    <div className="screen">
      <SubHeader title="Tus síntomas" onBack={onBack} />
      {g.repeated.length > 0 && (
        <div className="card" style={{ gap: 0 }}>
          <span className="eyebrow" style={{ marginBottom: 4 }}>Se repiten</span>
          {g.repeated.slice(0, 4).map(r => (
            <button key={r.what} type="button" className="rep-row" onClick={() => onPick(r.what)}>
              <b>{r.what}</b><span>{r.hits} de {r.of} ciclos{r.when ? ` · ${r.when}` : ''}</span>
            </button>
          ))}
        </div>
      )}
      <span className="eyebrow">Últimos {n} ciclos</span>
      <div className="card">
        <div className="sgrid" style={{ gridTemplateColumns: `minmax(0,1fr) repeat(${n}, minmax(24px, 30px))` }} role="table" aria-label={`Síntomas de tus últimos ${n} ciclos`}>
          <span />
          {g.cols.map(c => <span key={c.start} className="sg-h" style={{ opacity: c.counts ? 1 : .45 }}>{c.label}</span>)}
          {g.rows.slice(0, 8).map(r => (
            <SymRow key={r.what} what={r.what} onPick={onPick}>
              {r.hits.map((h, i) => <i key={i} className={'sdot' + (h ? (r.mood ? ' mood' : ' on') : '')} style={{ opacity: g.cols[i].counts ? 1 : .4 }} aria-label={`${g.cols[i].label}: ${h ? 'sí' : 'no'}`} />)}
            </SymRow>
          ))}
        </div>
      </div>
      <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>Cada columna es un ciclo, por el día en que empezó. Tocá un síntoma para ver en qué días aparece. Los ciclos apagados (raros o de adaptación) no cuentan para "se repite".</p>
    </div>
  );
}

function SymRow({ what, onPick, children }: { what: string; onPick: (w: string) => void; children: ReactNode }) {
  return <><button type="button" className="sg-n" onClick={() => onPick(what)}>{what}</button>{children}</>;
}

function SymptomDetailView({ d, what, onBack }: { d: ProfileData; what: string; onBack: () => void }) {
  const { today } = useStore();
  const g = symptomGrid(d.symptoms, d.A, today);
  const det = symptomDetail(d.symptoms, g, what);
  const max = Math.max(1, ...det.byDay);
  const top = det.byDay.map((v, i) => [v, i + 1]).filter(([v]) => v === max && v > 0).map(([, day]) => day);
  return (
    <div className="screen">
      <SubHeader title={what} onBack={onBack} />
      <div className="card" style={{ gap: 4 }}>
        <span className="preg-week" style={{ fontSize: 26 }}>{det.hits} de {det.of} ciclos</span>
        {top.length > 0 && <span className="muted" style={{ fontSize: 14 }}>Sobre todo {daysList(top).replace(/^días/, 'los días').replace(/^día/, 'el día')} del ciclo.</span>}
      </div>
      <div className="card" style={{ gap: 6 }}>
        <span className="eyebrow">En qué día del ciclo</span>
        <div className="sbars" role="img" aria-label={`Días del ciclo con ${what.toLowerCase()}`}>{det.byDay.map((v, i) => <i key={i} style={{ height: `${Math.round((v / max) * 100)}%` }} />)}</div>
        <div className="sbars-l"><span>Día 1</span><span>7</span><span>14</span><span>21</span><span>28</span></div>
      </div>
      <div className="card" style={{ gap: 0 }}>
        {det.perCol.map((c, i) => <div key={i} className="rep-row static"><span style={{ color: 'var(--fg)', opacity: c.counts ? 1 : .5 }}>{c.label}</span><span>{daysList(c.days)}</span></div>)}
      </div>
    </div>
  );
}

function PregnancySymptoms({ d, onBack, onConsult }: { d: ProfileData; onBack: () => void; onConsult: () => void }) {
  const { today } = useStore();
  const preg = activePregnancy(d.registros)!;
  const fum = fumOf(preg, d.periods.map(p => p.start)) ?? preg.fecha;
  const info = pregnancyInfo(fum, today);
  const triOf = (date: string) => { const w = Math.floor(daysBetween(fum, date) / 7); return w < 14 ? 0 : w < 28 ? 1 : 2; };
  const logs = d.symptoms.filter(l => l.date >= fum && l.date <= today);
  const counts = new Map<string, number[]>();
  logs.forEach(l => itemsOf(l).forEach(x => { const c = counts.get(x) ?? [0, 0, 0]; c[triOf(l.date)]++; counts.set(x, c); }));
  const rows = [...counts.entries()].sort((a, b) => b[1].reduce((x, y) => x + y) - a[1].reduce((x, y) => x + y));
  const now = info.trimester - 1;
  const topNow = rows.filter(([, c]) => c[now] > 0).sort((a, b) => b[1][now] - a[1][now]).slice(0, 3);
  return (
    <div className="screen">
      <SubHeader title="Tus síntomas" onBack={onBack} />
      {topNow.length > 0 && (
        <div className="card" style={{ gap: 0 }}>
          <span className="eyebrow" style={{ color: 'var(--ok-ink)', marginBottom: 4 }}>Este trimestre · semana {info.week}</span>
          {topNow.map(([w, c]) => <div key={w} className="rep-row static"><b>{w}</b><span>{c[now] === 1 ? '1 día anotado' : `${c[now]} días anotados`}</span></div>)}
        </div>
      )}
      <span className="eyebrow">Por trimestre</span>
      <div className="card">
        <div className="sgrid" style={{ gridTemplateColumns: 'minmax(0,1fr) repeat(3, 36px)' }} role="table" aria-label="Síntomas por trimestre">
          <span /><span className="sg-h">1.º</span><span className="sg-h">2.º</span><span className="sg-h">3.º</span>
          {rows.slice(0, 8).map(([w, c]) => (
            <SymRow key={w} what={w} onPick={() => {}}>
              {c.map((v, i) => <i key={i} className={'sdot' + (v ? ' preg' : '')} style={{ opacity: i > now ? .35 : 1 }} aria-label={`${i + 1}.º trimestre: ${v} días`} />)}
            </SymRow>
          ))}
        </div>
      </div>
      <div className="list">
        <button type="button" className="list-item" onClick={onConsult}><span className="grow"><b>Cuándo consultar</b><small>Señales para llamar sin esperar al control</small></span><Icon.chev /></button>
      </div>
    </div>
  );
}
