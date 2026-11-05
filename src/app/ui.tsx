import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

// ---------- Íconos (trazo, heredan el color) ----------
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
export const Icon = {
  today: () => <svg viewBox="0 0 24 24" {...P} aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 0 0 16" /></svg>,
  cal: () => <svg viewBox="0 0 24 24" {...P} aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M4 10h16M9 3v4M15 3v4" /></svg>,
  list: () => <svg viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h9" /></svg>,
  pen: () => <svg viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z" /></svg>,
  heart: () => <svg viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>,
  user: () => <svg viewBox="0 0 24 24" {...P} aria-hidden="true"><circle cx="12" cy="9" r="3.5" /><path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5" /></svg>,
  eyeOff: () => <svg width="20" height="20" viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M3 3l18 18M10.6 6.1A9.9 9.9 0 0 1 12 6c5 0 9 6 9 6a17 17 0 0 1-2.6 3.2M6.3 7.6C4.2 9.2 3 12 3 12s4 6 9 6c1.4 0 2.7-.4 3.9-1" /></svg>,
  back: () => <svg width="18" height="18" viewBox="0 0 24 24" {...P} strokeWidth={2} aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>,
  chev: () => <svg className="chev" width="18" height="18" viewBox="0 0 24 24" {...P} strokeWidth={2} aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>,
  lock: () => <svg width="20" height="20" viewBox="0 0 24 24" {...P} aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>,
  bell: () => <svg width="20" height="20" viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>,
  pill: () => <svg width="20" height="20" viewBox="0 0 24 24" {...P} aria-hidden="true"><rect x="3" y="9" width="18" height="6" rx="3" /><path d="M12 9v6" /></svg>,
  save: () => <svg width="20" height="20" viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>,
  family: () => <svg width="20" height="20" viewBox="0 0 24 24" {...P} aria-hidden="true"><circle cx="8" cy="8" r="3" /><circle cx="17" cy="10" r="2.4" /><path d="M2.5 20c.8-3.3 3-5 5.5-5s4.7 1.7 5.5 5M13.5 20c.5-2.4 2-3.6 3.5-3.6s3 1.2 3.5 3.6" /></svg>,
  x: () => <svg width="18" height="18" viewBox="0 0 24 24" {...P} strokeWidth={2} aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>,
  logo: () => <svg width="34" height="34" viewBox="0 0 512 512" aria-hidden="true"><circle cx="256" cy="268" r="128" fill="none" stroke="#fff" strokeWidth="40" strokeDasharray="560 244" strokeLinecap="round" transform="rotate(-35 256 268)" /><circle cx="256" cy="140" r="40" fill="#fff" /></svg>,
};

// ---------- Piezas ----------
export function Switch({ on, onChange, label, variant }: { on: boolean; onChange: (v: boolean) => void; label: string; variant?: 'try' }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={'switch' + (variant ? ' ' + variant : '')} onClick={() => onChange(!on)} />;
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="top"><h2>{title}</h2><button type="button" className="icon-btn" aria-label="Cerrar" onClick={onClose}><Icon.x /></button></div>
        {children}
      </div>
    </div>
  );
}

export function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return <div className="top-left"><button type="button" className="icon-btn" aria-label="Volver" onClick={onBack}><Icon.back /></button><h1 style={{ fontSize: 26 }}>{title}</h1></div>;
}

export function Avatar({ name, color, lg }: { name: string; color: string; lg?: boolean }) {
  const initial = name.trim().toLowerCase() === 'yo' ? 'Yo' : (name.trim()[0] || '?').toUpperCase();
  return <span className={'avatar' + (lg ? ' lg' : '')} style={{ background: color }}>{initial}</span>;
}

// ---------- Avisos cortos (toast) ----------
const ToastCtx = createContext<(m: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((m: string) => { setMsg(m); clearTimeout(timer.current); timer.current = setTimeout(() => setMsg(null), 2800); }, []);
  return <ToastCtx.Provider value={show}>{children}{msg && <div className="toast" role="status">{msg}</div>}</ToastCtx.Provider>;
}

