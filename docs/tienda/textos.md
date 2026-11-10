# Textos de las fichas de Meneia

Para que Codex los cargue en App Store Connect y en Google Play Console. Español rioplatense. Sin promesas médicas: las fechas son estimaciones y no sirven como anticonceptivo.

## Comunes

- Soporte: https://meneia.unbiraapps.com/soporte/
- Privacidad: https://meneia.unbiraapps.com/privacidad/
- Borrar cuenta: https://meneia.unbiraapps.com/borrar-cuenta/
- Contacto: contacto@unbiraapps.com
- Copyright (App Store): © 2026 UnbiraApps

## Descripción larga (App Store, máx. 4.000; Google Play, máx. 4.000)

Meneia te ayuda a seguir tu ciclo sin ruido y sin que tus datos salgan de tu celular.

Anotá cuándo te vino y Meneia calcula cuándo te toca de nuevo, con un rango de días posibles que se ajusta a cómo son tus ciclos. Si tus ciclos son irregulares, te lo dice claro y podés ajustar el margen vos.

LO QUE PODÉS HACER
• Ver de un vistazo cuántos días faltan y en qué día del ciclo estás.
• Calendario con tus días, los más probables y los posibles.
• Historial con la duración de cada ciclo y cómo te sentiste.
• Anotar dolor, cuerpo y ánimo, y ver si se repiten en los mismos momentos del ciclo.
• Pastillas anticonceptivas: aviso diario para tomarla y aviso para comprar la caja siguiente.
• Salud: tus consultas con la ginecóloga, un aviso para el próximo control y una lista de preguntas para llevar.
• Buscar embarazo (solo mayores de 18): días fértiles estimados.
• Familia: anotá los días de tus hijas desde tu celular y recibí un aviso antes de su próximo período con la lista de compras. Ellas no necesitan la app.

PRIVACIDAD
• Tus registros se guardan en tu dispositivo. Sin cuenta obligatoria.
• Bloqueo con PIN, huella o Face ID.
• Avisos discretos: el texto es neutro y nunca dice "período" ni nombres.
• La app se tapa en la lista de apps abiertas.
• Copia de seguridad en un archivo, o en la nube cifrada con una contraseña que solo sabés vos.

GRATIS CON ANUNCIOS
Se puede usar sin pagar. Los anuncios no son personalizados y nunca reciben tus datos de salud. Si preferís no verlos, está la suscripción mensual "Sin anuncios".

Las fechas son estimaciones según tus ciclos anteriores. Meneia no es un método anticonceptivo ni reemplaza la consulta médica.

## App Store

| Campo | Texto | Límite |
| --- | --- | --- |
| Nombre | Meneia · Ciclo menstrual | 30 |
| Subtítulo | Tu ciclo, a tu ritmo | 30 |
| Texto promocional | Seguí tu ciclo, tus pastillas y los días de tus hijas con avisos discretos. Con PIN o Face ID y copia de seguridad cifrada opcional. | 170 |
| Palabras clave | período,menstruación,regla,calendario,ovulación,fértil,pastillas,síntomas,hijas,ginecóloga,ciclo | 100 |
| Categoría principal | Salud y forma física | |
| Categoría secundaria | Estilo de vida | |
| Precio de la app | Gratis | |

Si "Meneia · Ciclo menstrual" no está disponible, usar "Meneia: tu ciclo".

### Suscripción (App Store Connect)

- Grupo: Sin anuncios
- Nombre visible: Sin anuncios
- Descripción (máx. 45): Usá Meneia sin publicidad
- Captura para la revisión: `store-assets/ios/revision-suscripcion.png` (pantalla Perfil con la opción de suscripción)

### Notas para la revisión de Apple

