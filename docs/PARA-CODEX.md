# Pendientes para Codex

Tareas fuera del repositorio. Marcá con `[x]` y anotá el resultado debajo de cada una, sin claves ni contraseñas.


## Identidad visual aprobada (2026-11-10)

Hecho en el código (Android e iPhone, interfaz compartida). Nada publicado ni enviado a revisión.

- Paleta nocturna en `src/styles.css`: noche `#120b23`, superficie `#211632`, marfil `#fff1d9`, lavanda `#c9b1e7`, texto secundario `#b6a9c6`. El botón principal ahora es marfil. El nombre "Meneia" usa Georgia, igual que la maqueta.
- **Bienvenida** (`src/app/Bienvenida.tsx`): marca, "Meneia", "Tu ciclo, a tu ritmo.", "Comenzar" y "Ya uso Meneia". Solo la ve quien todavía no terminó Inicio. Quien ya usa la app no la ve, y no se tocan sus datos (probado: al recargar, una usuaria existente entra directo). No dice "Todas las funciones gratis. Sin tarjeta".
- **"Ya uso Meneia"** abre la recuperación real: desde un archivo o desde la nube (misma cuenta + contraseña de la copia). Después de recuperar, sigue con los pasos de Inicio con los datos ya cargados.
- **Copia de seguridad** (`src/app/Copia.tsx`, `src/app/Nube.tsx`): primero se elige "Guardar un archivo" o "Guardar en la nube". En la nube: paso 1 cuenta (Google o email en Android; Apple o email en iPhone) y paso 2 contraseña de la copia. Explica que es distinta de la contraseña de la cuenta y que si se pierde no podemos recuperar la copia. Usa las funciones reales; no hay nada simulado.
- **Acerca de** (Perfil › Acerca de Meneia): marca, nombre, versión, textos de la maqueta, enlaces a Copia de seguridad, Política de privacidad y Ayuda y contacto, logo de UnbiraApps y "Creado por UnbiraApps".
- Se sacó la afirmación general "Tus datos quedan en tu celular" de la app, de la política de privacidad y de `docs/tienda/textos.md`. Ahora dice "Tus registros se guardan en este dispositivo" y menciona la copia cifrada opcional.
- Pruebas: 70/70 pasan y la compilación web está bien. Con Playwright, en 320×568 y 390×844, se probaron bienvenida, recuperar (archivo y nube), Inicio, Acerca de y Copia (archivo y nube). Sin desborde horizontal, todos los botones con nombre accesible y de al menos 40 px de alto. Se puede usar con teclado. El contraste del texto es de 6,9:1 o más.

### Pendiente

- [ ] **Ícono original de la M lunar.** La maqueta solo trae una captura de 97×82 px. Por ahora, en la app (bienvenida, Acerca de, bloqueo y fila de Perfil) se usa un recorte provisorio de esa captura (`src/assets/meneia/marca-provisoria.png`). Los íconos de Android e iPhone **no se cambiaron**: siguen los anteriores. Hace falta que la dueña pase el original (SVG, o PNG de 1024 px o más). Codex: si lo encontrás en `C:\Users\lenovo\Documents\ChatGPT\Codigo de estilo\mockups\meneia-identidad\` o en otra carpeta del proyecto, subilo al repo en `src/assets/meneia/` y avisale a Claude, que genera los recursos de las dos plataformas (`scripts/android-res.mjs`, `scripts/ios-res.mjs`).
- [ ] Después del ícono nuevo: actualizar el ícono de Play Console (512×512), el gráfico destacado y las capturas de las dos tiendas (Claude las regenera).
- [ ] Revisar en Play Console y App Store Connect los textos nuevos de `docs/tienda/textos.md` (subtítulo "Tu ciclo, a tu ritmo", descripción breve y texto promocional). Solo dejarlos cargados como borrador, sin enviar a revisión.
- Sin conexiones nuevas: la copia en la nube sigue necesitando lo que ya estaba pendiente (SMTP, Google OAuth de producción, Apple en Supabase).

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
- [x] **AdMob:** crear la app Android `app.meneia` y tres bloques: banner adaptable, intersticial y bonificado. Cargar en los secretos del repo: `ADMOB_APP_ID` (formato `ca-app-pub-…~…`), `ADMOB_BANNER_ID`, `ADMOB_INTERSTITIAL_ID` y `ADMOB_REWARDED_ID` (formato `ca-app-pub-…/…`). En AdMob › Bloquear contenido: bloquear las categorías sensibles (sexualidad, citas, embarazo/bebés si aparece, apuestas). La app pide siempre anuncios no personalizados.
- [x] **app-ads.txt:** AdMob pide publicarlo en el dominio de la ficha de Play. Si el sitio del desarrollador es `unbiraapps.com`, poner `https://unbiraapps.com/app-ads.txt` con la línea que da AdMob. Si fuera `meneia.unbiraapps.com`, avisar en `docs/PARA-CLAUDE.md` y lo agrego en `public/app-ads.txt`.
- [x] **Mensaje de consentimiento (UMP):** en AdMob › Privacidad y mensajería, crear el mensaje de GDPR para Europa. La app ya lo muestra solo donde Google lo pide.
- [x] **Suscripción "Sin anuncios" en Play (cambio de la dueña, 2026-11-05):** USD 9,99 por mes, renovación mensual; plan gratuito completo con anuncios sin tarjeta ni trial de pago. Sustituye el pedido anterior de producto único `sin_anuncios`, que permanece en borrador. Producto mensual `sin_anuncios_mensual`, plan básico `mensual`; ver resultado y coordinación con Claude más abajo.
- [ ] **Ficha y formularios de Play:** público objetivo **18 años o más** (la app no está dirigida a menores: los perfiles de hijas los maneja una persona adulta); formulario de apps de salud (Seguimiento del período); Seguridad de los datos: la app **sí** muestra anuncios y comparte el ID de publicidad y datos del dispositivo con AdMob; los datos de salud **no** se recopilan ni se comparten (quedan en el celular); política de privacidad `https://meneia.unbiraapps.com/privacidad`. Declarar el permiso de ID de publicidad.
- [x] Subir `meneia.aab` (sale en cada release: `https://github.com/unbiraapps/Meneia/releases/download/ultima-version/meneia.aab`) a la prueba cerrada.

