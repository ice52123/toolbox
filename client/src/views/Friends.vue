<template>
  <div :class="s.page">
    <!-- 头部：标题 + 双 tab（好友 / 新朋友） -->
    <div :class="s.head">
      <div>
        <h2>好友</h2>
        <p :class="s.sub">用 6 位好友 ID 添加 · 点好友发起私聊 · 左滑或长按可删除</p>
      </div>
      <div :class="s.tabs">
        <button type="button" :class="[s.tab, { [s.tabOn]: tab === 'friends' }]" @click="tab = 'friends'">
          好友<span :class="s.tCount" v-if="friends.length">{{ friends.length }}</span>
        </button>
        <button type="button" :class="[s.tab, { [s.tabOn]: tab === 'requests' }]" @click="tab = 'requests'">
          新朋友
          <i :class="s.tDot" v-if="reqIncoming.length">{{ reqIncoming.length > 99 ? '99+' : reqIncoming.length }}</i>
        </button>
      </div>
    </div>

    <!-- ============ 好友 tab ============ -->
    <template v-if="tab === 'friends'">
      <!-- 添加区：输入 6 位 ID → 查找 → 确认添加 -->
      <div :class="s.add">
        <el-input
          v-model="code"
          :class="s.input"
          placeholder="输入好友的 6 位 ID"
          maxlength="6"
          clearable
          @input="onCodeInput"
          @keyup.enter="doSearch"
        >
          <template #prefix><el-icon><Postcard /></el-icon></template>
        </el-input>
        <el-button type="primary" :class="s.addBtn" :loading="searching" @click="doSearch">查找</el-button>
      </div>

      <!-- 查找结果预览：确认添加，避免加错人 -->
      <transition name="fade">
        <div v-if="pending" :class="s.preview">
          <el-avatar :size="40" :class="s.pAva" :src="pending.user.avatar">👤</el-avatar>
          <div :class="s.pMain">
            <div :class="s.pName">{{ pending.user.nickname }}</div>
            <div :class="s.pCode">ID：{{ pending.user.code }}</div>
          </div>
          <div :class="s.pOps">
            <el-button size="small" type="primary" :loading="adding" @click="doAdd">添加</el-button>
            <el-button size="small" @click="cancelPending">取消</el-button>
          </div>
        </div>
      </transition>

      <!-- 好友列表 -->
      <div :class="s.list">
        <div
          v-for="f in friends"
          :key="f.id"
          :class="[s.item, { [s.itemOpen]: openId === f.id }]"
          @click="onRowClick(f)"
        >
          <button type="button" :class="s.delBtn" @click.stop="armDelete(f)">删除</button>

          <div
            :class="s.content"
            :style="{ transform: 'translateX(' + offsetOf(f.id) + 'px)' }"
            @touchstart.passive="onStart($event, f)"
            @touchmove="onMove($event, f)"
            @touchend="onEnd($event, f)"
            @mousedown="onMouseDown(f)"
            @mouseup="onMouseUp(f)"
            @mouseleave="onMouseUp(f)"
          >
            <el-avatar :size="46" :class="s.ava" :src="f.avatar">👤</el-avatar>
            <div :class="s.main">
              <div :class="s.top">
                <span :class="s.name">{{ f.nickname || '同学' }}</span>
                <span :class="s.badge" v-if="f.unread">{{ f.unread > 99 ? '99+' : f.unread }}</span>
                <span :class="s.time">{{ fromNow(f.created_at) }}</span>
              </div>
              <div :class="s.code">ID：{{ f.code }}</div>
            </div>
            <button type="button" :class="s.delIco" title="删除好友" @click.stop="armDelete(f)">
              <el-icon :size="16"><Delete /></el-icon>
            </button>

            <!-- 就地两步确认：覆盖整行，不弹确认框 -->
            <div v-if="delId === f.id" :class="s.confirmLayer" @click.stop>
              <span :class="s.cfText">删除好友会一并清空聊天记录</span>
              <el-button size="small" type="danger" @click.stop="doDelete(f)">确认删除</el-button>
              <el-button size="small" @click.stop="delId = null">取消</el-button>
            </div>
          </div>
        </div>

        <el-empty v-if="!friends.length && !loading" description="还没有好友，用 6 位 ID 添加一个吧" :image-size="80" />
        <div :class="s.tip" v-if="friends.length">左滑或长按好友可删除 · 点击发起私聊</div>
      </div>

      <!-- 聊过的陌生人：非好友但有过私聊（闲置市场「聊聊」进来的），点了才知道聊过谁 -->
      <div v-if="strangers.length" :class="s.strangerSec">
        <div :class="s.reqTitle">聊过的陌生人（非好友）</div>
        <div v-for="st in strangers" :key="st.id" :class="s.reqItem" @click="openStranger(st)">
          <el-avatar :size="44" :class="s.ava" :src="st.peer.avatar">👤</el-avatar>
          <div :class="s.reqMain">
            <div :class="s.rName">
              {{ st.peer.nickname || '同学' }}
              <span :class="s.stTag">陌生人</span>
              <span :class="s.badge" v-if="st.unread">{{ st.unread > 99 ? '99+' : st.unread }}</span>
            </div>
            <div :class="s.rCode">ID：{{ st.peer.code }}{{ st.last_msg ? ' · ' + st.last_msg : '' }}</div>
          </div>
          <div :class="s.reqOps" @click.stop>
            <!-- 已发过申请就不再给可点的「加好友」，避免重复提交 / 无反馈 -->
            <el-button v-if="isRequested(st)" size="small" disabled>已申请</el-button>
            <el-button
              v-else
              size="small"
              type="primary"
              :loading="st._sending"
              @click="addStranger(st)"
            >加好友</el-button>
            <el-button v-if="delStId !== st.id" size="small" @click="delStId = st.id">删除</el-button>
            <template v-else>
              <el-button size="small" type="danger" @click="doDelStranger(st)">确认删除？</el-button>
              <el-button size="small" @click="delStId = null">取消</el-button>
            </template>
          </div>
        </div>
        <div :class="s.tip">点击可继续聊天 · 加上好友后就会出现在上面列表里</div>
      </div>
    </template>

    <!-- ============ 新朋友 tab（独立入口） ============ -->
    <template v-else>
      <div :class="s.reqWrap">
        <!-- 收到的申请：可 通过 / 忽略 -->
        <div :class="s.reqSec" v-if="reqIncoming.length">
          <div :class="s.reqTitle">收到的申请</div>
          <div v-for="r in reqIncoming" :key="r.id" :class="s.reqItem">
            <el-avatar :size="44" :class="s.ava" :src="r.user.avatar">👤</el-avatar>
            <div :class="s.reqMain">
              <div :class="s.rName">{{ r.user.nickname || '同学' }}</div>
              <div :class="s.rCode">ID：{{ r.user.code }} · {{ fromNow(r.created_at) }}</div>
            </div>
            <div :class="s.reqOps">
              <el-button size="small" type="primary" :loading="r._ing" @click="accept(r)">通过</el-button>
              <el-button size="small" @click="decline(r)">忽略</el-button>
            </div>
          </div>
        </div>

        <!-- 我发出的申请：等待对方通过 -->
        <div :class="s.reqSec" v-if="reqOutgoing.length">
          <div :class="s.reqTitle">我发出的</div>
          <div v-for="r in reqOutgoing" :key="r.id" :class="s.reqItem">
            <el-avatar :size="44" :class="s.ava" :src="r.user.avatar">👤</el-avatar>
            <div :class="s.reqMain">
              <div :class="s.rName">{{ r.user.nickname || '同学' }}</div>
              <div :class="s.rCode">ID：{{ r.user.code }} · 等待验证</div>
            </div>
            <span :class="s.reqWait">待通过</span>
          </div>
        </div>

        <el-empty
          v-if="!reqIncoming.length && !reqOutgoing.length"
          description="暂无好友申请"
          :image-size="80"
        />
        <div :class="s.tip">别人加你为好友时，会在这里出现「通过 / 忽略」</div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, useCssModule } from 'vue';
