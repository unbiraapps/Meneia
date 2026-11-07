# Pedidos para Claude Code

Codex o la dueña anotan acá los cambios de código que hacen falta. Claude Code los toma, los hace y los marca con `[x]`.

- [x] **Usar la firma release (Codex, 2026-11-04).** Los secretos `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` y `ANDROID_KEY_PASSWORD` ya están disponibles en Actions. Alias `meneia`. El workflow inspeccionado solo ejecuta `assembleDebug`: implementar el release firmado y publicar su APK cuando estén los cuatro secretos, con fallback de prueba cuando falten, según PLAN.md. No registrar contraseñas ni el keystore en Git ni en logs. Verificar la firma del APK generado. La política de privacidad de la web debe quedar en `/privacidad` cuando se implemente.

  Hecho (Claude, 2026-11-04): el workflow arma `assembleRelease` + `bundleRelease` firmados cuando están los cuatro secretos y verifica la firma con `apksigner` (solo imprime la huella SHA-256 del certificado). Sin secretos, arma la versión de prueba con la clave fija del repo. Política de privacidad en `/privacidad`.


- [x] **Materiales de ficha de Google Play (Codex, 2026-11-04).** Preparar gráfico destacado 1024×500 y capturas de teléfono de la app final para la ficha de Meneia, usando datos ficticios y sin información personal. El ícono 512×512 ya existe en `public/pwa-512.png`. Preparar también descripción corta (máximo 80 caracteres) y larga (máximo 4.000) en español rioplatense. Público objetivo: personas adultas (18+); los perfiles de hijas los administra una persona adulta en su propio celular. No presentar estimaciones como anticoncepción ni diagnóstico. Anotar las rutas de los archivos para que Codex los cargue. No hay gráfico destacado ni capturas de ficha en el repo inspeccionado.

  Hecho (Claude, 2026-11-06): textos en `docs/tienda/textos.md` (sección Google Play: nombre, descripción breve de 77 caracteres, descripción completa de ~1.700). Gráfico destacado `store-assets/android/grafico-destacado.png` (1024×500, RGB). Capturas de teléfono 1080×1920 con datos inventados: `store-assets/android/1-hoy.png`, `2-calendario.png`, `3-historial.png`, `4-familia.png`, `5-salud.png`, `6-como-estoy.png`. Ícono 512: `public/pwa-512.png`.


- [x] **Contacto en política de privacidad (Codex, 2026-11-05).** Agregar el correo público ya existente `contacto@unbiraapps.com` y el responsable Unbira a la política `public/privacidad/index.html` y al texto equivalente dentro de la app si lo hay. La política actual explica AdMob/datos locales, pero no muestra un canal de consultas. El mismo contacto quedó guardado en Play. No crear un buzón nuevo. app-ads.txt ya fue publicado fuera del repo en https://unbiraapps.com/app-ads.txt, con el editor correcto; no hace falta agregarlo al subdominio.


- [x] **Cambio aprobado: Sin anuncios mensual y acceso gratis sin tarjeta (dueña, 2026-11-05).** La dueña confirmó expresamente **USD 9,99 por mes** para quitar anuncios; sustituye la decisión anterior de pago único. Todas las funciones siguen disponibles gratis con anuncios: no pedir tarjeta, no abrir Billing, no exigir suscripción ni inscripción a prueba de pago para entrar o continuar gratis. Mostrar una opción clara «Continuar gratis con anuncios», sin tarjeta ni compromiso y sin seleccionar el pago por defecto. Los primeros siete días sin anuncios son una cortesía local del plan gratuito, nunca un trial de suscripción ni una conversión automática a cobro.
  - Integración nueva: suscripción de Play **`sin_anuncios_mensual`**, plan básico **`mensual`**, renovación automática mensual. El producto único anterior `sin_anuncios` permanece en borrador, sin activar ni vender. Confirmar estado y precio finales en PARA-CODEX.
  - Cambiar `src/ads.ts`: actualmente usa `PURCHASE_TYPE.INAPP` y propiedad permanente. Implementar suscripción, leer el precio y período reales de Play, elegir plan/offer token correspondiente; reconocer/restaurar solo el derecho vigente, manejar cancelación (conservar acceso hasta finalizar el período pagado), vencimiento y fallos sin bloquear la modalidad gratis ni borrar datos. No confiar en un booleano premium permanente. Añadir acceso a administrar/cancelar la suscripción en Play.
  - Cambiar `src/app/Plan.tsx`, textos de onboarding/perfil, PLAN.md y política de privacidad: quitar «pago único», mostrar claramente precio mensual, renovación automática y cancelación antes de que la persona elija pagar. El flujo de cobro debe abrirse exclusivamente por una acción explícita de suscribirse. Sin prueba gratuita de suscripción ni tarjeta para el plan gratuito.
  - Verificar con Billing de prueba que: gratis funciona sin medio de pago; cancelar/cerrar el pago permite continuar gratis; suscripción/restauración vigente quitan anuncios; vencimiento vuelve a gratis sin perder datos. La APK que estaba disponible antes de este cambio todavía tiene textos e integración de pago único; no presentarla como implementación final mensual.

  Hecho (Claude, 2026-11-05): suscripción `sin_anuncios_mensual` / plan `mensual` (Billing SUBS); el precio y período se leen de Play; al abrir y al volver a la app se consulta el derecho vigente (cancelada = sin anuncios hasta el fin del período; vencida = vuelve a gratis sin tocar datos); "Administrar o cancelar" abre Play; "Restaurar suscripción". Al empezar: botón principal "Continuar gratis con anuncios"; el cobro solo se abre con "Suscribirme", con precio, renovación y cancelación visibles antes. Política con contacto y suscripción. La APK del Drive se arma con anuncios de prueba de Google (para no mirar anuncios reales en el propio celular); el AAB de Play usa los IDs reales. Falta validar el cobro con una cuenta de prueba de licencias en Play (ver PARA-CODEX).


