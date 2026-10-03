<template>
  <el-container class="layout">
    <el-header class="header tb-card">
      <!-- 品牌：渐变方标 + 主副标题，点击回首页 -->
      <div class="brand" @click="goHome">
        <span class="logo">校</span>
        <span class="brand-t">校园集<i>CAMPUSHUB</i></span>
      </div>

      <!-- 桌面端：一级模块 + 「工具」/「我的」下拉 -->
      <nav v-if="!isMobile" class="nav">
        <template v-for="m in modules" :key="m.key">
          <el-dropdown v-if="m.children" trigger="click" @command="onNavCommand">
            <span class="nav-item" :class="{ active: activeModule === m.key }">
              <el-icon><component :is="m.icon" /></el-icon>
              <span>{{ m.name }}</span>
              <span v-if="ui.unread" class="nav-dot">{{ unreadText }}</span>
              <el-icon :size="12"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="c in m.children"
                  :key="c.key"
                  :command="c.key"
                  :divided="c.divided"
                >
                  <el-icon :size="14"><component :is="c.icon" /></el-icon>
                  <span class="mi">{{ c.name }}</span>
                  <span v-if="c.badge && ui.unread" class="mi-dot" />
                  <el-icon
                    v-if="activeModule === m.key && isCurrentChild(m, c)"
                    :size="14"
                    class="mi-check"
                  ><Select /></el-icon>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <router-link v-else :to="m.path" class="nav-item" :class="{ active: activeModule === m.key }">
            <el-icon><component :is="m.icon" /></el-icon>
            <span>{{ m.name }}</span>
          </router-link>
        </template>

        <router-link to="/about" class="nav-item ghost">
          <el-icon><InfoFilled /></el-icon>
          <span>关于</span>
        </router-link>
      </nav>

      <!-- 搜索：胶囊输入框，聚焦有光晕 -->
      <el-input
        v-if="!isMobile"
        v-model="keyword"
        placeholder="搜索工具…"
        :prefix-icon="Search"
        clearable
        class="search"
        @keyup.enter="onSearchEnter"
      />

      <!-- 操作区：亮/暗 + 搜索 + 登录态，全部只在桌面端出现。
           手机端的顶部只留品牌，个人信息走底部 tab 的「我的」、搜索用工具页内的框 -->
      <div v-if="!isMobile" class="actions">
        <el-switch
          :model-value="theme.dark"
          @change="theme.toggle()"
          inline-prompt
          active-text="暗"
          inactive-text="亮"
        />

        <el-dropdown v-if="user.isLogin" trigger="click" @command="onNavCommand">
          <span class="user">
            <el-avatar :size="26" class="ua">{{ (user.username || '?').slice(0, 1) }}</el-avatar>
            <span class="u-name">{{ user.username }}</span>
            <el-icon :size="12"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="c in meChildren" :key="c.key" :command="c.key" :divided="c.divided">
                <el-icon :size="14"><component :is="c.icon" /></el-icon>
                <span class="mi">{{ c.name }}</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 未登录：轻量文字链，不再占一个高饱和按钮 -->
        <el-link v-else class="auth-link" type="primary" :underline="false" @click="goAuth">
          登录 / 注册
        </el-link>
      </div>
    </el-header>

    <el-main class="main">
      <!-- 内容限宽居中：宽屏不散、窄屏自适应 -->
      <div class="wrap">
        <!-- 错误边界包住路由出口：页面崩了降级成提示卡，不会把整个应用卸成白屏 -->
        <!-- 筛选状态走 ui store（AppLayout 与 Tools 共享），不再逐层透传 prop -->
        <ErrorBoundary>
          <router-view v-slot="{ Component }">
            <component :is="Component" />
          </router-view>
        </ErrorBoundary>

        <footer class="foot">
          <span>© 2026 校园集 CampusHub · 校园生活一站式</span>
          <el-link type="primary" :underline="false" @click="$router.push('/about')">关于</el-link>
        </footer>
      </div>
    </el-main>

    <!-- 回到顶部：固定右下角悬浮按钮，翻过一屏才冒出来 -->
    <transition name="fab">
      <button v-if="showTop" class="fab" title="回到顶部" @click="toTop">
        <el-icon :size="17"><Top /></el-icon>
        <span>顶部</span>
      </button>
    </transition>

    <!-- 移动端底部 tab：一级入口，手指够得到。已有它，就不再做侧边栏 -->
    <div v-if="isMobile" class="tabbar">
      <div
        v-for="m in tabItems"
        :key="m.key"
        class="tab"
        :class="{ on: activeModule === m.key }"
        @click="onTab(m)"
      >
        <span class="tab-ic">
          <el-icon :size="19"><component :is="m.icon" /></el-icon>
          <i v-if="m.key === 'me' && ui.unread" class="tab-dot">{{ unreadText }}</i>
        </span>
        <span>{{ m.name }}</span>
      </div>
    </div>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Search, ArrowDown, Select, InfoFilled, Top } from '@element-plus/icons-vue';
