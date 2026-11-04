// Datos guardados en el celular (IndexedDB vía Dexie). Nada sale del dispositivo.
import Dexie, { type Table } from 'dexie';
import type { Period, PillEvent, ReminderSettings, Flow, PillType, Profile, PrivacySettings, PillSettings, SymptomLog } from './calc';
import { DEFAULT_REMINDERS, DEFAULT_PRIVACY, DEFAULT_SHOPPING, DEFAULT_PILLS } from './calc';

interface Setting { key: string; value: unknown }

export const SELF_ID = 1;

class CicloDB extends Dexie {
  periods!: Table<Period, number>;
  events!: Table<PillEvent, number>;
  settings!: Table<Setting, string>;
  profiles!: Table<Profile, number>;
  symptoms!: Table<SymptomLog, number>;
  constructor() {
    super('mi-ciclo-lila');
    this.version(1).stores({
      periods: '++id, &start',
      events: '++id, &date',
      settings: 'key',
    });
    // v2: perfiles. Todo lo que había pasa al perfil "Yo" (id 1), sin perder nada.
    this.version(2).stores({
      periods: '++id, profileId, start, [profileId+start]',
      events: '++id, profileId, date, [profileId+date]',
      settings: 'key',
      profiles: '++id, kind',
    }).upgrade(async tx => {
      await tx.table('profiles').put(selfProfile());
      await tx.table('periods').toCollection().modify((p: Period) => { if (p.profileId == null) p.profileId = SELF_ID; });
      await tx.table('events').toCollection().modify((e: PillEvent) => { if (e.profileId == null) e.profileId = SELF_ID; });
    });
    // v3: síntomas por día y por perfil
    this.version(3).stores({ symptoms: '++id, profileId, date, [profileId+date]' });
  }
}

const selfProfile = (): Profile => ({ id: SELF_ID, name: 'Yo', kind: 'self', color: '#B5A4E6', birthDate: '', trying: false, notYet: false, alertDays: 0 });

export const db = new CicloDB();

/** Se asegura de que exista el perfil "Yo" (en una base nueva, la migración v2 no corre). */
export async function ensureSelf(): Promise<void> {
  if (!(await db.profiles.get(SELF_ID))) await db.profiles.put(selfProfile());
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.settings.get(key);
  return row ? (row.value as T) : fallback;
}
export const setSetting = (key: string, value: unknown) => db.settings.put({ key, value });

export const getReminders = async (): Promise<ReminderSettings> => ({ ...DEFAULT_REMINDERS, ...(await getSetting<Partial<ReminderSettings>>('reminders', {})) });
export const getPrivacy = async (): Promise<PrivacySettings> => ({ ...DEFAULT_PRIVACY, ...(await getSetting<Partial<PrivacySettings>>('privacy', {})) });
export const getShopping = async (): Promise<string[]> => getSetting<string[]>('shopping', DEFAULT_SHOPPING);
export const getPills = async (): Promise<PillSettings> => ({ ...DEFAULT_PILLS, ...(await getSetting<Partial<PillSettings>>('pills', {})) });
export const savePills = (p: PillSettings) => setSetting('pills', { ...p, taken: [...new Set(p.taken)].sort().slice(-90) });

/** Guarda los síntomas de un día. Si queda todo vacío, borra el registro. */
export async function saveSymptoms(l: SymptomLog): Promise<void> {
  const profileId = l.profileId ?? SELF_ID;
  await db.transaction('rw', db.symptoms, async () => {
    const same = await db.symptoms.where('[profileId+date]').equals([profileId, l.date]).first();
    if (same) await db.symptoms.delete(same.id!);
    const empty = !l.pain && !l.body.length && !l.mood.length && !l.note.trim();
    if (!empty) await db.symptoms.add({ profileId, date: l.date, pain: l.pain, body: l.body, mood: l.mood, note: l.note.trim().slice(0, 300) });
  });
}

export const periodsOf = (profileId: number) => db.periods.where('profileId').equals(profileId).toArray();
export const eventsOf = (profileId: number) => db.events.where('profileId').equals(profileId).toArray();

/** Guarda un período. Si el perfil ya tiene otro con el mismo primer día, lo reemplaza. */
export async function savePeriod(p: Period): Promise<void> {
  const profileId = p.profileId ?? SELF_ID;
  await db.transaction('rw', db.periods, async () => {
    const same = await db.periods.where('[profileId+start]').equals([profileId, p.start]).first();
    if (same && same.id !== p.id) await db.periods.delete(same.id!);
    const row: Period = { profileId, start: p.start, end: p.end, flow: p.flow, note: p.note, trying: !!p.trying };
    if (p.id != null) await db.periods.put({ ...row, id: p.id });
    else await db.periods.add(row);
  });
}

