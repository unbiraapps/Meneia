/**
 * Copia en la nube, opcional. Solo se sube el sobre cifrado en el celular (ver crypt.ts).
 * Ingreso con Google (nativo en Android) y Supabase para guardar el sobre.
 * Sin las variables de entorno la función queda apagada y la app sigue funcionando igual.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { deriveKey, newSalt, open, parseEnvelope, randomNonce, seal, sha256Hex, ITERATIONS, type Envelope } from './crypt';
import { exportBackup, getSetting, parseBackup, restoreBackup, setSetting, type Backup } from './db';
import { isNative } from './notify';

const env = import.meta.env;
const URL_ = env.VITE_SUPABASE_URL as string | undefined;
const ANON = env.VITE_SUPABASE_ANON_KEY as string | undefined;
const GOOGLE = env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined;
const TABLE = 'copias';

/** Estado local. La clave derivada queda solo en este celular (protegido con PIN) para subir sin pedir la contraseña cada vez. */
export interface CloudState { email: string; key: string; salt: string; iter: number; lastUpload: string; lastHash: string }

export const cloudConfigured = () => !!(URL_ && ANON);
export const cloudAvailable = () => cloudConfigured() && isNative();
/** Entrar con Google necesita además el ID de cliente web de Google. */
export const googleAvailable = () => cloudAvailable() && !!GOOGLE;
export const MIN_ACCOUNT_PASSWORD = 8;
const CONFIRMED_URL = 'https://meneia.unbiraapps.com/cuenta-confirmada/';

let client: SupabaseClient | null = null;
async function sb(): Promise<SupabaseClient> {
  if (!client) {
    const { createClient } = await import('@supabase/supabase-js');
    client = createClient(URL_!, ANON!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
  }
  return client;
}

export const getCloud = () => getSetting<CloudState | null>('cloud', null);
const setCloud = (c: CloudState | null) => setSetting('cloud', c);

/** Email de la sesión abierta, o null. */
export async function currentUser(): Promise<string | null> {
  if (!cloudConfigured()) return null;
  const { data } = await (await sb()).auth.getSession();
  return data.session?.user.email ?? (data.session ? '' : null);
}

export async function signInWithGoogle(): Promise<string> {
  const { SocialLogin } = await import('@capgo/capacitor-social-login');
  await SocialLogin.initialize({ google: { webClientId: GOOGLE! } });
  const raw = randomNonce();
  const res = await SocialLogin.login({ provider: 'google', options: { nonce: await sha256Hex(raw) } });
  const token = (res.result as { idToken?: string | null }).idToken;
  if (!token) throw new Error('Google no devolvió el ingreso.');
  const { data, error } = await (await sb()).auth.signInWithIdToken({ provider: 'google', token, nonce: raw });
  if (error) throw error;
  return data.user?.email ?? '';
}

/** Entrar con email y contraseña. */
export async function signInWithEmail(email: string, password: string): Promise<string> {
  const { data, error } = await (await sb()).auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return data.user?.email ?? email;
}

/** Crear cuenta con email y contraseña. Devuelve 'confirm' si hay que confirmar el email antes de entrar. */
export async function signUpWithEmail(email: string, password: string): Promise<{ email: string; confirm: boolean }> {
  const { data, error } = await (await sb()).auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: CONFIRMED_URL } });
  if (error) throw error;
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) throw new Error('already registered');
  return { email: data.user?.email ?? email, confirm: !data.session };
}

/** Mail para elegir una contraseña nueva de la cuenta (no cambia la contraseña de copia). */
export async function resetAccountPassword(email: string): Promise<void> {
  const { error } = await (await sb()).auth.resetPasswordForEmail(email.trim(), { redirectTo: 'https://meneia.unbiraapps.com/nueva-clave/' });
  if (error) throw error;
}

/** Trae el sobre guardado, o null si todavía no hay copia. */
export async function fetchEnvelope(): Promise<Envelope | null> {
  const { data, error } = await (await sb()).from(TABLE).select('data').maybeSingle();
  if (error) throw error;
  return data ? parseEnvelope(data.data as string) : null;
}

async function uploadWith(c: CloudState, force = false): Promise<CloudState> {
  const text = JSON.stringify(await exportBackup());
  const hash = await sha256Hex(text);
  if (!force && hash === c.lastHash) return c;
  const envl = await seal(text, c.key, c.salt, c.iter);
  const s = await sb();
  const { data: u } = await s.auth.getUser();
  if (!u.user) throw new Error('Tenés que volver a entrar con Google.');
  const { error } = await s.from(TABLE).upsert({ user_id: u.user.id, data: JSON.stringify(envl), updated_at: new Date().toISOString() });
  if (error) throw error;
  const next = { ...c, lastUpload: new Date().toISOString(), lastHash: hash };
  await setCloud(next);
  return next;
}

/** Primera vez: elige la contraseña de copia y sube la primera copia. */
export async function activate(password: string, email: string): Promise<CloudState> {
  const salt = newSalt();
  const key = await deriveKey(password, salt);
  return uploadWith({ email, key, salt, iter: ITERATIONS, lastUpload: '', lastHash: '' }, true);
}

/** Celular nuevo o reinstalado: abre la copia existente con la contraseña. Devuelve la copia lista para restaurar, o null si la contraseña no corresponde. */
export async function unlockExisting(envl: Envelope, password: string, email: string): Promise<Backup | null> {
  const key = await deriveKey(password, envl.salt, envl.iter);
  const text = await open(envl, key);
  if (text == null) return null;
  const r = parseBackup(text);
  if (!r.ok) throw new Error(r.error);
  await setCloud({ email, key, salt: envl.salt, iter: envl.iter, lastUpload: '', lastHash: '' });
  return r.data;
}

/** Restaurar desde la nube con la clave ya guardada en el celular. */
export async function restoreFromCloud(): Promise<boolean> {
  const c = await getCloud();
  const envl = await fetchEnvelope();
  if (!c || !envl) return false;
  const text = await open(envl, c.key);
  if (text == null) return false;
  const r = parseBackup(text);
  if (!r.ok) return false;
  await restoreBackup(r.data);
  return true;
}

export async function uploadNow(): Promise<CloudState | null> {
  const c = await getCloud();
  return c ? uploadWith(c, true) : null;
}

let busy = false;
/** Sube en silencio si algo cambió desde la última copia. Se llama al salir de la app. */
export async function syncIfChanged(): Promise<void> {
  if (busy || !cloudAvailable()) return;
  busy = true;
  try { const c = await getCloud(); if (c) await uploadWith(c); } catch { /* sin conexión: se reintenta la próxima vez */ } finally { busy = false; }
}

/** Cierra la sesión en este celular. La copia queda guardada en la nube. */
export async function signOut(): Promise<void> {
  await setCloud(null);
  try { await (await sb()).auth.signOut(); } catch { /* nada */ }
  if (GOOGLE) try { const { SocialLogin } = await import('@capgo/capacitor-social-login'); await SocialLogin.initialize({ google: { webClientId: GOOGLE } }); await SocialLogin.logout({ provider: 'google' }); } catch { /* entró con email o ya había salido */ }
}

/** Borra la copia y la cuenta del servidor. Los datos de este celular no se tocan. */
export async function deleteAccount(): Promise<void> {
  const { error } = await (await sb()).rpc('borrar_mi_cuenta');
  if (error) throw error;
  await signOut();
}
