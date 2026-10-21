<template>
  <div :class="s.page">
    <!-- 整页就是聊天窗：顶栏 / 消息区（撑满剩余高度）/ 输入栏 -->
    <div v-if="cur" :class="s.chatCard">
      <!-- 顶栏：返回 + 对方信息 -->
      <div :class="s.winHead">
        <button type="button" :class="s.back" title="返回" @click="router.back()">
          <el-icon :size="16"><ArrowLeft /></el-icon>
        </button>
        <el-avatar :size="42" :class="s.winAva" :src="cur.peer.avatar">
          {{ (cur.peer.nickname || '?').slice(0, 1) }}
        </el-avatar>
        <div :class="s.winName">
          <b>{{ cur.peer.nickname || '同学' }}</b>
          <span :class="s.winSub">
            <i :class="s.dotOn" />ID：{{ cur.peer.code }} · 校园集私信
          </span>
        </div>
      </div>

      <!-- 消息区 -->
      <div ref="scrollBox" :class="s.msgs">
        <div v-for="m in records" :key="m.id" :class="[s.line, { [s.lineSelf]: m.self }]">
          <el-avatar :size="34" :class="s.mAva" :src="m.self ? myAvatar : cur.peer.avatar">
            {{ m.self ? (user.username || '?').slice(0, 1) : (cur.peer.nickname || '?').slice(0, 1) }}
          </el-avatar>
          <div :class="s.msgCol">
            <div :class="[s.bubble, { [s.bSelf]: m.self, [s.bImg]: m.type === 'image' }]">
              <img v-if="m.type === 'image'" :class="s.bImgEl" :src="m.img" @click="previewImg(m.img)" alt="图片" />
              <span v-else :class="s.bText">{{ m.text }}</span>
            </div>
            <span :class="s.bTime">{{ m.time }}</span>
          </div>
        </div>
        <el-empty v-if="!records.length" description="还没有聊天记录，先发一句" :image-size="90" />
      </div>

      <!-- 输入栏 -->
      <div :class="s.composer">
        <!-- 表情面板：点开插入，可连续点多个 -->
        <transition name="fade">
          <div v-if="showEmoji" :class="s.emojiPanel" @click.stop>
            <span v-for="e in EMOJIS" :key="e" :class="s.emoji" @click="insertEmoji(e)">{{ e }}</span>
          </div>
        </transition>

        <button
          type="button"
          :class="[s.toolBtn, { [s.toolOn]: showEmoji }]"
          title="表情"
          @click.stop="showEmoji = !showEmoji"
        >😊</button>
        <button
          type="button"
          :class="s.toolBtn"
          :disabled="uploading"
          title="发送图片"
          @click="pickImage"
        >
          <el-icon :size="18"><Picture /></el-icon>
        </button>
        <input ref="fileInput" type="file" accept="image/*" hidden @change="onPickImage" />

        <el-input
          v-model="draft"
          :class="s.input"
          placeholder="说点什么…（回车发送）"
          @keyup.enter="send"
        />
        <el-button type="primary" :class="s.send" :disabled="!draft.trim() && !uploading" @click="send">
          {{ uploading ? '发送中' : '发送' }}
        </el-button>
      </div>
    </div>

    <!-- 会话不在了（被删/参数错）：给出口，别停在白板 -->
    <div v-else-if="!loading" :class="s.empty">
      <el-empty description="会话不存在或已被删除" :image-size="90">
        <el-button type="primary" @click="router.push('/friends')">去好友列表</el-button>
      </el-empty>
    </div>
    <div v-else :class="s.empty" v-loading="true" element-loading-text="加载会话…" />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount, useCssModule } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Picture } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';
import { fromNow } from '@/utils/format';
import { useUserStore } from '@/stores/user';
import { useUiStore } from '@/stores/ui';
// 共享原子类（CSS Modules）：s.card / s.row … 各页长得一样的外观都在这份里
import shared from '@/styles/ui.module.less';

