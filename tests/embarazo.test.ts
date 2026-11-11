import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  analyze, dayKinds, upcomingReminders, isPending, canSayNotYet, cycleRegistros, lastCheck, activePregnancy, showsPregnancy,
  DEFAULT_REMINDERS, addDays, type Period, type Registro, type Profile,
} from '../src/calc';
import { db, addRegistro, updateRegistro, deleteRegistro, exportBackup, restoreBackup, parseBackup, savePeriod, saveProfile, deleteProfile, ensureSelf } from '../src/db';

const P = (start: string): Period => ({ start, end: addDays(start, 4), flow: 'Normal', note: '' });
// Ciclos de 28 días: el próximo período más probable es el 26 nov
const PS = ['2026-07-09', '2026-08-06', '2026-09-03', '2026-10-01', '2026-10-29'].map(P);
const me: Profile = { id: 1, name: 'Yo', kind: 'self', color: '#c9b1e7', birthDate: '1990-04-12', trying: true, notYet: false, alertDays: 0 };

describe('período pendiente', () => {
  it('"Todavía no me vino" aparece desde el día más probable', () => {
    expect(canSayNotYet(analyze(PS, [], '2026-11-25'), '2026-11-25')).toBe(false);
    expect(canSayNotYet(analyze(PS, [], '2026-11-26'), '2026-11-26')).toBe(true);
  });
  it('es pendiente solo cuando pasaron los posibles días', () => {
    const A = analyze(PS, [], '2026-11-27');
    expect(isPending(A)).toBe(false);
    const B = analyze(PS, [], addDays(A.rangeEnd!, 4));
    expect(isPending(B)).toBe(true);
    expect(B.late).toBe(4);
  });
  it('los registros del ciclo son los posteriores al último período', () => {
    const A = analyze(PS, [], '2026-12-05');
    const rs: Registro[] = [
      { id: 1, tipo: 'test', fecha: '2026-10-20', resultado: 'negativo' },
      { id: 2, tipo: 'todavia-no', fecha: '2026-12-01' },
      { id: 3, tipo: 'test', fecha: '2026-12-03', resultado: 'inconcluso' },
    ];
    expect(cycleRegistros(rs, A).map(r => r.id)).toEqual([3, 2]);
    expect(lastCheck(rs, A)).toBe('2026-12-01');
  });
  it('el aviso de pendiente es neutro y no suena el día de "todavía no" ni el siguiente', () => {
    const A = analyze(PS, [], '2026-11-20');
    const late = upcomingReminders(A, DEFAULT_REMINDERS, new Date(2026, 10, 20, 7)).filter(r => r.id >= 5000 && r.id < 6000);
    expect(late.length).toBe(3);
    late.forEach(r => { expect(r.title).not.toMatch(/período|atraso|embarazo/i); expect(r.body).not.toMatch(/período|atraso|embarazo/i); });
    const snoozed = upcomingReminders(A, DEFAULT_REMINDERS, new Date(2026, 10, 20, 7), 120, addDays(late[0].date, -1)).filter(r => r.id >= 5000 && r.id < 6000);
    expect(snoozed.map(r => r.date)).toEqual(late.slice(1).map(r => r.date));
  });
  it('un test o un atraso no cambian nada solo: sin embarazo registrado sigue estimando', () => {
    const A = analyze(PS, [], '2026-12-20');
    expect(A.next).toBe('2026-11-26');
    expect(A.pregnantSince).toBeNull();
  });
});

describe('embarazo registrado', () => {
  const preg = [{ start: '2026-12-08', end: null }];
  it('pausa fechas estimadas, ventana fértil, atraso y avisos del ciclo', () => {
    const A = analyze(PS, [], '2026-12-20', { pregnancies: preg });
    expect(A.pregnantSince).toBe('2026-12-08');
    expect([A.next, A.rangeStart, A.rangeEnd, A.ovu, A.fertile]).toEqual([null, null, null, null, null]);
    expect(A.late).toBe(0);
    expect(isPending(A)).toBe(false);
    expect(canSayNotYet(A, '2026-12-20')).toBe(false);
    expect(upcomingReminders(A, DEFAULT_REMINDERS, new Date(2026, 11, 20))).toEqual([]);
    const k = dayKinds(A, []);
    expect([...k.values()].some(s => s.has('pred') || s.has('maybe'))).toBe(false);
  });
  it('el ciclo del embarazo no cuenta y no marca ovulación', () => {
    const later = [...PS, P('2027-08-20')];
    const A = analyze(later, [], '2027-08-25', { pregnancies: [{ start: '2026-12-08', end: '2027-08-01' }] });
    const row = A.rows.find(r => r.start === '2026-10-29')!;
    expect(row.preg).toBe(true);
    expect(row.counts).toBe(false);
    expect(A.avgCycle).toBe(28);
    expect(A.lastAccuracy).toBeNull();
    expect(dayKinds(A, []).get(addDays('2026-10-29', row.cycle! - 14))?.has('ovu') ?? false).toBe(false);
  });
  it('al volver al ciclo espera el primer período y después usa 3 ciclos de adaptación', () => {
    const closed = [{ start: '2026-12-08', end: '2027-08-01' }];
    const A = analyze(PS, [], '2027-08-10', { pregnancies: closed });
    expect(A.awaitingPeriod).toBe(true);
    expect(A.next).toBeNull();
    const B = analyze([...PS, P('2027-08-20')], [], '2027-08-25', { pregnancies: closed });
    expect(B.awaitingPeriod).toBe(false);
    expect(B.adapting).toBe(true);
    expect(B.next).not.toBeNull();
  });
  it('el embarazo activo es el que no tiene fin', () => {
    const rs: Registro[] = [{ id: 1, tipo: 'embarazo', fecha: '2025-01-01', fin: '2025-09-01' }, { id: 2, tipo: 'embarazo', fecha: '2026-12-08', fin: null }];
    expect(activePregnancy(rs)?.id).toBe(2);
    expect(activePregnancy([rs[0]])).toBeNull();
  });
  it('tests y embarazo: solo el perfil propio, 18+ y con "Buscar embarazo" (o un embarazo ya registrado)', () => {
    const today = '2026-12-01';
    expect(showsPregnancy(me, today, [])).toBe(true);
    expect(showsPregnancy({ ...me, trying: false }, today, [])).toBe(false);
    expect(showsPregnancy({ ...me, trying: false }, today, [{ tipo: 'embarazo', fecha: '2026-11-30', fin: null }])).toBe(true);
    expect(showsPregnancy({ ...me, birthDate: '2010-01-01' }, today, [])).toBe(false);
    expect(showsPregnancy({ ...me, id: 2, kind: 'child' }, today, [])).toBe(false);
  });
});