export async function savePillEvent(e: PillEvent): Promise<void> {
  const profileId = e.profileId ?? SELF_ID;
  await db.transaction('rw', db.events, async () => {
    const same = await db.events.where('[profileId+date]').equals([profileId, e.date]).first();
    if (same) await db.events.delete(same.id!);
    await db.events.add({ profileId, date: e.date, type: e.type });
  });
}

export async function saveProfile(p: Profile): Promise<number> {
  if (p.kind === 'child') p = { ...p, trying: false };
  return db.profiles.put(p);
}

/** Borra un perfil de hija y todos sus registros. El perfil "Yo" no se puede borrar. */
export async function deleteProfile(id: number): Promise<void> {
  if (id === SELF_ID) return;
  await db.transaction('rw', [db.profiles, db.periods, db.events, db.symptoms], async () => {
    await db.periods.where('profileId').equals(id).delete();
    await db.symptoms.where('profileId').equals(id).delete();
    await db.events.where('profileId').equals(id).delete();
    await db.profiles.delete(id);
  });
}

// ---------- Copia de seguridad ----------

export interface Backup {
  app: 'mi-ciclo-lila'; version: 1 | 2; exportedAt: string;
  periods: Period[]; events: PillEvent[];
  profiles?: Profile[];
  reminders?: Partial<ReminderSettings>;
  shopping?: string[];
  symptoms?: SymptomLog[];
  pills?: Partial<PillSettings>;
}

export async function exportBackup(): Promise<Backup> {
  const [periods, events, profiles, reminders, shopping, symptoms, pills] = await Promise.all([
    db.periods.toArray(), db.events.toArray(), db.profiles.toArray(), getSetting('reminders', {}), getShopping(), db.symptoms.toArray(), getPills(),
  ]);
  return {
    app: 'mi-ciclo-lila', version: 2, exportedAt: new Date().toISOString(),
    profiles: profiles.map(p => ({ ...p })),
    periods: periods.map(({ profileId, start, end, flow, note, trying, atypical }) => ({ profileId, start, end, flow, note, ...(trying ? { trying: true } : {}), ...(atypical ? { atypical: true } : {}) })),
    symptoms: symptoms.map(({ profileId, date, pain, body, mood, note }) => ({ profileId, date, pain, body, mood, note })),
    pills,
    events: events.map(({ profileId, date, type }) => ({ profileId, date, type })),
    reminders: reminders as Partial<ReminderSettings>,
    shopping,
  };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const FLOWS: Flow[] = ['Leve', 'Normal', 'Abundante'];
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/** Valida un texto de copia (versión 1 o 2, o el formato del prototipo). Devuelve los datos limpios o un mensaje de error. */
export function parseBackup(text: string): { ok: true; data: Backup } | { ok: false; error: string } {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return { ok: false, error: 'El texto no es una copia válida. Pegalo completo, desde la primera llave { hasta la última }.' }; }
  const r = raw as Record<string, unknown>;
  if (!r || !Array.isArray(r.periods)) return { ok: false, error: 'La copia no tiene períodos guardados.' };

  const profiles: Profile[] = [];
  const ids = new Set<number>([SELF_ID]);
  if (Array.isArray(r.profiles)) {
    for (const x of r.profiles as Record<string, unknown>[]) {
      if (!x || typeof x.id !== 'number' || !Number.isInteger(x.id) || x.id < 1) continue;
      const kind = x.id === SELF_ID ? 'self' : 'child';
      profiles.push({
        id: x.id, kind,
        name: typeof x.name === 'string' && x.name.trim() ? x.name.trim().slice(0, 30) : (kind === 'self' ? 'Yo' : 'Hija'),
        color: typeof x.color === 'string' && COLOR_RE.test(x.color) ? x.color : '#B5A4E6',
        birthDate: typeof x.birthDate === 'string' && DATE_RE.test(x.birthDate) ? x.birthDate : '',
        trying: kind === 'self' && x.trying === true,
        notYet: kind === 'child' && x.notYet === true,
        alertDays: typeof x.alertDays === 'number' && [0, 1, 2, 3].includes(x.alertDays) ? x.alertDays : 0,
        margin: typeof x.margin === 'number' && x.margin >= 2 && x.margin <= 7 ? x.margin : null,
      });
      ids.add(x.id);
    }
  }
  const pid = (v: unknown) => (typeof v === 'number' && ids.has(v) ? v : SELF_ID);

  const periods: Period[] = [];
  for (const p of r.periods as Record<string, unknown>[]) {
    if (!p || typeof p.start !== 'string' || !DATE_RE.test(p.start)) return { ok: false, error: 'Hay un período con una fecha inválida.' };
    const end = typeof p.end === 'string' && DATE_RE.test(p.end) && p.end >= p.start ? p.end : '';
    periods.push({ profileId: pid(p.profileId), start: p.start, end, flow: FLOWS.includes(p.flow as Flow) ? (p.flow as Flow) : 'Normal', note: typeof p.note === 'string' ? p.note.slice(0, 500) : '', ...(p.trying === true ? { trying: true } : {}), ...(p.atypical === true ? { atypical: true } : {}) });
  }
  const events: PillEvent[] = [];
  for (const e of (Array.isArray(r.events) ? r.events : []) as Record<string, unknown>[]) {
    if (e && typeof e.date === 'string' && DATE_RE.test(e.date) && (e.type === 'stop' || e.type === 'start')) events.push({ profileId: SELF_ID, date: e.date, type: e.type as PillType });
  }
  const symptoms: SymptomLog[] = [];
  for (const l of (Array.isArray(r.symptoms) ? r.symptoms : []) as Record<string, unknown>[]) {
    if (!l || typeof l.date !== 'string' || !DATE_RE.test(l.date)) continue;
    const strs = (v: unknown, max: number) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').map(x => x.slice(0, 40)).slice(0, max) : []);
    symptoms.push({ profileId: pid(l.profileId), date: l.date, pain: typeof l.pain === 'number' && l.pain >= 0 && l.pain <= 3 ? l.pain : 0, body: strs(l.body, 20), mood: strs(l.mood, 10), note: typeof l.note === 'string' ? l.note.slice(0, 300) : '' });
  }
  const pills = r.pills && typeof r.pills === 'object' ? sanitizePills(r.pills as Record<string, unknown>) : undefined;
  const shopping = Array.isArray(r.shopping) ? (r.shopping as unknown[]).filter((s): s is string => typeof s === 'string').map(s => s.slice(0, 60)).slice(0, 30) : undefined;
  return { ok: true, data: { app: 'mi-ciclo-lila', version: r.version === 2 ? 2 : 1, exportedAt: String(r.exportedAt ?? ''), periods, events, profiles: profiles.length ? profiles : undefined, reminders: (r.reminders as Partial<ReminderSettings>) ?? undefined, shopping, symptoms, pills } };
}

