import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { analyze, dayKinds, upcomingReminders, addDays, daysBetween, pillActiveOn, DEFAULT_REMINDERS, type Period, type PillEvent } from '../src/calc';
import { parseBackup } from '../src/db';

const P = (start: string, end = '', flow: Period['flow'] = 'Normal'): Period => ({ start, end, flow, note: '' });

describe('fechas', () => {
  it('suma días cruzando meses y años', () => {
    expect(addDays('2026-10-29', 28)).toBe('2026-11-26');
    expect(addDays('2026-12-20', 14)).toBe('2027-01-03');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29'); // bisiesto
  });
  it('cuenta días entre fechas', () => {
    expect(daysBetween('2026-10-01', '2026-10-29')).toBe(28);
    expect(daysBetween('2026-11-02', '2026-10-29')).toBe(-4);
  });
});

describe('analyze', () => {
  const periods = [P('2026-06-03', '2026-06-07'), P('2026-07-01', '2026-07-05'), P('2026-07-30', '2026-08-03'),
    P('2026-08-27', '2026-08-31'), P('2026-10-01', '2026-10-07'), P('2026-10-29', '2026-11-02')];

  it('calcula ciclos, promedio y próximo período', () => {
    const A = analyze(periods, [], '2026-11-02');
    expect(A.cycles).toEqual([28, 29, 28, 35, 28]);
    expect(A.avgCycle).toBe(30); // 148/5 = 29.6
    expect(A.next).toBe('2026-11-28');
    expect(A.ovu).toBe('2026-11-14');
    expect(A.fertile).toEqual(['2026-11-09', '2026-11-15']);
    expect(A.late).toBe(0);
    expect(A.minC).toBe(28);
    expect(A.maxC).toBe(35);
  });

  it('marca el ciclo que se alargó y el que se acortó', () => {
    const A = analyze(periods, [], '2026-11-02');
    const aug = A.rows.find(r => r.start === '2026-08-27')!;
    expect(aug.flags.map(f => f.text)).toContain('Ciclo 7 días más largo');
    const oct = A.rows.find(r => r.start === '2026-10-01')!;
    expect(oct.flags.map(f => f.text)).toContain('Ciclo 3 días más corto');
    expect(oct.flags.map(f => f.text)).toContain('Sangrado 2 días más largo');
  });

  it('no marca cambios en ciclos regulares', () => {
    const A = analyze([P('2026-01-01', '2026-01-05'), P('2026-01-29', '2026-02-02'), P('2026-02-26', '2026-03-02'), P('2026-03-26', '2026-03-30')], [], '2026-04-01');
    expect(A.rows.every(r => r.flags.length === 0)).toBe(true);
  });

  it('marca ciclos fuera de 21–35 días y sangrados de más de 7', () => {
    const A = analyze([P('2026-01-01', '2026-01-09'), P('2026-02-15', '2026-02-19')], [], '2026-02-20');
    expect(A.rows[0].flags.map(f => f.text)).toEqual(expect.arrayContaining(['Fuera del rango típico (21–35 días)', 'Sangrado de más de 7 días']));
  });

  it('calcula el atraso', () => {
    const A = analyze([P('2026-09-01', '2026-09-05'), P('2026-09-29', '2026-10-03')], [], '2026-11-02');
    expect(A.next).toBe('2026-10-27');
    expect(A.late).toBe(6);
  });

  it('con un solo período usa 28 días', () => {
    const A = analyze([P('2026-10-29')], [], '2026-11-02');
    expect(A.next).toBe('2026-11-26');
    expect(A.avgDur).toBe(5);
  });

  it('sin datos no estima nada', () => {
    const A = analyze([], [], '2026-11-02');
    expect(A.next).toBeNull();
    expect(A.last).toBeNull();
  });

  it('con pastillas no estima ovulación', () => {
    const ev: PillEvent[] = [{ date: '2026-08-20', type: 'stop' }, { date: '2026-10-30', type: 'start' }];
    const A = analyze(periods, ev, '2026-11-02');
    expect(A.onPill).toBe(true);
    expect(A.ovu).toBeNull();
    expect(A.fertile).toBeNull();
    expect(A.next).toBe('2026-11-28');
  });

  it('dejar las pastillas vuelve a estimar ovulación', () => {
    const A = analyze(periods, [{ date: '2026-08-20', type: 'stop' }], '2026-11-02');
    expect(A.onPill).toBe(false);
    expect(A.ovu).toBe('2026-11-14');
    expect(A.lastPill?.type).toBe('stop');
  });
});

describe('búsqueda de embarazo', () => {
  it('cuenta ciclos y desde cuándo viene seguida', () => {
    const ps = [P('2026-07-01'), { ...P('2026-07-29'), trying: true }, P('2026-08-26'), { ...P('2026-09-23'), trying: true }, { ...P('2026-10-21'), trying: true }];
    const A = analyze(ps, [], '2026-11-03');
    expect(A.tryingCycles).toBe(3);
    expect(A.tryingSince).toBe('2026-09-23');
    const k = dayKinds(A, []);
    expect(k.get('2026-11-04')?.has('try')).toBe(true);  // ventana del ciclo actual (ovulación 4/11)
    expect(k.get('2026-07-11')?.has('try')).toBeFalsy(); // ciclo de julio no estaba marcado
  });
  it('sin ciclo actual marcado no hay búsqueda en curso', () => {
    const A = analyze([{ ...P('2026-09-01'), trying: true }, P('2026-09-29')], [], '2026-10-05');
    expect(A.tryingCycles).toBe(1);
    expect(A.tryingSince).toBeNull();
  });
  it('la copia guarda la marca', () => {
    const r = parseBackup(JSON.stringify({ periods: [{ start: '2026-10-21', trying: true }, { start: '2026-09-23', trying: 'si' }] }));
    expect(r.ok && r.data.periods.map(p => !!p.trying)).toEqual([true, false]);
  });
});

