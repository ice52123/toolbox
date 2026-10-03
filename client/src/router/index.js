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
// P3 校园社区
const Community = () => import('@/views/Community.vue');
// P4 交易闭环
const Orders = () => import('@/views/Orders.vue');
// P5 实时通知
const Message = () => import('@/views/Message.vue');
// P6 部署打磨 / 项目总览
const About = () => import('@/views/About.vue');
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
      { path: 'm/:app', name: 'micro', component: MicroAppHost, props: true },
      // 微应用内部深层路由（如 /m/idle/list、/m/idle/publish）：同样交给宿主，别落到 404
      { path: 'm/:app/:rest(.*)*', name: 'microDeep', component: MicroAppHost, props: true },
      // 兼容旧链接
      { path: 'idle', redirect: '/m/idle' },
      { path: 'idle/:rest(.*)*', name: 'idleDeep', component: MicroAppHost, props: { app: 'idle' } },

      // —— 子应用内部路由桥接 ——
      // qiankun 下子应用 router 与主站共享 history，子应用 push('/list') 时
      // 主站 URL 会变成 /list，这些路径必须指回闲置宿主，否则就是一整片 404。
      { path: 'list', name: 'idleList', component: MicroAppHost, props: { app: 'idle' } },
      { path: 'publish', name: 'idlePublish', component: MicroAppHost, props: { app: 'idle' } },
      { path: 'detail/:id', name: 'idleDetail', component: MicroAppHost, props: { app: 'idle' } },

      // —— 已实现的页面 ——
      { path: 'community', name: 'community', component: Community }, // P3
      { path: 'message', name: 'message', component: Message }, // P5
      { path: 'orders', name: 'orders', component: Orders }, // P4
      { path: 'me', name: 'me', component: Me }, // P2
      { path: 'about', name: 'about', component: About }, // P6
      { path: 'notice', name: 'notice', component: Notice }, // 公告中心
      { path: 'notice/:id', name: 'noticeDetail', component: Notice },
      { path: 'roadmap', name: 'roadmap', component: Roadmap }, // 研发路线 P1→P6
      // 聊天：不带 id 时落到第一条会话（没人会直接输 /chat，但别让它 404）
      { path: 'chat', name: 'chat', redirect: '/chat/c1' },
      { path: 'chat/:id', name: 'chat', component: Chat },
      { path: 'post/:id', name: 'post', component: PostDetail },
      // :name 是昵称（路径里带中文，跳转处用 encodeURIComponent 拼）
      { path: 'user/:name', name: 'user', component: UserProfile },
      { path: 'order/:id', name: 'orderDetail', component: OrderDetail },
      { path: 'order/:id/review', name: 'orderReview', component: OrderReview },

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
  routes
});

// 懒加载 / 动态 import 失败（比如模块 404、网络抖动）：给个明确提示，而不是静默白屏
router.onError((err) => {
  console.error('[ CampusHub ] 路由模块加载失败：', err);
});

export default router;
