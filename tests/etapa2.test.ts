import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { analyze, dayKinds, upcomingReminders, pillDay, pillReminders, patterns, cycleSymptoms, optsFor, DEFAULT_REMINDERS, DEFAULT_PILLS, type Period, type SymptomLog, type Profile } from '../src/calc';

const P = (start: string, end = '', extra: Partial<Period> = {}): Period => ({ start, end, flow: 'Normal', note: '', ...extra });

describe('predicciones a medida', () => {
  it('ciclos parejos: rango chico y estimación firme', () => {
    const ps = ['2026-01-01', '2026-01-29', '2026-02-26', '2026-03-27', '2026-04-24', '2026-05-22', '2026-06-19'].map(d => P(d));
    const A = analyze(ps, [], '2026-06-25');
    expect(A.avgCycle).toBe(28);
    expect(A.margin).toBe(2);
    expect(A.confidence).toBe('firme');
  });
  it('ciclos irregulares: posibles días amplios', () => {
    const ps = ['2026-01-01', '2026-01-27', '2026-03-01', '2026-03-30', '2026-05-04'].map(d => P(d));
    const A = analyze(ps, [], '2026-05-10');
    expect(A.valid).toEqual([26, 33, 29, 35]);
    expect(A.irregular).toBe(true);
    expect(A.avgCycle).toBe(31);
    expect(A.margin).toBe(5);
    const r = upcomingReminders(A, DEFAULT_REMINDERS, new Date(2026, 4, 10, 8));
    expect(r.find(x => x.id === 1000)).toMatchObject({ date: A.rangeStart, title: 'Empiezan tus posibles días' });
  });
  it('el margen se puede ajustar a mano entre 2 y 7', () => {
    const ps = ['2026-01-01', '2026-01-27', '2026-03-01', '2026-03-30', '2026-05-04'].map(d => P(d));
    expect(analyze(ps, [], '2026-05-10', { margin: 3 }).margin).toBe(3);
    expect(analyze(ps, [], '2026-05-10', { margin: 12 }).margin).toBe(7);
    expect(analyze(ps, [], '2026-05-10', { margin: 3 }).autoMargin).toBe(5);
  });
  it('un ciclo marcado como raro no cuenta ni alerta', () => {
    const ps = [P('2026-01-01'), P('2026-01-29'), P('2026-02-26', '', { atypical: true }), P('2026-04-10'), P('2026-05-08')];
    const A = analyze(ps, [], '2026-05-10');
    expect(A.valid).toEqual([28, 28, 28]);
    expect(A.rows[2].flags).toEqual([]);
  });
  it('cuánto acertó la estimación del último período', () => {
    const ps = [P('2026-01-01'), P('2026-01-29'), P('2026-02-26'), P('2026-03-27')];
    const A = analyze(ps, [], '2026-03-28');
    expect(A.lastAccuracy).toEqual({ predicted: '2026-03-26', diff: 1, inRange: true });
  });
  it('menores: sin alertas alarmantes ni irregularidad', () => {
    const ps = ['2026-01-01', '2026-02-20', '2026-03-10', '2026-04-30'].map(d => P(d));
    const A = analyze(ps, [], '2026-05-01', { minor: true });
    expect(A.rows.every(r => r.flags.length === 0)).toBe(true);
    expect(A.irregular).toBe(false);
    const kid: Profile = { id: 2, name: 'S', kind: 'child', color: '#fff', birthDate: '', trying: false, notYet: false, alertDays: 2 };
    expect(optsFor(kid, '2026-05-01').minor).toBe(true);
  });
  it('el calendario marca los posibles días', () => {
    const A = analyze([P('2026-09-01'), P('2026-09-29')], [], '2026-10-05');
    const k = dayKinds(A, []);
    expect(k.get(A.rangeStart!)?.has('maybe')).toBe(true);
    expect(k.get(A.next!)?.has('pred')).toBe(true);
  });
});

describe('pastillas', () => {
  const ps = { ...DEFAULT_PILLS, packStart: '2026-10-20', stock: 1, stockDate: '2026-10-20' };
  it('día del blíster y descanso', () => {
    expect(pillDay(ps, '2026-11-03')).toMatchObject({ day: 15, isRest: false, packEnd: '2026-11-16', stockNow: 1, buyBy: null });
    expect(pillDay(ps, '2026-11-12')!.isRest).toBe(true);
    expect(pillDay(ps, '2026-11-17')).toMatchObject({ day: 1, packStart: '2026-11-17', stockNow: 0, buyBy: '2026-12-15' });
  });
  it('recordatorio diario solo en días con pastilla, y aviso para comprar', () => {
    const r = pillReminders({ ...ps, stock: 0 }, new Date(2026, 10, 3, 10));
    const daily = r.filter(x => x.id < 8100).map(x => x.date);
    expect(daily[0]).toBe('2026-11-03');
    expect(daily).not.toContain('2026-11-12'); // descanso
    expect(r.find(x => x.id === 8100)!.date).toBe('2026-11-12'); // 5 días antes de que haga falta el próximo
  });
  it('si ya la tomó hoy, no avisa hoy', () => {
    const r = pillReminders({ ...ps, taken: ['2026-11-03'] }, new Date(2026, 10, 3, 10));
    expect(r.some(x => x.date === '2026-11-03')).toBe(false);
  });
});

describe('síntomas', () => {
  const rows = analyze(['2026-07-01', '2026-07-29', '2026-08-26', '2026-09-23', '2026-10-21'].map(d => P(d)), [], '2026-10-25').rows;
  const L = (date: string, body: string[] = [], pain = 0, mood: string[] = []): SymptomLog => ({ date, pain, body, mood, note: '' });
  it('encuentra lo que se repite en 3 de los últimos 4 ciclos', () => {
    const logs = [L('2026-07-29', ['Cólicos']), L('2026-08-27', ['Cólicos'], 2), L('2026-09-23', ['Cólicos'], 3), L('2026-08-05', ['Acné'])];
    const p = patterns(logs, rows);
    expect(p.find(x => x.what === 'Cólicos')).toMatchObject({ when: 'los días 1 y 2', hits: 3, of: 4 });
    expect(p.some(x => x.what === 'Acné')).toBe(false);
  });
  it('con menos de 3 ciclos no saca conclusiones', () => {
    expect(patterns([L('2026-07-01', ['Cólicos'])], rows.slice(-2))).toEqual([]);
  });
  it('resume los síntomas de un ciclo', () => {
    const logs = [L('2026-09-23', ['Cólicos'], 2), L('2026-09-24', ['Cólicos', 'Cansancio'], 0, ['Sensible'])];
    expect(cycleSymptoms(logs, '2026-09-23', '2026-10-21')).toEqual(['Cólicos', 'Dolor medio', 'Cansancio', 'Sensible']);
  });
});
