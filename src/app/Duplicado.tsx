// "¿Es el mismo período?": dos períodos que empiezan con 10 días o menos de diferencia.
// Pasa si se anota "Empezó este día" en otra fecha en lugar de corregir la del período ya anotado.
import { useEffect, useState } from 'react';
import { closePairs, fmtShort, mergedPeriod } from '../calc';
import { getSetting, mergePeriods, setSetting } from '../db';
import { useStore, type ProfileData } from './store';
import { useToast } from './ui';

const keyOf = (pid: number | undefined, a: string, b: string) => `${pid ?? 1}:${a}:${b}`;

export function useDuplicatePairs(d: ProfileData | null) {
  const [seen, setSeen] = useState<string[] | null>(null);
  useEffect(() => { getSetting<string[]>('dupVistos', []).then(setSeen); }, []);
  if (!d || !seen) return { pairs: [], dismiss: async () => {} };
  const pairs = closePairs(d.A.rows).filter(p => !seen.includes(keyOf(d.profile.id, p.a.start, p.b.start)));
  const dismiss = async (a: string, b: string) => { const next = [...seen, keyOf(d.profile.id, a, b)]; setSeen(next); await setSetting('dupVistos', next); };
  return { pairs, dismiss };
}

export function DuplicateCard({ d }: { d: ProfileData }) {
  const { refresh } = useStore();
  const toast = useToast();
  const { pairs, dismiss } = useDuplicatePairs(d);
  const p = pairs[pairs.length - 1];
  if (!p) return null;
  const m = mergedPeriod(p.a, p.b);
  return (
    <div className="card warn-card" role="status">
      <b style={{ color: 'var(--ivory)' }}>¿Es el mismo período?</b>
      <p style={{ fontSize: 14, margin: 0 }}>Anotaste uno el {fmtShort(p.a.start)} y otro el {fmtShort(p.b.start)}, con {p.gap} {p.gap === 1 ? 'día' : 'días'} de diferencia. Si es el mismo, lo unimos y empieza el {fmtShort(m.start)}.</p>
      <div className="btns">
        <button type="button" className="btn small" onClick={async () => { await mergePeriods(p.a, p.b, m); await refresh(); toast(`Listo: un solo período desde el ${fmtShort(m.start)}`); }}>Sí, unirlos</button>
        <button type="button" className="btn ghost small" onClick={() => dismiss(p.a.start, p.b.start)}>No, son distintos</button>
      </div>
    </div>
  );
}
