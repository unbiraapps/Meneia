import { useState } from 'react';
import { ageOn } from '../calc';
import { saveProfile, setSetting } from '../db';
import { useStore } from './store';

/** Primera vez: fecha de nacimiento y qué querés seguir. Buscar embarazo solo con 18 años o más. */
export function Inicio({ onDone }: { onDone: (fam: boolean) => void }) {
  const { self, today, refresh } = useStore();
  const [step, setStep] = useState(1);
  const [birth, setBirth] = useState(self?.profile.birthDate ?? '');
  const [tryOn, setTryOn] = useState(false);
  const [fam, setFam] = useState(false);
  const age = ageOn(birth, today);
  const adult = age != null && age >= 18;

  async function finish() {
    await saveProfile({ ...self!.profile, birthDate: birth, trying: adult && tryOn });
    await setSetting('onboarded', true);
    await refresh();
    onDone(fam);
  }

  return (
    <div className="screen plain">
      <span className="eyebrow">Meneia · paso {step} de 2</span>
      {step === 1 ? (
        <>
          <h1 style={{ fontSize: 30 }}>¿Cuándo naciste?</h1>
          <p className="muted" style={{ fontSize: 14.5 }}>Lo usamos solo para mostrarte lo que corresponde a tu edad. Queda guardado en este celular.</p>
          <label className="field">Fecha de nacimiento<input type="date" value={birth} max={today} onChange={e => setBirth(e.target.value)} /></label>
          <div style={{ marginTop: 'auto' }} className="stack">
            <button type="button" className="btn" onClick={() => setStep(2)}>Continuar</button>
            <button type="button" className="btn link" onClick={() => { setBirth(''); setStep(2); }}>Prefiero no decirlo</button>
          </div>
        </>
      ) : (
        <>
          <h1 style={{ fontSize: 30 }}>¿Qué querés seguir?</h1>
          <p className="muted" style={{ fontSize: 14.5 }}>Lo cambiás cuando quieras desde Perfil.</p>
          <div className="choice on" aria-label="Mi ciclo, siempre activo">
            <span className="ico" style={{ background: 'var(--plum)' }}>C</span>
            <span className="stack grow"><b style={{ font: '700 17px var(--display)' }}>Mi ciclo</b><span className="muted" style={{ fontSize: 13 }}>Períodos, próximo período y avisos.</span></span>
            <span className="check" style={{ background: 'var(--plum)', color: '#17131F', borderColor: 'transparent' }}>✓</span>
          </div>
          <button type="button" className={'choice try' + (tryOn && adult ? ' on' : '')} aria-pressed={tryOn && adult} disabled={!adult} onClick={() => setTryOn(!tryOn)}>
            <span className="ico" style={{ background: 'var(--try)' }}>E</span>
            <span className="stack grow"><b style={{ font: '700 17px var(--display)', color: 'var(--try)' }}>Buscar embarazo</b><span className="muted" style={{ fontSize: 13 }}>{adult ? 'Mejores días para buscar y cuántos ciclos llevás.' : 'Solo para mayores de 18 años.'}</span></span>
            <span className="check" style={tryOn && adult ? { background: 'var(--try)', color: '#2A1024', borderColor: 'transparent' } : undefined}>{tryOn && adult ? '✓' : ''}</span>
          </button>
          <button type="button" className={'choice fam' + (fam ? ' on' : '')} aria-pressed={fam} onClick={() => setFam(!fam)}>
            <span className="ico" style={{ background: 'var(--fam)' }}>F</span>
            <span className="stack grow"><b style={{ font: '700 17px var(--display)', color: 'var(--fam)' }}>Ciclos de mis hijas</b><span className="muted" style={{ fontSize: 13 }}>Sus fechas y un aviso para comprar lo que haga falta.</span></span>
            <span className="check" style={fam ? { background: 'var(--fam)', color: '#14231F', borderColor: 'transparent' } : undefined}>{fam ? '✓' : ''}</span>
          </button>
          <p className="muted" style={{ fontSize: 13 }}>Si no elegís "Buscar embarazo", la app no te muestra nada sobre embarazo. Los perfiles de tus hijas nunca muestran fertilidad.</p>
          <div style={{ marginTop: 'auto' }} className="stack">
            <button type="button" className="btn" onClick={finish}>Empezar</button>
            <button type="button" className="btn link" onClick={() => setStep(1)}>Volver</button>
          </div>
        </>
      )}
    </div>
  );
}