### Estado de preparación de Play (Codex, 2026-11-06)

- La firma UnbiraApps de `c9da844` y la corrida 37 ya están verificadas; no duplicar la integración.
- Textos e ícono de ficha cargados y guardados en borrador de Play. Del pedido de materiales siguen faltando el gráfico 1024x500 y las capturas; conservar datos ficticios.
- El login implementado todavía espera Supabase y OAuth: faltan los tres secretos. La dueña recibió las pantallas de creación de contraseña de Supabase y activación de 2FA obligatoria de Google Cloud. No presentar la APK 37 como ingreso Google funcionando ni asumir configuración completada. Seguimiento en PARA-CODEX.


### Conexiones iPhone y bloqueos (Codex, 2026-11-07)

- App ID registrado: `com.unbiraapps.meneia`, equipo `72L65TRKSY`, descripción Meneia. Sign In with Apple principal e In-App Purchase habilitados.
- **Ficha iPhone creada, Apple ID `6831992382`**: https://appstoreconnect.apple.com/apps/6831992382/distribution. iOS, nombre Meneia, español (México), SKU meneia-ios, acceso completo.
- **Compilación procesada en TestFlight: ninguna todavía.** No hay número que informar; no se ejecutó la subida firmada. Faltan la clave API y los secretos de iOS.
- Textos de versión 1.0 y publicación manual preparados, pero guardado no confirmado. Al abrir el gestor multimedia apareció «¿Seguro que quieres salir de esta página? Los cambios que no hayas guardado se perderán». Después la herramienta informó `Timed out running CDP command "Emulation.setFocusEmulationEnabled" for tab 46`. Se pidió a la dueña Cancelar y Guardar. No se declara la ficha terminada.
- Capturas de 1320×2868: seleccionar el tamaño grande de iPhone en el gestor. El encabezado del producto y el tamaño mediano predeterminado no corresponden. Error del primer intento: «1-hoy.png: las dimensiones del archivo no son válidas». No hace falta regenerar imágenes por ese intento en la sección equivocada.
- Apple muestra «Se ha actualizado el contrato de licencia del Apple Developer Program» y solicita que el titular revise y acepte el contrato; en Developer figura antes del 13/11/2026. Pendiente de la dueña, además del acuerdo de apps pagas/banco/impuestos y programa de pequeños desarrolladores.
- Apple en Supabase sigue DISABLED: el panel abre, pero los clics no abren sus ajustes mientras el navegador está bloqueado. No se habilitó ni se creó un secreto de Apple.
- Drive: API habilitada y cliente de escritorio propio creado. Reautorización detenida por «Acceso bloqueado: Meneia no completó el proceso de verificación de Google» / «Error 403: access_denied», porque el proyecto OAuth sigue en Prueba. RCLONE_CONF anterior conservado. No se agregó ningún probador.
- Google Play: textos de docs/tienda/textos.md, gráfico destacado y seis capturas Android guardados como borrador; consola confirmó «Se guardaron los cambios». No enviado a revisión.
- No se modificó código de app, Código de Estilo ni sus claves. No se agregaron probadores ni se habilitaron enlaces de TestFlight.
