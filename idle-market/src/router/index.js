import { createRouter, createWebHistory } from 'vue-router';
import List from '../views/List.vue';
import Publish from '../views/Publish.vue';
import Detail from '../views/Detail.vue';

const routes = [
  { path: '/', redirect: '/list' },
  { path: '/list', component: List },
  { path: '/publish', component: Publish },
  { path: '/detail/:id', component: Detail },
  // 兜底：主站直接打开 /m/idle 时，只要 base 判定稍有偏差，
  // 顶层路由匹配不上就会「只渲染顶部栏 + 一片空白」。这里统一落到「逛一逛」。
  { path: '/:rest(.*)*', redirect: '/list' }
];

// base 必须和主站挂载它的前缀一致：主站是把子应用挂在 /m/idle 下的（不是 /idle）。
// base 写错会导致子应用 push 路由时改写主站 URL（/list 之类），主站路由匹配不上 → 404。
// 两种读法都兜上：插件导出的 qiankunWindow 与真实 window，取 truthy 的那个。
const qk =
  (typeof window !== 'undefined' && (window.__POWERED_BY_QIANKUN__ || (window.proxy && window.proxy.__POWERED_BY_QIANKUN__))) ||
  false;

const base = qk ? '/m/idle' : '/';

const router = createRouter({
  history: createWebHistory(base),
  routes
});

export default router;
