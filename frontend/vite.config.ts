import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',

  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },

  server: {
    host: true,
    port: 5173,
    strictPort: true,
    open: false,

    hmr: {
      protocol: 'wss',
      host: 'localhost',
      clientPort: 8443,
    },
  },
});
