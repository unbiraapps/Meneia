# Meneia

Del griego *mēnē* (μήνη), la Luna y la medida del mes.


Registro de períodos con ovulación estimada, próximo período probable, avisos cuando cambia la duración del ciclo y registro de cuándo se dejaron o empezaron las pastillas anticonceptivas.

Los datos se guardan solo en el celular. No hay cuentas ni servidores.

## Qué tiene

- Próximo período probable, ovulación estimada y días fértiles, según el promedio de los últimos 6 ciclos.
- Calendario con período, período probable, días fértiles, ovulación y cambios de pastillas.
- Avisos cuando el ciclo se alarga o acorta 3 días o más, cuando el sangrado cambia 2 días o más, cuando dura más de 7 días, cuando un ciclo queda fuera de 21–35 días y cuando hay atraso.
- Con pastillas activas no estima ovulación, porque no aplica.
- Editar y borrar registros.
- Copia de seguridad: copiar, descargar y restaurar.
- Notificaciones programadas en la app de Android: antes del período, inicio de la ventana fértil, ovulación (apagada por defecto) y atraso a los 2, 5 y 10 días.
- Pasa sola los datos del prototipo anterior.

## Estructura

```
src/calc.ts     cálculos (fechas, ciclos, avisos). Funciones puras, con pruebas.
src/db.ts       datos en el celular (IndexedDB con Dexie) y copias de seguridad.
src/notify.ts   notificaciones de Android (Capacitor Local Notifications).
src/share.ts    compartir la copia en Android.
src/main.ts     pantalla.
src/styles.css  diseño lila, claro y oscuro.
tests/          pruebas automáticas (Vitest).
android/        proyecto de la app de Android (Capacitor).
```

Si más adelante se pasa a React, solo cambia `main.ts`. Los cálculos, los datos y las notificaciones se reusan tal cual.

## Comandos

```
npm install
npm run dev             # verla en la compu
npm test                # pruebas
npm run build           # app instalable (PWA) en dist/
npm run build:artifact  # versión de un solo archivo
npm run android:apk     # APK (necesita Android Studio o el SDK de Android)
```

## Publicar y conseguir la app de Android sin instalar nada

1. Subir esta carpeta a un repositorio de GitHub (rama `main`).
2. **App web:** en el repositorio, Settings > Pages > Source: "GitHub Actions". Cada cambio se publica en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`. Desde Brave o Chrome en el celular: menú > "Agregar a pantalla de inicio".
3. **App de Android:** pestaña Actions > "App de Android". Al terminar, bajar `meneia-apk`, descomprimirlo y abrir `meneia.apk` en el celular. Android pide permitir "instalar apps de esta fuente" una vez.

La primera vez que se abre la app de Android pide permiso para notificaciones (sección Avisos > Permitir notificaciones).

Las fechas son estimaciones y no sirven como método anticonceptivo.
