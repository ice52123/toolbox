<template>
  <div class="bus-tool">
    <el-card shadow="never">
      <template #header>公交 / 地铁查询</template>

      <el-alert type="warning" :closable="false" show-icon title="当前为示例数据" description="接后端后把下面 import 换成 request：GET /api/tool/bus?city=&kw=" />

      <div class="row">
        <el-select v-model="city" style="width: 130px">
          <el-option v-for="c in cities" :key="c" :label="c" :value="c" />
        </el-select>
        <el-input v-model="kw" placeholder="线路名，如「1 号线」「332」" style="flex: 1" />
        <el-button type="primary" @click="filterList">查询</el-button>
      </div>

      <div v-if="list.length" class="lines">
        <div v-for="l in list" :key="l.city + l.name" class="ln">
          <div class="lh">
            <span class="n">{{ l.name }}</span>
            <span class="rt">{{ l.from }} ⇄ {{ l.to }}</span>
          </div>
          <el-collapse>
            <el-collapse-item>
              <template #title>共 {{ l.stops.length }} 站</template>
              <div class="stops">
                <span v-for="(s, i) in l.stops" :key="i" class="stop">
                  {{ s }}<i v-if="i < l.stops.length - 1">·</i>
                </span>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
      <div v-else class="empty">没有匹配线路，换个关键词试试</div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { busCities, busLines } from '@/config/mockData';

defineProps({ tool: Object });
const cities = busCities;
const city = ref('北京');
const kw = ref('');
const list = ref([]);

function filterList() {
  const k = kw.value.trim();
  list.value = busLines.filter(
    (x) => x.city === city.value && (!k || x.name.includes(k) || x.stops.some((s) => s.includes(k)))
  );
}
filterList();
</script>

<style lang="less" scoped>@import '@/styles/mixins.less';
.bus-tool { max-width: 720px; }
.row { margin: 14px 0; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.row :deep(.el-input) { flex: 1; min-width: 0; }
.lines { display: grid; gap: 10px; }
.ln {
  border: 1px solid var(--tb-line, #e2e8f0);
  border-radius: 6px;
  overflow: hidden;
}
.lh {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid var(--tb-line, #e2e8f0);
}
.n { font-size: 14px; font-weight: 700; color: var(--tb-primary); }
.rt { font-size: 12.5px; color: var(--tb-sub, #64748b); }
.stops { padding: 4px 2px; font-size: 13px; line-height: 1.9; }
.stop i { font-style: normal; color: #cbd5e1; margin: 0 4px; }
.empty { padding: 16px 0; text-align: center; color: #94a3b8; font-size: 13px; }
</style>
