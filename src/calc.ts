// Cálculos del ciclo. Funciones puras: no tocan la pantalla ni la base de datos.
// Fechas como texto 'YYYY-MM-DD' (día local), comparables con < y >.

export type Flow = 'Leve' | 'Normal' | 'Abundante';
export type PillType = 'stop' | 'start';

export interface Period { id?: number; profileId?: number; start: string; end: string; flow: Flow; note: string; trying?: boolean; atypical?: boolean }
export interface PillEvent { id?: number; profileId?: number; date: string; type: PillType }

export type ProfileKind = 'self' | 'child';
export interface Profile {
  id?: number;
  name: string;
  kind: ProfileKind;
  color: string;
  birthDate: string;   // 'YYYY-MM-DD' o '' si no se cargó
  trying: boolean;     // modo buscar embarazo (solo 'self' y 18+)
  notYet: boolean;     // hija a la que todavía no le vino
  alertDays: number;   // hijas: días antes del período para avisar (0 = apagado)
  margin?: number | null; // margen de los posibles días elegido a mano (2 a 7); null = automático
}

export interface PrivacySettings {
  lock: boolean;          // pedir huella o PIN al abrir y al volver
  pinHash: string;        // SHA-256 del PIN ('' si no hay)
  secureScreen: boolean;  // no aparece en recientes ni en capturas (Android)
  discreet: boolean;      // avisos con texto neutro
  hideOnLock: boolean;    // avisos ocultos en la pantalla de bloqueo
  quietFrom: number;      // horario sin avisos (hora 0-23); igual a quietTo = apagado
  quietTo: number;
  dotColor: string;       // color del punto de los avisos
}

export const DEFAULT_PRIVACY: PrivacySettings = {
  lock: false, pinHash: '', secureScreen: true, discreet: true, hideOnLock: true, quietFrom: 22, quietTo: 8, dotColor: '#A77CE5',
};

export const DEFAULT_SHOPPING = ['Toallitas', 'Protectores diarios', 'Algo rico', 'Algo para el dolor'];

export interface Flag { level: 'warn' | 'alert'; text: string }
export interface Row extends Period {
  dur: number | null;
  cycle: number | null;
  flags: Flag[];
  adapt: boolean;       // ciclo de adaptación (los 3 primeros después de dejar las pastillas)
  counts: boolean;      // cuenta para las estimaciones (no es raro ni de adaptación)
}

export type Confidence = 'pocos' | 'media' | 'firme';

export interface Accuracy { predicted: string; diff: number; inRange: boolean }

export interface Analysis {
  rows: Row[];            // ordenadas de la más vieja a la más nueva
  cycles: number[];       // todos los ciclos completos
  valid: number[];        // ciclos que cuentan para estimar (últimos 6)
  avgCycle: number;       // mediana de los ciclos que cuentan (28 si no hay)
  avgDur: number;
  minC: number | null;
  maxC: number | null;
  last: Row | null;
  next: string | null;    // fecha más probable del próximo período
  rangeStart: string | null; // posibles días: desde
  rangeEnd: string | null;   // posibles días: hasta
  margin: number;         // ± días del rango
  autoMargin: number;     // margen que calcula la app (sin ajuste manual)
  confidence: Confidence;
  irregular: boolean;     // variación mayor a la normal (FIGO)
  adapting: boolean;      // el ciclo actual es de adaptación
  ovu: string | null;     // ovulación estimada
  fertile: [string, string] | null;
  late: number;           // días de atraso desde el final del rango (0 si no hay)
  onPill: boolean;        // toma pastillas actualmente
  tryingCycles: number;   // ciclos marcados buscando embarazo
  tryingSince: string | null; // primer día del primer ciclo de la búsqueda actual (seguida)
  lastPill: PillEvent | null;
  lastAccuracy: Accuracy | null; // qué tan cerca estuvo la estimación del último período
}

export interface AnalyzeOptions {
  minor?: boolean;        // menor de 18 o perfil de hija: sin alertas alarmantes
  margin?: number | null; // margen elegido a mano (2 a 7)
}

export const DEFAULT_CYCLE = 28;
export const DEFAULT_DUR = 5;
export const LUTEAL = 14;
// Referencias FIGO 2018 para adultas
export const FIGO = { minCycle: 24, maxCycle: 38, maxVariation: 9, maxBleed: 8 };
export const ADAPT_CYCLES = 3;
const MS = 864e5;

