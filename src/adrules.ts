// Reglas de los anuncios. Funciones puras, con pruebas: deciden cuándo se puede mostrar algo.
import { addDays, daysBetween } from './calc';

export type Plan = '' | 'free' | 'premium';

export interface AdState {
  plan: Plan;               // '' = todavía no eligió
  installDate: string;      // primer día de uso
  lastInterstitial: string; // último día con anuncio de pantalla completa
  adFreeUntil: string;      // semana sin anuncios por mirar un video (incluye ese día)
}
export const DEFAULT_ADS: AdState = { plan: '', installDate: '', lastInterstitial: '', adFreeUntil: '' };

export const GRACE_DAYS = 7;

export interface AdContext {
  today: string;
  childActive: boolean;   // se está viendo el perfil de una hija
  locked: boolean;        // bloqueo o pantalla tapada
}

/** ¿Puede haber anuncios en este momento? */
export function adsAllowed(s: AdState, c: AdContext): boolean {
  if (s.plan === 'premium') return false;
  if (c.locked || c.childActive) return false;
  if (!s.installDate || daysBetween(s.installDate, c.today) < GRACE_DAYS) return false; // sin anuncios la primera semana
  if (s.adFreeUntil && c.today <= s.adFreeUntil) return false;
  return true;
}

/** Banner: solo al pie de Calendario e Historial. */
export const bannerAllowed = (s: AdState, c: AdContext, tab: string) => adsAllowed(s, c) && (tab === 'calendario' || tab === 'historial');

/** Pantalla completa: como mucho uno por día, y solo después de guardar algo. */
export const interstitialAllowed = (s: AdState, c: AdContext) => adsAllowed(s, c) && s.lastInterstitial !== c.today;

/** Mirar un video da una semana sin anuncios (hoy y los 6 días siguientes). */
export const rewardUntil = (today: string) => addDays(today, 6);
