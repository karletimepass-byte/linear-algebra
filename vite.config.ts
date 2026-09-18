import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/linear-algebra/',
  server: {
    port: 3000,
    host: true,
    open: false,
  },
});
