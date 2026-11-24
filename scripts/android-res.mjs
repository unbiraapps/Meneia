// Íconos, notificación y pantalla de inicio de Android a partir del ícono maestro (scripts/marca.mjs).
import sharp from 'sharp';
import { writeFileSync, rmSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { APP_BG, ICON_BG, inset, masked, silhouette } from './marca.mjs';
const RES = 'android/app/src/main/res';

// Ícono adaptable (lienzo 108dp; las máscaras muestran el círculo central de 72dp, zona segura de 66dp).
// La figura del maestro llega al 30% del lado desde el centro: al 84% queda en 27dp de radio, dentro de los 33dp seguros.
const FG_SCALE = 0.84;
const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, k] of Object.entries(dens)) {
  const dir = `${RES}/mipmap-${d}`;
  await (await masked(48 * k, 0.225)).toFile(`${dir}/ic_launcher.png`);        // clásico, esquinas redondeadas
  await (await masked(48 * k, 'circle')).toFile(`${dir}/ic_launcher_round.png`); // redondo
  await (await inset(108 * k, FG_SCALE)).png().toFile(`${dir}/ic_launcher_foreground.png`);
  await sharp({ create: { width: 108 * k, height: 108 * k, channels: 3, background: ICON_BG } }).png().toFile(`${dir}/ic_launcher_background.png`);
  await (await silhouette(108 * k, FG_SCALE)).png().toFile(`${dir}/ic_launcher_monochrome.png`);
}
const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>
</adaptive-icon>
`;
writeFileSync(`${RES}/mipmap-anydpi-v26/ic_launcher.xml`, adaptive);
writeFileSync(`${RES}/mipmap-anydpi-v26/ic_launcher_round.xml`, adaptive);
for (const f of [`${RES}/drawable-v24/ic_launcher_foreground.xml`, `${RES}/drawable/ic_launcher_background.xml`]) if (existsSync(f)) rmSync(f);
writeFileSync(`${RES}/values/ic_launcher_background.xml`, `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${ICON_BG}</color>\n</resources>\n`);

// Ícono de notificaciones: silueta blanca de la M lunar (Android la tiñe). 24dp, con un margen chico.
if (existsSync(`${RES}/drawable/ic_stat_ciclo.xml`)) rmSync(`${RES}/drawable/ic_stat_ciclo.xml`);
for (const [d, k] of Object.entries(dens)) {
  const dir = `${RES}/drawable-${d}`;
  if (!existsSync(dir)) mkdirSync(dir);
  // La figura ocupa el 60% central del maestro: se agranda para que llene el ícono de 24dp
  await (await silhouette(24 * k, 1.55)).png().toFile(`${dir}/ic_stat_ciclo.png`);
}

// Pantalla de inicio: fondo de la app con el ícono redondeado al centro
for (const dir of readdirSync(RES).filter(d => d.startsWith('drawable'))) {
  const f = `${RES}/${dir}/splash.png`;
  if (!existsSync(f)) continue;
  const { width, height } = await sharp(f).metadata();
  const s = Math.round(Math.min(width, height) * 0.28);
  const icon = await (await masked(s, 0.225)).toBuffer();
  await sharp({ create: { width, height, channels: 4, background: APP_BG } }).composite([{ input: icon, gravity: 'center' }]).png().toFile(f + '.tmp');
  rmSync(f); await sharp(f + '.tmp').toFile(f); rmSync(f + '.tmp');
}
console.log('ok');
