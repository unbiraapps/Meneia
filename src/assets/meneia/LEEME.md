# Marca de Meneia (M lunar)

`marca-provisoria.png` es un recorte de 77×77 px de la captura que trae la maqueta aprobada
(`meneia-identidad/index.html`). Se usa **solo de forma provisoria** en Bienvenida y Acerca de,
a 72–88 px, hasta tener el archivo original.

Cuando llegue el original (SVG o PNG de 1024 px o más):
1. Guardarlo acá como `marca.svg` (o `marca.png`) y cambiar el import en `src/app/Marca.tsx`.
2. Regenerar los íconos de Android (`node scripts/android-res.mjs`) y de iPhone (`npm run ios:res`)
   a partir de ese original. No usar esta captura ampliada como ícono final.
