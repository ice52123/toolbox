// MySQL 版全接口自测：逐条打接口，直连库造测试数据（消息/公告/订单推进）。
// 用法：在 server/ 目录下 node scripts/smoke-test.js
const http = require('http');
const bcrypt = require('bcryptjs');
const { query, exec } = require('../db/mysql');

const BASE = 'http://127.0.0.1:3201';
const SCHOOL = 'sch001'; // 北京大学
let TOKEN = '';
let pass = 0, fail = 0;
const fails = [];

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const u = new URL(BASE + path);
    const opt = {
      method,
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) opt.headers['Authorization'] = 'Bearer ' + token;
    const r = http.request(opt, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        let json;
        try { json = JSON.parse(buf); } catch { json = { raw: buf }; }
        resolve({ status: res.statusCode, json });
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

function check(name, cond, detail) {
  if (cond) { pass++; console.log('  ✅', name); }
  else { fail++; fails.push(name + ' -> ' + JSON.stringify(detail)); console.log('  ❌', name, JSON.stringify(detail)); }
}

async function main() {
  console.log('\n=== 1. 基础 / 学校 ===');
  let r = await req('GET', '/api/health');
  check('health=0', r.json.code === 0, r.json);
  r = await req('GET', '/api/schools?province=北京');
  check('schools 北京>=1', Array.isArray(r.json.data) && r.json.data.length >= 1, r.json);
  r = await req('GET', '/api/schools?q=华南');
  check('schools 搜索(华南师范大学/理工在广东)', Array.isArray(r.json.data), r.json);

  console.log('\n=== 2. 登录拿 token ===');
  r = await req('POST', `/api/user/quick-login?school=${SCHOOL}`, { phone: '13800138000' });
  check('quick-login=0', r.json.code === 0 && r.json.data.token, r.json);
  TOKEN = r.json.data.token;
  const MYNAME = r.json.data.username; // 真实用户名（手机号后四位），profile 测试用它
  r = await req('GET', '/api/user/me', null, TOKEN);
  check('user/me 返回 school', r.json.code === 0 && r.json.data, r.json);

  console.log('\n=== 3. 首页 / 公告 / 社区枚举 ===');
  r = await req('GET', `/api/home/stats?school=${SCHOOL}`);
  check('home/stats', r.json.code === 0 && typeof r.json.data.posts === 'number', r.json);
  // 造一条全站公告
  await exec("INSERT INTO notices (tag, title, content, school) VALUES ('活动', '迎新公告', '欢迎新同学', NULL)");
  const [[ntc]] = [await query('SELECT id FROM notices ORDER BY id DESC LIMIT 1')];
  r = await req('GET', `/api/home/notices?school=${SCHOOL}`);
  check('notices 列表含全站公告', r.json.code === 0 && r.json.data.length >= 1, r.json);
  r = await req('GET', `/api/home/notices/${ntc.id}`);
  check('notice 详情', r.json.code === 0 && r.json.data.id == ntc.id, r.json);
  r = await req('GET', '/api/community/boards');
  check('community/boards', r.json.code === 0 && r.json.data.length >= 1, r.json);

  console.log('\n=== 4. 帖子 CRUD + 点赞/收藏/评论 ===');
  r = await req('POST', `/api/posts?school=${SCHOOL}`, { title: '二手教材出', body: '九成新', tags: ['教材'] }, TOKEN);
  check('POST /posts', r.json.code === 0 && r.json.data.id, r.json);
  const postId = r.json.data.id;
  r = await req('GET', `/api/posts?school=${SCHOOL}&q=教材`);
  check('posts 列表可搜', r.json.code === 0 && r.json.data.list.length >= 1, r.json);
  r = await req('GET', `/api/posts/${postId}`);
  check('posts 详情 views+1', r.json.code === 0 && r.json.data.views >= 1, r.json);
  r = await req('GET', `/api/posts/hot?school=${SCHOOL}`);
  check('posts/hot', r.json.code === 0 && Array.isArray(r.json.data), r.json);
  r = await req('POST', `/api/posts/${postId}/like`, {}, TOKEN);
  check('like liked=true', r.json.code === 0 && r.json.data.liked === true, r.json);
  r = await req('POST', `/api/posts/${postId}/collect`, {}, TOKEN);
  check('collect', r.json.code === 0 && r.json.data.collected === true, r.json);
  r = await req('POST', `/api/posts/${postId}/comments`, { text: '顶' }, TOKEN);
  check('comment 顶层', r.json.code === 0, r.json);
  const [[cm]] = [await query('SELECT id FROM post_comments WHERE post_id = ? ORDER BY id DESC LIMIT 1', [postId])];
  r = await req('POST', `/api/posts/${postId}/comments`, { text: '回复', parentId: cm.id }, TOKEN);
  check('comment 二级回复', r.json.code === 0, r.json);
  r = await req('GET', `/api/posts/${postId}/comments`);
  check('comments 树(含replies)', r.json.code === 0 && r.json.data[0] && r.json.data[0].replies.length >= 1, r.json);
  r = await req('GET', `/api/users/${MYNAME}/profile`);
  check('profile 含帖子', r.json.code === 0 && Array.isArray(r.json.data.posts), r.json);

  console.log('\n=== 5. 闲置市场 ===');
  r = await req('POST', `/api/goods?school=${SCHOOL}`, { title: '自行车', cat: 'other', price: 99, desc: '好车', images: ['/files/a.png'] }, TOKEN);
  check('POST /goods', r.json.code === 0 && r.json.data.id, r.json);
  const goodsId = r.json.data.id;
  r = await req('GET', `/api/goods?school=${SCHOOL}&kw=自行车`);
  check('goods 列表可搜', r.json.code === 0 && r.json.data.list.length >= 1, r.json);
  r = await req('GET', `/api/goods/${goodsId}`);
  check('goods 详情 images 解析', r.json.code === 0 && Array.isArray(r.json.data.images), r.json);
  r = await req('POST', `/api/goods/${goodsId}/fav`, {}, TOKEN);
  check('goods fav', r.json.code === 0 && r.json.data.faved === true, r.json);
  r = await req('GET', '/api/user/me/favorites', null, TOKEN);
  check('我的收藏', r.json.code === 0 && r.json.data.length >= 1, r.json);
  r = await req('PUT', `/api/goods/${goodsId}`, { price: 88 }, TOKEN);
  check('goods 编辑', r.json.code === 0, r.json);
  r = await req('DELETE', `/api/goods/${goodsId}`, null, TOKEN);
  check('goods 删除(owner)', r.json.code === 0, r.json);

  console.log('\n=== 6. 订单状态机 ===');
  // 重新发一个商品给其他人当卖家（每轮唯一名，避免重复跑冲突）
  const SNAME = 'seller_' + Date.now();
  await exec("INSERT INTO users (username, password, school) VALUES (?, ?, ?)", [SNAME, bcrypt.hashSync('x12345', 10), SCHOOL]);
  const [[seller]] = [await query('SELECT id FROM users WHERE username = ?', [SNAME])];
  const lr = await req('POST', '/api/user/login', { username: SNAME, password: 'x12345' });
  const SELLER_TOKEN = lr.json.data.token;
  const [gr] = [await exec('INSERT INTO goods (title, cat, price, `desc`, images, owner_id, owner_name, school) VALUES (?,?,?,?,?,?,?,?)',
    ['测试品', 'other', 50, 'x', '[]', seller.id, SNAME, SCHOOL])];
  r = await req('POST', '/api/orders', { goodsId: gr.insertId }, TOKEN);
  check('POST /orders', r.json.code === 0 && r.json.data.id, r.json);
  const orderId = r.json.data.id;
  r = await req('GET', '/api/orders', null, TOKEN);
  check('orders 列表', r.json.code === 0 && r.json.data.length >= 1, r.json);
  r = await req('GET', `/api/orders/${orderId}`, null, TOKEN);
  check('orders 详情含 logs', r.json.code === 0 && Array.isArray(r.json.data.logs), r.json);
  // 状态机：pending 不能直接发货
  r = await req('POST', `/api/orders/${orderId}/ship`, { sn: 'SF123' }, TOKEN);
  check('ship 在 pending 被拒', r.json.code !== 0, r.json);
  // cancel（pending 合法）
  r = await req('POST', `/api/orders/${orderId}/cancel`, {}, TOKEN);
  check('cancel pending', r.json.code === 0, r.json);
  // 完整链路：新建单 → 直连置 paid → ship → receive → review
  const [gr2] = [await exec('INSERT INTO goods (title, cat, price, `desc`, images, owner_id, owner_name, school) VALUES (?,?,?,?,?,?,?,?)',
    ['链路品', 'other', 60, 'x', '[]', seller.id, SNAME, SCHOOL])];
  r = await req('POST', '/api/orders', { goodsId: gr2.insertId }, TOKEN);
  const o2 = r.json.data.id;
  await exec("UPDATE orders SET status='paid' WHERE id=?", [o2]);
  r = await req('POST', `/api/orders/${o2}/ship`, { sn: 'SF999' }, SELLER_TOKEN);
  check('ship(paid→shipping)', r.json.code === 0, r.json);
  r = await req('POST', `/api/orders/${o2}/receive`, {}, TOKEN);
  check('receive(shipping→done)', r.json.code === 0, r.json);
  r = await req('GET', `/api/orders/${o2}/review-form`, null, TOKEN);
  check('review-form(done)', r.json.code === 0 && r.json.data.dims.length === 3, r.json);
  r = await req('POST', `/api/orders/${o2}/review`, { ratings: { desc: 5, attitude: 5, logistics: 4 }, tags: ['发货很快'], text: '好' }, TOKEN);
  check('review 提交', r.json.code === 0, r.json);

  console.log('\n=== 7. 消息 / 聊天 ===');
  await exec("INSERT INTO messages (user_id, type, title, content, from_user) VALUES (?, 'system', '系统通知', '欢迎', '系统')", [r.json ? 0 : 0]);
  const [[me]] = [await query('SELECT id FROM users WHERE phone = ?', ['13800138000'])];
  await exec("UPDATE messages SET user_id = ? WHERE type='system' AND from_user='系统' ORDER BY id DESC LIMIT 1", [me.id]);
  r = await req('GET', '/api/messages', null, TOKEN);
  check('messages 列表', r.json.code === 0 && r.json.data.length >= 1, r.json);
  const [[msg]] = [await query('SELECT id FROM messages WHERE user_id = ? ORDER BY id DESC LIMIT 1', [me.id])];
  r = await req('POST', `/api/messages/${msg.id}/read`, {}, TOKEN);
  check('message read', r.json.code === 0, r.json);
  r = await req('GET', '/api/messages/unread-count', null, TOKEN);
  check('unread-count', r.json.code === 0 && typeof r.json.data.count === 'number', r.json);
  // 聊天：自动建会话
  r = await req('POST', '/api/chats/0/messages', { text: '你好', name: '小喵' }, TOKEN);
  check('chat 发消息自动建会话', r.json.code === 0 && r.json.data.convId, r.json);
  const convId = r.json.data.convId;
  r = await req('GET', '/api/chats', null, TOKEN);
  check('chats 列表', r.json.code === 0 && r.json.data.length >= 1, r.json);
  r = await req('GET', `/api/chats/${convId}/messages`, null, TOKEN);
  check('chat 记录', r.json.code === 0 && r.json.data.list.length >= 1, r.json);

  console.log('\n=== 8. 工具(既有) ===');
  r = await req('POST', '/api/tool/history', { toolId: 'json', toolName: 'JSON' }, TOKEN);
  check('tool/history', r.json.code === 0, r.json);
  r = await req('GET', '/api/tool/rank');
  check('tool/rank', r.json.code === 0 && Array.isArray(r.json.data), r.json);

  console.log(`\n==== 结果：通过 ${pass} / 失败 ${fail} ====`);
  if (fail) { console.log('失败项：\n' + fails.join('\n')); process.exit(1); }
  process.exit(0);
}

main().catch((e) => { console.error('测试异常：', e); process.exit(2); });
