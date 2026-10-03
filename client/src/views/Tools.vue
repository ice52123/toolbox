<template>
  <div class="tools-page">
    <div class="hero tb-card">
      <div>
        <h1 class="tb-gradient-text">全部工具</h1>
        <p>{{ list.length }} 个在线小工具 · 打开即用 · 无需下载</p>
      </div>
      <el-input
        v-model="kw"
        placeholder="搜索工具…"
        :prefix-icon="Search"
        clearable
        class="hero-search"
      />
    </div>

    <!-- 分类：一行 pill（categories[0] 就是「全部工具」，不再重复加一个「全部」） -->
    <div class="cats">
      <button
        v-for="c in cats"
        :key="c.key"
        type="button"
        class="cat"
        :class="{ on: curCat === c.key }"
        @click="pick(c.key)"
      >
        <el-icon :size="15"><component :is="c.icon" /></el-icon>
        <span>{{ c.name }}</span>
      </button>
    </div>

    <div class="grid">
      <div
        v-for="t in list"
        :key="t.id"
        class="tb-card tb-tool"
        @click="go(t)"
      >
        <div class="tb-tool-ico" :style="{ background: palette(t) }">
          <el-icon :size="24"><component :is="t.icon || 'Tools'" /></el-icon>
        </div>
        <div class="tb-tool-name">{{ t.name }}</div>
        <div class="tb-tool-desc">{{ t.desc }}</div>
        <el-tag v-if="t.wip" size="small" type="warning" class="tb-tool-badge">待实现</el-tag>
      </div>
    </div>

    <el-empty v-if="!list.length" description="没有匹配的工具" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Search } from '@element-plus/icons-vue';
import { tools, categories as cats } from '@/config/tools';
import { useUiStore } from '@/stores/ui';

const router = useRouter();
const ui = useUiStore();

// 搜索词和分类直接映射 store 状态：顶部框、顶部「工具」下拉、页内框、分类 pill
// 全是同一份数据，天然双向同步，不需要再 prop 传进来再 watch 一遍。
// （改之前这里是把传入值抄进一个本地 ref 只认一次，停在 /tools 时改顶部框就没反应了）
const kw = computed({
  get: () => ui.keyword,
  set: (v) => ui.setKeyword(v)
});
const curCat = computed({
  get: () => ui.activeCat,
  set: (v) => ui.setCat(v)
});

// 颜色按 id 哈希取，避免「同一列同色」的呆板感（乱一点但固定，刷新不变）
const palettes = [
  'linear-gradient(135deg, #7C3AED, #C026D3)',
  'linear-gradient(135deg, #2563EB, #06B6D4)',
  'linear-gradient(135deg, #0EA5E9, #22D3EE)',
  'linear-gradient(135deg, #EC4899, #F472B6)',
  'linear-gradient(135deg, #F97316, #FB923C)',
  'linear-gradient(135deg, #10B981, #34D399)',
  'linear-gradient(135deg, #6366F1, #818CF8)',
  'linear-gradient(135deg, #EF4444, #F87171)',
  'linear-gradient(135deg, #F59E0B, #FBBF24)',
  'linear-gradient(135deg, #14B8A6, #5EEAD4)'
];
const palette = (t) => {
  let h = 0;
  const s = t.id || t.name || '';
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return palettes[h % palettes.length];
};

const list = computed(() => {
  const k = kw.value.trim().toLowerCase();
  return tools.filter((t) => {
    const catOk = curCat.value === 'all' || t.cat === curCat.value;
    const kwOk =
      !k ||
      t.name.toLowerCase().includes(k) ||
      (t.desc || '').toLowerCase().includes(k);
    return catOk && kwOk;
  });
});

function pick(key) {
  curCat.value = key; // 写回 store → 顶部「工具」下拉高亮跟着切
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
</script>

<style lang="less" scoped>@import '@/styles/mixins.less';
.tools-page { max-width: 1180px; }

.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 26px 30px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.hero h1 { margin: 0 0 6px; font-size: 30px; font-weight: 800; }
.hero p { margin: 0; color: var(--tb-sub); font-size: 14px; }
.hero-search { width: 260px; }

/* 分类 pill：一个 tab 栏，选中项高亮 */
.cats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.cat { white-space: nowrap; }
.cat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid rgba(124, 58, 237, 0.2);
  background: rgba(255, 255, 255, 0.7);
  color: var(--tb-sub, #6b6480);
  font-size: 14px;
  cursor: pointer;
  transition: 0.2s;
}
.cat:hover { border-color: rgba(124, 58, 237, 0.55); color: var(--tb-primary, #7c3aed); }
.cat.on {
  background: var(--tb-primary, #7c3aed);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 6px 18px rgba(124, 58, 237, 0.32);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 14px;
}
@media (max-width: 900px) {
  .tools-page { max-width: 100%; }
  .hero { padding: 18px 16px 16px; }
  .hero h1 { font-size: 24px; }
  .hero-search { width: 100%; }
  .grid { grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 10px; }
  /* 分类 pill 走单行横向滚动：手机上不再折成两行占半屏 */
  .cats {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 2px;
  }
  .cats::-webkit-scrollbar { display: none; }
  .cat { padding: 7px 13px; font-size: 13px; }
}

/* 工具卡外观（内容从顶部排 + 名称/描述固定行高，跨行跨列图标、文字水平线一致）
   全部来自 utilities.css 的 .tb-tool* —— 和首页推荐位共用一份，别再抄一遍。
   这里只保留「全量页卡片比首页稍高一点」的微调。 */
.tb-tool { min-height: 132px; padding: 16px 10px 14px; --tb-tool-ico: 46px; --tb-tool-ico-r: 14px; --tb-tool-name: 14px; }
</style>
