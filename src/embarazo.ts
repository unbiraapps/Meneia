// Embarazo y posparto: cálculos puros y contenido fijo.
// IMPORTANTE: tamaños, textos de cada semana, controles y "Cuándo consultar" son un BORRADOR.
// Tienen que revisarlos una obstetra o partera antes de publicar (ver docs/EMBARAZO-CONTENIDO.md).
import { addDays, daysBetween, type Registro } from './calc';

export const GESTATION_DAYS = 280;

export interface PregnancyInfo {
  fum: string;          // primer día de la última menstruación
  days: number;         // días desde la FUM
  week: number;         // semanas completas
  day: number;          // días de la semana en curso (0 a 6)
  trimester: 1 | 2 | 3;
  fpp: string;          // fecha probable de parto calculada (FUM + 280)
  progress: number;     // 0 a 1
}

export function pregnancyInfo(fum: string, today: string): PregnancyInfo {
  const days = Math.max(0, daysBetween(fum, today));
  const week = Math.floor(days / 7);
  return {
    fum, days, week, day: days % 7,
    trimester: week < 14 ? 1 : week < 28 ? 2 : 3,
    fpp: addDays(fum, GESTATION_DAYS),
    progress: Math.min(1, days / GESTATION_DAYS),
  };
}

/** FUM del embarazo: la guardada o, en registros viejos, el último período antes del registro. */
export const fumOf = (preg: Registro, periodStarts: string[]): string | null =>
  preg.fum ?? periodStarts.filter(s => s <= preg.fecha).sort().pop() ?? null;

// Medidas aproximadas por semana: [cm, gramos]. Hasta la semana 19, de la cabeza a la cadera; desde la 20, de la cabeza a los pies.
const SIZES: Record<number, [number, number]> = {
  8: [1.6, 1], 9: [2.3, 2], 10: [3.1, 4], 11: [4.1, 7], 12: [5.4, 14], 13: [7.4, 23], 14: [8.7, 43], 15: [10.1, 70],
  16: [11.6, 100], 17: [13, 140], 18: [14.2, 190], 19: [15.3, 240], 20: [25.6, 300], 21: [26.7, 360], 22: [27.8, 430],
  23: [28.9, 500], 24: [30, 600], 25: [34.6, 660], 26: [35.6, 760], 27: [36.6, 875], 28: [37.6, 1000], 29: [38.6, 1150],
  30: [39.9, 1300], 31: [41.1, 1500], 32: [42.4, 1700], 33: [43.7, 1900], 34: [45, 2150], 35: [46.2, 2400], 36: [47.4, 2600],
  37: [48.6, 2850], 38: [49.8, 3100], 39: [50.7, 3300], 40: [51.2, 3450],
};
export const sizeFor = (week: number): { cm: number; g: number } | null => {
  if (week < 8) return null;
  const [cm, g] = SIZES[Math.min(40, week)];
  return { cm, g };
};
const num = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 1 });
export const fmtSize = (s: { cm: number; g: number }) => `${num(s.cm)} cm · ${s.g >= 1000 ? num(Math.round(s.g / 100) / 10) + ' kg' : s.g + ' g'}`;

// Una fruta cada 4 semanas; entre una y otra se mantiene la anterior, así nunca "achica".
export type FruitId = 'frambuesa' | 'lima' | 'palta' | 'banana' | 'choclo' | 'berenjena' | 'anco' | 'melon' | 'sandia';
export const FRUITS: { from: number; id: FruitId; name: string }[] = [
  { from: 8, id: 'frambuesa', name: 'una frambuesa' }, { from: 12, id: 'lima', name: 'una lima' }, { from: 16, id: 'palta', name: 'una palta' },
  { from: 20, id: 'banana', name: 'una banana' }, { from: 24, id: 'choclo', name: 'un choclo' }, { from: 28, id: 'berenjena', name: 'una berenjena' },
  { from: 32, id: 'anco', name: 'un zapallo anco' }, { from: 36, id: 'melon', name: 'un melón' }, { from: 40, id: 'sandia', name: 'una sandía chica' },
];
export const fruitFor = (week: number) => [...FRUITS].reverse().find(f => week >= f.from) ?? null;