import { modules } from '@/config/modules';
import ErrorBoundary from '@/views/ErrorBoundary.vue';
import { useUserStore } from '@/stores/user';
import { useUiStore } from '@/stores/ui';
import { useThemeStore } from '@/stores/theme';
import { ElMessage } from 'element-plus';

const user = useUserStore();
const ui = useUiStore();
const theme = useThemeStore();
const route = useRoute();
const router = useRouter();
// 顶部搜索框：直接绑 store 里的 keyword，和工具页内框是同一个值（双向同步的唯一数据源）
const keyword = computed({
  get: () => ui.keyword,
  set: (v) => ui.setKeyword(v)
});
const showTop = ref(false);

// 移动端判定：切「紧凑头部 + 底部 tab」，不再把导航条挤成一团
const isMobile = ref(false);
function syncMobile() {
  isMobile.value = window.innerWidth <= 900;
}
function syncScroll() {
  showTop.value = window.scrollY > 260;
}
onMounted(() => {
  theme.apply();
  syncMobile();
  syncScroll();
  window.addEventListener('resize', syncMobile);
  window.addEventListener('scroll', syncScroll, { passive: true });
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', syncMobile);
  window.removeEventListener('scroll', syncScroll);
});

// 头像下拉复用「我的」子菜单（我的主页 / 退出登录），别再写一套
const meChildren = modules.find((m) => m.key === 'me')?.children || [];

// 子项可能没有 path（例如「退出登录」只有 action），一律先判空再切分
const childPath = (c) => (c && c.path ? c.path.split('?')[0] : '');

// 当前高亮模块：/ 是首页，/tools、/tool/* 都归到「工具」，命中下拉子项时高亮其父级
const activeModule = computed(() => {
  const p = route.path;
  if (p === '/') return 'home';
  if (p === '/tools' || p.startsWith('/tool')) return 'tools';
  const hit = modules.find((m) => m.path && m.path !== '/' && p.startsWith(m.path));
  if (hit) return hit.key;
  const parent = modules.find((m) => m.children && m.children.some((c) => childPath(c) === p));
  return parent ? parent.key : '';
});

// 底部 tab：一级模块里去掉「消息中心」（已并入「我的」子菜单），
// 这样 5 个格子在窄屏刚好排满，不会挤到发虚
const tabItems = modules.filter((m) => m.key !== 'message');

// 红点文案：太多就显示 99+
const unreadText = computed(() => (ui.unread > 99 ? '99+' : String(ui.unread)));

// 下拉标题本身不跳转：点「我的 / 工具」只展开菜单，跳到哪个页面由菜单里的子项决定。
// （轨迹：早先给标题也挂了 router.push，结果没选菜单就先跳走了，已去掉）
function onTab(m) {
  if (m.key === 'tools') {
    goTools();
    return;
  }
  if (m.path === '/') {
    goHome();
    return;
  }
  router.push(m.path);
}

