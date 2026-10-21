import http from 'http';
const SCHOOL = 'sch001';
const BASE = { host: '127.0.0.1', port: 3201 };
function req(method, path, { token, body, q } = {}) {
  return new Promise((res) => {
    let p = path;
    if (q) p += '?' + new URLSearchParams(q).toString();
    const data = body ? JSON.stringify(body) : null;
    const r = http.request({ ...BASE, path: p, method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) } }, (resp) => {
      let b = ''; resp.on('data', (d) => (b += d)); resp.on('end', () => { try { res(JSON.parse(b)); } catch { res({ _raw: b, _status: resp.statusCode }); } });
    });
    r.on('error', (e) => res({ _err: e.message }));
    if (data) r.write(data);
    r.end();
  });
}
const ok = (c) => /^[2-9A-Z]{6}$/.test(c);
(async () => {
  // 1) 新用户一键登录：看返回 code
  const phone = '139' + String(Date.now()).slice(-8);
  const lg = await req('POST', '/api/user/quick-login', { body: { phone }, q: { school: SCHOOL } });
  const code = lg.data?.code;
  console.log('[新用户 quick-login] code =', code, '| 6位字母数字?', ok(code));
  // 2) 凭 token 拉 /me
  const me = await req('GET', '/api/user/me', { token: lg.data?.token });
  const meCode = me.data?.code;
  console.log('[登录态 /me]      code =', meCode, '| 与登录一致?', meCode === code);
  // 3) 老用户（已存在的 phone，复用上面手机号再登一次）
  const lg2 = await req('POST', '/api/user/quick-login', { body: { phone }, q: { school: SCHOOL } });
  console.log('[老用户 quick-login] code =', lg2.data?.code, '| 稳定不变?', lg2.data?.code === code);
  // 4) 全库扫一眼：有无 code 为空 / 非 6 位 / 重复
  const { query, exec } = await import('../db/mysql.js').catch(() => ({}));
  if (query) {
    const bad = await query("SELECT COUNT(*) c FROM users WHERE code='' OR code IS NULL OR LENGTH(code)<>6");
    const dup = await query('SELECT code, COUNT(*) n FROM users GROUP BY code HAVING n>1');
    console.log('[存量校验] 异常(空/非6位)行数 =', bad[0]?.c, '| 重复 code 组数 =', dup.length);
  } else {
    console.log('[存量校验] 跳过(直接 import mysql 失败，可走 curl 单独查)');
  }
  console.log('结果：', code && ok(code) && meCode === code && lg2.data?.code === code ? 'PASS' : 'CHECK');
})();
