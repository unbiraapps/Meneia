// Genera los íconos PNG a partir del SVG
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
const svg = readFileSync('public/favicon.svg');
// Versión "maskable": mismo dibujo más chico sobre fondo completo (Android recorta los bordes)
const maskable = Buffer.from(readFileSync('public/favicon.svg', 'utf8')
  .replace('rx="112"', 'rx="0"')
  .replace(/<circle/g, '<circle transform-origin="256 256"').replace('<circle transform-origin="256 256" cx="256" cy="268"', '<g transform="translate(51 51) scale(.8)"><circle cx="256" cy="268"').replace('fill="#fff"/>\n</svg>', 'fill="#fff"/></g>\n</svg>'));
const out = [['pwa-192.png', 192, svg], ['pwa-512.png', 512, svg], ['apple-touch-icon.png', 180, svg], ['maskable-512.png', 512, maskable]];
for (const [name, size, src] of out) await sharp(src).resize(size, size).png().toFile('public/' + name);
console.log('ok');
