// 阶段一：全站 mock 数据集中放这里，P2 接后端后统一换成接口返回。
// 目的 —— 页面结构、交互、视觉先跑通，后端联调时只改数据源。

// —— 首页统计与公告 ——
export const stats = [
  { key: 'tools', label: '在线工具', value: 22, unit: '个' },
  { key: 'goods', label: '校园闲置', value: 316, unit: '件' },
  { key: 'users', label: '在校同学', value: 4820, unit: '人' }
];

// 每条公告 = 首页公告条的一条滚动文案，同时是公告中心的一条详情
export const notices = [
  {
    id: 'n1',
    tag: '版本更新',
    title: '新版本上线：闲置发布支持多图上传，消息中心已支持实时提醒',
    date: '2026-10-01',
    content:
      '闲置发布新增多图上传（单张 ≤5MB，最多 6 张，首图自动作封面）；消息中心改为实时推送，转交、发货、回复都会在 1 秒内出现在消息页，未读红点同步到导航上的「我的」。'
  },
  {
    id: 'n2',
    tag: '社区',
    title: '迎新季互助帖专区已开放，提问请标注院系与楼层，回复更快',
    date: '2026-09-28',
    content:
      '每届迎新都会有一大批「怎么选课 / 宿舍在哪 / 教材去哪买」的提问。互助专区建议发帖时带上院系和楼层，老生回得更及时；发布超过 48 小时无回复的帖子会自动进入加精池。'
  },
  {
    id: 'n3',
    tag: '工具箱',
    title: '校园网测速 / 空教室查询等工具正在内测，欢迎反馈',
    date: '2026-09-22',
    content:
      '工具箱新增两组校园向工具：校园网测速（测出口带宽与丢包）、空教室查询（按楼栋 / 时段查可用教室）。内测期遇到问题请点工具页右下角反馈，接下来会补上课程表导入。'
  }
];

// —— 首页最新动态 ——
export const latestGoods = [
  { id: 'g1', title: '九成新 iPad Air 4 64G', price: 1800, cat: '数码', place: '校区3栋', owner: '王同学', time: '10 分钟前' },
  { id: 'g2', title: '考研英语全套资料', price: 30, cat: '图书', place: '图书馆B区', owner: '小林', time: '40 分钟前' },
  { id: 'g3', title: '自行车 变速整车', price: 260, cat: '运动', place: '宿舍C栋', owner: '阿泽', time: '1 小时前' }
];

export const hotPosts = [
  { id: 'p1', board: '互助求助', title: '求推荐靠谱的二手电脑维修，宿舍区附近', author: '摸鱼王', time: '5 分钟前', hot: 128 },
  { id: 'p2', board: '二手闲置', title: '毕业甩卖：显示器 + 机械键盘一套走', author: '毕业季学姐', time: '18 分钟前', hot: 96 },
  { id: 'p3', board: '组队拼单', title: '拼一份 20 人团餐，食堂三楼可送到宿舍', author: '干饭组长', time: '32 分钟前', hot: 74 }
];

// —— P3 校园社区（论坛）：帖子正文写进 mock，详情页直接读（列表页仍用 onMounted 兜底）——
export const posts = [
  {
    id: 1, board: '二手闲置', title: '毕业甩卖：MacBook Air M1 + 雷电扩展坞', author: '毕业季学姐', avatar: '🎒',
    time: '2 小时前', views: 312, likes: 46, comments: 23, tags: ['笔记本', '可小刀'],
    body: '用了两年，日常写论文 + 剪视频都很稳，续航到晚上还有一半。毕业清仓，MacBook Air M1 8+256 配原装充电器，加一个雷电 3 扩展坞（接显示器、读卡都用它）。两个一起走 4200，单出笔记本 3800。合适的话可以到宿舍楼下面交当场验机。'
  },
  {
    id: 2, board: '互助求助', title: '图书馆三楼自习位一般几点就没了？', author: '早八人', avatar: '📚',
    time: '3 小时前', views: 158, likes: 12, comments: 31, tags: ['自习', '答疑'],
    body: '下学期想稳定占个靠窗的位置，问过学长说六点就基本满了。想问下三楼是不是比四楼抢得凶？以及期末周会不会直接封楼不让进？'
  },
  {
    id: 3, board: '组队拼单', title: '拼 10 人的快递回校货车，周三发车', author: '快递搭子', avatar: '📦',
    time: '5 小时前', views: 96, likes: 8, comments: 17, tags: ['拼车', '包送达'],
    body: '同一个快递站到学校，凑满 10 单就能叫一趟车，人均 12 块。周三下午 4 点发车，截止时间周一下午 6 点，要拼的评论区报单号后四位。'
  },
  {
    id: 4, board: '失物招领', title: '在水房捡到一副黑框眼镜，丢的人来认领', author: '好心同学', avatar: '👓',
    time: '昨天', views: 421, likes: 88, comments: 12, tags: ['已归还'],
    body: '挂在水房饮水机旁边的挂钩上，镜腿有点松但能用，附送一副备用鼻托。丢了的同学带校园卡来宿舍楼门厅认领，我在这边留一晚。'
  },
  {
    id: 5, board: '校园吐槽', title: '食堂三楼新窗口的糖醋排骨建议谨慎', author: '干饭王', avatar: '🍜',
    time: '昨天', views: 260, likes: 64, comments: 52, tags: ['美食', '避雷'],
    body: '新窗口说糖醋排骨现炸现卤，实际是提前一天炸好复热，外层回软挂糖浆，酸味压过甜。分量倒是足，12 块一份配两素，就是别抱期待。'
  }
];

