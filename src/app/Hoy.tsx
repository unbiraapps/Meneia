import { useState } from 'react';
import { addDays, daysBetween, fmtLong, fmtShort, plural, ageOn, showsFertility } from '../calc';
import { savePeriod, saveProfile } from '../db';
import { useStore } from './store';
import { Avatar, Icon, useToast } from './ui';
import { PeriodSheet } from './PeriodSheet';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Fila de perfiles para cambiar entre "Yo" y las hijas. Solo aparece si hay más de uno. */
export function ProfileChips() {
  const { profiles, activeId, setActive } = useStore();
  if (profiles.length < 2) return null;
  return (
    <div className="pchips" role="tablist" aria-label="Perfiles">
      {profiles.map(p => (
        <button key={p.id} type="button" role="tab" aria-selected={p.id === activeId} className={'pchip' + (p.id === activeId ? ' on' : '')} onClick={() => setActive(p.id!)}>
          <Avatar name={p.name} color={p.color} />{p.name}
        </button>
      ))}
    </div>
  );
}

export function Hoy({ onCover, goTo }: { onCover: () => void; goTo: (t: 'salud' | 'perfil') => void }) {
  const { active, today, refresh, migrated, health, profiles } = useStore();
  const toast = useToast();
  const [sheet, setSheet] = useState<false | 'new' | 'edit'>(false);
  if (!active) return null;
  const { profile, A } = active;
  const fertility = showsFertility(profile) && !A.onPill;
  const last = A.last;
  const ongoing = !!last && !last.end && daysBetween(last.start, today) <= 10;

  async function meVino() {
    if (ongoing && last) {
      await savePeriod({ ...last, end: today });
      await refresh(); toast('Listo, anotado que terminó hoy');
      return;
    }
    await savePeriod({ profileId: profile.id, start: today, end: '', flow: 'Normal', note: '', trying: profile.trying });
    if (profile.notYet) await saveProfile({ ...profile, notYet: false });
    await refresh(); toast(profile.kind === 'child' ? 'Anotado para ' + profile.name : 'Anotado: te vino hoy');
  }

  // Alertas del perfil
  const alerts: { kind: string; text: string }[] = [];
  if (migrated) alerts.push({ kind: 'ok', text: 'Pasamos tus registros de la versión anterior.' });
  if (last && profile.kind === 'self') {
    const prev = A.rows[A.rows.length - 2];
    prev?.flags.filter(f => !f.text.startsWith('Sangrado')).forEach(f => alerts.push({ kind: f.level === 'alert' ? 'bad' : 'warn', text: `Cambio en tu último ciclo: ${f.text} (${prev.cycle} días).` }));
    last.flags.filter(f => f.text.startsWith('Sangrado')).forEach(f => alerts.push({ kind: f.level === 'alert' ? 'bad' : 'warn', text: `Último período: ${f.text}.` }));
  }
  if (A.late > 0 && A.next) alerts.push({ kind: profile.kind === 'self' ? 'bad' : 'info', text: `${plural(A.late, 'día', 'días')} de atraso respecto de la fecha estimada (${fmtShort(A.next)}).` });

  const consultOld = profile.kind === 'self' && health.lastConsult && daysBetween(health.lastConsult, today) > 330;
  const age = ageOn(profile.birthDate, today);

  // Anillo del ciclo
  const cycleDay = last ? daysBetween(last.start, today) + 1 : 0;
  const len = A.avgCycle;
  const C = 2 * Math.PI * 100;
  const prog = last ? Math.min(1, cycleDay / len) : 0;
  const periodArc = last ? Math.min(1, (last.dur ?? A.avgDur) / len) : 0;
  const fertStart = fertility && A.fertile && last ? daysBetween(last.start, A.fertile[0]) / len : 0;
  const fertLen = fertility && A.fertile ? 7 / len : 0;
  const daysLeft = A.next ? daysBetween(today, A.next) : null;

  return (
    <div className="screen">
      <div className="top">
        <div className="top-left">
          {profiles.length < 2 && <><Avatar name={profile.name} color={profile.color} /><h1 style={{ fontSize: 24 }}>Hoy</h1></>}
        </div>
        <button type="button" className="icon-btn round" aria-label="Tapar la pantalla" onClick={onCover}><Icon.eyeOff /></button>
      </div>
      <ProfileChips />

      {alerts.length > 0 && <div className="alerts">{alerts.map((a, i) => <div key={i} className={'alert ' + a.kind}><span className="dot" /><div>{a.text}</div></div>)}</div>}

      {profile.notYet ? (
        <div className="card fam">
          <span className="eyebrow">{profile.name}{age != null ? ` · ${age} años` : ''}</span>
          <h2>Todavía no le vino</h2>
          <p className="muted" style={{ fontSize: 14 }}>Cuando le venga por primera vez, anotalo y la app empieza a estimar sus fechas. Mientras tanto, conviene que tenga un kit en la mochila: una toallita, una bombacha de repuesto y algo para el dolor.</p>
          <button type="button" className="btn fam" onClick={meVino}>Le vino hoy</button>
        </div>
      ) : (
        <>
          <div className="ring" role="img" aria-label={last ? `Día ${cycleDay} del ciclo${daysLeft != null ? `, faltan ${daysLeft} días para el período` : ''}` : 'Sin datos todavía'}>
            <svg viewBox="0 0 236 236" aria-hidden="true">
              <circle cx="118" cy="118" r="100" fill="none" stroke="var(--soft)" strokeWidth="16" />
              {fertLen > 0 && <circle cx="118" cy="118" r="100" fill="none" stroke="var(--fertile)" strokeWidth="16" strokeDasharray={`${fertLen * C} ${C}`} strokeDashoffset={-fertStart * C} transform="rotate(-90 118 118)" />}
              {last && <circle cx="118" cy="118" r="100" fill="none" stroke="var(--period)" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${periodArc * C} ${C}`} transform="rotate(-90 118 118)" />}
              {last && <circle cx={118 + 100 * Math.sin(prog * 2 * Math.PI)} cy={118 - 100 * Math.cos(prog * 2 * Math.PI)} r="9" fill="var(--fg)" />}
            </svg>
            <div className="ring-in">
              {last ? (
                <>
                  <span className="eyebrow">Día {cycleDay} del ciclo</span>
                  <span className="ring-big num">{daysLeft != null && daysLeft > 0 ? daysLeft : '·'}</span>
                  <span className="muted" style={{ fontSize: 14 }}>{daysLeft != null && daysLeft > 0 ? 'días para el período' : daysLeft === 0 ? 'podría llegar hoy' : 'ya debería haber llegado'}</span>
                </>
              ) : <span className="muted" style={{ fontSize: 14, maxWidth: 150 }}>Anotá tu último período para empezar</span>}
            </div>
          </div>
          {A.next && (
            <div className="next">
              <b>{cap(fmtLong(A.next))}</b>
              <span className="muted" style={{ fontSize: 13.5 }}>Entre el {fmtShort(addDays(A.next, -2))} y el {fmtShort(addDays(A.next, 2))}</span>
            </div>
          )}
          {fertility && A.ovu && A.fertile && (
            <div className="grid2">
              <div className="mini"><span>Ovulación estimada</span><b>{fmtShort(A.ovu)}</b></div>
              <div className={'mini' + (profile.trying ? ' try' : '')}><span>{profile.trying ? '♥ Mejores días para buscar' : 'Días fértiles'}</span><b>{fmtShort(A.fertile[0])} – {fmtShort(A.fertile[1])}</b></div>
            </div>
          )}
          {A.onPill && profile.kind === 'self' && <p className="muted" style={{ fontSize: 13, textAlign: 'center' }}>Con pastillas la ovulación estimada no aplica.</p>}
          <div className="btns">
            <button type="button" className="btn period" onClick={meVino}>{ongoing ? 'Terminó hoy' : 'Me vino'}</button>
            <button type="button" className="btn ghost" style={{ flex: 'none' }} onClick={() => setSheet('new')}>Anotar algo</button>
          </div>
        </>
      )}

      {consultOld && (
        <button type="button" className="list" onClick={() => goTo('salud')} style={{ padding: 0, textAlign: 'left' }}>
          <span className="list-item"><span className="dot" style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--plum)', flex: 'none' }} /><span className="grow"><b>Control con la ginecóloga</b><small>La última fue hace más de 11 meses</small></span><Icon.chev /></span>
        </button>
      )}
      {sheet && <PeriodSheet onClose={() => setSheet(false)} />}
    </div>
  );
}
