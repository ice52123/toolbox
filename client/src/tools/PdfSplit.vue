<template>
  <div class="pdf-tool">
    <el-card shadow="never">
      <template #header>PDF 拆分 / 提取</template>

      <el-upload
        :auto-upload="false"
        :show-file-list="false"
        accept="application/pdf"
        :on-change="onPick"
      >
        <el-button type="primary">选择 PDF</el-button>
        <template #tip><div class="tip">先看总页数，再决定拆哪几页</div></template>
      </el-upload>

      <template v-if="file">
        <div class="meta">共 <b>{{ total }}</b> 页 · {{ file.name }}</div>

        <div class="row">
          <span class="lab">方式</span>
          <el-radio-group v-model="mode">
            <el-radio-button value="range">按页范围提取</el-radio-button>
            <el-radio-button value="each">逐页拆分</el-radio-button>
          </el-radio-group>
        </div>

        <div v-if="mode === 'range'" class="row">
          <el-input v-model="range" style="flex: 1" placeholder="如：1-3,5,7-9（从 1 开始，留空=全选）" />
        </div>

        <div class="row">
          <el-button type="primary" :loading="busy" @click="run">开始</el-button>
          <el-button text @click="reset">换文件</el-button>
        </div>

        <div v-if="result.length" class="done">
          <div class="lab">共 {{ result.length }} 个文件</div>
          <ul>
            <li v-for="r in result" :key="r.name">
              <span>{{ r.name }}</span>
              <el-button link type="primary" :href="r.url" :download="r.name">下载</el-button>
            </li>
          </ul>
        </div>
      </template>

      <div v-else class="empty">还没有选文件</div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

defineProps({ tool: Object });
const file = ref(null);
const total = ref(0);
const mode = ref('range');
const range = ref('1-3');
const busy = ref(false);
const result = ref([]);

function onPick(f) {
  if (f.raw && f.raw.type === 'application/pdf') {
    file.value = f.raw;
    total.value = 0;
    result.value = [];
  } else {
    ElMessage.warning('只能选择 PDF 文件');
  }
}

function reset() { file.value = null; result.value = []; total.value = 0; }

// 解析 "1-3,5,7-9" → [0,1,2,4,6,7,8]（转 0 基）
function parseRange(s, max) {
  const out = new Set();
  for (const part of String(s).split(/[,\s]+/).filter(Boolean)) {
    const [a, b] = part.split('-').map((x) => parseInt(x, 10));
    if (Number.isNaN(a)) continue;
    const end = Number.isNaN(b) ? a : b;
    for (let i = Math.max(1, a); i <= Math.min(max, end); i++) out.add(i);
  }
  return [...out].sort((x, y) => x - y).map((n) => n - 1);
}

async function run() {
  if (!file.value) return;
  busy.value = true;
  result.value = [];
  try {
    const { PDFDocument } = await import('pdf-lib');
    const srcDoc = await PDFDocument.load(await file.value.arrayBuffer());
    total.value = srcDoc.getPageCount();
    const srcPdfBytes = await srcDoc.save(); // 留底，避免多次 save 反复解码

    if (mode.value === 'range') {
      const idx = parseRange(range.value, total.value);
      if (!idx.length) { ElMessage.warning('没有解析到有效页码'); return; }
      const doc = await PDFDocument.load(srcPdfBytes);
      const picked = await doc.copyPages(srcDoc, idx);
      picked.forEach((p) => doc.addPage(p));
      result.value = [{
        name: 'extracted-' + idx.length + 'p.pdf',
        url: URL.createObjectURL(new Blob([await doc.save()], { type: 'application/pdf' }))
      }];
    } else {
      const doc = await PDFDocument.load(srcPdfBytes);
      for (let i = 0; i < total.value; i++) {
        const one = await PDFDocument.create();
        const [p] = await one.copyPages(doc, [i]);
        one.addPage(p);
        result.value.push({
          name: `page-${String(i + 1).padStart(2, '0')}.pdf`,
          url: URL.createObjectURL(new Blob([await one.save()], { type: 'application/pdf' }))
        });
      }
    }
  } catch (e) {
    ElMessage.error('处理失败：' + e.message);
  } finally {
    busy.value = false;
  }
}
</script>

<style lang="less" scoped>@import '@/styles/mixins.less';
.pdf-tool { max-width: 720px; }
.row { margin: 14px 0; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.lab { font-size: 13px; color: var(--tb-sub, #64748b); }
.row :deep(.el-input) { flex: 1; min-width: 0; }
.tip { font-size: 12px; color: #94a3b8; line-height: 1.6; }
.meta { margin-top: 12px; font-size: 13px; color: var(--tb-sub, #64748b); }
.meta b { color: var(--tb-primary); }
.done {
  margin-top: 14px;
  padding: 12px;
  border-radius: 6px;
  background: var(--tb-ok-soft, #f0fdf4);
  border: 1px solid rgba(22, 163, 74, 0.2);
}
.lab { display: block; margin-bottom: 6px; font-size: 12.5px; color: #64748b; }
.done ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.done li { display: flex; align-items: center; gap: 10px; font-size: 13px; }
.done li span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.empty { padding: 16px 0; text-align: center; color: #94a3b8; font-size: 13px; }
</style>