import { useRouter } from 'vue-router';
import { Postcard, Delete } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';
import { fromNow } from '@/utils/format';
import { useUiStore } from '@/stores/ui';
// 共享原子类（CSS Modules）：卡片 / 行 / 空态那部分吃 ui.module.less
import shared from '@/styles/ui.module.less';

const s = { ...shared, ...useCssModule() };
const router = useRouter();
const ui = useUiStore();

const tab = ref('friends');
const friends = ref([]);
const loading = ref(false);
const code = ref('');
const searching = ref(false);
const adding = ref(false);
const pending = ref(null); // 查找预览：{ found, isFriend, pending, user }
// 待删好友 / 待删会话 id：删除改成就地两步确认（再点一次才真删），不弹确认框
const delId = ref(null);
const delStId = ref(null);

// 新朋友：incoming=待我通过，outgoing=我发出的
const reqIncoming = ref([]);
const reqOutgoing = ref([]);

// 聊过的陌生人：有过会话但不是好友（闲置市场「聊聊」进来的那种）
const strangers = ref([]);

// 「我发出的申请」里的 code 集合：陌生人行据此回显「已申请」。
// 用 computed 而非手动标记 strangers 项，好处是刷新页面、重新拉申请后状态自动对上，
// 也不会因为 onMounted 里 loadFriends / loadRequests 的先后顺序而漏标。
const outgoingCodes = computed(
  () => new Set(reqOutgoing.value.map((r) => r.user && r.user.code).filter(Boolean))
);
function isRequested(st) {
  return !!st.peer.code && outgoingCodes.value.has(st.peer.code);
}

