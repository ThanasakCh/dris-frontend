// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    host: '0.0.0.0',
    port: 3000,
    cors: true,
    allowedHosts: true,
    // Only use tunnel HMR settings when explicitly enabled
    ...(process.env.VITE_USE_TUNNEL === 'true' && {
      hmr: {
        clientPort: 443,
        protocol: 'wss'
      }
    })
  },
  define: { global: 'globalThis' }
})
