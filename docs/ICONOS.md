# Íconos de Meneia

Todo sale del archivo maestro `branding/meneia-icono-maestro.png`: 1254 × 1254 px, RGB opaco y cuadrado sin bordes redondeados. Es la M marfil con fases lunares sobre violeta oscuro (`#140334`), la versión aprobada por la dueña (`meneia-icono-lunar-alta-resolucion.png`).

Los generadores comparten `scripts/marca.mjs`, donde están el maestro, los colores y los recortes. Para regenerar todo:

```
npm run icons        # web, PWA, marca de la app e ícono de Google Play
npm run android:res  # Android: íconos, notificación y pantalla de inicio
npm run ios:res      # iPhone: AppIcon y pantalla de inicio
npx cap sync
```

## Archivos generados

| Plataforma | Archivo | Tamaño | Cómo |
|---|---|---|---|
| App | `src/assets/meneia/marca.png` | 384 × 384 | Cuadrado; el CSS lo redondea. Se usa en la bienvenida, Acerca de, el bloqueo y Perfil. |
| Android | `res/mipmap-*/ic_launcher.png` | 48dp (48 a 192 px) | Esquinas redondeadas (22,5 %), transparente afuera. |
| Android | `res/mipmap-*/ic_launcher_round.png` | 48dp | Círculo. |
| Android | `res/mipmap-*/ic_launcher_background.png` | 108dp | Violeta liso `#140334`. |
| Android | `res/mipmap-*/ic_launcher_foreground.png` | 108dp | El maestro al 84 %: la figura queda en 27dp de radio, dentro de la zona segura de 33dp. |
| Android | `res/mipmap-*/ic_launcher_monochrome.png` | 108dp | Silueta blanca para íconos temáticos (Android 13+). |
| Android | `res/mipmap-anydpi-v26/ic_launcher*.xml` | — | Ícono adaptable: fondo, figura y monocromo. |
| Android | `res/drawable-*/ic_stat_ciclo.png` | 24dp | Silueta blanca para las notificaciones. Reemplaza el vector anterior. |
| Android | `res/drawable*/splash.png` | Todas | Fondo de la app `#120b23` con el ícono redondeado al centro. |
| iPhone | `Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` | 1024 × 1024 | RGB opaco, sin transparencia ni esquinas. Xcode usa este único tamaño. |
| iPhone | `Assets.xcassets/Splash.imageset/splash-2732x2732*.png` | 2732 × 2732 | Fondo de la app con el ícono redondeado. |
| Web / PWA | `public/pwa-192.png`, `public/pwa-512.png` | 192, 512 | Esquinas redondeadas (propósito "any"). |
| Web / PWA | `public/maskable-512.png` | 512 | Cuadrado completo; la figura ya está dentro del 80 % seguro. |
| Web | `public/apple-touch-icon.png` | 180 | Cuadrado opaco; Safari lo redondea. |
| Web | `public/favicon.svg` | 96 | SVG con el PNG adentro, para que las páginas públicas no cambien sus enlaces. |
| Google Play | `store-assets/android/icono-play-512.png` | 512 × 512 | PNG de 32 bits, cuadrado completo; Play lo redondea. Se sube a mano en la ficha. |

## Controles hechos

- **Adaptable de Android:** círculo, squircle, cuadrado redondeado y gota. La M, las lunas y la órbita quedan dentro de la zona segura en las cuatro máscaras.
- **iPhone:** con la máscara de esquinas continuas no se recorta nada. El ícono de 1024 no tiene canal alfa.
- **Tamaños chicos:** la M y las lunas se leen a 28 y 48 px, y a 16 y 32 px en la pestaña del navegador. La órbita fina se aclara en los tamaños más chicos, como en el diseño original.
