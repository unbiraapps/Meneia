// Bloqueo con huella, Face ID o PIN, y pantalla protegida. Nada de esto sale del celular.
import { Capacitor } from '@capacitor/core';
import { PrivacyScreen } from '@capacitor-community/privacy-screen';
import { BiometryType, NativeBiometric } from '@capgo/capacitor-native-biometric';

const native = () => Capacitor.isNativePlatform();

/** SHA-256 del PIN con una sal fija de la app. El PIN nunca se guarda tal cual. */
export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode('meneia:' + pin);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const validPin = (pin: string) => /^\d{4,6}$/.test(pin);

/** Cómo se llama el desbloqueo del celular, para los textos. */
export type BioName = 'Face ID' | 'Touch ID' | 'huella';

/** El desbloqueo biométrico disponible, o null si no hay. */
export async function biometricAvailable(): Promise<BioName | null> {
  if (!native()) return null;
  try {
    const r = await NativeBiometric.isAvailable();
    if (!r.isAvailable) return null;
    return r.biometryType === BiometryType.FACE_ID ? 'Face ID' : r.biometryType === BiometryType.TOUCH_ID ? 'Touch ID' : 'huella';
  } catch { return null; }
}

/** "tu huella" / "Face ID" / "Touch ID", para meter en una frase. */
export const withBio = (b: BioName) => (b === 'huella' ? 'tu huella' : b);

/** Pide la huella (o el desbloqueo del celular). true si la persona se identificó. */
export async function verifyBiometric(): Promise<boolean> {
  if (!native()) return false;
  try {
    await NativeBiometric.verifyIdentity({ reason: 'Desbloquear Meneia', title: 'Meneia', subtitle: 'Usá tu huella', negativeButtonText: 'Usar PIN', useFallback: false });
    return true;
  } catch { return false; }
}

/** No aparece en apps recientes ni en capturas de pantalla (FLAG_SECURE en Android; en iPhone tapa la vista y la captura sale en negro). */
export async function setSecureScreen(on: boolean): Promise<void> {
  if (!native()) return;
  try { await (on ? PrivacyScreen.enable() : PrivacyScreen.disable()); } catch { /* no disponible */ }
}
