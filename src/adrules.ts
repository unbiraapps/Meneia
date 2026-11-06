// Reglas de los anuncios. Funciones puras, con pruebas: deciden cuándo se puede mostrar algo.
import { addDays, daysBetween } from './calc';

export type Plan = '' | 'free' | 'premium';

export interface AdState {
  plan: Plan;               // '' = todavía no eligió
  installDate: string;      // primer día de uso
  lastInterstitial: string; // cuándo se mostró el último anuncio de pantalla completa (fecha y hora ISO)
  adFreeUntil: string;      // semana sin anuncios por mirar un video (incluye ese día)
  subUntil?: string | null; // fin del período pagado de la suscripción, según Google Play
  willCancel?: boolean;     // canceló la renovación (sigue sin anuncios hasta subUntil)
}
export const DEFAULT_ADS: AdState = { plan: '', installDate: '', lastInterstitial: '', adFreeUntil: '' };

export const GRACE_DAYS = 7;

export interface AdContext {
  today: string;
  childActive: boolean;   // se está viendo el perfil de una hija
  locked: boolean;        // bloqueo o pantalla tapada
  testing?: boolean;      // versión de prueba (IDs de prueba de Google): sin la semana de gracia, para poder verlos
}

/** ¿Puede haber anuncios en este momento? */
export function adsAllowed(s: AdState, c: AdContext): boolean {
  if (s.plan === 'premium') return false;
  if (c.locked || c.childActive) return false;
  if (!c.testing && (!s.installDate || daysBetween(s.installDate, c.today) < GRACE_DAYS)) return false; // sin anuncios la primera semana
  if (s.adFreeUntil && c.today <= s.adFreeUntil) return false;
  return true;
}

/** Banner: solo al pie de Calendario e Historial. */
export const bannerAllowed = (s: AdState, c: AdContext, tab: string) => adsAllowed(s, c) && (tab === 'calendario' || tab === 'historial');

/** Minutos mínimos entre dos anuncios de pantalla completa (en la versión de prueba, menos, para poder verlos). */
export const INTERSTITIAL_GAP = 30;
export const INTERSTITIAL_GAP_TEST = 2;
/** Cada cuántos cambios de pestaña puede tocar uno (además de después de guardar). */
export const NAV_EVERY = 4;

/** Pantalla completa: después de guardar o cada tanto al cambiar de pestaña, con al menos 30 minutos entre uno y otro. */
export function interstitialAllowed(s: AdState, c: AdContext, now: number): boolean {
  if (!adsAllowed(s, c)) return false;
  if (!s.lastInterstitial) return true;
  const last = Date.parse(s.lastInterstitial);
  if (Number.isNaN(last)) return true;
  return now - last >= (c.testing ? INTERSTITIAL_GAP_TEST : INTERSTITIAL_GAP) * 60_000;
}

/** Mirar un video da una semana sin anuncios (hoy y los 6 días siguientes). */
export const rewardUntil = (today: string) => addDays(today, 6);
