// Notificaciones. En la app de Android se programan en el celular (llegan con la app cerrada).
// En la versión web los avisos se muestran dentro de la app al abrirla.
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Reminder } from './calc';

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

let channelReady = false;
async function ensureChannel() {
  if (channelReady) return;
  try {
    await LocalNotifications.createChannel({ id: 'ciclo', name: 'Avisos del ciclo', description: 'Período, ventana fértil y atrasos', importance: 4, visibility: 0, lightColor: '#A77CE5' });
  } catch { /* canal ya existe o no aplica */ }
  channelReady = true;
}

/** Reemplaza todos los avisos programados por la lista nueva. */
export async function syncReminders(list: Reminder[]): Promise<number> {
  if (!isNative()) return 0;
  if ((await permissionState()) !== 'granted') return 0;
  await ensureChannel();
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
  if (!list.length) return 0;
  await LocalNotifications.schedule({
    notifications: list.map(r => {
      const [y, m, d] = r.date.split('-').map(Number);
      return { id: r.id, title: r.title, body: r.body, channelId: 'ciclo', smallIcon: 'ic_stat_ciclo', iconColor: '#816BB4', schedule: { at: new Date(y, m - 1, d, r.hour, 0, 0), allowWhileIdle: true } };
    }),
  });
  return list.length;
}

/** Aviso inmediato (por ejemplo, cuando cambia la duración del ciclo). */
export async function notifyNow(title: string, body: string): Promise<void> {
  if (!isNative() || (await permissionState()) !== 'granted') return;
  await ensureChannel();
  await LocalNotifications.schedule({ notifications: [{ id: 9000 + Math.floor(Math.random() * 900), title, body, channelId: 'ciclo', smallIcon: 'ic_stat_ciclo', iconColor: '#816BB4', schedule: { at: new Date(Date.now() + 1500) } }] });
}
