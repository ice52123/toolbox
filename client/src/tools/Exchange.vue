<template>
  <div class="ex">
    <el-card class="tb-card conv" shadow="never">
      <div class="row">
        <el-input-number v-model="amount" :min="0" :precision="2" controls-position="right" style="width:150px" />
        <el-select v-model="from" filterable style="width:130px">
          <el-option v-for="c in curList" :key="c.code" :label="c.code + ' ' + c.name" :value="c.code" />
        </el-select>
        <el-button circle @click="swap"><el-icon><Switch /></el-icon></el-button>
        <el-select v-model="to" filterable style="width:130px">
          <el-option v-for="c in curList" :key="c.code" :label="c.code + ' ' + c.name" :value="c.code" />
        </el-select>
      </div>
      <div class="res" v-loading="loading">
        <template v-if="result !== null">
          <div class="line">
            <span class="big">{{ fmt(amount) }} {{ from }} =</span>
          </div>
          <div class="line">
            <span class="big tb-gradient-text">{{ fmt(result) }} {{ to }}</span>
          </div>
          <div class="rate">1 {{ from }} ≈ {{ rateText }} {{ to }}</div>
        </template>
        <el-alert v-else-if="error" type="warning" :closable="false" :title="error" />
      </div>
    </el-card>

    <el-card class="tb-card quick" shadow="never">
      <div class="q-title">主要货币兑人民币（CNY）</div>
      <div class="q-grid">
        <div v-for="c in quick" :key="c.code" class="q-item">
          <span class="qc">1 {{ c.code }}</span>
          <span class="qv">≈ {{ c.val }} CNY</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { Switch } from '@element-plus/icons-vue';

const curList = [
  { code: 'USD', name: '美元' }, { code: 'CNY', name: '人民币' }, { code: 'EUR', name: '欧元' },
  { code: 'JPY', name: '日元' }, { code: 'GBP', name: '英镑' }, { code: 'HKD', name: '港币' },
  { code: 'KRW', name: '韩元' }, { code: 'AUD', name: '澳元' }, { code: 'CAD', name: '加元' },
  { code: 'SGD', name: '新加坡元' }, { code: 'THB', name: '泰铢' }, { code: 'CHF', name: '瑞士法郎' }
];
const amount = ref(100);
const from = ref('USD');
const to = ref('CNY');
const result = ref(null);
const rateText = ref('');
const loading = ref(false);
const error = ref('');
const quick = ref([]);

function fmt(n) {
  return Number(n).toLocaleString('zh-CN', { maximumFractionDigits: 2 });
}

async function convert() {
  if (from.value === to.value) {
    result.value = amount.value;
    rateText.value = '1';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const r = await fetch(`https://open.er-api.com/v6/latest/${from.value}`);
    const d = await r.json();
    if (d.result !== 'success') throw new Error('服务异常');
    const rate = d.rates[to.value];
    if (!rate) throw new Error('暂不支持该货币');
    result.value = amount.value * rate;
    rateText.value = rate.toFixed(4);
  } catch (e) {
    error.value = '获取汇率失败，请检查网络';
    result.value = null;
  } finally {
    loading.value = false;
  }
}

async function loadQuick() {
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/CNY');
    const d = await r.json();
    const codes = ['USD', 'EUR', 'JPY', 'GBP', 'HKD', 'KRW', 'AUD', 'CAD'];
    quick.value = codes.map((c) => ({ code: c, val: (1 / d.rates[c]).toFixed(4) }));
  } catch (e) {
    quick.value = [];
  }
}

function swap() {
  const t = from.value;
  from.value = to.value;
  to.value = t;
}

watch([amount, from, to], convert);
onMounted(() => {
  convert();
  loadQuick();
});
</script>

<style lang="less" scoped>@import '@/styles/mixins.less';
.ex { display: flex; flex-direction: column; gap: 16px; }
.row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.res { min-height: 90px; display: flex; flex-direction: column; justify-content: center; gap: 6px; margin-top: 14px; }
.line { display: flex; }
.big { font-size: 24px; font-weight: 800; }
.rate { font-size: 13px; color: var(--tb-sub); margin-top: 4px; }
.q-title { font-weight: 700; margin-bottom: 12px; }
.q-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.q-item { display: flex; justify-content: space-between; padding: 8px 12px; border-radius: 10px; background: rgba(124, 58, 237, 0.06); }
.qc { color: var(--tb-sub); }
.qv { font-weight: 600; }
</style>
