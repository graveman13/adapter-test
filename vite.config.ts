import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Polyfills required by Solana wallet adapters in the browser
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer/',
      '@local/unified-wallet-adapter': fileURLToPath(
        new URL('./unified-wallet-kit/src/index.tsx', import.meta.url),
      ),
    },
  },
  optimizeDeps: {
    include: ['buffer'],
  },
})
