<template>
  <div class="img-tool">
    <el-card shadow="never">
      <template #header>格式转换</template>

      <el-upload
        :auto-upload="false"
        :show-file-list="false"
        accept="image/*"
        :on-change="onPick"
      >
        <el-button type="primary">选择图片</el-button>
        <template #tip><div class="tip">PNG / JPG / WebP 互转，浏览器本地完成</div></template>
      </el-upload>

      <template v-if="src">
        <div class="row">
          <span class="lab">转成</span>
          <el-select v-model="fmt" style="width: 130px">
            <el-option label="PNG（无损）" value="image/png" />
            <el-option label="JPEG（小）" value="image/jpeg" />
            <el-option label="WebP（推荐）" value="image/webp" />
          </el-select>
          <span v-if="fmt === 'image/png'" class="dim">PNG 不支持画质参数，恒为无损</span>
        </div>
        <div v-if="fmt !== 'image/png'" class="row">
          <span class="lab">画质</span>
          <el-slider v-model="quality" :min="10" :max="100" style="flex: 1" />
          <span class="num">{{ quality }}%</span>
        </div>
        <div class="row">
          <el-button type="primary" :loading="busy" @click="run">转换</el-button>
          <el-button text @click="reset">换图</el-button>
        </div>

        <div v-if="out" class="stats">
          <div><span class="k">原图</span><code>{{ sizeText(srcSize) }}</code></div>
          <div><span class="k">转换后</span><code>{{ sizeText(outSize) }}</code></div>
          <div><span class="k">体积变化</span><code>{{ delta }}</code></div>
        </div>

        <div v-if="out" class="preview">
          <div class="pv"><img :src="src" alt="原图" /><span class="cap">原图</span></div>
          <div class="pv"><img :src="out" alt="转换后" /><span class="cap">转换后</span></div>
          <a class="dl" :href="out" :download="fileName">下载</a>
        </div>
      </template>

      <div v-else class="empty">还没有选图</div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

defineProps({ tool: Object });
const src = ref('');
const srcSize = ref(0);
const out = ref('');
const outSize = ref(0);
const fmt = ref('image/webp');
const quality = ref(80);
const busy = ref(false);
const fileName = ref('converted');
let rawFile = null;

const delta = computed(() => {
  if (!outSize.value || !srcSize.value) return '—';
  const d = Math.round((1 - outSize.value / srcSize.value) * 100);
  return (d >= 0 ? '省 ' : '大 ') + Math.abs(d) + '%';
});

function onPick(file) {
  rawFile = file.raw;
  fileName.value = (file.name || 'image').replace(/\.[^.]+$/, '') + extOf(fmt.value);
  srcSize.value = file.size || 0;
  out.value = '';
  outSize.value = 0;
  src.value = URL.createObjectURL(file.raw);
}

function extOf(mime) {
  return { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' }[mime] || '.png';
}

async function run() {
  if (!rawFile) return;
  busy.value = true;
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = src.value;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    // JPEG 不支持透明，先铺白底，否则透明区会变黑
    if (fmt.value === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise((res) =>
      canvas.toBlob(res, fmt.value, fmt.value === 'image/png' ? undefined : quality.value / 100)
    );
    outSize.value = blob.size;
    out.value = URL.createObjectURL(blob);
  } finally {
    busy.value = false;
  }
}

function sizeText(n) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1048576).toFixed(2) + ' MB';
}
function reset() { src.value = ''; out.value = ''; rawFile = null; }
</script>

<style lang="less" scoped>@import '@/styles/mixins.less';
.img-tool { max-width: 720px; }
.row { margin: 12px 0; display: flex; align-items: center; gap: 10px; }
.lab { font-size: 13px; color: var(--tb-sub, #64748b); }
.num { width: 46px; text-align: right; font-family: ui-monospace, Menlo, monospace; }
.dim { font-size: 12.5px; color: #94a3b8; }
.tip { font-size: 12px; color: #94a3b8; line-height: 1.6; }
.empty { padding: 16px 0; text-align: center; color: #94a3b8; font-size: 13px; }
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 10px 0;
  border-top: 1px dashed var(--tb-line-dashed, #cbd5e1);
}
.stats div { display: flex; flex-direction: column; gap: 2px; align-items: center; }
.k { font-size: 12.5px; color: var(--tb-sub, #64748b); }
.stats code {
  font-family: ui-monospace, Menlo, monospace;
  font-size: 15px;
  font-weight: 600;
}
.preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: end;
  margin-top: 12px;
}
.pv { text-align: center; }
.pv img {
  max-width: 100%;
  max-height: 240px;
  border-radius: 6px;
  border: 1px solid var(--tb-line, #e2e8f0);
  display: block;
  margin: 0 auto;
}
.cap { display: block; margin-top: 4px; font-size: 12px; color: #94a3b8; }
.dl { grid-column: 1 / -1; text-align: center; }
</style>
