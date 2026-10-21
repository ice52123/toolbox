import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import qiankun from 'vite-plugin-qiankun';

// 作为 qiankun 子应用运行，主站 toolbox(/idle) 内嵌加载。
// useDevMode: true 是关键：让 qiankun 注入子应用时把 /src/main.js 等模块路径
// 按子应用自身源(4200)解析，而不是主站(5173)，否则模块 404 → 白屏。
export default defineConfig({
  // 子应用产物部署在主站下的 /idle-app/：不设 base，构建出的资源路径是 /assets/…
  // （绝对路径 → 指向主站域名），qiankun 从 /idle-app/ 拉子应用时会 404。
  // 这里让资源带上前缀，主站同源直接可取；子应用路由的 base 由 router/index.js 单独管。
  base: '/idle-app/',
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
    origin: 'http://127.0.0.1:4200',
    // 只在「独立访问 4200」时用到：被 qiankun 嵌进主站后，子应用代码跑在主站页面里，
    // fetch('/api/...') 走的是主站自己的代理，跟这里的配置无关。
    proxy: {
      '/api': { target: 'http://127.0.0.1:3201', changeOrigin: true },
      '/files': { target: 'http://127.0.0.1:3201', changeOrigin: true }
    }
  }
});
