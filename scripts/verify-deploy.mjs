// 线上产物一致性校验 —— 比的是「URL 实际返回的文件」，不是本地源码。
//
// 背景：本地源码改完 → vite build 通过 → dev 编译 200，这套检查全绿，
// 但线上分享链接背后还是上一次的产物，用户看到的永远是旧画面。
// 本机截不了图，所以用「线上实际返回的文件 hash」当验收标准。
//
// 用法： node scripts/verify-deploy.mjs [线上根地址]
// 退出码： 0 = 全部对齐（线上即最新）；1 = 有项不一致（线上是旧构建）

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// 比对基准 = 真正会被上传的 staging 产物（由 scripts/sync-build.mjs 生成），
// 而不是 client/dist —— 后者可能被部署流程跳过或残留旧内容。
const CLIENT_DIST = path.join(ROOT, 'web', 'main');
const IDLE_DIST = path.join(ROOT, 'web', 'idle');

const BASE = (process.argv[2] || 'https://campus-toolbox-20868.app.workbuddy.host').replace(/\/$/, '');
const GET = async (u) => {
  const r = await fetch(u, { signal: AbortSignal.timeout(20000) });
  return r.text();
};

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
};

// 从 html 里抽出 /assets/xxx.css 和 /assets/xxx.js 的文件名（线上带 hash）
// 返回带 /assets/ 前缀的完整路径（拼 URL 时直接用，别再漏掉 assets 这一层）
const pick = (html, ext) => {
  // 注意：matchAll 必须配 /g，否则抛 "called with a non-global RegExp argument"
  const m = [...html.matchAll(new RegExp(`(/assets/[A-Za-z0-9._-]+${ext})`, 'g'))].map((x) => x[1]);
  return m[0] || '';
};
const base = (p) => p.slice(p.lastIndexOf('/') + 1); // 只比文件名，hash 是否一致看这个

const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');

const main = async () => {
  const cIdx = read(path.join(CLIENT_DIST, 'index.html'));
  const iIdx = read(path.join(IDLE_DIST, 'index.html'));
  if (!cIdx || !iIdx) {
    console.error('本地 dist 缺失：先分别跑 client / idle-market 的 vite build');
    process.exit(1);
  }

  // ---- 1. 主站入口产物 hash 对齐 ----
  try {
    const onlineIdx = await GET(`${BASE}/`);
    const want = base(pick(cIdx, '.js'));
    const got = base(pick(onlineIdx, '.js'));
    check('主站入口 JS 版本', !!want && want === got, `本地 ${want || '?'} vs 线上 ${got || '?'}`);
  } catch (e) {
    check('主站入口 JS 版本', false, `抓取失败: ${e.message}`);
  }

  // ---- 2. 子应用产物 hash 对齐（qiankun 从 /idle-app/ 拉）----
  let idleCssOnline = '';
  try {
    const onlineIdle = await GET(`${BASE}/idle-app/`);
    const want = base(pick(iIdx, '.js'));
    const got = base(pick(onlineIdle, '.js'));
    check('子应用入口 JS 版本', !!want && want === got, `本地 ${want || '?'} vs 线上 ${got || '?'}`);
    const cssPath = pick(onlineIdle, '.css');
    // 子应用 index.html 挂在 /idle-app/ 下，里面写的是 '/assets/xxx.css'（相对挂载点），
    // 拼 URL 时要补回 '/idle-app'，否则会打到主站的 /assets/ 上拿到 404
    if (cssPath) idleCssOnline = await GET(`${BASE}/idle-app${cssPath}`);
  } catch (e) {
    check('子应用入口 JS 版本', false, `抓取失败: ${e.message}`);
  }

  // ---- 3. 卡片真的走主题面层：.card 的 background 是 var(--im-surface) 而不是写死浅底 ----
  try {
    const cardRule = idleCssOnline.match(/[^{}]*\.card[^{}]*\{[^}]*\}/)?.[0] || '';
    const ok = /background:\s*var\(--im-surface\)/.test(cardRule);
    check('线上卡片走主题面层', ok, ok ? '.card background = var(--im-surface)' : cardRule.slice(0, 60) || '未找到 .card 规则');
  } catch (e) {
    check('线上卡片走主题面层', false, e.message);
  }

  // ---- 4. 深色面层 token 的实际数值必须是「低透明度白」（= 深底），浅色才是 .82 ----
  // 压缩后 CSS 里 Element Plus 和我们各有一段 html.dark{，只看第一段会误判，这里全局搜所有块
  try {
    // 压缩/未压缩的 CSS 里 "rgba(255, 255, 255, .82)" 逗号后有空格，
    // 先归一化再断言，免得正则被空格卡住
    const flat = idleCssOnline.replace(/,\s+/g, ',');
    const darkAll = [...flat.matchAll(/html\.dark\{[^}]*\}/g)].map((m) => m[0]).join('');
    const rootAll = [...flat.matchAll(/:root\{[^}]*\}/g)].map((m) => m[0]).join('');
    // 透明度写死数值：深色 .08（低透明度白 = 深底），浅色 .82（浅底）。
    // 之前写成 \.?0?8\) 只认一位小数，结果 .82 匹配不到、误报成旧构建。
    const darkOk = new RegExp(`--im-surface:\\s*rgba\\(\\s*255\\s*,\\s*255\\s*,\\s*255\\s*,\\s*\\.08\\)`).test(darkAll);
    const lightOk = new RegExp(`--im-surface:\\s*rgba\\(\\s*255\\s*,\\s*255\\s*,\\s*255\\s*,\\s*\\.82\\)`).test(rootAll);
    check('线上深色面层为深底', darkOk, darkOk ? 'html.dark --im-surface = rgba(255,255,255,.08)' : '深色面层不是低透明度白（旧构建或值被改坏）');
    check('线上浅色面层为浅底', lightOk, lightOk ? ':root --im-surface = rgba(255,255,255,.82)' : '未找到浅色面层 token');
  } catch (e) {
    check('线上深色面层为深底', false, e.message);
    check('线上浅色面层为浅底', false, e.message);
  }

  // ---- 5. 主站 CSS 带顶/底栏主题变量 --tb-bar ----
  try {
    const cPath = pick(cIdx, '.css');
    const css = cPath ? await GET(`${BASE}${cPath}`) : '';
    const hasVar = /--tb-bar\s*:/.test(css);
    const used = /background:var\(--tb-bar\)/.test(css);
    check('主站顶/底栏主题变量', hasVar && used, hasVar && used ? '--tb-bar 已定义并被引用' : `var=${hasVar} used=${used}`);
  } catch (e) {
    check('主站顶/底栏主题变量', false, e.message);
  }

  // ---- 输出 ----
  const pad = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s.padEnd(n));
  console.log(`\n线上产物校验：${BASE}\n${'-'.repeat(72)}`);
  for (const r of results) {
    console.log(`${r.ok ? '✅' : '❌'} ${pad(r.name, 26)} ${r.detail}`);
  }
  const bad = results.filter((r) => !r.ok).length;
  console.log(`${'-'.repeat(72)}`);
  if (bad) {
    console.log(`${bad} 项不一致 —— 线上还是旧构建，需要重新部署。\n`);
    process.exit(1);
  }
  console.log('全部对齐 —— 线上即最新构建。\n');
};

main();
