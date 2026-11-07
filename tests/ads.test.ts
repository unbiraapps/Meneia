import { describe, it, expect } from 'vitest';
import { adsAllowed, bannerAllowed, interstitialAllowed, rewardUntil, DEFAULT_ADS } from '../src/adrules';
import { activePurchase, planAfterCheck } from '../src/adrules';

const base = { ...DEFAULT_ADS, plan: 'free' as const, installDate: '2026-11-01' };
const ctx = { today: '2026-11-10', childActive: false, locked: false };

describe('reglas de anuncios', () => {
  it('sin anuncios la primera semana', () => {
    expect(adsAllowed(base, { ...ctx, today: '2026-11-07' })).toBe(false);
    expect(adsAllowed(base, ctx)).toBe(true);
  });
  it('nunca en la versión paga, bloqueada o en perfiles de hijas', () => {
    expect(adsAllowed({ ...base, plan: 'premium' }, ctx)).toBe(false);
    expect(adsAllowed(base, { ...ctx, locked: true })).toBe(false);
    expect(adsAllowed(base, { ...ctx, childActive: true })).toBe(false);
  });
  it('banner solo en Calendario e Historial', () => {
    expect(bannerAllowed(base, ctx, 'calendario')).toBe(true);
    expect(bannerAllowed(base, ctx, 'historial')).toBe(true);
    expect(bannerAllowed(base, ctx, 'hoy')).toBe(false);
    expect(bannerAllowed(base, ctx, 'perfil')).toBe(false);
  });
  it('pantalla completa con al menos 30 minutos entre uno y otro', () => {
    const now = Date.parse('2026-11-10T15:00:00Z');
    expect(interstitialAllowed(base, ctx, now)).toBe(true);
    expect(interstitialAllowed({ ...base, lastInterstitial: '2026-11-10T14:40:00Z' }, ctx, now)).toBe(false);
    expect(interstitialAllowed({ ...base, lastInterstitial: '2026-11-10T14:30:00Z' }, ctx, now)).toBe(true);
    // valor viejo (solo fecha) no traba
    expect(interstitialAllowed({ ...base, lastInterstitial: '2026-11-09' }, ctx, now)).toBe(true);
    // versión de prueba: cada 2 minutos
    expect(interstitialAllowed({ ...base, lastInterstitial: '2026-11-10T14:57:00Z' }, { ...ctx, testing: true }, now)).toBe(true);
    expect(interstitialAllowed(base, { ...ctx, childActive: true }, now)).toBe(false);
  });
  it('el video da una semana sin anuncios', () => {
    const until = rewardUntil('2026-11-10');
    expect(until).toBe('2026-11-16');
    expect(adsAllowed({ ...base, adFreeUntil: until }, { ...ctx, today: '2026-11-16' })).toBe(false);
    expect(adsAllowed({ ...base, adFreeUntil: until }, { ...ctx, today: '2026-11-17' })).toBe(true);
  });
});

describe('versión de prueba', () => {
  it('sin semana de gracia para poder ver los anuncios de prueba', () => {
    expect(adsAllowed(base, { ...ctx, today: '2026-11-02', testing: true })).toBe(true);
    expect(adsAllowed({ ...base, plan: 'premium' }, { ...ctx, testing: true })).toBe(false);
  });
});

describe('suscripción Sin anuncios', () => {
  const now = Date.parse('2026-11-10T12:00:00Z');
  const ID = 'sin_anuncios_mensual';
  it('cuenta solo la compra vigente y pagada del producto', () => {
    expect(activePurchase([{ productIdentifier: ID, purchaseState: '1' }], ID, now)).toBeTruthy();       // Android: comprada
    expect(activePurchase([{ productIdentifier: ID, purchaseState: '2' }], ID, now)).toBeUndefined();    // Android: pendiente
    expect(activePurchase([{ productIdentifier: 'otro', purchaseState: '1' }], ID, now)).toBeUndefined();
    expect(activePurchase([{ productIdentifier: ID, expirationDate: '2026-11-09T00:00:00Z' }], ID, now)).toBeUndefined(); // vencida
    expect(activePurchase([{ productIdentifier: ID, subscriptionState: 'expired' }], ID, now)).toBeUndefined();
    expect(activePurchase([{ productIdentifier: ID, subscriptionState: 'inGracePeriod' }], ID, now)).toBeTruthy();
    expect(activePurchase([{ productIdentifier: ID, isActive: false }], ID, now)).toBeUndefined();
    expect(activePurchase([], ID, now)).toBeUndefined();
  });
  const base = { plan: 'free' as const, installDate: '2026-10-01', lastInterstitial: '', adFreeUntil: '2026-11-01' };
  it('activa, cancelada y vencida: solo cambia el plan, nunca otra cosa', () => {
    const on = planAfterCheck(base, { active: true, willCancel: false, until: '2026-12-10' });
    expect(on.plan).toBe('premium');
    const cancelled = planAfterCheck(on, { active: true, willCancel: true, until: '2026-12-10' });
    expect(cancelled.plan).toBe('premium'); // sigue sin anuncios hasta el fin del mes pagado
    expect(cancelled.willCancel).toBe(true);
    const expired = planAfterCheck(cancelled, { active: false, willCancel: false, until: null });
    expect(expired.plan).toBe('free');
    expect(expired.installDate).toBe(base.installDate);
    expect(expired.adFreeUntil).toBe(base.adFreeUntil);
  });
  it('sin conexión se mantiene lo último conocido', () => {
    const on = { ...base, plan: 'premium' as const };
    expect(planAfterCheck(on, null)).toBe(on);
  });
  it('quien nunca eligió plan no pasa a gratis por consultar', () => {
    expect(planAfterCheck({ ...base, plan: '' }, { active: false, willCancel: false, until: null }).plan).toBe('');
  });
});
