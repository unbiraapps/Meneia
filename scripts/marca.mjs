// Ícono aprobado de Meneia (M lunar marfil sobre violeta oscuro).
// Todo sale del archivo maestro: branding/meneia-icono-maestro.png (1254×1254, RGB, cuadrado sin bordes redondeados).
import sharp from 'sharp';

export const MASTER = 'branding/meneia-icono-maestro.png';
export const ICON_BG = '#140334';   // fondo del maestro (promedio del borde)
export const APP_BG = '#120b23';    // fondo de la app (paleta nocturna)

const svgMask = (size, shape) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${
  shape === 'circle' ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/>` : `<rect width="${size}" height="${size}" rx="${size * shape}"/>`
}</svg>`);

/** El maestro a un tamaño, cuadrado y opaco. */
export const square = size => sharp(MASTER).resize(size, size, { kernel: 'lanczos3' }).removeAlpha();

/** Con esquinas redondeadas (rx en fracción del lado) o en círculo, con transparencia afuera. */
export async function masked(size, shape = 0.225) {
  const img = await square(size).ensureAlpha().png().toBuffer();
  return sharp(img).composite([{ input: svgMask(size, shape), blend: 'dest-in' }]).png();
}

/** El maestro achicado a `scale` y centrado sobre su mismo fondo (para zonas seguras de máscaras). */
export async function inset(size, scale) {
  const s = Math.round(size * scale);
  const img = await square(s).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 3, background: ICON_BG } }).composite([{ input: img, gravity: 'center' }]);
}

/** Silueta blanca con transparencia (marfil y lavanda → blanco). Para el ícono monocromo y el de notificaciones. */
export async function silhouette(size, scale = 1) {
  const s = Math.round(size * scale);
  const { data, info } = await square(s).raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    const l = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    out[j] = out[j + 1] = out[j + 2] = 255;
    out[j + 3] = Math.max(0, Math.min(255, Math.round((l - 22) * 1.75)));
  }
  let img = await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  if (s > size) { const o = Math.floor((s - size) / 2); img = await sharp(img).extract({ left: o, top: o, width: size, height: size }).png().toBuffer(); }
  return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: img, gravity: 'center' }]);
}
