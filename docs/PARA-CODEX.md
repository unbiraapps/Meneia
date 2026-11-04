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

- [x] **Subida automática del APK al Drive de unbira.** El workflow `App de Android` ya tiene el paso "Subir al Drive de unbira": corre solo si existe el secreto `RCLONE_CONF`.
  1. Crear en el Drive de la cuenta de unbira la carpeta `Meneia/APK`.
  2. Con rclone en la compu de la dueña: `rclone config` › nuevo remoto llamado exactamente `unbira`, tipo `drive`, scope `drive` (acceso completo) o `drive.file`, y autorizar con la cuenta de unbira en el navegador.
  3. Copiar el contenido completo de `rclone.conf` (`rclone config file` muestra dónde está) al secreto de GitHub `RCLONE_CONF` del repo `unbiraapps/Meneia`. Ese archivo tiene un token: no subirlo al repo ni pegarlo en chats.
  4. Si la carpeta tiene otro nombre, crear la variable de Actions `DRIVE_FOLDER` con la ruta (por ejemplo `Apps/Meneia`).
  5. Correr el workflow a mano (Actions › App de Android › Run workflow) y verificar que aparezcan `Meneia/APK/meneia.apk` y una copia con fecha en `Meneia/APK/anteriores/`.
  Mientras no esté, subir a mano el APK de https://github.com/unbiraapps/Meneia/releases/download/ultima-version/meneia.apk a esa carpeta.

### Resultado de Drive (2026-11-04)

- Cuenta autorizada por la dueña: `unbiraapps@gmail.com`. Remoto `unbira`, alcance `drive.file` (archivos usados con rclone).
- Carpeta `Meneia/APK`: https://drive.google.com/drive/u/0/folders/14aGADyhyMKo-HMdwPD2v_XeoSLACCJOr
- Subida manual completada mediante rclone fuera del workflow: `meneia.apk`, 5.980.932 bytes, correspondiente al armado exitoso `41897777856` (commit `5f479e7`). SHA-256 verificado contra el archivo descargado: `6d5bb59294c6bf710f00a93dae39b25c2fb63e047771abdc734f2c2728772f6e`.
- Secreto `RCLONE_CONF` cargado cifrado en GitHub Actions; no hay tokens ni configuración de acceso en el repo. Copia local protegida fuera del repo, en `C:\Users\lenovo\Documents\Meneia-firma\Drive`.
- Se conserva la ruta por defecto `Meneia/APK`; no hizo falta definir `DRIVE_FOLDER`.
- Workflow manual de prueba: https://github.com/unbiraapps/Meneia/actions/runs/41899977280. Finalizó en `success`, incluido el paso "Subir al Drive de unbira".
- Se verificaron `Meneia/APK/meneia.apk` y `Meneia/APK/anteriores/meneia_2026-11-04_1649.apk`, ambos de 5.980.932 bytes. SHA-256 de ambos y del APK publicado por ese workflow en GitHub: `ea3f0fcb4fa063a36eed9a3ca27546fc1d0bcbfebaa5fb7ebbffa28e28d5ccb5`. La copia actual reemplazó correctamente la subida manual.
- Verificaciones locales previas al commit: `npm test` (40 pruebas) y `npm run build`, sin errores.
- Mantenimiento: rclone v1.75.2 advirtió que su cliente OAuth compartido será retirado durante 2026. Migrar a un cliente OAuth propio de unbira y reautorizar/actualizar `RCLONE_CONF` para evitar una interrupción futura.

## Anuncios y Google Play (etapa 4: el código ya está)

El código de anuncios y de "Sin anuncios" ya está en la app y usa IDs de prueba de Google hasta que estén los reales.
- [ ] **App en Play Console:** la cuenta de desarrollador ya existe. Crear la app "Meneia", paquete `app.meneia`, gratuita, categoría Salud y bienestar, idioma español (Argentina). Activar la firma de apps de Google Play con la clave de subida que está en los secretos (alias `meneia`).
- [ ] **AdMob:** crear la app Android `app.meneia` y tres bloques: banner adaptable, intersticial y bonificado. Cargar en los secretos del repo: `ADMOB_APP_ID` (formato `ca-app-pub-…~…`), `ADMOB_BANNER_ID`, `ADMOB_INTERSTITIAL_ID` y `ADMOB_REWARDED_ID` (formato `ca-app-pub-…/…`). En AdMob › Bloquear contenido: bloquear las categorías sensibles (sexualidad, citas, embarazo/bebés si aparece, apuestas). La app pide siempre anuncios no personalizados.
- [ ] **app-ads.txt:** AdMob pide publicarlo en el dominio de la ficha de Play. Si el sitio del desarrollador es `unbiraapps.com`, poner `https://unbiraapps.com/app-ads.txt` con la línea que da AdMob. Si fuera `meneia.unbiraapps.com`, avisar en `docs/PARA-CLAUDE.md` y lo agrego en `public/app-ads.txt`.
- [ ] **Mensaje de consentimiento (UMP):** en AdMob › Privacidad y mensajería, crear el mensaje de GDPR para Europa. La app ya lo muestra solo donde Google lo pide.
- [ ] **Producto "Sin anuncios":** en Play Console › Monetizar › Productos integrados, crear un producto único con ID exacto `sin_anuncios`. El precio lo define la dueña.
- [ ] **Ficha y formularios de Play:** público objetivo **18 años o más** (la app no está dirigida a menores: los perfiles de hijas los maneja una persona adulta); formulario de apps de salud (Seguimiento del período); Seguridad de los datos: la app **sí** muestra anuncios y comparte el ID de publicidad y datos del dispositivo con AdMob; los datos de salud **no** se recopilan ni se comparten (quedan en el celular); política de privacidad `https://meneia.unbiraapps.com/privacidad`. Declarar el permiso de ID de publicidad.
- [ ] Subir `meneia.aab` (sale en cada release: `https://github.com/unbiraapps/Meneia/releases/download/ultima-version/meneia.aab`) a la prueba cerrada.

## Más adelante

- [ ] Prueba cerrada con el servicio de testers contratado (12 personas, 14 días seguidos). Lo coordina la dueña.


### Publicación: preparación en curso (2026-11-04)

- Cuenta de desarrollador existente: Unbira, ID `7592822914289724121`, sesión `bdalonso87@gmail.com`. No crear cuenta nueva en `unbiraapps@gmail.com`.
- Alta preparada: Meneia, paquete `app.meneia` disponible, aplicación gratuita. Play ofrece `Español (Latinoamérica), es-419`; no hay variante `es-AR` en el selector. El alta aún requiere confirmación de la dueña sobre las declaraciones de políticas y exportación.
- Precio propuesto y aprobado condicionalmente por la dueña: USD 9,99, pago único para `sin_anuncios`, siempre que sea superior a Código de Estilo. En Play, Código de Estilo figura gratuita y sin productos únicos. Si la comparación es con una venta externa, falta confirmar ese importe. Producto aún no creado ni activado.
- Materiales faltantes de ficha pedidos a Claude en `docs/PARA-CLAUDE.md`: gráfico destacado, capturas y textos.
