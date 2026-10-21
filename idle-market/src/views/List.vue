<template>
  <div>
    <!-- 一条工具条就说完事：面包屑 / 搜索 / 筛选 / 发布全在同一行，不再上下摞两排 -->
    <div class="sub-nav">
      <!-- 已经在闲置市场了，再摆一个「闲置市场 + 逛一逛」等于指回自己，
          点下去原地打转，所以品牌那块整个不要，只留返回和右侧的筛选区 -->
      <el-button text class="back" :icon="HomeFilled" @click="backToMain">返回主站</el-button>

      <span class="grow" />

      <el-select v-model="cat" placeholder="全部分类" clearable class="sel">
        <el-option v-for="c in cats" :key="c" :label="c" :value="c" />
      </el-select>

      <el-input v-model="kw" placeholder="搜闲置…" clearable class="ip" />

      <el-tag v-if="mine" type="primary" effect="light" round class="mine-tag">
        我发布的 {{ mine }} 件
      </el-tag>

      <el-button class="cta" type="primary" size="small" @click="$router.push('/publish')">发布闲置</el-button>
    </div>

    <div class="grid" v-loading="loading">
      <div v-for="g in goods" :key="g.id" class="card" @click="$router.push('/detail/' + g.id)">
        <div class="thumb">
          <img v-if="g.images.length" :src="g.images[0]" :alt="g.title" />
          <span v-else class="emoji">{{ emojiOf(g.cat) }}</span>
          <span v-if="g.images.length > 1" class="cnt">1/{{ g.images.length }}</span>
          <!-- 已被别人下单付款：打上「已售」角标，点进去详情页也不能再下单 -->
          <span v-if="sold.has(g.id)" class="sold">已售</span>
        </div>
        <div class="title">{{ g.title }}</div>
        <div class="price">¥{{ g.price }}</div>
        <div class="meta">{{ g.cat }} · {{ g.cond || '成色—' }} · {{ g.place || '自提点待定' }}</div>
        <div class="owner">
          <span class="owner-name">{{ g.owner }}</span>
          <el-tag v-if="g.mine" size="small" type="success" effect="plain">我发布的</el-tag>
        </div>
      </div>
    </div>

    <!-- 追加 loading / 到底提示（手机滚动分页用，PC 上不显示） -->
    <div v-if="loadingMore" class="loading-tip">加载中…</div>
    <div v-else-if="noMore && goods.length" class="loading-tip">没有更多了</div>

    <!-- PC：页码翻页（手机走滚动加载，媒体查询里隐藏） -->
    <div v-if="total > pageSize" class="pager">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="goPage"
      />
    </div>

    <!-- 后端没起了：把理由写清楚，别让人对着一片空白猜 -->
    <el-empty v-if="err" :description="'闲置列表加载失败：' + err">
      <el-button type="primary" plain @click="load">重试</el-button>
    </el-empty>

    <el-empty v-else-if="!loading && !goods.length" description="暂无匹配的闲置，去发布一件？">
      <el-button type="primary" plain @click="$router.push('/publish')">发布闲置</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { HomeFilled } from '@element-plus/icons-vue';
import { cats, emojiOf } from '@/store';
import { api, mapGoods, goMain, soldGoodsIds } from '@/api';
import { useIsMobile, useInfiniteOnScroll } from '@/infinite';

const kw = ref('');
const cat = ref('');
const goods = ref([]);
const sold = ref(new Set()); // 已付款订单锁定的闲置 id 集合
const loading = ref(true);
const err = ref('');

// —— 分页：手机滚动加载，PC 页码翻页 ——
// 以前 pageSize=60 一次性铺够（注释还写着「暂不做分页滚动」），第 61 件永远看不见。
// 后端 /goods 本来就返回 {list,total,page,pageSize}，这里把 page 接起来。
const page = ref(1);
const pageSize = ref(12);
const total = ref(0);
const loadingMore = ref(false);
const noMore = computed(() => total.value > 0 && goods.value.length >= total.value);
const isMobile = useIsMobile(900);
const infEnabled = computed(
  () => isMobile.value && !loading.value && !loadingMore.value && !noMore.value && goods.value.length > 0
);
useInfiniteOnScroll(infEnabled, loadMore);