## Prueba de la suscripción

- [ ] **Cuentas de prueba de licencias:** en Play Console › Configuración › Prueba de licencias, agregar el Gmail con el que la dueña prueba la app (respuesta "RESPOND_NORMALLY"). Así puede suscribirse sin cobro real desde la versión de la prueba cerrada (instalada desde Play, no desde el Drive: la facturación solo funciona con la app instalada desde Play).
- [ ] Verificar con esa cuenta: entrar gratis sin tarjeta; cerrar el pago y seguir gratis; suscribirse y que desaparezcan los anuncios; cancelar desde Play y seguir sin anuncios hasta el vencimiento; y que al vencer vuelva a gratis sin perder datos. Anotar el resultado.

## Android · prueba cerrada de Google Play (2026-11-07)

**Compilación para cargar en Play:** commit `95d6cb7`, compilación de GitHub Actions **App de Android #55**, `versionCode 55`, `versionName 1.2`. AAB firmado con la clave de subida (SHA-256 del certificado `6B:AA:2B:9B:CC:E4:CC:0A:3F:2E:09:28:BD:82:45:78:AE:A9:8D:61:C1:44:FB:83:84:96:1C:81:89:57:7A:10`). Se descarga de GitHub › Releases › "Meneia (última versión)" › `meneia.aab` (si hubo commits después, verificar en el registro de la corrida #55 o en el artefacto de esa corrida). La APK de prueba equivalente está en el Drive: `Meneia/APK/Meneia 1.2 (55).apk` (anuncios de prueba).

Lo que el código ya resuelve (revisado y con pruebas, 70 en verde):
- Entrar gratis sin tarjeta y sin cuenta: "Continuar gratis con anuncios"; el cobro solo se abre con "Suscribirme".
- Cuenta opcional con Google o email y contraseña (Perfil › Copia de seguridad), copia cifrada en el celular, restauración y "Borrar mi copia y mi cuenta" (llama a `borrar_mi_cuenta`).
- Suscripción `sin_anuncios_mensual`, plan `mensual`: compra, pago pendiente, "Restaurar suscripción", "Administrar o cancelar" (abre Play), cancelada sigue sin anuncios hasta el fin del mes pagado, vencida vuelve a gratis sin tocar datos. Las compras que quedaron sin reconocer se reconocen al abrir la app.
- Política de privacidad coherente con cuenta y copia opcionales (`/privacidad/`), páginas `/borrar-cuenta/`, `/cuenta-confirmada/`, `/nueva-clave/`, `/soporte/`.
- La compilación #55 ya tiene `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `GOOGLE_WEB_CLIENT_ID`: la copia en la nube aparece activa.

Bloqueos (conexiones y formularios, sin cambios de código):
- [ ] **Correos de Supabase (SMTP propio).** Sin esto, "Crear cuenta" con email no manda el mail de confirmación y "Me olvidé la contraseña" no llega. Pasos en la sección "Copia cifrada…", 3b.
- [ ] **Google OAuth en producción.** Publicar la pantalla de consentimiento y tener clientes OAuth de **Android** para `app.meneia` con el SHA-1 de la clave de subida **y** el SHA-1 de la clave de firma de apps de Play (Play Console › Integridad de la app). Sin el segundo, "Entrar con Google" falla en la versión instalada desde Play aunque funcione en la del Drive.
- [ ] **URLs de Supabase.** Site URL `https://meneia.unbiraapps.com` y Redirect URLs `…/cuenta-confirmada/` y `…/nueva-clave/` (sección 3b).
- [ ] **Suscripción en Play.** `sin_anuncios_mensual` activa con el plan base `mensual` activo (USD 9,99, renovación mensual, sin prueba gratis). Testers de licencias agregados (Configuración › Pruebas de licencias) para probar la compra sin cobro.
- [ ] **Prueba cerrada.** Subir el AAB #55 al track de prueba cerrada, con la lista de testers que defina la dueña. No pasar a producción.
  - Decisión de la dueña (2026-11-08): esperar a que termine la prueba cerrada de Código de Estilo (unos 3 días más 1 de aprobación). Si sale bien, contrata a los mismos testers para Meneia. Hasta entonces dejar todo listo (AAB cargado en el track, lista de testers vacía o preparada) sin iniciar la prueba. Los testers tienen que aceptar la invitación de Meneia por separado y los 14 días cuentan desde que Meneia tiene 12 testers activos.
- [ ] **Seguridad de los datos y Contenido de la app.** Declarar, como opcionales: dirección de email (cuenta) e información de salud (copia en la nube cifrada en tránsito y en el celular, el usuario puede pedir que se borre); datos de AdMob (ID del dispositivo, interacción, diagnóstico; publicidad). URL de borrado: `https://meneia.unbiraapps.com/borrar-cuenta/`. Acceso para revisión: la app funciona sin cuenta.
- [ ] **Ficha de Play.** Sección "Fichas de las tiendas: materiales listos".
- [ ] **Drive.** Sección "Drive: client_id propio para rclone" (si deja de andar, las APK no llegan al Drive).
- [ ] **Avisar a Claude** en `docs/PARA-CLAUDE.md` si algo de esto falla en la prueba, con el error textual.

## iPhone · etapa 2: conectar cuentas (2026-11-06)

Contexto: `docs/IOS.md`. La app de iPhone ya está preparada (etapa 1). Usar la cuenta Apple Developer y App Store Connect que ya existen (equipo `72L65TRKSY`, las mismas de Código de Estilo). No tocar Código de Estilo ni sus claves. No enviar nada a revisión de Apple. No pegar claves en el repo ni en el chat.

- [x] **1. Identificador.** (Codex informó el 7/11: App ID `com.unbiraapps.meneia` creado con Sign In with Apple e In-App Purchase.) developer.apple.com › Certificates, Identifiers & Profiles › Identifiers › nuevo App ID explícito `com.unbiraapps.meneia`, descripción "Meneia". Capacidades: **Sign In with Apple** (como App ID principal). In-App Purchase viene activada.
  - Resultado 2026-11-07: registrado y verificado en la lista del equipo `72L65TRKSY`, sesión Barbara Dalonso. Sign In with Apple principal e In-App Purchase habilitados. No se modificó el identificador de Código de Estilo.
