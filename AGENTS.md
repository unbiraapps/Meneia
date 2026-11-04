# Meneia: instrucciones para Codex

El plan completo está en `docs/PLAN.md` y las reglas del código en `CLAUDE.md`. El desarrollo lo hace Claude Code. Codex se encarga de todo lo que pasa fuera del repositorio:

- Cloudflare Pages y DNS de `meneia.unbiraapps.com`, que publica `dist/` desde este repo.
- Secretos de GitHub del repo `unbiraapps/Meneia`.
- Google Play Console: ficha, formulario de apps de salud, seguridad de datos y pruebas.
- AdMob y productos de pago en Play Console.
- Supabase, cuando el plan lo pida.

## Cómo coordinar

- La lista de pendientes para Codex está en `docs/PARA-CODEX.md`. Cuando termines una tarea, marcala con `[x]` y anotá el resultado (IDs, URLs) sin escribir nunca contraseñas ni claves.
- Los valores secretos van solo a los secretos de GitHub, nunca al código.
- No cambies código de la app. Si hace falta un cambio, anotalo en `docs/PARA-CLAUDE.md`.