// —— 左滑 / 长按删除 ——
const DELETE_W = 76;
const dragId = ref(null);
const dragX = ref(0);
const openId = ref(null);
let startX = 0, startY = 0, moved = false, lpTimer = null, suppressClick = false;

function offsetOf(id) {
  if (dragId.value === id) return dragX.value;
  return openId.value === id ? -DELETE_W : 0;
}

function onCodeInput(v) {
  // 只允许 6 位好友 ID 字符集（去 0/O/1/I/L 那套），自动转大写
  code.value = (v || '').toUpperCase().replace(/[^2-9A-Z]/g, '').slice(0, 6);
  if (pending.value) pending.value = null;
}

async function doSearch() {
  const c = code.value.trim();
  if (c.length !== 6) return ElMessage.warning('请输入 6 位好友 ID');
  searching.value = true;
  try {
    const r = await request.get('/friends/search', { params: { code: c } });
    if (!r.found) {
      pending.value = null;
      return ElMessage.error('没有找到这个 ID 对应的用户');
    }
    if (r.isFriend) {
      pending.value = null;
      code.value = '';
      return ElMessage.info('你们已经是好友啦');
    }
    if (r.pending) {
      pending.value = null;
      code.value = '';
      return ElMessage.info('申请已发送，等待对方通过');
    }
    pending.value = r;
  } catch (e) {
    pending.value = null;
    ElMessage.error(e?.message || '查找失败');
  } finally {
    searching.value = false;
  }
}

async function doAdd() {
  if (!pending.value) return;
  adding.value = true;
  try {
    await request.post('/friends', { code: pending.value.user.code });
    ElMessage.success('申请已发送，等待对方通过');
    code.value = '';
    pending.value = null;
    await loadRequests(); // 刷新「我发出的」列表
    ui.loadFriendRequests();
  } catch (e) {
    ElMessage.error(e?.message || '添加失败');
  } finally {
    adding.value = false;
  }
}

function cancelPending() {
  pending.value = null;
}

async function loadFriends() {
  loading.value = true;
  try {
    friends.value = await request.get('/friends');
    await loadStrangers(); // 好友列表定了才能算出谁是「陌生人」
  } catch (e) {
    console.error('[ Friends ] 加载失败：', e);
  } finally {
    loading.value = false;
  }
}

// 会话里那些不在好友列表里的，就是「聊过的陌生人」
async function loadStrangers() {
  try {
    const rows = await request.get('/chats');
    const fids = new Set(friends.value.map((f) => f.id));
    strangers.value = (rows || []).filter((c) => c.peer && c.peer.id && !fids.has(c.peer.id));
  } catch (e) {
    strangers.value = [];
    console.error('[ Friends ] 加载陌生人会话失败：', e);
  }
}

// 点陌生人 → 直接回他的会话继续聊
function openStranger(st) {
  router.push('/chat/' + st.id);
}

