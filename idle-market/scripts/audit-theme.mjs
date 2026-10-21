/**
 * idle-market 明暗主题快筛（纯静态扫 style 块，不跑浏览器）
 *
 * 抓三类「深浅切换必炸」的模式：
 *   A. 写死的面层底色（background/background-image 里出现白/浅灰/亮渐变）
 *      → 深色主题下浅底 + 浅字 = 糊成一片。这是之前 List 卡片栽的坑。
 *   B. 写死的文字色：深色调文字（浅色主题用）和浅色调文字（深色主题用）
 *      → 反过来贴主题就看不见。
 *   C. 前景用的品牌色 #7c3aed —— 深底上对比度掉到 2 左右。
 *
 * 只统计"同规则内自证"的，跨规则继承留人工。
 * 用法：cd idle-market && node scripts/audit-theme.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.name === 'node_modules' || e.name === 'dist' || e.name === 'scripts') continue;
    if (e.isDirectory()) walk(p);
    else if (/\.(vue|css|less)$/.test(e.name)) files.push(p);
  }
})('src');

// 白 / 近白 / 浅灰底
const LIGHT_BG = [
  /#(fff|ffffff)/i,
  /rgba?\(\s*255\s*,\s*255\s*,\s*255/i,
  /rgba?\(\s*(24[0-9]|25[0-5])\s*,\s*(24[0-9]|25[0-5])\s*,\s*(24[0-9]|25[0-5])/i,
  /linear-gradient\([^)]*?#[0-9a-f]{6}\)/i, // 全部由色值组成的渐变（含 #f3f0ff 一类亮渐变）
];
// 深色调文字：浅色主题下当 color 用
const DARK_FG = [
  /^#(000|0[0-9a-f]{5}|1[0-9a-f]{5}|2[0-9a-f]{5}|3[0-9a-f]{5}|4[0-9a-f]{5}|5[0-9a-f]{5}|6[0-9a-f]{5})$/i,
];
const LIGHT_FG = [/^#(fff|ffffff)$/i, /^white$/i, /rgba?\(\s*255\s*,\s*255\s*,\s*255/i, /^#f[0-9a-f]{5}$/i];
const BRAND_FG = [/^#7c3aed$/i, /^#9333ea$/i];
// 品牌色面层：白字压紫渐变、半透明黑胶囊上的白字 —— 这类底色刻意固定，不跟主题走
const BRAND_BG = [
  /rgba?\(\s*124\s*,\s*58\s*,\s*237/i, // 品牌紫半透明
  /#(7c3aed|9333ea|7338e6|8b2fe0|6d28d9|5b3f9e)/i, // 品牌紫渐变色标
  /rgba?\(\s*0\s*,\s*0\s*,\s*0/i, // 半透明黑（角标/遮罩）
  /rgba?\(\s*(3[0-9]|2[0-9]|1[0-9]|[0-9])\s*,\s*(3[0-9]|2[0-9]|1[0-9]|[0-9])\s*,\s*(5[0-9]|4[0-9]|3[0-9]|2[0-9])/, // 深紫底
];

// 括号配平地拆规则块，行号跟着走
function parseRules(css) {
  const out = [];
  let i = 0, line = 1, buf = '';
  while (i < css.length) {
    const ch = css[i];
    if (ch === '\n') { line++; i++; continue; }
    if (ch === '@') {
      let k = i, depth = 0;
      while (k < css.length) {
        if (css[k] === '{') depth++;
        else if (css[k] === '}') { depth--; if (depth === 0) break; }
        k++;
      }
      const chunk = css.slice(i, k + 1);
      line += (chunk.match(/\n/g) || []).length;
      buf = ''; i = k + 1; continue;
    }
    if (ch === '{') {
      const sel = buf.trim();
      line += (sel.match(/\n/g) || []).length;
      let depth = 1, k = i + 1;
      while (k < css.length && depth > 0) {
        if (css[k] === '{') depth++;
        else if (css[k] === '}') depth--;
        if (depth === 0) break;
        k++;
      }
      out.push({ sel, body: css.slice(i + 1, k), line });
      buf = ''; i = k + 1; continue;
    }
    buf += ch; i++;
  }
  return out;
}

const A = [], B = [], C = [], manual = {};
let ruleCount = 0;

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const blocks = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  if (/\.(less|css)$/.test(file)) blocks.push(src);

  for (const css of blocks) {
    for (const { sel, body, line } of parseRules(css)) {
      if (!sel || sel.startsWith('//')) continue;
      ruleCount++;
      const props = body.split(';').map((s) => s.trim()).filter(Boolean);
      const isDark = /\.dark\b/.test(sel);

      // A. 面层底色写死浅色
      for (const p of props) {
        if (!/^(background(-color)?|background-image):/i.test(p)) continue;
        const v = p.split(':').slice(1).join(':').trim();
        if (!v || v.startsWith('var(') || v.startsWith('url(')) continue;
        if (!LIGHT_BG.some((re) => re.test(v))) continue;
        if (BRAND_BG.some((re) => re.test(v))) continue; // 品牌/深色面层（.on/.btn/角标）刻意固定，跟随主题也没意义
        A.push({ file, line, sel, decl: p, v });
      }

      // B / C / 硬编码文字色
      const color = props.find((p) => /^color:/i.test(p));
      if (color) {
        const cv = color.split(':').slice(1).join(':').trim();
        if (!cv.startsWith('var(')) {
          (manual[cv] ||= []).push(`${file}:${line}  [${sel}]`);
          if (DARK_FG.some((re) => re.test(cv)) && !isDark)
            B.push({ file, line, sel, decl: color, why: '浅色主题下深字 —— 切深色会看不见' });
          if (LIGHT_FG.some((re) => re.test(cv)) && !BRAND_BG.some((re) => re.test(body)))
            B.push({ file, line, sel, decl: color, why: '浅色文字压浅底（确认底色是主题变量，否则深色下糊）' });
          if (isDark && !BRAND_BG.some((re) => re.test(body)))
            B.push({ file, line, sel, decl: color, why: '深色主题规则里出现非变量色，人工复核' });
        }
        if (BRAND_FG.some((re) => re.test(cv)))
          C.push({ file, line, sel, decl: color, why: '品牌色当前景色，深色底上对比度不足（改用 var(--im-brand)）' });
      }
    }
  }
}

const show = (rows, n = 30) => {
  console.log(rows.slice(0, n).map((r) => `${r.file}:${r.line}  [${r.sel}]\n    ${r.decl}\n    ↳ ${r.why ?? '硬编码浅色面层底色'}`).join('\n') || '（无）');
  if (rows.length > n) console.log(`   …还有 ${rows.length - n} 处`);
};

console.log(`扫描 ${files.length} 文件 / ${ruleCount} 条规则\n`);
console.log(`\n== A 写死浅色面层底色（深色下会亮底亮字） ${A.length} 处 ==`);
show(A);
console.log(`\n== B 写死文字色（深浅主题不一致） ${B.length} 处 ==`);
show(B);
console.log(`\n== C 品牌色当前景色 ${C.length} 处 ==`);
show(C);
console.log(`\n== 硬编码文字色全量 ${Object.keys(manual).length} 种 ==`);
for (const [v, ps] of Object.entries(manual)) {
  const suspicious = DARK_FG.some((re) => re.test(v)) || LIGHT_FG.some((re) => re.test(v)) || BRAND_FG.some((re) => re.test(v));
  console.log(`${suspicious ? '⚠ ' : '  '}${v}  ×${ps.length}`);
  if (suspicious) ps.slice(0, 4).forEach((p) => console.log(`     ${p}`));
}
console.log(`\n合计 A${A.length} / B${B.length} / C${C.length}`);
