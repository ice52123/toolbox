import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import qiankun from 'vite-plugin-qiankun';

// 作为 qiankun 子应用运行，主站 toolbox(/idle) 内嵌加载。
// useDevMode: true 是关键：让 qiankun 注入子应用时把 /src/main.js 等模块路径
// 按子应用自身源(4200)解析，而不是主站(5173)，否则模块 404 → 白屏。
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  plugins: [
    vue(),
    qiankun('idle-market', { useDevMode: true })
  ],
  server: {
    port: 4200,
    host: '127.0.0.1',
    cors: true,
    origin: 'http://127.0.0.1:4200'
  }
});
