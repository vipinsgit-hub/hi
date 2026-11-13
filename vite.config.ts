import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'icons/icon.svg'],
      manifest: {
        name: 'HI — Private Messenger',
        short_name: 'HI',
        description: 'Minimalist, secure private messaging for two.',
        theme_color: '#090909',
        background_color: '#090909',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/icons/icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Cache ONLY static UI shell assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Security requirement: NEVER cache Supabase API, Auth tokens, or messages
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/, /supabase\.co/],
        runtimeCaching: [
          {
            // Explicitly pass-through any external API or Supabase requests with NetworkOnly
            urlPattern: ({ url }) => url.hostname.includes('supabase.co') || url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'supabase-no-cache',
                options: {
                  maxRetentionTime: 1,
                }
              }
            }
          },
          {
            // Google Fonts caching
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
