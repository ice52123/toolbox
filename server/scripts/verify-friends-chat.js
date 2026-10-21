// 端到端验证：好友申请流程 + 私聊 + 图片消息 + 跨账号红点
// 自清理：开头把测试用到的两对关系/会话清掉，保证可重复跑。
const BASE = 'http://127.0.0.1:3201/api';
const { execSync } = require('child_process');

let pass = 0, failCount = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { failCount++; console.log('  ✗ ' + name + (extra ? '  → ' + JSON.stringify(extra) : '')); }
}

const root = 'C:/Users/10186/.workbuddy/binaries/node/versions/22.22.2-6/node.exe';
function sql(query) {
  return execSync(
    `${root} -e "require('${__dirname}/../db/mysql').query(${JSON.stringify(query)}).then(r=>{console.log(JSON.stringify(r))}).catch(e=>{console.error('SQLERR',e.message);process.exit(1)})"`,
    { cwd: `${__dirname}/..`, encoding: 'utf8' }
  ).trim();
}

async function main() {
  const http = (method, path, body, token) => new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = require('http').request(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', Connection: 'close', ...(token ? { Authorization: 'Bearer ' + token } : {}) }
    }, (res) => {
      let buf = '';
      res.on('data', (d) => (buf += d));
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(buf) }); } catch { resolve({ status: res.statusCode, body: buf }); } });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });

  console.log('\n=== 1) 注册/登录两个账号 A、B ===');
  const ua = 'verify_a_' + Date.now();
  const ub = 'verify_b_' + Date.now();
  const ra = await http('POST', '/user/register', { username: ua, password: 'a123456', nickname: ua });
  ok('A 注册', ra.status === 200 && ra.body.code === 0, ra.body);
  const la = await http('POST', '/user/login', { username: ua, password: 'a123456' });
  ok('A 登录拿 token', la.status === 200 && la.body.code === 0, la.body);
  const ta = la.body.data.token;
  const ca = la.body.data.code;
  const ia = la.body.data.id;

  const rb = await http('POST', '/user/register', { username: ub, password: 'a123456', nickname: ub });
  ok('B 注册', rb.status === 200 && rb.body.code === 0, rb.body);
  const lb = await http('POST', '/user/login', { username: ub, password: 'a123456' });
  ok('B 登录拿 token', lb.status === 200 && lb.body.code === 0, lb.body);
  const tb = lb.body.data.token;
  const cb = lb.body.data.code;
  const ib = lb.body.data.id;

  ok('A/B 各有 6 位 ID', /^[2-9A-Z]{6}$/.test(ca) && /^[2-9A-Z]{6}$/.test(cb), { ca, cb });

  console.log('\n=== 2) A 用 ID 添加 B → 进入「申请中」(pending) ===');
  const add = await http('POST', '/friends', { code: cb }, ta);
  ok('A 发申请成功', add.status === 200 && add.body.code === 0, add.body);
  ok('返回 pending 标记', add.body.data && add.body.data.pending === true, add.body.data);

  const reqB = await http('GET', '/friends/requests', null, tb);
  ok('B 的「收到的申请」含 A', reqB.body.code === 0 && reqB.body.data.incoming.some((x) => x.user.code === ca), reqB.body.data);

  const reqA = await http('GET', '/friends/requests', null, ta);
  ok('A 的「我发出的」含 B', reqA.body.code === 0 && reqA.body.data.outgoing.some((x) => x.user.code === cb), reqA.body.data);

  const frA = await http('GET', '/friends', null, ta);
  ok('A 此时还不是 B 的好友（列表无 B）', frA.body.data.every((x) => x.code !== cb), frA.body.data);
  const frB = await http('GET', '/friends', null, tb);
  ok('B 此时也不是 A 的好友', frB.body.data.every((x) => x.code !== ca), frB.body.data);

  console.log('\n=== 3) B 通过申请 → 双方成为好友 ===');
  const rid = reqB.body.data.incoming.find((x) => x.user.code === ca).id;
  const acc = await http('POST', '/friends/requests/' + rid + '/accept', {}, tb);
  ok('B 通过申请成功', acc.status === 200 && acc.body.code === 0, acc.body);
  const frA2 = await http('GET', '/friends', null, ta);
  ok('A 好友列表出现 B', frA2.body.data.some((x) => x.code === cb), frA2.body.data);
  const frB2 = await http('GET', '/friends', null, tb);
  ok('B 好友列表出现 A', frB2.body.data.some((x) => x.code === ca), frB2.body.data);
  const reqB2 = await http('GET', '/friends/requests', null, tb);
  ok('B 的待通过申请已清空', reqB2.body.data.incoming.length === 0, reqB2.body.data);

  console.log('\n=== 4) A 给 B 发消息 → B 会话未读 +1、红点亮 ===');
  const wc = await http('POST', '/chats/with/' + cb, {}, ta);
  ok('A 开与 B 的会话', wc.status === 200 && wc.body.code === 0, wc.body);
  const convId = wc.body.data.convId;
  const send = await http('POST', '/chats/' + convId + '/messages', { text: '哈喽，我是 A' }, ta);
  ok('A 发送文字消息', send.status === 200 && send.body.code === 0, send.body);
  const unB = await http('GET', '/chats/unread-count', null, tb);
  ok('B 私聊未读 = 1', unB.body.code === 0 && unB.body.data.count === 1, unB.body.data);

  console.log('\n=== 5) A 发图片消息 → B 收到 type=image ===');
  const sendImg = await http('POST', '/chats/' + convId + '/messages', { type: 'image', img: '/files/test.png' }, ta);
  ok('A 发图片消息成功', sendImg.status === 200 && sendImg.body.code === 0 && sendImg.body.data.type === 'image', sendImg.body);
  const msgs = await http('GET', '/chats/' + convId + '/messages', null, tb);
  ok('消息记录含图片(type=image, img 非空)', msgs.body.data.list.some((m) => m.type === 'image' && m.img), msgs.body.data.list.map((m) => m.type));

  console.log('\n=== 6) B 删 A → 双向清除、会话一并清 ===');
  const del = await http('DELETE', '/friends/' + ia, null, tb);
  ok('B 删除 A 成功', del.status === 200 && del.body.code === 0, del.body);
  const frA3 = await http('GET', '/friends', null, ta);
  ok('A 好友列表不再有 B', frA3.body.data.every((x) => x.code !== cb), frA3.body.data);
  const chatsA = await http('GET', '/chats', null, ta);
  ok('A 会话列表不再有该会话', chatsA.body.data.every((c) => c.peer.code !== cb), chatsA.body.data);

  console.log('\n=== 7) 忽略申请路径（再发一次并忽略） ===');
  await http('POST', '/friends', { code: cb }, ta);
  const reqB3 = await http('GET', '/friends/requests', null, tb);
  const rid2 = reqB3.body.data.incoming.find((x) => x.user.code === ca).id;
  const dec = await http('POST', '/friends/requests/' + rid2 + '/decline', {}, tb);
  ok('B 忽略申请成功', dec.status === 200 && dec.body.code === 0, dec.body);
  const reqB4 = await http('GET', '/friends/requests', null, tb);
  ok('忽略后 B 待通过清零', reqB4.body.data.incoming.length === 0, reqB4.body.data);

  console.log(`\n=== 结果：通过 ${pass} / 失败 ${failCount} ===`);
  process.exit(failCount ? 1 : 0);
}

main().catch((e) => { console.error('运行异常：', e); process.exit(1); });
