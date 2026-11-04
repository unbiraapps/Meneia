// Cálculos del ciclo. Funciones puras: no tocan la pantalla ni la base de datos.
// Fechas como texto 'YYYY-MM-DD' (día local), comparables con < y >.

export type Flow = 'Leve' | 'Normal' | 'Abundante';
export type PillType = 'stop' | 'start';

export interface Period { id?: number; profileId?: number; start: string; end: string; flow: Flow; note: string; trying?: boolean }
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
export interface Row extends Period { dur: number | null; cycle: number | null; flags: Flag[] }

export interface Analysis {
  rows: Row[];            // ordenadas de la más vieja a la más nueva
  cycles: number[];
  avgCycle: number;
  avgDur: number;
  minC: number | null;
  maxC: number | null;
  last: Row | null;
  next: string | null;    // próximo período probable
  ovu: string | null;     // ovulación estimada
  fertile: [string, string] | null;
  late: number;           // días de atraso (0 si no hay)
  onPill: boolean;        // toma pastillas actualmente
  tryingCycles: number;   // ciclos marcados buscando embarazo
  tryingSince: string | null; // primer día del primer ciclo de la búsqueda actual (seguida)
  lastPill: PillEvent | null;
}

export const DEFAULT_CYCLE = 28;
export const DEFAULT_DUR = 5;
export const LUTEAL = 14;
const MS = 864e5;

export const pad = (n: number) => String(n).padStart(2, '0');
export const toDate = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (s: string, n: number) => iso(new Date(toDate(s).getTime() + n * MS));
export const daysBetween = (a: string, b: string) => Math.round((toDate(b).getTime() - toDate(a).getTime()) / MS);
export const localToday = (now = new Date()) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const daysTxt = (n: number) => plural(n, 'día', 'días');

export function analyze(periods: Period[], events: PillEvent[], today: string): Analysis {
  const ps = [...periods].sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  const rows: Row[] = ps.map((p, i) => ({
    ...p,
    dur: p.end ? daysBetween(p.start, p.end) + 1 : null,
    cycle: i < ps.length - 1 ? daysBetween(p.start, ps[i + 1].start) : null,
    flags: [],
  }));

  rows.forEach((r, i) => {
    const window = rows.slice(Math.max(0, i - 3), i);
    if (r.cycle != null) {
      const prev = window.map(x => x.cycle).filter((x): x is number => x != null);
      if (prev.length) {
        const d = Math.round(r.cycle - mean(prev));
        if (Math.abs(d) >= 3) r.flags.push({ level: 'warn', text: d > 0 ? `Ciclo ${daysTxt(d)} más largo` : `Ciclo ${daysTxt(-d)} más corto` });
      }
      if (r.cycle < 21 || r.cycle > 35) r.flags.push({ level: 'alert', text: 'Fuera del rango típico (21–35 días)' });
    }
    if (r.dur != null) {
      const prevD = window.map(x => x.dur).filter((x): x is number => x != null);
      if (prevD.length) {
        const d = Math.round(r.dur - mean(prevD));
        if (Math.abs(d) >= 2) r.flags.push({ level: 'warn', text: d > 0 ? `Sangrado ${daysTxt(d)} más largo` : `Sangrado ${daysTxt(-d)} más corto` });
      }
      if (r.dur > 7) r.flags.push({ level: 'alert', text: 'Sangrado de más de 7 días' });
    }
  });

  const cycles = rows.map(r => r.cycle).filter((x): x is number => x != null);
  const recent = cycles.slice(-6);
  const avgCycle = recent.length ? Math.round(mean(recent)) : DEFAULT_CYCLE;
  const durs = rows.map(r => r.dur).filter((x): x is number => x != null);
  const avgDur = durs.length ? Math.round(mean(durs.slice(-6))) : DEFAULT_DUR;
  const last = rows.length ? rows[rows.length - 1] : null;

  const evs = [...events].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const lastPill = evs.length ? evs[evs.length - 1] : null;
  const onPill = !!lastPill && lastPill.type === 'start';

  let next: string | null = null, ovu: string | null = null, fertile: [string, string] | null = null, late = 0;
  if (last) {
    next = addDays(last.start, avgCycle);
    late = Math.max(0, daysBetween(next, today));
    if (!onPill) {
      ovu = addDays(next, -LUTEAL);
      fertile = [addDays(ovu, -5), addDays(ovu, 1)];
    }
  }

  // Búsqueda de embarazo: ciclos marcados, y desde cuándo viene seguida la búsqueda actual
  const tryingCycles = rows.filter(r => r.trying).length;
  let tryingSince: string | null = null;
  for (let i = rows.length - 1; i >= 0 && rows[i].trying; i--) tryingSince = rows[i].start;

  return {
    tryingCycles, tryingSince,
    rows, cycles, avgCycle, avgDur,
    minC: cycles.length ? Math.min(...cycles) : null,
    maxC: cycles.length ? Math.max(...cycles) : null,
    last, next, ovu, fertile, late, onPill, lastPill,
  };
}

export type DayKind = 'period' | 'pred' | 'fertile' | 'ovu' | 'pill' | 'try';

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
      const before = addDays(n, -s.periodDaysBefore);
      push(ID_BASE.period + c, before, `Tu período podría llegar en ${daysTxt(s.periodDaysBefore)}`, `Fecha probable: ${fmtLong(n)}.`);
    }
    if (!A.onPill) {
      const o = addDays(n, -LUTEAL);
      if (s.fertileOn) push(ID_BASE.fertile + c, addDays(o, -5), 'Empieza tu ventana fértil', `Días fértiles estimados: ${fmtShort(addDays(o, -5))} a ${fmtShort(addDays(o, 1))}.`);
      if (s.ovuOn) push(ID_BASE.ovu + c, o, 'Hoy es tu ovulación estimada', 'Es una estimación según tus ciclos anteriores.');
    }
  }
  if (s.lateOn) {
    for (const d of [2, 5, 10]) {
      push(ID_BASE.late + d, addDays(A.next, d), `Tu período tiene ${daysTxt(d)} de atraso`, 'Si ya te vino, anotalo en la app para actualizar las fechas.');
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