const s = { ...shared, ...useCssModule() };
const route = useRoute();
const router = useRouter();
const user = useUserStore();
const ui = useUiStore();
const myId = Number(localStorage.getItem('tb_id')) || 0;
const myAvatar = user.avatar || '';

const chats = ref([]);
const curId = ref(route.params.id);
const draft = ref('');
const scrollBox = ref(null);
const records = ref([]);
const loading = ref(true);

// 表情 / 图片
const EMOJIS = ['😀','😁','😂','🤣','😊','😍','😘','😎','🤔','😅','😭','😡','👍','👎','👏','🙏','💪','🎉','❤️','🔥','✨','🌟','💡','✅','❓','💯','😴','🥳','😇','🤝','💔','🌹','🍻','☕','🚀','⚡','🌈','🐱','🐶','🍎','🎁','👌','💕'];
const showEmoji = ref(false);
const uploading = ref(false);
const fileInput = ref(null);

const cur = computed(() => chats.value.find((c) => String(c.id) === String(curId.value)) || null);
const totalUnread = computed(() => chats.value.reduce((n, c) => n + (c.unread || 0), 0));

// 列表变化就同步「好友」tab 红点
function syncChatUnread() {
  ui.setChatUnread(totalUnread.value);
}

async function loadChats() {
  try {
    const rows = await request.get('/chats');
    chats.value = (rows || []).map((c) => ({
      id: c.id,
      peer: c.peer || { id: 0, code: '', nickname: '', avatar: '' },
      last_msg: c.last_msg || '',
      unread: c.unread || 0,
      updated_at: c.updated_at
    }));
    syncChatUnread();
  } catch (e) {
    chats.value = [];
    console.error('[ Chat ] 加载会话失败：', e);
  } finally {
    loading.value = false;
  }
}

async function loadMessages(id) {
  try {
    const { list } = await request.get('/chats/' + id + '/messages');
    records.value = (list || []).map((m) => ({
      id: m.id,
      self: m.sender_id === myId,
      type: m.type || 'text',
      text: m.text,
      img: m.img || '',
      time: fromNow(m.created_at)
    }));
  } catch (e) {
    records.value = [];
    console.error('[ Chat ] 加载消息记录失败：', e);
  }
}

async function openChat(id) {
  curId.value = id;
  draft.value = '';
  showEmoji.value = false;
  await loadMessages(id);
  // 点开就清未读：红点不跟着走，跟 IM 的习惯一致
  const c = chats.value.find((x) => String(x.id) === String(id));
  if (c && c.unread) {
    c.unread = 0;
    await request.post('/chats/' + id + '/read').catch(() => {});
    syncChatUnread();
  }
  await toBottom();
}

function nowHM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

async function send() {
  const text = draft.value.trim();
  if (!text || !curId.value) return;
  try {
    await request.post('/chats/' + curId.value + '/messages', { text });
    records.value.push({ id: Date.now(), self: true, type: 'text', text, time: nowHM() });
    bumpConv(text);
    draft.value = '';
    toBottom();
  } catch (e) {
    ElMessage.error(e?.message || '发送失败');
  }
}

async function pickImage() {
  if (!curId.value) return ElMessage.warning('请先选择会话');
  fileInput.value && fileInput.value.click();
}

async function onPickImage(e) {
  const file = e.target.files && e.target.files[0];
  if (fileInput.value) fileInput.value.value = ''; // 复位，允许重复选同一张
  if (!file) return;
  if (!curId.value) return;
  uploading.value = true;
  try {
    const fd = new FormData();
    fd.append('file', file);
    const { url } = await request.post('/upload/raw', fd);
    await request.post('/chats/' + curId.value + '/messages', { type: 'image', img: url });
    records.value.push({ id: Date.now(), self: true, type: 'image', img: url, time: nowHM() });
    bumpConv('[图片]');
    toBottom();
  } catch (err) {
    ElMessage.error(err?.message || '图片发送失败');
  } finally {
    uploading.value = false;
  }
}

