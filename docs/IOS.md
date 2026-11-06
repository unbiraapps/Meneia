# Meneia para iPhone: etapas

Plan completo (para leer): https://claude.ai/artifact/9BU3r74UEnLCtX52D9rdpU
Base: lo que ya resolvió Código de Estilo (cuenta Apple Developer del equipo 72L65TRKSY, App Store Connect, TestFlight externo).
Codex se usa para las conexiones con cuentas que ya existen (Apple, App Store Connect, AdMob, Supabase, secretos de GitHub).

| Etapa | Qué | Quién | Estado |
| --- | --- | --- | --- |
| 1 | Preparar la app para iPhone y compilarla en la nube sin firma | Claude | En curso |
| 2 | Conectar cuentas: identificador, ficha, acuerdo de apps pagas, suscripción, AdMob iOS, Apple en Supabase, clave de API y secretos | Codex + dueña | Esperando a Codex (`docs/PARA-CODEX.md`, sección iPhone) |
| 3 | Primera compilación firmada en TestFlight y prueba en el iPhone de la amiga | Claude + Codex + dueña | Pendiente |
| 4 | Ficha, capturas, privacidad, edad, cuenta de demostración y envío a revisión | Claude (materiales) + Codex (carga) | Pendiente |

## Etapa 1: detalle

- [x] Proyecto iOS en `ios/` (Capacitor 8.6, Swift Package Manager): `com.unbiraapps.meneia`, solo iPhone, iOS 15+, retrato, modo oscuro.
- [x] Info.plist: Face ID, cifrado exento (`ITSAppUsesNonExemptEncryption = NO`), ID de AdMob por variable `GAD_APPLICATION_ID` (prueba por defecto), SKAdNetwork de Google.
- [x] `App.entitlements`: Iniciar sesión con Apple. `PrivacyInfo.xcprivacy`: sin rastreo; UserDefaults (CA92.1) y fechas de archivos (C617.1).
- [x] Complementos por plataforma (`capacitor.config.ts`): Google solo en Android, Apple solo en iPhone. El complemento de Apple tiene un parche (`patches/`) para Capacitor 8.
- [x] Código: textos de tienda según el celular (`src/platform.ts`), IDs de AdMob de iPhone, producto `com.unbiraapps.meneia.sinanuncios.mensual`, «Restaurar compras», enlaces a términos de Apple y privacidad, canales de avisos solo en Android, tope de 60 avisos pendientes en iPhone, Face ID / Touch ID en los textos.
- [x] Ícono 1024×1024 RGB sin transparencia y pantalla de inicio oscura (`npm run ios:res`).
- [x] Compilación en GitHub (`.github/workflows/ios.yml`, Mac `macos-26`): en cada cambio, simulador sin firma + capturas a los 8, 20 y 40 s (artefacto `iphone-simulador`). A mano con «subir»: firma automática con la clave de la API y subida a TestFlight, sin enviar a revisión.
- [ ] Primera compilación de simulador verde y capturas revisadas.

## Decisiones tomadas (6/11/2026, recomendaciones del plan aceptadas al arrancar)

- En iPhone se entra con Apple o email (sin Google en la primera versión).
- «Sin anuncios» al mismo precio que en Android (USD 9,99 por mes), producto `com.unbiraapps.meneia.sinanuncios.mensual`.
- Anotarse en el programa de pequeños desarrolladores (15 %).
- Sin países de la Unión Europea al principio (evita publicar dirección y teléfono por la ley de servicios digitales).
- Clasificación: la del cuestionario; si da menos de 18+, subirla a 18+.
- Compilación en GitHub Actions; si la firma falla, plan B Codemagic (como Código de Estilo).
