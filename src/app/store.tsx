// Estado de la app: lee todo de la base local y vuelve a programar los avisos después de cada cambio.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  analyze, upcomingReminders, childReminders, finalizeReminders, localToday, addDays, showsFertility, optsFor, pillReminders,
  type Analysis, type Period, type PillEvent, type Profile, type ReminderSettings, type PrivacySettings, type Reminder, type PillSettings, type SymptomLog,
} from '../calc';
import { db, ensureSelf, getReminders, getPrivacy, getShopping, getPills, getSetting, setSetting, migrateFromPrototype, SELF_ID } from '../db';
import { syncReminders } from '../notify';
import { DEFAULT_ADS, NAV_EVERY, interstitialAllowed, type AdState } from '../adrules';
import { ADS_TESTING, preloadInterstitial, showInterstitial, subscriptionStatus } from '../ads';

export interface Consult { date: string; reason: string; note: string }
export interface Health { lastConsult: string; controlMonths: number; controlOn: boolean; questions: { text: string; done: boolean }[]; consults: Consult[] }
export const DEFAULT_HEALTH: Health = { lastConsult: '', controlMonths: 12, controlOn: true, questions: [], consults: [] };

/** La última consulta es la más reciente de la lista (o la fecha suelta de versiones anteriores). */
export const withLast = (h: Health): Health => {
  const dates = [h.lastConsult, ...h.consults.map(c => c.date)].filter(Boolean).sort();
  return { ...h, lastConsult: dates[dates.length - 1] ?? '' };
};

export interface ProfileData { profile: Profile; periods: Period[]; events: PillEvent[]; symptoms: SymptomLog[]; A: Analysis }

interface Store {
  ready: boolean;
  today: string;
  profiles: Profile[];
  data: Map<number, ProfileData>;
  activeId: number;
  setActive: (id: number) => void;
  active: ProfileData | null;
  self: ProfileData | null;
  reminders: ReminderSettings;
  privacy: PrivacySettings;
  shopping: string[];
  pills: PillSettings;
  health: Health;
  onboarded: boolean;
  migrated: boolean;
  ads: AdState;
  setAds: (a: AdState) => Promise<void>;
  /** Después de guardar algo: puede tocar un anuncio de pantalla completa (al menos 30 minutos entre uno y otro). */
  afterSave: () => void;
  /** Cambio de pestaña: cada tanto puede tocar un anuncio de pantalla completa. */
  afterNav: () => void;
  refresh: () => Promise<void>;
}

type Base = Omit<Store, 'setActive' | 'refresh' | 'active' | 'self' | 'setAds' | 'afterSave' | 'afterNav'>;
const Ctx = createContext<Store | null>(null);
export const useStore = () => { const s = useContext(Ctx); if (!s) throw new Error('sin store'); return s; };

