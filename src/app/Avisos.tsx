import { useEffect, useState } from 'react';
import { fmtLong, type PrivacySettings, type ReminderSettings } from '../calc';
import { setSetting } from '../db';
import { isNative, permissionState, requestPermission, type PermState } from '../notify';
import { buildReminders, useStore } from './store';
import { SubHeader, Switch, useToast } from './ui';

const DOTS: [string, string][] = [['#A77CE5', 'Lila'], ['#9FD8C8', 'Verde agua'], ['#F2C38B', 'Durazno'], ['#8FB8F2', 'Celeste']];
const hh = (h: number) => String(h).padStart(2, '0') + ':00';

export function Avisos({ onBack }: { onBack: () => void }) {
  const { reminders: r, privacy: pr, refresh, data, health } = useStore();
  const toast = useToast();
  const [perm, setPerm] = useState<PermState>('unsupported');
  useEffect(() => { permissionState().then(setPerm); }, []);
  const saveR = async (x: ReminderSettings) => { await setSetting('reminders', x); await refresh(); };
  const saveP = async (x: PrivacySettings) => { await setSetting('privacy', x); await refresh(); };
  const next = buildReminders(data, r, pr, health, new Date())[0];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="screen">
      <SubHeader title="Avisos" onBack={onBack} />
      {!isNative() ? <div className="alert info"><span className="dot" /><div>En esta versión los avisos aparecen adentro de la app. En la app de Android llegan como notificación aunque esté cerrada.</div></div>
        : perm !== 'granted' ? <div className="alert warn"><span className="dot" /><div>Para recibir avisos, permití las notificaciones.<div style={{ marginTop: 8 }}><button type="button" className="btn small" onClick={async () => { const s = await requestPermission(); setPerm(s); if (s === 'granted') { await refresh(); toast('Notificaciones activadas'); } else toast('Activalas desde Ajustes del teléfono › Apps › Meneia'); }}>Permitir notificaciones</button></div></div></div>
          : next && <div className="alert ok"><span className="dot" /><div>Próximo aviso: {fmtLong(next.date)} a las {hh(next.hour)}.</div></div>}

      <div className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">Así se ve un aviso</span>
        <div className="row" style={{ background: '#2A2436', borderRadius: 18, padding: '12px 14px' }}>
          <span style={{ width: 30, height: 30, borderRadius: '50%', background: pr.dotColor, flex: 'none' }} />
          <div className="stack grow"><b style={{ fontSize: 14 }}>{pr.discreet ? 'Meneia' : 'Tu período podría llegar en 2 días'}</b><span className="muted" style={{ fontSize: 13 }}>{pr.discreet ? 'Tenés un recordatorio' : 'Fecha probable: el sábado'}</span></div>
          <span className="muted" style={{ fontSize: 11.5 }}>{hh(r.hour)}</span>
        </div>
      </div>

      <div className="list">
        <div className="setting"><div className="stack grow"><b>Avisos discretos</b><small>Sin contenido: "Tenés un recordatorio"</small></div><Switch on={pr.discreet} label="Avisos discretos" onChange={v => saveP({ ...pr, discreet: v })} /></div>
        <div className="setting"><div className="stack grow"><b>Ocultos en la pantalla de bloqueo</b><small>No se ven sin desbloquear el celular</small></div><Switch on={pr.hideOnLock} label="Ocultos en la pantalla de bloqueo" onChange={v => saveP({ ...pr, hideOnLock: v })} /></div>
        <div className="setting"><div className="stack grow"><b>Color del punto</b><small>Solo vos sabés qué significa</small></div>
          <div className="row" style={{ gap: 8 }}>{DOTS.map(([c, n]) => <button key={c} type="button" aria-label={n} aria-pressed={pr.dotColor === c} onClick={() => saveP({ ...pr, dotColor: c })} style={{ width: 30, height: 30, borderRadius: '50%', background: c, border: pr.dotColor === c ? '3px solid var(--fg)' : '3px solid transparent', padding: 0, cursor: 'pointer' }} />)}</div></div>
        <div className="setting"><div className="stack grow"><b>Horario sin avisos</b><small>Lo que caiga en ese horario llega después</small></div>
          <select aria-label="Desde" value={pr.quietFrom} onChange={e => saveP({ ...pr, quietFrom: Number(e.target.value) })} style={{ width: 'auto' }}>{hours.map(h => <option key={h} value={h}>{hh(h)}</option>)}</select>
          <span className="muted">a</span>
          <select aria-label="Hasta" value={pr.quietTo} onChange={e => saveP({ ...pr, quietTo: Number(e.target.value) })} style={{ width: 'auto' }}>{hours.map(h => <option key={h} value={h}>{hh(h)}</option>)}</select></div>
      </div>

      <div className="list">
        <div className="setting"><div className="stack grow"><b>Antes del período</b><small>Aviso de que se acerca la fecha probable</small></div>
          <select aria-label="Días de anticipación" value={r.periodDaysBefore} disabled={!r.periodOn} onChange={e => saveR({ ...r, periodDaysBefore: Number(e.target.value) })} style={{ width: 'auto' }}>{[1, 2, 3, 5].map(n => <option key={n} value={n}>{n} {n === 1 ? 'día' : 'días'} antes</option>)}</select>
          <Switch on={r.periodOn} label="Aviso antes del período" onChange={v => saveR({ ...r, periodOn: v })} /></div>
        <div className="setting"><div className="stack grow"><b>Ventana fértil</b><small>El día que empiezan los días fértiles</small></div><Switch on={r.fertileOn} label="Aviso de ventana fértil" onChange={v => saveR({ ...r, fertileOn: v })} /></div>
        <div className="setting"><div className="stack grow"><b>Ovulación</b><small>El día de la ovulación estimada</small></div><Switch on={r.ovuOn} label="Aviso de ovulación" onChange={v => saveR({ ...r, ovuOn: v })} /></div>
        <div className="setting"><div className="stack grow"><b>Atraso</b><small>A los 2, 5 y 10 días</small></div><Switch on={r.lateOn} label="Aviso de atraso" onChange={v => saveR({ ...r, lateOn: v })} /></div>
        <div className="setting"><div className="stack grow"><b>Hora de los avisos</b></div>
          <select aria-label="Hora de los avisos" value={r.hour} onChange={e => saveR({ ...r, hour: Number(e.target.value) })} style={{ width: 'auto' }}>{hours.map(h => <option key={h} value={h}>{hh(h)}</option>)}</select></div>
      </div>
    </div>
  );
}
