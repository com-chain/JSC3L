/// <reference types="vitest" />
import { defineConfig } from 'vite'

const cfg =  defineConfig({
  test: {
    include: ['src/**/*.{js,ts}'],
    setupFiles: ['./tests/setup.ts'],
    environment: 'jsdom',
    passWithNoTests: true,
    bail: 1,
    pool: 'threads',  // without this, tests freezes
  },
})

export default cfg
