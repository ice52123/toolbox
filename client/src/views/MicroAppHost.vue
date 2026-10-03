<template>
  <div class="micro-host">
    <!-- 未注册 / 未启用：占位 -->
    <ComingSoon
      v-if="!app || !app.enabled"
      :title="app ? app.title : '未知模块'"
      :phase="app?.phase || ''"
      :desc="app ? app.desc || '该模块尚未接入' : '子应用未在 microApps.js 注册'"
    />

    <!-- 已启用：qiankun 容器 + iframe 兜底 -->
    <template v-else>
      <div v-show="!fallback && !errMsg" ref="containerRef" class="micro-container"></div>
      <!-- 兜底 iframe 常驻挂载（v-if 控制挂载、v-show 控制可见），
           这样它不管多慢都能触发 load；真连不上时只是被隐藏，不会连带被卸载 -->
      <iframe
        v-if="fallback"
        :key="frameKey"
        :src="app.devUrl"
        :class="['micro-frame', { hidden: !!errMsg }]"
        @load="onFrameLoad"
      />
      <!-- 加载不出来时别留一块灰底让人猜：把原因和怎么修直接写在页面上 -->
      <div v-if="errMsg" class="down tb-card">
        <el-icon :size="44" class="down-ico"><WarningFilled /></el-icon>
        <h2>{{ app.title }}没接上</h2>
        <p class="desc">
          <template v-if="frameOk">
            子应用还在加载，这多半只是首次编译慢（vite 编译一个子应用常常十几秒）。
            等服务编译完本页会自动恢复，也可以直接刷新。
          </template>
          <template v-else>
            子应用 <code>{{ app.devUrl }}</code> 探不通，多半只是它的 dev 服务没在跑。
            在 <code>idle-market</code> 目录执行 <code>npm run dev</code>（或在项目根
            <code>npm run dev:all</code>），然后回来刷新本页。
          </template>
        </p>
        <p v-if="errMsg" class="err">控制台报：{{ errMsg }}</p>
        <div class="tb-btns">
          <el-button type="primary" size="large" @click="retry">重新加载</el-button>
          <el-button size="large" @click="openNewTab">在新标签打开</el-button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute } from 'vue-router';
import { loadMicroApp } from 'qiankun';
import { getMicroApp } from '@/config/microApps';
import { useUserStore } from '@/stores/user';
import ComingSoon from '@/views/ComingSoon.vue';

const props = defineProps({ app: String });
const route = useRoute();

const user = useUserStore();
const app = computed(() => getMicroApp(props.app));
// 子应用内部的当前路径：/m/idle/list → 'list'，直接整理成 '/list' 透传过去
const subPath = computed(() => {
  const r = route.params.rest;
  const s = Array.isArray(r) ? r.join('/') : r || '';
  return s ? '/' + s.replace(/^\/+/, '') : '/list';
});
const containerRef = ref(null);
const fallback = ref(false);
const errMsg = ref('');
const frameOk = ref(false);
const frameKey = ref(0);
// 是否「探明服务是通的」——决定 iframe 触发 load 时该不该撤掉失败提示
let probeOk = false;
let microApp = null;
let timer = null;
let frameTimer = null;

// 统一登录透传：子应用通过 props 拿到 token / 用户信息，无需各自实现登录。
// path 是关键一项：主站直接访问 /m/idle（或 /m/idle/list）时，子应用靠它落到正确页面，
// 否则子应用自己解析到 /m/idle 这种它不认识的路径，就只剩顶部一条栏。
function childProps() {
  return {
    token: user.token,
    username: user.username,
    userId: user.id,
    path: subPath.value,
    onLogout: () => user.logout()
  };
}

// qiankun 的报错对象是裸 Error，取一句人能看懂的话（Failed to fetch / ECONNREFUSED …）
function pickErr(e) {
  const raw = (e && (e.message || e.msg)) || String(e || '');
  return raw.slice(0, 90) || '子应用未响应';
}

async function mountChild() {
  if (!app.value || !app.value.enabled) return;
  fallback.value = false;
  errMsg.value = '';
  frameOk.value = false;
  probeOk = false;
  clearTimeout(frameTimer);
  microApp = loadMicroApp({
    name: app.value.name,
    entry: app.value.entry,
    container: containerRef.value,
    props: childProps()
  });
  // 加载/挂载失败 → 记下原因 + 回退 iframe，让页面还有东西可看
  microApp.mountPromise?.catch((e) => {
    errMsg.value = pickErr(e);
    fallback.value = true;
  });
  // 4s 内无内容 → iframe 兜底
  timer = setTimeout(() => {
    const el = containerRef.value;
    if (!el || el.textContent.trim().length === 0) fallback.value = true;
  }, 4000);
}

