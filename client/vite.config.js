import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// En desarrollo, /api y /uploads se reenvían al servidor Express (evita problemas de CORS)
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3001', '/uploads': 'http://localhost:3001' } },
});
