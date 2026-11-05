import { useEffect, useState } from 'react';
import { fmtShort } from '../calc';
import { manageSubscription, showRewarded, subscribe, subscriptionPrice, subscriptionStatus, type SubPrice } from '../ads';
import { GRACE_DAYS, rewardUntil } from '../adrules';
import { isNative } from '../notify';
import { useStore } from './store';
import { useToast } from './ui';

/** Precio y período de "Sin anuncios" según Google Play (null si no se pudo leer). */
export function usePrice() {
  const [p, setP] = useState<SubPrice | null>(null);
  useEffect(() => { subscriptionPrice().then(setP); }, []);
  return p;
}

export const priceText = (p: SubPrice | null) => (p ? `${p.price} ${p.period}` : 'Precio mensual en Google Play');

/** Texto legal corto que se muestra siempre antes de suscribirse. */
export function SubTerms({ price }: { price: SubPrice | null }) {
  return (
    <p className="muted" style={{ fontSize: 12.5 }}>
      {priceText(price)}, con renovación automática cada mes. Se cobra a tu cuenta de Google Play. Podés cancelar cuando quieras desde Google Play y seguís sin anuncios hasta el final del mes pagado. No hay período de prueba. Todas las funciones están disponibles gratis con anuncios.
    </p>
  );
}

/** Botón explícito "Suscribirme". Es la única forma de abrir el cobro. */
export function SubscribeButton({ onDone, label }: { onDone?: () => void; label?: string }) {
  const { ads, setAds } = useStore();
  const toast = useToast();
  const price = usePrice();
  const [busy, setBusy] = useState(false);
  async function go() {
    if (!isNative()) return toast('La suscripción se hace desde la app de Android');
    setBusy(true);
    const r = await subscribe();
    setBusy(false);
    if (r === 'ok') { await setAds({ ...ads, plan: 'premium' }); toast('Listo: ya no vas a ver anuncios'); onDone?.(); }
    else if (r === 'cancel') toast('No se hizo ningún cobro. Seguís con la versión gratis.');
    else toast('No se pudo abrir Google Play. Seguís con la versión gratis.');
  }
  return <button type="button" className="btn ghost" disabled={busy} onClick={go}>{label ?? `Suscribirme · ${price ? price.price + ' por mes' : 'mensual'}`}</button>;
}

/** En Perfil: el plan actual, suscribirse, administrar, restaurar y la semana sin anuncios. */
export function PlanSettings() {
  const { ads, setAds, today } = useStore();
  const toast = useToast();
  const price = usePrice();
  const [busy, setBusy] = useState(false);
  const premium = ads.plan === 'premium';
  const rewarded = ads.adFreeUntil && today <= ads.adFreeUntil;

  async function restore() {
    setBusy(true);
    const st = await subscriptionStatus();
    setBusy(false);
    if (st === null) return toast('No se pudo consultar Google Play. Probá con conexión a internet.');
    await setAds({ ...ads, plan: st.active ? 'premium' : 'free' });
    toast(st.active ? 'Suscripción activa: sin anuncios' : 'No hay una suscripción activa con esta cuenta de Google');
  }
  async function reward() {
    setBusy(true);
    const ok = await showRewarded();
    setBusy(false);
    if (ok) { const until = rewardUntil(today); await setAds({ ...ads, adFreeUntil: until }); toast('Listo: sin anuncios hasta el ' + fmtShort(until)); }
    else toast('No hay videos disponibles ahora');
  }

  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="list">
        <div className="setting"><div className="stack grow"><b>{premium ? 'Sin anuncios' : 'Gratis con anuncios'}</b>
          <small>{premium ? (ads.subUntil ? `Suscripción activa${ads.willCancel ? ` hasta el ${fmtShort(ads.subUntil)} (cancelada)` : ` · se renueva el ${fmtShort(ads.subUntil)}`}` : 'Suscripción activa') : rewarded ? `Sin anuncios hasta el ${fmtShort(ads.adFreeUntil)}` : 'Todas las funciones están disponibles'}</small></div></div>
        {premium && <button type="button" className="list-item" onClick={() => manageSubscription()}><span className="grow"><b>Administrar o cancelar</b><small>Se abre Google Play</small></span></button>}
        {!premium && <button type="button" className="list-item" disabled={busy} onClick={reward}><span className="grow"><b>Una semana sin anuncios</b><small>Mirando un video corto</small></span></button>}
        <button type="button" className="list-item" disabled={busy} onClick={restore}><span className="grow"><b>Restaurar suscripción</b><small>Si ya te suscribiste con esta cuenta de Google</small></span></button>
      </div>
      {!premium && (
        <div className="card">
          <b style={{ fontSize: 15 }}>Quitar los anuncios</b>
          <SubTerms price={price} />
          <SubscribeButton />
        </div>
      )}
    </div>
  );
}

export const GRACE_TEXT = `Todas las funciones. Los primeros ${GRACE_DAYS} días no hay anuncios.`;
