<template>
  <div class="uuid-tool">
    <el-card shadow="never">
      <template #header>UUID 生成</template>
      <div class="row">
        <span class="lab">数量</span>
        <el-input-number v-model="count" :min="1" :max="200" />
        <el-button type="primary" @click="gen">生成</el-button>
        <el-button text @click="copyAll">复制全部</el-button>
        <el-button text @click="clear">清空</el-button>
      </div>

      <ul v-if="list.length" class="list">
        <li v-for="(u, i) in list" :key="i">
          <code>{{ u }}</code>
          <el-button link type="primary" @click="copy(u)">复制</el-button>
        </li>
      </ul>
      <div v-else class="empty">点「生成」批量拿 UUID v4</div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

defineProps({ tool: Object });
const count = ref(5);
const list = ref([]);

// crypto.randomUUID 只在安全上下文（https / localhost）可用，
// 局域网 http 访问会没有，所以留一条手写 v4 的兜底。
function v4() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function gen() {
  list.value = Array.from({ length: count.value }, v4);
}
function clear() { list.value = []; }
function copy(v) {
  navigator.clipboard?.writeText(v).catch(() => {});
  ElMessage.success('已复制');
}
function copyAll() {
  if (!list.value.length) return;
  navigator.clipboard?.writeText(list.value.join('\n')).catch(() => {});
  ElMessage.success('已复制 ' + list.value.length + ' 条');
}
</script>

<style lang="less" scoped>@import '@/styles/mixins.less';
.uuid-tool { max-width: 640px; }
.row { margin: 12px 0; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.lab { font-size: 13px; color: var(--tb-sub, #64748b); }
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 2px;
  max-height: 380px;
  overflow: auto;
}
.list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 4px;
  &:hover { background: rgba(0, 0, 0, 0.03); }
}
.list code {
  flex: 1;
  min-width: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
}
.empty { padding: 18px 0; text-align: center; color: #94a3b8; font-size: 13px; }
</style>
