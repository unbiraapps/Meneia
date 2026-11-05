import { useState } from 'react';
import { daysBetween, fmtLong, fmtShort, plural, ageOn, showsFertility, patterns, CONFIDENCE_TEXT } from '../calc';
import { savePeriod, saveProfile } from '../db';
import { useStore } from './store';
import { Avatar, Icon, useToast } from './ui';
import { SymptomSheet } from './SymptomSheet';
import { MarginSheet } from './MarginSheet';
import { PillToday } from './Pastillas';
import { PinSheet } from './Pin';
import { PeriodSheet } from './PeriodSheet';
import { getSetting, setSetting } from '../db';
import { useEffect } from 'react';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Fila de perfiles para cambiar entre "Yo" y las hijas. Solo aparece si hay más de uno. */
export function ProfileChips() {
  const { profiles, activeId, setActive } = useStore();
  if (profiles.length < 2) return null;
  return (
    <div className="pchips" role="tablist" aria-label="Perfiles">
      {profiles.map(p => (
        <button key={p.id} type="button" role="tab" aria-selected={p.id === activeId} className={'pchip' + (p.id === activeId ? (p.kind === 'child' ? ' on fam' : ' on') : '')} onClick={() => setActive(p.id!)}>
          <Avatar name={p.name} color={p.color} />{p.name}
        </button>
      ))}
    </div>
  );
}

