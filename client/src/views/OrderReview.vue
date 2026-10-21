<template>
  <div :class="s.page">
    <button type="button" :class="s.back" @click="router.push('/order/' + route.params.id)">
      <el-icon :size="16"><ArrowLeft /></el-icon><span>返回订单详情</span>
    </button>

    <div :class="s.bar">
      <h2>评价订单</h2>
      <p :class="s.sub">评价后可得 20 校园积分，只评一次，改不了</p>
    </div>

    <template v-if="o">
      <!-- 订单摘要：评价对象是这张单，先摆清楚 -->
      <div :class="s.card">
        <div :class="s.goods">
          <div :class="s.thumb">📦</div>
          <div :class="s.gMain">
            <div :class="s.gTitle">{{ o.title }}</div>
            <div :class="s.gMeta">{{ o.id }} · 卖家 {{ o.seller }}</div>
          </div>
          <div :class="s.price">¥{{ o.price }}</div>
        </div>
      </div>

      <!-- 评分卡 -->
      <div :class="s.card">
        <div :class="s.secHead"><b>总体评分</b></div>
        <div :class="s.rateRow">
          <el-rate v-model="score" :size="26" />
          <span :class="s.scoreText">{{ scoreText }}</span>
        </div>

        <div :class="s.dims">
          <div v-for="d in reviewDims" :key="d.key" :class="s.dim">
            <span :class="s.dimLabel">{{ d.label }}</span>
            <el-rate v-model="dims[d.key]" :size="17" />
          </div>
        </div>

        <div :class="[s.secHead, s.secHead2]"><b>添加标签</b></div>
        <div :class="s.tags">
          <el-tag
            v-for="t in reviewTags"
            :key="t"
            :class="s.tag"
            effect="plain"
            :type="pickTags.includes(t) ? 'primary' : 'info'"
            @click="toggleTag(t)"
          >
            {{ t }}
          </el-tag>
        </div>

        <label :class="s.fl">补一句感受（选填）</label>
        <el-input
          v-model="text"
          :class="s.textarea"
          type="textarea"
          :rows="3"
          maxlength="200"
          show-word-limit
          placeholder="描述相符吗？卖家回得快不快？当面交易顺不顺？"
        />

        <div :class="s.ops">
          <el-button v-if="o.reviewed" plain disabled>已评价，感谢反馈</el-button>
          <template v-else>
            <el-button plain @click="router.push('/orders')">稍后再说</el-button>
            <el-button type="primary" :disabled="!score" @click="submit">提交评价</el-button>
          </template>
        </div>
      </div>
    </template>

    <!-- 拉不到表单时把后端给的原因说出来（已评价的上面那条分支已经渲染了摘要卡） -->
    <el-empty v-else :description="loadErr || '找不到这张订单'">
      <el-button type="primary" plain @click="router.push('/orders')">返回我的订单</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, useCssModule } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';
// 共享原子类（CSS Modules）：s.card / s.row … 各页长得一样的外观都在这份里
import shared from '@/styles/ui.module.less';

// 一个句柄拿两类样式：ui.module.css 的共享原子类 + 本组件 @import '@/styles/mixins.less';
const s = { ...shared, ...useCssModule() };

const route = useRoute();
const router = useRouter();
// 订单摘要 + 评价维度/标签全部来自后端 /orders/:id/review-form
const o = ref(null);
const reviewDims = ref([]);
const reviewTags = ref([]);
// 拉不到表单时的真实原因（已评价走 o.reviewed 分支，这里只放「其他失败」的原因）
const loadErr = ref('');

const score = ref(0);
// 分项评分按后端返回的维度动态建键（后端默认 desc/attitude/logistics 三项）
const dims = reactive({});
const pickTags = ref([]);
const text = ref('');

const scoreText = computed(
  () => ['', '很失望', '不太行', '一般', '挺满意', '超预期'][score.value] || ''
);

function toggleTag(t) {
  const i = pickTags.value.indexOf(t);
  if (i >= 0) pickTags.value.splice(i, 1);
  else pickTags.value.push(t);
}

