// Íconos web y PWA, marca de la app y el ícono de Google Play, a partir del ícono maestro (scripts/marca.mjs).
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { masked, square } from './marca.mjs';

// PWA: "any" con esquinas redondeadas; "maskable" cuadrado completo (la figura ya está dentro del 80% seguro)
await (await masked(192)).toFile('public/pwa-192.png');
await (await masked(512)).toFile('public/pwa-512.png');
await square(512).png().toFile('public/maskable-512.png');
// iPhone (Safari) redondea solo: cuadrado opaco
await square(180).png().toFile('public/apple-touch-icon.png');
// Favicon: SVG con el PNG adentro, para no cambiar los enlaces de las páginas públicas
const fav = await (await masked(96)).toBuffer();
writeFileSync('public/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><image width="96" height="96" href="data:image/png;base64,${fav.toString('base64')}"/></svg>\n`);
// Marca dentro de la app (bienvenida, Acerca de, bloqueo): cuadrada, el CSS redondea
await square(384).png({ compressionLevel: 9 }).toFile('src/assets/meneia/marca.png');
// Google Play: 512×512, PNG de 32 bits, cuadrado completo (Play aplica su máscara)
await square(512).ensureAlpha().png().toFile('store-assets/android/icono-play-512.png');
console.log('ok');
