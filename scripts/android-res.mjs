// Genera íconos, notificación y pantalla de inicio de la app de Android con la paleta lila
import sharp from 'sharp';
import { writeFileSync, rmSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
const RES = 'android/app/src/main/res';
const grad = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#816BB4"/><stop offset=".55" stop-color="#9A8DD9"/><stop offset="1" stop-color="#C67CCB"/></linearGradient></defs>`;
const mark = (cx, cy, r, sw) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#fff" stroke-width="${sw}" stroke-dasharray="${2 * Math.PI * r * 0.697} ${2 * Math.PI * r * 0.303}" stroke-linecap="round" transform="rotate(-35 ${cx} ${cy})"/><circle cx="${cx}" cy="${cy - r}" r="${r * 0.297}" fill="#fff"/>`;
const svg = (body, w = 512, h = 512) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${grad}${body}</svg>`);

// Ícono clásico y redondo
const legacy = svg(`<rect width="512" height="512" rx="112" fill="url(#g)"/>${mark(256, 268, 128, 34)}`);
const round = svg(`<circle cx="256" cy="256" r="256" fill="url(#g)"/>${mark(256, 270, 112, 30)}`);
// Ícono adaptable: fondo y figura por separado (lienzo 108dp, zona segura 66dp)
const bg = svg(`<rect width="512" height="512" fill="url(#g)"/>`);
const fg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${mark(256, 268, 92, 25)}</svg>`);

const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, k] of Object.entries(dens)) {
  const dir = `${RES}/mipmap-${d}`;
  await sharp(legacy).resize(48 * k, 48 * k).png().toFile(`${dir}/ic_launcher.png`);
  await sharp(round).resize(48 * k, 48 * k).png().toFile(`${dir}/ic_launcher_round.png`);
  await sharp(fg).resize(108 * k, 108 * k).png().toFile(`${dir}/ic_launcher_foreground.png`);
  await sharp(bg).resize(108 * k, 108 * k).png().toFile(`${dir}/ic_launcher_background.png`);
}
const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
writeFileSync(`${RES}/mipmap-anydpi-v26/ic_launcher.xml`, adaptive);
writeFileSync(`${RES}/mipmap-anydpi-v26/ic_launcher_round.xml`, adaptive);
for (const f of [`${RES}/drawable-v24/ic_launcher_foreground.xml`, `${RES}/drawable/ic_launcher_background.xml`]) if (existsSync(f)) rmSync(f);
writeFileSync(`${RES}/values/ic_launcher_background.xml`, `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#9A8DD9</color>\n</resources>\n`);

// Ícono chico de las notificaciones (blanco, Android lo tiñe)
writeFileSync(`${RES}/drawable/ic_stat_ciclo.xml`, `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">
    <path android:fillColor="#00000000" android:strokeColor="#FFFFFFFF" android:strokeWidth="2.2" android:strokeLineCap="round"
        android:pathData="M8.2,8.6 A6,6 0 1,0 15.8,8.6"/>
    <path android:fillColor="#FFFFFFFF" android:pathData="M12,4.2 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0"/>
</vector>
`);

// Pantalla de inicio: fondo lila suave con el ícono al centro
for (const dir of readdirSync(RES).filter(d => d.startsWith('drawable'))) {
  const f = `${RES}/${dir}/splash.png`;
  if (!existsSync(f)) continue;
  const { width, height } = await sharp(f).metadata();
  const s = Math.round(Math.min(width, height) * 0.28);
  const icon = await sharp(legacy).resize(s, s).png().toBuffer();
  await sharp({ create: { width, height, channels: 4, background: '#F5F2FB' } }).composite([{ input: icon, gravity: 'center' }]).png().toFile(f + '.tmp');
  rmSync(f); await sharp(f + '.tmp').toFile(f); rmSync(f + '.tmp');
}
console.log('ok');
