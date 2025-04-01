import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all network interfaces (for ngrok to work)
    port: 5173, // Or whatever port your dev server is running on
    allowedHosts: [
      'localhost',
      '.localhost', // For subdomains like 127.0.0.1
      'efimero.ngrok.app', // Add the ngrok hostname here
    ],
  }
})
