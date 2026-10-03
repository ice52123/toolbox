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
            <el-tag v-if="o.reviewed" size="small" type="success" effect="plain">已评价</el-tag>
            <el-tag :type="tagType(o.status)" effect="plain">{{ orderStatusMap[o.status] }}</el-tag>
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
            <div :class="s.sn">物流：{{ o.sn }}</div>
          </div>
        </div>

        <!-- 状态进度：竖向时间线，当前步高亮 -->
        <div :class="s.timeline">
          <el-steps direction="vertical" :active="activeStep" finish-status="success">
            <el-step v-for="st in steps" :key="st" :title="st" />
          </el-steps>
        </div>

        <div :class="s.ops">
          <template v-if="o.status === 'done'">
            <el-button
              v-if="!o.reviewed"
              size="small"
              type="success"
              plain
              @click="router.push('/order/' + o.id + '/review')"
            >
              去评价
            </el-button>
            <el-button v-else size="small" plain disabled>已评价</el-button>
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

            <!-- 取消订单：两步确认，跟订单列表页一个手势（点一下变「确认取消」，再点才真取消） -->
            <button
              v-if="cancelOn !== o.id"
              type="button"
              :class="s.btnWarn"
              @click="cancelOn = o.id"
            >
              取消订单
            </button>
            <button v-else type="button" :class="[s.btnWarn, s.btnWarnOn]" @click="doCancel">确认取消？</button>
          </template>
        </div>
      </div>
    </template>

    <el-empty v-else description="找不到这张订单" />
  </div>
</template>

<script setup>
import { ref, computed, useCssModule } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { orders as mockOrders, orderStatusMap } from '@/config/mockData';
// 共享原子类（CSS Modules）：s.card / s.row … 各页长得一样的外观都在这份里
import shared from '@/styles/ui.module.less';

// 一个句柄拿两类样式：ui.module.css 的共享原子类 + 本组件 @import '@/styles/mixins.less';
const s = { ...shared, ...useCssModule() };

const route = useRoute();
const router = useRouter();
// 直接取 mock 数组里的那个对象（不浅拷贝）：状态改完，订单列表页和消息页读到的是同一份
const o = computed(() => mockOrders.find((x) => x.id === route.params.id) || null);
const cancelOn = ref(null);

const flow = ['pending', 'paid', 'shipping', 'done'];
const steps = ['下单', '付款', '发货', '收货'];
const activeStep = computed(() => flow.indexOf(o.value?.status) + 1);

const tagType = (st) => ({ pending: 'warning', paid: '', shipping: 'primary', done: 'success' }[st] || 'info');

function next() {
  const i = flow.indexOf(o.value.status);
  if (i < 0 || i >= flow.length - 1) return;
  o.value.status = flow[i + 1];
  if (o.value.status === 'shipping') o.value.sn = '顺丰 SF' + Math.random().toString().slice(2, 8);
  ElMessage.success(`订单状态已更新为「${orderStatusMap[o.value.status]}」`);
}

function doCancel() {
  o.value.status = 'cancelled';
  cancelOn.value = null;
  ElMessage.success('已取消');
}
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

.ops { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; margin-top: 20px; padding-top: 14px; border-top: 1px solid rgba(124, 58, 237, 0.1); }
/* 取消订单：跟 el-button size=small 同高（32px），两步确认时宽度不跳 */
.btnWarn {
  height: 32px; padding: 0 14px;
  border: 1px solid var(--tb-line); border-radius: 10px;
  background: transparent; cursor: pointer;
  color: var(--tb-sub); font-size: 12.5px; font-weight: 600; transition: 0.18s;
}
.btnWarn:hover { color: #f43f5e; border-color: rgba(244, 63, 94, 0.45); }
.btnWarnOn { color: #f43f5e; border-color: #f43f5e; background: rgba(244, 63, 94, 0.08); }

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
});
</style>
