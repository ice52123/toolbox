/**
 * 主站「所有页面」覆盖度 + 残留硬编码色检查
 *
 * 两件事：
 *   1. 列出 client/src 下全部 .vue 页面，逐个找里面残留的写死色值，
 *      用来确认「改过色的文件」是不是真的盖住了所有页面（防止只扫到几处就宣布完成）
 *   2. 输出每页残留色清单，人工复核深色下会不会糊
 *
 * 用法：cd client && node scripts/audit-all-pages.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const roots = ['src'];
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.name === 'node_modules' || e.name === 'dist') continue;
    if (e.isDirectory()) walk(p);
    else if (/\.vue$/.test(e.name)) files.push(p);
  }
})('.');

// 已知「刻意固定」的色（品牌按钮白字 / 图表 / 半透明黑遮罩），不参与告警
const SAFE = [
  /var\(--/,
  /^\s*$/,
];
// 危险色：这些在深底上必然糊
const RISK = [
  ['#f43f5e', '危险红（深底偏糊）'],
  ['#dc2626', '深红'],
  ['#94a3b8', '浅灰蓝（浅底上 2.6:1）'],
  ['#8b85a3', '灰紫'],
  ['#3c3752', '深紫灰（深底上几乎不可见）'],
  ['#443d5e', '深紫灰'],
  ['#46405e', '深紫灰'],
  ['#4b4560', '深紫灰'],
  ['#16a34a', '深绿'],
  ['#15803d', '深绿'],
  ['#d97706', '暗琥珀'],
  ['#f59e0b', '琥珀'],
  ['#c7c3d6', '浅灰分隔'],
  ['#efeaf9', '极浅紫底'],
  ['#ece9f4', '极浅紫底'],
  ['#f7f6fb', '极浅紫底'],
  ['#f8f7fc', '极浅紫底'],
];

const rows = [];
for (const f of files.sort()) {
  const src = fs.readFileSync(f, 'utf8');
  const hits = [];
  src.split('\n').forEach((line, i) => {
    const m = line.match(/color:\s*([^;]+);/g) || [];
    for (const c of m) {
      const v = c.replace(/color:\s*/i, '').trim();
      if (v.startsWith('var(')) continue;
      for (const [hex, why] of RISK) {
        if (v.toLowerCase().includes(hex)) hits.push(`${i + 1}行 ${c.trim()}  ← ${why}`);
      }
    }
  });
  rows.push({ f, hits });
}

console.log(`client/src 下共 ${rows.length} 个 .vue 页面\n`);
const clean = rows.filter((r) => r.hits.length === 0);
const dirty = rows.filter((r) => r.hits.length > 0);

console.log(`== 已全部走主题变量：${clean.length} 个 ==`);
console.log(clean.map((r) => `  ✓ ${r.f}`).join('\n'));

console.log(`\n== 仍有残留硬编码色：${dirty.length} 个 ==`);
if (!dirty.length) console.log('  （无）');
for (const r of dirty) {
  console.log(`\n  ⚠ ${r.f}`);
  r.hits.slice(0, 8).forEach((h) => console.log(`     ${h}`));
  if (r.hits.length > 8) console.log(`     …还有 ${r.hits.length - 8} 处`);
}
console.log(`\n合计 ${clean.length} 干净 / ${dirty.length} 待处理`);