export const pad = (n: number) => String(n).padStart(2, '0');
export const toDate = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (s: string, n: number) => iso(new Date(toDate(s).getTime() + n * MS));
export const daysBetween = (a: string, b: string) => Math.round((toDate(b).getTime() - toDate(a).getTime()) / MS);
export const localToday = (now = new Date()) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
export const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y), n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
};
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const daysTxt = (n: number) => plural(n, 'día', 'días');

/** Núcleo de la estimación, a partir de filas ya armadas. */
function estimate(rows: Row[], marginOverride: number | null | undefined, adaptingNow: boolean) {
  const valid = rows.filter(r => r.cycle != null && r.counts).map(r => r.cycle!).slice(-6);
  const avgCycle = valid.length ? Math.round(median(valid)) : DEFAULT_CYCLE;
  const spread = valid.length >= 2 ? Math.max(...valid) - Math.min(...valid) : null;
  let auto = spread == null ? 3 : clamp(Math.ceil(spread / 2), 2, 7);
  if (valid.length < 3) auto = Math.max(auto, 3);
  if (adaptingNow) auto = clamp(auto + 2, 2, 7);
  const margin = marginOverride != null ? clamp(marginOverride, 2, 7) : auto;
  const confidence: Confidence = valid.length < 3 ? 'pocos' : valid.length >= 6 && (spread ?? 0) <= 4 ? 'firme' : 'media';
  return { valid, avgCycle, spread, auto, margin, confidence };
}

export function analyze(periods: Period[], events: PillEvent[], today: string, opts: AnalyzeOptions = {}): Analysis {
  const ps = [...periods].sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  const evs = [...events].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  // Ciclos de adaptación: los 3 primeros períodos que empiezan después de dejar las pastillas
  const adaptSet = new Set<string>();
  evs.filter(e => e.type === 'stop').forEach(e => {
    ps.filter(p => p.start > e.date).slice(0, ADAPT_CYCLES).forEach(p => adaptSet.add(p.start));
  });

  const rows: Row[] = ps.map((p, i) => {
    const adapt = adaptSet.has(p.start);
    return {
      ...p,
      dur: p.end ? daysBetween(p.start, p.end) + 1 : null,
      cycle: i < ps.length - 1 ? daysBetween(p.start, ps[i + 1].start) : null,
      flags: [], adapt,
      counts: !p.atypical && !adapt,
    };
  });

  if (!opts.minor) {
    rows.forEach((r, i) => {
      if (!r.counts) return; // los ciclos raros o de adaptación no generan alertas
      const window = rows.slice(Math.max(0, i - 3), i).filter(x => x.counts);
      if (r.cycle != null) {
        const prev = window.map(x => x.cycle).filter((x): x is number => x != null);
        if (prev.length) {
          const d = Math.round(r.cycle - mean(prev));
          if (Math.abs(d) >= 3) r.flags.push({ level: 'warn', text: d > 0 ? `Ciclo ${daysTxt(d)} más largo` : `Ciclo ${daysTxt(-d)} más corto` });
        }
        if (r.cycle < FIGO.minCycle || r.cycle > FIGO.maxCycle) r.flags.push({ level: 'alert', text: `Fuera del rango típico (${FIGO.minCycle}–${FIGO.maxCycle} días)` });
      }
      if (r.dur != null) {
        const prevD = window.map(x => x.dur).filter((x): x is number => x != null);
        if (prevD.length) {
          const d = Math.round(r.dur - mean(prevD));
          if (Math.abs(d) >= 2) r.flags.push({ level: 'warn', text: d > 0 ? `Sangrado ${daysTxt(d)} más largo` : `Sangrado ${daysTxt(-d)} más corto` });
        }
        if (r.dur > FIGO.maxBleed) r.flags.push({ level: 'alert', text: `Sangrado de más de ${FIGO.maxBleed} días` });
      }
    });
  }

  const last = rows.length ? rows[rows.length - 1] : null;
  const adapting = !!last?.adapt;
  const est = estimate(rows, opts.margin, adapting);
  const cycles = rows.map(r => r.cycle).filter((x): x is number => x != null);
  const durs = rows.map(r => r.dur).filter((x): x is number => x != null);
  const avgDur = durs.length ? Math.round(median(durs.slice(-6))) : DEFAULT_DUR;
  const irregular = !opts.minor && est.spread != null && est.valid.length >= 3 && est.spread > FIGO.maxVariation - 2;

  const lastPill = evs.length ? evs[evs.length - 1] : null;
  const onPill = !!lastPill && lastPill.type === 'start';

  let next: string | null = null, rangeStart: string | null = null, rangeEnd: string | null = null;
  let ovu: string | null = null, fertile: [string, string] | null = null, late = 0;
  if (last) {
    next = addDays(last.start, est.avgCycle);
    rangeStart = addDays(next, -est.margin);
    rangeEnd = addDays(next, est.margin);
    late = Math.max(0, daysBetween(rangeEnd, today));
    if (!onPill) {
      ovu = addDays(next, -LUTEAL);
      fertile = [addDays(ovu, -5), addDays(ovu, 1)];
    }
  }

  // ¿Qué tan cerca estuvo la estimación del último período? (con lo que se sabía antes)
  let lastAccuracy: Accuracy | null = null;
  if (rows.length >= 3) {
    const before = rows.slice(0, -1).map((r, i, arr) => ({ ...r, cycle: i < arr.length - 1 ? r.cycle : null }));
    const e2 = estimate(before, opts.margin, !!before[before.length - 1]?.adapt);
    const predicted = addDays(before[before.length - 1].start, e2.avgCycle);
    const diff = daysBetween(predicted, last!.start);
    lastAccuracy = { predicted, diff, inRange: Math.abs(diff) <= e2.margin };
  }

  // Búsqueda de embarazo: ciclos marcados, y desde cuándo viene seguida la búsqueda actual
  const tryingCycles = rows.filter(r => r.trying).length;
  let tryingSince: string | null = null;
  for (let i = rows.length - 1; i >= 0 && rows[i].trying; i--) tryingSince = rows[i].start;

  return {
    tryingCycles, tryingSince,
    rows, cycles, valid: est.valid, avgCycle: est.avgCycle, avgDur,
    minC: cycles.length ? Math.min(...cycles) : null,
    maxC: cycles.length ? Math.max(...cycles) : null,
    last, next, rangeStart, rangeEnd, margin: est.margin, autoMargin: est.auto, confidence: est.confidence, irregular, adapting,
    ovu, fertile, late, onPill, lastPill, lastAccuracy,
  };
}

