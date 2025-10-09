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
    https: true,
    proxy: {
      '/chat': 'http://localhost:5000',
      '/voice-input': 'http://localhost:5000',
      '/get-transcription': 'http://localhost:5000',
      '/tts/speak': 'http://localhost:5000',
    }
  }
})
