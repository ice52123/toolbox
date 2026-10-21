import axios from 'axios';
import router from '@/router';

const request = axios.create({
  baseURL: '/api',
  timeout: 15000
});

// 请求自动带 token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('tb_token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  // 多租户：自动把当前校区带上下次请求（前端选校后存 localStorage.tb_school）。
  // 后端各列表接口按 req.query.school 下推过滤；写操作可忽略或也读这个参数。
  const school = localStorage.getItem('tb_school');
  if (school) {
    config.params = { ...(config.params || {}), school };
  }
  return config;
});

// 响应统一拆包：code===0 返回 data，否则抛错
request.interceptors.response.use(
  (res) => {
    const body = res.data;
    if (body && body.code === 0) return body.data;
    if (body && body.code === 401) {
      // token 失效 / 未带 token 被后端拦：清掉本地态并跳登录（带当前页回跳）。
      // 与路由守卫形成双保险——即便用户手动拼 URL 进了需登录页，接口 401 也会拉回登录。
      localStorage.removeItem('tb_token');
      localStorage.removeItem('tb_username');
      localStorage.removeItem('tb_id');
      const cur = router.currentRoute.value.fullPath;
      if (router.currentRoute.value.path !== '/auth') {
        router.replace({ path: '/auth', query: { redirect: cur } });
      }
    }
    return Promise.reject(new Error(body?.message || '请求失败'));
  },
  // ⚠️ 后端很多「业务拒绝」是带 HTTP 4xx 状态返回的（比如取消已取消的单 → 400
  // 「只有待付款订单可取消」）。axios 走这条分支时err.message 是 axios 生成的英文
  // 「Request failed with status code 400」，后端那句中文原因被整个丢掉，
  // 页面顶部就弹一条看不懂的英文报错。这里把 body.message 捞出来重新抛。
  (err) => {
    const body = err?.response?.data;
    if (body && body.code === 401) {
      localStorage.removeItem('tb_token');
      localStorage.removeItem('tb_username');
      localStorage.removeItem('tb_id');
      const cur = router.currentRoute.value.fullPath;
      if (router.currentRoute.value.path !== '/auth') {
        router.replace({ path: '/auth', query: { redirect: cur } });
      }
    }
    if (body && body.message) {
      const e = new Error(body.message);
      // 保留 HTTP 状态码，页面要靠它区分「没找到(404) / 没权限(403) / 状态不对(400)」
      e.status = err.response.status;
      e.bizCode = body.code;
      return Promise.reject(e);
    }
    return Promise.reject(err);
  }
);

// —— 前端防重：写请求在途去重 ——
// 连点「发布 / 下单 / 发消息 / 加好友」时，若两次请求 method+url+body+params 完全一致，
// 且前一次还在飞，则复用同一条网络请求，绝不发第二次。配合后端的接口幂等中间件，
// 形成「前端拦截 + 后端兜底」的双保险，避免产生重复数据。
// 注意：只有内容完全相同的在途请求才会被合并；用户真实二次提交（内容不同）照常发送。
const _inflight = new Map();
function _writeSig(config) {
  const method = (config.method || 'get').toLowerCase();
  if (method !== 'post' && method !== 'put' && method !== 'delete') return null;
  const data =
    config.data == null ? '' : typeof config.data === 'string' ? config.data : JSON.stringify(config.data);
  const params = config.params == null ? '' : JSON.stringify(config.params);
  return method + '|' + (config.baseURL || '') + '|' + (config.url || '') + '|' + data + '|' + params;
}
const _origRequest = request.request.bind(request);
request.request = (config) => {
  const sig = _writeSig(config);
  if (!sig) return _origRequest(config); // 读请求不参与去重
  if (_inflight.has(sig)) return _inflight.get(sig); // 完全相同的在途写请求 → 复用
  const p = _origRequest(config).finally(() => {
    // 请求结束后稍候再释放，避免极短时间内的连点直接穿透，但正常二次提交不受影响
    setTimeout(() => _inflight.delete(sig), 0);
  });
  _inflight.set(sig, p);
  return p;
};

export default request;
