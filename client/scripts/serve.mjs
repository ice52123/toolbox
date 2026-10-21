/* 单端口静态服务：主站 SPA + 同源子应用目录 + 接口占位。
   公网部署时托管层只给一个端口，所以主站、闲置市场子应用必须挂在同一Origin下 ——
   跨域会让 qiankun 拉不到子应用、CORS 报错也是最难查的一类问题，同源从根上绕开。

   dist/          → 主站（qiankun 主应用）
   dist/idx/      → 闲置市场子应用构建产物，暴露在 /idle-app/ 下
   其余路径        → 回落到 index.html，前端 history 路由随便深链接

   用法：client 目录里 node scripts/serve.mjs（端口取 $PORT，默认 3000）
*/
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 按脚本自身位置定位 client/，不依赖 cwd —— 云端从仓库根目录起服务时才不会找错 dist
const clientDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const root = path.join(clientDir, 'dist');
const idleDir = path.join(root, 'idx');
const port = Number(process.env.PORT) || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function send(res, status, body, type = 'text/html; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);

  // 接口还没接云服务（数据层留给各页面自己填），给一句能看懂的回执，别让页面只吃一个 404
  if (url === '/api' || url.startsWith('/api/')) {
    return send(res, 501, JSON.stringify({ code: 1, message: '接口待接入云服务' }), MIME['.json']);
  }

  // 子应用目录：/idle-app/x.js → dist/idx/x.js
  let dir = root;
  if (url.startsWith('/idle-app')) {
    if (url === '/idle-app') return res.redirect('/idle-app/');
    if (url === '/idle-app/') {
      const f = path.join(idleDir, 'index.html');
      return fs.existsSync(f) ? send(res, 200, fs.readFileSync(f)) : send(res, 404, '子应用未构建');
    }
    dir = idleDir;
  }

  const target = path.join(dir, url.replace(/^\/idle-app/, ''));
  // 目录穿越兜底：解析后必须还在允许目录里
  if (!target.startsWith(dir)) return send(res, 403, 'Forbidden');

  const stat = fs.existsSync(target) && fs.statSync(target);
  if (stat && stat.isFile()) {
    return send(res, 200, fs.readFileSync(target), MIME[path.extname(target)] || 'application/octet-stream');
  }
  if (stat && stat.isDirectory()) {
    const f = path.join(target, 'index.html');
    return fs.existsSync(f) ? send(res, 200, fs.readFileSync(f)) : send(res, 404, 'Not Found');
  }

  // 前端 history 路由：点进来是 /tools/base64 这类，文件不存在就交回主应用去接
  const entry = path.join(dir, 'index.html');
  if (fs.existsSync(entry)) return send(res, 200, fs.readFileSync(entry));
  return send(res, 404, 'Not Found');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`serving ${root} on http://0.0.0.0:${port} (idle-app → ${idleDir})`);
});