function goTools() {
  ui.setCat('all');
  if (route.path !== '/tools') router.push('/tools');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 回车：不在工具页就跳过去，别让用户搜了没反应
function onSearchEnter() {
  if (!keyword.value.trim()) return;
  if (route.path !== '/tools') {
    ui.setCat('all');
    router.push('/tools');
  }
}

// 登录 / 注册：整页路由（query 带 mode，Auth 页据此直接落在注册或忘记密码）
function goAuth() {
  router.push('/auth');
}

// 桌面下拉菜单：先在「工具」分类里找（命中就切分类并进全量页），
// 再在「我的」子菜单里找（命中就跳转 / 退出）
function onNavCommand(key) {
  for (const m of modules) {
    const item = (m.children || []).find((c) => c.key === key);
    if (!item) continue;

    // 工具分类：只有 key 没有 path，以前这里只改状态不跳转 → 点导航「毫无反应」
    if (!item.path) {
      if (m.key === 'tools') {
        ui.setCat(key);
        if (route.path !== '/tools') router.push('/tools');
      }
      return;
    }

    if (item.action === 'logout') {
      user.logout();
      ElMessage.success('已退出');
      router.push('/');
      return;
    }

    if (m.key === 'tools') ui.setCat(key);
    router.push(item.path);
    return;
  }
}

// 注意：子项可能没有 path（「退出登录」只有 action），必须走 childPath 判空，
// 否则 undefined.split() 会在渲染下拉菜单时抛错，把整个布局打崩（这就是反复白屏的根源）
function isCurrentChild(parent, child) {
  const cp = childPath(child);
  if (!cp) return false;
  return route.path === cp || route.fullPath.split('?')[0] === cp;
}

function goHome() {
  ui.setCat('all');
  if (route.path !== '/') {
    router.push('/');
    return;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>

<style lang="less" scoped>@import '@/styles/mixins.less';
.layout { min-height: 100vh; }

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 12px;
  padding: 0 20px;
  height: auto;
  min-height: 64px;
  flex-wrap: wrap;
  padding-block: 10px;
}

/* —— 品牌：渐变方标 + 主副标题 —— */
.brand { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.logo {
  width: 36px; height: 36px; flex: 0 0 36px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--tb-primary, #7c3aed), var(--tb-secondary, #ec4899));
  color: #fff; font-weight: 800; font-size: 18px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 10px 22px var(--tb-primary-ring, rgba(124, 58, 237, 0.32));
  transform: rotate(-4deg);
  transition: transform 0.25s;
}
.brand:hover .logo { transform: rotate(4deg) scale(1.06); }
.brand-t {
  display: flex; flex-direction: column; line-height: 1.2;
  font-weight: 800; font-size: 18px; color: var(--tb-text);
}
.brand-t i {
  font-style: normal; font-size: 9.5px; letter-spacing: 2.4px;
  color: var(--tb-sub); font-weight: 600;
}

/* 顶部导航条（桌面） */
.nav { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.nav-item {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 14px;
  color: var(--tb-sub, #6b6480);
  white-space: nowrap;
  transition: 0.2s;
}
.nav-item:hover { background: rgba(109, 93, 252, 0.12); color: var(--tb-primary, #7c3aed); }
.nav-item.active {
  background: var(--tb-primary, #7c3aed);
  color: #fff;
  box-shadow: 0 6px 18px var(--tb-primary-ring, rgba(124, 58, 237, 0.3));
}
.nav-item.ghost { color: var(--tb-sub); }
/* 未读红点：桌面端挂在「我的」标题右侧，和 element 的 Badge 一个观感 */
.nav-dot {
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  line-height: 16px;
  font-weight: 700;
  text-align: center;
}
.mi { margin-left: 6px; margin-right: 6px; }
.mi-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #ef4444;
  display: inline-block;
  vertical-align: middle;
}
.mi-check { color: var(--tb-primary, #7c3aed); }

/* 搜索：胶囊形 + 聚焦光晕 */
.search { flex: 1; min-width: 160px; max-width: 260px; }
.search :deep(.el-input__wrapper) {
  border-radius: 999px;
  box-shadow: 0 0 0 1px var(--tb-border, rgba(124, 58, 237, 0.16));
  background: rgba(255, 255, 255, 0.72);
  transition: 0.25s;
}
.search :deep(.el-input__wrapper:hover) { box-shadow: 0 0 0 1px var(--tb-primary-ring, rgba(124, 58, 237, 0.3)); }
.search :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--tb-primary, #7c3aed), 0 8px 22px var(--tb-primary-soft, rgba(124, 58, 237, 0.16));
}

.actions { display: flex; align-items: center; gap: 10px; margin-left: auto; }
.user { display: flex; align-items: center; gap: 7px; cursor: pointer; }
.ua {
  background: linear-gradient(135deg, var(--tb-primary, #7c3aed), var(--tb-secondary, #ec4899));
  color: #fff; font-size: 13px; font-weight: 700;
}
.u-name { font-weight: 600; font-size: 13.5px; max-width: 96px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.auth-link { font-size: 13.5px; font-weight: 600; }

.main { padding: 0 12px 12px; }
/* 宽屏统一限宽居中：首页 / 工具页 / 微应用都不会被拉成一整条 */
.wrap { width: 100%; max-width: 1240px; margin: 0 auto; }

.foot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 26px;
  padding: 14px 4px 4px;
  border-top: 1px solid var(--tb-border);
  color: var(--tb-sub);
  font-size: 12px;
}

/* —— 回到顶部：固定右下角悬浮按钮 —— */
.fab {
  position: fixed;
  right: 22px;
  bottom: 26px;
  z-index: 200;
  width: 48px; height: 48px;
  border: 1px solid var(--tb-border);
  border-radius: 16px;
  background: var(--tb-card, rgba(255, 255, 255, 0.8));
  backdrop-filter: blur(10px);
  color: var(--tb-primary, #7c3aed);
  box-shadow: 0 12px 28px rgba(40, 20, 90, 0.2);
  cursor: pointer;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;
  font-size: 10px;
  transition: transform 0.22s, box-shadow 0.22s, color 0.22s;
}
.fab:hover {
  transform: translateY(-3px);
  color: #fff;
  background: linear-gradient(135deg, var(--tb-primary, #7c3aed), var(--tb-secondary, #ec4899));
  box-shadow: 0 16px 34px var(--tb-primary-ring, rgba(124, 58, 237, 0.35));
}
.fab-enter-active, .fab-leave-active { transition: opacity 0.25s, transform 0.25s; }
.fab-enter-from, .fab-leave-to { opacity: 0; transform: translateY(10px) scale(0.9); }
/* 手机端底部有 tabbar（56px）：不抬上去就会被卡片边和 tabbar 夹在中间，看着像穿模 */
@media (max-width: 900px) {
  .fab { bottom: calc(var(--tb-tabbar-h) + 14px); right: 16px; }
}

/* 移动端底部 tab */
.tabbar {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  z-index: 100;
  display: flex;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--tb-border);
  box-shadow: 0 -4px 18px rgba(80, 40, 160, 0.1);
  padding-bottom: env(safe-area-inset-bottom);
}
.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 7px 0 6px;
  font-size: 10.5px;
  color: var(--tb-sub, #6b6480);
  cursor: pointer;
}
.tab.on { color: var(--tb-primary, #7c3aed); font-weight: 700; }
/* tab 图标 + 红点打包一层，红点才不会盖住图标 */
.tab-ic { position: relative; display: inline-flex; }
.tab-dot {
  position: absolute;
  top: -3px;
  right: -7px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  box-sizing: border-box;
  border: 2px solid #fff;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 9.5px;
  font-style: normal;
  font-weight: 700;
  line-height: 12px;
  text-align: center;
}

@media (max-width: 900px) {
  .header { margin: 8px; padding: 0 12px; gap: 8px; min-height: 52px; }
  .brand-t { font-size: 15px; }
  .brand-t i { font-size: 8px; letter-spacing: 1.6px; }
  .logo { width: 32px; height: 32px; flex-basis: 32px; font-size: 16px; border-radius: 11px; }
  /* 顶部只剩品牌，别留多余间距 */
  .header { justify-content: flex-start; }
  /* 底部 tab 高度是整套移动端布局的关键，MicroAppHost 的高度也按它算 */
  .tabbar { min-height: 56px; }
  .tab { font-size: 10px; padding: 6px 0; }
  .main { padding: 0 8px 68px; }
  /* 悬浮按钮要落在 tabbar 之上，别被盖住 */
  .fab { right: 14px; bottom: 78px; width: 42px; height: 42px; border-radius: 14px; }
  .fab span { display: none; }
}
</style>
