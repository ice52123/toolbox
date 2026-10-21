<template>
  <el-card shadow="never" v-loading="loading">
    <div class="bar">
      <el-button text :icon="ArrowLeft" @click="back">返回</el-button>
      <span class="title">我的订单</span>
    </div>

    <el-empty v-if="!loading && !orders.length" description="还没有订单，去逛逛吧">
      <el-button type="primary" @click="$router.push('/list')">去逛逛</el-button>
    </el-empty>

    <div v-else class="list">
      <div
        v-for="o in orders"
        :key="o.id"
        class="item"
        @click="$router.push('/order/detail/' + o.id)"
      >
        <div class="thumb">
          <el-image v-if="o.image" :src="o.image" fit="cover" />
          <div v-else class="thumb ph">{{ emojiOf(o.cat) }}</div>
        </div>
        <div class="info">
          <div class="line1">
            <span class="name">{{ o.title }}</span>
            <el-tag :type="statusType(o.status)" effect="light" size="small">
              {{ statusText(o.status) }}
            </el-tag>
          </div>
          <div class="line2">¥{{ o.price }} · {{ o.way }} · {{ fmtTime(o.createdAt) }}</div>
          <div class="line3" v-if="o.logistics.length">
            最新：{{ o.logistics[o.logistics.length - 1].text }}
          </div>
        </div>
        <div class="amount">¥{{ o.amount }}</div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';
import { emojiOf, ORDER_STATUS } from '@/store';
import { listOrders } from '@/api';

const router = useRouter();
const loading = ref(true);
const orders = ref([]);

// 状态文案 / 颜色统一走 store 里的字典，跟订单详情页保持一致
const statusText = (s) => ORDER_STATUS[s]?.text || s;
const statusType = (s) => ORDER_STATUS[s]?.type || 'info';

function fmtTime(t) {
  const d = new Date(t);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function back() {
  if (window.history.length > 1) router.back();
  else router.push('/list');
}

async function load() {
  loading.value = true;
  try {
    orders.value = await listOrders();
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.bar { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.title { font-weight: 700; font-size: 16px; color: var(--im-fg); }
.list { display: flex; flex-direction: column; gap: 12px; }
.item {
  display: flex;
  gap: 14px;
  align-items: center;
  background: var(--im-surface);
  border: 1px solid var(--im-line);
  border-radius: 14px;
  padding: 12px 14px;
  cursor: pointer;
  transition: border-color 0.15s;
}
.item:hover { border-color: var(--im-brand-soft); }
.thumb {
  width: 72px;
  height: 72px;
  flex: none;
  border-radius: 12px;
  overflow: hidden;
  background: var(--im-tint);
}
.thumb :deep(img) { width: 100%; height: 100%; }
.thumb.ph { display: flex; align-items: center; justify-content: center; font-size: 34px; }
.info { flex: 1; min-width: 0; }
.line1 { display: flex; align-items: center; gap: 8px; }
.name {
  font-weight: 600;
  color: var(--im-fg);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.line2 { color: var(--im-fg-soft); font-size: 13px; margin-top: 4px; }
.line3 {
  color: var(--im-fg-mute);
  font-size: 12px;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.amount { color: var(--im-brand); font-weight: 800; font-size: 18px; flex: none; }

@media (max-width: 900px) {
  .name { font-size: 14px; }
  .thumb { width: 60px; height: 60px; font-size: 28px; }
  .amount { font-size: 16px; }
}
</style>
