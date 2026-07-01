import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // toolpath JSON + future glTF assets live in the repo's data/ dir,
      // one level above ui/. This is the single import boundary into that data.
      '@data': path.resolve(__dirname, '../data'),
    },
  },
  server: {
    // allow Vite's dev server to read files from the repo root (../data)
    fs: { allow: [path.resolve(__dirname, '..')] },
  },
})
