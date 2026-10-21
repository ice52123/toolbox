<template>
  <div :class="s.page">
    <button type="button" :class="s.back" @click="router.push('/orders')">
      <el-icon :size="16"><ArrowLeft /></el-icon><span>返回我的订单</span>
    </button>

    <template v-if="o">
      <div :class="s.card">
        <div :class="s.top">
          <span :class="s.oid">订单号 {{ o.id }}</span>
          <div :class="s.tags">
            <!-- 两个标签都锁 size="small"：一个写了一个没写，element 会给默认 medium，
               并排时「已评价」明显比「已完成」小一圈 -->
            <el-tag v-if="o.reviewed" size="small" type="success" effect="plain">已评价</el-tag>
            <el-tag size="small" :type="tagType(o.status)" effect="plain">{{ orderStatusMap[o.status] }}</el-tag>
          </div>
        </div>

        <div :class="s.goods">
          <div :class="s.thumb">📦</div>
          <div :class="s.gMain">
            <div :class="s.gTitle">{{ o.title }}</div>
            <div :class="s.gMeta">卖家 {{ o.seller }} · 下单 {{ o.time }}</div>
          </div>
          <div :class="s.gRight">
            <div :class="s.price">¥{{ o.price }}</div>
            <div :class="s.sn">物流：{{ snText }}</div>
          </div>
        </div>

        <!-- 状态进度：竖向时间线，当前步高亮。已取消的订单流程终止，不画四步进度条 -->
        <div v-if="isCancelled" :class="s.cancelTip">这笔订单已取消，流程不再往下走了</div>
        <div v-else :class="s.timeline">
          <el-steps direction="vertical" :active="activeStep" finish-status="success">
            <el-step v-for="st in steps" :key="st" :title="st" />
          </el-steps>
        </div>

        <!-- 订单动态：后端 order_logs 真实记录（创建 / 付款 / 发货单号 / 收货 / 评价） -->
        <div v-if="logs.length" :class="s.logs">
          <div :class="s.logsHead">订单动态</div>
          <div v-for="(l, i) in logs" :key="i" :class="s.logItem">
            <span :class="s.logDot" />
            <div :class="s.logBody">
              <div :class="s.logNote">{{ l.note }}</div>
              <div :class="s.logTime">{{ fromNow(l.created_at) }}</div>
            </div>
          </div>
        </div>

        <div :class="s.ops">
          <template v-if="o.status === 'done'">
            <button
              v-if="!o.reviewed"
              type="button"
              :class="s.btnOk"
              @click="router.push('/order/' + o.id + '/review')"
            >
              去评价
            </button>
            <!-- 已评价：不可点的胶囊，尺寸和旁边按钮一致，不再是那个点了没反应的可点按钮 -->
            <span v-else :class="s.doneTag">已评价</span>
          </template>

          <template v-else>
            <el-button
              v-if="o.status === 'pending'"
              size="small"
              type="primary"
              @click="next"
            >
              去付款
            </el-button>
            <el-button
              v-if="o.status === 'paid'"
              size="small"
              type="primary"
              @click="next"
            >
              提醒发货
            </el-button>
            <el-button
              v-if="o.status === 'shipping'"
              size="small"
              type="primary"
              @click="next"
            >
              确认收货
            </el-button>

            <!-- 取消订单：两步确认，跟订单列表页一个手势（点一下变「确认取消」，再点才真取消）。
               ⚠️ 卡 status === 'pending'：后端只允许取消待付款的单，
               无条件渲染会让已取消/已完成的单也显示这颗按钮，点下去后端回 400 -->
            <button
              v-if="o.status === 'pending' && cancelOn !== o.id"
              type="button"
              :class="s.btnWarn"
              @click="cancelOn = o.id"
            >
              取消订单
            </button>
            <button
              v-else-if="o.status === 'pending'"
              type="button"
              :class="[s.btnWarn, s.btnWarnOn]"
              @click="doCancel"
            >
              确认取消？
            </button>
            <!-- 已取消：给颗不可点的状态胶囊，操作区不至于空着 -->
            <span v-if="o.status === 'cancel'" :class="s.doneTag">已取消</span>
          </template>
        </div>
      </div>
    </template>

    <el-empty v-else description="找不到这张订单" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, useCssModule } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';
import { fromNow } from '@/utils/format';
// 共享原子类（CSS Modules）：s.card / s.row … 各页长得一样的外观都在这份里
import shared from '@/styles/ui.module.less';

// 一个句柄拿两类样式：ui.module.css 的共享原子类 + 本组件 @import '@/styles/mixins.less';
const s = { ...shared, ...useCssModule() };

