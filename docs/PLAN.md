# Meneia: plan de trabajo

Proyecto completo con diseño y fundamentos: página "Proyecto Meneia Android" en Claude.
Maqueta de pantallas: "Meneia · maqueta Android" en Claude.

## Decisiones tomadas

- 2026-11-11: período pendiente, tests y embarazo (aprobado por la dueña). "Todavía no me vino" desde el día más probable; "Período pendiente" cuando pasaron los posibles días (se calcula, no se guarda). Tests y "Registrar embarazo confirmado" solo con "Buscar embarazo" activo (perfil propio, 18+). Con un embarazo registrado: sin fechas estimadas, ventana fértil ni avisos del ciclo, y sin contador de semanas. Al registrarlo se ofrece desactivar "Buscar embarazo" (marcado) y pausar el aviso de pastillas; "Deshacer" lo borra y vuelve "Buscar embarazo" a como estaba. Al volver al ciclo se espera el primer período y siguen 3 ciclos de adaptación. El aviso de pendiente dice "Tenés un registro pendiente en Meneia". Datos en la tabla `registros` (Dexie v4); copia versión 3.

- 2026-11-10: identidad aprobada. La bienvenida solo aparece antes de Inicio (instalación nueva). "Ya uso Meneia" lleva a recuperar una copia (archivo o nube) y después a Inicio con los datos cargados. Mientras no esté el original, la marca dentro de la app es un recorte provisorio de la maqueta; los íconos del sistema no se tocan.

- La app se llama **Meneia**. Es siempre oscura, con la paleta lila de `src/styles.css`, y el texto va en español rioplatense (vos).
- Los datos de salud **nunca salen del celular sin cifrar** y no hay cuenta obligatoria. La copia en la nube es opcional: entra con Google o con email y contraseña, se cifra en el celular con una contraseña de copia que solo sabe ella (PBKDF2 + AES-GCM) y Supabase guarda solo el sobre cifrado. Si olvida la contraseña, la copia no se puede recuperar (decidido el 5/11/2026).
- **No se guardan estudios**: ni PDF ni fotos ni archivos médicos.
- **Buscar embarazo** solo se muestra si el perfil tiene 18 años o más.
- Los perfiles de hijas nunca muestran fertilidad, ovulación ni embarazo.
- **Anuncios de pantalla completa:** después de guardar algo o cada 4 cambios de pestaña, con al menos 30 minutos entre uno y otro (2 minutos en la APK de prueba). Antes era uno por día; la dueña pidió que aparezcan cada tanto (5/11/2026).
- **iPhone** (6/11/2026): se publica también en el App Store con la cuenta de Apple de Unbira. Etapas y decisiones en `docs/IOS.md`.
- **Familia solo en Perfil › Familia** (5/11/2026): Hoy, Calendario e Historial muestran siempre tus días, sin selector de perfiles. Ahí está cada hija con "Le vino" y "Ver sus días" (su calendario e historial).
- **Hijas: los días los anota la mamá** desde su celular. No hay invitación ni sincronización entre celulares (decidido el 5/11/2026; la opción de que la hija comparta desde su teléfono quedó descartada por ahora).
- **Gratis con anuncios, y versión "Sin anuncios" de pago único.** Las dos tienen todas las funciones. Al empezar se elige una de las dos y la app nunca pide tarjeta: el pago lo hace Google Play. Se puede cambiar desde Perfil.
- Supabase se usa solo más adelante y es opcional: para que una hija comparta con la mamá, con los datos cifrados.
- La web y la política de privacidad van en `meneia.unbiraapps.com` (Cloudflare Pages).
- La prueba de Google Play (12 testers durante 14 días) la resuelve la dueña con un servicio contratado, al final.
- Las versiones de prueba se firman con una clave fija que está en el repositorio (`android/app/meneia-debug.keystore`, no es secreta), así cada APK se instala encima del anterior sin perder datos.
- Los períodos anteriores cargados con "Buscar embarazo" activo solo se marcan como "buscando" si empezaron en los últimos 45 días.
- Ciclos irregulares: variación de más de 7 días entre el más corto y el más largo de los últimos 6 que cuentan. Margen automático: la mitad de la variación (entre ±2 y ±7), ±3 como mínimo con pocos datos y +2 en ciclos de adaptación.
- Al cargar el blíster actual, las pastillas de días anteriores del blíster se dan por tomadas.
- "Anotar algo" en Hoy pasó a ser "Cómo estoy" (síntomas). Los períodos se cargan con "Me vino", desde el calendario o desde Historial.
- La pestaña Salud ya tiene la última consulta, el aviso de control y las preguntas. Las consultas anteriores quedan para la etapa 3.

## Quién hace qué

