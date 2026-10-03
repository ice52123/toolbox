<template>
  <div class="unit-tool">
    <el-card shadow="never">
      <template #header>单位换算</template>
      <div class="row">
        <el-tabs v-model="cat" class="tabs">
          <el-tab-pane v-for="g in GROUPS" :key="g.key" :label="g.name" :name="g.key" />
        </el-tabs>
      </div>

      <div class="row">
        <el-input v-model="val" style="flex: 1" placeholder="输入数值" />
        <el-select v-model="from" style="width: 120px">
          <el-option v-for="u in units" :key="u" :label="u" :value="u" />
        </el-select>
        <span class="eq">=</span>
        <el-select v-model="to" style="width: 120px">
          <el-option v-for="u in units" :key="u" :label="u" :value="u" />
        </el-select>
      </div>

      <el-alert v-if="err" type="error" :closable="false" :title="err" show-icon />

      <div v-if="result !== null" class="out">
        <span class="src">{{ val }} {{ from }}</span>
        <span class="ar">→</span>
        <code class="res">{{ result }}</code>
        <span class="dst">{{ to }}</span>
      </div>

      <div v-if="cat !== 'temp'" class="ref">
        <div class="lab">常用参考</div>
        <div class="refbox">
          <div v-for="r in refs" :key="r[0]"><span>{{ r[0] }}</span><code>{{ r[1] }}</code></div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

defineProps({ tool: Object });
// 温度最低精度 0.01，其余 6 位有效数字，避免 1mm→m 出现 0.001 这类脏值
const GROUPS = [
  { key: 'length', name: '长度', base: 'm', units: ['nm', 'mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mile'] },
  { key: 'weight', name: '重量', base: 'kg', units: ['mg', 'g', 'kg', 't', 'lb', 'oz', 'jin'] },
  { key: 'area', name: '面积', base: 'm2', units: ['mm2', 'cm2', 'm2', 'hectare', 'acre'] },
  { key: 'volume', name: '体积', base: 'L', units: ['mL', 'L', 'm3', 'gal', 'cup', 'mL_CN'] },
  { key: 'temp', name: '温度', base: 'C', units: ['C', 'F', 'K'] }
];
const FACTOR = {
  nm: 1e-9, mm: 1e-3, cm: 1e-2, m: 1, km: 1e3, in: 0.0254, ft: 0.3048, yd: 0.9144, mile: 1609.344,
  mg: 1e-6, g: 1e-3, kg: 1, t: 1e3, lb: 0.45359237, oz: 0.028349523, jin: 0.5,
  mm2: 1e-6, cm2: 1e-4, m2: 1, hectare: 1e4, acre: 4046.8564224,
  mL: 1e-3, L: 1, m3: 1e3, gal: 3.785411784, cup: 0.24,
  mL_CN: 1e-3
};

const cat = ref('length');
const val = ref('1');
const from = ref('m');
const to = ref('cm');
const err = ref('');
const result = ref(null);

const group = computed(() => GROUPS.find((g) => g.key === cat.value));
const units = computed(() => group.value.units);

const refs = computed(() => {
  if (cat.value === 'length') return [['1 里', '500 m'], ['1 尺(市)', '0.333 m'], ['5 ft', '1.524 m']];
  if (cat.value === 'weight') return [['1 斤', '500 g'], ['1 磅', '453.6 g'], ['1 两', '50 g']];
  if (cat.value === 'area') return [['1 公顷', '10000 m²'], ['1 亩', '666.7 m²'], ['1 英亩', '4046.9 m²']];
  if (cat.value === 'volume') return [['1 加仑(美)', '3.785 L'], ['1 杯', '240 mL'], ['1 升=1000 mL', '']];
  return [['0°C', '32°F'], ['100°C', '212°F'], ['-40°C', '-40°F']];
});

function toBase(v, u) {
  if (cat.value === 'temp') return u === 'C' ? v : u === 'F' ? ((v - 32) * 5) / 9 : v - 273.15;
  return v * FACTOR[u];
}
function fromBase(b, u) {
  if (cat.value === 'temp') return u === 'C' ? b : u === 'F' ? (b * 9) / 5 + 32 : b + 273.15;
  return b / FACTOR[u];
}

function conv() {
  err.value = '';
  result.value = null;
  const n = Number(val.value);
  if (val.value === '' || Number.isNaN(n)) { err.value = '请输入有效数值'; return; }
  if (from.value === to.value) { result.value = String(n); return; }
  const r = fromBase(toBase(n, from.value), to.value);
  const digits = cat.value === 'temp' ? 4 : 6;
  const s = Number(r.toFixed(digits)).toString();
  result.value = r !== 0 && Math.abs(r) < 1e-4 ? r.toExponential(4) : s;
}

// 换分类时单位表整体换掉，得把 from/to 落到该分类的单位上再重算，
// 否则会带着上一分类的取值（比如从长度切到温度还是 "cm" → 报错）
watch(cat, () => {
  const g = GROUPS.find((x) => x.key === cat.value);
  from.value = g.units[1] || g.units[0];
  to.value = g.units[2] || g.units[0];
  conv();
});
// 首次进页面就给个结果，别等用户动了才有数
conv();
</script>

<style lang="less" scoped>@import '@/styles/mixins.less';
.unit-tool { max-width: 640px; }
.row { margin: 12px 0; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.row :deep(.el-input) { flex: 1; min-width: 0; }
.tabs { width: 100%; }
.eq { color: var(--tb-sub, #64748b); }
.out {
  margin-top: 14px;
  padding: 12px;
  border-radius: 6px;
  background: var(--tb-ok-soft, #f0fdf4);
  border: 1px solid rgba(22, 163, 74, 0.2);
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}
.src, .dst { font-size: 14px; color: var(--tb-sub, #64748b); }
.ar { color: #94a3b8; }
.res {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 18px;
  font-weight: 700;
  color: #15803d;
}
.ref { margin-top: 16px; }
.lab { font-size: 12.5px; color: var(--tb-sub, #64748b); margin-bottom: 6px; }
.refbox {
  border: 1px solid var(--tb-line, #e2e8f0);
  border-radius: 6px;
  padding: 8px 12px;
  display: grid;
  gap: 4px;
}
.refbox div { display: flex; gap: 12px; font-size: 13px; }
.refbox span { color: var(--tb-sub, #64748b); }
.refbox code { font-family: ui-monospace, Menlo, monospace; }
</style>
