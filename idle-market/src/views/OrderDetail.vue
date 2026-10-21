<template>
  <el-card shadow="never" v-loading="loading">
    <div class="bar">
      <el-button text :icon="ArrowLeft" @click="back">返回</el-button>
      <el-button text type="primary" @click="$router.push('/orders')">我的订单</el-button>
    </div>

    <el-result
      v-if="err"
      icon="warning"
      title="订单没找到"
      :sub-title="err"
    >
      <template #extra>
        <el-button type="primary" @click="$router.push('/list')">回列表</el-button>
      </template>
    </el-result>

    <div v-else-if="o" class="od">
      <div class="top">
        <el-tag :type="status.type" effect="dark">{{ status.text }}</el-tag>
        <span class="oid">订单号 {{ o.id }}</span>
      </div>

      <div class="goods">
        <div class="thumb">
          <el-image v-if="o.image" :src="o.image" fit="cover" />
          <div v-else class="thumb ph">{{ emojiOf(o.cat) }}</div>
        </div>
        <div class="ginfo">
          <h3>{{ o.title }}</h3>
          <div class="meta">{{ o.owner }} · {{ o.way }}</div>
          <div class="price">¥{{ o.price }}</div>
        </div>
        <div class="amount">
          <span>应付</span>
          <strong>¥{{ o.amount }}</strong>
        </div>
      </div>

      <div class="note" v-if="o.note">留言：{{ o.note }}</div>

      <!-- 快递寄送：收货信息记在订单上，卖家照这个地址发货 -->
      <div class="addr" v-if="o.address">
        <span class="addr-icon">📮</span>
        <div class="addr-body">
          <b>收货信息</b>
          <p>{{ o.address.name }} · {{ o.address.phone }}</p>
          <p>{{ o.address.detail }}</p>
        </div>
      </div>

      <!-- 钱在平台手里：这一步是「付了钱卖家不发货」的兜底，得让人看得见 -->
      <div class="escrow" v-if="o.status === 'paid' || o.status === 'shipped'">
        <span class="escrow-icon">🛡️</span>
        <div>
          <b>货款 ¥{{ o.amount }} 正由平台托管</b>
          <p>{{ escrowTip }}</p>
        </div>
      </div>

      <el-divider content-position="left">物流信息</el-divider>
      <el-timeline>
        <el-timeline-item
          v-for="(log, i) in o.logistics"
          :key="i"
          :timestamp="fmtTime(log.time)"
          :type="log.type"
          placement="top"
        >
          {{ log.text }}
        </el-timeline-item>
      </el-timeline>

      <!-- 演示用按钮；真实系统里「发货」由卖家点、「付款/收货/退款」由买家点 -->
      <div class="ops">
        <template v-if="o.status === 'unpaid'">
          <el-button type="primary" :loading="acting" @click="act('pay')">
            去支付 ¥{{ o.amount }}
          </el-button>
          <el-button text @click="act('cancel')">取消订单</el-button>
        </template>
        <template v-else-if="o.status === 'paid'">
          <!-- 快递：付款后要卖家发货，再等买家确认收货；面交：见面交货后直接确认完成 -->
          <template v-if="o.way === '快递寄送'">
            <el-button type="warning" :loading="acting" @click="act('ship')">模拟卖家发货</el-button>
            <el-button type="danger" plain :loading="acting" @click="act('refund')">申请退款</el-button>
          </template>
          <template v-else>
            <el-button type="success" :loading="acting" @click="act('receive')">确认交易完成</el-button>
            <el-button type="danger" plain :loading="acting" @click="act('refund')">申请退款</el-button>
          </template>
        </template>
        <el-button
          v-else-if="o.status === 'shipped'"
          type="success"
          :loading="acting"
          @click="act('receive')"
        >确认收货</el-button>
        <el-tag v-else type="info" effect="plain">{{ finalTip }}</el-tag>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { emojiOf, ORDER_STATUS } from '@/store';
import { getOrder, orderAction } from '@/api';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const err = ref('');
const o = ref(null);
const acting = ref(false);

const status = computed(() => ORDER_STATUS[o.value?.status] || { text: o.value?.status || '', type: 'info' });