| Claude Code (desarrollo) | Codex (cuentas, publicación y links) |
|---|---|
| Código, pantallas, cálculos, pruebas | Cloudflare Pages y DNS de `meneia.unbiraapps.com` |
| Workflows de GitHub Actions | Secretos de GitHub (keystore, AdMob IDs) |
| Política de privacidad (texto) | Cuenta de Google Play Console, ficha, formularios |
| Integración AdMob y Billing en el código | Alta en AdMob y productos de pago en Play Console |
| | Supabase (cuando toque) |

Las tareas que necesitan cuentas o paneles web se anotan en `docs/PARA-CODEX.md`, y Codex las va marcando ahí.

## Etapa 1: nueva estructura, familia y privacidad

- [x] Migrar la interfaz a React + TypeScript. `src/calc.ts`, `src/db.ts` y `src/notify.ts` se reusan.
- [x] Barra inferior con Hoy, Calendario, Historial, Salud y Perfil, y botón "Me vino" en Hoy.
- [x] Perfiles en Dexie (`profiles`) con nombre, color, fecha de nacimiento y modos. Los períodos, eventos y ajustes pasan a llevar `profileId`, y lo actual se migra al perfil "Yo" sin perder datos.
- [x] Pantalla de inicio "¿Qué querés seguir?": Mi ciclo, Buscar embarazo (+18) y Ciclos de mis hijas.
- [x] Familia: perfiles de hijas, modo "todavía no le vino", un solo aviso antes del período (apagado, 1, 2 o 3 días) y lista de compras editable.
- [x] Privacidad:
  - Bloqueo con huella o PIN al abrir y al volver a la app.
  - Tapar con un toque.
  - FLAG_SECURE (no aparece en recientes ni en capturas).
- [x] Avisos discretos: texto "Tenés un recordatorio", punto de color elegible, canal silencioso, oculto en la pantalla de bloqueo, horario sin avisos. Los avisos de familia dicen "Lista de compras para esta semana".
- [x] Versión firmada (release) en el workflow. Usa los secretos `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` y `ANDROID_KEY_PASSWORD`, y si no están, compila la versión de prueba.
- [x] Pruebas de todo lo nuevo (perfiles, migración, avisos de familia, regla de +18).

## Etapa 2: predicciones, pastillas y síntomas

- [x] Rango a medida según la variación de los ciclos, y mediana en vez de promedio.
- [x] Etiqueta de confianza: pocos datos (menos de 3 ciclos), media (3 a 5) y firme (6 o más con poca variación).
- [x] Ciclos raros marcables y ciclos de adaptación (los 3 después de dejar las pastillas) que no cuentan.
- [x] Ciclos irregulares: "posibles días" con margen ajustable (±2 a ±7) y aviso al empezar.
- [x] Atraso contado desde el final del rango.
- [x] "Cuánto acertó" al anotar "Me vino".
- [x] Rangos de FIGO para adultas: ciclo de 24 a 38 días, variación de 7 a 9 días y sangrado de hasta 8 días. Para menores, margen amplio y sin alertas alarmantes.
- [x] Pastillas: toma diaria con "La tomé", blíster de 21+7, recordatorio a la hora elegida, blísters en casa y aviso para comprar.
- [x] Síntomas: dolor (nada, leve, medio, fuerte), cuerpo, ánimo, nota y síntomas propios. "Lo que se repite" con 3 ciclos o más. Los perfiles de hijas registran solo dolor y ánimo.

## Etapa 3: salud y copia

- [x] Consultas: última consulta, consultas anteriores (fecha, motivo, nota), aviso del próximo control y preguntas para la próxima visita.
- [x] Copia de seguridad v2 con perfiles, síntomas, pastillas y consultas, y que siga leyendo la v1.

## Etapa 4: anuncios, pago y Google Play

- [x] AdMob, solo anuncios no personalizados. Banner al pie de Calendario e Historial, y como mucho 1 anuncio de pantalla completa por día, solo después de guardar algo. Nunca al abrir, en el bloqueo, en avisos ni en perfiles de hijas, ni durante los primeros 7 días.
- [x] Anuncio con premio opcional: una semana sin anuncios.
- [x] Facturación de Google Play: un producto que quita los anuncios. El precio lo define la dueña.
- [x] Política de privacidad en `meneia.unbiraapps.com/privacidad`.
- [ ] Ficha de Play, formulario de apps de salud y sección de seguridad de datos (le toca a Codex).

## Reglas para trabajar

- Antes de cada commit: `npm test` y `npm run build`, sin errores.
- Commits chicos con mensaje en español. Push a `main`: el workflow arma el APK en `releases/download/ultima-version/meneia.apk`.
- No agregar librerías de analítica ni de rastreo. AdMob es la única excepción, y solo en la etapa 4.
- Nada de pop-ups para pagar, artículos, horóscopo, chats ni rachas.
