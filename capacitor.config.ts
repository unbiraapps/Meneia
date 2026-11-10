import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.meneia',
  appName: 'Meneia',
  webDir: 'dist',
  // Cada plataforma lleva solo sus complementos: en Android, Google (social-login); en iPhone, Apple.
  // social-login en iPhone metería el SDK de Facebook dentro de la app aunque no se use.
  android: {
    backgroundColor: '#120b23',
    includePlugins: [
      '@capacitor-community/admob',
      '@capacitor-community/privacy-screen',
      '@capacitor/app',
      '@capacitor/filesystem',
      '@capacitor/local-notifications',
      '@capacitor/share',
      '@capgo/capacitor-native-biometric',
      '@capgo/native-purchases',
      '@capgo/capacitor-social-login',
    ],
  },
  ios: {
    backgroundColor: '#120b23',
    contentInset: 'never',
    scheme: 'Meneia',
    includePlugins: [
      '@capacitor-community/admob',
      '@capacitor-community/privacy-screen',
      '@capacitor/app',
      '@capacitor/filesystem',
      '@capacitor/local-notifications',
      '@capacitor/share',
      '@capgo/capacitor-native-biometric',
      '@capgo/native-purchases',
      '@capacitor-community/apple-sign-in',
    ],
  },
  plugins: {
    SocialLogin: { providers: { google: true, facebook: false, apple: false, twitter: false } },
    LocalNotifications: { smallIcon: 'ic_stat_ciclo', iconColor: '#816BB4' },
  },
};

export default config;
