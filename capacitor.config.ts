import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.agrimart.app',
  appName: 'Agrimart',
  webDir: 'out',
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '341285649186-6stkidktrimsqtd0du5akqvuvpl47cgk.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