describe('pillActiveOn', () => {
  const ev: PillEvent[] = [{ date: '2026-03-01', type: 'start' }, { date: '2026-08-20', type: 'stop' }];
  it('sabe si tomaba pastillas en una fecha', () => {
    expect(pillActiveOn(ev, '2026-02-01')).toBe(false);
    expect(pillActiveOn(ev, '2026-05-01')).toBe(true);
    expect(pillActiveOn(ev, '2026-09-01')).toBe(false);
  });
});

describe('calendario', () => {
  it('pinta período, probable, fértil, ovulación y pastillas', () => {
    const periods = [P('2026-09-01', '2026-09-05'), P('2026-09-29', '2026-10-03')];
    const ev: PillEvent[] = [{ date: '2026-08-20', type: 'stop' }];
    const A = analyze(periods, ev, '2026-10-05');
    const k = dayKinds(A, ev);
    expect(k.get('2026-09-03')?.has('period')).toBe(true);
    expect(k.get('2026-10-27')?.has('pred')).toBe(true);
    expect(k.get('2026-10-13')?.has('ovu')).toBe(true);
    expect(k.get('2026-10-10')?.has('fertile')).toBe(true);
    expect(k.get('2026-08-20')?.has('pill')).toBe(true);
    expect(k.get('2026-09-15')?.has('ovu')).toBe(true); // ovulación del ciclo pasado
  });
});

describe('recordatorios', () => {
  const periods = [P('2026-09-01', '2026-09-05'), P('2026-09-29', '2026-10-03'), P('2026-10-27', '2026-10-31')];

  it('programa período, ventana fértil y atraso', () => {
    const A = analyze(periods, [], '2026-11-02');
    const list = upcomingReminders(A, DEFAULT_REMINDERS, new Date(2026, 10, 2, 21, 0));
    expect(A.next).toBe('2026-11-24');
    const first = list.find(r => r.id === 1000)!;
    expect(first.date).toBe('2026-11-22');
    expect(first.title).toBe('Tu período podría llegar en 2 días');
    expect(list.find(r => r.id === 3000)!.date).toBe('2026-11-05'); // ovulación 10/11, ventana desde el 5
    expect(list.find(r => r.id === 5002)!.date).toBe('2026-11-26');
    expect(list.some(r => r.id >= 4000 && r.id < 5000)).toBe(false); // ovulación apagada por defecto
    expect(list.every(r => r.date > '2026-11-02')).toBe(true);
    expect(new Set(list.map(r => r.id)).size).toBe(list.length);
  });

  it('respeta la hora: hoy solo si todavía no pasó', () => {
    const A = analyze([P('2026-10-07')], [], '2026-11-02');
    // próximo 4/11, aviso 2 días antes = hoy 2/11
    const morning = upcomingReminders(A, DEFAULT_REMINDERS, new Date(2026, 10, 2, 8, 0));
    const night = upcomingReminders(A, DEFAULT_REMINDERS, new Date(2026, 10, 2, 22, 0));
    expect(morning.some(r => r.id === 1000)).toBe(true);
    expect(night.some(r => r.id === 1000)).toBe(false);
  });

  it('con pastillas no avisa ventana fértil', () => {
    const A = analyze(periods, [{ date: '2026-10-30', type: 'start' }], '2026-11-02');
    const list = upcomingReminders(A, { ...DEFAULT_REMINDERS, ovuOn: true }, new Date(2026, 10, 2, 8));
    expect(list.some(r => r.id >= 3000 && r.id < 5000)).toBe(false);
  });

  it('si está todo apagado no programa nada', () => {
    const A = analyze(periods, [], '2026-11-02');
    expect(upcomingReminders(A, { ...DEFAULT_REMINDERS, periodOn: false, fertileOn: false, ovuOn: false, lateOn: false }, new Date(2026, 10, 2))).toEqual([]);
  });
});

describe('copia de seguridad', () => {
  it('acepta una copia válida y limpia datos raros', () => {
    const r = parseBackup(JSON.stringify({ periods: [{ start: '2026-10-29', end: '2026-10-01', flow: 'Mucho', note: 'hola' }], events: [{ date: '2026-08-20', type: 'stop' }, { date: 'x', type: 'stop' }] }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.periods[0]).toEqual({ start: '2026-10-29', end: '', flow: 'Normal', note: 'hola' });
      expect(r.data.events).toEqual([{ date: '2026-08-20', type: 'stop' }]);
    }
  });
  it('rechaza texto que no es copia', () => {
    expect(parseBackup('hola').ok).toBe(false);
    expect(parseBackup('{"a":1}').ok).toBe(false);
    expect(parseBackup('{"periods":[{"start":"29/10/2026"}]}').ok).toBe(false);
  });
});
