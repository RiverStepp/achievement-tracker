import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    watch: {
      usePolling: true,
      interval: 100,
    },  
    proxy: {
      // proxy the controller directly
      '/WeatherForecast': {
        target: 'https://localhost:7111',   // or 'http://localhost:5111'
        changeOrigin: true,
        secure: false,                       // allow self-signed https in dev
      },
    },
  },
});