// 帖子评论：key 是帖子 id（这里的数字会当成字符串，用对象取值就行）
export const postComments = {
  1: [
    { id: 11, name: '摸鱼王', avatar: '🐟', time: '1 小时前', text: 'M1 续航确实顶，夏天上课一天回来还剩一半，出给学长不亏。' },
    { id: 12, name: '早八人', avatar: '⏰', time: '40 分钟前', text: '扩展坞能单出吗？我只要那个雷电口的小盒子。' }
  ],
  2: [
    { id: 21, name: '毕业季学姐', avatar: '🎒', time: '2 小时前', text: '三楼比四楼抢得凶，六点半基本就没窗边了，想稳就早点。' },
    { id: 22, name: '快递搭子', avatar: '📦', time: '1 小时前', text: '期末周要封楼的，去年试过，东西只能放门口柜子里。' }
  ]
};

// —— P5 聊天会话（消息页「去聊天 / 去处理」落到这里）——
export const chats = [
  { id: 'c1', name: '小林', avatar: '📚', sub: '考研英语全套资料 · ¥30', time: '刚刚', unread: 2 },
  { id: 'c2', name: '毕业季学姐', avatar: '🎒', sub: 'MacBook Air M1 · 4200', time: '10 分钟前', unread: 1 },
  { id: 'c3', name: '交易助手', avatar: '🛒', sub: '订单 SO2026092602', time: '2 天前', unread: 0 }
];

// self: true = 我发的（右侧气泡）；发消息就是往这个数组里 push 一条
export const chatRecords = {
  c1: [
    { id: 1, self: false, name: '小林', text: '你好，这套考研英语真题全套还在吗？', time: '10:12' },
    { id: 2, self: true, name: '我', text: '在的，去年上岸那版，笔记也一起带着', time: '10:14' },
    { id: 3, self: false, name: '小林', text: '那太好了，方便面交吗？我住 3 栋', time: '10:15' }
  ],
  c2: [
    { id: 4, self: true, name: '我', text: 'MacBook 还出，扩展坞一起走 4200', time: '09:40' },
    { id: 5, self: false, name: '毕业季学姐', text: '能小刀吗？明天下午我过去看', time: '10:05' }
  ],
  c3: [
    { id: 6, self: false, name: '交易助手', text: '订单 SO2026092602 已确认收货，评价可得 20 校园积分', time: '2 天前' }
  ]
};

// —— 个人主页（「查看主页」落到这里）：只存「帖子/商品列表里没有的档案信息」——
// 主页展示的帖子用 posts 按 author 过滤、商品用 latestGoods 按 id 过滤，避免同一份数据存两遍
export const users = {
  王同学: { avatar: '😀', dept: '计算机学院 · 大三', intro: '闲置都支持面交验货，爽快同学欢迎私聊。', goods: ['g1'], posts: [3] },
  小林: { avatar: '📚', dept: '外国语学院 · 大二', intro: '备考资料常年出，真题笔记可复印，不砍价太狠就行。', goods: ['g2'], posts: [] },
  毕业季学姐: { avatar: '🎒', dept: '传媒学院 · 研二', intro: '毕业清仓，一件不留，能送就送。', goods: [], posts: [1] },
  交易助手: { avatar: '🛒', dept: '校园集官方', intro: '交易链路自动通知：下单、发货、收货、评价提醒。', goods: [], posts: [] }
};
export const boards = [
  { key: 'all', name: '全部', desc: '全校动态', icon: 'Grid' },
  { key: 'secondhand', name: '二手闲置', desc: '毕业甩卖 / 好物转让', icon: 'Shop' },
  { key: 'help', name: '互助求助', desc: '问路 / 求推荐 / 找攻略', icon: 'ChatLineSquare' },
  { key: 'team', name: '组队拼单', desc: '拼车 / 拼饭 / 拼课', icon: 'UserFilled' },
  { key: 'lost', name: '失物招领', desc: '捡到 / 丢了啥', icon: 'MagicStick' },
  { key: 'campus', name: '校园吐槽', desc: '食堂 / 课表 / 生活', icon: 'Comment' }
];

