<template>
  <div class="img-tool">
    <el-card shadow="never">
      <template #header>图片水印</template>

      <el-upload
        :auto-upload="false"
        :show-file-list="false"
        accept="image/*"
        :on-change="onPick"
      >
        <el-button type="primary">选择图片</el-button>
        <template #tip><div class="tip">文字水印，浏览器本地合成，原图不会被动</div></template>
      </el-upload>

      <template v-if="src">
        <div class="row">
          <el-input v-model="text" style="flex: 1" placeholder="水印文字，如「内部资料」" maxlength="60" />
        </div>
        <div class="row">
          <span class="lab">位置</span>
          <el-radio-group v-model="pos">
            <el-radio-button v-for="p in POS" :key="p.v" :value="p.v">{{ p.t }}</el-radio-button>
          </el-radio-group>
        </div>
        <div class="row">
          <span class="lab">大小</span>
          <el-slider v-model="size" :min="12" :max="120" style="flex: 1" />
          <span class="num">{{ size }}</span>
        </div>
        <div class="row">
          <span class="lab">透明度</span>
          <el-slider v-model="opacity" :min="5" :max="100" style="flex: 1" />
          <span class="num">{{ opacity }}%</span>
        </div>
        <div class="row">
          <span class="lab">颜色</span>
          <el-color-picker v-model="color" />
          <span class="lab">描边（暗底更清晰）</span>
          <el-switch v-model="stroke" />
        </div>
        <div class="row">
          <el-button type="primary" :loading="busy" @click="run">生成水印</el-button>
          <el-button text @click="reset">换图</el-button>
        </div>

        <div v-if="out" class="preview">
          <div class="pv"><img :src="src" alt="原图" /><span class="cap">原图</span></div>
          <div class="pv"><img :src="out" alt="加水印" /><span class="cap">加水印</span></div>
          <a class="dl" :href="out" :download="fileName">下载</a>
        </div>
      </template>

      <div v-else class="empty">还没有选图</div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({ tool: Object });
const POS = [
  { t: '左上', v: 'tl' }, { t: '中上', v: 'tc' }, { t: '右上', v: 'tr' },
  { t: '左中', v: 'ml' }, { t: '居中', v: 'mc' }, { t: '右中', v: 'mr' },
  { t: '左下', v: 'bl' }, { t: '中下', v: 'bc' }, { t: '右下', v: 'br' }
];

const src = ref('');
const out = ref('');
const fileName = ref('watermarked');
const text = ref('内部资料');
const pos = ref('br');
const size = ref(36);
const opacity = ref(45);
const color = ref('#ffffff');
const stroke = ref(true);
const busy = ref(false);
let rawFile = null;

function onPick(file) {
  rawFile = file.raw;
  fileName.value = (file.name || 'image').replace(/\.[^.]+$/, '') + '-wm';
  out.value = '';
  src.value = URL.createObjectURL(file.raw);
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
    ctx.drawImage(img, 0, 0);

    const pad = Math.round(canvas.width * 0.04) + 8;
    ctx.font = `600 ${size.value}px system-ui, -apple-system, "PingFang SC", sans-serif`;
    ctx.textBaseline = 'top';
    ctx.globalAlpha = opacity.value / 100;
    ctx.textAlign = pos.value[1] === 'c' ? 'center'
      : pos.value[1] === 'l' ? 'left' : 'right';
    const x = pos.value[1] === 'l' ? pad : pos.value[1] === 'r' ? canvas.width - pad : canvas.width / 2;
    const y = pos.value[0] === 't' ? pad : pos.value[0] === 'c' ? canvas.height / 2 : canvas.height - pad;

    if (stroke.value) {
      ctx.strokeStyle = 'rgba(0,0,0,.45)';
      ctx.lineWidth = Math.max(2, Math.round(size.value / 12));
      ctx.strokeText(text.value, x, y);
    }
    ctx.fillStyle = color.value;
    ctx.fillText(text.value, x, y);
    ctx.globalAlpha = 1;

    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    out.value = URL.createObjectURL(blob);
  } finally {
    busy.value = false;
  }
}

function reset() { src.value = ''; out.value = ''; rawFile = null; }
</script>

<style lang="less" scoped>@import '@/styles/mixins.less';
.img-tool { max-width: 720px; }
.row { margin: 12px 0; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.lab { font-size: 13px; color: var(--tb-sub, #64748b); }
.num { width: 46px; text-align: right; font-family: ui-monospace, Menlo, monospace; }
.tip { font-size: 12px; color: var(--tb-sub); line-height: 1.6; }
.empty { padding: 16px 0; text-align: center; color: var(--tb-sub); font-size: 13px; }
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
  max-height: 280px;
  border-radius: 6px;
  border: 1px solid var(--tb-line, #e2e8f0);
  display: block;
  margin: 0 auto;
}
.cap { display: block; margin-top: 4px; font-size: 12px; color: var(--tb-sub); }
.dl { grid-column: 1 / -1; text-align: center; }
</style>