export const CONFIDENCE_TEXT: Record<Confidence, string> = { pocos: 'Pocos datos', media: 'Estimación media', firme: 'Estimación firme' };

export type DayKind = 'period' | 'pred' | 'maybe' | 'fertile' | 'ovu' | 'pill' | 'try' | 'sym';

/** Tipo de cada día para pintar el calendario. */
export function dayKinds(A: Analysis, events: PillEvent[], predictCycles = 3): Map<string, Set<DayKind>> {
  const m = new Map<string, Set<DayKind>>();
  const mark = (s: string, k: DayKind) => { if (!m.has(s)) m.set(s, new Set()); m.get(s)!.add(k); };
  const markOvu = (o: string) => { mark(o, 'ovu'); for (let i = -5; i <= 1; i++) if (i) mark(addDays(o, i), 'fertile'); };

  A.rows.forEach(r => { const len = r.dur ?? A.avgDur; for (let i = 0; i < len; i++) mark(addDays(r.start, i), 'period'); });
  // ovulación aproximada de ciclos ya terminados (solo si no estaba con pastillas)
  const markTry = (o: string) => { for (let i = -5; i <= 1; i++) mark(addDays(o, i), 'try'); };
  A.rows.forEach(r => {
    if (r.cycle && !pillActiveOn(events, r.start)) {
      const o = addDays(r.start, r.cycle - LUTEAL);
      markOvu(o);
      if (r.trying) markTry(o);
    }
  });
  if (A.next) {
    for (let c = 0; c < predictCycles; c++) {
      const n = addDays(A.next, c * A.avgCycle);
      for (let i = 0; i < A.avgDur; i++) mark(addDays(n, i), 'pred');
      // posibles días del próximo período (rango), sin pisar los más probables
      if (c === 0 && A.rangeStart && A.rangeEnd) for (let d = A.rangeStart; d <= A.rangeEnd; d = addDays(d, 1)) mark(d, 'maybe');
      if (!A.onPill) { markOvu(addDays(n, -LUTEAL)); if (c === 0 && A.last?.trying) markTry(addDays(n, -LUTEAL)); }
    }
  }
  events.forEach(e => mark(e.date, 'pill'));
  return m;
}

