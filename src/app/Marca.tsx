// Marca de Meneia (M lunar aprobada), generada desde el ícono maestro. Ver src/assets/meneia/LEEME.md.
import marca from '../assets/meneia/marca.png';

export function Marca({ size = 74, label }: { size?: number; label?: string }) {
  // Si la imagen no carga, queda el recuadro violeta de la marca en vez del ícono de imagen rota
  return <img className="marca" src={marca} width={size} height={size} alt={label ?? ''} aria-hidden={label ? undefined : true} onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />;
}
