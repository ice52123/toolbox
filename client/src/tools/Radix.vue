<template>
  <div class="radix-tool">
    <el-card shadow="never">
      <template #header>进制转换</template>
      <el-input v-model="num" placeholder="输入数值" />
      <div class="row">
        <span class="lab">从</span>
        <el-select v-model="from" style="width: 120px">
          <el-option v-for="b in BASES" :key="b" :label="b + ' 进制'" :value="b" />
        </el-select>
        <span class="lab">到</span>
        <el-select v-model="to" style="width: 120px">
          <el-option v-for="b in BASES" :key="b" :label="b + ' 进制'" :value="b" />
        </el-select>
        <el-button type="primary" @click="conv">转换</el-button>
      </div>

      <el-alert v-if="err" type="error" :closable="false" :title="err" show-icon />

      <div v-if="val" class="out">
        <div class="line">
          <span class="lab">{{ from }} 进制</span><code>{{ inputShow }}</code>
        </div>
        <div class="line" v-for="b in BASES" :key="b">
          <span class="lab">{{ b }} 进制</span>
          <code :class="b === to ? 'hl' : ''">{{ show(b) }}</code>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({ tool: Object });
const BASES = [2, 8, 10, 16, 36];
const num = ref('');
const from = ref(10);
const to = ref(16);
const err = ref('');
const val = ref(null);
const inputShow = ref('');

// 用 BigInt 存中间值，不然 16 进制长串会丢精度
function parsed() {
  const s = num.value.trim().replace(/[_,\s]/g, '');
  if (!s) return null;
  if (from.value === 10) {
    if (!/^[+-]?\d+$/.test(s)) return null;
    return BigInt(s);
  }
  const body = s.replace(/^[+-]/, '');
  if (!new RegExp(`^[0-9a-fA-F]{1,${from.value}}$`).test(body)) return null;
  let n = 0n;
  for (const ch of body.toLowerCase()) n = n * BigInt(from.value) + BigInt(parseInt(ch, from.value));
  return s.startsWith('-') ? -n : n;
}

function conv() {
  err.value = '';
  inputShow.value = '';
  val.value = null;
  const n = parsed();
  if (n === null) {
    err.value = '数值不合法：只能输入 ' + from.value + ' 进制下的数字';
    return;
  }
  val.value = n;
  inputShow.value = num.value.trim();
}

function show(base) {
  if (base === 10) return val.value.toString(10);
  const neg = val.value < 0n;
  const digits = (neg ? -val.value : val.value).toString(base).toUpperCase();
  const body = base === 2
    ? digits.padStart(Math.max(1, digits.length + (4 - (digits.length % 4)) % 4), '0')
    : digits;
  const padded = base === 2 ? body.replace(/(.{4})(?=.)/g, '$1 ') : body;
  return (neg ? '-' : '') + padded;
}
</script>

<style lang="less" scoped>@import '@/styles/mixins.less';
.radix-tool { max-width: 640px; }
.row { margin-top: 12px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.lab { font-size: 13px; color: var(--tb-sub, #64748b); }
.out { margin-top: 14px; display: grid; gap: 6px; }
.line { display: flex; align-items: center; gap: 12px; }
.line code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13.5px;
  word-break: break-all;
}
.line code.hl { color: var(--tb-primary); font-weight: 700; }
</style>
