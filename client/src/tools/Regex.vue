<template>
  <div class="regex-tool">
    <el-card shadow="never">
      <template #header>正则匹配测试</template>
      <div class="row">
        <el-input v-model="pattern" placeholder="正则表达式，如 ^(\d{3})-(\d{4})$" />
        <span class="lab">/</span>
        <el-input v-model="flags" style="width: 96px" placeholder="gims" />
        <span class="lab">/</span>
      </div>

      <el-input
        v-model="subject"
        type="textarea"
        :rows="6"
        placeholder="待匹配的目标文本…"
      />

      <div class="row">
        <el-button type="primary" :disabled="!valid" @click="run">匹配</el-button>
        <el-button text @click="clear">清空</el-button>
        <span class="msg" :class="msgType">{{ msg }}</span>
      </div>

      <el-alert v-if="!valid" type="error" :closable="false" :title="'正则非法：' + err" show-icon />

      <template v-if="matches.length">
        <div class="stat">共 <b>{{ matches.length }}</b> 处匹配</div>
        <el-table :data="matches" size="small" max-height="280">
          <el-table-column prop="index" label="#" width="56" />
          <el-table-column label="命中" min-width="180">
            <template #default="{ row }"><code class="hit">{{ row.text }}</code></template>
          </el-table-column>
          <el-table-column label="位置" min-width="120">
            <template #default="{ row }">{{ row.index }} – {{ row.index + row.text.length }}</template>
          </el-table-column>
          <el-table-column label="捕获组" min-width="180">
            <template #default="{ row }">
              <span v-if="!row.groups.length" class="dim">无</span>
              <span v-for="(g, i) in row.groups" :key="i" class="grp">{{ g }}</span>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

defineProps({ tool: Object });
const pattern = ref('');
const flags = ref('g');
const subject = ref('');
const matches = ref([]);
const msg = ref('');
const msgType = ref('');
const err = ref('');

// 非法标志位直接判死，避免 new RegExp 抛错
const valid = computed(() => {
  if (!pattern.value) return true;
  try { new RegExp(pattern.value, flags.value); return true; }
  catch (e) { err.value = e.message; return false; }
});
const canRun = computed(() => valid.value && !!pattern.value);

function run() {
  matches.value = [];
  msg.value = '';
  if (!pattern.value) { msg.value = '请输入正则'; return; }
  if (!subject.value) { msg.value = '请输入待匹配文本'; return; }
  try {
    const f = flags.value.replace(/[gy]/g, '') + 'g'; // 强制 go 模式好找全部匹配
    const re = new RegExp(pattern.value, f);
    const list = [];
    let m;
    while ((m = re.exec(subject.value)) !== null) {
      list.push({
        text: m[0],
        index: m.index,
        groups: m.slice(1)
      });
      if (m[0] === '') re.lastIndex++; // 零宽匹配会死循环
      if (list.length >= 500) break;
    }
    matches.value = list;
    msg.value = list.length ? '匹配完成' : '无匹配结果';
    msgType.value = list.length ? 'ok' : '';
  } catch (e) {
    msg.value = '匹配失败：' + e.message;
    msgType.value = 'err';
  }
}

function clear() { pattern.value = ''; subject.value = ''; matches.value = []; msg.value = ''; }
</script>

<style lang="less" scoped>@import '@/styles/mixins.less';
.regex-tool { max-width: 760px; }
.row { margin: 12px 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.lab { font-family: ui-monospace, Menlo, monospace; font-size: 15px; color: var(--tb-sub, #64748b); }
.row :deep(.el-input) { flex: 1; min-width: 0; }
.msg.ok { color: #16a34a; }
.msg.err { color: #dc2626; }
.stat { margin: 12px 0 8px; font-size: 13.5px; color: var(--tb-sub, #64748b); }
.hit { font-family: ui-monospace, Menlo, monospace; font-size: 13px; color: var(--tb-primary); }
.dim { color: #94a3b8; }
.grp {
  display: inline-block;
  margin-right: 6px;
  padding: 1px 7px;
  border-radius: 4px;
  background: var(--tb-ok-soft, #f0fdf4);
  color: #15803d;
  font-family: ui-monospace, Menlo, monospace;
  font-size: 12.5px;
}
</style>
