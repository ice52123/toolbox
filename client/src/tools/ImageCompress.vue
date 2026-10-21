<template>
  <div class="img-tool">
    <el-card shadow="never">
      <template #header>图片压缩</template>

      <el-upload
        :auto-upload="false"
        :show-file-list="false"
        accept="image/*"
        :on-change="onPick"
      >
        <el-button type="primary">选择图片</el-button>
        <template #tip><div class="tip">全程浏览器本地处理，不上传服务器</div></template>
      </el-upload>

      <template v-if="src">
        <div class="row">
          <span class="lab">质量</span>
          <el-slider v-model="quality" :min="10" :max="100" style="flex: 1" />
          <span class="num">{{ quality }}%</span>
        </div>
        <div class="row">
          <span class="lab">最长边</span>
          <el-input-number v-model="maxSide" :min="0" :step="50" />
          <span class="dim">0 = 不缩放</span>
        </div>
        <div class="row">
          <el-button type="primary" :loading="busy" @click="run">压缩</el-button>
          <el-button text @click="reset">换图</el-button>
        </div>

        <div v-if="out" class="stats">
          <div><span class="k">原图</span><code>{{ sizeText(srcSize) }}</code></div>
          <div><span class="k">压缩后</span><code class="g">{{ sizeText(outSize) }}</code></div>
          <div><span class="k">节省</span><code class="g">{{ saved }}%</code></div>
        </div>

        <div v-if="out" class="preview">
          <div class="pv">
            <img :src="src" alt="原图" />
            <span class="cap">原图</span>
          </div>
          <div class="pv">
            <img :src="out" alt="压缩后" />
            <span class="cap">压缩后</span>
          </div>
          <a v-if="out" class="dl" :href="out" :download="fileName">下载压缩图</a>
        </div>
      </template>

      <div v-else class="empty">还没有选图</div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({ tool: Object });
const src = ref('');
const srcSize = ref(0);
const out = ref('');
const outSize = ref(0);
const saved = ref(0);
const quality = ref(70);
const maxSide = ref(0);
const busy = ref(false);
const fileName = ref('compressed');
let rawFile = null;

function loadImg(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = reject;
    img.src = url;
  });
}

async function onPick(file, fList) {
  rawFile = file.raw;
  fileName.value = (file.name || 'image').replace(/\.[^.]+$/, '') + '-compressed';
  srcSize.value = file.size || 0;
  out.value = '';
  outSize.value = 0;
  saved.value = 0;
  const { img } = await loadImg(file.raw);
  src.value = img.src;
}

async function run() {
  if (!rawFile) return;
  busy.value = true;
  try {
    const url = URL.createObjectURL(rawFile);
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (maxSide.value > 0 && Math.max(w, h) > maxSide.value) {
      const k = maxSide.value / Math.max(w, h);
      w = Math.round(w * k);
      h = Math.round(h * k);
    }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality.value / 100));
    outSize.value = blob.size;
    saved.value = srcSize.value ? Math.max(0, Math.round((1 - blob.size / srcSize.value) * 100)) : 0;
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
.dim { font-size: 12.5px; color: var(--tb-sub); }
.tip { font-size: 12px; color: var(--tb-sub); line-height: 1.6; }
.empty { padding: 16px 0; text-align: center; color: var(--tb-sub); font-size: 13px; }
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
.stats code.g { color: var(--tb-ok); }
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
.cap { display: block; margin-top: 4px; font-size: 12px; color: var(--tb-sub); }
.dl { grid-column: 1 / -1; text-align: center; }
</style>
