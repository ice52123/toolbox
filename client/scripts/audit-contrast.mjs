/**
 * 对比度快筛（不跑浏览器，纯静态扫 style 块）
 *
 * 判据不是"算 WCAG 分值"（得渲染才知道真实底色），抓两种必然出事的模式：
 *   1. 同一条浅色主题规则里同时出现「浅色文字 + 浅底」→ html.dark 一开就是白字压白底
 *   2. html.dark 规则里出现深色文字 → 深底压深字
 *   3. 主色 #7c3aed 直接当文字色 → 深底上对比度掉到 2 左右
 *
 * 只报"同规则内 self-evident"的，跨规则的继承留给人工看，避免刷屏。
 *
 * 用法：cd client && node scripts/audit-contrast.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(vue|css|less)$/.test(e.name)) files.push(p);
  }
})('src');

const LIGHT_FG = [
  /^#(fff|ffffff)$/i,
  /^white$/i,
  /rgba?\(\s*255\s*,\s*255\s*,\s*255/i,
  /^#f[0-9a-f]{5}$/i,
];
const DARK_FG = [
  /^#(000|0[0-9a-f]{5}|1[0-9a-f]{5}|2[0-9a-f]{5}|3[0-9a-f]{5}|4[0-9a-f]{5}|5[0-9a-f]{5}|6[0-9a-f]{5})$/i,
  /^#4b4560$/i,
  /^#5b5480$/i,
  /^#6b6480$/i,
];
const LIGHT_BG = [
  /#(fff|ffffff)/i,
  /rgba?\(\s*255\s*,\s*255\s*,\s*255/i,
  /rgba?\(\s*(24[0-9]|25[0-5])\s*,\s*(24[0-9]|25[0-5])\s*,\s*(24[0-9]|25[0-5])/i,
  /linear-gradient\(135deg, ?#f/i,
  /linear-gradient\(135deg, ?#e/i,
];
const BRAND_FG = [/^#7c3aed$/i, /^#9333ea$/i];

// 括号配平地拆「选择器块」，行号跟着走
function parseRules(css) {
  const out = [];
  let i = 0;
  let line = 1;
  let buf = '';
  while (i < css.length) {
    const ch = css[i];
    if (ch === '\n') {
      line++;
      i++;
      continue;
    }
    if (ch === '@') {
      let k = i;
      let depth = 0;
      while (k < css.length) {
        if (css[k] === '{') depth++;
        else if (css[k] === '}') {
          depth--;
          if (depth === 0) break;
        }
        k++;
      }
      const chunk = css.slice(i, k + 1);
      line += (chunk.match(/\n/g) || []).length;
      buf = '';
      i = k + 1;
      continue;
    }
    if (ch === '{') {
      const sel = buf.trim();
      line += (sel.match(/\n/g) || []).length;
      let depth = 1;
      let k = i + 1;
      while (k < css.length && depth > 0) {
        if (css[k] === '{') depth++;
        else if (css[k] === '}') depth--;
        if (depth === 0) break;
        k++;
      }
      const body = css.slice(i + 1, k);
      out.push({ sel, body, line });
      buf = '';
      i = k + 1;
      continue;
    }
    buf += ch;
    i++;
  }
  return out;
}

const hits = [];
const manual = {};
let ruleCount = 0;
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const blocks = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  if (file.endsWith('.less') || file.endsWith('.css')) blocks.push(src);

  for (const css of blocks) {
    for (const { sel, body, line } of parseRules(css)) {
      if (!sel || sel.startsWith('//')) continue;
      ruleCount++;
      const props = body.split(';').map((s) => s.trim()).filter(Boolean);
      const color = props.find((p) => /^color:/i.test(p));
      if (!color) continue;
      const cv = color.split(':')[1].trim();
      const bg = props.find((p) => /^background(-color)?:/i.test(p));
      const bgv = bg ? bg.split(':').slice(1).join(':').trim() : '';
      const isDark = /\.dark\b/.test(sel);
      const lightFg = LIGHT_FG.some((re) => re.test(cv));
      const darkFg = DARK_FG.some((re) => re.test(cv));
      const lightBg = LIGHT_BG.some((re) => re.test(bgv));

      const hardcoded = !/^var\(/.test(cv);
      if (hardcoded) {
        const key = cv;
        (manual[key] ||= []).push(`${file}:${line}  [${sel}]`);
      }

      if (!isDark && lightFg && lightBg) {
        hits.push({ file, line, sel, decl: color, why: '浅色主题下白/浅字 + 浅底，深色主题会糊（除非底是主题变量）' });
      } else if (isDark && darkFg) {
        hits.push({ file, line, sel, decl: color, why: '深色主题下深字压深底' });
      } else if (BRAND_FG.some((re) => re.test(cv))) {
        hits.push({ file, line, sel, decl: color, why: '主色当文字色，深色底上对比度不足' });
      }
    }
  }
}

console.log(`扫描 ${files.length} 文件 / ${ruleCount} 条规则\n`);
const g = (kw) => hits.filter((h) => h.why.includes(kw));
const p1 = g('深色主题会糊');
const p2 = g('深字压深底');
const p3 = g('主色当文字色');
const show = (rows) => rows.forEach((h) => console.log(`${h.file}:${h.line}  [${h.sel}]\n    ${h.decl}\n    ↳ ${h.why}`));
console.log(`\n== 疑似「深色下浅字压浅底」 ${p1.length} 处 ==`);
show(p1);
console.log(`\n== 疑似「深色主题下深字」 ${p2.length} 处 ==`);
show(p2);
console.log(`\n== 主色当文字色 ${p3.length} 处 ==`);
show(p3);
console.log(`\n== 硬编码文字色全量（人工复核哪些在深色下会糊）=${Object.keys(manual).length} 种 ==`);
for (const [val, places] of Object.entries(manual)) {
  console.log(`\n${val}  ×${places.length}`);
  places.slice(0, 6).forEach((p) => console.log(`   ${p}`));
  if (places.length > 6) console.log(`   …还有 ${places.length - 6} 处`);
}
console.log(`\n合计 ${hits.length} 条`);