// 已售出的闲置：本地订单里只要有人付过款就算已售。每次拉完列表刷一次，
// 保证「下单付款 → 回到列表」能立刻看到角标（真实系统由后端在商品上带 sold 字段）
function refreshSold() {
  sold.value = new Set(soldGoodsIds());
}

// 分类 / 关键词都下推给后端过滤（不再前端全量拉回来 filter），
// 关键词额外做 300ms 防抖，避免每敲一个字打一次接口。
async function fetchGoods(p) {
  const q = new URLSearchParams();
  if (cat.value) q.set('cat', cat.value);
  if (kw.value.trim()) q.set('kw', kw.value.trim());
  q.set('page', String(p));
  q.set('pageSize', String(pageSize.value));
  const data = await api.get('/goods?' + q.toString());
  return {
    list: (data.list || []).map(mapGoods),
    total: data.total || 0
  };
}

// 首屏 / 切分类 / 换关键词 / PC 翻页：整列表替换
async function load(p = 1) {
  loading.value = true;
  err.value = '';
  try {
    const { list, total: t } = await fetchGoods(p);
    goods.value = list;
    total.value = t;
    page.value = p;
    refreshSold();
    if (p > 1) window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    err.value = e.message || '加载失败';
    goods.value = [];
  } finally {
    loading.value = false;
  }
}

// 手机滚动到底：追加下一页
async function loadMore() {
  if (loadingMore.value || noMore.value) return;
  loadingMore.value = true;
  try {
    const { list, total: t } = await fetchGoods(page.value + 1);
    goods.value.push(...list);
    total.value = t;
    page.value += 1;
    refreshSold();
  } catch (e) {
    console.error('[ idle-market ] 加载更多闲置失败：', e);
  } finally {
    loadingMore.value = false;
  }
}

// PC 页码点击
function goPage(p) {
  if (p === page.value) return;
  load(p);
}

onMounted(() => load());
watch(cat, () => load());
let timer = null;
watch(kw, () => {
  clearTimeout(timer);
  timer = setTimeout(() => load(), 300);
});

// 我发布的件数：后端给了 owner_id，跟当前登录用户比对即可
const mine = computed(() => goods.value.filter((g) => g.mine).length);

function backToMain() {
  goMain('/');
}
</script>

<style scoped>
/* 折行常开：qiankun 里媒体查询算的是浏览器窗口宽，主站窗口很宽但容器只有几
   百 px 时响应式根本不触发（搜索框被挤成一个「搜」字）。所以这里不靠断点，
   靠 flex-basis + min-width 让元素自己掉行；@container 再做细排 */
.sub-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 4px 2px 14px;
  font-size: 15px;
}
.sub-nav .back { color: var(--im-fg-soft); padding-left: 0; padding-right: 4px; flex: 0 0 auto; }
.sub-nav .back:hover { color: var(--el-color-primary); }
.sub-nav .grow { flex: 1 1 0; }
.sub-nav .cta { flex: 0 0 auto; }
.sub-nav .mine-tag { flex: 0 0 auto; }
/* 分类与搜索各留一个可读下限，挤不下就整块掉到下一行，而不是被压扁 */
.sub-nav .sel { flex: 0 1 auto; min-width: 118px; }
.sub-nav .ip { flex: 1 1 190px; min-width: 150px; }
/* 容器（不是窗口）窄于 620px 时：返回 + 发布站第一行，分类 + 搜索第二行各半 */
@container (max-width: 620px) {
  .sub-nav .grow { display: none; }
  .sub-nav .back { order: 0; }
  .sub-nav .cta { order: 1; margin-left: auto; }
  .sub-nav .sel { order: 2; flex: 1 1 130px; }
  .sub-nav .ip { order: 3; flex: 1 1 130px; }
  .sub-nav .mine-tag { order: 4; }
}
/* 深色下 EP 主色按钮的描边是深灰，压在深紫底上边界糊掉，补一道亮环 */
html.dark .sub-nav .cta { box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.24); }

