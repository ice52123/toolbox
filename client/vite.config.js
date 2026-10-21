import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  server: {
    // host:true = 监听 0.0.0.0，局域网 / 手机 / 预览面板都能访问（不写就是只监听 127.0.0.1）
    host: true,
    port: 5173,
    proxy: {
      // 当前连 MySQL 版(3201)。要测 MongoDB 版把这里改回 http://localhost:3202
      '/api': { target: 'http://localhost:3201', changeOrigin: true },
      // /files/xxx 是后端静态目录（头像、商品实拍图），不转就是一串 404
      '/files': { target: 'http://localhost:3201', changeOrigin: true }
    }
  }
});
