// Estado de la app: lee todo de la base local y vuelve a programar los avisos después de cada cambio.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  analyze, upcomingReminders, childReminders, finalizeReminders, localToday, addDays, showsFertility,
  type Analysis, type Period, type PillEvent, type Profile, type ReminderSettings, type PrivacySettings, type Reminder,
} from '../calc';
import { db, ensureSelf, getReminders, getPrivacy, getShopping, getSetting, setSetting, migrateFromPrototype, SELF_ID } from '../db';
import { syncReminders } from '../notify';

export interface Health { lastConsult: string; controlMonths: number; controlOn: boolean; questions: { text: string; done: boolean }[] }
export const DEFAULT_HEALTH: Health = { lastConsult: '', controlMonths: 12, controlOn: true, questions: [] };

export interface ProfileData { profile: Profile; periods: Period[]; events: PillEvent[]; A: Analysis }

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
  health: Health;
  onboarded: boolean;
  migrated: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<Store | null>(null);
export const useStore = () => { const s = useContext(Ctx); if (!s) throw new Error('sin store'); return s; };

/** Arma todos los avisos de la app: los propios, los de cada hija y el del control. */
export function buildReminders(data: Map<number, ProfileData>, r: ReminderSettings, pr: PrivacySettings, health: Health, now: Date): Reminder[] {
  const list: Reminder[] = [];
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
  const [state, setState] = useState<Omit<Store, 'setActive' | 'refresh' | 'active' | 'self'>>({
    ready: false, today: localToday(), profiles: [], data: new Map(), activeId: SELF_ID,
    reminders: {} as ReminderSettings, privacy: {} as PrivacySettings, shopping: [], health: DEFAULT_HEALTH, onboarded: true, migrated: false,
  });

  const refresh = useCallback(async () => {
    await ensureSelf();
    const migrated = await migrateFromPrototype().catch(() => false);
    const today = localToday();
    const [profiles, periods, events, reminders, privacy, shopping, health, onboarded, activeId] = await Promise.all([
      db.profiles.toArray(), db.periods.toArray(), db.events.toArray(), getReminders(), getPrivacy(), getShopping(),
      getSetting<Health>('health', DEFAULT_HEALTH), getSetting('onboarded', false), getSetting<number>('activeProfile', SELF_ID),
    ]);
    profiles.sort((a, b) => (a.kind === b.kind ? (a.id! - b.id!) : a.kind === 'self' ? -1 : 1));
    const data = new Map<number, ProfileData>();
    for (const p of profiles) {
      const ps = periods.filter(x => (x.profileId ?? SELF_ID) === p.id);
      const es = p.kind === 'self' ? events.filter(x => (x.profileId ?? SELF_ID) === p.id) : [];
      data.set(p.id!, { profile: p, periods: ps, events: es, A: analyze(ps, es, today) });
    }
    const h = { ...DEFAULT_HEALTH, ...health };
    setState(s => ({
      ...s, ready: true, today, profiles, data, reminders, privacy, shopping, health: h,
      onboarded, migrated: s.migrated || migrated,
      activeId: data.has(activeId) ? activeId : SELF_ID,
    }));
    syncReminders(buildReminders(data, reminders, privacy, h, new Date()), privacy).catch(() => {});
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible' && localToday() !== state.today) refresh(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [refresh, state.today]);

  const setActive = useCallback((id: number) => { setSetting('activeProfile', id); setState(s => ({ ...s, activeId: id })); }, []);

  const value = useMemo<Store>(() => ({
    ...state, setActive, refresh,
    active: state.data.get(state.activeId) ?? null,
    self: state.data.get(SELF_ID) ?? null,
  }), [state, setActive, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
