# Marca de Meneia (M lunar)

El ícono aprobado (M marfil con fases lunares sobre violeta oscuro) sale de un único archivo maestro:

- `branding/meneia-icono-maestro.png`: 1254 × 1254 px, RGB opaco, cuadrado sin bordes redondeados.
  Original de la dueña: `meneia-icono-lunar-alta-resolucion.png` (carpeta `mockups/meneia-identidad`).

`marca.png` (384 px) es la marca dentro de la app: bienvenida, Acerca de, bloqueo y Perfil. El CSS la redondea.

Para regenerar todo después de cambiar el maestro:

```
npm run icons        # web, PWA, marca de la app e ícono de Google Play
npm run android:res  # íconos, notificación y pantalla de inicio de Android
npm run ios:res      # AppIcon y pantalla de inicio de iPhone
npx cap sync
```

La lista completa de archivos generados está en `docs/ICONOS.md`.
