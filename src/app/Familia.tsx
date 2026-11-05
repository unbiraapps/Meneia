import { useState } from 'react';
import { ageOn, daysBetween, fmtShort, plural, addDays, type Profile } from '../calc';
import { deleteProfile, saveProfile, setSetting } from '../db';
import { useStore } from './store';
import { Avatar, COLORS, Icon, Sheet, SubHeader, useToast } from './ui';
import { PeriodSheet } from './PeriodSheet';

export function Familia({ onBack, onOpenKid }: { onBack: () => void; onOpenKid: () => void }) {
  const { profiles, data, today, refresh, shopping, setActive, activeId, active } = useStore();
  const toast = useToast();
  const [edit, setEdit] = useState<Profile | 'new' | null>(null);
  const [item, setItem] = useState('');
  const [logFor, setLogFor] = useState<number | null>(null);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const kids = profiles.filter(p => p.kind === 'child');

  const saveShopping = async (list: string[]) => { await setSetting('shopping', list); await refresh(); };
  const nextShop = kids.map(k => data.get(k.id!)).filter(d => d && !d.profile.notYet && d.profile.alertDays && d.A.next)
    .map(d => addDays(d!.A.next!, -d!.profile.alertDays)).filter(d => d >= today).sort()[0];

  return (
    <div className="screen">
      <SubHeader title="Familia" onBack={onBack} />
      <div className="card" style={{ gap: 8 }}>
        <h2 style={{ margin: 0 }}>Cómo funciona</h2>
        <ol className="muted" style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.5 }}>
          <li>Agregás a tu hija con su nombre o apodo. Ella no necesita tener la app.</li>
          <li>Tocás <b>Anotar que le vino</b> y elegís el día, desde tu celular.</li>
          <li>Unos días antes del próximo, te llega un aviso con la lista de compras.</li>
        </ol>
        <span className="muted" style={{ fontSize: 12.5 }}>Todo queda solo en tu celular. El aviso nunca dice su nombre ni la palabra período.</span>
      </div>

      {kids.map(k => {
        const d = data.get(k.id!)!;
        const age = ageOn(k.birthDate, today);
        const left = d.A.next ? daysBetween(today, d.A.next) : null;
        return (
          <div key={k.id} className="card fam">
            <div className="row">
              <Avatar name={k.name} color={k.color} />
              <div className="stack grow"><b style={{ fontSize: 16 }}>{k.name}{age != null ? ` · ${age} años` : ''}</b>
                <span className="muted" style={{ fontSize: 13 }}>{k.notYet ? 'Todavía no le vino' : d.A.next ? (left! > 0 ? `${plural(left!, 'día', 'días')} para su período · ${fmtShort(d.A.next)}` : left === 0 ? 'Le podría venir hoy' : `Debía venirle el ${fmtShort(d.A.next)}`) : 'Sin períodos anotados'}</span></div>
              <button type="button" className="btn link" onClick={() => setEdit(k)}>Editar</button>
            </div>
            <div className="stack" style={{ gap: 6 }}>
              <span className="muted" style={{ fontSize: 12.5 }}>Avisarme antes</span>
              <div className="chips" role="radiogroup" aria-label={'Aviso para ' + k.name}>
                {[0, 1, 2, 3].map(n => <button key={n} type="button" role="radio" aria-checked={k.alertDays === n} className={'chip' + (k.alertDays === n ? ' on fam' : '')}
                  onClick={async () => { await saveProfile({ ...k, alertDays: n }); await refresh(); }}>{n === 0 ? 'Apagado' : plural(n, 'día', 'días')}</button>)}
              </div>
            </div>
            <div className="btns">
              <button type="button" className="btn fam small" onClick={() => { setActive(k.id!); setLogFor(k.id!); }}>{k.notYet || !d.A.last ? 'Anotar que le vino' : 'Anotar que le vino de nuevo'}</button>
              {activeId === k.id
                ? <button type="button" className="btn ghost small" style={{ flex: 'none' }} onClick={() => { setActive(1); toast('Volviste a tus días'); }}>Volver a mí</button>
                : <button type="button" className="btn ghost small" style={{ flex: 'none' }} onClick={() => { setActive(k.id!); onOpenKid(); }}>Ver sus días</button>}
            </div>
          </div>
        );
      })}

      <button type="button" className="btn fam" onClick={() => setEdit('new')}>Agregar una hija</button>

      <div className="card">
        <div className="top"><h2>Para comprar</h2>{nextShop && <span className="muted" style={{ fontSize: 12.5 }}>aviso el {fmtShort(nextShop)}</span>}</div>
        {shopping.map((s, i) => (
          <div key={i} className="row">
            <input type="checkbox" checked={!!done[i]} onChange={() => setDone({ ...done, [i]: !done[i] })} aria-label={'Comprado: ' + s} style={{ width: 22, height: 22, accentColor: 'var(--fam)', margin: 0, flex: 'none' }} />
            <span className="grow" style={{ fontSize: 14.5, textDecoration: done[i] ? 'line-through' : 'none', color: done[i] ? 'var(--muted)' : 'inherit' }}>{s}</span>
            <button type="button" className="icon-btn" aria-label={'Quitar ' + s} style={{ background: 'none' }} onClick={() => saveShopping(shopping.filter((_, j) => j !== i))}><Icon.x /></button>
          </div>
        ))}
        <form className="row" onSubmit={e => { e.preventDefault(); const t = item.trim(); if (!t) return; setItem(''); saveShopping([...shopping, t.slice(0, 60)]); }}>
          <input type="text" className="grow" value={item} onChange={e => setItem(e.target.value)} placeholder="Agregar a la lista" aria-label="Nuevo producto" />
          <button type="submit" className="btn small fam">Agregar</button>
        </form>
      </div>

      {logFor != null && active?.profile.id === logFor && <PeriodSheet defaultStart={today} onClose={() => setLogFor(null)} />}
      {edit && <KidSheet kid={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

function KidSheet({ kid, onClose }: { kid: Profile | null; onClose: () => void }) {
  const { today, refresh, profiles, setActive, activeId } = useStore();
  const toast = useToast();
  const used = profiles.map(p => p.color);
  const [name, setName] = useState(kid?.name ?? '');
  const [birth, setBirth] = useState(kid?.birthDate ?? '');
  const [color, setColor] = useState(kid?.color ?? COLORS.find(c => !used.includes(c)) ?? COLORS[0]);
  const [notYet, setNotYet] = useState(kid?.notYet ?? false);
  const [sure, setSure] = useState(false);
  const [err, setErr] = useState('');

  async function save() {
    if (!name.trim()) return setErr('Escribí un nombre o apodo.');
    await saveProfile({ ...(kid ?? { kind: 'child', trying: false, alertDays: 2 }), id: kid?.id, name: name.trim().slice(0, 30), birthDate: birth, color, notYet } as Profile);
    onClose(); await refresh(); toast(kid ? 'Cambios guardados' : name.trim() + ' agregada');
  }
  async function remove() {
    if (!sure) { setSure(true); return; }
    if (activeId === kid!.id) setActive(1);
    await deleteProfile(kid!.id!); onClose(); await refresh(); toast('Perfil borrado');
  }

  return (
    <Sheet title={kid ? 'Editar a ' + kid.name : 'Agregar una hija'} onClose={onClose}>
      <label className="field">Nombre o apodo<input type="text" value={name} maxLength={30} onChange={e => { setName(e.target.value); setErr(''); }} /></label>
      <label className="field">Fecha de nacimiento (opcional)<input type="date" value={birth} max={today} onChange={e => setBirth(e.target.value)} /></label>
      <div className="stack" style={{ gap: 6 }}><span className="eyebrow">Color</span>
        <div className="chips">{COLORS.map(c => <button key={c} type="button" aria-label={'Color ' + c} aria-pressed={c === color} onClick={() => setColor(c)} style={{ width: 40, height: 40, borderRadius: '50%', background: c, border: c === color ? '3px solid var(--fg)' : '3px solid transparent', cursor: 'pointer' }} />)}</div></div>
      <div className="row"><div className="stack grow"><b style={{ fontSize: 14.5 }}>Todavía no le vino</b><small className="muted" style={{ fontSize: 12.5 }}>No muestra fechas hasta que le venga</small></div>
        <button type="button" role="switch" aria-checked={notYet} aria-label="Todavía no le vino" className="switch" onClick={() => setNotYet(!notYet)} /></div>
      {err && <p className="err" role="alert">{err}</p>}
      <button type="button" className="btn fam" onClick={save}>{kid ? 'Guardar' : 'Agregar'}</button>
      {kid && <button type="button" className={'btn ' + (sure ? 'danger' : 'ghost')} onClick={remove}>{sure ? '¿Borrar perfil y sus registros?' : 'Borrar perfil'}</button>}
    </Sheet>
  );
}
