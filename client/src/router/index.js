import { createRouter, createWebHistory } from 'vue-router';
import AppLayout from '@/layout/AppLayout.vue';

// 懒加载：单个页面模块加载失败只会坏这一页（触发 router.onError），
// 不会像静态 import 那样在入口就整个崩掉导致白屏；顺带把首屏大包拆开。
const Home = () => import('@/views/Home.vue');
const ToolView = () => import('@/views/ToolView.vue');
const Tools = () => import('@/views/Tools.vue');
const MicroAppHost = () => import('@/views/MicroAppHost.vue');
const ComingSoon = () => import('@/views/ComingSoon.vue');
const NotFound = () => import('@/views/NotFound.vue');

// P2 后端基座 · 用户中心
const Me = () => import('@/views/Me.vue');
// 我的清单：「我的」页里「我的发布 / 我的收藏」的落地页（可下架/删除/取消收藏）
const MyList = () => import('@/views/MyList.vue');
// 收货地址簿 / 收付款设置：「我的」页另外两张卡片的落地页
const Address = () => import('@/views/Address.vue');
const Wallet = () => import('@/views/Wallet.vue');
// P3 校园社区
const Community = () => import('@/views/Community.vue');
// P4 交易闭环
const Orders = () => import('@/views/Orders.vue');
// P5 实时通知
const Message = () => import('@/views/Message.vue');
// P6 部署打磨 / 项目总览
const About = () => import('@/views/About.vue');
// 好友：列表 + 添加 + 左滑/长按删除，点好友发起私聊
const Friends = () => import('@/views/Friends.vue');
// 登录 / 注册 / 找回密码：整页式（不带主站外壳），有自己的背景和两栏布局
const Auth = () => import('@/views/Auth.vue');
// 公告中心：首页公告条点「›」落到这里
const Notice = () => import('@/views/Notice.vue');
// 研发路线：About 页「完整路线 ›」落到这里（P1→P6 时间轴大图）
const Roadmap = () => import('@/views/Roadmap.vue');
// 消息中心里 6 个按钮的落地页（去聊天 / 查看 / 查看主页 / 去处理 / 去评价 …）
const Chat = () => import('@/views/Chat.vue');
const PostDetail = () => import('@/views/PostDetail.vue');
const UserProfile = () => import('@/views/UserProfile.vue');
const OrderDetail = () => import('@/views/OrderDetail.vue');
const OrderReview = () => import('@/views/OrderReview.vue');