function sanitizePills(x: Record<string, unknown>): Partial<PillSettings> {
  const int = (v: unknown, lo: number, hi: number, d: number) => (typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi ? v : d);
  return {
    packStart: typeof x.packStart === 'string' && DATE_RE.test(x.packStart) ? x.packStart : '',
    active: int(x.active, 1, 90, 21), rest: int(x.rest, 0, 14, 7), hour: int(x.hour, 0, 23, 21),
    remind: x.remind !== false, stock: int(x.stock, 0, 24, 1),
    stockDate: typeof x.stockDate === 'string' && DATE_RE.test(x.stockDate) ? x.stockDate : '',
    taken: Array.isArray(x.taken) ? x.taken.filter((d): d is string => typeof d === 'string' && DATE_RE.test(d)).slice(-90) : [],
  };
}

export async function restoreBackup(b: Backup): Promise<void> {
  await db.transaction('rw', [db.periods, db.events, db.settings, db.profiles, db.symptoms], async () => {
    await db.periods.clear();
    await db.events.clear();
    await db.symptoms.clear();
    for (const l of b.symptoms ?? []) await db.symptoms.add({ ...l, profileId: l.profileId ?? SELF_ID });
    if (b.pills) await db.settings.put({ key: 'pills', value: { ...DEFAULT_PILLS, ...b.pills } });
    if (b.profiles?.length) {
      await db.profiles.clear();
      for (const p of b.profiles) await db.profiles.put(p);
    }
    if (!(await db.profiles.get(SELF_ID))) await db.profiles.put(selfProfile());
    const seen = new Set<string>();
    for (const p of b.periods) {
      const k = (p.profileId ?? SELF_ID) + ':' + p.start;
      if (!seen.has(k)) { seen.add(k); await db.periods.add({ ...p, profileId: p.profileId ?? SELF_ID }); }
    }
    const seenE = new Set<string>();
    for (const e of b.events) if (!seenE.has(e.date)) { seenE.add(e.date); await db.events.add({ ...e, profileId: SELF_ID }); }
    if (b.reminders) await db.settings.put({ key: 'reminders', value: b.reminders });
    if (b.shopping) await db.settings.put({ key: 'shopping', value: b.shopping });
  });
}

/** Pasa los datos del prototipo (guardados en localStorage) a la base nueva, una sola vez. */
export async function migrateFromPrototype(): Promise<boolean> {
  if (await getSetting('migrated', false)) return false;
  let raw: string | null = null;
  try { raw = localStorage.getItem('mi-ciclo-lila-v1'); } catch { return false; }
  if (!raw) return false;
  await setSetting('migrated', true);
  try {
    const s = JSON.parse(raw);
    if (s?.example) return false; // eran datos de ejemplo
    const parsed = parseBackup(raw);
    if (!parsed.ok || (!parsed.data.periods.length && !parsed.data.events.length)) return false;
    if ((await db.periods.count()) || (await db.events.count())) return false;
    await restoreBackup(parsed.data);
    return true;
  } catch { return false; }
}
