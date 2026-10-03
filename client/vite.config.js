import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  server: {
    port: 5173,
    proxy: {
      // 默认连 MySQL 版(3201)。要测 MongoDB 版把这里改成 http://localhost:3202
      '/api': { target: 'http://localhost:3201', changeOrigin: true }
    }
  }
});
