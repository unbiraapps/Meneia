import { describe, it, expect } from 'vitest';
import { analyze, addDays, symptomGrid, symptomDetail, daysList, type Period, type SymptomLog, type Registro } from '../src/calc';
import { pregnancyInfo, sizeFor, fmtSize, fruitFor, weekText, repeatedSymptom, afterStage, fumOf, FRUITS } from '../src/embarazo';

describe('embarazo', () => {
  it('semana, trimestre y fecha probable desde la FUM', () => {
    const i = pregnancyInfo('2026-09-02', '2026-11-25');
    expect([i.week, i.day, i.trimester, i.fpp]).toEqual([12, 0, 1, '2027-06-09']);
    expect(pregnancyInfo('2026-09-02', addDays('2026-09-02', 14 * 7)).trimester).toBe(2);
    expect(pregnancyInfo('2026-09-02', addDays('2026-09-02', 28 * 7)).trimester).toBe(3);
  });
  it('tamaño con medida real y fruta que nunca achica', () => {
    expect(sizeFor(7)).toBeNull();
    expect(fmtSize(sizeFor(12)!)).toBe('5,4 cm · 14 g');
    expect(fmtSize(sizeFor(36)!)).toBe('47,4 cm · 2,6 kg');
    expect(fruitFor(13)!.id).toBe('lima');
    expect(fruitFor(42)!.id).toBe('sandia');
    let prev = 0;
    for (let w = 8; w <= 40; w++) { const g = sizeFor(w)!.g; expect(g).toBeGreaterThanOrEqual(prev); prev = g; }
    expect(FRUITS.map(f => f.from)).toEqual([8, 12, 16, 20, 24, 28, 32, 36, 40]);
    expect(weekText(12)).toMatch(/náuseas/);
  });
  it('aviso suave: un síntoma 5 días seguidos', () => {
    const logs = [0, 1, 2, 3, 4].map(i => ({ date: addDays('2026-11-25', -i), body: ['Náuseas'] }));
    expect(repeatedSymptom(logs, '2026-11-25', '2026-10-01')).toMatchObject({ what: 'Náuseas', days: 5, since: '2026-11-21' });
    expect(repeatedSymptom(logs.slice(0, 4), '2026-11-25', '2026-10-01')).toBeNull();
  });
  it('después de cerrar: posparto o pausa hasta el primer período', () => {
    const nac: Registro = { tipo: 'embarazo', fecha: '2026-01-10', fin: '2026-09-20', cierre: 'nacimiento' };
    expect(afterStage([nac], ['2025-12-20']).stage).toBe('posparto');
    expect(afterStage([{ ...nac, cierre: 'terminado' }], ['2025-12-20']).stage).toBe('pausa');
    expect(afterStage([nac], ['2025-12-20', '2026-11-01']).stage).toBeNull();
    expect(afterStage([{ ...nac, fin: null }], []).stage).toBeNull();
  });
  it('FUM guardada o, en registros viejos, el último período antes', () => {
    expect(fumOf({ tipo: 'embarazo', fecha: '2026-11-01', fum: '2026-09-02' }, [])).toBe('2026-09-02');
    expect(fumOf({ tipo: 'embarazo', fecha: '2026-11-01' }, ['2026-08-01', '2026-09-02', '2026-12-01'])).toBe('2026-09-02');
  });
});

describe('síntomas por ciclo', () => {
  const P = (start: string): Period => ({ start, end: addDays(start, 4), flow: 'Normal', note: '' });
  const starts = ['2026-06-08', '2026-07-06', '2026-08-03', '2026-08-31', '2026-09-28', '2026-10-26'];
  const A = analyze(starts.map(P), [], '2026-11-10');
  const L = (date: string, body: string[], mood: string[] = []): SymptomLog => ({ date, pain: 0, body, mood, note: '' });
  const logs = [
    L('2026-06-08', ['Cólicos']), L('2026-07-06', ['Cólicos']), L('2026-07-07', ['Cólicos']), L('2026-08-31', ['Cólicos'], ['Irritable']),
    L('2026-09-28', ['Cólicos', 'Dolor de cabeza']), L('2026-10-26', ['Cólicos']), L('2026-08-10', ['Hinchazón']),
  ];
  it('arma la grilla de los últimos 6 ciclos y encuentra lo que se repite', () => {
    const g = symptomGrid(logs, A, '2026-11-10');
    expect(g.cols.map(c => c.label)).toEqual(['8/6', '6/7', '3/8', '31/8', '28/9', '26/10']);
    expect(g.cols.length).toBe(6);
    expect(g.rows.find(r => r.what === 'Cólicos')!.hits).toEqual([true, true, false, true, true, true]);
    expect(g.rows.find(r => r.what === 'Irritable')!.mood).toBe(true);
    expect(g.repeated[0]).toMatchObject({ what: 'Cólicos', hits: 5, of: 6, when: 'primeros días' });
    expect(g.repeated.some(r => r.what === 'Hinchazón')).toBe(false);
  });
  it('detalle de un síntoma por día del ciclo', () => {
    const g = symptomGrid(logs, A, '2026-11-10');
    const d = symptomDetail(logs, g, 'Cólicos');
    expect(d.byDay[0]).toBe(5);
    expect(d.byDay[1]).toBe(1);
    expect(d.hits).toBe(5);
    expect(daysList([1, 2, 3])).toBe('días 1, 2 y 3');
    expect(daysList([1])).toBe('día 1');
    expect(daysList([])).toBe('no anotado');
  });
});
