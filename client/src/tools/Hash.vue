<template>
  <div class="hash-tool">
    <el-card shadow="never">
      <template #header>文本哈希计算</template>
      <el-input
        v-model="text"
        type="textarea"
        :rows="5"
        placeholder="要计算哈希的文本…"
      />
      <div class="row">
        <el-select v-model="algo" style="width: 150px">
          <el-option label="MD5" value="md5" />
          <el-option label="SHA-1" value="sha1" />
          <el-option label="SHA-256" value="sha256" />
        </el-select>
        <el-button type="primary" :loading="busy" @click="calc">计算</el-button>
        <el-button text @click="clear">清空</el-button>
      </div>
      <div v-if="result" class="out">
        <div class="lab">{{ algoLabel }}（{{ result.len }} 字符）</div>
        <code class="val">{{ result.hex }}</code>
        <el-button link type="primary" @click="copy(result.hex)">复制</el-button>
      </div>
      <div v-if="msg" class="msg err">{{ msg }}</div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

defineProps({ tool: Object });
const text = ref('');
const algo = ref('md5');
const busy = ref(false);
const msg = ref('');
const result = ref(null);

const algoLabel = computed(() => ({ md5: 'MD5', sha1: 'SHA-1', 'sha256': 'SHA-256' })[algo.value]);

// MD5：Web Crypto 只提供 SHA-1/256/384/512，没有 MD5，所以自己实现一份。
// 算法是标准 MD5（RFC 1321），只在浏览器主线程跑，大文本会卡一下，可接受。
const SIN_K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296));
const SHIFT = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
];

function md5(input) {
  const bytes = new TextEncoder().encode(input);
  const total = ((((bytes.length + 8) >> 6) + 1) << 6);
  const buf = new Uint8Array(total);
  buf.set(bytes);
  buf[bytes.length] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(total - 8, (bytes.length * 8) >>> 0, true);
  dv.setUint32(total - 4, Math.floor((bytes.length * 8) / 4294967296), true);

  let [a, b, c, d] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
  const m = new Int32Array(16);
  for (let off = 0; off < total; off += 64) {
    for (let j = 0; j < 16; j++) m[j] = dv.getInt32(off + j * 4, true);
    let [aa, bb, cc, dd] = [a, b, c, d];
    for (let j = 0; j < 64; j++) {
      let f, g;
      if (j < 16) { f = (bb & cc) | (~bb & dd); g = j; }
      else if (j < 32) { f = (dd & bb) | (~dd & cc); g = (5 * j + 1) % 16; }
      else if (j < 48) { f = bb ^ cc ^ dd; g = (3 * j + 5) % 16; }
      else { f = cc ^ (bb | ~dd); g = (7 * j) % 16; }
      f = (f + aa + SIN_K[j] + m[g]) | 0;
      f = ((f << SHIFT[j]) | (f >>> (32 - SHIFT[j]))) | 0;
      aa = dd; dd = cc; cc = bb; bb = (bb + f) | 0;
    }
    a = (a + aa) | 0; b = (b + bb) | 0; c = (c + cc) | 0; d = (d + dd) | 0;
  }
  const out = new Uint8Array(16);
  const odv = new DataView(out.buffer);
  odv.setInt32(0, a, true); odv.setInt32(4, b, true);
  odv.setInt32(8, c, true); odv.setInt32(12, d, true);
  return Array.from(out, (x) => x.toString(16).padStart(2, '0')).join('');
}

async function calc() {
  msg.value = '';
  result.value = null;
  if (!text.value) { msg.value = '请输入文本'; return; }
  busy.value = true;
  try {
    if (algo.value === 'md5') {
      result.value = { hex: md5(text.value), len: text.value.length };
    } else {
      const buf = await crypto.subtle.digest(
        algo.value === 'sha1' ? 'SHA-1' : 'SHA-256',
        new TextEncoder().encode(text.value)
      );
      result.value = {
        hex: Array.from(new Uint8Array(buf), (x) => x.toString(16).padStart(2, '0')).join(''),
        len: text.value.length
      };
    }
  } catch (e) {
    msg.value = '计算失败：' + e.message;
  } finally {
    busy.value = false;
  }
}

function clear() { text.value = ''; result.value = null; msg.value = ''; }
function copy(v) {
  navigator.clipboard?.writeText(v).catch(() => {});
  ElMessage.success('已复制');
}
</script>

<style lang="less" scoped>@import '@/styles/mixins.less';
.hash-tool { max-width: 640px; }
.row { margin: 12px 0; display: flex; align-items: center; gap: 10px; }
.out {
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--tb-ok-soft, #f0fdf4);
  border: 1px solid rgba(22, 163, 74, 0.2);
}
.lab { font-size: 12.5px; color: var(--tb-sub, #64748b); margin-bottom: 4px; }
.val {
  display: block;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13.5px;
  word-break: break-all;
  margin-bottom: 4px;
}
.msg.err { margin-top: 10px; color: var(--el-color-danger); font-size: 13px; }
</style>
