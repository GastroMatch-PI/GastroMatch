import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: { provider: 'v8', include: ['src/lib/**'], exclude: ['src/lib/**/*.test.ts', 'src/lib/tipos.ts', 'src/lib/useRecipes.ts'], thresholds: { lines: 80 } },
  },
})
