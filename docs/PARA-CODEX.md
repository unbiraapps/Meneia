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
- [x] **App en Play Console:** la cuenta de desarrollador ya existe. Crear la app "Meneia", paquete `app.meneia`, gratuita, categoría Salud y bienestar, idioma español (Argentina). Activar la firma de apps de Google Play con la clave de subida que está en los secretos (alias `meneia`).
- [ ] **AdMob:** crear la app Android `app.meneia` y tres bloques: banner adaptable, intersticial y bonificado. Cargar en los secretos del repo: `ADMOB_APP_ID` (formato `ca-app-pub-…~…`), `ADMOB_BANNER_ID`, `ADMOB_INTERSTITIAL_ID` y `ADMOB_REWARDED_ID` (formato `ca-app-pub-…/…`). En AdMob › Bloquear contenido: bloquear las categorías sensibles (sexualidad, citas, embarazo/bebés si aparece, apuestas). La app pide siempre anuncios no personalizados.
- [ ] **app-ads.txt:** AdMob pide publicarlo en el dominio de la ficha de Play. Si el sitio del desarrollador es `unbiraapps.com`, poner `https://unbiraapps.com/app-ads.txt` con la línea que da AdMob. Si fuera `meneia.unbiraapps.com`, avisar en `docs/PARA-CLAUDE.md` y lo agrego en `public/app-ads.txt`.
- [ ] **Mensaje de consentimiento (UMP):** en AdMob › Privacidad y mensajería, crear el mensaje de GDPR para Europa. La app ya lo muestra solo donde Google lo pide.
- [ ] **Producto "Sin anuncios":** en Play Console › Monetizar › Productos integrados, crear un producto único con ID exacto `sin_anuncios`. El precio lo define la dueña.
- [ ] **Ficha y formularios de Play:** público objetivo **18 años o más** (la app no está dirigida a menores: los perfiles de hijas los maneja una persona adulta); formulario de apps de salud (Seguimiento del período); Seguridad de los datos: la app **sí** muestra anuncios y comparte el ID de publicidad y datos del dispositivo con AdMob; los datos de salud **no** se recopilan ni se comparten (quedan en el celular); política de privacidad `https://meneia.unbiraapps.com/privacidad`. Declarar el permiso de ID de publicidad.
- [x] Subir `meneia.aab` (sale en cada release: `https://github.com/unbiraapps/Meneia/releases/download/ultima-version/meneia.aab`) a la prueba cerrada.

## Más adelante

- [ ] Prueba cerrada con el servicio de testers contratado (12 personas, 14 días seguidos). Lo coordina la dueña.


### Publicación: preparación en curso (2026-11-04)

- Cuenta de desarrollador existente: Unbira, ID `7592822914289724121`, sesión `bdalonso87@gmail.com`. No crear cuenta nueva en `unbiraapps@gmail.com`.
- Alta preparada: Meneia, paquete `app.meneia` disponible, aplicación gratuita. Play ofrece `Español (Latinoamérica), es-419`; no hay variante `es-AR` en el selector. El alta se completó con autorización expresa de la dueña sobre las declaraciones de políticas y exportación; ver resultado más abajo.
- Precio propuesto y aprobado condicionalmente por la dueña: USD 9,99, pago único para `sin_anuncios`, siempre que sea superior a Código de Estilo. En Play, Código de Estilo figura gratuita y sin productos únicos. Si la comparación es con una venta externa, falta confirmar ese importe. Producto creado como borrador con base USD 9,99 y opciones regionales calculadas por Play; no activado. Ver resultado más abajo.
- Materiales faltantes de ficha pedidos a Claude en `docs/PARA-CLAUDE.md`: gráfico destacado, capturas y textos.


### Alta de Meneia en Play y contacto (2026-11-04)

- App creada: Meneia, paquete `app.meneia`, gratuita, desarrollador Unbira `7592822914289724121`, app ID `4975223863463427352`.
- Panel: https://play.google.com/console/u/1/developers/7592822914289724121/app/4975223863463427352/app-dashboard
- Idioma: `es-419`, Español (Latinoamérica); la consola no ofrece es-AR. Categoría de salud guardada (la traducción es-419 la llama "Salud y deportes").
- Firma de apps de Play activa. Certificado de firma de Play SHA-256: `8D:AB:45:F2:4F:D6:3D:CF:99:75:BA:43:50:8C:16:86:66:DF:76:8B:22:6C:D1:88:81:06:C7:72:19:A9:8B:76`.
- AAB firmado con la clave de subida `meneia` aceptado por Play: versión 16 (1.2), SDK objetivo 36, Android 24+. La dueña confirmó en el chat la huella pública de subida `6B:AA:2B:9B:CC:E4:CC:0A:3F:2E:09:28:BD:82:45:78:AE:A9:8D:61:C1:44:FB:83:84:96:1C:81:89:57:7A:10`. No se descargó el certificado público de Play: el navegador denegó esa descarga.
- Prueba cerrada Alpha, track `4699722410051328089`: AAB cargado y guardado como borrador de release 1, con notas en es-419. No se lanzó: faltan configuración de ficha/formularios y testers.
- Borrador: https://play.google.com/console/u/1/developers/7592822914289724121/app/4975223863463427352/tracks/4699722410051328089/releases/1/prepare
- SHA-256 del AAB descargado de la release GitHub (commit `35f4b83`): `424a21a9caf0b7256de47efff4cd80688f547008dd7880f94023a2b38c1af7b8`.
- Correo del dominio ya existente, verificado en el ingreso de Zoho: `contacto@unbiraapps.com`. Reutilizarlo para soporte. No se creó otro buzón ni se contrató otro plan.
- Alta de AdMob autorizada por la dueña para `unbiraapps@gmail.com`, Argentina, aceptando los términos: pendiente de verificación de teléfono por la dueña. Todavía no hay IDs reales de anuncios ni secretos ADMOB.


