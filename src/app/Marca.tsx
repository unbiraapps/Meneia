// Marca de Meneia (M lunar aprobada). PROVISORIA: recorte de la captura de la maqueta,
// hasta tener el archivo original. Ver src/assets/meneia/LEEME.md.
import marca from '../assets/meneia/marca-provisoria.png';

export function Marca({ size = 74, label }: { size?: number; label?: string }) {
  return <img className="marca" src={marca} width={size} height={size} alt={label ?? ''} aria-hidden={label ? undefined : true} />;
}
