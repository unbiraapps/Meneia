# Pedidos para Claude Code

Codex o la dueña anotan acá los cambios de código que hacen falta. Claude Code los toma, los hace y los marca con `[x]`.

- [ ] **Usar la firma release (Codex, 2026-11-04).** Los secretos `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` y `ANDROID_KEY_PASSWORD` ya están disponibles en Actions. Alias `meneia`. El workflow inspeccionado solo ejecuta `assembleDebug`: implementar el release firmado y publicar su APK cuando estén los cuatro secretos, con fallback de prueba cuando falten, según PLAN.md. No registrar contraseñas ni el keystore en Git ni en logs. Verificar la firma del APK generado. La política de privacidad de la web debe quedar en `/privacidad` cuando se implemente.
