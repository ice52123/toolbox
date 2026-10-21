// 主站顶部导航（校园集）。新增一级模块 = 这里加一条。
// children 存在即渲染为「下拉菜单」。
import { categories } from './tools';

export const modules = [
  { key: 'home', name: '首页', icon: 'HomeFilled', path: '/' },
  {
    key: 'tools',
    name: '工具',
    icon: 'Grid',
    // 指向全量工具页：以前这里是 '/'，下拉只能切分类、跳不了页，点了像没反应
    path: '/tools',
    children: categories.filter((c) => c.key !== 'module')
  },
  { key: 'community', name: '校园社区', icon: 'ChatDotRound', path: '/community' },
  { key: 'idle', name: '闲置市场', icon: 'Shop', path: '/m/idle' },
  { key: 'friends', name: '好友', icon: 'Connection', path: '/friends' },
  {
    key: 'me',
    name: '我的',
    icon: 'User',
    path: '/me',
    // 只放「真正有独立页面」的子项：
    // 「我的发布 / 我的收藏」和「我的主页」是同一页（/me 内的三块卡片），
    // 再列一遍就是两个点了没反应的假入口，删掉；发布/收藏从卡片上的按钮进
    children: [
      { key: 'me', name: '我的主页', icon: 'User', path: '/me' },
      { key: 'message', name: '消息中心', icon: 'Bell', path: '/message', badge: true },
      { key: 'order', name: '我的订单', icon: 'Tickets', path: '/orders' },
      { key: 'logout', name: '退出', icon: 'SwitchButton', action: 'logout', divided: true }
    ]
  }
];