describe('registros guardados y copia', () => {
  beforeEach(async () => { await db.delete(); await db.open(); await ensureSelf(); });
  it('se guardan, se corrigen y se borran', async () => {
    const id = await addRegistro({ tipo: 'test', fecha: '2026-12-03', resultado: 'inconcluso', nota: '  ' + 'x'.repeat(200) });
    expect((await db.registros.get(id))!.nota!.length).toBe(80);
    await updateRegistro(id, { resultado: 'positivo' });
    expect((await db.registros.get(id))!.resultado).toBe('positivo');
    await deleteRegistro(id);
    expect(await db.registros.count()).toBe(0);
  });
  it('la copia versión 3 lleva los registros y se restauran', async () => {
    await savePeriod({ start: '2026-10-29', end: '2026-11-02', flow: 'Normal', note: '' });
    await addRegistro({ tipo: 'todavia-no', fecha: '2026-12-01' });
    await addRegistro({ tipo: 'test', fecha: '2026-12-03', resultado: 'positivo', nota: 'farmacia' });
    await addRegistro({ tipo: 'embarazo', fecha: '2026-12-08', fin: null, pausoPastillas: true, buscabaAntes: true });
    const b = await exportBackup();
    expect(b.version).toBe(3);
    expect(b.registros!.length).toBe(3);
    const parsed = parseBackup(JSON.stringify(b));
    expect(parsed.ok).toBe(true);
    await db.registros.clear();
    if (parsed.ok) await restoreBackup(parsed.data);
    const rs = await db.registros.toArray();
    expect(rs.map(r => r.tipo).sort()).toEqual(['embarazo', 'test', 'todavia-no']);
    expect(rs.find(r => r.tipo === 'embarazo')!.fin).toBeNull();
  });
  it('una copia vieja (versión 2) se restaura sin registros', async () => {
    await addRegistro({ tipo: 'todavia-no', fecha: '2026-12-01' });
    const parsed = parseBackup(JSON.stringify({ app: 'mi-ciclo-lila', version: 2, periods: [{ start: '2026-10-29', end: '', flow: 'Normal', note: '' }], events: [] }));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) await restoreBackup(parsed.data);
    expect(await db.registros.count()).toBe(0);
    expect(await db.periods.count()).toBe(1);
  });
  it('descarta registros inválidos y embarazos en perfiles de hijas', () => {
    const r = parseBackup(JSON.stringify({
      app: 'mi-ciclo-lila', version: 3, periods: [], events: [],
      profiles: [{ id: 1, name: 'Yo', kind: 'self' }, { id: 2, name: 'Sofi', kind: 'child' }],
      registros: [
        { profileId: 1, tipo: 'test', fecha: '2026-12-03', resultado: 'quizás' },
        { profileId: 1, tipo: 'raro', fecha: '2026-12-03' },
        { profileId: 2, tipo: 'embarazo', fecha: '2026-12-03' },
        { profileId: 2, tipo: 'todavia-no', fecha: '2026-12-03' },
        { profileId: 1, tipo: 'embarazo', fecha: '2026-12-08', fin: '2026-01-01' },
      ],
    }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.registros).toEqual([
      { profileId: 2, tipo: 'todavia-no', fecha: '2026-12-03' },
      { profileId: 1, tipo: 'embarazo', fecha: '2026-12-08', fin: null, pausoPastillas: false, buscabaAntes: false },
    ]);
  });
  it('borrar un perfil de hija borra sus registros', async () => {
    const id = await saveProfile({ name: 'Sofi', kind: 'child', color: '#9FD8C8', birthDate: '2012-01-01', trying: false, notYet: false, alertDays: 0 });
    await addRegistro({ profileId: id, tipo: 'todavia-no', fecha: '2026-12-01' });
    await deleteProfile(id);
    expect(await db.registros.count()).toBe(0);
  });
});
