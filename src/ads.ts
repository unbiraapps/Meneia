// Anuncios (AdMob, solo no personalizados) y la compra de "Sin anuncios" (Facturación de Google Play).
// En la web no hace nada: todo esto existe solo en la app de Android.
import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdPosition, BannerAdSize, MaxAdContentRating } from '@capacitor-community/admob';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';

const native = () => Capacitor.isNativePlatform();

// Si no están los IDs reales (secretos de GitHub), se usan los de prueba oficiales de Google.
const env = import.meta.env;
const TEST = env.VITE_ADMOB_BANNER_ID ? false : true;
const IDS = {
  banner: env.VITE_ADMOB_BANNER_ID || 'ca-app-pub-3940256099942544/9214589741',
  interstitial: env.VITE_ADMOB_INTERSTITIAL_ID || 'ca-app-pub-3940256099942544/1033173712',
  rewarded: env.VITE_ADMOB_REWARDED_ID || 'ca-app-pub-3940256099942544/5224354917',
};
export const PRODUCT_ID = 'sin_anuncios';

let ready: Promise<void> | null = null;
export function initAds(): Promise<void> {
  if (!native()) return Promise.resolve();
  if (!ready) ready = (async () => {
    try {
      await AdMob.initialize({ initializeForTesting: TEST, maxAdContentRating: MaxAdContentRating.ParentalGuidance });
      // Consentimiento (pedido por ley en algunos países): Google decide si hace falta mostrarlo.
      const info = await AdMob.requestConsentInfo();
      if (info.isConsentFormAvailable && info.status === 'REQUIRED') await AdMob.showConsentForm();
    } catch { /* sin anuncios si algo falla */ }
  })();
  return ready;
}

let bannerOn = false;
export async function showBanner(bottomMargin: number): Promise<void> {
  if (!native() || bannerOn) return;
  await initAds();
  try {
    await AdMob.showBanner({ adId: IDS.banner, adSize: BannerAdSize.ADAPTIVE_BANNER, position: BannerAdPosition.BOTTOM_CENTER, margin: bottomMargin, npa: true, isTesting: TEST });
    bannerOn = true;
  } catch { /* sin banner */ }
}
export async function hideBanner(): Promise<void> {
  if (!native() || !bannerOn) return;
  bannerOn = false;
  try { await AdMob.removeBanner(); } catch { /* ya no estaba */ }
}

/** Muestra un anuncio de pantalla completa. true si se mostró. */
export async function showInterstitial(): Promise<boolean> {
  if (!native()) return false;
  await initAds();
  try {
    await AdMob.prepareInterstitial({ adId: IDS.interstitial, npa: true, isTesting: TEST });
    await AdMob.showInterstitial();
    return true;
  } catch { return false; }
}

/** Video con premio. true si lo miró completo. */
export async function showRewarded(): Promise<boolean> {
  if (!native()) return false;
  await initAds();
  try {
    await AdMob.prepareRewardVideoAd({ adId: IDS.rewarded, npa: true, isTesting: TEST });
    const r = await AdMob.showRewardVideoAd();
    return !!r && (r.amount ?? 0) >= 0;
  } catch { return false; }
}

// ---------- Compra "Sin anuncios" (pago único) ----------

export async function productPrice(): Promise<string | null> {
  if (!native()) return null;
  try {
    const { product } = await NativePurchases.getProduct({ productIdentifier: PRODUCT_ID, productType: PURCHASE_TYPE.INAPP });
    return product?.priceString ?? null;
  } catch { return null; }
}

/** Abre la pantalla de pago de Google Play. La tarjeta la pide Google, nunca la app. */
export async function buyNoAds(): Promise<'ok' | 'cancel' | 'error'> {
  if (!native()) return 'error';
  try {
    const t = await NativePurchases.purchaseProduct({ productIdentifier: PRODUCT_ID, productType: PURCHASE_TYPE.INAPP, autoAcknowledgePurchases: true });
    return t?.productIdentifier === PRODUCT_ID ? 'ok' : 'cancel';
  } catch (e) {
    const msg = String((e as { message?: string })?.message ?? e).toLowerCase();
    return msg.includes('cancel') ? 'cancel' : 'error';
  }
}

/** ¿Ya compró "Sin anuncios" con esta cuenta de Google? (para restaurar en otro celular) */
export async function ownsNoAds(): Promise<boolean | null> {
  if (!native()) return null;
  try {
    const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.INAPP });
    return purchases.some(p => p.productIdentifier === PRODUCT_ID && (p.purchaseState == null || ['1', 'PURCHASED', 'purchased'].includes(String(p.purchaseState))));
  } catch { return null; }
}