// 同步会话列表的末条预览 + 顺序 + 未读清零
function bumpConv(preview) {
  const c = chats.value.find((x) => String(x.id) === String(curId.value));
  if (c) {
    c.last_msg = preview;
    c.unread = 0;
    chats.value = [c, ...chats.value.filter((x) => String(x.id) !== String(curId.value))];
  }
  syncChatUnread();
}

function insertEmoji(e) {
  draft.value += e;
}

function previewImg(src) {
  if (src) window.open(src, '_blank');
}

async function toBottom() {
  await nextTick();
  if (scrollBox.value) scrollBox.value.scrollTop = scrollBox.value.scrollHeight;
}

// 点表情面板外关闭（避免挡住输入）
function onDocClick() {
  if (showEmoji.value) showEmoji.value = false;
}

onMounted(async () => {
  await loadChats();
  const id = route.params.id;
  if (id && chats.value.find((c) => String(c.id) === String(id))) {
    openChat(id);
  }
  document.addEventListener('click', onDocClick);
});
onBeforeUnmount(() => document.removeEventListener('click', onDocClick));
</script>

<style lang="less" module>@import '@/styles/mixins.less';
/* 整页 = 一块聊天窗：高度吃满「顶栏以下、视口以内」，消息区内部自己滚 */

.page {
  height: calc(100vh - 96px);   /* 桌面：顶部导航(12+64) + 主区下边距(12) + 余量 */
  min-height: 460px;
  display: flex;
}
.chatCard {
  composes: tb-card from global;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* —— 顶栏 —— */
.winHead {
  display: flex; align-items: center; gap: 12px;
  padding: 13px 18px;
  border-bottom: 1px solid var(--tb-border);
  background: linear-gradient(180deg, var(--tb-primary-soft-2, rgba(124, 58, 237, 0.06)), transparent);
}
.back {
  display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; padding: 0; flex: none;
  border: 1px solid var(--tb-border); border-radius: 999px;
  background: var(--tb-surface); color: var(--tb-sub); cursor: pointer; transition: 0.18s;
}
.back:hover { color: var(--tb-primary); border-color: var(--tb-primary); transform: translateX(-2px); }
.winAva {
  flex: none;
  background: linear-gradient(135deg, #ede9fe, #e0f2fe); color: var(--tb-primary);
  box-shadow: 0 6px 14px var(--tb-primary-ring, rgba(124, 58, 237, 0.18));
}
.winName { display: flex; flex-direction: column; line-height: 1.4; min-width: 0; }
.winName b { font-size: 16px; }
.winSub { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--tb-sub); }
/* 「在线」绿点装饰：聊天的活气儿 */
.dotOn {
  width: 7px; height: 7px; border-radius: 999px; flex: none;
  background: #22c55e; box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
}

/* —— 消息区：撑满剩余高度，淡格纹底，滚动出气泡 —— */
.msgs {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 20px 10px;
  display: flex; flex-direction: column; gap: 16px;
  background:
    radial-gradient(circle at 1px 1px, var(--tb-border) 1px, transparent 0) 0 0 / 22px 22px,
    var(--tb-surface);
}
.line { display: flex; align-items: flex-start; gap: 10px; }
.lineSelf { flex-direction: row-reverse; }
.mAva { flex: none; background: linear-gradient(135deg, #f3f0ff, #eef6ff); }
.msgCol { display: flex; flex-direction: column; gap: 4px; max-width: min(64%, 460px); }
.lineSelf .msgCol { align-items: flex-end; }
.bubble {
  padding: 10px 14px;
  border-radius: 16px;
  border: 1px solid var(--tb-border);
  border-top-left-radius: 5px;
  background: var(--tb-card);
  box-shadow: 0 2px 8px rgba(40, 20, 90, 0.05);
  display: flex; align-items: baseline; gap: 9px;
  word-break: break-word;
}
.bSelf {
  .grad-brand();
  border-color: transparent;
  border-top-left-radius: 16px;
  border-top-right-radius: 5px;
  color: @c-white;
  box-shadow: 0 6px 16px var(--tb-primary-ring, rgba(124, 58, 237, 0.28));
}
.bText { font-size: 14px; line-height: 1.65; white-space: pre-wrap; word-break: break-word; }
/* 时间挪到气泡外：气泡更干净，时间也更好认 */
.bTime { font-size: 10.5px; color: var(--tb-sub); padding: 0 4px; }

/* 图片消息气泡：透明底只留细边框，图片圆角可点开 */
.bImg { background: transparent; border-color: var(--tb-border); padding: 4px; gap: 0; align-items: center; }
.bImg.bSelf { background: transparent; border-color: var(--tb-border); box-shadow: none; }
.bImgEl { display: block; max-width: min(240px, 60vw); max-height: 280px; border-radius: 12px; cursor: zoom-in; object-fit: cover; }

/* —— 输入栏 —— */
.composer {
  position: relative;
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px 14px;
  border-top: 1px solid var(--tb-border);
  background: var(--tb-card);
}
.toolBtn {
  flex: none; width: 40px; height: 40px; padding: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid var(--tb-border); border-radius: 999px;
  background: var(--tb-surface); color: var(--tb-sub); cursor: pointer;
  font-size: 18px; line-height: 1; transition: 0.18s;
}
.toolBtn:hover { color: var(--tb-primary); border-color: var(--tb-primary-ring, rgba(124, 58, 237, 0.3)); transform: translateY(-1px); }
.toolOn { color: var(--tb-primary); border-color: var(--tb-primary-ring, rgba(124, 58, 237, 0.3)); background: var(--tb-primary-soft); }
.toolBtn:disabled { opacity: 0.5; cursor: not-allowed; }

.input { flex: 1; }
.input :deep(.el-input__wrapper) {
  border-radius: 999px;
  box-shadow: 0 0 0 1px var(--tb-border, rgba(124, 58, 237, 0.16));
  background: var(--tb-surface);
  transition: 0.2s;
}
.input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--tb-primary, #7c3aed), 0 6px 18px var(--tb-primary-soft, rgba(124, 58, 237, 0.16));
}
/* 发送按钮：品牌渐变，和气泡一个气质 */
.send {
  flex: none; border: 0; border-radius: 999px; padding-inline: 24px;
  .grad-brand(); color: @c-white;
  box-shadow: 0 6px 16px var(--tb-primary-ring, rgba(124, 58, 237, 0.28));
}
.send:disabled { opacity: 0.55; }

/* 表情面板：输入栏上方弹出 */
.emojiPanel {
  position: absolute; bottom: calc(100% - 4px); left: 16px; right: 16px;
  z-index: 20;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(38px, 1fr)); gap: 2px;
  max-height: 200px; overflow-y: auto;
  padding: 10px;
  border: 1px solid var(--tb-border);
  border-radius: 16px;
  background: var(--tb-card);
  box-shadow: 0 16px 40px rgba(40, 20, 90, 0.18);
}
.emoji {
  display: flex; align-items: center; justify-content: center;
  height: 38px; font-size: 21px; cursor: pointer; border-radius: 10px;
  transition: 0.12s;
}
.emoji:hover { background: var(--tb-primary-soft); transform: scale(1.14); }

.empty { flex: 1; display: flex; align-items: center; justify-content: center; }

/* 手机端：顶部更矮，高度扣掉 header(60) + tabbar 区(68) */
.m-sm({
  .page { height: calc(100vh - 132px); min-height: 420px; }
  .winHead { padding: 10px 12px; }
  .winName b { font-size: 15px; }
  .msgs { padding: 14px 12px 6px; gap: 12px; }
  .msgCol { max-width: 78%; }
  .bImgEl { max-width: min(170px, 52vw); max-height: 210px; }
  .composer { padding: 10px 10px 12px; gap: 8px; }
  .send { padding-inline: 16px; }
});

.fade-enter-active, .fade-leave-active { transition: opacity 0.18s, transform 0.18s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(6px); }
</style>
