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
          <span :class="s.oid">
            {{ o.id }}
            <el-tag v-if="o.local" :class="s.srcTag" type="warning" effect="plain" size="small">闲置市场</el-tag>
          </span>
          <el-tag :type="tagType(o.status)" effect="plain" size="small">{{ orderStatusMap[o.status] }}</el-tag>
        </div>
        <div :class="s.mid">
          <div :class="s.thumb">📦</div>
          <div :class="s.info">
            <div :class="s.title">{{ o.title }}</div>
            <div :class="s.meta">{{ roleText(o) }} · {{ o.time }}</div>
          </div>
          <div :class="s.right">
            <div :class="s.price">¥{{ o.price }}</div>
            <div :class="s.sn">物流：{{ o.sn }}</div>
          </div>
        </div>
        <div :class="s.ops">
          <!-- 闲置市场的模拟单：主站后端不认识它，操作一律交给子应用（那边有物流时间线） -->
          <el-button
            v-if="o.local"
            size="small"
            type="primary"
            plain
            @click="$router.push('/m/idle/order/detail/' + o.id)"
          >
            查看订单 / 物流
          </el-button>
          <!-- 取消订单改成两步：点一下变「确认取消」，再点才真取消。
               不再弹 MessageBox —— 破坏性操作就地二次确认就够了，别挡住列表。
               ⚠️ 必须卡 status === 'pending'：后端只允许取消待付款的单，
               以前这颗按钮无条件渲染，已取消/已完成的单也照常显示，
               点下去后端回 400，页面顶部直接弹一条英文报错。
               模拟单（o.local）的操作按钮全部让位给上面那颗，绝不碰后端接口。 -->
          <template v-if="!o.local && o.status === 'pending'">
            <button
              v-if="cancelId !== o.id"
              type="button"
              :class="s.btn"
              @click="cancelId = o.id"
            >
              取消订单
            </button>
            <button v-else type="button" :class="[s.btn, s.btnOn]" @click="cancel(o)">确认取消？</button>
          </template>
          <!-- 已取消的订单：没有后续动作，给颗不可点的状态胶囊，别让操作区空着 -->
          <span v-if="!o.local && o.status === 'cancel'" :class="s.doneTag">已取消</span>

          <template v-if="!o.local && o.status !== 'cancel'">
            <el-button v-if="o.status === 'pending'" size="small" type="primary" @click="next(o)">去付款</el-button>
            <el-button v-if="o.status === 'paid'" size="small" type="primary" @click="next(o)">提醒发货</el-button>
            <el-button v-if="o.status === 'shipping'" size="small" type="primary" @click="next(o)">确认收货</el-button>
            <!-- 已评价的不再给「去评价」入口：点进去只会看到「找不到这张订单」，反而像坏了。
                 换成不可点的「已评价」胶囊，明确告诉用户这单已经评过了 -->
            <span v-if="o.status === 'done' && o.reviewed" :class="s.doneTag">已评价</span>
            <el-button v-else-if="o.status === 'done'" size="small" type="success" plain @click="$router.push('/order/' + o.id + '/review')">去评价</el-button>
          </template>
        </div>
      </div>

      <el-empty v-if="!filtered.length" description="这里还没有订单">
        <el-button type="primary" plain @click="$router.push('/m/idle')">去闲置市场看看</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, useCssModule } from 'vue';
import { orderStatus, orderStatusMap } from '@/config/mockData';
import request from '@/utils/request';
import { fromNow } from '@/utils/format';
import { idleOrdersAsMain } from '@/utils/idleOrders';
import { useUiStore } from '@/stores/ui';
import { ElMessage } from 'element-plus';
// 共享原子类（CSS Modules）：s.card / s.row … 各页长得一样的外观都在这份里
import shared from '@/styles/ui.module.less';

// 一个句柄拿两类样式：ui.module.css 的共享原子类 + 本组件 @import '@/styles/mixins.less';
const s = { ...shared, ...useCssModule() };

const ui = useUiStore();
const myId = Number(localStorage.getItem('tb_id')) || 0;
const cur = ref('all');
const page = ref(1);
// 「取消订单」的两步确认：记住当前停在确认态的那一行，切走视图就复位
const cancelId = ref(null);
// 订单来自后端 /orders（买家/卖家都看得到，后端已按 user 过滤）
const orders = ref([]);

// 后端已按状态过滤，这里直接渲染返回结果
const filtered = computed(() => orders.value);

function tagType(st) {
  return { pending: 'warning', paid: '', shipping: 'primary', done: 'success', cancel: 'info' }[st] || 'info';
}

// 闲置市场下的模拟单：后端不知道它们的存在，从同源 localStorage 读出来自己过滤。
// 接真实下单接口后可以删掉这段，直接看后端返回即可（见 utils/idleOrders.js 顶部说明）。
function idleOrders() {
  const all = idleOrdersAsMain({ withTime: fromNow });
  return cur.value === 'all' ? all : all.filter((o) => o.status === cur.value);
}