const route = useRoute();
const router = useRouter();
const myId = Number(localStorage.getItem('tb_id')) || 0;
// 订单详情 / 状态机 / 评价态全部来自后端 /orders/:id，不再读本地 mock
const o = ref(null);
const logs = ref([]);
const cancelOn = ref(null);

const flow = ['pending', 'paid', 'shipping', 'done'];
const steps = ['下单', '付款', '发货', '收货'];
// 已取消不在 flow 里，indexOf 返回 -1 会算成「第 1 步」，看着像卡在待付款。
// 这种情况返回 0，模板改为显示一条「订单已取消」提示，不再画四步进度条
const activeStep = computed(() => flow.indexOf(o.value?.status) + 1);
const isCancelled = computed(() => o.value?.status === 'cancel');

// 物流一行：后端 orders 表没有 sn 字段，别再拿状态词硬凑——
// 已完成的单显示「已完成」比显示「待发货」合理（原来恒写待发货，和上方状态自相矛盾）
const snText = computed(() => {
  if (!o.value) return '';
  if (o.value.status === 'done') return '已完成';
  if (o.value.status === 'cancel') return '已取消';
  if (o.value.status === 'pending') return '待付款';
  return '待发货';
});

// 状态英文 → 中文（mockData.orderStatusMap 的同一份映射，搬到组件内避免依赖 mock）
const orderStatusMap = {
  pending: '待付款',
  paid: '待发货',
  shipping: '待收货',
  done: '已完成',
  cancel: '已取消'
};
const tagType = (st) => ({ pending: 'warning', paid: '', shipping: 'primary', done: 'success', cancel: 'info' }[st] || 'info');

async function load() {
  try {
    const { order, logs: lg, review } = await request.get('/orders/' + route.params.id);
    o.value = {
      id: order.id,
      title: order.title,
      price: order.price,
      status: order.status,
      reviewed: !!review,
      // 卖家显示：优先用后端拍平的 seller_name，自己卖的显示「我」
      seller: order.seller_id === myId ? '我（' + (order.seller_name || '同学') + '）' : order.seller_name || '对方同学',
      time: fromNow(order.created_at)
    };
    logs.value = lg || [];
  } catch (e) {
    o.value = null;
    console.error('[ OrderDetail ] 加载失败：', e);
  }
}

// 去付款 / 提醒发货 / 确认收货，行为同订单列表页
async function next() {
  try {
    if (o.value.status === 'pending') {
      // 后端 /orders/:id/pay 已就绪（真实支付沙箱未接，先把状态机推过去）
      await request.post('/orders/' + o.value.id + '/pay');
      ElMessage.success('支付成功（演示环境，未接真实支付）');
    } else if (o.value.status === 'paid') {
      await request.post('/orders/' + o.value.id + '/remind');
      ElMessage.success('已提醒卖家发货');
    } else if (o.value.status === 'shipping') {
      await request.post('/orders/' + o.value.id + '/receive');
      ElMessage.success('已确认收货');
    } else {
      return;
    }
    await load();
  } catch (e) {
    ElMessage.error(e?.message || '操作失败');
  }
}

async function doCancel() {
  try {
    await request.post('/orders/' + o.value.id + '/cancel');
    cancelOn.value = null;
    ElMessage.success('已取消');
    await load();
  } catch (e) {
    ElMessage.error(e?.message || '取消失败');
  }
}

onMounted(load);
watch(() => route.params.id, load);
</script>

<style lang="less" module>@import '@/styles/mixins.less';
/* 只放「本页特有」的样式；卡片外观吃 ui.module.css，别重复抄一遍 */

.page { composes: tb-page from global; max-width: 880px; }

.back {
  display: inline-flex; align-items: center; gap: 5px;
  height: 30px; padding: 0 12px; margin-bottom: 14px;
  border: 1px solid var(--tb-border); border-radius: 10px;
  background: transparent; color: var(--tb-sub); font-size: 12.5px; font-weight: 600; cursor: pointer;
  transition: 0.18s;
}
.back:hover { color: var(--tb-primary); border-color: var(--tb-primary); }

.card { composes: tb-card from global; padding: 22px 24px; }
.top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.oid { font-size: 13px; color: var(--tb-sub); letter-spacing: 0.5px; }
.tags { display: flex; gap: 8px; }

