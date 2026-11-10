import { useEffect, useState } from 'react';
import unbiraLogo from '../assets/unbiraapps/horizontal-color.png';
import { Marca } from './Marca';
import { Icon, SubHeader } from './ui';

const SITE = 'https://meneia.unbiraapps.com';

/** Acerca de Meneia: marca, versión, enlaces y la firma de la desarrolladora. */
export function Acerca({ onBack, onCopia }: { onBack: () => void; onCopia: () => void }) {
  const [ver, setVer] = useState('');
  useEffect(() => { import('@capacitor/app').then(m => m.App.getInfo()).then(i => setVer(`Versión ${i.version} (${i.build})`)).catch(() => setVer('Versión web')); }, []);
  return (
    <div className="screen">
      <SubHeader title="Acerca de" onBack={onBack} />
      <div className="about-hero">
        <Marca size={74} />
        <h2 className="brand">Meneia</h2>
        <p className="tagline">Tu ciclo, a tu ritmo.</p>
        {ver && <p className="muted" style={{ fontSize: 12.5 }}>{ver}</p>}
      </div>
      <div className="stack" style={{ gap: 8 }}>
        <h3 className="serif-title" style={{ fontSize: 24 }}>Tu historia tiene su propio ritmo.</h3>
        <p className="muted" style={{ fontSize: 14.5 }}>Meneia te acompaña a registrar tu ciclo, reconocer cómo te sentís y organizar tus recordatorios.</p>
      </div>
      <div className="card soft">
        <p style={{ fontSize: 14 }}>Tus registros se guardan en este dispositivo. Podés elegir una copia de seguridad cifrada para recuperarlos.</p>
      </div>
      <div className="list">
        <button type="button" className="list-item" onClick={onCopia}><span className="grow"><b>Copia de seguridad</b></span><Icon.chev /></button>
        <a className="list-item" href={`${SITE}/privacidad/`} target="_blank" rel="noopener"><span className="grow"><b>Política de privacidad</b></span><Icon.chev /></a>
        <a className="list-item" href={`${SITE}/soporte/`} target="_blank" rel="noopener"><span className="grow"><b>Ayuda y contacto</b></span><Icon.chev /></a>
      </div>
      <p className="muted" style={{ fontSize: 12, textAlign: 'center' }}>Las fechas son estimaciones según tus ciclos anteriores. No sirven como método anticonceptivo.</p>
      <div className="stack" style={{ alignItems: 'center', gap: 6, paddingTop: 4 }}>
        {/* Firma de la desarrolladora. El logo a color es para fondos claros: va sobre una placa clara, sin recolorear */}
        <span className="firma"><img src={unbiraLogo} alt="UnbiraApps" width={120} height={28} /></span>
        <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>Creado por UnbiraApps</p>
      </div>
    </div>
  );
}
