<template>
  <div :class="s.page">
    <div :class="s.layout">
      <!-- 左：会话列表。窄屏隐藏（只有一条会话在聊，列表是累赘） -->
      <div :class="s.side">
        <div :class="s.sideHead">
          <b>会话</b>
          <span :class="s.sideSub">{{ totalUnread ? totalUnread + ' 条未读' : '全部已读' }}</span>
        </div>

        <div
          v-for="c in chats"
          :key="c.id"
          :class="[s.item, { [s.itemOn]: c.id === curId }]"
          @click="openChat(c.id)"
        >
          <div :class="s.ava">{{ c.avatar }}</div>
          <div :class="s.main">
            <div :class="s.top">
              <span :class="s.name">{{ c.name }}</span>
              <span :class="s.time">{{ c.time }}</span>
            </div>
            <div :class="s.sub">{{ c.sub }}</div>
          </div>
          <el-badge v-if="c.unread" :value="c.unread" :class="s.badge" />
        </div>
      </div>

      <!-- 右：会话窗 -->
      <div :class="s.win">
        <template v-if="cur">
          <div :class="s.winHead">
            <button type="button" :class="s.back" title="返回消息中心" @click="router.push('/message')">
              <el-icon :size="16"><ArrowLeft /></el-icon>
            </button>
            <div :class="s.winAva">{{ cur.avatar }}</div>
            <div :class="s.winName">
              <b>{{ cur.name }}</b>
              <span :class="s.winSub">{{ cur.sub }} · 校园集消息</span>
            </div>
          </div>

          <div ref="scrollBox" :class="s.msgs">
            <div v-for="m in records" :key="m.id" :class="[s.line, { [s.lineSelf]: m.self }]">
              <div :class="s.mAva">{{ m.self ? '🙋' : cur.avatar }}</div>
              <div :class="[s.bubble, { [s.bSelf]: m.self }]">
                <span :class="s.bText">{{ m.text }}</span>
                <span :class="s.bTime">{{ m.time }}</span>
              </div>
            </div>
            <el-empty v-if="!records.length" description="还没有聊天记录，先发一句" :image-size="70" />
          </div>

          <div :class="s.composer">
            <el-input
              v-model="draft"
              :class="s.input"
              placeholder="说点什么…（回车发送）"
              @keyup.enter="send"
            />
            <el-button type="primary" :class="s.send" :disabled="!draft.trim()" @click="send">发送</el-button>
          </div>
        </template>

        <el-empty v-else description="会话不存在，先回消息中心看看" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, useCssModule } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';
import { chats as mockChats, chatRecords as mockRecords } from '@/config/mockData';
// 共享原子类（CSS Modules）：s.card / s.row … 各页长得一样的外观都在这份里
import shared from '@/styles/ui.module.less';

// 一个句柄拿两类样式：ui.module.css 的共享原子类 + 本组件 @import '@/styles/mixins.less';
const s = { ...shared, ...useCssModule() };

const route = useRoute();
const router = useRouter();
// 列表和记录都本地化：发的新消息留在当前会话里（刷新即丢，跟其他页的 mock 口径一致）
const chats = ref(mockChats.map((c) => ({ ...c })));
const curId = ref(route.params.id);
const draft = ref('');
const scrollBox = ref(null);

const records = ref((mockRecords[route.params.id] || []).map((r) => ({ ...r })));

const cur = computed(() => chats.value.find((c) => c.id === curId.value) || null);
const totalUnread = computed(() => chats.value.reduce((n, c) => n + (c.unread || 0), 0));

async function openChat(id) {
  curId.value = id;
  draft.value = '';
  records.value = (mockRecords[id] || []).map((r) => ({ ...r }));
  // 点开就清未读：红点不跟着走，跟 IM 的习惯一致
  const c = chats.value.find((x) => x.id === id);
  if (c) c.unread = 0;
  await toBottom();
}

function nowHM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function send() {
  const text = draft.value.trim();
  if (!text) return;
  records.value.push({ id: Date.now(), self: true, name: '我', text, time: nowHM() });
  draft.value = '';
  toBottom();
}

// 新消息上屏后才滚：nextTick 等 DOM 长出气泡，否则 scrollHeight 还是旧的
async function toBottom() {
  await nextTick();
  if (scrollBox.value) scrollBox.value.scrollTop = scrollBox.value.scrollHeight;
}

