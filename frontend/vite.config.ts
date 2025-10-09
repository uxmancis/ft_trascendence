import { defineConfig } from 'vite';

export default defineConfig({
  root: ".",
  build: {
    outDir: "dist", // Carpeta de build
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },
  server: {
    port: 5173,
    open: true,
    historyApiFallback: true,
  },
});
