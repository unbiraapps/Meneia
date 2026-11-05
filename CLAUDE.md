# Meneia

App de Android (Capacitor + Vite + TypeScript) para registrar el ciclo menstrual. El plan completo está en `docs/PLAN.md`: leelo antes de empezar y marcá las tareas a medida que las terminás.

## Cómo trabajar acá

- Trabajá de forma autónoma. No hace falta pedir confirmación para editar archivos, instalar paquetes de npm, correr pruebas, compilar ni hacer commit y push a `main`.
- Si algo necesita una cuenta, un panel web o un secreto (Cloudflare, Play Console, AdMob, Supabase, secretos de GitHub), no lo hagas: anotalo en `docs/PARA-CODEX.md` con los pasos exactos y seguí con lo demás.
- Si una decisión no está en `docs/PLAN.md`, tomá la opción más simple y más privada, y anotala en la sección "Decisiones tomadas" del plan.

## Comandos

```
npm install
npm test          # pruebas (vitest)
npm run build     # compila la app web en dist/
npx cap sync android
```

No hay SDK de Android en todos los entornos: el APK lo compila GitHub Actions (`.github/workflows/android.yml`) en cada push a `main`.

## Estructura

- `src/calc.ts`: cálculos puros (ciclos, predicciones, avisos). Todo cálculo nuevo va acá, con pruebas en `tests/`.
- `src/db.ts`: datos locales con Dexie (IndexedDB). Cada cambio de esquema necesita una versión nueva de Dexie y una migración que no pierda datos.
- `src/notify.ts`: notificaciones locales.
- `src/main.ts` y `src/styles.css`: interfaz actual, que se reemplaza por React en la etapa 1.

## Reglas que no se rompen

- Los datos de salud nunca salen del celular sin cifrar. La única excepción es la copia en la nube opcional (`src/cloud.ts`): se cifra en el celular con la contraseña de copia de la usuaria y al servidor llega solo el sobre cifrado. Ningún otro fetch con datos del usuario.
- No se guardan estudios, PDF ni fotos.
- Buscar embarazo solo para perfiles de 18 años o más. Los perfiles de hijas no muestran fertilidad.
- Los avisos nunca dicen "período" ni nombres: el texto es neutro.
- Antes de cada commit, `npm test` y `npm run build` tienen que pasar.
- La interfaz es siempre oscura y en español rioplatense.
