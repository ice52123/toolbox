// 同源托管：主站 client/dist 挂在 /，子应用 idle-market/dist 挂在 /idle-app/。
//
// 为什么需要它：qiankun 的 entry 是 '/idle-app/'(见 client/src/config/microApps.js)，
// 公网下子应用产物必须和主站同源，否则微前端拉不到子应用。
// 本地 dev 由 5173(主站) + 4200(子应用) 两个服务扮演这个角色，这里合并成一个端口给沙箱用。
//
// 沙箱只给一个 PORT，且必须绑 0.0.0.0。

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

// 产物来源只认 web/ 这一处（由 scripts/sync-build.mjs 从 dist 同步过来）。
// 别直接读 client/dist：部署流程可能跳过/残留旧 dist，
// 出现过「新产物已上传、但入口 index.html 还是上一版」的幽灵状态。
const CLIENT = path.join(ROOT, 'web', 'main');
const IDLE = path.join(ROOT, 'web', 'idle');
const staged = fs.existsSync(CLIENT);
if (!staged) console.warn('[ serve ] 警告：web/main 不存在，先跑 node scripts/sync-build.mjs');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const exists = (p) => {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
};

const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let base = CLIENT;
  let rest = url;

  if (url === '/idle-app/' || url.startsWith('/idle-app/')) {
    base = IDLE;
    rest = url.slice('/idle-app'.length) || '/';
  }

  const notFound = () => {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  };
  const send = (file) => {
    const name = path.basename(file);
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      // 带 hash 的产物可以长缓存，index.html 必须 no-cache，否则线上会一直拿旧入口
      'Cache-Control': name.startsWith('index-') ? 'no-cache' : 'public, max-age=31536000, immutable'
    });
    res.end(fs.readFileSync(file));
  };

  const file = path.join(base, rest);

  if (!file.startsWith(base)) return notFound();
  if (exists(file)) return send(file);

  // 文件或目录都不存在时：
  //  - 无扩展名 = 前端路由（/m/idle 之类）或目录（/idle-app/）→ 回退到该应用 index.html（qiankun entry 靠这个 200）
  //  - 带扩展名 = 真的资源路径 → 必须 404。
  //    否则拼错的子应用资源会被回退成主站 index.html，浏览器拿到 200 + HTML 当 CSS 解析，
  //    表现就是「样式没加载」的幽灵状态（这个坑真踩过）。
  if (path.extname(file) !== '') return notFound();
  const fallback = path.join(base, 'index.html');
  if (!exists(fallback)) return notFound();
  send(fallback);
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, '0.0.0.0', () => {
  console.log(`[ serve ] 主站 / -> web/main，子应用 /idle-app/ -> web/idle，port ${port}`);
});
