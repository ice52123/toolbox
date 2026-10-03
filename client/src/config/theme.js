// 主题预设：切 accent 时一次性把「主色 + Element Plus 派生色」写进 CSS 变量，
// 组件里读 var(--tb-primary) / var(--el-color-primary) 就够了，不用到处改颜色。
export const accentPresets = [
  { key: 'violet', name: '星夜紫', primary: '#7c3aed', secondary: '#ec4899', demo: '紫' },
  { key: 'ocean', name: '深海蓝', primary: '#2563eb', secondary: '#06b6d4', demo: '蓝' },
  { key: 'mint', name: '青竹绿', primary: '#0d9488', secondary: '#84cc16', demo: '绿' },
  { key: 'sunset', name: '落日橙', primary: '#ea580c', secondary: '#f59e0b', demo: '橙' },
  { key: 'rose', name: '玫瑰红', primary: '#e11d48', secondary: '#f472b6', demo: '粉' }
];

export const getAccent = (key) =>
  accentPresets.find((p) => p.key === key) || accentPresets[0];

// —— 颜色小工具：hex 混色 / 转 rgba，用来算 Element 的 light-3 ~ light-9 ——
function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function toHex(r, g, b) {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
/** 两个颜色按 t 混色（t=0 全取 c1，t=1 全取 c2） */
export function mix(c1, c2, t) {
  const a = hexToRgb(c1);
  const b = hexToRgb(c2);
  return toHex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
}
export function rgba(hex, alpha) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
