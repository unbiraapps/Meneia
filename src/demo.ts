// Datos inventados para capturas de pantalla (tiendas y revisión visual en el simulador).
// Solo se usan en compilaciones con VITE_DEMO=1; nunca en la app que se publica.
import { addDays, iso } from './calc';
import { db, ensureSelf, getSetting, savePeriod, saveProfile, saveSymptoms, setSetting, SELF_ID } from './db';

export async function seedDemo(): Promise<void> {
  if (await getSetting('onboarded', false)) return;
  await ensureSelf();
  const today = iso(new Date());
  const self = await db.profiles.get(SELF_ID);
  await saveProfile({ ...self!, birthDate: '1990-04-12' });
  // Ciclos de 27 a 30 días; el último empezó hace 11 días
  const gaps = [29, 28, 30, 27, 29, 28];
  let start = addDays(today, -11);
  for (let i = 0; i < gaps.length; i++) {
    await savePeriod({ profileId: SELF_ID, start, end: addDays(start, 4 + (i % 2)), flow: 'Normal', note: '' });
    start = addDays(start, -gaps[i]);
  }
  await saveSymptoms({ profileId: SELF_ID, date: addDays(today, -11), pain: 2, body: ['Cólicos', 'Cansancio'], mood: ['Sensible'], note: '' });
  await saveSymptoms({ profileId: SELF_ID, date: addDays(today, -10), pain: 1, body: ['Cólicos'], mood: ['Bien'], note: '' });
  await saveSymptoms({ profileId: SELF_ID, date: addDays(today, -40), pain: 2, body: ['Cólicos', 'Dolor de cabeza'], mood: ['Irritable'], note: '' });
  const sofi = await saveProfile({ name: 'Sofi', kind: 'child', color: '#9FD8C8', birthDate: '2012-03-12', trying: false, notYet: false, alertDays: 2 });
  for (const back of [3, 31, 60]) await savePeriod({ profileId: sofi, start: addDays(today, -back), end: addDays(today, -back + 4), flow: 'Normal', note: '' });
  await setSetting('familyMode', true);
  // Sin anuncios en las capturas
  await setSetting('ads', { plan: 'premium', installDate: addDays(today, -60), lastInterstitial: '', adFreeUntil: '' });
  await setSetting('pinPromptDismissed', true);
  await setSetting('onboarded', true);
}
