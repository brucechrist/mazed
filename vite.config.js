import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',        // ensures relative paths for Electron
  plugins: [react()],
});