.goods { display: flex; align-items: center; gap: 14px; margin: 18px 0 20px; padding: 14px; border-radius: var(--r-md); background: var(--tb-primary-soft); }
.thumb {
  width: 58px; height: 58px; flex: none; border-radius: 15px; font-size: 27px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #f3f0ff, #eef6ff);
}
.gMain { flex: 1; min-width: 0; }
.gTitle { font-weight: 700; .ellipsis-one(); }
.gMeta { font-size: 12px; color: var(--tb-sub); margin-top: 4px; }
.gRight { text-align: right; }
.price { color: var(--tb-primary); font-weight: 800; font-size: 18px; }
.sn { font-size: 12px; color: var(--tb-sub); margin-top: 4px; }

.timeline { padding: 4px 0 6px 4px; }
/* 已取消：给一条中性提示条，别用四步进度条（cancel 不在流程里，会渲染成卡在第一步） */
.cancelTip {
  margin: 4px 0 6px;
  padding: 11px 14px;
  border: 1px solid var(--tb-line);
  border-radius: @r-sm;
  background: var(--tb-inset, rgba(124, 58, 237, 0.04));
  color: var(--tb-sub);
  font-size: 13px;
}

/* 订单动态：左侧竖线 + 圆点，跟状态进度条分开，互不抢视觉 */
.logs { margin-top: 18px; padding-left: 4px; }
.logsHead { font-size: 13.5px; font-weight: 700; color: var(--tb-text); margin-bottom: 10px; }
.logItem { position: relative; display: flex; gap: 12px; padding: 0 0 14px 18px; }
.logItem::before {
  content: ''; position: absolute; left: 4px; top: 4px; bottom: -4px; width: 2px;
  background: rgba(124, 58, 237, 0.16);
}
.logItem:last-child::before { display: none; }
.logDot {
  position: absolute; left: 0; top: 4px; width: 10px; height: 10px; border-radius: 50%;
  background: var(--tb-primary); box-shadow: 0 0 0 3px var(--tb-primary-soft);
}
.logBody { flex: 1; min-width: 0; }
.logNote { font-size: 13px; color: var(--tb-text); font-weight: 600; }
.logTime { font-size: 12px; color: var(--tb-sub); margin-top: 2px; }

.ops { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; align-items: center; margin-top: 20px; padding-top: 14px; border-top: 1px solid rgba(124, 58, 237, 0.1); }
/* 取消订单：与 el-button size="small" 完全对齐（32px 高、同圆角、同字号、同内边距）。
   两步确认态文字更长，用 min-width 顶住，按钮宽度不会来回跳 */
.btnWarn {
  height: 32px; min-width: 92px; padding: 0 15px;
  border: 1px solid var(--tb-line); border-radius: @r-sm;
  background: transparent; cursor: pointer;
  color: var(--tb-sub); font-size: 12.5px; font-weight: 600; line-height: 1;
  display: inline-flex; align-items: center; justify-content: center;
  transition: 0.18s;
}
.btnWarn:hover { color: var(--tb-danger); border-color: rgba(244, 63, 94, 0.45); }
.btnWarnOn { color: var(--tb-danger); border-color: var(--tb-danger); background: rgba(244, 63, 94, 0.08); }
/* 同款尺寸写给 el-button：否则自绘的「取消订单」和它并排一高一矮 */
.ops :global(.el-button) {
  height: 32px; min-width: 92px; margin: 0; padding: 0 15px;
  border-radius: @r-sm; font-size: 12.5px; font-weight: 600;
}
/* 去评价：成功色描边 + 绿色文字，和「取消订单」同尺寸 */
.btnOk {
  height: 32px; min-width: 92px; padding: 0 15px;
  border: 1px solid var(--tb-ok, #10b981); border-radius: @r-sm;
  background: transparent; cursor: pointer;
  color: var(--tb-ok, #10b981); font-size: 12.5px; font-weight: 600; line-height: 1;
  display: inline-flex; align-items: center; justify-content: center;
  transition: 0.18s;

  &:hover { background: var(--tb-ok-soft, rgba(16, 185, 129, 0.1)); }
}
/* 已评价：不可点的状态胶囊，尺寸必须和旁边那颗按钮一模一样 */
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

.m-sm({
  .page { max-width: 100%; }
  .back span { display: none; }
  .back { width: 30px; padding: 0; margin-bottom: 10px; justify-content: center; }
  .card { padding: 16px 14px; }
  .goods { flex-wrap: wrap; gap: 10px; margin: 14px 0 16px; }
  .gRight { width: 100%; text-align: left; margin-left: 68px; }
  .price { font-size: 16px; }
  .sn { margin-top: 2px; }
  .ops { justify-content: flex-start; }
  .ops :global(.el-button) { flex: 1; min-width: 96px; }
  .ops .btnWarn { flex: 1; min-width: 96px; }
  .ops .btnOk { flex: 1; min-width: 96px; }
  .ops .doneTag { flex: 1; min-width: 96px; }
});
</style>