### Formularios y soporte: avance (2026-11-04)

- Datos de contacto guardados en la ficha de Play: `contacto@unbiraapps.com`, sitio `https://unbiraapps.com`. El buzón ya existía en Zoho; se reutiliza para Meneia, como pidió la dueña. No se crearon credenciales ni se contrató un servicio nuevo.
- URL de privacidad guardada: `https://meneia.unbiraapps.com/privacidad`.
- Declaración de anuncios guardada: sí, la app contiene anuncios.
- Público objetivo guardado: solo mayores de 18 años; no se activó la restricción opcional adicional de acceso por edad de Play.
- Acceso para revisión guardado: instrucciones en inglés, sin cuenta ni contraseña; elegir plan gratuito para acceder a todas las funciones de seguimiento. PIN y biometría son opcionales y están desactivados inicialmente. La compra solo quita anuncios.
- Declaración de salud: seguimiento del período y administración de medicamentos/tratamientos por la función de recordatorio de pastillas. Google incluye recordatorios de medicación en esa categoría; la predicción de ovulación/fertilidad ya está comprendida en seguimiento del período. No pidió requisitos regionales adicionales.
- Clasificación IARC: datos preparados con `contacto@unbiraapps.com`, tipo "El resto de los tipos de app"; pendiente de autorización de términos IARC por la dueña antes de enviar el cuestionario.


### Datos y producto de pago: resultado parcial (2026-11-04)

- Seguridad de los datos guardada en Play: recopila y comparte ubicación aproximada (IP), diagnóstico, interacciones en la app y dispositivo/otros IDs mediante AdMob; fines de publicidad/marketing, estadísticas y prevención de fraude/seguridad. Sin personalización. Recopilación opcional por la modalidad Sin anuncios, no efímera; cifrado TLS en tránsito. No hay creación de cuentas ni acceso con cuentas externas. No se declaró un servicio de solicitud de borrado de datos técnicos de terceros.
- No se declararon datos de salud, perfiles, síntomas ni consultas como recopilados o compartidos: permanecen en el dispositivo. Fuente de los datos del SDK: https://developers.google.com/admob/android/privacy/play-data-disclosure
- ID de publicidad guardado: sí; publicidad/marketing, estadísticas y prevención de fraude/seguridad del SDK AdMob. No se marcó personalización.
- Declaraciones adicionales de Play guardadas: no es una app gubernamental y no ofrece funciones financieras. La compra de quitar anuncios es un producto digital, no un servicio financiero.
- Producto único `sin_anuncios` creado y guardado como **borrador**, nombre "Sin anuncios", opción de compra `pago-unico`, tipo Comprar y retrocompatibilidad. Precio base USD 9,99; Play calculó precios para 174 países/regiones. No está activado ni disponible para compras reales. Falta despejar la condición de precio superior a Código de Estilo si la dueña se refiere a una venta externa a Play.
- Producto: https://play.google.com/console/u/1/developers/7592822914289724121/app/4975223863463427352/one-time-products/sku/sin_anuncios
- AdMob sigue en verificación de teléfono del alta autorizada; no hay todavía app ni bloques reales. Por eso aún no se cargaron secretos ADMOB, no se publicó app-ads.txt, no se configuró UMP y no se corrió el workflow con IDs reales. La dueña debe completar teléfono y SMS directamente en Google.
- IARC pendiente de autorización específica de la dueña para aceptar sus términos y compartir `contacto@unbiraapps.com` con las autoridades clasificadoras. No se aceptaron ni se envió el cuestionario sin autorización.
- [x] **Correo de soporte del dominio:** reutilizado `contacto@unbiraapps.com`, ya existente en Zoho; guardado como contacto público de Meneia en Play. No se creó un buzón ni un alias adicional. La sesión de Zoho quedó en el aviso de MFA; no se modificó la seguridad de la cuenta ni se enviaron mensajes de prueba.
