import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import Dexie from 'dexie';
import { analyze, ageOn, canTry, showsFertility, childReminders, inQuiet, finalizeReminders, DEFAULT_PRIVACY, type Profile, type Period } from '../src/calc';
import { db, ensureSelf, savePeriod, saveProfile, deleteProfile, exportBackup, parseBackup, restoreBackup, SELF_ID } from '../src/db';
import { buildReminders, DEFAULT_HEALTH } from '../src/app/store';
import { DEFAULT_REMINDERS } from '../src/calc';

const P = (start: string, end = ''): Period => ({ start, end, flow: 'Normal', note: '' });
const kid = (o: Partial<Profile> = {}): Profile => ({ id: 2, name: 'Sofi', kind: 'child', color: '#9FD8C8', birthDate: '2012-05-01', trying: false, notYet: false, alertDays: 2, ...o });
const me = (o: Partial<Profile> = {}): Profile => ({ id: 1, name: 'Yo', kind: 'self', color: '#B5A4E6', birthDate: '1995-03-10', trying: false, notYet: false, alertDays: 0, ...o });

describe('edad y modo embarazo', () => {
  it('calcula la edad cumplida', () => {
    expect(ageOn('2008-11-04', '2026-11-04')).toBe(18);
    expect(ageOn('2008-11-05', '2026-11-04')).toBe(17);
    expect(ageOn('', '2026-11-04')).toBeNull();
  });
  it('buscar embarazo solo para el perfil propio y con 18 o más', () => {
    expect(canTry(me(), '2026-11-04')).toBe(true);
    expect(canTry(me({ birthDate: '2010-01-01' }), '2026-11-04')).toBe(false);
    expect(canTry(me({ birthDate: '' }), '2026-11-04')).toBe(false);
    expect(canTry(kid({ birthDate: '1990-01-01' }), '2026-11-04')).toBe(false);
  });
  it('los perfiles de hijas nunca muestran fertilidad', () => {
    expect(showsFertility(kid())).toBe(false);
    expect(showsFertility(me())).toBe(true);
  });
});

describe('avisos de familia', () => {
  const A = analyze([P('2026-09-08', '2026-09-12'), P('2026-10-08', '2026-10-12')], [], '2026-11-01');
  it('un aviso X días antes del próximo período, con texto neutro', () => {
    expect(A.next).toBe('2026-11-07');
    const list = childReminders(kid(), A, 9, new Date(2026, 10, 1, 8));
    expect(list[0]).toMatchObject({ date: '2026-11-05', title: 'Meneia', body: 'Lista de compras para esta semana', id: 6020 });
    expect(list.every(r => !/período|Sofi/i.test(r.title + r.body))).toBe(true);
  });
  it('sin aviso si está apagado o todavía no le vino', () => {
    expect(childReminders(kid({ alertDays: 0 }), A, 9, new Date(2026, 10, 1))).toEqual([]);
    expect(childReminders(kid({ notYet: true }), A, 9, new Date(2026, 10, 1))).toEqual([]);
  });
});

describe('avisos discretos y horario sin avisos', () => {
  it('detecta el horario aunque cruce la medianoche', () => {
    expect(inQuiet(23, 22, 8)).toBe(true);
    expect(inQuiet(7, 22, 8)).toBe(true);
    expect(inQuiet(9, 22, 8)).toBe(false);
    expect(inQuiet(9, 8, 8)).toBe(false);
  });
  it('texto neutro y corrimiento de hora', () => {
    const out = finalizeReminders([{ id: 1000, date: '2026-11-05', hour: 23, title: 'Tu período podría llegar en 2 días', body: 'x' }], DEFAULT_PRIVACY);
    expect(out[0]).toMatchObject({ title: 'Meneia', body: 'Tenés un recordatorio', hour: 8 });
    const plain = finalizeReminders([{ id: 1000, date: '2026-11-05', hour: 9, title: 'T', body: 'B' }], { ...DEFAULT_PRIVACY, discreet: false });
    expect(plain[0]).toMatchObject({ title: 'T', body: 'B', hour: 9 });
  });
});

beforeEach(async () => {
  await Promise.all([db.periods.clear(), db.events.clear(), db.settings.clear(), db.profiles.clear()]);
  await ensureSelf();
});

