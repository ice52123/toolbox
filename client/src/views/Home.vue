<template>
  <div>
    <!-- Hero + 数据 -->
    <div class="hero tb-card">
      <div class="hero-l">
        <h1 class="tb-gradient-text">校园集</h1>
        <p>校园生活一站式 · 社区 / 闲置 / 工具 · 打开即用</p>
        <div class="hero-btns">
          <el-button type="primary" size="large" @click="$router.push('/m/idle')">逛闲置市场</el-button>
          <el-button size="large" @click="$router.push('/community')">去校园社区</el-button>
        </div>
      </div>
      <div class="hero-r">
        <div v-for="s in stats" :key="s.key" class="stat">
          <div class="stat-v">{{ s.value }}<span>{{ s.unit }}</span></div>
          <div class="stat-l">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <!-- 公告：竖向滚动（5s 自动换一条），整条可点进公告中心，右侧箭头同样能跳 -->
    <div class="notice tb-card" @click="openNotice">
      <el-icon class="n-bell" :size="16"><Bell /></el-icon>
      <div class="n-view">
        <div class="n-track" :style="{ transform: `translateY(-${noticeIdx * 22}px)` }">
          <div v-for="n in notices" :key="n.id" class="n-item">
            <em>{{ n.tag }}</em>{{ n.title }}
          </div>
        </div>
      </div>
      <el-button text size="small" class="n-more" @click.stop="nextNotice">换一条</el-button>
      <el-icon class="n-go" :size="15"><Right /></el-icon>
    </div>

    <!-- 快捷入口：一个 tab 栏，里面三段（不再是三张独立卡片） -->
    <div class="quickbar tb-card">
      <div
        v-for="q in quicks"
        :key="q.key"
        class="qseg"
        :class="{ on: q.path === quickOn }"
        @click="$router.push(q.path)"
      >
        <div class="q-icon" :style="{ background: q.bg }">
          <el-icon :size="22"><component :is="q.icon" /></el-icon>
        </div>
        <div class="q-t">
          <div class="q-name">{{ q.name }}</div>
          <div class="q-desc">{{ q.desc }}</div>
        </div>
        <el-icon v-if="q.path === quickOn" :size="16" class="q-on"><Select /></el-icon>
      </div>
    </div>

    <!-- 最新动态 -->
    <div class="feed">
      <div class="feed-col tb-card">
        <div class="feed-h">
          <span>最新闲置</span>
          <el-link type="primary" :underline="false" @click="$router.push('/m/idle')">逛一逛 ›</el-link>
        </div>
        <div v-for="g in latestGoods" :key="g.id" class="row" @click="$router.push('/m/idle')">
          <div class="row-thumb">🛍️</div>
          <div class="row-main">
            <div class="row-t">{{ g.title }}</div>
            <div class="row-m">{{ g.cat }} · {{ g.place }} · {{ g.time }}</div>
          </div>
          <div class="row-p">¥{{ g.price }}</div>
        </div>
      </div>

      <div class="feed-col tb-card">
        <div class="feed-h">
          <span>校园热帖</span>
          <el-link type="primary" :underline="false" @click="$router.push('/community')">进社区 ›</el-link>
        </div>
        <div v-for="p in hotPosts" :key="p.id" class="row" @click="$router.push('/community')">
          <div class="row-thumb">💬</div>
          <div class="row-main">
            <div class="row-t">{{ p.title }}</div>
            <div class="row-m">{{ p.board }} · {{ p.author }} · {{ p.hot }} 热度</div>
          </div>
          <div class="row-p small">{{ p.time }}</div>
        </div>
      </div>
    </div>

    <!-- 工具推荐位（受顶部「工具」下拉分类控制）：首页只露 6 个，其余走「更多」去全量页 -->
    <div class="sec-h">
      <h3>{{ catName }}</h3>
      <el-link type="primary" :underline="false" @click="pickAll">看全部分类 ›</el-link>
    </div>
    <div class="grid">
      <div
        v-for="(t, i) in visible"
        :key="t.id"
        class="tb-card tb-tool"
        @click="go(t)"
      >
        <div class="tb-tool-ico" :style="{ background: palette(i) }">
          <el-icon :size="22"><component :is="t.icon || 'Tools'" /></el-icon>
        </div>
        <div class="tb-tool-name">{{ t.name }}</div>
        <div class="tb-tool-desc">{{ t.desc }}</div>
        <el-tag v-if="t.wip" size="small" type="warning" class="tb-tool-badge">待实现</el-tag>
      </div>
    </div>

    <!-- 更多：跳全量工具页 -->
    <div v-if="hiddenCount > 0" class="more-bar">
      <el-button plain @click="goTools">更多 {{ hiddenCount }} 个工具 ›</el-button>
    </div>

    <el-empty v-if="!filtered.length" description="没有匹配的工具" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { Bell, Right, Select } from '@element-plus/icons-vue';
