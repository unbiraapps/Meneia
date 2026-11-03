import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db, savePeriod, savePillEvent, exportBackup, restoreBackup, migrateFromPrototype, getReminders, setSetting } from '../src/db';

const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; } };

beforeEach(async () => {
  await Promise.all([db.periods.clear(), db.events.clear(), db.settings.clear()]);
  for (const k of Object.keys(store)) delete store[k];
});

describe('base de datos', () => {
  it('guarda y edita un período', async () => {
    await savePeriod({ start: '2026-10-29', end: '', flow: 'Normal', note: '' });
    const p = (await db.periods.toArray())[0];
    await savePeriod({ ...p, end: '2026-11-02', flow: 'Abundante' });
    const all = await db.periods.toArray();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ start: '2026-10-29', end: '2026-11-02', flow: 'Abundante' });
  });

  it('el mismo primer día reemplaza al anterior', async () => {
    await savePeriod({ start: '2026-10-29', end: '2026-11-01', flow: 'Normal', note: '' });
    await savePeriod({ start: '2026-10-29', end: '2026-11-03', flow: 'Leve', note: 'x' });
    expect(await db.periods.count()).toBe(1);
  });

  it('copia y restaura todo', async () => {
    await savePeriod({ start: '2026-10-01', end: '2026-10-05', flow: 'Normal', note: '' });
    await savePillEvent({ date: '2026-08-20', type: 'stop' });
    await setSetting('reminders', { periodDaysBefore: 3 });
    const b = await exportBackup();
    await Promise.all([db.periods.clear(), db.events.clear(), db.settings.clear()]);
    await restoreBackup(b);
    expect(await db.periods.count()).toBe(1);
    expect(await db.events.count()).toBe(1);
    expect((await getReminders()).periodDaysBefore).toBe(3);
  });

  it('pasa los datos reales del prototipo una sola vez', async () => {
    store['mi-ciclo-lila-v1'] = JSON.stringify({ example: false, periods: [{ start: '2026-10-29', end: '', flow: 'Normal', note: '' }], events: [{ date: '2026-08-20', type: 'stop' }] });
    expect(await migrateFromPrototype()).toBe(true);
    expect(await db.periods.count()).toBe(1);
    expect(await migrateFromPrototype()).toBe(false);
    expect(await db.periods.count()).toBe(1);
  });

  it('no pasa los datos de ejemplo del prototipo', async () => {
    store['mi-ciclo-lila-v1'] = JSON.stringify({ example: true, periods: [{ start: '2026-10-29', end: '', flow: 'Normal', note: '' }] });
    expect(await migrateFromPrototype()).toBe(false);
    expect(await db.periods.count()).toBe(0);
  });
});
