import { describe, it, expect } from 'vitest';
import { adsAllowed, bannerAllowed, interstitialAllowed, rewardUntil, DEFAULT_ADS } from '../src/adrules';

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
  it('pantalla completa como mucho una vez por día', () => {
    expect(interstitialAllowed(base, ctx)).toBe(true);
    expect(interstitialAllowed({ ...base, lastInterstitial: '2026-11-10' }, ctx)).toBe(false);
  });
  it('el video da una semana sin anuncios', () => {
    const until = rewardUntil('2026-11-10');
    expect(until).toBe('2026-11-16');
    expect(adsAllowed({ ...base, adFreeUntil: until }, { ...ctx, today: '2026-11-16' })).toBe(false);
    expect(adsAllowed({ ...base, adFreeUntil: until }, { ...ctx, today: '2026-11-17' })).toBe(true);
  });
});