/** Arma todos los avisos de la app: los propios, los de cada hija y el del control. */
export function buildReminders(data: Map<number, ProfileData>, r: ReminderSettings, pr: PrivacySettings, health: Health, now: Date, pills?: PillSettings): Reminder[] {
  const list: Reminder[] = [];
  const self = data.get(SELF_ID);
  if (pills && self?.A.onPill) list.push(...pillReminders(pills, now));
  for (const d of data.values()) {
    if (d.profile.kind === 'self') {
      const own = upcomingReminders(d.A, r, now);
      list.push(...(showsFertility(d.profile) ? own : own.filter(x => x.id < 3000 || x.id >= 5000)));
    } else {
      list.push(...childReminders(d.profile, d.A, r.hour, now));
    }
  }
  if (health.controlOn && health.lastConsult) {
    const due = addDays(health.lastConsult, Math.round(health.controlMonths * 30.4));
    if (due >= localToday(now)) list.push({ id: 7000, date: due, hour: r.hour, title: 'Control con la ginecóloga', body: 'Ya pasó el tiempo que elegiste desde la última consulta.' });
  }
  return finalizeReminders(list, pr).sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Base>({
    ready: false, today: localToday(), profiles: [], data: new Map(), activeId: SELF_ID,
    reminders: {} as ReminderSettings, privacy: {} as PrivacySettings, shopping: [], pills: {} as PillSettings, health: DEFAULT_HEALTH, onboarded: true, migrated: false, ads: DEFAULT_ADS,
  });

  const refresh = useCallback(async () => {
    await ensureSelf();
    const migrated = await migrateFromPrototype().catch(() => false);
    const today = localToday();
    const [profiles, periods, events, symptoms, reminders, privacy, shopping, pills, health, onboarded, activeId] = await Promise.all([
      db.profiles.toArray(), db.periods.toArray(), db.events.toArray(), db.symptoms.toArray(), getReminders(), getPrivacy(), getShopping(), getPills(),
      getSetting<Health>('health', DEFAULT_HEALTH), getSetting('onboarded', false), Promise.resolve(SELF_ID),
    ]);
    let ads = { ...DEFAULT_ADS, ...(await getSetting<Partial<AdState>>('ads', {})) };
    if (!ads.installDate) { ads = { ...ads, installDate: today }; await setSetting('ads', ads); }
    profiles.sort((a, b) => (a.kind === b.kind ? (a.id! - b.id!) : a.kind === 'self' ? -1 : 1));
    const data = new Map<number, ProfileData>();
    for (const p of profiles) {
      const ps = periods.filter(x => (x.profileId ?? SELF_ID) === p.id);
      const es = p.kind === 'self' ? events.filter(x => (x.profileId ?? SELF_ID) === p.id) : [];
      const sy = symptoms.filter(x => (x.profileId ?? SELF_ID) === p.id);
      data.set(p.id!, { profile: p, periods: ps, events: es, symptoms: sy, A: analyze(ps, es, today, optsFor(p, today)) });
    }
    const h = withLast({ ...DEFAULT_HEALTH, ...health, consults: Array.isArray(health.consults) ? health.consults : [] });
    setState(s => ({
      ...s, ready: true, today, profiles, data, reminders, privacy, shopping, pills, health: h, ads,
      onboarded, migrated: s.migrated || migrated,
      activeId: data.has(activeId) ? activeId : SELF_ID,
    }));
    syncReminders(buildReminders(data, reminders, privacy, h, new Date(), pills), privacy).catch(() => {});
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  // La suscripción se verifica con Google Play al abrir y al volver a la app: nunca queda "premium para siempre".
  const checkSub = useCallback(async () => {
    if (import.meta.env.VITE_DEMO === '1') return; // capturas: se queda sin anuncios
    const st = await subscriptionStatus();
    if (st === null) return; // sin conexión o en la web: se mantiene lo último conocido
    setState(s => {
      const plan = st.active ? 'premium' as const : s.ads.plan === 'premium' ? 'free' as const : s.ads.plan;
      const a = { ...s.ads, plan, subUntil: st.until, willCancel: st.willCancel };
      if (a.plan === s.ads.plan && a.subUntil === s.ads.subUntil && a.willCancel === s.ads.willCancel) return s;
      setSetting('ads', a);
      return { ...s, ads: a };
    });
  }, []);
  useEffect(() => { if (state.ready) checkSub(); }, [state.ready, checkSub]);
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible') checkSub(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [checkSub]);

  const setAds = useCallback(async (a: AdState) => { await setSetting('ads', a); setState(s => ({ ...s, ads: a })); }, []);
  const stateRef = useRef(state);
  stateRef.current = state;
  const showing = useRef(false);
  const navs = useRef(0);
  const maybeInterstitial = useCallback((delay: number) => {
    const s = stateRef.current;
    const child = s.data.get(s.activeId)?.profile.kind === 'child';
    if (showing.current || !interstitialAllowed(s.ads, { today: s.today, childActive: child, locked: false, testing: ADS_TESTING }, Date.now())) return;
    showing.current = true;
    setTimeout(async () => {
      const shown = await showInterstitial();
      showing.current = false;
      if (!shown) return; // si no cargó, se vuelve a intentar en el próximo momento
      navs.current = 0;
      const a = { ...stateRef.current.ads, lastInterstitial: new Date().toISOString() };
      await setSetting('ads', a);
      setState(st => ({ ...st, ads: a }));
    }, delay);
  }, []);
  const afterSave = useCallback(() => maybeInterstitial(900), [maybeInterstitial]); // después de que se vea el "guardado"
  const afterNav = useCallback(() => { navs.current += 1; if (navs.current >= NAV_EVERY) maybeInterstitial(300); }, [maybeInterstitial]);
  useEffect(() => { if (state.ready && state.ads.plan !== 'premium') preloadInterstitial(); }, [state.ready, state.ads.plan]);
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible' && localToday() !== state.today) refresh(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [refresh, state.today]);

  const setActive = useCallback((id: number) => { setState(s => ({ ...s, activeId: id })); }, []); // no se guarda: la app siempre arranca en tus días

  const value = useMemo<Store>(() => ({
    ...state, setActive, refresh, setAds, afterSave, afterNav,
    active: state.data.get(state.activeId) ?? null,
    self: state.data.get(SELF_ID) ?? null,
  }), [state, setActive, refresh, setAds, afterSave, afterNav]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
