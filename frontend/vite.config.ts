import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-512.png'],
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{html,css,webmanifest,png,svg,ico,js}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/ui/assets/') && url.pathname.endsWith('.js'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'shinra-js-chunks',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Shinra_Gate - Tactical Hub',
        short_name: 'Shinra_Gate',
        description: 'Tactical Operation Center & Monitoring',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: '/ui/',
  server: {
    proxy: {
      '/api': { target: 'http://127.0.0.1:5666', changeOrigin: true },
      '/login': { target: 'http://127.0.0.1:5666', changeOrigin: true },
      '/logout': { target: 'http://127.0.0.1:5666', changeOrigin: true },
      '/project': { target: 'http://127.0.0.1:5666', changeOrigin: true },
    }
  }
})
