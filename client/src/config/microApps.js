// 微应用注册表（qiankun）：新增子应用 = 建好子应用 + 在这里加一条。
// enabled=false 的会在主站以「建设中」占位，等对应阶段建好再置 true。
// key 是「URL 里用的短名」，name 是 qiankun 实例名（一般同 package name）。
export const microApps = [
  {
    key: 'idle',
    name: 'idle-market',
    title: '闲置市场',
    // entry 是「同源相对路径」，本地 dev 下由 MicroAppHost 换成 devUrl（子应用 dev 跑在 4200），
    // 公网部署下解析成当前域名 + /idle-app/（子应用构建产物由 serve.mjs 同源托管）。
    entry: '/idle-app/',
    devUrl: 'http://127.0.0.1:4200',
    route: '/m/idle',
    enabled: true,
    icon: 'Shop'
  },
  {
    key: 'forum',
    name: 'campus-forum',
    title: '校园社区',
    entry: '//127.0.0.1:4300',
    devUrl: 'http://127.0.0.1:4300',
    route: '/m/forum',
    enabled: false,
    icon: 'ChatDotRound',
    phase: 'P3',
    desc: '论坛：二手 / 互助 / 组队 / 吐槽 / 失物招领'
  },
  {
    key: 'message',
    name: 'message-center',
    title: '消息中心',
    entry: '//127.0.0.1:4400',
    devUrl: 'http://127.0.0.1:4400',
    route: '/m/message',
    enabled: false,
    icon: 'Bell',
    phase: 'P5',
    desc: '实时通知：回复 / 交易 / 系统消息'
  }
];

// 先按 URL 短名 key 匹配，再回退到 qiankun 实例名 name
export function getMicroApp(query) {
  return microApps.find((a) => a.key === query) || microApps.find((a) => a.name === query);
}