const escrowTip = computed(() => {
  if (o.value?.status === 'shipped') {
    return '收到货确认没问题再点「确认收货」，之后平台才会把货款打给卖家。';
  }
  if (o.value?.status === 'paid') {
    // 两种交易方式：快递要等发货再确认；面交见面交货后直接点完成
    return o.value.way === '快递寄送'
      ? '卖家发货、你确认收货之后平台才会打款给卖家；迟迟不发货可直接申请退款。'
      : '见面验货付款后点「确认交易完成」，平台即把货款打给卖家。';
  }
  return '';
});

const finalTip = computed(
  () =>
    ({
      done: '交易已完成 🎉',
      refunded: '货款已原路退回',
      cancelled: '订单已取消'
    })[o.value?.status] || ''
);

function fmtTime(t) {
  const d = new Date(t);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function back() {
  // 回商品详情，不用 history.back()：历史上一页往往是下单页，
  // 退回去用户就看见一个还带着「提交订单」的页面，容易以为能重复下单。
  if (o.value?.goodsId) router.push('/detail/' + o.value.goodsId);
  else if (window.history.length > 1) router.back();
  else router.push('/list');
}

async function load() {
  loading.value = true;
  err.value = '';
  try {
    o.value = await getOrder(route.params.id);
    if (!o.value) err.value = '订单不存在或已被清除';
  } catch (e) {
    err.value = e.message || '加载失败';
  } finally {
    loading.value = false;
  }
}

const OK_TIP = {
  pay: '支付成功，货款已进入平台托管',
  ship: '已模拟卖家发货',
  receive: '已确认收货，货款已打给卖家',
  cancel: '订单已取消',
  refund: '已申请退款，货款原路退回'
};

async function act(action) {
  acting.value = true;
  try {
    o.value = await orderAction(o.value.id, action);
    ElMessage.success(OK_TIP[action] || '操作成功');
  } catch (e) {
    ElMessage.error(e.message || '操作失败');
  } finally {
    acting.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.od { padding: 10px 0; }
.bar { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
/* 收货信息条：与留言 / 担保条同一套外观 */
.addr {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-top: 10px;
  padding: 12px 14px;
  background: var(--im-tint);
  border: 1px solid var(--im-line);
  border-radius: 12px;
}
.addr b { font-size: 14px; color: var(--im-fg); }
.addr p { margin: 4px 0 0; font-size: 13px; color: var(--im-fg-soft); }
.top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 6px 0 16px;
}
.oid { color: var(--im-fg-soft); font-size: 13px; }
.goods {
  display: flex;
  gap: 14px;
  align-items: center;
  background: var(--im-surface);
  border: 1px solid var(--im-line);
  border-radius: 14px;
  padding: 14px;
}
.thumb {
  width: 84px;
  height: 84px;
  flex: none;
  border-radius: 12px;
  overflow: hidden;
  background: var(--im-tint);
}
.thumb :deep(img) { width: 100%; height: 100%; }
.thumb.ph {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
}
.ginfo { min-width: 0; flex: 1; }
.ginfo h3 { margin: 0 0 6px; font-size: 16px; color: var(--im-fg); }
.meta { color: var(--im-fg-soft); font-size: 13px; }
.price { color: var(--im-fg); font-weight: 700; margin-top: 4px; }
.amount {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.amount span { color: var(--im-fg-soft); font-size: 12px; }
.amount strong { color: var(--im-brand); font-size: 20px; }
.note {
  margin-top: 14px;
  padding: 10px 12px;
  background: var(--im-tint);
  border-radius: 10px;
  color: var(--im-fg-soft);
  font-size: 13px;
}
.escrow {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-top: 14px;
  padding: 12px 14px;
  background: var(--im-tint);
  border: 1px solid var(--im-line);
  border-radius: 12px;
}
.escrow-icon { font-size: 18px; line-height: 1.4; }
.escrow b { color: var(--im-fg); font-size: 14px; }
.escrow p {
  margin: 4px 0 0;
  color: var(--im-fg-soft);
  font-size: 12.5px;
  line-height: 1.6;
}
.ops {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  flex-wrap: wrap;
}

@media (max-width: 900px) {
  .ginfo h3 { font-size: 15px; }
  .amount strong { font-size: 18px; }
}
</style>
