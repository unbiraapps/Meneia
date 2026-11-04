import { useEffect, useState } from 'react';
import { fmtShort } from '../calc';
import { buyNoAds, ownsNoAds, productPrice, showRewarded } from '../ads';
import { GRACE_DAYS, rewardUntil, type Plan } from '../adrules';
import { isNative } from '../notify';
import { useStore } from './store';
import { useToast } from './ui';

/** Hook: precio de "Sin anuncios" según Google Play (o null si no se pudo leer). */
export function usePrice() {
  const [p, setP] = useState<string | null>(null);
  useEffect(() => { productPrice().then(setP); }, []);
  return p;
}

/** Elegir entre gratis con anuncios o sin anuncios. Nunca pide la tarjeta: eso lo hace Google al pagar. */
export function PlanChoice({ value, onChange }: { value: Plan; onChange: (p: Plan) => void }) {
  const price = usePrice();
  const opt = (id: Plan, title: string, desc: string) => (
    <button type="button" className={'choice' + (value === id ? ' on' : '')} aria-pressed={value === id} onClick={() => onChange(id)}>
      <span className="stack grow"><b style={{ font: '700 17px var(--display)' }}>{title}</b><span className="muted" style={{ fontSize: 13 }}>{desc}</span></span>
      <span className="check" style={value === id ? { background: 'var(--plum)', color: '#17131F', borderColor: 'transparent' } : undefined}>{value === id ? '✓' : ''}</span>
    </button>
  );
  return (
    <>
      {opt('free', 'Gratis con anuncios', `Todas las funciones. Los anuncios empiezan después de los primeros ${GRACE_DAYS} días.`)}
      {opt('premium', 'Sin anuncios', `Todas las funciones, sin anuncios. ${price ? price + ', pago único' : 'Pago único por Google Play'}.`)}
    </>
  );
}

/** En Perfil: el plan actual, quitar anuncios, restaurar compra y la semana sin anuncios. */
export function PlanSettings() {
  const { ads, setAds, today } = useStore();
  const toast = useToast();
  const price = usePrice();
  const [busy, setBusy] = useState(false);
  const premium = ads.plan === 'premium';
  const free = ads.adFreeUntil && today <= ads.adFreeUntil;

  async function buy() {
    if (!isNative()) return toast('El pago se hace desde la app de Android');
    setBusy(true);
    const r = await buyNoAds();
    setBusy(false);
    if (r === 'ok') { await setAds({ ...ads, plan: 'premium' }); toast('Listo: ya no vas a ver anuncios'); }
    else if (r === 'error') toast('No se pudo abrir el pago. Probá de nuevo más tarde.');
  }
  async function restore() {
    setBusy(true);
    const owns = await ownsNoAds();
    setBusy(false);
    if (owns) { await setAds({ ...ads, plan: 'premium' }); toast('Compra restaurada'); }
    else toast(owns === null ? 'La compra se restaura desde la app de Android' : 'No encontramos una compra con esta cuenta de Google');
  }
  async function reward() {
    setBusy(true);
    const ok = await showRewarded();
    setBusy(false);
    if (ok) { const until = rewardUntil(today); await setAds({ ...ads, adFreeUntil: until }); toast('Listo: sin anuncios hasta el ' + fmtShort(until)); }
    else toast('No hay videos disponibles ahora');
  }

  return (
    <div className="list">
      <div className="setting"><div className="stack grow"><b>{premium ? 'Sin anuncios' : 'Gratis con anuncios'}</b>
        <small>{premium ? 'Gracias por apoyar Meneia' : free ? `Sin anuncios hasta el ${fmtShort(ads.adFreeUntil)}` : 'Todas las funciones están disponibles'}</small></div>
        {!premium && <button type="button" className="btn small" disabled={busy} onClick={buy}>Quitar anuncios{price ? ' · ' + price : ''}</button>}</div>
      {!premium && <button type="button" className="list-item" disabled={busy} onClick={reward}><span className="grow"><b>Una semana sin anuncios</b><small>Mirando un video corto</small></span></button>}
      <button type="button" className="list-item" disabled={busy} onClick={restore}><span className="grow"><b>Restaurar compra</b><small>Si ya pagaste en otro celular con la misma cuenta de Google</small></span></button>
    </div>
  );
}
