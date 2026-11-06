/**
 * Cifrado de la copia en la nube. Todo pasa en el celular: al servidor solo llega el sobre cifrado.
 * La clave sale de la contraseña de copia (PBKDF2-SHA256) y cifra con AES-GCM de 256 bits.
 * Sin la contraseña nadie puede abrir la copia, tampoco nosotras.
 */

export interface Envelope { app: 'meneia'; v: 1; kdf: 'PBKDF2-SHA256'; iter: number; salt: string; iv: string; ct: string }

export const ITERATIONS = 600_000;
export const MIN_PASSWORD = 8;

const enc = new TextEncoder();
const dec = new TextDecoder();

export function toB64(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}
export function fromB64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
const rand = (n: number) => crypto.getRandomValues(new Uint8Array(n));

export function newSalt(): string { return toB64(rand(16)); }

/** Deriva la clave AES (32 bytes, en base64) a partir de la contraseña y la sal. */
export async function deriveKey(password: string, salt: string, iter = ITERATIONS): Promise<string> {
  const base = await crypto.subtle.importKey('raw', enc.encode(password.normalize('NFC')), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromB64(salt), iterations: iter }, base, 256);
  return toB64(new Uint8Array(bits));
}

const aes = (key: string, use: KeyUsage) => crypto.subtle.importKey('raw', fromB64(key), 'AES-GCM', false, [use]);

export async function seal(text: string, key: string, salt: string, iter = ITERATIONS): Promise<Envelope> {
  const iv = rand(12);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aes(key, 'encrypt'), enc.encode(text));
  return { app: 'meneia', v: 1, kdf: 'PBKDF2-SHA256', iter, salt, iv: toB64(iv), ct: toB64(new Uint8Array(ct)) };
}

/** Devuelve el texto o null si la clave no corresponde (contraseña equivocada o sobre dañado). */
export async function open(env: Envelope, key: string): Promise<string | null> {
  try {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(env.iv) }, await aes(key, 'decrypt'), fromB64(env.ct));
    return dec.decode(pt);
  } catch { return null; }
}

export function parseEnvelope(s: string): Envelope | null {
  try {
    const e = JSON.parse(s);
    if (e && e.app === 'meneia' && e.v === 1 && e.kdf === 'PBKDF2-SHA256' && typeof e.salt === 'string' && typeof e.iv === 'string' && typeof e.ct === 'string' && Number.isInteger(e.iter) && e.iter >= 100_000) return e;
  } catch { /* nada */ }
  return null;
}

export async function sha256Hex(s: string): Promise<string> {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)));
  return Array.from(h, b => b.toString(16).padStart(2, '0')).join('');
}

export function randomNonce(): string { return Array.from(rand(16), b => b.toString(16).padStart(2, '0')).join(''); }