// "Esta semana": dos o tres líneas, en tono tranquilo y sin consejos médicos.
const WEEK_TEXTS: [number, string][] = [
  [0, 'Al principio es común sentir cansancio, pechos sensibles y algunas náuseas. Cada cuerpo lo vive distinto.'],
  [8, 'Las náuseas y el cansancio suelen estar en su momento más fuerte. A muchas les ayuda comer poco y seguido.'],
  [12, 'Es común que las náuseas empiecen a aflojar y que sientas más cansancio. Algunas notan acidez.'],
  [16, 'Muchas se sienten con más energía. Puede aparecer algo de acidez o congestión nasal.'],
  [20, 'Entre estas semanas muchas empiezan a sentir los primeros movimientos.'],
  [24, 'Pueden aparecer calambres en las piernas, algo de hinchazón en los pies y dolor de espalda.'],
  [28, 'Es común cansarse más y dormir peor. Prestá atención a los movimientos: si notás menos, consultá.'],
  [32, 'Puede costar respirar hondo y aparecer acidez. Algunas sienten contracciones suaves e irregulares.'],
  [36, 'El cuerpo se va preparando. Si las contracciones se vuelven regulares o perdés líquido, consultá.'],
  [40, 'Llegaste a la fecha probable. Seguí los controles que te indique tu médica.'],
];
export const weekText = (week: number) => [...WEEK_TEXTS].reverse().find(([w]) => week >= w)![1];

export const CONSULT_SIGNS = [
  'Sangrado', 'Dolor fuerte en la panza', 'Fiebre', 'Pérdida de líquido', 'Dolor de cabeza fuerte o visión borrosa',
  'Vómitos que no te dejan tomar líquido', 'Menos movimientos (desde la semana 28)',
];

export interface Control { id: string; trimestre: 1 | 2 | 3; texto: string; hecho: boolean; fecha?: string }
export const DEFAULT_CONTROLS: Omit<Control, 'id' | 'hecho'>[] = [
  { trimestre: 1, texto: 'Primera consulta' }, { trimestre: 1, texto: 'Análisis de sangre y orina' }, { trimestre: 1, texto: 'Ecografía de la semana 11 a 14' },
  { trimestre: 2, texto: 'Ecografía de la semana 20 a 24' }, { trimestre: 2, texto: 'Prueba de glucosa (semana 24 a 28)' },
  { trimestre: 3, texto: 'Análisis del tercer trimestre' }, { trimestre: 3, texto: 'Estudio de la semana 35 a 37' }, { trimestre: 3, texto: 'Monitoreo' },
];
export const defaultControls = (): Control[] => DEFAULT_CONTROLS.map((c, i) => ({ ...c, id: 'c' + i, hecho: false }));
export const controlsOf = (preg: Registro): Control[] => preg.controles ?? defaultControls();

export const PREG_BODY = ['Náuseas', 'Acidez', 'Cansancio', 'Hinchazón', 'Calambres', 'Dolor de cabeza', 'Espalda', 'Pechos sensibles'];

/** Síntoma anotado varios días seguidos (hasta hoy o ayer). Devuelve el más largo con 5 o más días. */
export function repeatedSymptom(logs: { date: string; body: string[] }[], today: string, from: string, min = 5): { what: string; days: number; since: string } | null {
  const byDate = new Map(logs.filter(l => l.date >= from).map(l => [l.date, l.body]));
  let best: { what: string; days: number; since: string } | null = null;
  for (const what of PREG_BODY) {
    let d = byDate.get(today)?.includes(what) ? today : addDays(today, -1);
    let n = 0;
    while (byDate.get(d)?.includes(what)) { n++; d = addDays(d, -1); }
    if (n >= min && (!best || n > best.days)) best = { what, days: n, since: addDays(d, 1) };
  }
  return best;
}
export const repeatText = (r: { what: string; days: number }) =>
  r.what === 'Náuseas'
    ? `Anotaste náuseas ${r.days} días seguidos. Si te cuesta comer o tomar líquido, comentalo en tu próximo control.`
    : `Anotaste ${r.what.toLowerCase()} ${r.days} días seguidos. Si te molesta o te preocupa, comentalo en tu próximo control.`;

/** Etapa después de cerrar un embarazo, hasta que anote el primer período. */
export type AfterStage = 'posparto' | 'pausa' | null;
export function afterStage(rs: Registro[], periodStarts: string[]): { stage: AfterStage; preg: Registro | null } {
  const closed = rs.filter(r => r.tipo === 'embarazo' && r.fin).sort((a, b) => (a.fin! < b.fin! ? 1 : -1))[0];
  if (!closed || periodStarts.some(s => s > closed.fin!)) return { stage: null, preg: null };
  return { stage: closed.cierre === 'nacimiento' ? 'posparto' : 'pausa', preg: closed };
}

export const POST_CHECKS = [
  { id: 'control', text: 'Control posparto (cerca del día 40)' },
  { id: 'animo', text: 'Anotar cómo estás de ánimo' },
];