import { tools, categories } from '@/config/tools';
import { stats, notices, latestGoods, hotPosts } from '@/config/mockData';
import { useUiStore } from '@/stores/ui';

const router = useRouter();
// 首页推荐位直接读 ui store 的筛选状态（顶部搜索框 / 工具页内框都是同一份），
// 因此不用再接收 :keyword / :cat 透传，改顶部框这里立刻跟着变
const ui = useUiStore();

// 一组克制的高级渐变，按序号循环给图标上色（华丽但不花哨）
const palettes = [
  'linear-gradient(135deg, #7C3AED, #C026D3)',
  'linear-gradient(135deg, #2563EB, #06B6D4)',
  'linear-gradient(135deg, #0EA5E9, #22D3EE)',
  'linear-gradient(135deg, #EC4899, #F472B6)',
  'linear-gradient(135deg, #F97316, #FB923C)',
  'linear-gradient(135deg, #10B981, #34D399)',
  'linear-gradient(135deg, #6366F1, #818CF8)',
  'linear-gradient(135deg, #EF4444, #F87171)',
  'linear-gradient(135deg, #F59E0B, #FBBF24)'
];
const palette = (i) => palettes[i % palettes.length];

const quicks = [
  { key: 'idle', name: '闲置市场', desc: '毕业甩卖 · 二手好物', icon: 'Shop', bg: 'linear-gradient(135deg,#7C3AED,#C026D3)', path: '/m/idle' },
  { key: 'forum', name: '校园社区', desc: '互助 · 拼单 · 吐槽', icon: 'ChatDotRound', bg: 'linear-gradient(135deg,#2563EB,#06B6D4)', path: '/community' },
  { key: 'msg', name: '消息中心', desc: '回复 · 交易 · 系统', icon: 'Bell', bg: 'linear-gradient(135deg,#F97316,#FB923C)', path: '/message' }
];

// 当前停在哪个快捷段：按路由路径判断，进页面就能看到高亮
const quickOn = computed(() => {
  const p = router.currentRoute.value.path;
  const hit = quicks.find((q) => p === q.path || p.startsWith(q.path + '/'));
  return hit ? hit.path : '';
});

const noticeIdx = ref(0);
let noticeTimer = null;
function nextNotice() {
  noticeIdx.value = (noticeIdx.value + 1) % notices.length;
}
function openNotice() {
  router.push('/notice/' + (notices[noticeIdx.value] || {}).id);
}
onMounted(() => {
  noticeTimer = setInterval(nextNotice, 5000);
});
onBeforeUnmount(() => {
  if (noticeTimer) clearInterval(noticeTimer);
});

const catName = computed(() => {
  const c = categories.find((x) => x.key === ui.activeCat);
  return c ? c.name : '全部工具';
});

const filtered = computed(() => {
  const kw = (ui.keyword || '').trim().toLowerCase();
  return tools.filter((t) => {
    const catOk = ui.activeCat === 'all' || t.cat === ui.activeCat;
    const kwOk =
      !kw ||
      t.name.toLowerCase().includes(kw) ||
      (t.desc || '').toLowerCase().includes(kw);
    return catOk && kwOk;
  });
});

// 首页只摆 6 个，避免宽屏下格子被撑得很大
const PAGE_SIZE = 6;
const visible = computed(() => filtered.value.slice(0, PAGE_SIZE));
const hiddenCount = computed(() => Math.max(0, filtered.value.length - PAGE_SIZE));

function pickAll() {
  // 顶部「工具」下拉切回「全部工具」
  ui.setCat('all');
  router.push('/');
}

function goTools() {
  // 更多 → 全量工具页（当前分类本来就在 store 里，不用再点一次下拉）
  ui.setCat(ui.activeCat || 'all');
  router.push('/tools');
}

function go(t) {
  if (t.external) {
    window.open(t.url, '_blank', 'noopener');
    return;
  }
  if (t.internal) {
    router.push(t.internal);
    return;
  }
  router.push('/tool/' + t.id);
}

defineExpose({ openLogin: () => router.push('/auth') });
</script>

