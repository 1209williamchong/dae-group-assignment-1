import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'My Capacitor App',
  webDir: 'www',
  server: {
    url: 'http://localhost:3000',
    cleartext: true,
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      androidPermissions: ['android.permission.CAMERA']
    },
    Geolocation: {
      androidPermissions: ['android.permission.ACCESS_FINE_LOCATION']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'beep.wav'
    }
  }
};

export default config; 