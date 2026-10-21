import { defineStore } from 'pinia';
import request from '@/utils/request';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('tb_token') || '',
    username: localStorage.getItem('tb_username') || '',
    id: localStorage.getItem('tb_id') || '',
    code: localStorage.getItem('tb_code') || '',
    avatar: localStorage.getItem('tb_avatar') || ''
  }),
  getters: {
    isLogin: (s) => !!s.token
  },
  actions: {
    async login(username, password) {
      const data = await request.post('/user/login', { username, password });
      this.setSession(data.token, data.username, data.id, data.code);
      return data;
    },
    async register(username, password) {
      return await request.post('/user/register', { username, password });
    },
    // 手机号 + 验证码：注册过直接登录，没注册过服务端自动建号
    async smsLogin(phone, code) {
      const data = await request.post('/user/sms-login', { phone, code });
      this.setSession(data.token, data.username, data.id, data.code);
      return data;
    },
    // 一键登录：本机号码直接进，没注册过服务端自动开号（不校验验证码）
    async quickLogin(phone) {
      const data = await request.post('/user/quick-login', { phone });
      this.setSession(data.token, data.username, data.id, data.code);
      return data;
    },
    // 忘记密码：验过手机号 + 验证码后直接改密码
    async resetPassword(phone, code, password) {
      return await request.post('/user/reset-password', { phone, code, password });
    },
    // 本地演示会话：后端未起 / 演示环境直接落一个 token，页面链路照样能点
    setSession(token, username, id, code) {
      this.token = token;
      this.username = username;
      this.id = id;
      if (code) this.code = code;
      localStorage.setItem('tb_token', token);
      localStorage.setItem('tb_username', username);
      localStorage.setItem('tb_id', id);
      if (code) localStorage.setItem('tb_code', code);
    },
    // 6 位唯一用户ID：登录返回里有就存，「我的」页拉 /me 后也会补
    setCode(code) {
      if (!code) return;
      this.code = code;
      localStorage.setItem('tb_code', code);
    },
    // 改用户名（「我的 → 账号设置」里自己改，不在登录流程里绕）
    setUsername(name) {
      this.username = name;
      localStorage.setItem('tb_username', name);
    },
    // 换头像：服务端落盘后拿回 /files/xxx 的绝对路径
    setAvatar(url) {
      this.avatar = url || '';
      localStorage.setItem('tb_avatar', url || '');
    },
    logout() {
      this.token = '';
      this.username = '';
      this.id = '';
      this.code = '';
      this.avatar = '';
      localStorage.removeItem('tb_token');
      localStorage.removeItem('tb_username');
      localStorage.removeItem('tb_id');
      localStorage.removeItem('tb_code');
      localStorage.removeItem('tb_avatar');
    }
  }
});
