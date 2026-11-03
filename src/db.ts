// Datos guardados en el celular (IndexedDB vía Dexie). Nada sale del dispositivo.
import Dexie, { type Table } from 'dexie';
import type { Period, PillEvent, ReminderSettings, Flow, PillType } from './calc';
import { DEFAULT_REMINDERS } from './calc';

interface Setting { key: string; value: unknown }

class CicloDB extends Dexie {
  periods!: Table<Period, number>;
  events!: Table<PillEvent, number>;
  settings!: Table<Setting, string>;
  constructor() {
    super('mi-ciclo-lila');
    this.version(1).stores({
      periods: '++id, &start',
      events: '++id, &date',
      settings: 'key',
    });
  }
}

export const db = new CicloDB();

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.settings.get(key);
  return row ? (row.value as T) : fallback;
}
export const setSetting = (key: string, value: unknown) => db.settings.put({ key, value });

export const getReminders = async (): Promise<ReminderSettings> => ({ ...DEFAULT_REMINDERS, ...(await getSetting<Partial<ReminderSettings>>('reminders', {})) });

/** Guarda un período. Si ya existe otro con el mismo primer día, lo reemplaza. */
export async function savePeriod(p: Period): Promise<void> {
  await db.transaction('rw', db.periods, async () => {
    const same = await db.periods.where('start').equals(p.start).first();
    if (same && same.id !== p.id) await db.periods.delete(same.id!);
    if (p.id != null) await db.periods.put(p);
    else await db.periods.add({ start: p.start, end: p.end, flow: p.flow, note: p.note, trying: !!p.trying });
  });
}

export async function savePillEvent(e: PillEvent): Promise<void> {
  await db.transaction('rw', db.events, async () => {
    const same = await db.events.where('date').equals(e.date).first();
    if (same) await db.events.delete(same.id!);
    await db.events.add({ date: e.date, type: e.type });
  });
}

// ---------- Copia de seguridad ----------

export interface Backup { app: 'mi-ciclo-lila'; version: 1; exportedAt: string; periods: Period[]; events: PillEvent[]; reminders?: Partial<ReminderSettings> }

export async function exportBackup(): Promise<Backup> {
  const [periods, events, reminders] = await Promise.all([db.periods.toArray(), db.events.toArray(), getSetting('reminders', {})]);
  return {
    app: 'mi-ciclo-lila', version: 1, exportedAt: new Date().toISOString(),
    periods: periods.map(({ start, end, flow, note, trying }) => ({ start, end, flow, note, ...(trying ? { trying: true } : {}) })),
    events: events.map(({ date, type }) => ({ date, type })),
    reminders: reminders as Partial<ReminderSettings>,
  };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const FLOWS: Flow[] = ['Leve', 'Normal', 'Abundante'];

/** Valida un texto de copia. Devuelve los datos limpios o un mensaje de error. */
export function parseBackup(text: string): { ok: true; data: Backup } | { ok: false; error: string } {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return { ok: false, error: 'El texto no es una copia válida. Pegalo completo, desde la primera llave { hasta la última }.' }; }
  const r = raw as Record<string, unknown>;
  // Acepta también el formato del prototipo ({periods, events, example})
  if (!r || !Array.isArray(r.periods)) return { ok: false, error: 'La copia no tiene períodos guardados.' };
  const periods: Period[] = [];
  for (const p of r.periods as Record<string, unknown>[]) {
    if (!p || typeof p.start !== 'string' || !DATE_RE.test(p.start)) return { ok: false, error: 'Hay un período con una fecha inválida.' };
    const end = typeof p.end === 'string' && DATE_RE.test(p.end) && p.end >= p.start ? p.end : '';
    periods.push({ start: p.start, end, flow: FLOWS.includes(p.flow as Flow) ? (p.flow as Flow) : 'Normal', note: typeof p.note === 'string' ? p.note.slice(0, 500) : '', ...(p.trying === true ? { trying: true } : {}) });
  }
  const events: PillEvent[] = [];
  for (const e of (Array.isArray(r.events) ? r.events : []) as Record<string, unknown>[]) {
    if (e && typeof e.date === 'string' && DATE_RE.test(e.date) && (e.type === 'stop' || e.type === 'start')) events.push({ date: e.date, type: e.type as PillType });
  }
  return { ok: true, data: { app: 'mi-ciclo-lila', version: 1, exportedAt: String(r.exportedAt ?? ''), periods, events, reminders: (r.reminders as Partial<ReminderSettings>) ?? undefined } };
}

export async function restoreBackup(b: Backup): Promise<void> {
  await db.transaction('rw', db.periods, db.events, db.settings, async () => {
    await db.periods.clear();
    await db.events.clear();
    const seen = new Set<string>();
    for (const p of b.periods) if (!seen.has(p.start)) { seen.add(p.start); await db.periods.add(p); }
    const seenE = new Set<string>();
    for (const e of b.events) if (!seenE.has(e.date)) { seenE.add(e.date); await db.events.add(e); }
    if (b.reminders) await db.settings.put({ key: 'reminders', value: b.reminders });
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
