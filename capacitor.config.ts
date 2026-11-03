import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.meneia',
  appName: 'Meneia',
  webDir: 'dist',
  android: { backgroundColor: '#17131F' },
  plugins: {
    LocalNotifications: { smallIcon: 'ic_stat_ciclo', iconColor: '#816BB4' },
  },
};

export default config;
