<template>
  <div :class="s.page">
    <div :class="s.bar">
      <div>
        <h2>消息中心</h2>
        <p :class="s.sub">
          未读 {{ unreadCount }} 条 ·
          实时推送走 Socket.IO（房间 room:user:{id}），当前为模拟数据，P5 接后端即可落地
        </p>
      </div>
      <div :class="s.barOps">
        <el-button size="small" type="primary" plain @click="simulate">模拟收到一条新消息</el-button>
        <el-button size="small" :disabled="!unreadCount" @click="markAll">全部已读</el-button>
      </div>
    </div>

    <el-radio-group v-model="cur" :class="s.tabs">
      <el-radio-button v-for="t in messageTypes" :key="t.key" :value="t.key">{{ t.name }}</el-radio-button>
    </el-radio-group>

    <div :class="s.list">
      <div
        v-for="m in filtered"
        :key="m.id"
        :class="[s.card, { [s.unread]: m.unread }]"
        @click="m.unread = false"
      >
        <div :class="s.ic" :style="{ background: iconBg(m.type) }">
          <el-icon :size="18"><component :is="icon(m.type)" /></el-icon>
        </div>
        <div :class="s.body">
          <div :class="s.msgTitle">
            {{ m.title }}
            <el-tag v-if="m.unread" size="small" type="danger" effect="dark" :class="s.dot">新</el-tag>
          </div>
          <div :class="s.msgMeta">{{ m.from }} · {{ m.time }}</div>
        </div>
        <!-- 按钮文案 + 落地页都来自 mockData 的 action / to，不是死按钮 -->
        <el-button size="small" type="primary" plain @click="open(m)">{{ m.action }}</el-button>
      </div>

      <el-empty v-if="!filtered.length" description="这里干干净净" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, useCssModule } from 'vue';
import { useRouter } from 'vue-router';
import { ChatLineSquare, ShoppingCart, Bell, Star, ChatDotRound } from '@element-plus/icons-vue';
import { messages as mockMessages, messageTypes } from '@/config/mockData';
import { useUiStore } from '@/stores/ui';
// 共享原子类（CSS Modules）：s.card / s.row … 各页长得一样的外观都在这份里
import shared from '@/styles/ui.module.less';

// 一个句柄拿两类样式：ui.module.css 的共享原子类 + 本组件 @import '@/styles/mixins.less';
const s = { ...shared, ...useCssModule() };

const ui = useUiStore();
const router = useRouter();
const cur = ref('all');
const list = ref(mockMessages.map((m) => ({ ...m })));

// 点操作按钮：先标已读（红点跟着掉），再跳这条消息自己的落地页
function open(m) {
  if (m.unread) m.unread = false;
  if (m.to) router.push(m.to);
}

const filtered = computed(() =>
  list.value.filter((m) => cur.value === 'all' || m.type === cur.value)
);

const unreadCount = computed(() => list.value.filter((m) => m.unread).length);

// 未读数同步到全局：导航「我的」和底部 tab 的红点都读它
onMounted(() => ui.setUnread(unreadCount.value));
watch(unreadCount, (n) => ui.setUnread(n));

function markAll() {
  list.value.forEach((m) => (m.unread = false));
  ui.clearUnread();
}

// 模拟「服务端推过来一条实时消息」——真接 Socket.IO 时，这段换成 socket.on('notify', ...)
function simulate() {
  list.value.unshift({
    id: Date.now(),
    type: 'trade',
    title: '有人下单了你的「九成新 iPad Air 4 64G」',
    from: '交易助手',
    time: '刚刚',
    unread: true,
    action: '去处理',
    to: '/order/SO2026100301' // 这张单是「我」卖出的 iPad，待发货 → 去处理就是发货
  });
  // 未读数由上面的 watch 自动同步，红点不用手动再 +1
}

const icons = { reply: ChatLineSquare, trade: ShoppingCart, system: Bell, follow: Star };
const icon = (t) => icons[t] || ChatDotRound;
const iconBg = (t) =>
  ({
    reply: 'linear-gradient(135deg,#7C3AED,#C026D3)',
    trade: 'linear-gradient(135deg,#F97316,#FB923C)',
    system: 'linear-gradient(135deg,#2563EB,#06B6D4)',
    follow: 'linear-gradient(135deg,#10B981,#34D399)'
  })[t] || 'linear-gradient(135deg,#6366F1,#818CF8)';
</script>
<style lang="less" module>@import '@/styles/mixins.less';
/* 只放「本页特有」的样式；卡片外观吃 ui.module.css，别重复抄一遍 */

.page { width: 100%; }
.bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px; flex-wrap: wrap; }
.bar h2 { margin: 0; font-size: 22px; }
.sub { margin: 6px 0 0; color: var(--tb-sub); font-size: 13px; }
.barOps { display: flex; gap: 10px; }
.tabs { margin-bottom: 16px; }

.list { display: flex; flex-direction: column; gap: 12px; }
/* 消息卡：卡片外观 composes 自 tb-card，这里只写本页的排版 */
.card { composes: tb-card from global; display: flex; align-items: center; gap: 14px; padding: 14px 16px; }
/* 复合选择器不能带 composes，未读高亮单独一条；写 .card.unread 是为了压过 tb-card 的边框 */
.card.unread { border-color: rgba(124, 58, 237, 0.45); }

.ic { width: 38px; height: 38px; border-radius: 12px; color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.18); }
.body { flex: 1; min-width: 0; }
.msgTitle { font-weight: 600; }
.dot { margin-left: 8px; }
.msgMeta { font-size: 12px; color: var(--tb-sub); margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

@media (max-width: 900px) {
  .page { max-width: 100%; }
  .bar h2 { font-size: 19px; }
  .bar .sub { font-size: 12px; }
  .barOps { flex: 1; }
  .barOps :global(.el-button) { flex: 1; }
  .card { padding: 12px 13px; gap: 10px; }
  .ic { width: 34px; height: 34px; border-radius: 11px; }
  /* el-button 是子组件根节点，module 作用域下要用 :global 穿透
     （写 :deep(.el-button) 会被连类名一起哈希成假类名） */
  .card :global(.el-button) { margin-left: auto; flex: none; }
}
@media (max-width: 420px) {
  /* 窄屏把「去处理」按钮扣到底部一行，标题不再被压成两行 */
  .card { flex-wrap: wrap; }
  .card :global(.el-button) { width: 100%; margin-left: 0; }
}
</style>
