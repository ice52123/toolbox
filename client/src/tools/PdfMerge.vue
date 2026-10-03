<template>
  <div class="pdf-tool">
    <el-card shadow="never">
      <template #header>PDF 合并</template>

      <el-upload
        :auto-upload="false"
        multiple
        accept="application/pdf"
        :on-change="onPick"
        :show-file-list="false"
      >
        <el-button type="primary">选择 PDF</el-button>
        <template #tip><div class="tip">可多选，合并顺序按下面列表从上到下</div></template>
      </el-upload>

      <ul v-if="files.length" class="fl">
        <li v-for="(f, i) in files" :key="f.uid">
          <span class="ix">{{ i + 1 }}</span>
          <span class="nm" :title="f.name">{{ f.name }}</span>
          <code class="sz">{{ sizeText(f.size) }}</code>
          <el-button link :icon="Top" :disabled="i === 0" @click="mv(i, -1)">上移</el-button>
          <el-button link :icon="Bottom" :disabled="i === files.length - 1" @click="mv(i, 1)">下移</el-button>
          <el-button link type="danger" @click="del(i)">移除</el-button>
        </li>
      </ul>

      <div v-if="files.length" class="row">
        <el-button type="primary" :loading="busy" @click="run">合并（{{ files.length }} 个）</el-button>
        <el-button text @click="clearAll">全部清空</el-button>
      </div>

      <div v-if="out" class="done">
        <div class="lab">已生成，点下面按钮下载</div>
        <a class="dl" :href="out" :download="fileName">下载 {{ fileName }}</a>
      </div>

      <div v-else-if="!files.length" class="empty">还没有选文件</div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Top, Bottom } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

defineProps({ tool: Object });
const files = ref([]);
const out = ref('');
const fileName = ref('merged.pdf');
const busy = ref(false);

function onPick(file) {
  if (file.raw && file.raw.type === 'application/pdf') {
    files.value.push({ uid: file.uid, name: file.name, size: file.size, raw: file.raw });
  } else {
    ElMessage.warning('只能选择 PDF 文件');
  }
  out.value = '';
}
function mv(i, d) {
  const j = i + d;
  [files.value[i], files.value[j]] = [files.value[j], files.value[i]];
}
function del(i) { files.value.splice(i, 1); }
function clearAll() { files.value = []; out.value = ''; }
function sizeText(n) {
  return n < 1048576 ? (n / 1024).toFixed(0) + ' KB' : (n / 1048576).toFixed(2) + ' MB';
}

async function run() {
  if (!files.value.length) return;
  busy.value = true;
  try {
    // pdf-lib 按需加载，别进主包
    const { PDFDocument } = await import('pdf-lib');
    const merged = await PDFDocument.create();
    for (const f of files.value) {
      const src = await PDFDocument.load(await f.raw.arrayBuffer());
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
    }
    const bytes = await merged.save();
    fileName.value = 'merged-' + files.value.length + 'files.pdf';
    out.value = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  } catch (e) {
    ElMessage.error('合并失败：' + e.message);
  } finally {
    busy.value = false;
  }
}
</script>

<style lang="less" scoped>@import '@/styles/mixins.less';
.pdf-tool { max-width: 720px; }
.row { margin: 14px 0; display: flex; align-items: center; gap: 10px; }
.tip { font-size: 12px; color: #94a3b8; line-height: 1.6; }
.fl {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  display: grid;
  gap: 2px;
  border: 1px solid var(--tb-line, #e2e8f0);
  border-radius: 6px;
  overflow: hidden;
}
.fl li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  font-size: 13px;
  &:nth-child(odd) { background: rgba(0, 0, 0, 0.015); }
}
.ix {
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  border-radius: 50%;
  background: var(--tb-primary);
  color: #fff;
  font-size: 11.5px;
  line-height: 20px;
  text-align: center;
}
.nm { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sz { color: #94a3b8; font-size: 12px; font-family: ui-monospace, Menlo, monospace; }
.done { padding: 12px; border-radius: 6px; background: var(--tb-ok-soft, #f0fdf4); border: 1px solid rgba(22, 163, 74, 0.2); }
.lab { font-size: 12.5px; color: #64748b; margin-bottom: 6px; }
.dl { font-weight: 600; color: #15803d; }
.empty { padding: 16px 0; text-align: center; color: #94a3b8; font-size: 13px; }
</style>