// 真去探一次子应用服务，返回能不能通 + 不通的原因。
// 不再拿「N 秒内没 load」当判定依据：vite 首次编译子应用动辄十几秒，
// 那样会把「正在正常加载」误报成「连接被拒绝」。
async function probeDevServer() {
  const url = app.value.devUrl;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 2500);
  try {
    await fetch(url, { cache: 'no-store', signal: ac.signal });
    return { ok: true, reason: '' };
  } catch (e) {
    const why = e && e.name === 'AbortError' ? '2.5s 内没响应' : e?.message || '未知错误';
    return { ok: false, reason: `连不上 ${url}（${why}）` };
  } finally {
    clearTimeout(t);
  }
}

async function watchFrame() {
  clearTimeout(frameTimer);
  frameTimer = setTimeout(async () => {
    const r = await probeDevServer();
    probeOk = r.ok;
    if (r.ok) {
      // 服务其实是通的（之前只是慢 / 你刚把 dev 服务拉起来）：撤掉失败卡，
      // iframe 还没拿到内容就换 key 重拉一次，让它真正加载出来
      if (errMsg.value) {
        errMsg.value = '';
        if (!frameOk.value) frameKey.value += 1;
      }
      return;
    }
    // 探不通 + iframe 确实没内容 → 这才算真没接上
    if (!frameOk.value) errMsg.value = r.reason;
  }, 2000);
}

// iframe 终于把内容拉回来了：撤掉失败提示。
// 只有探通过时才撤 —— 连接被拒绝时浏览器同样会给 iframe 触发一次 load（错误页），
// 不加这个条件会把真正的失败提示又抹掉，只剩一块空白。
function onFrameLoad() {
  frameOk.value = true;
  if (probeOk) errMsg.value = '';
}

function openNewTab() {
  window.open(app.value.devUrl, '_blank', 'noopener');
}

function retry() {
  errMsg.value = '';
  fallback.value = false;
  frameOk.value = false;
  probeOk = false;
  frameKey.value += 1; // 换 key 强制重新拉 iframe
  mountChild();
  watchFrame();
}

function unmountChild() {
  clearTimeout(timer);
  clearTimeout(frameTimer);
  if (microApp) {
    microApp.unmount();
    microApp = null;
  }
}

onMounted(async () => {
  await mountChild();
  watchFrame();
});
onBeforeUnmount(unmountChild);
watch(() => props.app, () => {
  unmountChild();
  mountChild();
  watchFrame();
});
</script>

<style lang="less" scoped>
@import '@/styles/mixins.less';

.micro-host {
  width: 100%;
  /* 减去主站头部 + 移动端底部 tab，子应用不会多出一截空白或撑出横向滚动 */
  min-height: calc(100vh - var(--tb-header-h, 92px) - var(--tb-tabbar-h, 0px) - 28px);
}
.micro-container {
  width: 100%;
  padding-bottom: 8px;
}
.micro-frame {
  width: 100%;
  height: calc(100vh - var(--tb-header-h, 92px) - var(--tb-tabbar-h, 0px) - 28px);
  border: 0;
  border-radius: @r-sm;
}
/* 真连不上时把 iframe 这块空白收掉，只留提示卡；元素仍在，load 事件照常触发 */
.micro-frame.hidden {
  display: none;
}

/* 子应用没起：明确告知原因 + 修法，别留一块灰底让人猜 */
.down {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  .flex-center();
  gap: 12px;
  text-align: center;

  h2 {
    margin: 0;
    font-size: 20px;
  }
  .desc {
    margin: 0;
    color: var(--tb-sub);
    max-width: 460px;
    line-height: 1.9;
  }
  code {
    padding: 2px 7px;
    border-radius: 6px;
    background: var(--tb-primary-soft, rgba(124, 58, 237, 0.12));
    color: var(--tb-primary);
    font-size: 12.5px;
  }
  .err {
    margin: 0;
    font-size: 12px;
    color: var(--tb-warn, #f59e0b);
    background: var(--tb-warn-soft, rgba(245, 158, 11, 0.14));
    padding: 5px 12px;
    border-radius: @r-pill;
  }
}
.down-ico {
  color: var(--tb-warn, #f59e0b);
}
</style>