/* 搜索做成胶囊，和主站头部一套观感 */
.sub-nav .ip :deep(.el-input__wrapper) {
  border-radius: 999px;
  box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.14);
  transition: 0.25s;
}
html.dark .sub-nav .ip :deep(.el-input__wrapper) { box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.16); }
html.dark .sub-nav .sel :deep(.el-select__wrapper) { box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.16); background: var(--im-surface); }
.sub-nav .ip :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary), 0 8px 20px rgba(124, 58, 237, 0.16);
}
.sub-nav .sel :deep(.el-select__wrapper) { border-radius: 999px; }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 16px;
}
.card {
  display: flex;
  flex-direction: column; /* 纵向骨架：配合 .owner 的 margin-top:auto 把发布者按到底 */
  background: var(--im-surface);
  border: 1px solid var(--im-line);
  border-radius: 16px;
  padding: 14px;
  cursor: pointer;
  transition: 0.2s;
  backdrop-filter: blur(10px);
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(80, 40, 160, 0.18);
}
/* 深色下紫阴影压在深紫页底上等于没有，改用纯黑投影把卡片浮起来 */
html.dark .card:hover { box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45); }
.thumb {
  position: relative;
  width: 100%;
  height: 170px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--im-surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.emoji { font-size: 46px; }
.cnt {
  position: absolute;
  right: 8px;
  bottom: 8px;
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
}
.sold {
  position: absolute;
  left: 8px;
  top: 8px;
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
}
/* —— 卡片内部骨架：各块高度固定，标题长短不再互相顶位 ——
   标题最长两行（短标题也占够两行），价格 / 分类行 / 发布者因此落在同一条水平线上；
   meta 与 owner 都单行省略，长文案（东区宿舍 3 栋 / 长昵称）不会换行把卡片撑高。 */
.title {
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--im-fg);
  line-height: 1.4;
  min-height: 2.8em; /* = 2 行 × 1.4，短标题也留出两行位 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}
.price { color: var(--im-brand); font-weight: 800; font-size: 18px; line-height: 1.4; }
.meta {
  font-size: 12px;
  color: var(--im-fg-soft);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.owner {
  font-size: 12px;
  color: var(--im-fg-soft);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: auto; /* 贴卡片底部：同行卡片高度被拉伸时，发布者仍在同一水平线 */
  padding-top: 8px;
  /* 带「我发布的」小标签的行高是 24px（EP small tag），统一抬到同高，卡片才完全等高 */
  min-height: 24px;
}
.owner-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* —— 分页 —— */
.loading-tip { text-align: center; font-size: 12.5px; color: var(--im-fg-soft); padding: 10px 0 2px; }
.pager { display: flex; justify-content: center; padding: 20px 0 4px; }

@media (max-width: 900px) {
  /* 手机端：滚动加载负责分页，页码不出现 */
  .pager { display: none; }

  /* 一行挤不下就分两排：第一排标题 + 发布，第二排搜索 + 分类 */
  .sub-nav {
    flex-wrap: wrap;
    gap: 8px;
    padding-bottom: 12px;
  }
  .sub-nav .grow { display: none; }
  .sub-nav .cta { order: 2; }
  .sub-nav .sel { order: 3; width: 42%; }
  .sub-nav .ip { order: 4; flex: 1; }
  .sub-nav .mine-tag { order: 5; }
  .sub-nav .back { order: 0; padding-left: 0; }
  .sub-nav .ip :deep(.el-input__wrapper),
  .sub-nav .sel :deep(.el-select__wrapper) { border-radius: 999px; }
  .grid { grid-template-columns: repeat(auto-fill, minmax(145px, 1fr)); gap: 12px; }
  .card { padding: 11px; border-radius: 14px; }
  .thumb { height: 130px; }
  .title { font-size: 13.5px; }
  .price { font-size: 16px; }
  .meta { font-size: 11px; }
}
</style>
