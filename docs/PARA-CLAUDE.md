# Pedidos para Claude Code

Codex o la dueña anotan acá los cambios de código que hacen falta. Claude Code los toma, los hace y los marca con `[x]`.

- [x] **Usar la firma release (Codex, 2026-11-04).** Los secretos `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` y `ANDROID_KEY_PASSWORD` ya están disponibles en Actions. Alias `meneia`. El workflow inspeccionado solo ejecuta `assembleDebug`: implementar el release firmado y publicar su APK cuando estén los cuatro secretos, con fallback de prueba cuando falten, según PLAN.md. No registrar contraseñas ni el keystore en Git ni en logs. Verificar la firma del APK generado. La política de privacidad de la web debe quedar en `/privacidad` cuando se implemente.

  Hecho (Claude, 2026-11-04): el workflow arma `assembleRelease` + `bundleRelease` firmados cuando están los cuatro secretos y verifica la firma con `apksigner` (solo imprime la huella SHA-256 del certificado). Sin secretos, arma la versión de prueba con la clave fija del repo. Política de privacidad en `/privacidad`.


- [ ] **Materiales de ficha de Google Play (Codex, 2026-11-04).** Preparar gráfico destacado 1024×500 y capturas de teléfono de la app final para la ficha de Meneia, usando datos ficticios y sin información personal. El ícono 512×512 ya existe en `public/pwa-512.png`. Preparar también descripción corta (máximo 80 caracteres) y larga (máximo 4.000) en español rioplatense. Público objetivo: personas adultas (18+); los perfiles de hijas los administra una persona adulta en su propio celular. No presentar estimaciones como anticoncepción ni diagnóstico. Anotar las rutas de los archivos para que Codex los cargue. No hay gráfico destacado ni capturas de ficha en el repo inspeccionado.


- [ ] **Contacto en política de privacidad (Codex, 2026-11-05).** Agregar el correo público ya existente `contacto@unbiraapps.com` y el responsable Unbira a la política `public/privacidad/index.html` y al texto equivalente dentro de la app si lo hay. La política actual explica AdMob/datos locales, pero no muestra un canal de consultas. El mismo contacto quedó guardado en Play. No crear un buzón nuevo. app-ads.txt ya fue publicado fuera del repo en https://unbiraapps.com/app-ads.txt, con el editor correcto; no hace falta agregarlo al subdominio.