describe('perfiles en la base', () => {
  it('cada perfil tiene sus períodos, y el mismo día en dos perfiles no se pisa', async () => {
    const id = await saveProfile(kid({ id: undefined }));
    await savePeriod({ ...P('2026-10-01'), profileId: SELF_ID });
    await savePeriod({ ...P('2026-10-01'), profileId: id });
    expect(await db.periods.count()).toBe(2);
    await savePeriod({ ...P('2026-10-01', '2026-10-05'), profileId: id });
    expect(await db.periods.where('profileId').equals(id).count()).toBe(1);
  });
  it('una hija nunca queda con modo embarazo', async () => {
    const id = await saveProfile(kid({ id: undefined, trying: true }));
    expect((await db.profiles.get(id))!.trying).toBe(false);
  });
  it('borrar una hija borra sus registros; "Yo" no se borra', async () => {
    const id = await saveProfile(kid({ id: undefined }));
    await savePeriod({ ...P('2026-10-01'), profileId: id });
    await deleteProfile(id);
    await deleteProfile(SELF_ID);
    expect(await db.periods.count()).toBe(0);
    expect(await db.profiles.get(SELF_ID)).toBeTruthy();
  });
  it('la copia v2 guarda y restaura perfiles', async () => {
    const id = await saveProfile(kid({ id: undefined }));
    await savePeriod({ ...P('2026-10-01'), profileId: id });
    const b = await exportBackup();
    const parsed = parseBackup(JSON.stringify(b));
    expect(parsed.ok).toBe(true);
    await Promise.all([db.periods.clear(), db.profiles.clear()]);
    if (parsed.ok) await restoreBackup(parsed.data);
    expect((await db.profiles.toArray()).map(p => p.name).sort()).toEqual(['Sofi', 'Yo']);
    expect(await db.periods.where('profileId').equals(id).count()).toBe(1);
  });
  it('arma los avisos de todos los perfiles juntos', async () => {
    const data = new Map();
    const A1 = analyze([P('2026-10-08', '2026-10-12')], [], '2026-11-01');
    data.set(1, { profile: me(), periods: [], events: [], A: A1 });
    data.set(2, { profile: kid(), periods: [], events: [], A: A1 });
    const list = buildReminders(data, DEFAULT_REMINDERS, DEFAULT_PRIVACY, DEFAULT_HEALTH, new Date(2026, 10, 1, 8));
    expect(list.some(r => r.id >= 6000 && r.id < 7000)).toBe(true);
    expect(list.every(r => r.title === 'Meneia')).toBe(true);
  });
});

describe('migración de la base v1 a v2', () => {
  it('pasa los períodos viejos al perfil Yo sin perder nada', async () => {
    const name = 'migra-test';
    const old = new Dexie(name);
    old.version(1).stores({ periods: '++id, &start', events: '++id, &date', settings: 'key' });
    await old.table('periods').add({ start: '2026-10-01', end: '2026-10-05', flow: 'Normal', note: 'x' });
    await old.table('events').add({ date: '2026-08-20', type: 'stop' });
    old.close();
    // Abrir con el esquema nuevo (mismo que src/db.ts)
    const neu = new Dexie(name);
    neu.version(1).stores({ periods: '++id, &start', events: '++id, &date', settings: 'key' });
    neu.version(2).stores({ periods: '++id, profileId, start, [profileId+start]', events: '++id, profileId, date, [profileId+date]', settings: 'key', profiles: '++id, kind' })
      .upgrade(async tx => {
        await tx.table('profiles').put({ id: 1, name: 'Yo', kind: 'self' });
        await tx.table('periods').toCollection().modify((p: any) => { if (p.profileId == null) p.profileId = 1; });
        await tx.table('events').toCollection().modify((e: any) => { if (e.profileId == null) e.profileId = 1; });
      });
    await neu.open();
    expect(await neu.table('periods').where('profileId').equals(1).count()).toBe(1);
    expect(await neu.table('events').where('profileId').equals(1).count()).toBe(1);
    expect(await neu.table('profiles').count()).toBe(1);
    neu.close();
  });
});
