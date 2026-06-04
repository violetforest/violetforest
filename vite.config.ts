import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      // Self-destruct mode: ships a service worker that unregisters any
      // existing SW and clears its caches on the next visit. After every
      // device has loaded the site once, the VitePWA plugin can be
      // removed entirely. No more stale-cache surprises.
      selfDestroying: true,
      registerType: 'autoUpdate',
      manifest: {
        name: 'violet forest',
        short_name: 'violet',
        description: 'a personal space',
        theme_color: '#f0eaf5',
        background_color: '#f0eaf5',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})
