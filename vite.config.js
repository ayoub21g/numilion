import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/numilion/',
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app.[hash].js',
        chunkFileNames: 'assets/chunk.[hash].js',
        assetFileNames: 'assets/asset.[hash].[ext]',
      },
    },
  },
});