<style lang="less" scoped>@import '@/styles/mixins.less';
.hero {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 32px 34px 28px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.hero-l { flex: 1; min-width: 260px; }
.hero h1 {
  margin: 0 0 10px;
  font-size: 40px;
  font-weight: 800;
  letter-spacing: 1px;
}
.hero p { margin: 0 0 18px; color: var(--tb-sub); font-size: 15px; }
.hero-btns { display: flex; gap: 12px; flex-wrap: wrap; }

.hero-r { display: flex; gap: 26px; }
.stat { text-align: center; min-width: 78px; }
.stat-v { font-size: 26px; font-weight: 800; color: var(--tb-primary); }
.stat-v span { font-size: 13px; margin-left: 2px; font-weight: 600; }
.stat-l { font-size: 12px; color: var(--tb-sub); margin-top: 4px; }

.notice {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  margin-bottom: 16px;
  cursor: pointer;
  font-size: 14px;
  overflow: hidden;
}
.notice:hover { border-color: var(--tb-primary); }
.n-bell { color: var(--tb-primary); flex: 0 0 auto; }
/* 竖向滚动窗口：外层裁切，内层按 22px 行高上移 */
.n-view { flex: 1; min-width: 0; height: 22px; overflow: hidden; }
.n-track { transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1); }
.n-item {
  height: 22px; line-height: 22px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.n-item em {
  font-style: normal; font-size: 11px; font-weight: 700;
  color: var(--tb-primary); background: var(--tb-primary-soft, rgba(124, 58, 237, 0.12));
  border-radius: 6px; padding: 2px 6px; margin-right: 8px;
}
.n-more { color: var(--tb-primary); font-size: 12px; flex: 0 0 auto; }
.n-go { color: var(--tb-sub); flex: 0 0 auto; transition: transform 0.2s, color 0.2s; }
.notice:hover .n-go { color: var(--tb-primary); transform: translateX(2px); }

/* 快捷入口：一个卡片 = 一个 tab 栏，三段并排 */
.quickbar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  margin-bottom: 18px;
  overflow: hidden;
  padding: 0;
}
.qseg {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  cursor: pointer;
  position: relative;
  transition: 0.22s;
}
.qseg + .qseg { border-left: 1px solid rgba(124, 58, 237, 0.14); }
.qseg:hover { background: rgba(124, 58, 237, 0.07); }
.qseg.on {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.14), rgba(6, 182, 212, 0.1));
}
.qseg.on::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--tb-primary, #7c3aed);
  border-radius: 3px 0 0 3px;
}
.q-icon {
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.2);
}
.q-t { flex: 1; min-width: 0; }
.q-name { font-weight: 700; font-size: 15px; }
.q-desc { font-size: 12px; color: var(--tb-sub); margin-top: 2px; }
.q-on { color: var(--tb-primary, #7c3aed); flex: 0 0 auto; }

.feed { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 22px; }
.feed-col { padding: 18px 20px; }
.feed-h {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 700;
  margin-bottom: 12px;
}
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid rgba(124, 58, 237, 0.1);
  cursor: pointer;
}
.row:first-of-type { border-top: 0; }
.row:hover .row-t { color: var(--tb-primary); }
.row-thumb { font-size: 22px; }
.row-main { flex: 1; min-width: 0; }
.row-t { font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row-m { font-size: 12px; color: var(--tb-sub); margin-top: 3px; }
.row-p { color: var(--tb-primary); font-weight: 800; font-size: 15px; }
.row-p.small { font-size: 12px; color: var(--tb-sub); font-weight: 500; }

.sec-h { display: flex; align-items: center; justify-content: space-between; margin: 4px 0 14px; }
.sec-h h3 { margin: 0; font-size: 17px; }

/* 工具格：窄卡片 + 自适应列数（宽屏多列、窄屏少列），不用大正方形占屏 */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(136px, 1fr));
  gap: 12px;
}
@media (max-width: 900px) {
  .hero { padding: 22px 18px 20px; gap: 16px; }
  .hero h1 { font-size: 27px; }
  .hero p { font-size: 13.5px; margin-bottom: 14px; }
  .hero-btns { width: 100%; }
  .hero-btns .el-button { flex: 1; }
  .hero-r { justify-content: space-between; gap: 10px; width: 100%; }
  .stat { min-width: 0; }
  .stat-v { font-size: 20px; }
  .quickbar { grid-template-columns: 1fr; }
  .qseg { padding: 13px 14px; gap: 10px; }
  .qseg + .qseg { border-left: 0; border-top: 1px solid rgba(124, 58, 237, 0.14); }
  .q-icon { width: 38px; height: 38px; flex-basis: 38px; border-radius: 12px; }
  .q-name { font-size: 14px; }
  .q-desc { font-size: 11px; }
  .feed { grid-template-columns: 1fr; gap: 12px; }
  .feed-col { padding: 14px 15px; }
  .sec-h h3 { font-size: 16px; }
  .grid { grid-template-columns: repeat(auto-fill, minmax(102px, 1fr)); gap: 9px; }
}

/* 工具卡外观直接吃 utilities.css 的 .tb-tool*（和 Tools.vue 同一份），
   这里只保留首页特有的「多一行去全量页」间距 */

/* 「更多」入口 */
.more-bar { text-align: center; margin-top: 16px; }
</style>
