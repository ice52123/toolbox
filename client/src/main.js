import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import App from './App.vue';
import router from './router';
import { ElMessage } from 'element-plus';
import './styles/index.less';

const app = createApp(App);

// 全局兜底：任意组件 render / setup 抛错都在这里收口，
// 有 ErrorBoundary 时是页面级降级，没兜住的全站级错误也提示出来，而不是只留一片空白。
app.config.errorHandler = (err, _instance, info) => {
  console.error('[ CampusHub ] 运行时错误：', info, err);
  try {
    ElMessage.error('页面出错了，已安全降级');
  } catch {
    /* ElMessage 自身出错时不再二次抛错 */
  }
};
app.use(createPinia());
app.use(router);
app.use(ElementPlus);
for (const [key, comp] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, comp);
}
app.mount('#app');
