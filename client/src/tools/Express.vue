<template>
  <div class="express-tool">
    <el-card shadow="never">
      <template #header>快递查询</template>

      <el-alert type="warning" :closable="false" show-icon title="当前为示例数据" description="接后端后把下面 import 换成 request：GET /api/tool/express?no=&com=" />

      <div class="row">
        <el-input v-model="no" placeholder="快递单号，可试 SF1234567890 / YT7788990011" style="flex: 1" />
        <el-select v-model="com" style="width: 150px">
          <el-option v-for="c in companies" :key="c.code" :label="c.name" :value="c.code" />
        </el-select>
        <el-button type="primary" @click="query">查询</el-button>
      </div>

      <div v-if="rec" class="res">
        <div class="top">
          <el-tag :type="rec.status === '已签收' ? 'success' : 'primary'" effect="dark" size="small">
            {{ rec.status }}
          </el-tag>
          <span class="nm">{{ rec.name }}</span>
          <span class="no">{{ rec.no }}</span>
        </div>
        <el-timeline class="tl">
          <el-timeline-item
            v-for="(t, i) in rec.items"
            :key="i"
            :timestamp="t.time"
            :type="i === 0 ? 'primary' : ''"
            :hollow="i !== 0"
          >
            {{ t.text }}
          </el-timeline-item>
        </el-timeline>
      </div>
      <div v-else-if="queried" class="empty">
        没查到「{{ no }}」的轨迹（示例库里只有两个单号），换个号试试
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { expressCompanies, expressRecords } from '@/config/mockData';

defineProps({ tool: Object });
const companies = expressCompanies;
const no = ref('SF1234567890');
const com = ref('sf');
const rec = ref(null);
const queried = ref(false);

function query() {
  queried.value = true;
  rec.value = expressRecords.find(
    (r) => r.no.toUpperCase() === no.value.trim().toUpperCase() && (com.value === 'auto' || r.com === com.value)
  ) || null;
}
</script>

<style lang="less" scoped>@import '@/styles/mixins.less';
.express-tool { max-width: 720px; }
.row { margin: 14px 0; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.row :deep(.el-input) { flex: 1; min-width: 0; }
.top { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
.nm { font-size: 14px; font-weight: 600; }
.no { font-family: ui-monospace, Menlo, monospace; font-size: 12.5px; color: var(--tb-sub); }
.tl { padding-left: 4px; }
.empty { padding: 16px 0; text-align: center; color: var(--tb-sub); font-size: 13px; }
</style>
