// 接口防重（幂等）端到端验证。
// 跑法：node server/scripts/verify-idempotency.js  （需后端 :3201 + MySQL + Redis 在线）
//
// 验证：
//  1) 创建类接口重复提交只生效一次（发帖、下单）—— 产生 1 条数据
//  2) 并发重复提交被拦（返回 429 或回放首次结果）
//  3) 聊天（白名单外）相同内容重复发送正常保留两条 —— 不被误去重
//  4) 客户端 X-Idempotency-Key 重放：直接读 Redis 确认 done 缓存落在 Redis（证明走 Redis 分支）
const BASE = 'http://127.0.0.1:3201';
const { query, exec } = require('../db/mysql');
const redis = require('../db/redis');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const run = (async () => {
  const MARK = 'IDEMPOTENCY_TEST_' + Date.now().toString(36);
  let pass = 0, failc = 0;
  const ok = (c, m) => { if (c) { pass++; console.log('  ✅', m); } else { failc++; console.log('  ❌', m); } };

  async function http(method, path, body, token, headers) {
    const res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(headers || {}) },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  }
  async function regLogin(name) {
    const pwd = 'test123';
    await http('POST', '/api/user/register', { username: name, password: pwd, school: 'test' });
    const r = await http('POST', '/api/user/login', { username: name, password: pwd });
    return r.data.data.token;
  }
  async function uid(token) {
    const r = await http('GET', '/api/user/me', null, token);
    return r.data.data.id;
  }

  // 等 Redis 连接就绪（最多 2s）
  let waited = 0;
  while (!redis.isAvailable() && waited < 2000) { await sleep(100); waited += 100; }
  console.log('\n[0] Redis 可用状态:', redis.isAvailable() ? 'ONLINE（走 Redis 分支）' : 'OFFLINE（降级内存）');

  console.log('\n[1] 发帖重复提交（创建类，应只产生 1 条）');
  const ta = await regLogin(MARK + '_A');
  const before = (await query('SELECT COUNT(*) c FROM posts WHERE author_id = ?', [await uid(ta)])).pop().c;
  const create = () => http('POST', '/api/posts?school=test', { board: 'general', title: MARK + ' 帖子', body: '内容相同' }, ta);
  const [r1, r2] = await Promise.all([create(), create()]);
  const after = (await query('SELECT COUNT(*) c FROM posts WHERE author_id = ?', [await uid(ta)])).pop().c;
  ok(after - before === 1, `发帖重复提交后新增 ${after - before} 条（期望 1）`);
  ok(
    r1.status === 429 || r2.status === 429 || (r1.data && r1.data.code === 0 && r2.data && r2.data.code === 0),
    `至少一条被去重（r1=${r1.status} r2=${r2.status}）`
  );

  console.log('\n[2] 下单重复提交（创建类，应只产生 1 单）');
  const tb = await regLogin(MARK + '_B');
  const g = await http('POST', '/api/goods?school=test', { title: MARK + ' 商品', cat: 'other', price: 10, desc: 'x' }, tb);
  const goodsId = g.data.data.id;
  const oBefore = (await query('SELECT COUNT(*) c FROM orders WHERE goods_id = ?', [goodsId])).pop().c;
  const mkOrder = () => http('POST', '/api/orders', { goodsId }, ta);
  const [o1, o2] = await Promise.all([mkOrder(), mkOrder()]);
  const oAfter = (await query('SELECT COUNT(*) c FROM orders WHERE goods_id = ?', [goodsId])).pop().c;
  ok(oAfter - oBefore === 1, `下单重复提交后新增 ${oAfter - oBefore} 单（期望 1）`);

  console.log('\n[3] 聊天重复发送（白名单外，应保留 2 条）');
  const bcode = (await http('GET', '/api/user/me', null, tb)).data.data.code;
  await http('POST', '/api/friends', { code: bcode }, ta);
  const reqs = (await http('GET', '/api/friends/requests', null, tb)).data.data.incoming;
  const pendingId = reqs[0] && reqs[0].id;
  ok(!!pendingId, 'B 收到 A 的好友申请');
  if (pendingId) await http('POST', `/api/friends/requests/${pendingId}/accept`, {}, tb);
  const conv = (await http('POST', `/api/chats/with/${bcode}`, {}, ta)).data.data.convId;
  const mBefore = (await query('SELECT COUNT(*) c FROM chat_messages WHERE conv_id = ?', [conv])).pop().c;
  const send = () => http('POST', `/api/chats/${conv}/messages`, { text: MARK + ' 相同消息' }, ta);
  const [m1, m2] = await Promise.all([send(), send()]);
  const mAfter = (await query('SELECT COUNT(*) c FROM chat_messages WHERE conv_id = ?', [conv])).pop().c;
  ok(mAfter - mBefore === 2, `聊天相同内容发送后新增 ${mAfter - mBefore} 条（期望 2，不被误去重）`);

  console.log('\n[4] Redis 证据：X-Idempotency-Key 回放（done 缓存落在 Redis）');
  const key = 'verify-' + MARK;
  const pBefore = (await query('SELECT COUNT(*) c FROM posts WHERE author_id = ?', [await uid(ta)])).pop().c;
  await http('POST', '/api/posts?school=test', { board: 'general', title: MARK + ' 幂等键帖', body: 'k' }, ta, { 'x-idempotency-key': key });
  // 首次成功后，done 缓存应落在 Redis（key 形如 k:<clientKey>:done，TTL 5s）
  const cached = redis.isAvailable() ? await redis.get('k:' + key + ':done') : null;
  ok(!!cached, '首次请求后 Redis 写入 done 缓存（k:' + key + ':done 存在）');
  // 同幂等键重放：直接回放首次结果，不再落库
  const f2 = await http('POST', '/api/posts?school=test', { board: 'general', title: MARK + ' 幂等键帖', body: 'k' }, ta, { 'x-idempotency-key': key });
  const pAfter = (await query('SELECT COUNT(*) c FROM posts WHERE author_id = ?', [await uid(ta)])).pop().c;
  ok(pAfter - pBefore === 1, `同幂等键重放后新增 ${pAfter - pBefore} 条（期望 1）`);
  ok(f2.data && f2.data.code === 0, '重放请求返回成功结果（幂等回放）');

  console.log(`\n结果：通过 ${pass} / 失败 ${failc}`);
  await cleanup(MARK);
  process.exit(failc ? 1 : 0);

  async function cleanup(mark) {
    try {
      await exec("DELETE p FROM posts p JOIN users u ON u.id=p.author_id WHERE u.username LIKE ?", [mark + '%']);
      await exec("DELETE g FROM goods g JOIN users u ON u.id=g.owner_id WHERE u.username LIKE ?", [mark + '%']);
      await exec("DELETE FROM orders WHERE title LIKE ?", [mark + '%']);
      await exec("DELETE FROM chat_messages WHERE text LIKE ?", [mark + '%']);
      await exec("DELETE c FROM conversations c JOIN chat_messages m ON m.conv_id=c.id WHERE m.text LIKE ?", [mark + '%']);
      await exec("DELETE f FROM friends f JOIN users u ON u.id=f.user_id WHERE u.username LIKE ?", [mark + '%']);
      await exec("DELETE FROM users WHERE username LIKE ?", [mark + '%']);
      console.log('（测试数据已清理）');
    } catch (e) { console.warn('清理失败（可忽略）：', e.message); }
  }
})();
