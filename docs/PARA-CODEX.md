# Pendientes para Codex

Tareas fuera del repositorio. Marcá con `[x]` y anotá el resultado debajo de cada una, sin claves ni contraseñas.

## Ahora

- [ ] **Firma de la app.** Generar un keystore de Android (alias `meneia`) y guardarlo en un lugar seguro de la dueña. Cargar en Settings › Secrets and variables › Actions del repo `unbiraapps/Meneia`:
  - `ANDROID_KEYSTORE_BASE64` (el archivo .jks en base64)
  - `ANDROID_KEYSTORE_PASSWORD`
  - `ANDROID_KEY_ALIAS` (`meneia`)
  - `ANDROID_KEY_PASSWORD`
  Importante: si se pierde este keystore, no se puede actualizar la app en Google Play.
- [ ] **Web en Cloudflare Pages.** Proyecto conectado al repo `unbiraapps/Meneia`, rama `main`, comando `npm run build`, carpeta `dist`, Node 22. Dominio propio `meneia.unbiraapps.com`.

## Más adelante (etapa 4)

- [ ] Cuenta de Google Play Console y app "Meneia" (paquete `app.meneia`).
- [ ] AdMob: app y bloques de anuncios (banner, pantalla completa, con premio). Pasar los IDs a los secretos `ADMOB_APP_ID`, `ADMOB_BANNER_ID`, `ADMOB_INTERSTITIAL_ID` y `ADMOB_REWARDED_ID`. Bloquear las categorías sensibles.
- [ ] Producto de pago "sin_anuncios" en Play Console. El precio lo define la dueña.
- [ ] Formulario de apps de salud (Seguimiento del período), sección de seguridad de datos y política de privacidad en `https://meneia.unbiraapps.com/privacidad`.
- [ ] Prueba cerrada con el servicio de testers contratado.
