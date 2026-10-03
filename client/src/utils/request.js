import axios from 'axios';

const request = axios.create({
  baseURL: '/api',
  timeout: 15000
});

// 请求自动带 token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('tb_token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

// 响应统一拆包：code===0 返回 data，否则抛错
request.interceptors.response.use(
  (res) => {
    const body = res.data;
    if (body && body.code === 0) return body.data;
    if (body && body.code === 401) {
      localStorage.removeItem('tb_token');
      localStorage.removeItem('tb_username');
      localStorage.removeItem('tb_id');
    }
    return Promise.reject(new Error(body?.message || '请求失败'));
  },
  (err) => Promise.reject(err)
);

export default request;
