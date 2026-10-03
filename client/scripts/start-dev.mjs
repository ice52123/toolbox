/* 一键拉起本地三件套：主站 + 闲置市场子应用 + 后端。
   以前「页面打不开」多半只是子应用 dev 没跑（qiankun 拉不到 4200 就只剩一块灰底），
   这里把三个进程一起起、退出时一起收，日志带上前缀方便看出哪个挂了。

   用法：client 目录里 npm run dev:all
   单起某个：node scripts/start-dev.mjs client|market|server
   脱离父进程（后台常驻，关掉终端/助手会话也还在）：node scripts/start-dev.mjs --daemon
     日志落在项目根 .dev-logs/<name>.log，常驻模式不会随本脚本退出而结束。
*/
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const clientDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const rootDir = path.dirname(clientDir);
const node = process.execPath;

const all = [
  { name: 'client', dir: clientDir, cmd: node, args: ['node_modules/vite/bin/vite.js'], tip: '主站 http://localhost:5173' },
  { name: 'market', dir: path.join(rootDir, 'idle-market'), cmd: node, args: ['node_modules/vite/bin/vite.js'], tip: '闲置市场 http://127.0.0.1:4200' },
  { name: 'server', dir: path.join(rootDir, 'server'), cmd: node, args: ['app.js'], tip: '后端 http://127.0.0.1:3201' }
];

const args = process.argv.slice(2);
const daemon = args.includes('--daemon');
const only = args.find((a) => !a.startsWith('--'));
const targets = only ? all.filter((t) => t.name === only) : all;
if (!targets.length) {
  console.error(`未知目标：${only}（可选 ${all.map((t) => t.name).join(' | ')}）`);
  process.exit(1);
}
const logDir = path.join(rootDir, '.dev-logs');
if (daemon) fs.mkdirSync(logDir, { recursive: true });

const kids = [];
for (const t of targets) {
  if (!fs.existsSync(t.dir)) {
    console.warn(`⚠️  目录不存在：${t.dir}，跳过 ${t.name}`);
    continue;
  }
  // 常驻模式：子进程脱离本脚本，父进程一退它们照样跑（日志写文件，不占终端）
  const opts = daemon
    ? { cwd: t.dir, detached: true, stdio: ['ignore', fs.openSync(`${logDir}/${t.name}.log`, 'a'), fs.openSync(`${logDir}/${t.name}.log`, 'a')] }
    : { cwd: t.dir, stdio: ['ignore', 'pipe', 'pipe'] };
  const p = spawn(t.cmd, t.args, opts);
  kids.push(p);
  const tag = `[${t.name}] `;
  // 常驻模式下 stdio 指向日志文件，stdout/stderr 是 null，也没必要往终端转发
  if (!daemon) {
    const pipe = (stream) => {
      let buf = '';
      stream.setEncoding('utf8');
      stream.on('data', (chunk) => {
        buf += chunk;
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        console.log(lines.map((l) => tag + l).join('\n'));
      });
    };
    pipe(p.stdout);
    pipe(p.stderr);
  }
  p.on('exit', (code) => {
    console.log(`${tag}退出（code ${code}）${code === 0 ? '' : ' —— 看下上面的报错'}`);
    // 子进程都散了就自己也退，别把终端挂着
    setTimeout(() => {
      if (kids.every((k) => k.exitCode !== null)) process.exit(0);
    }, 300);
  });
  p.on('error', (e) => console.error(`${tag}启动失败：${e.message}`));
  if (daemon) {
    p.unref(); // 别让子进程吊住本脚本，父进程该退就退
    console.log(`${tag}已在后台常驻 → ${t.tip}\n   日志：.dev-logs/${t.name}.log`);
  } else if (t.tip) {
    console.log(`${tag}已启动 → ${t.tip}`);
  }
}

// 常驻模式不清理：子进程必须活过本脚本的退出
const cleanup = () => {
  if (daemon) return;
  for (const p of kids) {
    if (!p.killed) {
      try {
        p.kill();
      } catch {
        /* 已退 */
      }
    }
  }
};
if (daemon) {
  console.log('✅ 常驻模式：三个服务已脱离本窗口，关掉终端也还在。杀掉端口自己的进程即可停掉。');
  process.exit(0);
}
process.on('exit', cleanup);
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => {
  cleanup();
  process.exit(0);
});
