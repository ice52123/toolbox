// 组件解析体检：找出「模板里用了，但既没 import、也没全局注册」的组件
// 背景：本项目反复白屏的根因就是这类错误——Vue 渲染时 resolve 不到组件会让整棵子树挂掉。
// 用法：node scripts/audit-components.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', 'src');
const iconDir = path.join(__dirname, '..', 'node_modules/@element-plus/icons-vue/dist/types/components');

const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.vue')) files.push(p);
  }
})(root);

// main.js 里对 @element-plus/icons-vue 做了 Object.entries 全局注册，这 294 个名字可直接用
const GLOBAL_ICONS = new Set(
  // warning-filled.vue.d.ts → WarningFilled（中间的连字符要转成驼峰，否则
  // 所有带连字符的图标（WarningFilled / Loading / MagPlus …）都会被误判成「未注册」）
  fs.readdirSync(iconDir)
    .map((f) => f.replace(/\.vue\.d\.ts$/, ''))
    .map((n) => n.replace(/^./, (c) => c.toUpperCase()).replace(/-([a-z])/g, (_, c) => c.toUpperCase()))
);

let problems = 0;

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const tplStart = src.indexOf('<template>');
  const tplEnd = src.lastIndexOf('</template>');
  const tpl = tplStart >= 0 ? src.slice(tplStart, tplEnd) : src;

  const script = src.slice(src.indexOf('<script setup>') >= 0 ? src.indexOf('<script setup>') : 0);
  const imported = new Set();
  const re = /import\s+(?:([A-Za-z_$][\w$]*)\s*,?\s*)?(?:\{([^}]*)\})?\s*from\s*['"][^'"]+['"]/g;
  let m;
  while ((m = re.exec(script))) {
    if (m[1]) imported.add(m[1]);
    if (m[2]) {
      for (const part of m[2].split(',')) {
        const t = part.trim().split(/\s+as\s+/).pop().trim();
        if (t) imported.add(t);
      }
    }
  }

  // :is="'Xxx'" 这种字符串写法靠全局注册解析
  const isNames = new Set();
  const isRe = /:is="\s*['"]([A-Za-z0-9_]+)['"]/g;
  while ((m = isRe.exec(tpl))) isNames.add(m[1]);

  const missing = new Set();
  const tagRe = /<([A-Z][A-Za-z0-9_]*)(?=[\s/>])/g;
  while ((m = tagRe.exec(tpl))) {
    const name = m[1];
    if (imported.has(name) || GLOBAL_ICONS.has(name) || isNames.has(name)) continue;
    missing.add(name);
  }

  if (missing.size) {
    problems += missing.size;
    console.log(`✗ ${path.relative(root, file)}\n   未解析: ${[...missing].join(', ')}`);
  }
}

console.log(`\n扫描 ${files.length} 个 .vue，未解析组件 ${problems} 处` +
  (problems ? '' : ' ✅'));
process.exit(problems ? 1 : 0);