```
Meneia is a menstrual cycle tracker. All health data stays on the device; there is no required account.

How to test:
1. Complete the 4 onboarding steps (any birth date over 18; "Ahora no" skips the PIN; "Continuar gratis con anuncios" uses the free plan).
2. Today tab: tap "Me vino" to log a period. Calendar and History update.
3. Profile > Familia: add a daughter and log her period with "Le vino".
4. Profile > Version: the "Sin anuncios" monthly auto-renewable subscription removes ads; all features are free with ads. "Restaurar compras" restores it.
5. Profile > Copia de seguridad: optional encrypted cloud backup with Sign in with Apple or email. Demo account (email): [la carga Codex] / password: [la escribe la dueña en App Store Connect]. The backup password is chosen by the user and never leaves the device.
6. Account deletion: Profile > Copia de seguridad > "Borrar mi copia y mi cuenta".

Ads are always non-personalized; the app does not track users and does not request App Tracking Transparency. Health data is never shared with the ad SDK.
Predictions are estimates and the app states it is not a contraceptive method.
```

### Qué probar (TestFlight)

```
Probá el recorrido completo: pasos de inicio, "Me vino", Calendario, Historial, "Cómo estoy", Pastillas, Salud y Familia (agregar una hija y anotar que le vino). Activá el PIN y Face ID en Perfil › Privacidad, cerrá la app y volvé a abrirla. Revisá que los avisos lleguen con texto neutro. La suscripción usa el entorno de prueba de Apple: no se cobra. Anotá cualquier pantalla que se vea cortada o en inglés.
```

### Clasificación por edad (cuestionario nuevo)

| Pregunta | Respuesta |
| --- | --- |
| Violencia, contenido sexual, desnudez, lenguaje, terror, drogas, alcohol, tabaco, apuestas, concursos | Ninguno |
| Temas médicos o de tratamiento | Sí, poco frecuente o leve (seguimiento del ciclo, sin diagnóstico ni tratamiento) |
| Temas de salud o bienestar | Sí |
| Contenido generado por usuarios / mensajes entre usuarios | No |
| Acceso libre a la web | No |
| Publicidad | Sí |
| Controles parentales / verificación de edad | No |
| Clasificación final | Si el cálculo da menos de 18+, subirla a 18+ (igual que el público declarado en Google Play) |

### Privacidad de la app (App Store Connect)

Recopila datos: **Sí**.

| Tipo de dato | Para qué | Vinculado a la persona | Para rastreo | Origen |
| --- | --- | --- | --- | --- |
| Correo electrónico | Funcionalidad de la app (cuenta de la copia en la nube, opcional) | Sí | No | Cuenta |
| ID de usuario | Funcionalidad de la app | Sí | No | Cuenta (Supabase) |
| Salud | Funcionalidad de la app (copia en la nube cifrada, opcional) | Sí | No | Copia en la nube. Va cifrada y no podemos leerla, pero Apple no aclara ese caso: se declara por las dudas |
| ID del dispositivo | Publicidad de terceros, analíticas | No | No | AdMob |
| Datos de publicidad | Publicidad de terceros, analíticas | No | No | AdMob |
| Interacción con el producto | Publicidad de terceros | No | No | AdMob |
| Ubicación aproximada | Publicidad de terceros | No | No | AdMob (por la dirección IP) |
| Registros de fallos | Funcionalidad de la app | No | No | AdMob |
| Datos de rendimiento | Analíticas | No | No | AdMob |

Fuente para AdMob: https://developers.google.com/admob/ios/privacy/data-disclosure (revisarla al cargar, por si cambió).
Rastreo: **No** (sin ATT, sin IDFA).

## Google Play

| Campo | Texto | Límite |
| --- | --- | --- |
| Nombre | Meneia: ciclo menstrual | 30 |
| Descripción breve | Tu ciclo a tu ritmo: avisos discretos y los días de tus hijas. | 80 |
| Descripción completa | La descripción larga de arriba, igual | 4.000 |
| Categoría | Salud y bienestar | |
| Gráfico destacado | `store-assets/android/grafico-destacado.png` (1024×500) | |
| Capturas de teléfono | `store-assets/android/1-hoy.png` … `6-perfil.png` | |
