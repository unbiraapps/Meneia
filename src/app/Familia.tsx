import { useState } from 'react';
import { ageOn, daysBetween, fmtShort, plural, addDays, type Profile } from '../calc';
import { deleteProfile, saveProfile, setSetting } from '../db';
import { useStore } from './store';
import { Avatar, COLORS, Icon, Sheet, SubHeader, useToast } from './ui';

export function Familia({ onBack }: { onBack: () => void }) {
  const { profiles, data, today, refresh, shopping, setActive } = useStore();
  const toast = useToast();
  const [edit, setEdit] = useState<Profile | 'new' | null>(null);
  const [item, setItem] = useState('');
  const [done, setDone] = useState<Record<number, boolean>>({});
  const kids = profiles.filter(p => p.kind === 'child');

  const saveShopping = async (list: string[]) => { await setSetting('shopping', list); await refresh(); };
  const nextShop = kids.map(k => data.get(k.id!)).filter(d => d && !d.profile.notYet && d.profile.alertDays && d.A.next)
    .map(d => addDays(d!.A.next!, -d!.profile.alertDays)).filter(d => d >= today).sort()[0];

  return (
    <div className="screen">
      <SubHeader title="Familia" onBack={onBack} />
      <p className="muted" style={{ fontSize: 14 }}>Para cada hija hay un solo aviso: antes de su próximo período, junto con la lista de compras. El aviso nunca dice su nombre ni la palabra período.</p>

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
            <button type="button" className="btn ghost small" onClick={() => { setActive(k.id!); toast('Ahora ves a ' + k.name + ' en Hoy, Calendario e Historial'); }}>Ver y anotar sus días</button>
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
