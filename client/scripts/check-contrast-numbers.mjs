/**
 * 明暗主题下关键前景/底色配对的 WCAG 对比度实测
 *
 * 和 audit-contrast.mjs 的分工：
 *   audit-contrast.mjs —— 静态扫「哪里写了死色」（可疑模式）
 *   本脚本             —— 把改过的每对组合按 WCAG 2.1 相对亮度算实际比值（糊不糊看数字）
 *
 * 取值不是写死的，而是从源码里解析：
 *   idle-market/src/styles.css     的 :root / html.dark
 *   client/src/styles/variables.less 的 :root / html.dark
 * 所以改了颜色本脚本自动跟着变，不会算出过期结果。
 *
 * 底按「主题最不利情况」取（最浅的浅底 / 最深的深底）。
 * 用法：cd client && node scripts/check-contrast-numbers.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const IM_ROOT = path.resolve('../idle-market/src/styles.css');
const TB_ROOT = path.resolve('../client/src/styles/variables.less');
if (!fs.existsSync(IM_ROOT)) throw new Error('找不到 idle-market/src/styles.css，请在 client/ 目录下运行');

/* ---------- 主题块解析：:root{...} / html.dark{...} ---------- */
function themeDecls(file) {
  // 先剥注释：注释里含「2.46:1」这类半角冒号，会被当成声明切错 key
  const css = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const grab = (re) => {
    const m = css.match(re);
    const body = m ? m[1] : '';
    const out = {};
    // 必须 trim：源码里行的缩进会让 key 变成 "  --im-fg"，取不到 --im-fg
    for (const s of body.split(';')) {
      const i = s.indexOf(':');
      if (i < 0) continue;
      const k = s.slice(0, i).trim();
      const v = s.slice(i + 1).trim();
      if (k) out[k] = v;
    }
    return out;
  };
  // 注意：带 /g 时 String.match 只返回全量匹配串、拿不到分组，这里不能用 /g
  const light = grab(/:root\s*\{([^}]*)\}/);
  const dark = grab(/html\.dark\s*\{([^}]*)\}/);
  return { light, dark };
}
const im = themeDecls(IM_ROOT);
const tb = themeDecls(TB_ROOT);

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.replace('#', '').slice(i - 1, i + 1), 16));
const rgbArr = (s) => (s.startsWith('#') ? hex(s) : s.match(/[\d.]+/g).slice(0, 3).map(Number));
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const over = (top, alpha, bottom) => top.map((c, i) => c * alpha + bottom[i] * (1 - alpha));
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

// 主题 token（#hex 或 rgba()）→ 不透明实色（叠到页面底上）
const solid = (v, page) => {
  if (v.startsWith('#')) return hex(v);
  const nums = v.match(/[\d.]+/g) || [];
  const c = nums.slice(0, 3).map(Number);
  const a = nums.length > 3 ? Number(nums[3]) : 1;
  return a < 1 ? over(c, a, page) : c;
};

// 子应用 / 主站页面底（最不利取值）
const IM_PAGE_L = hex('#f6f4ff'), IM_PAGE_D = hex('#211c38');
const TB_PAGE_L = hex('#ffffff'), TB_PAGE_D = hex('#14172a');

const rows = [];
const add = (name, fg, bg, big = false) =>
  rows.push({ name, fg, bg, r: ratio(fg, bg), need: big ? 3 : 4.5 });

/* ---------------- 子应用 idle-market ---------------- */
const imSurfL = solid(im.light['--im-surface'], IM_PAGE_L);
const imSurfD = solid(im.dark['--im-surface'], IM_PAGE_D);
const imBarL = solid(im.light['--im-bar-bg'], IM_PAGE_L);
const imBarD = solid(im.dark['--im-bar-bg'], IM_PAGE_D);

const imCases = [
  ['正文 --im-fg', im.light['--im-fg'], im.dark['--im-fg']],
  ['次要 --im-fg-soft', im.light['--im-fg-soft'], im.dark['--im-fg-soft']],
  ['弱化 --im-fg-mute', im.light['--im-fg-mute'], im.dark['--im-fg-mute']],
  ['价格/高亮 --im-brand', im.light['--im-brand'], im.dark['--im-brand']],
  ['必填星号 --im-danger', im.light['--im-danger'], im.dark['--im-danger']],
];
for (const [label, lv, dv] of imCases) {
  add(`[亮] ${label} / 卡片面层`, rgbArr(lv), imSurfL);
  add(`[暗] ${label} / 卡片面层`, solid(dv, IM_PAGE_D), imSurfD);
}
add('[亮] 顶栏文字 / 顶栏面层', rgbArr(im.light['--im-fg']), imBarL, true);
add('[暗] 顶栏文字 / 顶栏面层', rgbArr(im.dark['--im-fg']), imBarD, true);

/* ---------------- 主站 client ---------------- */
const tbCardL = solid(tb.light['--tb-card'], TB_PAGE_L);
const tbCardD = solid(tb.dark['--tb-card'], TB_PAGE_D);
const tbBarL = solid(tb.light['--tb-bar'], TB_PAGE_L);
const tbBarD = solid(tb.dark['--tb-bar'], TB_PAGE_D);
const tbSurfL = solid(tb.light['--tb-surface'], TB_PAGE_L);
const tbSurfD = solid(tb.dark['--tb-surface'], TB_PAGE_D);

for (const [label, lv, dv] of [
  ['正文 --tb-text', tb.light['--tb-text'], tb.dark['--tb-text']],
  ['次要 --tb-sub', tb.light['--tb-sub'], tb.dark['--tb-sub']],
  ['危险 --tb-danger', tb.light['--tb-danger'], tb.dark['--tb-danger']],
]) {
  add(`[亮] ${label} / 卡片`, rgbArr(lv), tbCardL);
  add(`[暗] ${label} / 卡片`, rgbArr(dv), tbCardD);
}
add('[亮] 次要 --tb-sub / 搜索框 --tb-surface', rgbArr(tb.light['--tb-sub']), tbSurfL);
add('[暗] 次要 --tb-sub / 搜索框 --tb-surface', rgbArr(tb.dark['--tb-sub']), tbSurfD);
add('[亮] 次要 --tb-sub / 移动端底栏 --tb-bar', rgbArr(tb.light['--tb-sub']), tbBarL);
add('[暗] 次要 --tb-sub / 移动端底栏 --tb-bar', rgbArr(tb.dark['--tb-sub']), tbBarD);

const pad = (s, n) => String(s).padEnd(n);
console.log('对比度实测（4.5:1 正文 / 3:1 大字，低于即糊，取值实时解析自源码）\n');
for (const r of rows) {
  console.log(`${r.r >= r.need ? '✓' : '✗'} ${pad(`${r.r.toFixed(2)}:1`, 10)} 需≥${r.need}  ${pad(r.name, 42)}`);
}
const bad = rows.filter((r) => r.r < r.need);
console.log(`\n合计 ${rows.length} 项，不达标 ${bad.length} 项`);
bad.forEach((r) => console.log(`  ✗ ${r.name} → ${r.r.toFixed(2)}:1（需 ${r.need}）`));
