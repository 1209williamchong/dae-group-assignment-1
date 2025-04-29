import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  root: './public',
  build: {
    outDir: '../www',
    minify: false,
    emptyOutDir: true,
    rollupOptions: {
      external: [
        '@capacitor/core',
        '@capacitor/camera',
        '@capacitor/geolocation',
        '@capacitor/local-notifications',
        '@capacitor/storage'
      ]
    }
  },
  server: {
    host: true,
    port: 3000
  }
}); 