onMounted(toBottom);
</script>

<style lang="less" module>@import '@/styles/mixins.less';
/* 只放「本页特有」的样式；卡片外观吃 ui.module.css，别重复抄一遍 */

.page { composes: tb-page from global; }
/* 会话页要「整屏一块卡」的观感，两栏同高，所以限宽比正文页窄一点 */
.layout { composes: tb-card from global; display: grid; grid-template-columns: 260px 1fr; overflow: hidden; }

.side { border-right: 1px solid var(--tb-border); display: flex; flex-direction: column; min-width: 0; }
.sideHead { display: flex; align-items: baseline; gap: 8px; padding: 14px 16px 10px; border-bottom: 1px solid var(--tb-border); }
.sideHead b { font-size: 15px; }
.sideSub { font-size: 12px; color: var(--tb-sub); margin-left: auto; }

.item { position: relative; display: flex; align-items: center; gap: 11px; padding: 12px 16px; cursor: pointer; transition: 0.18s; }
.item:hover { background: var(--tb-primary-soft); }
.itemOn { background: var(--tb-primary-soft); }
.itemOn::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; .grad-brand(); }

.ava {
  width: 40px; height: 40px; flex: 0 0 40px;
  border-radius: 13px; font-size: 20px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #f3f0ff, #eef6ff);
}
.main { flex: 1; min-width: 0; }
.top { display: flex; align-items: baseline; gap: 8px; }
.name { font-weight: 600; font-size: 14px; .ellipsis-one(); }
.time { font-size: 11px; color: var(--tb-sub); margin-left: auto; flex: none; }
.sub { font-size: 12px; color: var(--tb-sub); margin-top: 3px; .ellipsis-one(); }
.badge { position: absolute; top: 12px; right: 12px; }

/* —— 会话窗 —— */
.win { display: flex; flex-direction: column; min-width: 0; min-height: 520px; }
.winHead { display: flex; align-items: center; gap: 11px; padding: 13px 16px; border-bottom: 1px solid var(--tb-border); }
.back {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; padding: 0; flex: none;
  border: 1px solid var(--tb-border); border-radius: 10px;
  background: transparent; color: var(--tb-sub); cursor: pointer; transition: 0.18s;
}
.back:hover { color: var(--tb-primary); border-color: var(--tb-primary); }
.winAva {
  width: 38px; height: 38px; flex: 0 0 38px; border-radius: 12px; font-size: 19px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #ede9fe, #e0f2fe);
}
.winName { display: flex; flex-direction: column; line-height: 1.35; min-width: 0; }
.winName b { font-size: 15px; }
.winSub { font-size: 12px; color: var(--tb-sub); .ellipsis-one(); }

.msgs { flex: 1; min-height: 300px; max-height: 480px; overflow-y: auto; padding: 18px 18px 6px; display: flex; flex-direction: column; gap: 14px; }
.line { display: flex; align-items: flex-start; gap: 10px; }
.lineSelf { flex-direction: row-reverse; }
.mAva {
  width: 32px; height: 32px; flex: 0 0 32px; border-radius: 10px; font-size: 16px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #f3f0ff, #eef6ff);
}
.bubble {
  max-width: min(62%, 420px);
  padding: 10px 13px;
  border-radius: 14px;
  border: 1px solid var(--tb-border);
  background: var(--tb-card);
  display: flex; align-items: baseline; gap: 9px;
}
.bSelf { .grad-brand(); border-color: transparent; color: @c-white; }
.bText { font-size: 13.8px; line-height: 1.65; white-space: pre-wrap; word-break: break-word; }
.bTime { font-size: 11px; color: var(--tb-sub); flex: none; }
.bSelf .bTime { color: rgba(255, 255, 255, 0.78); }

.composer { display: flex; align-items: center; gap: 10px; padding: 12px 14px 14px; border-top: 1px solid var(--tb-border); }
.input { flex: 1; }
.send { flex: none; }

/* 手机端：只留会话窗，列表收起来 */
.m-sm({
  .layout { grid-template-columns: 1fr; }
  .side { display: none; }
  .win { min-height: 460px; }
  .msgs { max-height: 420px; padding: 14px 12px 4px; }
  .bubble { max-width: 76%; }
  .winHead { padding: 11px 12px; }
});
</style>
