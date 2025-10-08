import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/chat': 'http://localhost:5000',
      '/voice-input': 'http://localhost:5000',
      '/get-transcription': 'http://localhost:5000',
    }
  }
})
