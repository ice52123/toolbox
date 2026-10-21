// 前端改版后补的自测：专测「闲置子应用 + 我的/他人主页」用到的那几个接口。
// 跑法（后端先起来）：node scripts/verify-idle-api.js
const http = require('http');

const BASE = 'http://127.0.0.1:3201';
const SCHOOL = 'sch001';

function req(method, path, { token, body, form } = {}) {
  return new Promise((resolve, reject) => {
    const headers = {};
    let payload;
    if (form) {
      // multipart 必须带 boundary，否则 multer 认不出文件字段
      headers['Content-Type'] = `multipart/form-data; boundary=${form.boundary}`;
      // Buffer.from 兜一层：确保写进 socket 的一定是 Buffer 而不是底层 ArrayBuffer
      payload = Buffer.from(form.buffer);
    } else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
    if (token) headers.Authorization = 'Bearer ' + token;
    const url = new URL(BASE + path);
    const r = http.request(
      { hostname: url.hostname, port: url.port, path: url.pathname + url.search, method, headers },
      (res) => {
        const bufs = [];
        res.on('data', (d) => bufs.push(d));
        res.on('end', () => resolve(JSON.parse(Buffer.concat(bufs).toString() || '{}')));
      }
    );
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

// 1x1 透明 PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

// multipart 交给浏览器同款 FormData / fetch 去拼，不手搓边界串
async function uploadRaw(token, buf) {
  const fd = new FormData();
  fd.append('file', new Blob([buf], { type: 'image/png' }), 't.png');
  const res = await fetch(`${BASE}/api/upload/raw?school=${SCHOOL}`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: fd
  });
  return res.json();
}

let pass = 0;
let fail = 0;
function check(name, cond, extra = '') {
  if (cond) {
    pass += 1;
    console.log('  ✅ ' + name);
  } else {
    fail += 1;
    console.log('  ❌ ' + name + (extra ? ' —— ' + extra : ''));
  }
}

(async () => {
  const phone = '139' + Date.now().toString().slice(-8);
  const login = await req('POST', `/api/user/quick-login?school=${SCHOOL}`, { body: { phone } });
  const token = login.data && login.data.token;
  const uid = login.data && login.data.id;
  check('登录拿 token', !!token, JSON.stringify(login));

  // 1. 原图直传（不依赖 sharp）
  const up = await uploadRaw(token, PNG);
  const url = up.data && up.data.url;
  check('POST /upload/raw 返回 /files/xxx', !!url && url.startsWith('/files/'), JSON.stringify(up));
  const fileOk = await new Promise((resolve) => {
    http.get(BASE + (url || '/files/__none__'), (res) => resolve(res.statusCode === 200));
  });
  check('静态能取到刚传的图', fileOk);

  // 2. 发布：place / cond / ways 三个新字段要能落库
  const created = await req('POST', `/api/goods?school=${SCHOOL}`, {
    token,
    body: {
      title: '前端接入验证品',
      cat: '数码',
      price: 66,
      desc: '自测用，描述不少于十个字符阿啊啊啊',
      images: [url],
      place: '校区3栋',
      cond: '九成新',
      ways: ['自提', '面交']
    }
  });
  const gid = created.data && created.data.id;
  check('POST /goods 发布成功', !!gid, JSON.stringify(created));

  const detail = await req('GET', `/api/goods/${gid}?school=${SCHOOL}`, { token });
  const d = detail.data || {};
  check('详情 place 落库', d.place === '校区3栋', JSON.stringify(d.place));
  check('详情 cond 落库', d.cond === '九成新', JSON.stringify(d.cond));
  check('详情 ways 解析成数组', Array.isArray(d.ways) && d.ways.join(',') === '自提,面交', JSON.stringify(d.ways));
  check('详情 images 解析成数组', Array.isArray(d.images) && d.images[0] === url, JSON.stringify(d.images));

  // 3. owner 过滤：「我的发布」/ 他人主页在售闲置
  const mine = await req('GET', `/api/goods?owner=${uid}&school=${SCHOOL}`, { token });
  check('GET /goods?owner= 能过滤', (mine.data?.list || []).some((g) => g.id === gid), JSON.stringify(mine.data?.total));

  // 4. 「我的」三个数据源都得通
  const fav = await req('GET', `/api/user/me/favorites?school=${SCHOOL}`, { token });
  check('GET /user/me/favorites', fav.code === 0, JSON.stringify(fav.message));
  const orders = await req('GET', `/api/orders?school=${SCHOOL}`, { token });
  check('GET /orders（我的订单）', orders.code === 0, JSON.stringify(orders.message));
  const unread = await req('GET', `/api/messages/unread-count?school=${SCHOOL}`, { token });
  check('GET /messages/unread-count', unread.code === 0 && unread.data?.count != null, JSON.stringify(unread.data));

  console.log(`\n==== 结果：通过 ${pass} / 失败 ${fail} ====`);
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error('测试异常：', e);
  process.exit(1);
});
