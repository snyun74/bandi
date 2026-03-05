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
        name: '밴디콘 - 앙상블 매칭',
        short_name: '밴디콘',
        description: '밴디콘 앙상블 매칭 서비스',
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
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: true, // Listen on all addresses
    hmr: {
      host: 'bandicon.kr', // Force HMR to use this domain
      port: 5173,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },


    },
  },
})
