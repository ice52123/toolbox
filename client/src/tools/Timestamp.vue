<template>
  <div class="ts-tool">
    <el-card shadow="never">
      <template #header>时间戳 → 日期</template>
      <div class="row">
        <el-input v-model="ts" placeholder="输入秒(10位)或毫秒(13位)时间戳" />
        <el-button @click="toDate">转换</el-button>
      </div>
      <div v-if="dateResult" class="result">{{ dateResult }}</div>
    </el-card>
    <el-card shadow="never">
      <template #header>日期 → 时间戳</template>
      <div class="row">
        <el-date-picker
          v-model="pick"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
          placeholder="选择时间"
        />
        <el-button @click="toTs">转换</el-button>
      </div>
      <div v-if="tsResult" class="result">
        秒：{{ tsResult.s }}　毫秒：{{ tsResult.ms }}
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({ tool: Object });
const ts = ref('');
const dateResult = ref('');
const pick = ref('');
const tsResult = ref('');

function toDate() {
  let n = Number(ts.value);
  if (!n) { dateResult.value = '请输入时间戳'; return; }
  if (String(n).length === 10) n *= 1000;
  const d = new Date(n);
  if (isNaN(d.getTime())) { dateResult.value = '无效时间戳'; return; }
  dateResult.value = d.toLocaleString('zh-CN');
}
function toTs() {
  if (!pick.value) { tsResult.value = ''; return; }
  const d = new Date(pick.value.replace(/-/g, '/'));
  const ms = d.getTime();
  tsResult.value = { s: Math.floor(ms / 1000), ms };
}
</script>

<style lang="less" scoped>@import '@/styles/mixins.less';
.ts-tool { display: flex; flex-direction: column; gap: 16px; max-width: 520px; }
/* 输入框/选择器与「转换」按钮同一行：控件吃满剩余宽度、按钮贴右，两者同高垂直居中。
   以前是两个 el-* 直接平铺，el-input 是块级占满整行，把按钮挤到下一行，两个卡片长得不一样。 */
.row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.row :deep(.el-input),
.row :deep(.el-date-editor) {
  flex: 1;
  min-width: 0; /* 不设的话长 placeholder 会把按钮挤出去 */
}
.result { margin-top: 10px; color: var(--tb-primary); font-weight: 600; }
</style>
