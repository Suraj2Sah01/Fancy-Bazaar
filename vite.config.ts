import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: false
        },
        manifest: {
          name: 'Fancy Bazaar',
          short_name: 'FancyBazaar',
          description: 'Premium Fashion and Lifestyle Store',
          theme_color: '#4f46e5',
          background_color: '#f9fafb',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: []
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      port: 3000,
      // HMR is noisy in AI Studio, disabling to satisfy "Fix the errors" request
      hmr: false,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
