import { Capacitor } from '@capacitor/core';

/**
 * Service worker solo para la versión web instalable.
 * Dentro de la app de Android o iPhone los archivos ya vienen en el paquete: un service worker viejo
 * puede seguir sirviendo la versión anterior después de actualizar (y pedir imágenes que ya no existen).
 * Si quedó uno de una versión anterior, se borra junto con su caché y se recarga una vez.
 */
export async function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (!Capacitor.isNativePlatform()) {
    const { registerSW } = await import('virtual:pwa-register');
    registerSW({ immediate: true });
    return;
  }
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    if (!regs.length) return;
    await Promise.all(regs.map(r => r.unregister()));
    if ('caches' in window) for (const k of await caches.keys()) await caches.delete(k);
    if (navigator.serviceWorker.controller) location.reload();
  } catch { /* sin service worker: nada que limpiar */ }
}