export function Hoy({ onCover, goTo }: { onCover: () => void; goTo: (t: 'salud' | 'perfil') => void }) {
  const { active, today, refresh, migrated, health, profiles, afterSave } = useStore();
  const toast = useToast();
  const [sheet, setSheet] = useState<false | 'sym' | 'margin' | 'pin' | 'period'>(false);
  const { privacy, setActive } = useStore();
  const [pinNag, setPinNag] = useState(false);
  useEffect(() => { if (!privacy.lock) getSetting('pinPromptDismissed', false).then(d => setPinNag(!d)); else setPinNag(false); }, [privacy.lock]);
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
    const prevRange = A.rangeStart && A.rangeEnd && A.next ? { from: A.rangeStart, to: A.rangeEnd, next: A.next } : null;
    await savePeriod({ profileId: profile.id, start: today, end: '', flow: 'Normal', note: '', trying: profile.trying });
    if (profile.notYet) await saveProfile({ ...profile, notYet: false });
    await refresh();
    // Cuánto acertó la estimación
    let msg = profile.kind === 'child' ? 'Anotado para ' + profile.name : 'Anotado: te vino hoy';
    if (prevRange) {
      const diff = daysBetween(prevRange.next, today);
      msg += today >= prevRange.from && today <= prevRange.to ? (diff === 0 ? ' · la app acertó el día' : ` · dentro de los posibles días (${Math.abs(diff)} ${Math.abs(diff) === 1 ? 'día' : 'días'} ${diff > 0 ? 'después' : 'antes'})`) : ` · se corrió ${plural(Math.abs(diff), 'día', 'días')}`;
    }
    toast(msg);
    afterSave();
  }

  // Alertas del perfil
  const alerts: { kind: string; text: string }[] = [];
  if (migrated) alerts.push({ kind: 'ok', text: 'Pasamos tus registros de la versión anterior.' });
  if (last && profile.kind === 'self') {
    const prev = A.rows[A.rows.length - 2];
    prev?.flags.filter(f => !f.text.startsWith('Sangrado')).forEach(f => alerts.push({ kind: f.level === 'alert' ? 'bad' : 'warn', text: `Cambio en tu último ciclo: ${f.text} (${prev.cycle} días).` }));
    last.flags.filter(f => f.text.startsWith('Sangrado')).forEach(f => alerts.push({ kind: f.level === 'alert' ? 'bad' : 'warn', text: `Último período: ${f.text}.` }));
  }
  if (A.late > 0 && A.rangeEnd) alerts.push({ kind: profile.kind === 'self' ? 'bad' : 'info', text: `${plural(A.late, 'día', 'días')} de atraso: los posibles días terminaban el ${fmtShort(A.rangeEnd)}.` });
  if (A.adapting && profile.kind === 'self') alerts.push({ kind: 'info', text: 'Estás en los primeros ciclos después de dejar las pastillas: es normal que varíen. El rango es más amplio y no te marco alertas de cambio.' });
  const reps = profile.kind === 'self' ? patterns(active.symptoms, A.rows) : [];

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
      {profile.kind === 'child' && (
        <div className="alert famnote" role="status"><Icon.pen /><div className="grow">Estás anotando los días de <b>{profile.name}</b></div>
          <button type="button" className="btn link" style={{ color: 'inherit', minHeight: 36, fontSize: 13.5 }} onClick={() => setActive(1)}>Volver a mí</button></div>
      )}

      {pinNag && (
        <div className="alert info"><span className="dot" /><div><b>Poné un PIN.</b> Así nadie puede abrir Meneia si dejás el celular desbloqueado.
          <div className="row" style={{ marginTop: 8, gap: 8 }}>
            <button type="button" className="btn small" onClick={() => setSheet('pin')}>Poner PIN</button>
            <button type="button" className="btn link" style={{ fontSize: 13 }} onClick={() => { setSetting('pinPromptDismissed', true); setPinNag(false); }}>Ahora no</button>
          </div></div></div>
      )}
      {alerts.length > 0 && <div className="alerts">{alerts.map((a, i) => <div key={i} className={'alert ' + a.kind}><span className="dot" /><div>{a.text}</div></div>)}</div>}

      {profile.notYet ? (
        <div className="card fam">
          <span className="eyebrow">{profile.name}{age != null ? ` · ${age} años` : ''}</span>
          <h2>Todavía no le vino</h2>
          <p className="muted" style={{ fontSize: 14 }}>Cuando le venga por primera vez, anotalo y la app empieza a estimar sus fechas. Mientras tanto, conviene que tenga un kit en la mochila: una toallita, una bombacha de repuesto y algo para el dolor.</p>
          <button type="button" className="btn fam" onClick={() => setSheet('period')}>Le vino</button>
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
                  <span className="ring-big num">{daysLeft != null && daysLeft > 0 ? daysLeft : A.late > 0 ? A.late : (A.rangeEnd ? Math.max(0, daysBetween(today, A.rangeEnd)) : 0)}</span>
                  <span className="muted" style={{ fontSize: 14 }}>{daysLeft != null && daysLeft > 0 ? 'días para el período' : A.late > 0 ? (A.late === 1 ? 'día de atraso' : 'días de atraso') : daysLeft === 0 ? 'hoy es el día más probable' : 'posibles días que quedan'}</span>
                </>
              ) : <span className="muted" style={{ fontSize: 14, maxWidth: 150 }}>{profile.kind === 'child' ? 'Anotá su último período para empezar' : 'Anotá tu último período para empezar'}</span>}
            </div>
          </div>
          {A.next && A.rangeStart && A.rangeEnd && (
            <div className="next">
              {A.irregular || A.margin >= 4 ? <><span className="eyebrow">Posibles días</span><b>Del {fmtShort(A.rangeStart)} al {fmtShort(A.rangeEnd)}</b><span className="muted" style={{ fontSize: 13.5 }}>Lo más probable: alrededor del {fmtShort(A.next)}</span></>
                : <><b>{cap(fmtLong(A.next))}</b><span className="muted" style={{ fontSize: 13.5 }}>Entre el {fmtShort(A.rangeStart)} y el {fmtShort(A.rangeEnd)}</span></>}
              <div className="row" style={{ justifyContent: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <span className="flag" style={{ background: 'var(--soft)', color: 'var(--plum)' }}>{CONFIDENCE_TEXT[A.confidence]}{A.valid.length ? ` · ${plural(A.valid.length, 'ciclo', 'ciclos')}` : ''}</span>
                {A.irregular && <span className="flag warn">Ciclos irregulares</span>}
                <button type="button" className="btn link" style={{ minHeight: 32, fontSize: 13 }} onClick={() => setSheet('margin')}>Ajustar{profile.margin != null ? ` (±${A.margin})` : ''}</button>
              </div>
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
            {profile.kind === 'child' && !ongoing
              ? <button type="button" className="btn fam" onClick={() => setSheet('period')}>Le vino a {profile.name}</button>
              : <button type="button" className="btn period" onClick={meVino}>{ongoing ? 'Terminó hoy' : 'Me vino'}</button>}
            <button type="button" className="btn ghost" style={{ flex: 'none' }} onClick={() => setSheet('sym')}>Cómo estoy</button>
          </div>
        </>
      )}

      {profile.kind === 'self' && <PillToday />}
      {reps.length > 0 && (
        <div className="card soft" style={{ gap: 4 }}>
          <span className="muted" style={{ fontSize: 12 }}>Lo que se repite</span>
          {reps.slice(0, 2).map((r, i) => <span key={i} style={{ fontSize: 14 }}><b>{r.what}</b> {r.when}, en {r.hits} de tus últimos {r.of} ciclos.</span>)}
        </div>
      )}
      {consultOld && (
        <button type="button" className="list" onClick={() => goTo('salud')} style={{ padding: 0, textAlign: 'left' }}>
          <span className="list-item"><span className="dot" style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--plum)', flex: 'none' }} /><span className="grow"><b>Control con la ginecóloga</b><small>La última fue hace más de 11 meses</small></span><Icon.chev /></span>
        </button>
      )}
      {sheet === 'sym' && <SymptomSheet date={today} onClose={() => setSheet(false)} />}
      {sheet === 'margin' && <MarginSheet onClose={() => setSheet(false)} />}
      {sheet === 'pin' && <PinSheet onClose={() => setSheet(false)} />}
      {sheet === 'period' && <PeriodSheet defaultStart={today} onClose={() => setSheet(false)} />}
    </div>
  );
}