// 登录态约定：localStorage.tb_token 存在即已登录（与 user store / request 拦截器一致）。
// requiresAuth 路由未登录跳 /auth?redirect=当前路径，登录成功后 Auth 页会跳回原页。
const routes = [
  // 登录页：整屏独立，不套主站外壳（不然顶部导航 + 背景会打架）
  { path: '/auth', name: 'auth', component: Auth },

  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', name: 'home', component: Home },
      { path: 'tool/:id', name: 'tool', component: ToolView },
      // 全部工具（首页「更多 ›」跳转到这里）
      { path: 'tools', name: 'tools', component: Tools },
      // 微应用统一入口：/m/:app（app 取自 config/microApps.js 的 key / name）
      { path: 'm/:app', name: 'micro', component: MicroAppHost, props: true, meta: { requiresAuth: true } },
      // 微应用内部深层路由（如 /m/idle/list、/m/idle/publish）：同样交给宿主，别落到 404
      { path: 'm/:app/:rest(.*)*', name: 'microDeep', component: MicroAppHost, props: true, meta: { requiresAuth: true } },
      // 兼容旧链接
      { path: 'idle', redirect: '/m/idle' },
      { path: 'idle/:rest(.*)*', name: 'idleDeep', component: MicroAppHost, props: { app: 'idle' }, meta: { requiresAuth: true } },

      // —— 子应用内部路由桥接（闲置市场整模块需登录）——
      // qiankun 下子应用 router 与主站共享 history，子应用 push('/list') 时
      // 主站 URL 会变成 /list，这些路径必须指回闲置宿主，否则就是一整片 404。
      { path: 'list', name: 'idleList', component: MicroAppHost, props: { app: 'idle' }, meta: { requiresAuth: true } },
      { path: 'publish', name: 'idlePublish', component: MicroAppHost, props: { app: 'idle' }, meta: { requiresAuth: true } },
      { path: 'detail/:id', name: 'idleDetail', component: MicroAppHost, props: { app: 'idle' }, meta: { requiresAuth: true } },

      // —— 已实现的页面 ——
      { path: 'community', name: 'community', component: Community, meta: { requiresAuth: true } }, // P3 校园社区：需登录
      // backTo：二级页返回按钮的兜底目标（直接打开链接、没有来路时用）；有来路一律回上一页
      { path: 'message', name: 'message', component: Message, meta: { requiresAuth: true, backTo: '/me' } }, // P5 消息中心：需登录
      { path: 'orders', name: 'orders', component: Orders, meta: { requiresAuth: true, backTo: '/me' } }, // P4 订单中心：需登录
      { path: 'me', name: 'me', component: Me, meta: { requiresAuth: true } }, // P2 我的：需登录
      // 我的清单：query.tab = publish | fav，「我的」页两个卡片右上角「全部 ›」落这里
      { path: 'me/list', name: 'myList', component: MyList, meta: { requiresAuth: true } },
      // 收货地址簿：快递寄送下单时用的地址在这里维护
      { path: 'me/address', name: 'address', component: Address, meta: { requiresAuth: true, backTo: '/me' } },
      // 收付款：余额、支付方式、收款账户
      { path: 'me/wallet', name: 'wallet', component: Wallet, meta: { requiresAuth: true, backTo: '/me' } },
      { path: 'about', name: 'about', component: About }, // P6 项目总览：游客可看
      { path: 'notice', name: 'notice', component: Notice }, // 公告中心：公共信息，游客可看
      { path: 'notice/:id', name: 'noticeDetail', component: Notice },
      { path: 'roadmap', name: 'roadmap', component: Roadmap }, // 研发路线 P1→P6：游客可看

      // 好友：列表 + 添加 + 左滑/长按删除，点好友发起私聊
      { path: 'friends', name: 'friends', component: Friends, meta: { requiresAuth: true } },
      // 聊天：必须带会话 id 才进得来；裸 /chat 回好友页（别再落一个假的 c1 会话）
      { path: 'chat', redirect: '/friends' },
      { path: 'chat/:id', name: 'chat', component: Chat, meta: { requiresAuth: true } },
      { path: 'post/:id', name: 'post', component: PostDetail, meta: { requiresAuth: true } }, // 帖子详情：社区内容，需登录
      // :name 是昵称（路径里带中文，跳转处用 encodeURIComponent 拼）
      { path: 'user/:name', name: 'user', component: UserProfile, meta: { requiresAuth: true } }, // 他人主页：社区社交，需登录
      { path: 'order/:id', name: 'orderDetail', component: OrderDetail, meta: { requiresAuth: true } },
      { path: 'order/:id/review', name: 'orderReview', component: OrderReview, meta: { requiresAuth: true } },

      // —— 占位页（P3/P5 建好子应用后可摘掉）——
      {
        path: 'forum',
        name: 'forum',
        component: ComingSoon,
        props: { title: '校园社区', phase: 'P3', desc: 'P3 阶段：主站内已实现，子应用 campus-forum 拆分后启用' }
      },

      // —— 兜底：任何未匹配路径都落到 404，绝不白屏 ——
      { path: ':pathMatch(.*)*', name: 'notFound', component: NotFound }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  // 进新页面回到顶部；点返回时还原离开前的位置（浏览器本来就记着 savedPosition）
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 };
  }
});

// —— 全局登录守卫 ——
// 需要登录的路由（meta.requiresAuth）未登录时跳 /auth，并带上 redirect 让登录后回跳。
// /auth 自身永远放行，避免重定向死循环；游客可看的页面（首页/工具/公告/路线）不加 meta。
router.beforeEach((to, from, next) => {
  if (to.path === '/auth') return next();
  if (to.meta && to.meta.requiresAuth && !localStorage.getItem('tb_token')) {
    return next({ path: '/auth', query: { redirect: to.fullPath } });
  }
  next();
});

// 懒加载 / 动态 import 失败（比如模块 404、网络抖动）：给个明确提示，而不是静默白屏
router.onError((err) => {
  console.error('[ CampusHub ] 路由模块加载失败：', err);
});

export default router;
