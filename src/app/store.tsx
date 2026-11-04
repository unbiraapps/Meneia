// Estado de la app: lee todo de la base local y vuelve a programar los avisos después de cada cambio.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  analyze, upcomingReminders, childReminders, finalizeReminders, localToday, addDays, showsFertility, optsFor, pillReminders,
  type Analysis, type Period, type PillEvent, type Profile, type ReminderSettings, type PrivacySettings, type Reminder, type PillSettings, type SymptomLog,
} from '../calc';
import { db, ensureSelf, getReminders, getPrivacy, getShopping, getPills, getSetting, setSetting, migrateFromPrototype, SELF_ID } from '../db';
import { syncReminders } from '../notify';
import { DEFAULT_ADS, interstitialAllowed, type AdState } from '../adrules';
import { ownsNoAds, showInterstitial } from '../ads';

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
  /** Después de guardar algo: como mucho un anuncio de pantalla completa por día. */
  afterSave: () => void;
  refresh: () => Promise<void>;
}

type Base = Omit<Store, 'setActive' | 'refresh' | 'active' | 'self' | 'setAds' | 'afterSave'>;
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
      getSetting<Health>('health', DEFAULT_HEALTH), getSetting('onboarded', false), getSetting<number>('activeProfile', SELF_ID),
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
  // Si ya compró "Sin anuncios" con su cuenta de Google (por ejemplo en otro celular), se restaura solo.
  useEffect(() => {
    if (!state.ready || state.ads.plan === 'premium') return;
    ownsNoAds().then(async owns => { if (owns) { const a = { ...state.ads, plan: 'premium' as const }; await setSetting('ads', a); setState(s => ({ ...s, ads: a })); } });
  }, [state.ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const setAds = useCallback(async (a: AdState) => { await setSetting('ads', a); setState(s => ({ ...s, ads: a })); }, []);
  const afterSave = useCallback(() => {
    setState(s => {
      const child = s.data.get(s.activeId)?.profile.kind === 'child';
      if (!interstitialAllowed(s.ads, { today: s.today, childActive: child, locked: false })) return s;
      const a = { ...s.ads, lastInterstitial: s.today };
      setSetting('ads', a);
      setTimeout(() => { showInterstitial(); }, 900); // después de que se vea el "guardado"
      return { ...s, ads: a };
    });
  }, []);
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible' && localToday() !== state.today) refresh(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [refresh, state.today]);

  const setActive = useCallback((id: number) => { setSetting('activeProfile', id); setState(s => ({ ...s, activeId: id })); }, []);

  const value = useMemo<Store>(() => ({
    ...state, setActive, refresh, setAds, afterSave,
    active: state.data.get(state.activeId) ?? null,
    self: state.data.get(SELF_ID) ?? null,
  }), [state, setActive, refresh, setAds, afterSave]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
