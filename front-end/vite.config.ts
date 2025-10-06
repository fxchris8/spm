// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    allowedHosts: ['pe.spil.co.id'],
    watch: {
      usePolling: true,
      interval: 1000, // cek setiap 1 detik biar tidak makan CPU
    },
  },
});
