<template>
  <div class="color-tool">
    <el-card shadow="never">
      <template #header>颜色转换</template>
      <div class="row">
        <span class="swatch" :style="{ background: hex }"></span>
        <el-input v-model="raw" style="flex: 1" placeholder="HEX（#4f46e5）/ RGB（79,70,229）/ HSL（243,75%,53%）" />
        <el-color-picker v-model="hex" :predefine="SWATCHES" />
      </div>

      <el-alert v-if="err" type="error" :closable="false" :title="err" show-icon />

      <div v-if="c" class="grid">
        <div v-for="r in rows" :key="r.k" class="line">
          <span class="k">{{ r.k }}</span>
          <code>{{ r.v }}</code>
          <el-button link type="primary" @click="copy(r.v)">复制</el-button>
        </div>
      </div>

      <div class="row wrap">
        <el-button size="small" @click="raw = '#4f46e5'">Indigo</el-button>
        <el-button size="small" @click="raw = '#16a34a'">Green</el-button>
        <el-button size="small" @click="raw = '#dc2626'">Red</el-button>
        <el-button size="small" @click="raw = '#f59e0b'">Amber</el-button>
        <el-button size="small" @click="raw = '#0ea5e9'">Sky</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';

defineProps({ tool: Object });
const SWATCHES = ['#4f46e5', '#16a34a', '#dc2626', '#f59e0b', '#0ea5e9', '#64748b'];
const raw = ref('#4f46e5');
const err = ref('');

const c = computed(() => parse(raw.value));
const hex = computed(() => (c.value ? c.value.hex : raw.value));

function parse(str) {
  const s = String(str || '').trim();
  if (!s) return null;
  // hex: #rgb / #rrggbb
  let m = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    let h = m[1];
    if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  // rgb(a) / 逗号空格
  m = s.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (m) return { r: +m[1], g: +m[2], b: +m[3] };
  // hsl(a)
  m = s.match(/hsla?\(\s*([\d.]+)[\s,]+([\d.]+)%[\s,]+([\d.]+)%/i);
  if (m) return fromHsl(+m[1], +m[2], +m[3]);
  return null;
}

function toHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function fromHsl(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

const rows = computed(() => {
  if (!c.value) return [];
  const { r, g, b } = c.value;
  const h = toHsl(r, g, b);
  const hexS = '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return [
    { k: 'HEX', v: hexS.toUpperCase() },
    { k: 'RGB', v: `rgb(${r}, ${g}, ${b})` },
    { k: 'HSL', v: `hsl(${h.h}, ${h.s}%, ${h.l}%)` },
    { k: 'HSV', v: `hsv(${h.h}, ${Math.round((h.s * 255) / 100)}, ${Math.round(((Math.max(r, g, b) / 255) * 100))}%)` },
    { k: 'CMYK', v: `cmyk(${cmyk(r, g, b).join(', ')}%)` }
  ];
});

function cmyk(r, g, b) {
  const k = 255 - Math.max(r, g, b);
  if (k === 255) return [0, 0, 0, 100];
  return [
    Math.round(((255 - r - k) / (255 - k)) * 100),
    Math.round(((255 - g - k) / (255 - k)) * 100),
    Math.round(((255 - b - k) / (255 - k)) * 100),
    Math.round((k / 255) * 100)
  ];
}

watch(raw, () => {
  err.value = !raw.value ? '' : c.value ? '' : '无法识别的颜色格式';
});
function copy(v) {
  navigator.clipboard?.writeText(v).catch(() => {});
  ElMessage.success('已复制');
}
</script>

<style lang="less" scoped>@import '@/styles/mixins.less';
.color-tool { max-width: 640px; }
.row { margin: 12px 0; display: flex; align-items: center; gap: 10px; }
.row :deep(.el-input) { flex: 1; min-width: 0; }
.row.wrap { flex-wrap: wrap; gap: 8px; }
.swatch { width: 30px; height: 30px; border-radius: 6px; border: 1px solid var(--tb-line, #e2e8f0); flex: 0 0 30px; }
.grid { display: grid; gap: 2px; }
.line {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 4px;
  &:hover { background: rgba(0, 0, 0, 0.03); }
}
.k { width: 46px; font-size: 12.5px; color: var(--tb-sub, #64748b); }
.line code {
  flex: 1;
  min-width: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13.5px;
}
</style>