// 陌生人补一张好友申请（复用加好友接口，用会话里带的 6 位 code）
async function addStranger(st) {
  if (st._sending || isRequested(st)) return; // 防重复点
  st._sending = true;
  try {
    await request.post('/friends', { code: st.peer.code });
    ElMessage.success('好友申请已发送，等待对方通过');
    await loadRequests(); // 刷新出「我发出的」→ 该行按钮自动变「已申请」
    ui.loadFriendRequests();
  } catch (e) {
    ElMessage.error(e?.message || '发送申请失败');
  } finally {
    st._sending = false;
  }
}

// 删掉跟陌生人的会话（聊天记录一起清）：就地两步确认，不弹确认框
async function doDelStranger(st) {
  delStId.value = null;
  try {
    await request.delete('/chats/' + st.id);
    strangers.value = strangers.value.filter((x) => x.id !== st.id);
    ElMessage.success('已删除会话');
  } catch (e) {
    ElMessage.error(e?.message || '删除失败');
  }
}

async function loadRequests() {
  try {
    const { incoming, outgoing } = await request.get('/friends/requests');
    reqIncoming.value = incoming || [];
    reqOutgoing.value = outgoing || [];
    ui.setFriendReqCount(reqIncoming.value.length);
  } catch (e) {
    console.error('[ Friends ] 加载申请失败：', e);
  }
}

async function accept(r) {
  r._ing = true;
  try {
    await request.post('/friends/requests/' + r.id + '/accept');
    ElMessage.success('已添加为好友');
    reqIncoming.value = reqIncoming.value.filter((x) => x.id !== r.id);
    ui.setFriendReqCount(reqIncoming.value.length);
    ui.loadFriendRequests();
    await loadFriends(); // 新好友进列表（顺带刷新陌生人：对方已是好友，会从陌生人区消失）
    tab.value = 'friends';
  } catch (e) {
    ElMessage.error(e?.message || '通过失败');
  } finally {
    r._ing = false;
  }
}

async function decline(r) {
  try {
    await request.post('/friends/requests/' + r.id + '/decline');
    reqIncoming.value = reqIncoming.value.filter((x) => x.id !== r.id);
    ui.setFriendReqCount(reqIncoming.value.length);
    ui.loadFriendRequests();
    ElMessage.success('已忽略申请');
  } catch (e) {
    ElMessage.error(e?.message || '忽略失败');
  }
}

// 点好友 → 取/建会话 → 进私聊
async function onRowClick(f) {
  if (suppressClick) {
    suppressClick = false;
    return;
  }
  openId.value = null;
  try {
    const { convId } = await request.post('/chats/with/' + f.code);
    router.push('/chat/' + convId);
  } catch (e) {
    ElMessage.error(e?.message || '打开会话失败');
  }
}

// 进入待确认态（就地两步确认，不弹确认框）
function armDelete(f) {
  resetSwipe(); // 收起左滑，露出整行确认层
  delId.value = f.id;
}

async function doDelete(f) {
  delId.value = null;
  try {
    await request.delete('/friends/' + f.id);
    ElMessage.success('已删除好友');
    friends.value = friends.value.filter((x) => x.id !== f.id);
    if (openId.value === f.id) openId.value = null;
    loadStrangers(); // 删好友会连会话一起清，陌生人区跟着刷新
  } catch (e) {
    ElMessage.error(e?.message || '删除失败');
  }
}

// —— 触摸：左滑揭示删除按钮 ——
function onStart(e, f) {
  if (!e.touches || !e.touches.length) return;
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  moved = false;
  dragId.value = f.id;
  dragX.value = openId.value === f.id ? -DELETE_W : 0;
  lpTimer = setTimeout(() => {
    if (!moved) {
      suppressClick = true;
      delId.value = f.id;
      resetSwipe();
    }
  }, 550);
}
function onMove(e, f) {
  if (dragId.value !== f.id || !e.touches || !e.touches.length) return;
  const x = e.touches[0].clientX, y = e.touches[0].clientY;
  const dx = x - startX, dy = y - startY;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) {
    moved = true;
    if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; }
  }
  if (moved) {
    let nx = (openId.value === f.id ? -DELETE_W : 0) + dx;
    nx = Math.max(-DELETE_W, Math.min(0, nx));
    dragX.value = nx;
    if (e.cancelable) e.preventDefault();
  }
}
function onEnd() {
  if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; }
  if (dragId.value == null) return;
  if (dragX.value < -DELETE_W / 2) {
    openId.value = dragId.value;
    dragX.value = -DELETE_W;
  } else {
    openId.value = null;
    dragX.value = 0;
  }
  dragId.value = null;
}
function resetSwipe() {
  dragId.value = null;
  dragX.value = 0;
  openId.value = null;
}