async function loadOrders() {
  // 模拟单先落位：就算后端挂了，它们也还能看到，不至于整页空着
  const locals = idleOrders();
  try {
    const params = cur.value !== 'all' ? { status: cur.value } : {};
    const rows = await request.get('/orders', { params });
    orders.value = [
      ...locals,
      ...(rows || []).map((o) => ({
        id: o.id,
        title: o.title,
        price: o.price,
        status: o.status,
        // 后端 LEFT JOIN order_reviews 给的：已评价的不能再显示「去评价」
        reviewed: !!o.reviewed,
        // 角色文案用后端拍平的真实昵称（seller_name / buyer_name），不再显示「对方同学」
        seller: o.seller_name,
        buyer: o.buyer_name,
        isSeller: o.seller_id === myId,
        time: fromNow(o.created_at),
        sn: orderStatusMap[o.status] || ''
      }))
    ];
  } catch (e) {
    console.error('[ Orders ] 加载订单失败：', e);
    orders.value = locals;
  }
}

// 我买到的 / 我卖出的 —— 后端已带上双方昵称，这里只决定前缀用哪个
function roleText(o) {
  return o.isSeller ? '卖家 我（' + o.buyer + ' 买的）' : '卖家 ' + (o.seller || '同学');
}

// 去付款（无后端支付沙箱，提示待接入）/ 提醒发货 / 确认收货
async function next(o) {
  try {
    if (o.status === 'pending') {
      // 后端 /orders/:id/pay 已就绪（真实支付沙箱未接，先把状态机推过去）
      await request.post('/orders/' + o.id + '/pay');
      ElMessage.success('支付成功（演示环境，未接真实支付）');
    } else if (o.status === 'paid') {
      await request.post('/orders/' + o.id + '/remind');
      ElMessage.success('已提醒卖家发货');
    } else if (o.status === 'shipping') {
      await request.post('/orders/' + o.id + '/receive');
      ElMessage.success('已确认收货');
    } else {
      return;
    }
    await loadOrders();
  } catch (e) {
    ElMessage.error(e?.message || '操作失败');
  }
}

// 取消订单：仅 pending 且本人买的，后端校验
async function cancel(o) {
  try {
    await request.post('/orders/' + o.id + '/cancel');
    cancelId.value = null;
    ElMessage.success('已取消');
    await loadOrders();
  } catch (e) {
    ElMessage.error(e?.message || '取消失败');
  }
}

onMounted(loadOrders);
watch(cur, () => {
  page.value = 1;
  loadOrders();
});
</script>
<style lang="less" module>@import '@/styles/mixins.less';
/* 只放「本页特有」的样式；卡片外观吃 ui.module.css，别重复抄一遍 */

.page { width: 100%; }
.bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 14px; flex-wrap: wrap; }
.bar h2 { margin: 0; font-size: 22px; }
.sub { margin: 6px 0 0; color: var(--tb-sub); font-size: 13px; }
/* 状态筛选：Element 的 radio-button 组靠「相邻按钮去掉左边框」拼成一条，
   按钮一多在窄屏换行，第二行就会缺边、圆角错位（就是截图那副样子）。
   拆成一颗颗独立小圆角按钮 + gap，宽度不够时换行也是整齐的。
   三个选择器一起写：规则特异性取列表里最高的那个（.el-radio-button:last-child
   .el-radio-button__inner 是 0,4,0），才压得住 Element 自带的拼接样式。 */
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.tabs :global(.el-radio-button .el-radio-button__inner),
.tabs :global(.el-radio-button:first-child .el-radio-button__inner),
.tabs :global(.el-radio-button:last-child .el-radio-button__inner) {
  border: 1px solid var(--tb-line);
  border-radius: @r-sm;
  box-shadow: none;
}
.tabs :global(.el-radio-button) { margin-left: 0; }
/* 订单号后面的来源标记（闲置市场模拟单） */
.srcTag { margin-left: 6px; }

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
.ops {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
  align-items: center;
  border-top: 1px solid rgba(124, 58, 237, 0.1);
  padding-top: 12px;
}
/* 取消订单：与 el-button size="small" 完全对齐（32px 高、同圆角、同字号、同内边距）。
   原来自绘成 10px 圆角 + 14px 内边距，和旁边的 el-button 并排时一高一矮、一圆一方，看着没对齐。
   两步确认态文字更长，用 min-width 顶住，按钮宽度不会来回跳。 */
.btn {
  height: 32px;
  min-width: 92px;
  padding: 0 15px;
  border: 1px solid var(--tb-line);
  border-radius: @r-sm;
  background: transparent;
  cursor: pointer;
  color: var(--tb-sub);
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1;
  transition: 0.18s;
}
.btn:hover { color: var(--tb-danger); border-color: rgba(244, 63, 94, 0.45); }
.btnOn {
  color: var(--tb-danger);
  border-color: var(--tb-danger);
  background: rgba(244, 63, 94, 0.08);
}
/* el-button 是子组件根节点：module 作用域下必须用 :global 穿透，并显式给同款尺寸，
   否则「取消订单」和它并排仍然是两种高度 */
.ops :global(.el-button) {
  height: 32px;
  min-width: 92px;
  margin: 0;
  padding: 0 15px;
  border-radius: @r-sm;
  font-size: 12.5px;
  font-weight: 600;
}
/* 已评价：不可点的状态胶囊，尺寸必须和旁边那颗按钮一模一样，
   否则「已评价」比「取消订单」矮一截，一行里看着又不对齐了 */
.doneTag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  min-width: 92px;
  padding: 0 15px;
  border: 1px solid var(--tb-line);
  border-radius: @r-sm;
  background: transparent;
  color: var(--tb-mute);
  font-size: 12.5px;
  font-weight: 600;
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
  .ops .btn { flex: 1; min-width: 96px; }
  .ops .doneTag { flex: 1; min-width: 96px; }
}
</style>
