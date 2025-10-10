import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl()
  ],
  server: {
    proxy: {
      '/chat': 'http://localhost:8000',
      '/transcribe': 'http://localhost:8000',
      '/tts/speak': 'http://localhost:8000',
    }
  }
})