/** ¿Estaba tomando pastillas en esa fecha? */
export function pillActiveOn(events: PillEvent[], date: string): boolean {
  const before = events.filter(e => e.date <= date).sort((a, b) => (a.date < b.date ? -1 : 1));
  return before.length > 0 && before[before.length - 1].type === 'start';
}

// ---------- Recordatorios ----------

export interface ReminderSettings {
  periodOn: boolean;
  periodDaysBefore: number;
  fertileOn: boolean;
  ovuOn: boolean;
  lateOn: boolean;
  hour: number; // hora del aviso (0-23)
}

export const DEFAULT_REMINDERS: ReminderSettings = {
  periodOn: true, periodDaysBefore: 2, fertileOn: true, ovuOn: false, lateOn: true, hour: 9,
};

export interface Reminder { id: number; date: string; hour: number; title: string; body: string }

const ID_BASE = { period: 1000, periodDay: 2000, fertile: 3000, ovu: 4000, late: 5000 } as const;

/** Avisos a programar a partir de hoy (incluido hoy si la hora no pasó), hasta `horizon` días. */
export function upcomingReminders(A: Analysis, s: ReminderSettings, now: Date, horizon = 120): Reminder[] {
  if (!A.next) return [];
  const today = localToday(now);
  const out: Reminder[] = [];
  const isFuture = (date: string) => {
    const d = daysBetween(today, date);
    if (d < 0 || d > horizon) return false;
    if (d === 0) return now.getHours() < s.hour;
    return true;
  };
  const push = (id: number, date: string, title: string, body: string) => { if (isFuture(date)) out.push({ id, date, hour: s.hour, title, body }); };

  for (let c = 0; c < 4; c++) {
    const n = addDays(A.next, c * A.avgCycle);
    if (s.periodOn) {
      if (A.irregular || A.margin >= 4) {
        const from = addDays(n, -A.margin);
        push(ID_BASE.period + c, from, 'Empiezan tus posibles días', `Tu período podría llegar entre el ${fmtShort(from)} y el ${fmtShort(addDays(n, A.margin))}.`);
      } else {
        const before = addDays(n, -s.periodDaysBefore);
        push(ID_BASE.period + c, before, `Tu período podría llegar en ${daysTxt(s.periodDaysBefore)}`, `Fecha probable: ${fmtLong(n)}.`);
      }
    }
    if (!A.onPill) {
      const o = addDays(n, -LUTEAL);
      if (s.fertileOn) push(ID_BASE.fertile + c, addDays(o, -5), 'Empieza tu ventana fértil', `Días fértiles estimados: ${fmtShort(addDays(o, -5))} a ${fmtShort(addDays(o, 1))}.`);
      if (s.ovuOn) push(ID_BASE.ovu + c, o, 'Hoy es tu ovulación estimada', 'Es una estimación según tus ciclos anteriores.');
    }
  }
  if (s.lateOn) {
    // El atraso se cuenta desde el último de los posibles días
    for (const d of [2, 5, 10]) {
      push(ID_BASE.late + d, addDays(A.rangeEnd ?? A.next, d), `Tu período tiene ${daysTxt(d)} de atraso`, 'Si ya te vino, anotalo en la app para actualizar las fechas.');
    }
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : 1));
}

// ---------- Formato ----------

