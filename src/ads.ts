// Anuncios (AdMob, solo no personalizados) y la compra de "Sin anuncios" (Google Play en Android, App Store en iPhone).
// En la web no hace nada: todo esto existe solo en la app del celular.
import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdPosition, BannerAdSize, MaxAdContentRating } from '@capacitor-community/admob';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';
import { isIOS } from './platform';

const native = () => Capacitor.isNativePlatform();

// Si no están los IDs reales (secretos de GitHub), se usan los de prueba oficiales de Google.
const env = import.meta.env;
// La APK de prueba (la del Drive) se arma con VITE_ADS_TEST=1: anuncios de prueba, para no mirar anuncios reales en el propio celular.
// Cada plataforma tiene sus propios IDs en AdMob; los de prueba también son distintos.
const IOS = isIOS();
const REAL = IOS
  ? { banner: env.VITE_ADMOB_IOS_BANNER_ID, interstitial: env.VITE_ADMOB_IOS_INTERSTITIAL_ID, rewarded: env.VITE_ADMOB_IOS_REWARDED_ID }
  : { banner: env.VITE_ADMOB_BANNER_ID, interstitial: env.VITE_ADMOB_INTERSTITIAL_ID, rewarded: env.VITE_ADMOB_REWARDED_ID };
const TEST_IDS = IOS
  ? { banner: 'ca-app-pub-3940256099942544/2934735716', interstitial: 'ca-app-pub-3940256099942544/4411468910', rewarded: 'ca-app-pub-3940256099942544/1712485313' }
  : { banner: 'ca-app-pub-3940256099942544/9214589741', interstitial: 'ca-app-pub-3940256099942544/1033173712', rewarded: 'ca-app-pub-3940256099942544/5224354917' };
const TEST = env.VITE_ADS_TEST === '1' || !REAL.banner;
/** true mientras la app usa los anuncios de prueba de Google (todavía no están los IDs reales). */
export const ADS_TESTING = TEST;
const IDS = TEST ? TEST_IDS : { banner: REAL.banner!, interstitial: REAL.interstitial || TEST_IDS.interstitial, rewarded: REAL.rewarded || TEST_IDS.rewarded };
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

let interReady: Promise<boolean> | null = null;
/** Deja cargado el próximo anuncio de pantalla completa, para que aparezca al instante cuando toque. */
export function preloadInterstitial(): Promise<boolean> {
  if (!native()) return Promise.resolve(false);
  if (!interReady) interReady = initAds()
    .then(() => AdMob.prepareInterstitial({ adId: IDS.interstitial, npa: true, isTesting: TEST }))
    .then(() => true, () => { interReady = null; return false; });
  return interReady;
}

/** Muestra un anuncio de pantalla completa. true si se mostró. */
export async function showInterstitial(): Promise<boolean> {
  if (!native()) return false;
  try {
    if (!(await preloadInterstitial())) return false;
    interReady = null;
    await AdMob.showInterstitial();
    return true;
  } catch { interReady = null; return false; }
  finally { setTimeout(() => { preloadInterstitial(); }, 3000); }
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

// ---------- Suscripción "Sin anuncios" (mensual, Google Play / App Store) ----------

// En Google Play: producto sin_anuncios_mensual con plan "mensual". En App Store: un producto por período.
export const SUB_ID = isIOS() ? 'com.unbiraapps.meneia.sinanuncios.mensual' : 'sin_anuncios_mensual';
export const BASE_PLAN = 'mensual';

export interface SubPrice { price: string; period: string }

/** Precio y período que informa la tienda (nunca un precio fijo en la app). */
export async function subscriptionPrice(): Promise<SubPrice | null> {
  if (!native()) return null;
  try {
    const { product } = await NativePurchases.getProduct({ productIdentifier: SUB_ID, productType: PURCHASE_TYPE.SUBS });
    if (!product?.priceString) return null;
    return { price: product.priceString, period: 'por mes' };
  } catch { return null; }
}

/** Abre la pantalla de suscripción de la tienda. Solo se llama cuando la persona toca "Suscribirme".
 *  El pago lo pide Google o Apple, nunca la app. */
export async function subscribe(): Promise<'ok' | 'cancel' | 'error'> {
  if (!native()) return 'error';
  try {
    const t = await NativePurchases.purchaseProduct(IOS
      ? { productIdentifier: SUB_ID, productType: PURCHASE_TYPE.SUBS }
      : { productIdentifier: SUB_ID, planIdentifier: BASE_PLAN, productType: PURCHASE_TYPE.SUBS, autoAcknowledgePurchases: true });
    return t?.productIdentifier === SUB_ID ? 'ok' : 'cancel';
  } catch (e) {
    const msg = String((e as { message?: string })?.message ?? e).toLowerCase();
    return msg.includes('cancel') ? 'cancel' : 'error';
  }
}

export interface SubStatus { active: boolean; willCancel: boolean; until: string | null }

/** Estado vigente de la suscripción con la cuenta de la tienda. null si no se pudo consultar (sin conexión, web). */
export async function subscriptionStatus(): Promise<SubStatus | null> {
  if (!native()) return null;
  try {
    const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.SUBS, onlyCurrentEntitlements: true });
    const now = Date.now();
    const mine = purchases.filter(p => p.productIdentifier === SUB_ID);
    const active = mine.find(p => {
      if (p.isActive === false) return false;
      if (p.subscriptionState && !['subscribed', 'inGracePeriod', 'unknown'].includes(p.subscriptionState)) return false;
      if (p.expirationDate && Date.parse(p.expirationDate) < now) return false;
      if (p.purchaseState != null && !['1', 'PURCHASED', 'purchased'].includes(String(p.purchaseState))) return false;
      return true;
    });
    if (!active) return { active: false, willCancel: false, until: null };
    return { active: true, willCancel: active.willCancel === true, until: active.expirationDate ? active.expirationDate.slice(0, 10) : null };
  } catch { return null; }
}

/** "Restaurar compras": en iPhone primero sincroniza con el App Store (lo exige Apple), después consulta. */
export async function restoreSubscription(): Promise<SubStatus | null> {
  if (!native()) return null;
  if (IOS) { try { await NativePurchases.restorePurchases(); } catch { /* sigue con la consulta */ } }
  return subscriptionStatus();
}

/** Abre "Suscripciones" de la tienda para cancelar o cambiar el medio de pago. */
export async function manageSubscription(): Promise<void> {
  if (!native()) return;
  try { await NativePurchases.manageSubscriptions(); } catch { /* sin tienda */ }
}
