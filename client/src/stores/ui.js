import { defineStore } from 'pinia';
import request from '@/utils/request';

// 全局 UI 状态：登录弹窗被首页 / 各页面反复唤起，提到 store 里避免层层 emit。
// 登录已改成整页（/auth），这里只留一个「从哪个入口进」的意图，真正的跳转由调用方 router.push。
export const useUiStore = defineStore('ui', {
  state: () => ({
    // 登录已合一（本机号一键登录为本，改号才补验证码），这里只区分「登录」还是「重置密码」
    authMode: 'quick', // 'quick' | 'reset'：下次进 /auth 的默认页
    // 「工具」筛选状态提到全局：顶部搜索框、页内搜索框、分类 pill 都读同一份，
    // 以前页内是把 prop 拷进 ref 就再也不跟随了（在 /tools 打字时顶部框照旧、两边各说各话）
    activeCat: 'all', // 顶部「工具」下拉当前选中的分类
    keyword: '', // 搜索词，顶部框与工具页内框双向绑定同一个值
    activeModule: 'home', // 顶部导航高亮项
    // 未读消息数：消息页把它同步进来，导航/底部 tab 上的红点读它。
    // 初值 0，登录后由 loadUnread() 拉后端 /messages/unread-count 覆盖（游客不请求，避免误跳登录）。
    unread: 0,
    // 私聊未读：好友页 / 会话列表的未读总数，驱动「好友」底部 tab 的红点。
    // 与系统消息未读（unread）分开记，两个入口各亮各的。
    chatUnread: 0,
    // 待通过的好友申请数（「新朋友」独立入口）。和 chatUnread 合并成「好友」tab 的红点，
    // A 加 B / A 给 B 发消息，B 这边的社交红点都要尽快亮。
    friendReqCount: 0
  }),
  actions: {
    // 消息页每次算完未读数都调这个，导航红点就永远是准的
    setUnread(n) {
      this.unread = Number(n) || 0;
    },
    bumpUnread(n = 1) {
      this.unread = (Number(this.unread) || 0) + n;
    },
    clearUnread() {
      this.unread = 0;
    },
    setChatUnread(n) {
      this.chatUnread = Number(n) || 0;
    },
    clearChatUnread() {
      this.chatUnread = 0;
    },
    setFriendReqCount(n) {
      this.friendReqCount = Number(n) || 0;
    },
    // 拉后端待通过好友申请数，刷新「好友」tab 红点。游客不请求。
    async loadFriendRequests() {
      if (!localStorage.getItem('tb_token')) {
        this.friendReqCount = 0;
        return;
      }
      try {
        const { incoming } = await request.get('/friends/requests');
        this.friendReqCount = Array.isArray(incoming) ? incoming.length : 0;
      } catch {
        /* 未登录 / 接口异常都不阻塞页面 */
      }
    },
    // 拉后端未读计数刷新导航红点（AppLayout 挂载时 / 登录后调）。游客不请求。
    async loadUnread() {
      if (!localStorage.getItem('tb_token')) {
        this.unread = 0;
        return;
      }
      try {
        const { count } = await request.get('/messages/unread-count');
        this.unread = Number(count) || 0;
      } catch {
        /* 未登录 / 接口异常都不阻塞页面 */
      }
    },
    // 拉后端私聊未读计数，刷新「好友」tab 红点。游客不请求。
    async loadChatUnread() {
      if (!localStorage.getItem('tb_token')) {
        this.chatUnread = 0;
        return;
      }
      try {
        const { count } = await request.get('/chats/unread-count');
        this.chatUnread = Number(count) || 0;
      } catch {
        /* 未登录 / 接口异常都不阻塞页面 */
      }
    },
    // 顶部「工具」下拉选分类（纯状态）；若要同时回首页，由调用方 router.push('/') 处理
    setCat(key) {
      this.activeCat = key;
    },
    // 搜索词：顶部框和工具页内框共用，任何一边改动另一边立刻跟着变
    setKeyword(v) {
      this.keyword = v == null ? '' : String(v);
    },
    // 打开登录页：只记意图，跳转交给调用方（store 里塞 router 会让单测和 SSR 很痛）
    openLogin(tab = 'quick') {
      this.authMode = tab === 'reset' ? 'reset' : 'quick';
      return this.authMode;
    }
  }
});
