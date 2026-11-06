// Diferencias entre la app de Android y la de iPhone (textos y tiendas). La lógica es la misma.
import { Capacitor } from '@capacitor/core';

export const isIOS = () => Capacitor.getPlatform() === 'ios';
/** "Google Play" o "App Store", según el celular. */
export const store = () => (isIOS() ? 'App Store' : 'Google Play');
/** Dónde se cobra la suscripción, para los textos. */
export const storeAccount = () => (isIOS() ? 'tu cuenta de Apple' : 'tu cuenta de Google Play');
