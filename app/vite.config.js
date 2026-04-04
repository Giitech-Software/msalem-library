//app/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; // Ensure this is imported for version 4.x

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Add the tailwind plugin here
  ],
  base: './', // CRITICAL: Forces relative paths so Electron can load assets from the dist folder
  server: {
    port: 5173,
    strictPort: true, // Prevents Vite from jumping to a different port if 5173 is busy
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Optional: Minify for smaller production builds
    minify: 'esbuild',
    reportCompressedSize: false,
  }
});