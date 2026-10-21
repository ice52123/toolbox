<template>
  <div class="oil-tool">
    <el-card shadow="never">
      <template #header>今日油价</template>

      <el-alert type="warning" :closable="false" show-icon title="当前为示例数据（非实时行情）" description="接后端后把下面 import 换成 request：GET /api/tool/oil" />

      <div class="row">
        <el-input v-model="kw" placeholder="搜城市，如「北京」「四川」" style="flex: 1" />
        <el-button type="primary" @click="filterList">查询</el-button>
      </div>

      <div class="head">
        <span>地区</span><span class="c">92 号</span><span class="c">95 号</span><span class="c">98 号</span><span class="c">较上期</span>
      </div>
      <div v-for="r in list" :key="r.city" class="tr">
        <span class="city">{{ r.city }}</span>
        <span class="c">{{ r.p92 }}</span>
        <span class="c">{{ r.p95 }}</span>
        <span class="c">{{ r.p98 }}</span>
        <span class="c">{{ r.d0 }}</span>
      </div>

      <div class="foot">单位：元/升 · 括号内为该地区相对上一轮调价的变化</div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { oilPrices } from '@/config/mockData';

defineProps({ tool: Object });
const kw = ref('');
const list = ref(oilPrices.items);

function filterList() {
  const k = kw.value.trim();
  list.value = k
    ? oilPrices.items.filter((x) => x.city.includes(k))
    : oilPrices.items;
}
</script>

<style lang="less" scoped>@import '@/styles/mixins.less';
.oil-tool { max-width: 720px; }
.row { margin: 14px 0; display: flex; align-items: center; gap: 10px; }
.row :deep(.el-input) { flex: 1; min-width: 0; }
.head, .tr {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr 1.2fr;
  gap: 6px;
  padding: 8px 4px;
  font-size: 13.5px;
}
.head {
  border-bottom: 1px solid var(--tb-line, #e2e8f0);
  color: var(--tb-sub, #64748b);
  font-size: 12.5px;
}
.tr:nth-child(even) { background: rgba(0, 0, 0, 0.015); }
.tr .city { font-weight: 600; }
.tr .c {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  text-align: center;
}
.tr .c:last-child { color: var(--tb-ok); }
.foot { margin-top: 12px; font-size: 12px; color: var(--tb-sub); }
</style>