- [ ] **2. Ficha en App Store Connect.** Apps › nueva app iOS: nombre "Meneia" (si está tomado, "Meneia: tu ciclo"), idioma principal español (el mismo que Código de Estilo), bundle `com.unbiraapps.meneia`, SKU `meneia-ios`, acceso completo. Anotar acá el Apple ID numérico. Publicación de versiones: **manual**.
  - [x] Ficha creada el 2026-11-07: **Apple ID `6831992382`**, nombre Meneia, iOS, español (México), bundle `com.unbiraapps.meneia`, SKU `meneia-ios`, acceso ilimitado. URL: https://appstoreconnect.apple.com/apps/6831992382/distribution
  - [ ] Confirmar guardado de textos y publicación manual de 1.0. Campos preparados desde `docs/tienda/textos.md`; manual seleccionada, pero no se verificó el guardado. El gestor multimedia abrió el aviso «¿Seguro que quieres salir de esta página? Los cambios que no hayas guardado se perderán» y luego la pestaña dejó de responder a las herramientas. Se pidió a la dueña Cancelar y Guardar; nunca Añadir a revisión. Las capturas 1320×2868 requieren elegir el tamaño grande de iPhone en el gestor, no el encabezado ni el tamaño mediano predeterminado. Ninguna captura se declara cargada todavía.
- [ ] **3. Acuerdo de apps pagas.** Business › Paid Apps: la dueña acepta el acuerdo y carga cuenta bancaria y formulario de impuestos ella misma (Codex la guía, no escribe sus datos). Sin esto no se pueden crear suscripciones.
- [ ] **4. Programa para pequeños desarrolladores.** https://developer.apple.com/app-store/small-business-program/enroll/ (sirve para todas las apps de la cuenta). Lo envía la dueña.
- [ ] **5. Suscripción.** En la ficha de Meneia › Suscripciones: grupo "Sin anuncios"; producto ID `com.unbiraapps.meneia.sinanuncios.mensual`, nombre de referencia "Sin anuncios mensual", duración 1 mes, precio base USD 9,99 (países: los que Apple calcule). Localización español: nombre "Sin anuncios", descripción "Usá Meneia sin publicidad". Sin prueba gratis ni ofertas. La captura para la revisión se agrega en la etapa 4.
- [ ] **6. Disponibilidad.** Precios y disponibilidad: todos los países **menos los de la Unión Europea**. En Business › Compliance, declarar el estado de comerciante (DSA) de la cuenta si todavía no se hizo: como Meneia no se distribuye en la UE, no se publican dirección ni teléfono.
- [ ] **7. Clave de la API para GitHub.** Users and Access › Integrations › App Store Connect API › Team Keys › nueva clave "GitHub Meneia" con rol **Admin** (Xcode la necesita para crear el certificado de distribución en la nube con `-allowProvisioningUpdates`). Descargar el .p8 una sola vez. Secretos en GitHub (`unbiraapps/Meneia` › Settings › Secrets › Actions):
  - `ASC_API_KEY_ID`, `ASC_API_ISSUER_ID`, `ASC_API_KEY_P8` (el contenido completo del .p8), `APPLE_TEAM_ID` = `72L65TRKSY`.
  - Si la dueña prefiere no crear una clave Admin: avisar en `docs/PARA-CLAUDE.md` y pasamos la firma a Codemagic con la clave que ya existe.
- [ ] **8. AdMob para iPhone.** En la cuenta de AdMob de Meneia: nueva app iOS "Meneia" (todavía no publicada). Bloques: banner, intersticial y bonificado, como los de Android. Secretos: `ADMOB_IOS_APP_ID` (el `~`), `ADMOB_IOS_BANNER_ID`, `ADMOB_IOS_INTERSTITIAL_ID`, `ADMOB_IOS_REWARDED_ID`. Revisar que el mensaje de consentimiento (UMP) también aplique a la app de iOS. No crear mensaje de rastreo (ATT): no rastreamos.
- [ ] **9. Apple en Supabase** (cuando el proyecto de la copia en la nube exista). Authentication › Providers › Apple: activar; Client IDs: `com.unbiraapps.meneia`. Para el ingreso nativo no hace falta el secreto. Anotar si Supabase pide la clave de "Sign in with Apple" para revocar el acceso al borrar la cuenta: lo necesitamos antes de la etapa 4.
- [x] **7b. Clave del certificado de distribución (nuevo, 2026-11-08).** La firma automática falló en la corrida 16 ("Your team has no devices… No profiles for 'com.unbiraapps.meneia'"): Xcode intentaba crear un perfil de **desarrollo**. Claude cambió el workflow a firma de **distribución App Store** con las herramientas de Codemagic (`app-store-connect fetch-signing-files --type IOS_APP_STORE --create`), que no necesita dispositivos. No registrar dispositivos.
  - En tu compu: `ssh-keygen -t rsa -b 2048 -m PEM -f meneia_cert_key -q -N ""`. Guardar el contenido completo de `meneia_cert_key` (empieza con `-----BEGIN RSA PRIVATE KEY-----`) como secreto de GitHub **`IOS_CERTIFICATE_PRIVATE_KEY`** y borrar el archivo local. Con esa clave, la primera corrida crea un certificado Apple Distribution nuevo para Meneia (los de Código de Estilo no se tocan) y el perfil App Store; las siguientes los reutilizan.
  - La clave de la API (`ASC_API_KEY_*`) tiene que poder crear certificados y perfiles: rol Admin, o Gestor de apps con acceso a "Certificados, identificadores y perfiles".
  - Resultado 2026-11-08: no existía IOS_CERTIFICATE_PRIVATE_KEY y no se encontró meneia_cert_key en las carpetas habituales. Se generó una clave exclusiva RSA 2048 en PEM, se validaron delimitadores RSA PRIVATE KEY sin mostrar contenido y se cargó cifrada en GitHub Secrets; existencia verificada. Los archivos temporales privado y público se eliminaron después de la carga. No se modificaron las claves de Código de Estilo.
  - Corrida manual **18** iniciada y verificada en curso: https://github.com/unbiraapps/Meneia/actions/runs/42481872413, commit `430b290c5b898dd15af9bfa564e80288d4011bad`, subir=true y anuncios_reales=false. Se avisó a Claude para seguirla. El número 18 identifica la corrida; todavía no se confirma una compilación procesada en TestFlight.
