import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `vite build`                -> app instalable (PWA) y base de la app de Android, en dist/
// `vite build --mode artifact` -> un solo archivo HTML para vista previa, en dist-artifact/
const oxc = { jsx: { runtime: 'automatic' as const } };

export default defineConfig(({ mode }) => mode === 'artifact'
  ? { base: './', oxc, plugins: [viteSingleFile()], build: { outDir: 'dist-artifact', emptyOutDir: true } }
  : {
      base: './',
      oxc,
      build: { outDir: 'dist', emptyOutDir: true },
      plugins: [VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Meneia',
          short_name: 'Meneia',
          description: 'Registro de períodos, ovulación estimada y avisos de cambios en el ciclo.',
          lang: 'es-AR',
          start_url: './',
          scope: './',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#17131F',
          theme_color: '#17131F',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png}'],
          runtimeCaching: [
            { urlPattern: /^https:\/\/fonts\.googleapis\.com\//, handler: 'StaleWhileRevalidate', options: { cacheName: 'fuentes-css' } },
            { urlPattern: /^https:\/\/fonts\.gstatic\.com\//, handler: 'CacheFirst', options: { cacheName: 'fuentes', expiration: { maxEntries: 20, maxAgeSeconds: 31536000 }, cacheableResponse: { statuses: [0, 200] } } },
          ],
        },
      })],
    });
