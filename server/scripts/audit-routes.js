// 前后端契约体检：把前端实际用到的每个路径对着后端打一次，
// 只要返回「接口不存在」就说明路由对不上（多半是少了一层挂载前缀）。
// 业务上的报错（比如无权查看、订单状态不对）反而是好事——说明路由真的存在。
// 跑法（后端先起来）：node scripts/audit-routes.js

const BASE = 'http://127.0.0.1:3201';
const SCHOOL = 'sch001';

function call(method, path, token) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    const body = method === 'GET' ? null : JSON.stringify({});
    const req = require('http').request(
      { host: '127.0.0.1', port: 3201, path, method, headers },
      (res) => {
        let buf = '';
        res.on('data', (d) => (buf += d));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, json: JSON.parse(buf || '{}') });
          } catch {
            resolve({ status: res.statusCode, json: {} });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

const q = (p) => p + (p.includes('?') ? '&' : '?') + 'school=' + SCHOOL;

(async () => {
  const loginA = await call('POST', q('/api/user/quick-login'), null).catch(() => null);
  // quick-login 需要 body，这里单独发一次
  function postJson(path, body, token) {
    return new Promise((resolve, reject) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = 'Bearer ' + token;
      const req = require('http').request(
        { host: '127.0.0.1', port: 3201, path, method: 'POST', headers },
        (res) => {
          let buf = '';
          res.on('data', (d) => (buf += d));
          res.on('end', () => resolve(JSON.parse(buf || '{}')));
        }
      );
      req.on('error', reject);
      req.write(JSON.stringify(body));
      req.end();
    });
  }

  const t = Date.now().toString().slice(-8);
  const A = await postJson(q('/api/user/quick-login'), { phone: '138' + t });
  const B = await postJson(q('/api/user/quick-login'), { phone: '137' + t });
  const tokenA = A.data.token;
  const tokenB = B.data.token;
  const uidA = A.data.id;

  // 先造出真实 id，才能探 /:id 类路径
  const post = await postJson(q('/api/posts'), { board: 'help', title: '体检帖子', body: '内容', tags: [] }, tokenA);
  const pid = post.data.id;
  const goods = await postJson(
    q('/api/goods'),
    { title: '体检商品', cat: '数码', price: 10, desc: '体检用描述十个字以上', images: [], place: 'A栋', cond: '九成新', ways: ['自提'] },
    tokenA
  );
  const gid = goods.data.id;
  // 自己不能买自己的：让 B 下单
  const order = await postJson(q('/api/orders'), { goodsId: gid }, tokenB);
  const oid = order.data.id;
  const chats = await call('GET', q('/api/chats'), tokenB);
  // /chats 直接返回数组；没会话也无妨——记录接口只是按 conv_id 查表，
  // 拿任意字符串当 id 都能验证「路由在不在」
  const cid = (chats.data || [])[0]?.id || 'audit-conv-1';
  const msgs = await call('GET', q('/api/messages'), tokenB);
  const mid = (msgs.data || [])[0]?.id || 1;
  const notice = await call('GET', q('/api/home/notices'));
  const nid = (notice.data || [])[0]?.id || 1;
  const nick = encodeURIComponent(A.data.username || 'abc');

  // [页面/模块, 方法, 路径]
  const cases = [
    ['SchoolSwitcher', 'GET', '/api/schools'],
    ['ui 未读数', 'GET', '/api/messages/unread-count'],
    ['Chat 会话列表', 'GET', '/api/chats'],
    ['Chat 消息记录', 'GET', `/api/chats/${cid}/messages`],
    ['Me / UserProfile', 'GET', '/api/user/me'],
    ['Me 收藏', 'GET', '/api/user/me/favorites'],
    ['Community 板块', 'GET', '/api/community/boards'],
    ['Community 帖子列表', 'GET', '/api/posts'],
    ['Home 热门', 'GET', '/api/home/posts/hot'],
    ['PostDetail 详情', 'GET', `/api/posts/${pid}`],
    ['PostDetail 评论', 'GET', `/api/posts/${pid}/comments`],
    ['Home 统计', 'GET', '/api/home/stats'],
    ['Home 公告', 'GET', '/api/home/notices'],
    ['Notice 详情', 'GET', `/api/home/notices/${nid}`],
    ['Home 最新闲置', 'GET', '/api/home/goods/latest'],
    ['Orders 列表', 'GET', '/api/orders'],
    ['OrderDetail 详情', 'GET', `/api/orders/${oid}`],
    ['OrderReview 表单', 'GET', `/api/orders/${oid}/review-form`],
    ['Message 列表', 'GET', '/api/messages'],
    ['Me/列表 闲置', 'GET', '/api/goods'],
    ['Me 我的发布', 'GET', `/api/goods?owner=${uidA}`],
    ['Detail 闲置详情', 'GET', `/api/goods/${gid}`],
    ['UserProfile 主页', 'GET', `/api/users/${nick}/profile`],
    ['Tool 历史', 'GET', '/api/tool/history'],
    ['Tool 排行', 'GET', '/api/tool/rank'],
    ['Community 收藏切换', 'POST', `/api/posts/${pid}/collect`],
    ['PostDetail 评论', 'POST', `/api/posts/${pid}/comments`],
    ['Messages 标已读', 'POST', `/api/messages/${mid}/read`],
    ['Detail 收藏', 'POST', `/api/goods/${gid}/fav`],
    ['Orders 取消', 'POST', `/api/orders/${oid}/cancel`],
    ['Orders 提醒发货', 'POST', `/api/orders/${oid}/remind`],
    ['Orders 确认收货', 'POST', `/api/orders/${oid}/receive`],
    ['OrderReview 提交', 'POST', `/api/orders/${oid}/review`],
    ['Chat 发消息', 'POST', `/api/chats/${cid}/messages`],
    ['Publish 发布闲置', 'POST', '/api/goods'],
    ['Community 发帖', 'POST', '/api/posts'],
    ['Orders 下单', 'POST', '/api/orders']
  ];

  let missing = 0;
  for (const [who, method, path] of cases) {
    const r = await call(method, q(path), tokenA);
    const gone = r.status === 404 && String(r.json.message || '').includes('接口不存在');
    if (gone) {
      missing += 1;
      console.log(`  ❌ ${who.padEnd(20, ' ')} ${method} ${path} —— 路由不存在`);
    } else {
      console.log(`  ✅ ${who.padEnd(20, ' ')} ${method} ${path}`);
    }
  }

  console.log(`\n==== 结果：探通 ${cases.length - missing} / 路由缺失 ${missing} ====`);
  process.exit(missing ? 1 : 0);
})().catch((e) => {
  console.error('体检异常：', e);
  process.exit(1);
});