- [x] **10. Primera subida.** Resultado (Claude, 2026-11-08): corrida 18 (`42481872413`) verde. IPA firmada para App Store y subida sin errores: **Meneia 1.0 (18)**, «UPLOAD SUCCEEDED with no errors». Falta confirmar en App Store Connect que Apple terminó de procesarla (10 a 30 minutos). GitHub › Actions › "App de iPhone" › Run workflow con **subir** marcado (anuncios reales sin marcar). Confirmar en el registro "Subida a TestFlight" y en App Store Connect que la compilación se procesa. No agregar probadores ni enviar a Beta App Review: eso es la etapa 3.
- [ ] **11. Avisar a Claude** en `docs/PARA-CLAUDE.md` con el Apple ID de la ficha y el número de compilación procesada (o el error textual si falla).

## iPhone · etapa 3: prueba en el iPhone de la amiga (2026-11-08)

Requiere el visto bueno de la dueña para enviar a la revisión beta de Apple. No enviar la versión 1.0 a revisión del App Store.

- [ ] **1. Procesada.** App Store Connect › Meneia › TestFlight: la compilación **1.0 (18)** figura lista. Si pide cumplimiento de exportación, ya está declarado en la app (`ITSAppUsesNonExemptEncryption = NO`).
- [ ] **2. Información de prueba.** TestFlight › Información de prueba: "Qué probar" de `docs/tienda/textos.md`, email de contacto `contacto@unbiraapps.com`, política de privacidad, y en la información para la revisión beta las mismas notas para el revisor (sin cuenta de demostración si la copia en la nube todavía no está lista para iPhone).
- [ ] **3. Grupo externo.** Crear el grupo "Amiga" (prueba externa), agregar la compilación 18 y **con el OK de la dueña** enviarla a la revisión beta de Apple (suele tardar 1 día).
- [ ] **4. Invitación.** Cuando Apple la apruebe: invitar a la amiga por su email de Apple ID, o un enlace público limitado a 1 persona. La amiga instala TestFlight desde el App Store y acepta.
- [ ] **5. Avisar a Claude** en `docs/PARA-CLAUDE.md` con el estado de la revisión beta y lo que la amiga encuentre (con capturas si puede).

## Fichas de las tiendas: materiales listos (2026-11-06)

Todo está en el repo. Cargar sin enviar nada a revisión (ni en Play ni en Apple) hasta que la dueña lo pida.

- [ ] **Google Play (ficha principal de la tienda).** Textos de `docs/tienda/textos.md` (sección Google Play y descripción larga). Gráfico destacado `store-assets/android/grafico-destacado.png`. Capturas de teléfono `store-assets/android/1-hoy.png` a `6-como-estoy.png` (1080×1920). Ícono `public/pwa-512.png`. Sitio web `https://meneia.unbiraapps.com/soporte/`.
  - [x] Resultado 2026-11-07: nombre y descripciones de docs/tienda/textos.md, ícono 512, gráfico 1024×500 y seis capturas Android cargados; consola confirmó «Se guardaron los cambios». Borrador, sin enviar a revisión. Falta verificar el enlace de soporte en la configuración de contacto. Panel: https://play.google.com/console/u/1/developers/7592822914289724121/app/4975223863463427352/store-listings/default/edit
- [ ] **App Store (después de la etapa 2 de iPhone, cuando exista la ficha).** En la versión 1.0, idioma español:
  - Textos, palabras clave, URL de soporte y de privacidad, copyright y categorías: `docs/tienda/textos.md` (sección App Store).
  - Capturas de iPhone 6,9": `store-assets/ios/1-hoy.png` a `6-perfil.png` (1320×2868). No hace falta iPad: la app es solo para iPhone.
  - Clasificación por edad y privacidad de la app: tablas de `docs/tienda/textos.md`. Revisar la guía de AdMob enlazada ahí antes de guardar la privacidad.
  - Información para la revisión: notas de `docs/tienda/textos.md`; cuenta de demostración cuando la copia en la nube esté activa (la contraseña la escribe la dueña).
  - Suscripción: nombre y descripción de `docs/tienda/textos.md`; captura para la revisión `store-assets/ios/6-perfil.png`.
  - Publicación de la versión: **manual**. No enviar a revisión.

## Drive: client_id propio para rclone (2026-11-05, urgente)

El log de la subida al Drive avisa: "This remote uses rclone's shared Google Drive client_id, which is being retired and will stop working during 2026". Si deja de andar, las APK no llegan más al Drive.

