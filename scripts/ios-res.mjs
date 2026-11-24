// Ícono de iPhone (1024×1024, RGB opaco, sin esquinas: iOS aplica su máscara) y pantalla de inicio,
// a partir del ícono maestro (scripts/marca.mjs). Apple rechaza íconos con transparencia.
import sharp from 'sharp';
import { APP_BG, masked, square } from './marca.mjs';
const SET = 'ios/App/App/Assets.xcassets';

await square(1024).png().toFile(`${SET}/AppIcon.appiconset/AppIcon-512@2x.png`);

// Pantalla de inicio: fondo de la app con el ícono redondeado al centro
const small = await (await masked(560, 0.225)).toBuffer();
for (const f of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png'])
  await sharp({ create: { width: 2732, height: 2732, channels: 3, background: APP_BG } }).composite([{ input: small, gravity: 'center' }]).png().toFile(`${SET}/Splash.imageset/${f}`);
console.log('ok');
