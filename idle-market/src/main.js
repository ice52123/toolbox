import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
// EP 的深色变量表是靠 html.dark 生效的独立 css，主文件不含。
// 我们不引的话，内嵌（qiankun）时主站虽然已经加了 html.dark，子应用内的
// 输入框 / 下拉 / 标签仍是浅色一套，深色页面上就是一片糊。
import 'element-plus/theme-chalk/dark/css-vars.css';
import App from './App.vue';
import router from './router';
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/es/helper';
import { setBridge } from './api';
import './styles.css';

let app = null;

// qiankun 标记：两种读法都兜，避免「子应用里判定成独立运行」导致
// 底部这里又往主站的 #app 上挂载一遍（会出现两套内容 / 内容空白）
const underQiankun = !!(
  qiankunWindow.__POWERED_BY_QIANKUN__ || (typeof window !== 'undefined' && window.__POWERED_BY_QIANKUN__)
);

function render(props = {}) {
  const { container } = props;
  // 登录态由主站透传（token / userId / school），先把它们灌进接入层，
  // 页面再发请求时就自动带上 Authorization 和 ?school=；独立打开 4200 时 props 为空，
  // api.js 会退回读 localStorage（没登录就是游客视角，列表照看，发布会要登录）。
  setBridge(props);

  app = createApp(App);
  app.use(createPinia());
  app.use(router);
  app.use(ElementPlus);
  // 子应用被 qiankun 挂载时，container 是主站注入的 #idle-container，
  // 里面的 #app 是 qiankun 从入口 HTML 塞进来的挂载点；兜底直接用 container，
  // 免得 mount(null) 静默失败、页面只剩一条顶栏。
  const root = container ? container.querySelector('#app') || container : '#app';
  app.mount(root);

  // 主站直接以 /m/idle 打开时，子应用自己解析到的是 /m/idle（匹配不到我们的页面，
  // 表现就是「顶部栏下面一片空白」）。用主站透传进来的子路由补齐，默认进「逛一逛」。
  const to = props.path || '/list';
  router.isReady().then(() => {
    if (router.currentRoute.value.path !== to) router.replace(to).catch(() => {});
  });
}

renderWithQiankun({
  mount(props) {
    render(props);
  },
  bootstrap() {},
  update() {},
  unmount() {
    if (app) {
      app.unmount();
      app = null;
    }
  }
});

// 独立访问（直接打开 4200）时也正常渲染
if (!underQiankun) {
  document.body.classList.add('idle-standalone');
  render();
}