- [x] En Google Cloud (proyecto de Unbira), activar la API de Google Drive y crear un cliente OAuth de tipo "App de escritorio" (guía: https://rclone.org/drive/#making-your-own-client-id).
  - Resultado 2026-11-07: API Drive habilitada en el proyecto separado de Meneia `disco-catcher-513914-n8`; cliente «Unbira - rclone Meneia Drive», ID público `564661569637-3b4grvgv82rn1i3r9lq5ktume05rkd80.apps.googleusercontent.com`. Configuración nueva preparada fuera del repo, original conservada. Reautorización bloqueada: «Acceso bloqueado: Meneia no completó el proceso de verificación de Google», «Error 403: access_denied»; proyecto OAuth en Prueba. No se agregó ningún probador ni se reemplazó RCLONE_CONF sin validar el nuevo token.
- [ ] En tu compu, `rclone config` › editar el remoto `unbira` › poner ese `client_id` y `client_secret` › volver a autorizar.
- [ ] Actualizar el secreto `RCLONE_CONF` de GitHub con el contenido nuevo de `rclone.conf` y correr el workflow a mano para probar.

## Copia cifrada en la nube con Google o email (2026-11-05, decidido por la dueña)

El código ya está (`src/cloud.ts`, `src/crypt.ts`, `src/app/Nube.tsx`). Hasta que estén estos pasos, la app muestra "Muy pronto" en Perfil › Copia de seguridad. Los datos se cifran en el celular: al servidor llega solo un sobre cifrado. No guardes ni pegues claves en el repo.

- [ ] **1. Proyecto en Supabase.** Cuenta de Unbira (la misma de Código de Estilo sirve), proyecto nuevo `meneia`, región São Paulo (`sa-east-1`), plan gratis. En SQL Editor, correr:
  ```sql
  create table public.copias (
    user_id uuid primary key references auth.users(id) on delete cascade,
    data text not null check (length(data) < 5000000),
    updated_at timestamptz not null default now()
  );
  alter table public.copias enable row level security;
  create policy "cada una ve solo su copia" on public.copias
    for all to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

  create or replace function public.borrar_mi_cuenta() returns void
    language sql security definer set search_path = ''
    as $$ delete from auth.users where id = auth.uid(); $$;
  revoke all on function public.borrar_mi_cuenta() from public, anon;
  grant execute on function public.borrar_mi_cuenta() to authenticated;
  ```
  Verificar en Table Editor que `copias` tiene RLS activado y que con la clave anon, sin sesión, un `select` devuelve vacío.
- [ ] **2. Google Cloud (OAuth).** En el proyecto de Google Cloud de Unbira (o uno nuevo `meneia`):
  - Pantalla de consentimiento OAuth: externa, nombre "Meneia", email de soporte `contacto@unbiraapps.com`, dominio `unbiraapps.com`, política `https://meneia.unbiraapps.com/privacidad/`. Scopes solo `openid`, `email`, `profile`. Publicarla (pasar a producción) para que cualquier cuenta pueda entrar.
  - Credencial **Android**: paquete `app.meneia`, SHA-1 de la clave de subida (keystore `meneia`, sacarla con `keytool -list -v`). Crear **otra** credencial Android con el SHA-1 de la **clave de firma de apps de Play** (Play Console › Meneia › Prueba y lanzamiento › Configuración › Integridad de la app › Firma de apps).
  - Credencial **Aplicación web** (se llama "web client" aunque sea para Android): sin orígenes ni redirecciones. Su ID de cliente es el que usa la app.
- [ ] **3. Google en Supabase.** Authentication › Sign In / Providers › Google: activar, pegar el ID y el secreto del cliente **web** del paso 2. En "Authorized Client IDs" poner también el ID del cliente web. Dejar desactivado "Skip nonce checks" (la app manda nonce).
- [ ] **3b. Email y contraseña en Supabase** (la dueña lo pidió además de Google).
  - Authentication › Sign In / Providers › Email: activado, "Confirm email" activado, largo mínimo de contraseña 8.
  - Authentication › URL Configuration: Site URL `https://meneia.unbiraapps.com`. Redirect URLs: `https://meneia.unbiraapps.com/cuenta-confirmada/` y `https://meneia.unbiraapps.com/nueva-clave/`.
  - **SMTP propio** (el de Supabase solo manda a miembros del equipo): Authentication › Emails › SMTP Settings. Usar Resend (plan gratis) con el dominio `unbiraapps.com` verificado por DNS en Cloudflare, remitente `Meneia <no-responder@unbiraapps.com>`.
  - Plantillas en español (Authentication › Emails › Templates):
    - Confirm signup: asunto "Confirmá tu cuenta de Meneia"; cuerpo "Tocá este link para confirmar tu email: {{ .ConfirmationURL }}. Si no creaste una cuenta en Meneia, ignorá este mail."
    - Reset password: asunto "Elegí una contraseña nueva para Meneia"; cuerpo "Tocá este link para elegir una contraseña nueva: {{ .ConfirmationURL }}. Tu contraseña de copia no cambia. Si no lo pediste, ignorá este mail."
  - Los mails nunca mencionan el período ni datos de salud.
- [ ] **3c. Cloudflare Pages** (proyecto `meneia`): agregar las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (producción y previews) y volver a desplegar. Las usa la página `/nueva-clave/`.
- [ ] **4. Secretos de GitHub** (Settings › Secrets and variables › Actions de `unbiraapps/Meneia`):
  - `SUPABASE_URL` (Project Settings › API › Project URL)
  - `SUPABASE_ANON_KEY` (la clave pública `anon`, **no** la `service_role`)
  - `GOOGLE_WEB_CLIENT_ID` (el ID del cliente web del paso 2)
  Con solo los dos primeros ya funciona el ingreso con email; el botón de Google aparece cuando está el tercero.
  Después, correr a mano el workflow "App de Android" para que la APK del Drive salga con la copia activada.
- [ ] **5. Play Console.**
  - Seguridad de los datos: ahora se recopilan, de forma **opcional**, "Dirección de correo electrónico" (gestión de la cuenta, con Google o con email y contraseña) y "Información de salud" (copia de seguridad, **cifrada en tránsito**, el usuario puede pedir que se borren, no se comparten). Marcar que los datos se cifran en tránsito y que hay forma de pedir el borrado.
  - Borrado de cuenta: URL `https://meneia.unbiraapps.com/borrar-cuenta/` (ya está en el repo, se publica sola con Cloudflare).
  - Acceso a la app para revisión: indicar que la app funciona sin cuenta; la cuenta es opcional, solo para la copia en la nube.
- [ ] **6. Avisar a Claude** en `docs/PARA-CLAUDE.md` cuando esté todo, con el número de la corrida del workflow que salió con los secretos.

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


### Corrección de cuenta AdMob (2026-11-05)

- La dueña pidió usar la misma cuenta de AdMob que Código de Estilo. Se verificó en el panel existente: `bdalonso87@gmail.com`, editor `pub-9080053541566091`, con Código de Estilo (`ca-app-pub-9080053541566091~8919382510`, dos bloques) y Saldapp (`ca-app-pub-9080053541566091~5700596386`, dos bloques). Perfil de pagos ya completado en esa cuenta.
- Las notas antiguas locales que indicaban anuncios solo de demostración eran insuficientes para identificar la cuenta actual. Se corrigió con la comprobación del panel en vivo.
- La cuenta recién creada con `unbiraapps@gmail.com`, editor `pub-6061137724315991`, no se usará para Meneia. Allí se creó una app y un banner antes de la corrección; no se cargó ningún ID de esa cuenta en GitHub. No se cerró ni borró la cuenta ni se modificaron sus pagos.
- Continuar la configuración de Meneia únicamente bajo `pub-9080053541566091`. No reutilizar bloques de Código de Estilo ni Saldapp: crear los propios de Meneia en esa misma cuenta.


### AdMob correcto y APK de prueba (2026-11-05)

- App Meneia creada en la misma cuenta que Código de Estilo: `bdalonso87@gmail.com`, editor `pub-9080053541566091`. App ID `ca-app-pub-9080053541566091~3271936607`.
- Bloques propios de Meneia: banner adaptable `ca-app-pub-9080053541566091/8316379720`; intersticial `ca-app-pub-9080053541566091/1668220053`; bonificado `ca-app-pub-9080053541566091/9782513797` (recompensa: 7 días sin anuncios).
- Los cuatro secretos `ADMOB_APP_ID`, `ADMOB_BANNER_ID`, `ADMOB_INTERSTITIAL_ID` y `ADMOB_REWARDED_ID` se cargaron cifrados en GitHub Actions. Nunca se usaron IDs de la cuenta nueva descartada.
- Bloqueos guardados exclusivamente para Meneia: Citas, Referencias al sexo, Salud sexual y reproductiva, Juegos de casino sociales y Apuestas mayores de 18 años. Alcohol ya estaba bloqueado. En categorías generales se bloqueó Bebés (las cuatro subcategorías, incluida Alimentación de bebés); la búsqueda de embarazo no devolvió resultados.
- Vinculación a la ficha pública de Play pendiente hasta que esté publicada/indexada; Meneia se registró como Android aún no publicada. No se modificaron Código de Estilo ni Saldapp.
- Workflow ejecutado manualmente con los IDs reales: https://github.com/unbiraapps/Meneia/actions/runs/42014114800, versión de compilación 18, commit `6554c30`. Resultado `success`, incluidos Compilar APK y Subir al Drive de unbira.
- APK disponible: https://github.com/unbiraapps/Meneia/releases/download/ultima-version/meneia.apk. Tamaño 10.458.101 bytes. Copia actual en Drive `Meneia/APK/meneia.apk` (archivo `1OPEa3cjsacexfv4HADy2wcgwnW-x5Xjz`) y copia fechada `anteriores/meneia_2026-11-05_0755.apk`, ambas verificadas. SHA-256 idéntico entre descarga de GitHub y Drive: `9dd41d66158ffc89ae3dd09ba48e03c1ad082449aeeac000933abbe8f06ec0b1`.
- Carpeta para instalar desde el celular: https://drive.google.com/drive/u/0/folders/14aGADyhyMKo-HMdwPD2v_XeoSLACCJOr. Esto es instalación por APK; la prueba cerrada de Play todavía no se lanzó.


### Consentimiento europeo publicado (2026-11-05)

- Mensaje `Meneia - Consentimiento europeo` publicado en AdMob, editor `pub-9080053541566091`, exclusivamente para Meneia. Español predeterminado e inglés adicional; consentimiento, administrar opciones y no consentir disponibles. Opción No consentir habilitada en todas las regiones; segmentación del mensaje limitada a EEE, Reino Unido y Suiza.
- Política asociada: https://meneia.unbiraapps.com/privacidad. Implementación mediante el SDK UMP que ya tiene la app; no se habilitó la implementación alternativa en unidades de anuncios.
- Panel muestra estado Publicado: https://admob.google.com/v2/privacymessaging/gdpr?authuser=1. Google advierte hasta una hora para que aparezca; no se verificó la visualización en un teléfono ubicado en Europa. No se modificaron mensajes de otras apps.


### Clasificación de contenido completada (2026-11-05)

- La dueña autorizó aceptar las condiciones IARC y usar `contacto@unbiraapps.com`. Cuestionario completado y guardado; listo para enviar junto con la publicación, aún sin enviarla a revisión.
- Categoría: resto de los tipos de app; sin contenido descargado de sexo/violencia/lenguaje, sin interacción social ni catálogo de contenido remoto, sin promoción de productos restringidos, sin ubicación precisa compartida. Compras digitales: sí; artículos aleatorios, recompensas monetarias/cripto/NFT: no. No es navegador ni producto principalmente educativo o de noticias.
- Resultado de autoridades: Brasil 14+, ESRB Todos, PEGI 3, USK todas las edades, IARC resto del mundo 3+ (también Rusia y Corea del Sur 3+). Estas clasificaciones de contenido son distintas del público objetivo, que se mantiene **18+**.
- Play confirmó: «Se guardó el cambio. Envíalo a revisión en Descripción general de la publicación».


### app-ads.txt publicado (2026-11-05)

- Línea obtenida del panel AdMob de la cuenta correcta y publicada por HTTPS en https://unbiraapps.com/app-ads.txt: `google.com, pub-9080053541566091, DIRECT, f08c47fec0942fa0`.
- Cloudflare Worker externo al repo `unbira-app-ads`, versión activa `2a999900`, dominio personalizado de producción `unbiraapps.com`. Panel: https://dash.cloudflare.com/b1afff1f0d25617022fb22196fc4899c/workers/services/view/unbira-app-ads/production/domains
- Dominio raíz incluye un texto breve de contacto y enlaces a Meneia/privacidad. No se cambió código de la app, el correo ni los subdominios existentes.
- Archivo abierto en navegador y contenido verificado. AdMob pide al menos 24 horas para rastrearlo; la validación de Meneia también requiere que su ficha esté pública y vinculada. No se declara todavía rastreo verificado por AdMob.


### Borrador Alpha actualizado (2026-11-05)

- AAB de la compilación manual con IDs AdMob reales, versión **18 (1.2)**, subido y aceptado. Se quitó la versión 16 solamente de este borrador (sigue recuperable en la biblioteca). Guardado como borrador con nombre `18 (1.2)` y sin iniciar distribución.
- SHA-256 del AAB v18: `f8f3f3e70192b4a9ade5c75cfca17d54b5f8554f56f7deae451083eeceb8231a`. SDK objetivo 36 y Android 24+.
- Pendientes para continuar: materiales de ficha solicitados a Claude (textos, gráfico destacado y capturas), lista de testers de la dueña, y aclaración del precio de Código de Estilo para activar `sin_anuncios` respetando la condición aprobada de USD 9,99. Play también muestra un aviso de declaración de estado de comerciante de la cuenta; revisar ese requisito antes de enviar a revisión, sin inventar declaraciones legales de la titular.
- Pedido adicional a Claude: mostrar responsable y correo de contacto en la política de privacidad. No se cambió código de la app.
- Verificación local antes del commit de coordinación: `npm test` (60 pruebas) y `npm run build` correctos.


### Decisión vigente: mensual y gratis sin tarjeta (2026-11-05)

- La dueña corrigió expresamente la modalidad: **USD 9,99 al mes para quitar anuncios**, en lugar de pago único. Confirmó «exacto» al resumen de suscripción mensual y modalidad gratuita que no solicita tarjeta ni prueba de pago.
- La decisión de pago único anterior queda reemplazada. No se activa el producto único `sin_anuncios`; no se borra para conservar el registro. No hay compras ni usuarios pagadores del producto antiguo.
- Se creó la suscripción **`sin_anuncios_mensual`**, nombre «Meneia sin anuncios». Panel: https://play.google.com/console/u/1/developers/7592822914289724121/app/4975223863463427352/subscriptions/s/sin_anuncios_mensual
- La app actual todavía usa el producto único y textos de pago único. Pedido detallado a Claude en `docs/PARA-CLAUDE.md`: Billing de suscripción, estado vigente/cancelación/vencimiento, precio mensual claro, actualización de plan/política y acceso gratis sin abrir el cobro. No se cambió código de la app.


### Resultado de la suscripción mensual en Play (2026-11-05)

- [x] **Configuración en consola:** suscripción `sin_anuncios_mensual`, plan básico `mensual`, **Mensual, renovación automática**, estado **Activo** verificado en la tabla de Play. No se creó ninguna oferta ni trial de suscripción. Es una configuración de catálogo; no publica la app ni realizó cobros.
- Precio base ingresado **USD 9,99**, convertido por Play para las regiones habilitadas; verificado Estados Unidos USD 9,99/mes y Argentina ARS 15.500/mes. La app debe mostrar siempre el importe y período de facturación que informa Play, no un precio fijo inventado. Disponibilidad: 175 países/regiones.
- Se conservaron valores predeterminados de recuperación de pagos: gracia de 7 días y suspensión automática de 53 días. Esto solo corresponde a cobros de una suscripción ya contratada, no a una prueba gratuita ni a un requisito para el plan gratis. No confundirlo con la cortesía local de los primeros 7 días sin anuncios.
- Panel del plan: https://play.google.com/console/u/1/developers/7592822914289724121/app/4975223863463427352/subscriptions/s/sin_anuncios_mensual/base-plans/b/mensual
- Producto único anterior `sin_anuncios` continúa en borrador, sin activar. La consulta anterior sobre comparar el precio único con Código de Estilo queda superada por la confirmación posterior de la dueña de USD 9,99 mensuales.
- [ ] **Implementación y validación en app (Claude):** cambiar Billing y textos a la suscripción indicada, verificar vencimiento/restauración y entrada gratuita sin tarjeta. Pedido detallado en PARA-CLAUDE. No se publica ni se presenta la APK actual como adaptación mensual terminada.
- Verificaciones previas al commit de coordinación: `npm test` (60 pruebas) y `npm run build`, correctos. Solo se modificaron documentos de coordinación.


### Preparación para Play, Google e identidad (2026-11-06)

- [x] **Última entrega de Claude verificada:** `main` commit `c9da8443a69c94df0bcde94f62c4e3fc9d58bef7`; compilación **37**, corrida https://github.com/unbiraapps/Meneia/actions/runs/42230593203, resultado `success`. Release `ultima-version` contiene APK y AAB de ese commit.
- [x] **Firma de UnbiraApps comprobada en la entrega:** `src/assets/unbiraapps/horizontal-color.png` y pie de Perfil con texto exacto «Creado por UnbiraApps», alt UnbiraApps, sobre placa clara. Se mantiene el ícono propio de Meneia. No se volvió a integrar ni se cambió código.
- [x] **Ficha de Play preparada parcialmente y guardada como borrador:** nombre Meneia, descripción breve «Tu ciclo, síntomas y recordatorios. Gratis y sin tarjeta.», descripción larga de 1.517 caracteres y `public/pwa-512.png` como ícono 512x512. Incluye cuenta opcional, modalidad gratuita sin tarjeta, suscripción opcional y advertencia de estimaciones. Falta gráfico destacado y capturas antes de finalizar la ficha. La referencia a Google/email es preparación para la función aún no habilitada; revisar texto final cuando se valide el login.
- Panel de ficha: https://play.google.com/console/u/1/developers/7592822914289724121/app/4975223863463427352/store-listings/default/edit. Play confirmó «Se guardaron los cambios». No se publicó ni se envió a revisión.
- [ ] **Activar ingreso/copia:** se verificó que aún faltan los tres secretos `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `GOOGLE_WEB_CLIENT_ID`. Por eso la compilación 37 no tiene habilitado el login de nube aunque su código y botón estén implementados.
- Supabase existente: organización gratuita Unbira App `drrjwgiyjhtrjjuvvlor`, sesión unbiraapps. Proyectos existentes de Código de Estilo `whldhhvuanyotmniscis` y `wsnlpvkwbzzsjeunrbnr`; no se modificaron. Alta de proyecto Meneia preparada en https://supabase.com/dashboard/new/drrjwgiyjhtrjjuvvlor: nombre meneia, São Paulo sa-east-1, Data API habilitada, exposición automática de tablas desactivada y RLS automática habilitada. **No se creó el proyecto:** la dueña debe definir/guardar la nueva contraseña directamente en el panel; no reutilizar la contraseña autocompletada. Mantener plan gratis y detenerse si pide pago.
- Google Cloud: sesión `unbiraapps@gmail.com`, proyecto existente `codigo-de-estilo`. Acceso bloqueado por verificación en dos pasos obligatoria desde el 4 de noviembre; pantalla https://console.cloud.google.com/enable-mfa. Se pidió a la dueña completar personalmente su activación. No se cambió el OAuth de Código de Estilo ni se crearon credenciales de Meneia todavía.
- Tras resolver esos accesos: completar SQL/RLS con permisos mínimos (al desactivar la exposición automática, otorgar explícitamente a authenticated los permisos necesarios sobre copias), OAuth Android para ambas firmas, cliente web/Supabase con nonce, email SMTP, secretos y variables Pages; correr workflow y validar login. Actualizar Seguridad de los datos y borrado de cuenta de Play antes de enviar una versión con nube. No marcar estas tareas como terminadas sin verificarlas.
- El pedido local de logo que se había detenido quedó preservado en git stash «Pedido local de logo detenido por la duena el 2026-11-06»; las copias locales no versionadas en docs/branding no se agregaron a esta entrega, porque Claude ya integró la firma.

- Verificación local de esta entrega de coordinación: instalación desde lockfile, `npm test` (66 pruebas aprobadas) y `npm run build` correctos; el build incluye el recurso horizontal UnbiraApps. No se editaron archivos de código.


### Avance Google OAuth (2026-11-06)

- [x] **Acceso a Google Cloud recuperado:** la dueña activó la verificación en dos pasos; se comprobó que la consola ya abre normalmente con `unbiraapps@gmail.com`.
- [x] **Proyecto separado de Meneia creado:** nombre Meneia, ID `disco-catcher-513914-n8`, número `564661569637`, sin activar facturación ni prueba de pago. Se mantuvo intacto el OAuth del proyecto Código de Estilo.
- [x] **Configuración inicial de identidad OAuth:** app Meneia, público externo (todavía en Prueba); Google solo permite elegir para soporte una cuenta Google/grupo administrado, por lo que quedó `unbiraapps@gmail.com`. Contacto de desarrollador `contacto@unbiraapps.com`; página principal `https://meneia.unbiraapps.com`; política `https://meneia.unbiraapps.com/privacidad/`; dominio autorizado `unbiraapps.com`. Google confirmó guardado. La dueña autorizó expresamente aceptar la Política de Datos del Usuario de los Servicios de las APIs de Google y se completó esa aceptación.
- Panel: https://console.cloud.google.com/auth/branding?project=disco-catcher-513914-n8
- Huellas públicas SHA-1 para Android `app.meneia`: subida/APK directo `00:CD:5E:64:5A:D7:0F:0F:DE:FD:DF:6B:1D:AA:98:C5:C3:C3:47:E4`; firma de Google Play `95:27:E8:89:7D:21:91:5A:7D:67:52:F8:5A:A1:51:F6:D4:97:3C:63`. La de Play se copió desde su botón público al formulario Android, sin descargar certificados. No se rotó ni cambió ninguna clave.
- [ ] **Clientes OAuth y producción:** cliente web preparado (sin orígenes ni redirecciones, para ID token nativo) y cliente Android de Play preparado con paquete/huella correctos. Falta autorización solicitada para crear las credenciales y guardar el secreto web solamente en Supabase; todavía no hay cliente web ni secreto creado, ni secreto GOOGLE_WEB_CLIENT_ID cargado. Crear también cliente Android de la firma de subida. Limitar datos de ingreso a openid/email/profile; no pedir Gmail, Drive ni salud. Pasar el consentimiento a producción después de completar la configuración.
- [ ] **Supabase:** la dueña informó que el formulario anterior no le aparecía visible. Se abrió otra pestaña explícitamente visible: https://supabase.com/dashboard/new/drrjwgiyjhtrjjuvvlor, con meneia, São Paulo, exposición automática desactivada y RLS automática activada. Sigue pendiente que defina su contraseña y complete Create new project en plan gratis. No se leyó ni se reutilizó la contraseña autocompletada. No hay todavía proyecto Meneia, tabla, RLS por usuaria, proveedor Google, SMTP ni claves Supabase configuradas.
- Resend: sin sesión iniciada al revisar; no se creó cuenta ni se enviaron correos. SMTP propio sigue pendiente, además de los pasos de backend/secretos/workflow/validación de login de la lista original.


### Credenciales OAuth de Meneia creadas (2026-11-06)

- La dueña autorizó crear/conectar los clientes web y Android de `app.meneia` y guardar el secreto web exclusivamente en Supabase.
- [x] **Android Google Play:** `564661569637-bfi4temn7132d25g0d1a3s4qvh65n1p7.apps.googleusercontent.com`, nombre «Meneia - Android Google Play», paquete `app.meneia`, SHA-1 `95:27:E8:89:7D:21:91:5A:7D:67:52:F8:5A:A1:51:F6:D4:97:3C:63`.
- [x] **Android APK directo:** `564661569637-t4al9rb99hb6ttik2jp5ev2enh8uv5ak.apps.googleusercontent.com`, nombre «Meneia - Android APK directo», mismo paquete, SHA-1 `00:CD:5E:64:5A:D7:0F:0F:DE:FD:DF:6B:1D:AA:98:C5:C3:C3:47:E4`.
- [x] **Cliente web para Android/Supabase:** `564661569637-3ihegfafcqspb68gvmgjjpov4mj59ocf.apps.googleusercontent.com`, nombre «Meneia - ingreso Android y Supabase», sin orígenes JavaScript ni URIs de redirección (ingreso nativo por ID token). Se verificaron los tres en la lista de Google Auth Platform.
- [x] **GOOGLE_WEB_CLIENT_ID:** cargado cifrado y existencia verificada en GitHub Actions. Solo contiene el ID público del cliente web; el secreto del cliente NO se envió a GitHub ni al repo.
- [ ] **Guardar secreto web en Supabase:** el cliente web se creó, pero Supabase sigue sin proyecto Meneia creado. Mantener abierto su diálogo de Google hasta transferir el secreto a la configuración del proveedor Google en Supabase; Google avisa que no podrá volver a verse/descargarse al cerrarlo. No guardar el secreto en documentación, chat, capturas ni archivos del repo.
- La dueña consultó por la región: se confirmó que São Paulo es la prevista y se indicó pulsar Create new project solo si continúa FREE, después de guardar su contraseña. Al verificar, la pantalla todavía muestra el formulario de alta; no se pulsó su envío por ella.
- Continúan pendientes Supabase, SQL/RLS, proveedores Google/email, SMTP, variables Pages, los dos secretos Supabase, consentimiento OAuth en producción, nuevo workflow y pruebas de ingreso. No presentar Google como login funcionando todavía.
- Verificaciones de coordinación: 66 pruebas y build web correctos; sin cambios en código. Commit documental con skip ci para no generar otra APK incompleta mientras falta el backend.