export const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const MONTHS_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export const fmtShort = (s: string) => { const d = toDate(s); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; };
export const fmtLong = (s: string) => { const d = toDate(s); return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} de ${MONTHS_LONG[d.getUTCMonth()]}`; };

// ---------- Perfiles ----------

/** Edad cumplida en una fecha. null si no hay fecha de nacimiento. */
export function ageOn(birthDate: string, today: string): number | null {
  if (!birthDate) return null;
  const [by, bm, bd] = birthDate.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) age--;
  return age;
}

/** El modo buscar embarazo solo existe para el perfil propio y con 18 años o más. */
export function canTry(p: Profile, today: string): boolean {
  if (p.kind !== 'self') return false;
  const a = ageOn(p.birthDate, today);
  return a != null && a >= 18;
}

/** ¿Se muestran ovulación y días fértiles para este perfil? Nunca en perfiles de hijas. */
export const showsFertility = (p: Profile) => p.kind === 'self';

// ---------- Avisos de familia y armado final ----------

/** Un solo aviso por hija: X días antes de su próximo período (y de los dos siguientes). Texto siempre neutro. */
export function childReminders(p: Profile, A: Analysis, hour: number, now: Date, horizon = 120): Reminder[] {
  if (p.kind !== 'child' || p.notYet || !p.alertDays || !A.next || p.id == null) return [];
  const today = localToday(now);
  const out: Reminder[] = [];
  for (let c = 0; c < 3; c++) {
    const date = addDays(addDays(A.next, c * A.avgCycle), -p.alertDays);
    const d = daysBetween(today, date);
    if (d < 0 || d > horizon || (d === 0 && now.getHours() >= hour)) continue;
    out.push({ id: 6000 + p.id * 10 + c, date, hour, title: 'Meneia', body: 'Lista de compras para esta semana' });
  }
  return out;
}

/** ¿La hora cae dentro del horario sin avisos? Soporta rangos que cruzan la medianoche (22 a 8). */
export function inQuiet(hour: number, from: number, to: number): boolean {
  if (from === to) return false;
  return from < to ? hour >= from && hour < to : hour >= from || hour < to;
}

/** Aplica la privacidad a los avisos: texto neutro y corrimiento fuera del horario sin avisos. */
export function finalizeReminders(list: Reminder[], pr: PrivacySettings): Reminder[] {
  return list.map(r => ({
    ...r,
    hour: inQuiet(r.hour, pr.quietFrom, pr.quietTo) ? pr.quietTo : r.hour,
    title: pr.discreet ? 'Meneia' : r.title,
    body: pr.discreet ? (r.id >= 6000 ? 'Lista de compras para esta semana' : 'Tenés un recordatorio') : r.body,
  }));
}

/** Opciones de análisis según el perfil. */
export const optsFor = (p: Profile, today: string): AnalyzeOptions => {
  const a = ageOn(p.birthDate, today);
  return { minor: p.kind === 'child' || (a != null && a < 18), margin: p.margin ?? null };
};

// ---------- Pastillas ----------

export interface PillSettings {
  packStart: string;   // primer día del blíster actual (o de uno anterior: se calcula el ciclo)
  active: number;      // días con pastilla (21)
  rest: number;        // días de descanso (7); 0 si son de toma continua
  hour: number;        // hora del recordatorio diario
  remind: boolean;
  stock: number;       // blísters en casa, sin contar el que está en uso, al día stockDate
  stockDate: string;
  taken: string[];     // días en que marcó "La tomé" (los últimos 90)
}
export const DEFAULT_PILLS: PillSettings = { packStart: '', active: 21, rest: 7, hour: 21, remind: true, stock: 1, stockDate: '', taken: [] };

export interface PillDay { packStart: string; day: number; length: number; isRest: boolean; packEnd: string; stockNow: number; buyBy: string | null }

/** Día del blíster de hoy, cuándo termina y si hay que comprar. */
export function pillDay(ps: PillSettings, today: string): PillDay | null {
  if (!ps.packStart || ps.packStart > today) return null;
  const length = ps.active + ps.rest;
  const since = daysBetween(ps.packStart, today);
  const packStart = addDays(ps.packStart, Math.floor(since / length) * length);
  const day = (since % length) + 1;
  const packEnd = addDays(packStart, length - 1);
  // Cada blíster nuevo que empezó desde que se cargó el stock usa uno de los de casa
  const ref = ps.stockDate || ps.packStart;
  const usedSince = Math.max(0, Math.floor(daysBetween(ps.packStart, today) / length) - Math.floor(Math.max(0, daysBetween(ps.packStart, ref)) / length));
  const stockNow = Math.max(0, ps.stock - usedSince);
  const buyBy = stockNow === 0 ? addDays(packEnd, 1) : null;
  return { packStart, day, length, isRest: day > ps.active, packEnd, stockNow, buyBy };
}

/** Recordatorio diario de la pastilla (próximos 14 días) y aviso para comprar. */
export function pillReminders(ps: PillSettings, now: Date): Reminder[] {
  const today = localToday(now);
  const pd = pillDay(ps, today);
  if (!pd) return [];
  const out: Reminder[] = [];
  if (ps.remind) {
    for (let i = 0; i < 14; i++) {
      const date = addDays(today, i);
      const day = ((daysBetween(ps.packStart, date) % pd.length) + pd.length) % pd.length + 1;
      if (day > ps.active) continue;
      if (i === 0 && (ps.taken.includes(today) || now.getHours() >= ps.hour)) continue;
      out.push({ id: 8000 + i, date, hour: ps.hour, title: 'Pastilla de hoy', body: 'Si ya la tomaste, marcala en la app.' });
    }
  }
  if (pd.buyBy) {
    const date = addDays(pd.buyBy, -5);
    if (date >= today) out.push({ id: 8100, date: date, hour: 10, title: 'Comprá el próximo blíster', body: `El que estás usando termina el ${fmtShort(pd.packEnd)}.` });
  }
  return out;
}

// ---------- Síntomas ----------

export interface SymptomLog { id?: number; profileId?: number; date: string; pain: number; body: string[]; mood: string[]; note: string }
export const PAIN = ['Nada', 'Leve', 'Medio', 'Fuerte'];
export const BODY = ['Cólicos', 'Dolor de cabeza', 'Hinchazón', 'Pechos sensibles', 'Acné', 'Cansancio', 'Náuseas', 'Espalda'];
export const MOOD = ['Bien', 'Sensible', 'Irritable', 'Ansiosa', 'Triste'];

type Bucket = { label: string; test: (day: number, len: number) => boolean };
const BUCKETS: Bucket[] = [
  { label: 'los días 1 y 2', test: d => d <= 2 },
  { label: 'entre el día 3 y el 5', test: d => d >= 3 && d <= 5 },
  { label: 'a mitad del ciclo', test: (d, len) => d >= len - 17 && d <= len - 11 },
  { label: 'los días antes del período', test: (d, len) => d > len - 5 },
];

export interface Pattern { what: string; when: string; hits: number; of: number }

/** "Lo que se repite": síntomas que aparecen en el mismo momento del ciclo en al menos 3 de los últimos 4 ciclos completos. */
export function patterns(logs: SymptomLog[], rows: Row[]): Pattern[] {
  const done = rows.filter(r => r.cycle != null).slice(-4);
  if (done.length < 3) return [];
  const items = new Set<string>();
  logs.forEach(l => { l.body.forEach(b => items.add(b)); l.mood.forEach(m => items.add(m)); if (l.pain >= 2) items.add('Dolor medio o fuerte'); });
  items.delete('Bien');
  const out: Pattern[] = [];
  for (const it of items) {
    for (const b of BUCKETS) {
      let hits = 0;
      for (const r of done) {
        const len = r.cycle!;
        const hit = logs.some(l => {
          const d = daysBetween(r.start, l.date) + 1;
          if (d < 1 || d > len) return false;
          const has = it === 'Dolor medio o fuerte' ? l.pain >= 2 : l.body.includes(it) || l.mood.includes(it);
          return has && b.test(d, len);
        });
        if (hit) hits++;
      }
      if (hits >= 3) { out.push({ what: it, when: b.label, hits, of: done.length }); break; }
    }
  }
  return out.sort((a, b) => b.hits - a.hits).slice(0, 4);
}

/** Síntomas más anotados dentro de un ciclo (para el historial). */
export function cycleSymptoms(logs: SymptomLog[], start: string, end: string | null): string[] {
  const c = new Map<string, number>();
  logs.filter(l => l.date >= start && (!end || l.date < end)).forEach(l => {
    [...l.body, ...l.mood.filter(m => m !== 'Bien'), ...(l.pain >= 2 ? ['Dolor ' + PAIN[l.pain].toLowerCase()] : [])].forEach(x => c.set(x, (c.get(x) ?? 0) + 1));
  });
  return [...c.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k).slice(0, 4);
}
