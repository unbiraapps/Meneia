// Marca de Meneia (M lunar aprobada), generada desde el ícono maestro. Ver src/assets/meneia/LEEME.md.
import marca from '../assets/meneia/marca.png';

export function Marca({ size = 74, label }: { size?: number; label?: string }) {
  return <img className="marca" src={marca} width={size} height={size} alt={label ?? ''} aria-hidden={label ? undefined : true} />;
}