async function load() {
  // 先把上一轮的结果清掉：路由 id 变了还留着旧数据，页面会短暂显示上一张单的内容
  o.value = null;
  loadErr.value = '';
  try {
    const { order, dims: dimList, tags } = await request.get('/orders/' + route.params.id + '/review-form');
    o.value = { id: order.id, title: order.title, price: order.price, reviewed: false };
    reviewDims.value = dimList || [];
    reviewTags.value = tags || [];
    // 按后端维度动态初始化分项评分，模板 el-rate 走 dims[d.key]
    (dimList || []).forEach((d) => {
      if (dims[d.key] == null) dims[d.key] = 0;
    });
  } catch (e) {
    // 拉不到评价表单不等于「订单不存在」。后端在这几种情况会拒绝：
    //   已评价过 / 订单还没完成 / 不是自己买的单 / 单号不存在
    // 之前一律当成「找不到这张订单」，用户看到的是空白页 + 误导性文案，
    // 返回上一页又看到一张好好的订单 —— 前后自相矛盾。
    // 现在：已评价 → 展示摘要 + 「已评价」态；其余 → 把后端的真实原因显示出来。
    const msg = e?.message || '';
    o.value = null;
    if (msg.includes('已评价')) {
      try {
        const { order } = await request.get('/orders/' + route.params.id);
        o.value = { id: order.id, title: order.title, price: order.price, reviewed: true };
      } catch (e2) {
        loadErr.value = e2?.message || msg;
      }
    } else {
      loadErr.value = msg;
    }
    console.error('[ OrderReview ] 加载失败：', e);
  }
}

async function submit() {
  try {
    await request.post('/orders/' + o.value.id + '/review', {
      ratings: { ...dims },
      tags: [...pickTags.value],
      text: text.value.trim()
    });
    o.value.reviewed = true;
    ElMessage.success('评价已提交，20 校园积分已到账');
    // replace：评价完不该再留一个「提交评价」的历史记录能后退回去
    router.replace(`/order/${o.value.id}`);
  } catch (e) {
    ElMessage.error(e?.message || '评价失败');
  }
}

onMounted(load);
// 同一路由内换单号（从别的入口点进来）时重新拉，别留着上一张单的内容
watch(() => route.params.id, load);
</script>

<style lang="less" module>@import '@/styles/mixins.less';
/* 只放「本页特有」的样式；卡片外观吃 ui.module.css，别重复抄一遍 */

.page { composes: tb-page from global; max-width: 760px; }

.back {
  display: inline-flex; align-items: center; gap: 5px;
  height: 30px; padding: 0 12px; margin-bottom: 14px;
  border: 1px solid var(--tb-border); border-radius: 10px;
  background: transparent; color: var(--tb-sub); font-size: 12.5px; font-weight: 600; cursor: pointer;
  transition: 0.18s;
}
.back:hover { color: var(--tb-primary); border-color: var(--tb-primary); }

.bar { margin-bottom: 14px; }
.bar h2 { margin: 0; font-size: 21px; }
.sub { margin: 6px 0 0; font-size: 13px; color: var(--tb-sub); }

/* 摘要卡 / 评分卡：卡片外观 composes 自 tb-card */
.card { composes: tb-card from global; padding: 20px 22px; margin-bottom: 16px; }

.goods { display: flex; align-items: center; gap: 13px; }
.thumb {
  width: 52px; height: 52px; flex: none; border-radius: 15px; font-size: 24px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #f3f0ff, #eef6ff);
}
.gMain { flex: 1; min-width: 0; }
.gTitle { font-weight: 700; .ellipsis-one(); }
.gMeta { font-size: 12px; color: var(--tb-sub); margin-top: 4px; }
.price { color: var(--tb-primary); font-weight: 800; font-size: 17px; flex: none; }

.secHead { font-size: 15px; font-weight: 700; margin-bottom: 12px; }
/* 同一条规则既要能当第一块（带上边距）又要能当中段（只留一点），拆成两条更直白 */
.secHead + .rateRow { margin-top: 2px; }
.secHead2 { margin-top: 22px; padding-top: 18px; border-top: 1px dashed var(--tb-line-dashed); }

.rateRow { display: flex; align-items: center; gap: 12px; }
.scoreText { font-size: 13.5px; font-weight: 600; color: var(--tb-primary); }

.dims { display: flex; flex-direction: column; gap: 10px; margin-top: 18px; }
.dim { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.dimLabel { font-size: 13.5px; color: var(--tb-sub); }

.tags { display: flex; gap: 8px; flex-wrap: wrap; }
.tag { cursor: pointer; user-select: none; }

.fl { display: block; margin: 22px 0 8px; font-size: 13.5px; font-weight: 600; color: var(--tb-sub); }
.textarea { width: 100%; }

.ops { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; padding-top: 14px; border-top: 1px solid rgba(124, 58, 237, 0.1); }

.m-sm({
  .page { max-width: 100%; }
  .back span { display: none; }
  .back { width: 30px; padding: 0; margin-bottom: 10px; justify-content: center; }
  .card { padding: 15px 14px; }
  .bar h2 { font-size: 18px; }
  .ops { justify-content: stretch; }
  .ops :global(.el-button) { flex: 1; }
});
</style>
