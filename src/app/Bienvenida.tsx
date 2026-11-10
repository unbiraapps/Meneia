import { Marca } from './Marca';

/** Primera pantalla, solo para quien instala Meneia por primera vez (antes de los pasos de Inicio). */
export function Bienvenida({ onStart, onRestore }: { onStart: () => void; onRestore: () => void }) {
  return (
    <main className="screen plain welcome">
      <div className="hero">
        <Marca size={88} />
        <h1 className="brand">Meneia</h1>
        <p className="tagline">Tu ciclo, a tu ritmo.</p>
      </div>
      <div className="pitch">
        <h2>Un espacio para conocerte mejor.</h2>
        <p>Seguí tu ciclo y cómo te sentís. Conocé tu ritmo y organizá tus recordatorios, día a día.</p>
      </div>
      <div className="actions">
        <button type="button" className="btn" onClick={onStart}>Comenzar</button>
        <button type="button" className="btn link" onClick={onRestore}>Ya uso Meneia</button>
      </div>
    </main>
  );
}
