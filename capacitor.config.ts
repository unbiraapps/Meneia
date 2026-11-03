import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ar.miciclo.lila',
  appName: 'Mi Ciclo',
  webDir: 'dist',
  android: { backgroundColor: '#F5F2FB' },
  plugins: {
    LocalNotifications: { smallIcon: 'ic_stat_ciclo', iconColor: '#816BB4' },
  },
};

export default config;
