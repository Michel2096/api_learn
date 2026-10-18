import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// El frontend siempre llama a "/api/..." y Vite lo reenvía al backend.
// En Docker el destino es http://api:4000 (ver docker-compose.yml).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': process.env.VITE_API_TARGET ?? 'http://localhost:4000',
    },
  },
});
