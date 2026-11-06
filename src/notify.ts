// Notificaciones. En la app de Android se programan en el celular (llegan con la app cerrada).
// En la web los avisos se muestran dentro de la app al abrirla.
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Reminder, PrivacySettings } from './calc';

export const isNative = () => Capacitor.isNativePlatform();

export type PermState = 'granted' | 'denied' | 'prompt' | 'unsupported';

export async function permissionState(): Promise<PermState> {
  if (!isNative()) return 'unsupported';
  const p = await LocalNotifications.checkPermissions();
  return p.display === 'granted' ? 'granted' : p.display === 'denied' ? 'denied' : 'prompt';
}

export async function requestPermission(): Promise<PermState> {
  if (!isNative()) return 'unsupported';
  const p = await LocalNotifications.requestPermissions();
  return p.display === 'granted' ? 'granted' : 'denied';
}

// Dos canales silenciosos (importancia baja: sin sonido ni cartel encima de otras apps).
// Android no deja cambiar un canal después de creado, por eso hay uno por visibilidad.
const CH_HIDDEN = 'meneia-oculto';   // no se ve en la pantalla de bloqueo
const CH_PRIVATE = 'meneia-privado'; // se ve que hay un aviso, sin contenido
let channelsReady = false;
async function ensureChannels() {
  if (channelsReady) return;
  if (Capacitor.getPlatform() !== 'android') { channelsReady = true; return; } // los canales existen solo en Android
  for (const [id, visibility] of [[CH_HIDDEN, -1], [CH_PRIVATE, 0]] as const) {
    try {
      await LocalNotifications.createChannel({ id, name: id === CH_HIDDEN ? 'Recordatorios (ocultos)' : 'Recordatorios', description: 'Recordatorios de Meneia', importance: 2, visibility, vibration: false, lights: false });
    } catch { /* ya existe */ }
  }
  channelsReady = true;
}

const IOS_MAX = 60;
const at = (date: string, hour: number) => { const [y, m, d] = date.split('-').map(Number); return new Date(y, m - 1, d, hour, 0, 0); };

/** Reemplaza todos los avisos programados por la lista nueva. */
export async function syncReminders(list: Reminder[], pr: PrivacySettings): Promise<number> {
  if (!isNative()) return 0;
  if ((await permissionState()) !== 'granted') return 0;
  await ensureChannels();
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
  if (!list.length) return 0;
  // iOS guarda como mucho 64 avisos pendientes por app: quedan los más próximos (se reprograman cada vez que se abre la app).
  if (Capacitor.getPlatform() === 'ios' && list.length > IOS_MAX) list = [...list].sort((x, y) => +at(x.date, x.hour) - +at(y.date, y.hour)).slice(0, IOS_MAX);
  const channelId = pr.hideOnLock ? CH_HIDDEN : CH_PRIVATE;
  await LocalNotifications.schedule({
    notifications: list.map(r => ({ id: r.id, title: r.title, body: r.body, channelId, smallIcon: 'ic_stat_ciclo', iconColor: pr.dotColor, schedule: { at: at(r.date, r.hour), allowWhileIdle: true } })),
  });
  return list.length;
}

/** Aviso inmediato (por ejemplo, cuando cambia la duración del ciclo). Respeta el modo discreto. */
export async function notifyNow(title: string, body: string, pr: PrivacySettings): Promise<void> {
  if (!isNative() || (await permissionState()) !== 'granted') return;
  await ensureChannels();
  await LocalNotifications.schedule({ notifications: [{
    id: 9000 + Math.floor(Math.random() * 900),
    title: pr.discreet ? 'Meneia' : title,
    body: pr.discreet ? 'Tenés un recordatorio' : body,
    channelId: pr.hideOnLock ? CH_HIDDEN : CH_PRIVATE, smallIcon: 'ic_stat_ciclo', iconColor: pr.dotColor,
    schedule: { at: new Date(Date.now() + 1500) },
  }] });
}