export const COLORS = ['#9FD8C8', '#F2C38B', '#8FB8F2', '#F0A6DC', '#B5A4E6', '#C9E28A'];

// ---------- Elegir un día en un calendario ----------
const MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const longDate = (s: string) => { const [y, m, d] = s.split('-').map(Number); const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); return `${DIA[w]} ${d} de ${MES[m - 1]}`; };

/** Calendario de un mes para tocar un día. Los días después de `max` no se pueden elegir. */
export function MonthPicker({ value, max, onPick, fam }: { value: string; max: string; onPick: (d: string) => void; fam?: boolean }) {
  const base = value || max;
  const [ym, setYm] = useState<[number, number]>([+base.slice(0, 4), +base.slice(5, 7) - 1]);
  const [y, m] = ym;
  const first = new Date(Date.UTC(y, m, 1)).getUTCDay(); // 0 = domingo
  const lead = (first + 6) % 7; // la semana empieza el lunes
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const canNext = (m === 11 ? `${y + 1}-01` : `${y}-${pad(m + 2)}`) <= max.slice(0, 7);
  const go = (d: number) => setYm(([yy, mm]) => { const t = mm + d; return [yy + Math.floor(t / 12), ((t % 12) + 12) % 12]; });
  const on = fam ? 'var(--fam)' : 'var(--plum)';
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <button type="button" className="icon-btn" aria-label="Mes anterior" onClick={() => go(-1)}><svg width="18" height="18" viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg></button>
        <b style={{ fontSize: 15, textTransform: 'capitalize' }}>{MES[m]} {y}</b>
        <button type="button" className="icon-btn" aria-label="Mes siguiente" disabled={!canNext} style={canNext ? undefined : { opacity: .3 }} onClick={() => go(1)}><svg width="18" height="18" viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button>
      </div>
      <div className="cal" role="grid" aria-label={`${MES[m]} ${y}`}>
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i} className="dow" aria-hidden="true">{d}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={'e' + i} />)}
        {Array.from({ length: days }, (_, i) => {
          const d = isoOf(y, m, i + 1), future = d > max, sel = d === value;
          return <button key={d} type="button" className={'day' + (d === max ? ' today' : '')} disabled={future} aria-pressed={sel} aria-label={longDate(d) + (future ? ', todavía no llegó' : '')}
            style={sel ? { background: on, color: '#17131F', fontWeight: 700 } : future ? { opacity: .3, cursor: 'default' } : undefined} onClick={() => onPick(d)}>{i + 1}</button>;
        })}
      </div>
    </div>
  );
}

/** Botón con la fecha elegida que abre un calendario debajo. */
export function DateField({ label, value, max, onChange, fam, startOpen, optional }: { label: string; value: string; max: string; onChange: (d: string) => void; fam?: boolean; startOpen?: boolean; optional?: boolean }) {
  const [open, setOpen] = useState(!!startOpen);
  return (
    <div className="stack" style={{ gap: 8 }}>
      <span className="eyebrow">{label}</span>
      <button type="button" className="datefield" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span style={{ color: fam ? 'var(--fam)' : 'var(--plum)', display: 'grid', width: 22, height: 22 }}><Icon.cal /></span>
        <span className="grow" style={{ textAlign: 'left', color: value ? 'var(--fg)' : 'var(--muted)' }}>{value ? longDate(value).replace(/^./, c => c.toUpperCase()) : 'Elegir el día en el calendario'}</span>
        <span className="muted" style={{ fontSize: 13 }}>{open ? 'Cerrar' : value ? 'Cambiar' : ''}</span>
      </button>
      {open && <MonthPicker value={value} max={max} fam={fam} onPick={d => { onChange(d); setOpen(false); }} />}
      {optional && value && <button type="button" className="btn link" style={{ alignSelf: 'flex-start', minHeight: 32, fontSize: 13 }} onClick={() => onChange('')}>Borrar fecha</button>}
    </div>
  );
}