// —— 桌面：长按（mousedown 计时）也能触发删除确认 ——
function onMouseDown(f) {
  lpTimer = setTimeout(() => {
    suppressClick = true;
    delId.value = f.id;
  }, 600);
}
function onMouseUp() {
  if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; }
}

onMounted(() => {
  loadFriends();
  loadRequests();
});
</script>

<style lang="less" module>@import '@/styles/mixins.less';
/* 只放本页特有样式；卡片外观吃 ui.module.less */

.page { width: 100%; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.head h2 { margin: 0; font-size: 22px; }
.sub { margin: 6px 0 0; color: var(--tb-sub); font-size: 12.5px; }

/* 双 tab */
.tabs { display: flex; gap: 6px; flex: none; }
.tab {
  position: relative;
  display: inline-flex; align-items: center; gap: 5px;
  padding: 7px 14px; border: 1px solid var(--tb-border); border-radius: 999px;
  background: var(--tb-surface); color: var(--tb-sub); cursor: pointer;
  font-size: 13.5px; font-weight: 600; transition: 0.18s;
}
.tab:hover { border-color: var(--tb-primary-ring, rgba(124, 58, 237, 0.3)); }
.tabOn { background: var(--tb-primary, #7c3aed); border-color: transparent; color: #fff; box-shadow: 0 6px 16px var(--tb-primary-ring, rgba(124, 58, 237, 0.28)); }
.tCount {
  min-width: 18px; height: 18px; padding: 0 5px;
  .flex-center(); border-radius: 999px;
  background: var(--tb-primary-soft); color: var(--tb-primary);
  font-size: 11px; font-weight: 700; line-height: 1;
}
.tabOn .tCount { background: rgba(255, 255, 255, 0.22); color: #fff; }
.tDot {
  min-width: 16px; height: 16px; padding: 0 4px; box-sizing: border-box;
  .flex-center(); border-radius: 999px;
  background: var(--tb-danger, #ef4444); color: #fff;
  font-size: 10px; font-weight: 700; font-style: normal; line-height: 1;
}

/* 添加区：胶囊输入 + 实心按钮 */
.add { display: flex; gap: 10px; margin-bottom: 12px; }
.input { flex: 1; }
.input :deep(.el-input__wrapper) {
  border-radius: 999px;
  box-shadow: 0 0 0 1px var(--tb-border, rgba(124, 58, 237, 0.16));
}
.addBtn { flex: none; border-radius: 999px; padding-inline: 22px; }

/* 查找预览卡 */
.preview {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; margin-bottom: 12px;
  border: 1px solid var(--tb-primary-ring, rgba(124, 58, 237, 0.3));
  border-radius: @r-lg;
  background: var(--tb-primary-soft-2, rgba(124, 58, 237, 0.07));
  animation: pop 0.2s ease;
}
.pAva { flex: none; background: linear-gradient(135deg, #ede9fe, #e0f2fe); }
.pMain { flex: 1; min-width: 0; }
.pName { font-weight: 700; font-size: 14.5px; .ellipsis-one(); }
.pCode { font-size: 12px; color: var(--tb-sub); margin-top: 2px; }
.pOps { display: flex; gap: 8px; flex: none; }

/* 列表 */
.list { display: flex; flex-direction: column; gap: 10px; }
.item {
  position: relative;
  overflow: hidden;
  border-radius: @r-lg;
  background: var(--tb-danger, #ef4444);
}
/* 左滑揭示的删除按钮：铺满 item 右侧，文字居中 */
.delBtn {
  position: absolute; top: 0; right: 0; bottom: 0;
  width: 76px; padding: 0; border: 0; cursor: pointer;
  background: var(--tb-danger, #ef4444); color: #fff;
  font-size: 14px; font-weight: 700;
}
/* 内容层：白底卡片，左滑时整块左移露出红色删除区 */
.content {
  position: relative;
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  background: var(--tb-card);
  border: 1px solid var(--tb-border);
  border-radius: @r-lg;
  cursor: pointer;
  transition: transform 0.18s ease;
  touch-action: pan-y;
}
.itemOpen .content { transition: none; }
.content:hover { border-color: var(--tb-primary-ring, rgba(124, 58, 237, 0.3)); }

.ava { flex: none; background: linear-gradient(135deg, #ede9fe, #e0f2fe); color: var(--tb-primary); }
.main { flex: 1; min-width: 0; }
.top { display: flex; align-items: baseline; gap: 8px; }
.name { font-weight: 700; font-size: 15px; .ellipsis-one(); }
.time { font-size: 11px; color: var(--tb-sub); margin-left: auto; flex: none; }
.code { font-size: 12px; color: var(--tb-sub); margin-top: 3px; .ellipsis-one(); }
.badge {
  min-width: 18px; height: 18px; padding: 0 5px;
  .flex-center(); border-radius: 999px;
  background: var(--tb-danger, #ef4444); color: #fff;
  font-size: 11px; font-weight: 700; line-height: 1;
}
/* 桌面端 hover 才露出的删除图标（移动端靠左滑，不抢位置） */
.delIco {
  display: none;
  flex: none; width: 30px; height: 30px; padding: 0;
  border: 1px solid var(--tb-line); border-radius: 10px;
  background: transparent; color: var(--tb-sub); cursor: pointer;
  transition: 0.18s;
}
.delIco:hover { color: var(--tb-danger); border-color: var(--tb-danger); background: rgba(244, 63, 94, 0.08); }
@media (hover: hover) and (pointer: fine) {
  .delIco { display: inline-flex; align-items: center; justify-content: center; }
}
/* 就地两步确认层：盖住整行，替代确认弹窗 */
.confirmLayer {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  background: var(--tb-card);
  border: 1px solid var(--tb-danger, #ef4444);
  border-radius: @r-lg;
}
.cfText { flex: 1; min-width: 0; font-size: 13px; color: var(--tb-sub); .ellipsis-one(); }

.tip { margin-top: 10px; text-align: center; font-size: 12px; color: var(--tb-sub); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }
@keyframes pop {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}

/* —— 新朋友 tab —— */
.reqWrap { display: flex; flex-direction: column; gap: 6px; }
.reqSec { display: flex; flex-direction: column; gap: 10px; }
.reqSec + .reqSec { margin-top: 8px; }
.reqTitle { font-size: 13px; font-weight: 700; color: var(--tb-sub); padding: 4px 2px 0; }
.reqItem {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  background: var(--tb-card);
  border: 1px solid var(--tb-border);
  border-radius: @r-lg;
}
.reqMain { flex: 1; min-width: 0; }
.rName { font-weight: 700; font-size: 15px; .ellipsis-one(); }
.rCode { font-size: 12px; color: var(--tb-sub); margin-top: 3px; .ellipsis-one(); }
.reqOps { display: flex; gap: 8px; flex: none; }
.reqWait {
  flex: none; font-size: 12px; color: var(--tb-sub);
  padding: 4px 10px; border-radius: 999px; background: var(--tb-surface);
  border: 1px solid var(--tb-border);
}

/* —— 聊过的陌生人区 —— */
.strangerSec { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
.strangerSec .reqItem { cursor: pointer; transition: 0.18s; }
.strangerSec .reqItem:hover { border-color: var(--tb-primary-ring, rgba(124, 58, 237, 0.3)); }
.stTag {
  display: inline-block; vertical-align: 1px;
  margin-left: 6px; padding: 1px 8px;
  border-radius: 999px; border: 1px dashed var(--tb-border);
  background: var(--tb-surface); color: var(--tb-sub);
  font-size: 10.5px; font-weight: 600; line-height: 1.5;
}
.strangerSec .rName { display: flex; align-items: center; gap: 2px; }
.strangerSec .badge { margin-left: auto; }

@media (max-width: 900px) {
  .head h2 { font-size: 19px; }
  .sub { font-size: 11.5px; }
  .addBtn { padding-inline: 16px; }
}
</style>
