<template>
  <div :class="s.page">
    <div :class="s.bar">
      <div>
        <h2>消息中心</h2>
        <p :class="s.sub">
          未读 {{ unreadCount }} 条 ·
          实时推送走 Socket.IO（房间 room:user:{id}），当前已接后端
        </p>
      </div>
      <div :class="s.barOps">
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
        @click="open(m)"
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
        <el-button size="small" type="primary" plain @click.stop="open(m)">{{ m.action }}</el-button>
      </div>

      <el-empty v-if="!filtered.length" description="这里干干净净" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, useCssModule } from 'vue';
import { useRouter } from 'vue-router';
import { ChatLineSquare, ShoppingCart, Bell, Star, ChatDotRound } from '@element-plus/icons-vue';
import { messageTypes } from '@/config/mockData';
import request from '@/utils/request';
import { fromNow } from '@/utils/format';
import { useUiStore } from '@/stores/ui';
// 共享原子类（CSS Modules）：s.card / s.row … 各页长得一样的外观都在这份里
import shared from '@/styles/ui.module.less';

// 一个句柄拿两类样式：ui.module.css 的共享原子类 + 本组件 @import '@/styles/mixins.less';
const s = { ...shared, ...useCssModule() };

const ui = useUiStore();
const router = useRouter();
const cur = ref('all');
const list = ref([]);

// 根据后端 ref_type / ref_id 推导这条消息的「落地页 + 按钮文案」
function landing(m) {
  const rid = m.ref_id;
  const map = {
    post: { to: '/post/' + rid, action: '查看' },
    order: { to: '/order/' + rid, action: '查看订单' },
    notice: { to: '/notice/' + rid, action: '查看' },
    user: { to: '/user/' + encodeURIComponent(rid), action: '查看主页' },
    chat: { to: '/chat/' + rid, action: '去聊天' },
    // 商品详情在微应用里（/m/idle/detail/:id）。以前写死跳列表，点「查看」只到列表，
    // 还得自己再找一遍那件商品；老消息没有 ref_id 时才退回列表
    goods: { to: rid ? '/m/idle/detail/' + rid : '/m/idle', action: '查看' }
  };
  const hit = map[m.ref_type];
  // ref_id 缺失（或类型未知）时不拼假链接：否则会得到 /user/undefined、/post/null 这种
  // 点进去必然 404 的地址（goods 已在上面自行兜底到列表，故继续放行）
  const missRef = m.ref_type !== 'goods' && (rid === null || rid === undefined || rid === '');
  if (!hit || missRef) return { to: '', action: '查看' };
  return hit;
}

const filtered = computed(() =>
  list.value.filter((m) => cur.value === 'all' || m.type === cur.value)
);

// 未读总数 = 全量列表里的未读数。列表是一次性拉全的（不按 tab 过滤），
// 所以切 tab 不会改变这个数——红点口径必须和 AppLayout 每 7s 拉的
// /messages/unread-count 完全一致，否则会把总数算成「当前 tab 的未读」甚至清零，
// 轮询一到红点又冒出来（这就是「点掉又出现」）。
const unreadCount = computed(() => list.value.filter((m) => m.unread).length);

// 本地先算一次让 UI 立刻掉点，再拉后端总数兜底（与 7s 轮询同源，避免红点闪回）
function syncUnread() {
  ui.setUnread(unreadCount.value);
  ui.loadUnread();
}

onMounted(loadMessages);

async function loadMessages() {
  try {
    // 不传 type：一次拉全量，tab 只做前端筛选（后端 /messages 默认返回全部）
    const rows = await request.get('/messages');
    list.value = (rows || []).map((m) => {
      const { to, action } = landing(m);
      return {
        id: m.id,
        type: m.type,
        title: m.title,
        from: m.from_user,
        time: fromNow(m.created_at),
        unread: !!m.unread,
        ref_type: m.ref_type,
        ref_id: m.ref_id,
        action,
        to
      };
    });
    ui.setUnread(unreadCount.value);
  } catch (e) {
    console.error('[ Message ] 加载消息失败：', e);
  }
}

// 读一条 = 标已读并把状态落库。
// 以前卡片点击只改本地 m.unread=false，服务端仍是未读，
// 7s 轮询一拉 /messages/unread-count 红点就复活——这是「点掉又出现」的根因。
async function readOne(m) {
  if (!m.unread) return;
  m.unread = false; // 乐观更新，点了立刻掉点
  try {
    await request.post('/messages/' + m.id + '/read');
  } catch {
    m.unread = true; // 失败回滚，避免本地与服务端口径不一致
    return;
  }
  syncUnread();
}

// 点操作按钮：先标已读（红点跟着掉），再跳这条消息自己的落地页
async function open(m) {
  await readOne(m);
  if (m.to) router.push(m.to);
}

// 全部已读：列表是「全量」，pending 即所有未读（以前只清当前 tab，剩下的红点一直在）
async function markAll() {
  const pending = list.value.filter((m) => m.unread);
  if (!pending.length) return;
  await Promise.all(pending.map((m) => request.post('/messages/' + m.id + '/read').catch(() => {})));
  list.value.forEach((m) => (m.unread = false));
  syncUnread();
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
