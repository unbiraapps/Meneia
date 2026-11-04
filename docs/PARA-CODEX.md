# Pendientes para Codex

Tareas fuera del repositorio. Marcá con `[x]` y anotá el resultado debajo de cada una, sin claves ni contraseñas.

## Ahora

- [x] **Firma de la app.** Generar un keystore de Android (alias `meneia`) y guardarlo en un lugar seguro de la dueña. Cargar en Settings › Secrets and variables › Actions del repo `unbiraapps/Meneia`:
  - `ANDROID_KEYSTORE_BASE64` (el archivo .jks en base64)
  - `ANDROID_KEYSTORE_PASSWORD`
  - `ANDROID_KEY_ALIAS` (`meneia`)
  - `ANDROID_KEY_PASSWORD`
  Importante: si se pierde este keystore, no se puede actualizar la app en Google Play.
  Aviso para la dueña: la primera versión firmada con esta clave no se instala encima de la versión de prueba anterior. Antes hay que guardar una copia (Copia de seguridad), desinstalar la versión vieja, instalar la nueva y restaurar la copia.
- [x] **Web en Cloudflare Pages.** Proyecto conectado al repo `unbiraapps/Meneia`, rama `main`, comando `npm run build`, carpeta `dist`, Node 22. Dominio propio `meneia.unbiraapps.com`.

### Resultado de firma (2026-11-04)

- Keystore JKS RSA de 4096 bits, alias `meneia`, generado y verificado. Certificado válido hasta 2126-10-11.
- SHA-256 del certificado: `6B:AA:2B:9B:CC:E4:CC:0A:3F:2E:09:28:BD:82:45:78:AE:A9:8D:61:C1:44:FB:83:84:96:1C:81:89:57:7A:10`.
- Los cuatro secretos solicitados fueron cargados y su existencia se verificó en GitHub Actions. No se guardaron valores secretos en el repositorio.
- Respaldo local de la dueña fuera del repo, en `C:\Users\lenovo\Documents\Meneia-firma`. Acceso restringido al usuario de Windows y SYSTEM; contraseñas cifradas con DPAPI para ese usuario. Conviene conservar una segunda copia recuperable fuera de esta computadora.
- La carga de secretos no cambia el workflow: Claude debe implementar la compilación release firmada, según `docs/PARA-CLAUDE.md`.

### Resultado de Cloudflare Pages (2026-11-04)

- Proyecto `meneia` conectado a `unbiraapps/Meneia`, rama de producción `main`, con despliegue automático en cada push.
- Build: `npm run build`; salida: `dist`; variable `NODE_VERSION=22` para producción y previews; raíz del repositorio.
- Web publicada y verificada en navegador por HTTPS: https://meneia.unbiraapps.com y https://meneia.pages.dev.
- DNS: CNAME `meneia.unbiraapps.com` hacia `meneia.pages.dev`, proxied, TTL automático. Se verificó en la zona `unbiraapps.com`. El 522 inicial desapareció al activarse el dominio.
- Panel: https://dash.cloudflare.com/b1afff1f0d25617022fb22196fc4899c/pages/view/meneia
- Primer despliegue exitoso: `6448510f-41ed-4ddc-a1d8-bb6a4a27e0ab`, commit `f5b1dc5062d10008bc089a9fd94a37017516f28d`.
- App oficial Cloudflare Workers and Pages instalada con autorización de la dueña, limitada al repositorio Meneia (instalación GitHub `178654163`).
- No se modificó código de la app ni se agregaron secretos al repositorio. La ruta `/privacidad` sigue siendo trabajo de Claude según el plan.

## Drive para probar la app

- [ ] **Subida automática del APK al Drive de unbira.** El workflow `App de Android` ya tiene el paso "Subir al Drive de unbira": corre solo si existe el secreto `RCLONE_CONF`.
  1. Crear en el Drive de la cuenta de unbira la carpeta `Meneia/APK`.
  2. Con rclone en la compu de la dueña: `rclone config` › nuevo remoto llamado exactamente `unbira`, tipo `drive`, scope `drive` (acceso completo) o `drive.file`, y autorizar con la cuenta de unbira en el navegador.
  3. Copiar el contenido completo de `rclone.conf` (`rclone config file` muestra dónde está) al secreto de GitHub `RCLONE_CONF` del repo `unbiraapps/Meneia`. Ese archivo tiene un token: no subirlo al repo ni pegarlo en chats.
  4. Si la carpeta tiene otro nombre, crear la variable de Actions `DRIVE_FOLDER` con la ruta (por ejemplo `Apps/Meneia`).
  5. Correr el workflow a mano (Actions › App de Android › Run workflow) y verificar que aparezcan `Meneia/APK/meneia.apk` y una copia con fecha en `Meneia/APK/anteriores/`.
  Mientras no esté, subir a mano el APK de https://github.com/unbiraapps/Meneia/releases/download/ultima-version/meneia.apk a esa carpeta.

## Más adelante (etapa 4)

- [ ] Cuenta de Google Play Console y app "Meneia" (paquete `app.meneia`).
- [ ] AdMob: app y bloques de anuncios (banner, pantalla completa, con premio). Pasar los IDs a los secretos `ADMOB_APP_ID`, `ADMOB_BANNER_ID`, `ADMOB_INTERSTITIAL_ID` y `ADMOB_REWARDED_ID`. Bloquear las categorías sensibles.
- [ ] Producto de pago "sin_anuncios" en Play Console. El precio lo define la dueña.
- [ ] Formulario de apps de salud (Seguimiento del período), sección de seguridad de datos y política de privacidad en `https://meneia.unbiraapps.com/privacidad`.
- [ ] Prueba cerrada con el servicio de testers contratado.
