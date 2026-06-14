import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Next'in `server-only` paketi node ortamında çözülmez; testlerde no-op.
      'server-only': path.resolve(__dirname, './src/test/serverOnlyStub.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
