<template>
  <div :class="s.page">
    <div :class="s.bar">
      <div>
        <h2>我的订单</h2>
        <p :class="s.sub">校园集交易闭环：下单 → 付款 → 发货 → 收货（状态机跑通后再接支付沙箱）</p>
      </div>
      <el-button type="primary" @click="$router.push('/m/idle')">去逛闲置</el-button>
    </div>

    <!-- 循环变量用 st，不能用 s：s 是本组件的样式句柄（v-for 里的 s 会把它遮蔽掉） -->
    <el-radio-group v-model="cur" :class="s.tabs" @change="page = 1">
      <el-radio-button v-for="st in orderStatus" :key="st" :value="st">
        {{ st === 'all' ? '全部' : orderStatusMap[st] }}
      </el-radio-button>
    </el-radio-group>

    <div :class="s.list">
      <div v-for="o in filtered" :key="o.id" :class="s.card">
        <div :class="s.top">
          <span :class="s.oid">{{ o.id }}</span>
          <el-tag :type="tagType(o.status)" effect="plain" size="small">{{ orderStatusMap[o.status] }}</el-tag>
        </div>
        <div :class="s.mid">
          <div :class="s.thumb">📦</div>
          <div :class="s.info">
            <div :class="s.title">{{ o.title }}</div>
            <div :class="s.meta">卖家 {{ o.seller }} · {{ o.time }}</div>
          </div>
          <div :class="s.right">
            <div :class="s.price">¥{{ o.price }}</div>
            <div :class="s.sn">物流：{{ o.sn }}</div>
          </div>
        </div>
        <div :class="s.ops">
          <!-- 取消订单改成两步：点一下变「确认取消」，再点才真取消。
               不再弹 MessageBox —— 破坏性操作就地二次确认就够了，别挡住列表 -->
          <button
            v-if="cancelId !== o.id"
            type="button"
            :class="s.btnWarn"
            @click="cancelId = o.id"
          >
            取消订单
          </button>
          <button v-else type="button" :class="[s.btnWarn, s.btnWarnOn]" @click="cancel(o)">确认取消？</button>
          <el-button v-if="o.status === 'pending'" size="small" type="primary" @click="next(o)">去付款</el-button>
          <el-button v-if="o.status === 'paid'" size="small" type="primary" @click="next(o)">提醒发货</el-button>
          <el-button v-if="o.status === 'shipping'" size="small" type="primary" @click="next(o)">确认收货</el-button>
          <el-button v-if="o.status === 'done'" size="small" type="success" plain @click="$router.push('/message')">去评价</el-button>
        </div>
      </div>

      <el-empty v-if="!filtered.length" description="这里还没有订单">
        <el-button type="primary" plain @click="$router.push('/m/idle')">去闲置市场看看</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, useCssModule } from 'vue';
import { orderStatus, orderStatusMap, orders as mockOrders } from '@/config/mockData';
import { useUiStore } from '@/stores/ui';
import { ElMessage } from 'element-plus';
// 共享原子类（CSS Modules）：s.card / s.row … 各页长得一样的外观都在这份里
import shared from '@/styles/ui.module.less';

// 一个句柄拿两类样式：ui.module.css 的共享原子类 + 本组件 @import '@/styles/mixins.less';
const s = { ...shared, ...useCssModule() };

const ui = useUiStore();
const cur = ref('all');
const page = ref(1);
// 「取消订单」的两步确认：记住当前停在确认态的那一行，切走视图就复位
const cancelId = ref(null);
// 不 map 副本，直接用 mock 数组本身：这样订单详情页 / 评价页改的状态，订单列表这里也跟着变
const orders = ref(mockOrders);

const filtered = computed(() =>
  orders.value.filter((o) => cur.value === 'all' || o.status === cur.value)
);

const flow = ['pending', 'paid', 'shipping', 'done'];

function tagType(st) {
  return { pending: 'warning', paid: '', shipping: 'primary', done: 'success' }[st] || 'info';
}

function next(o) {
  const i = flow.indexOf(o.status);
  if (i < 0 || i >= flow.length - 1) return;
  o.status = flow[i + 1];
  if (o.status === 'shipping') o.sn = '顺丰 SF' + Math.random().toString().slice(2, 8);
  ElMessage.success(`订单状态已更新为「${orderStatusMap[o.status]}」`);
}

function cancel(o) {
  o.status = 'cancelled';
  cancelId.value = null;
  ElMessage.success('已取消');
}
</script>
<style lang="less" module>@import '@/styles/mixins.less';
/* 只放「本页特有」的样式；卡片外观吃 ui.module.css，别重复抄一遍 */

.page { width: 100%; }
.bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 14px; flex-wrap: wrap; }
.bar h2 { margin: 0; font-size: 22px; }
.sub { margin: 6px 0 0; color: var(--tb-sub); font-size: 13px; }
.tabs { margin-bottom: 16px; }

.list { display: flex; flex-direction: column; gap: 14px; }
/* 订单卡：卡片外观 composes 自 tb-card，这里只写本页的内边距 */
.card { composes: tb-card from global; padding: 16px 18px; }
.top { display: flex; align-items: center; justify-content: space-between; }
.oid { font-size: 13px; color: var(--tb-sub); letter-spacing: 0.5px; }
.mid { display: flex; align-items: center; gap: 14px; margin: 14px 0 12px; }
.thumb {
  width: 60px;
  height: 60px;
  flex: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #f3f0ff, #eef6ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}
.info { flex: 1; min-width: 0; }
.title { font-weight: 600; }
.meta { font-size: 12px; color: var(--tb-sub); margin-top: 4px; }
.right { text-align: right; }
.price { color: var(--tb-primary); font-weight: 800; font-size: 18px; }
.sn { font-size: 12px; color: var(--tb-sub); margin-top: 4px; }
.ops { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; border-top: 1px solid rgba(124, 58, 237, 0.1); padding-top: 12px; }
/* 取消订单：跟 el-button size=small 同高（32px），两步确认时宽度不能突然跳 */
.btnWarn {
  height: 32px; padding: 0 14px;
  border: 1px solid var(--tb-line); border-radius: 10px;
  background: transparent; cursor: pointer;
  color: var(--tb-sub); font-size: 12.5px; font-weight: 600;
  transition: 0.18s;
}
.btnWarn:hover { color: #f43f5e; border-color: rgba(244, 63, 94, 0.45); }
.btnWarnOn {
  color: #f43f5e;
  border-color: #f43f5e;
  background: rgba(244, 63, 94, 0.08);
}

@media (max-width: 900px) {
  .page { max-width: 100%; }
  .card { padding: 13px 14px; }
  /* 手机上缩略图 + 标题 + 价格并排挤爆，价格换到标题下面 */
  .mid { flex-wrap: wrap; gap: 10px; margin: 12px 0 10px; }
  .right { width: 100%; text-align: left; margin-left: 50px; }
  .price { font-size: 16px; }
  .sn { margin-top: 2px; }
  .ops { justify-content: flex-start; }
  /* el-button 是子组件根节点，module 作用域下要用 :global 穿透
     （写 :deep(.el-button) 会被连类名一起哈希成假类名） */
  .ops :global(.el-button) { flex: 1; min-width: 96px; }
}
</style>
