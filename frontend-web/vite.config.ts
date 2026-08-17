import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Bandicon',
        short_name: 'Bandicon',
        description: 'Bandicon Web App',
        theme_color: '#00BDF8',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    host: true, // Listen on all addresses
    proxy: {
      '/api': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
      '/profile': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
      '/board': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
      '/shorts': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
      '/sns': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
      '/chat': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
      '/clan': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
      '/band': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
      '/common_images': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
    },
  },
})
