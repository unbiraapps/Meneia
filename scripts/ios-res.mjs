// Genera el ícono (1024×1024, RGB opaco, sin esquinas: iOS aplica su máscara) y la pantalla de inicio de iPhone,
// con el mismo diseño que Android (scripts/android-res.mjs). Apple rechaza íconos con transparencia.
import sharp from 'sharp';
const SET = 'ios/App/App/Assets.xcassets';
const grad = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#816BB4"/><stop offset=".55" stop-color="#9A8DD9"/><stop offset="1" stop-color="#C67CCB"/></linearGradient></defs>`;
const mark = (cx, cy, r, sw) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#fff" stroke-width="${sw}" stroke-dasharray="${2 * Math.PI * r * 0.697} ${2 * Math.PI * r * 0.303}" stroke-linecap="round" transform="rotate(-35 ${cx} ${cy})"/><circle cx="${cx}" cy="${cy - r}" r="${r * 0.297}" fill="#fff"/>`;
const svg = body => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${grad}${body}</svg>`);

// Ícono: cuadrado lleno (sin rx), la misma figura que el ícono de Android
const icon = svg(`<rect width="512" height="512" fill="url(#g)"/>${mark(256, 268, 128, 34)}`);
await sharp(icon).resize(1024, 1024).flatten({ background: '#9A8DD9' }).removeAlpha().png().toFile(`${SET}/AppIcon.appiconset/AppIcon-512@2x.png`);

// Pantalla de inicio: fondo oscuro de la app con el ícono redondeado al centro
const rounded = svg(`<rect width="512" height="512" rx="112" fill="url(#g)"/>${mark(256, 268, 128, 34)}`);
const small = await sharp(rounded).resize(560, 560).png().toBuffer();
for (const f of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png'])
  await sharp({ create: { width: 2732, height: 2732, channels: 3, background: '#17131F' } }).composite([{ input: small, gravity: 'center' }]).png().toFile(`${SET}/Splash.imageset/${f}`);
console.log('ok');