// —— P5 消息中心 ——
// action = 按钮文案，to = 点它要去哪（每条消息都有对应的落地页，不是死文案）
export const messages = [
  { id: 1, type: 'trade', title: '有人想买你的「考研英语全套资料」', from: '小林', time: '刚刚', unread: true, action: '去聊天', to: '/chat/c1' },
  { id: 2, type: 'reply', title: '你发布的帖子有人回复了：毕业甩卖 MacBook', from: '毕业季学姐', time: '10 分钟前', unread: true, action: '查看', to: '/post/1' },
  { id: 3, type: 'system', title: '校园集 1.0 发布：闲置多图上传 + 实时消息', from: '系统', time: '1 小时前', unread: true, action: '详情', to: '/notice/n1' },
  { id: 4, type: 'follow', title: '王同学关注了你', from: '王同学', time: '昨天 21:40', unread: false, action: '查看主页', to: '/user/王同学' },
  { id: 5, type: 'trade', title: '订单已确认收货，评价可得校园积分', from: '交易助手', time: '2 天前', unread: false, action: '去评价', to: '/order/SO2026092602/review' }
];

export const messageTypes = [
  { key: 'all', name: '全部' },
  { key: 'reply', name: '@ 我的' },
  { key: 'trade', name: '交易消息' },
  { key: 'system', name: '系统通知' },
  { key: 'follow', name: '新关注' }
];

// —— P4 交易闭环：订单 ——
// cancel 是后端真会写进库的状态（/orders/:id/cancel），漏了它会让已取消订单的
// 状态标签渲染成空白、筛选也筛不出来
export const orderStatus = ['all', 'pending', 'paid', 'shipping', 'done', 'cancel'];

export const orderStatusMap = {
  pending: '待付款',
  paid: '待发货',
  shipping: '待收货',
  done: '已完成',
  cancel: '已取消'
};

export const orders = [
  // 「有人下单了你的」要落到一张真实订单上（seller 是我 → 我做发货处理），所以放最前面
  { id: 'SO2026100301', title: '九成新 iPad Air 4 64G', price: 1800, status: 'paid', seller: '我', time: '2026-10-03 09:10', sn: '待发货' },
  { id: 'SO2026100101', title: '二手山地车 27速', price: 420, status: 'shipping', seller: '阿泽', time: '2026-10-01 14:20', sn: '顺丰 SF338291' },
  { id: 'SO2026092807', title: '考研数学全套笔记', price: 45, status: 'paid', seller: '小林', time: '2026-09-28 20:05', sn: '待发货' },
  { id: 'SO2026092602', title: '宿舍小书架', price: 60, status: 'done', seller: '张叔', time: '2026-09-26 09:30', sn: '已完成' },
  { id: 'SO2026092205', title: '九成新蓝牙耳机', price: 120, status: 'pending', seller: '王同学', time: '2026-09-22 18:12', sn: '待付款' }
];

// 评价页的快捷标签 + 分项维度
export const reviewTags = ['描述相符', '服务态度好', '物流快', '包装仔细', '当面交易省心', '可小刀'];
export const reviewDims = [
  { key: 'desc', label: '描述相符' },
  { key: 'attitude', label: '服务态度' },
  { key: 'logistics', label: '物流速度' }
];

// —— P6 关于 / 路线图 ——
export const techStack = [
  { layer: '前端', items: ['Vue 3 + Vite', 'Element Plus', 'Pinia / Vue Router', 'qiankun 微前端'] },
  { layer: '后端', items: ['Node.js + Express', 'MySQL 8（主从结构）', 'MongoDB（富文本 / 消息）', 'Redis（会话 / 缓存）'] },
  { layer: '实时', items: ['Socket.IO（房间推送）', '未读计数走 Redis', '离线消息落 MongoDB'] },
  { layer: '部署', items: ['Docker 容器化', 'Nginx 反向代理', 'CI/CD 一键构建'] }
];

export const roadmap = [
  { phase: 'P1', name: '主站壳与导航', status: 'done', items: ['微应用注册表 + 通用宿主', '顶部导航 / 工具分类', '子应用接入（闲置市场）'] },
  { phase: 'P2', name: '后端基座 · 用户中心', status: 'doing', items: ['API Gateway / JWT 鉴权', '注册登录、个人资料', '我的发布 / 我的收藏'] },
  { phase: 'P3', name: '校园社区', status: 'todo', items: ['板块与发帖', '列表 / 详情 / 搜索', '子应用拆分'] },
  { phase: 'P4', name: '交易闭环', status: 'todo', items: ['下单 / 订单状态机', '支付沙箱', '评价与售后'] },
  { phase: 'P5', name: '实时通知', status: 'todo', items: ['Socket.IO 房间推送', '未读红点联动', '离线消息补偿'] },
  { phase: 'P6', name: '部署打磨', status: 'todo', items: ['Docker / Nginx', '首屏与分包优化', '埋点与文档'] }
];

