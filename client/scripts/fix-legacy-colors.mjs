/**
 * 一次性修补：把硬编码的「中间调 / 深色」文字色换成主题变量。
 *
 * 背景：variables.less 里明暗两套 --tb-* 是全站唯一真源，但工具页 / 社区页
 * 还留着一批写死的 slate 灰和深紫灰——
 *   · #94a3b8 之类的中段灰：白卡片上偏淡（2.6:1），深色卡片上又发灰
 *   · #4b4560 / #3c3752 这类深紫灰：深色主题下深底压深字，直接看不见
 * 统一换成 var(--tb-sub) / var(--tb-ok) / var(--tb-warn)，两套主题同时达标。
 *
 * 只动 `color:` 声明，不动 background / border / fill，避免误伤。
 * 用法：cd client && node scripts/fix-legacy-colors.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const MAP = [
  ['#94a3b8', 'var(--tb-sub)'],
  ['#cbd5e1', 'var(--tb-sub)'],
  ['#64748b', 'var(--tb-sub)'],
  ['#4b4560', 'var(--tb-sub)'],
  ['#3c3752', 'var(--tb-sub)'],
  ['#443d5e', 'var(--tb-sub)'],
  ['#46405e', 'var(--tb-sub)'],
  ['#16a34a', 'var(--tb-ok)'],
  ['#15803d', 'var(--tb-ok)'],
  ['#d97706', 'var(--tb-warn)'],
  ['#f59e0b', 'var(--tb-warn)'],
  ['#dc2626', 'var(--el-color-danger)'],
  ['#f43f5e', 'var(--tb-danger)'],
];

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(vue|less|css)$/.test(e.name)) files.push(p);
  }
})('src');

let changed = 0;
let hits = 0;
for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  let out = before;
  for (const [from, to] of MAP) {
    const re = new RegExp(`color:\\s*${from}\\b`, 'gi');
    out = out.replace(re, (m) => `color: ${to}`);
  }
  if (out !== before) {
    const n = (out.match(/var\(--tb-sub\)/g) || []).length + (out.match(/var\(--tb-ok\)/g) || []).length
      + (out.match(/var\(--tb-warn\)/g) || []).length + (out.match(/var\(--el-color-danger\)/g) || []).length;
    hits += n;
    changed++;
    console.log(`✅ ${file}  (${n} 处)`);
    fs.writeFileSync(file, out, 'utf8');
  }
}
console.log(`\n共改 ${changed} 个文件 / ${hits} 处`);
