import { useState } from 'react';
import { addDays, fmtShort } from '../calc';
import { saveProfile } from '../db';
import { useStore } from './store';
import { Sheet, useToast } from './ui';

/** Ajustar el margen de los posibles días (±2 a ±7). */
export function MarginSheet({ onClose }: { onClose: () => void }) {
  const { active, refresh } = useStore();
  const toast = useToast();
  const { profile, A } = active!;
  const [w, setW] = useState(A.margin);
  const next = A.next!;
  const hint = w < A.autoMargin ? 'Más angosto: puede no acertar' : w > A.autoMargin ? 'Más amplio: más seguro, menos preciso' : 'El que calcula la app según tus ciclos';

  async function save(v: number | null) {
    await saveProfile({ ...profile, margin: v });
    onClose(); await refresh(); toast(v == null ? 'Volviste al margen automático' : 'Margen guardado');
  }

  return (
    <Sheet title="Ajustar los posibles días" onClose={onClose}>
      <p className="muted" style={{ fontSize: 14 }}>Con estos días te aviso y calculo el atraso. Tus últimos ciclos: {A.valid.join(', ') || 'todavía pocos'} días.</p>
      <div className="row">
        <div className="stack grow"><b style={{ fontSize: 16 }}>Del {fmtShort(addDays(next, -w))} al {fmtShort(addDays(next, w))}</b><small className="muted" style={{ fontSize: 12.5 }}>{hint}</small></div>
        <button type="button" className="icon-btn" aria-label="Achicar" onClick={() => setW(Math.max(2, w - 1))}>−</button>
        <b className="num" style={{ minWidth: 52, textAlign: 'center' }}>±{w} días</b>
        <button type="button" className="icon-btn" aria-label="Agrandar" onClick={() => setW(Math.min(7, w + 1))}>+</button>
      </div>
      <button type="button" className="btn" onClick={() => save(w)}>Guardar</button>
      <button type="button" className="btn link" onClick={() => save(null)}>Volver a lo que calcula la app (±{A.autoMargin})</button>
    </Sheet>
  );
}
