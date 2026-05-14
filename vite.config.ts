import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const nominatimProxy = {
  target: 'https://nominatim.openstreetmap.org',
  changeOrigin: true,
  rewrite: (path: string) => path.replace(/^\/api\/nominatim/, ''),
  configure: (proxy: { on: (ev: 'proxyReq', fn: (req: { setHeader: (k: string, v: string) => void }) => void) => void }) => {
    proxy.on('proxyReq', (proxyReq) => {
      proxyReq.setHeader(
        'User-Agent',
        'NorveoConfigurator/1.0 (internal geocode assist; https://operations.osmfoundation.org/policies/nominatim/)',
      );
    });
  },
} as const;

export default defineConfig({
  appType: 'spa',
  plugins: [react()],
  server: {
    port: 5175,
    strictPort: true,
    proxy: {
      '/api/nominatim': nominatimProxy,
    },
  },
  preview: {
    port: 5175,
    strictPort: true,
    proxy: {
      '/api/nominatim': nominatimProxy,
    },
  },
})