// —— P6 生活便民（示例数据）——
// 这三项都要外部实时数据，接后端后把页面里的 mock 换成 request 即可：
//   GET /api/tool/express?no=xxx&com=sf    → 物流轨迹
//   GET /api/tool/oil                       → 全国油价
//   GET /api/tool/bus?city=北京&kw=1路      → 公交线路
// 下面的数据只是让页面能跑通看效果，不是真实行情，页面上已标「示例」。

export const expressCompanies = [
  { code: 'sf', name: '顺丰速运' },
  { code: 'yt', name: '圆通速递' },
  { code: 'zt', name: '中通快递' },
  { code: 'jd', name: '京东物流' },
  { code: 'ems', name: '中国邮政 EMS' }
];

export const expressRecords = [
  {
    no: 'SF1234567890', com: 'sf', name: '顺丰速运', status: '运输中',
    items: [
      { time: '2026-10-03 09:12', text: '快件已到达【武汉中转场】，正在发往【学校驿站】' },
      { time: '2026-10-03 06:40', text: '快件已在【武汉中转场】完成装车' },
      { time: '2026-10-02 21:05', text: '快件离开【深圳集散中心】，已发往武汉' },
      { time: '2026-10-02 14:30', text: '【深圳市南山区科技园】揽收成功' }
    ]
  },
  {
    no: 'YT7788990011', com: 'yt', name: '圆通速递', status: '已签收',
    items: [
      { time: '2026-10-01 17:20', text: '您的快件已签收，签收人：门卫室' },
      { time: '2026-10-01 10:02', text: '快递员【张师傅 138****2210】正在派送' },
      { time: '2026-10-01 08:15', text: '快件已到达【校内快递驿站】' },
      { time: '2026-09-30 19:44', text: '快件离开【杭州转运中心】' }
    ]
  }
];

export const oilPrices = {
  updatedAt: '示例数据 · 非实时行情',
  items: [
    { city: '北京', p92: '7.18', p95: '7.66', p98: '8.45', d0: '0', unit: '元/升' },
    { city: '上海', p92: '7.15', p95: '7.62', p98: '8.38', d0: '-0.05', unit: '元/升' },
    { city: '广东', p92: '7.22', p95: '7.74', p98: '8.52', d0: '0.06', unit: '元/升' },
    { city: '江苏', p92: '7.16', p95: '7.65', p98: '8.42', d0: '0', unit: '元/升' },
    { city: '四川', p92: '7.38', p95: '7.91', p98: '8.73', d0: '-0.08', unit: '元/升' }
  ]
};

export const busCities = ['北京', '上海', '广州', '武汉'];

export const busLines = [
  { city: '北京', name: '地铁 1 号线', from: '苹果园', to: '四惠东', stops: ['苹果园', '古城', '八角游乐园', '八宝山', '玉泉路', '五棵松', '公主坟', '军事博物馆', '复兴门', '西单', '天安门东', '王府井', '东单', '建国门', '永安里', '国贸', '大望路', '四惠', '四惠东'] },
  { city: '北京', name: '公交 332 路', from: '西苑', to: '香山', stops: ['西苑', '颐和园', '北宫门', '青龙桥', '香山'] },
  { city: '上海', name: '地铁 2 号线', from: '徐泾东', to: '浦东国际机场', stops: ['徐泾东', '虹桥火车站', '虹桥2号航站楼', '淞虹路', '中山公园', '静安寺', '南京西路', '人民广场', '南京东路', '陆家嘴', '东昌路', '世纪大道', '上海科技馆', '世纪公园', '龙阳路', '张江高科', '金科路', '广兰路', '唐镇', '创新中路', '浦东国际机场'] },
  { city: '广州', name: '地铁 3 号线', from: '天河客运站', to: '番禺广场', stops: ['天河客运站', '林和西', '广州东站', '体育西路', '珠江新城', '猎德', '岗顶', '石牌桥', '天河体育中心', '华师', '岗顶', '客村', '沥滘', '番禺广场'] },
  { city: '武汉', name: '地铁 2 号线', from: '金银潭', to: '常青花园', stops: ['金银潭', '常青花园', '范湖', '王家墩东', '青年路', '中山公园', '循礼门', '江汉路', '积玉桥', '螃蟹岬', '付家坡', '珞喻路', '光谷广场'] }
];
