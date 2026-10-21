<template>
  <div :class="s.forum">
    <!-- 左：板块 + 帖子列表 -->
    <div :class="s.mainCol">
      <div :class="s.bar"><!-- card 外观走 ui.module.css 的 .bar 的 composes -->
        <el-input v-model="kw" placeholder="搜帖子…" clearable style="flex: 1" />
        <el-button type="primary" @click="openPost">+ 发帖</el-button>
      </div>

      <div :class="s.chips" ref="boardBarRef">
        <el-tag
          v-for="b in boards"
          :key="b.key"
          effect="plain"
          round
          :class="s.chip"
          :type="curBoard === b.key ? 'primary' : 'info'"
          @click="selectBoard(b.key)"
        >
          {{ b.name }}
        </el-tag>
      </div>

      <!-- 发帖：就地展开的内联面板（功能表单一律就地填，不用弹窗） -->
      <div v-if="postOpen" :class="s.composer" ref="composerRef">
        <div :class="s.composerHead">
          <i :class="s.barMark" />
          <b>发布帖子</b>
          <button type="button" :class="s.composerX" title="收起" @click="closePost">
            <el-icon :size="14"><Close /></el-icon>
          </button>
        </div>

        <div :class="s.form">
          <label :class="s.fl">板块</label>
          <el-select v-model="postForm.board">
            <el-option
              v-for="b in boards.filter((x) => x.key !== 'all')"
              :key="b.key"
              :label="b.name"
              :value="b.key"
            />
          </el-select>

          <label :class="s.fl">标题</label>
          <el-input v-model="postForm.title" maxlength="40" show-word-limit />

          <label :class="s.fl">正文</label>
          <el-input v-model="postForm.body" type="textarea" :rows="5" maxlength="500" show-word-limit />
        </div>

        <div :class="s.formFoot">
          <button type="button" :class="s.btn" @click="closePost">取消</button>
          <button type="button" :class="s.btnMain" @click="submitPost">发布</button>
        </div>
      </div>

      <div :class="s.list" v-loading="firstLoading">
        <div
          v-for="p in posts"
          :key="p.id"
          :class="[s.post, { [s.postOn]: expandedId === p.id, [s.postMine]: p.mine }]"
          @click="toggleDetail(p)"
        >
          <div :class="s.avatar">{{ p.avatar }}</div>
          <div :class="s.postBody">
            <div :class="s.postTitle">{{ p.title }}</div>
            <div :class="s.meta">
              <!-- 展示用中文名，p.board 仍是 key（筛选/提交都要用 key，不能在这里改掉） -->
              <el-tag size="small" effect="plain" type="primary">{{ boardName(p.board) }}</el-tag>
              <span :class="s.dot">·</span>{{ p.author }}<span :class="s.dot">·</span>{{ p.time }}
              <!-- 我发的帖子：作者后面挂一个「我」标记，列表里一眼认出自己那条 -->
              <span v-if="p.mine" :class="s.mineTag">我</span>
            </div>
            <div :class="s.tags">
              <el-tag v-for="tg in p.tags" :key="tg" size="small" type="info" effect="plain">{{ tg }}</el-tag>
            </div>

            <!-- 详情就地展开：点同一条收起，不再弹抽屉 -->
            <template v-if="expandedId === p.id">
              <p :class="s.dBody">{{ p.body }}</p>
              <div :class="s.dOps">
                <!-- 已收藏：实心星星 + 品牌渐变填充，和未收藏的淡底空心明显区分开 -->
                <button
                  type="button"
                  :class="[s.btnSm, { [s.btnCollected]: p.liked }]"
                  @click.stop="toggleLike(p)"
                >
                  <el-icon :size="13">
                    <component :is="p.liked ? StarFilled : Star" />
                  </el-icon>
                  {{ p.liked ? '已收藏' : '收藏' }}
                </button>
                <button type="button" :class="s.btnSm" @click.stop="replyTo(p)">
                  <el-icon :size="13"><ChatLineSquare /></el-icon>回复
                </button>
                <span :class="s.dHint">再点一下标题栏可收起</span>
              </div>
            </template>
          </div>
          <div :class="s.nums">
            <div><el-icon :size="13"><View /></el-icon> {{ p.views }}</div>
            <div><el-icon :size="13"><ChatLineSquare /></el-icon> {{ p.comments }}</div>
            <!-- 星星那栏跟着「收藏」按钮走，显示收藏数（不是点赞数），点了才有反馈 -->
            <div><el-icon :size="13"><Star /></el-icon> {{ p.collects ?? p.likes }}</div>
          </div>
        </div>

        <!-- 追加 loading / 到底提示（手机滚动分页用，PC 上不显示） -->
        <div v-if="loadingMore" :class="s.loadingTip">加载中…</div>
        <div v-else-if="noMore && posts.length" :class="s.loadingTip">没有更多了</div>

        <el-empty v-if="!posts.length && !firstLoading" description="这个板块还没有帖子" />
      </div>

      <!-- PC：页码翻页（手机走上面的滚动加载，媒体查询里互相隐藏） -->
      <div v-if="total > pageSize" :class="s.pager">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :page-size="pageSize"
          :current-page="page"
          :hide-on-single-page="false"
          @current-change="goPage"
        />
      </div>
    </div>

    <!-- 右：侧栏 -->
    <div :class="s.side">
      <div :class="s.sideCard">
        <div :class="s.sideH">热门板块</div>
        <div
          v-for="b in boards.filter((x) => x.key !== 'all')"
          :key="b.key"
          :class="[s.sideRow, { [s.sideRowOn]: curBoard === b.key }]"
          @click="selectBoard(b.key)"
        >
          <el-icon :size="15"><component :is="b.icon" /></el-icon>
          <span>{{ b.name }}</span>
          <span :class="s.sideDesc">{{ b.desc }}</span>
        </div>
      </div>

      <div :class="s.sideCard">
        <div :class="s.sideH">社区公约</div>
        <p :class="s.rule">1. 二手交易请标明成色与价格，谢绝线下恶意砍价</p>
        <p :class="s.rule">2. 求助请标注院系 / 楼层，回复更快</p>
        <p :class="s.rule">3. 转载他人内容请注明出处</p>
        <el-tag type="warning" effect="plain" size="small" style="margin-top: 6px">
          P3 阶段：帖子详情 / 搜索 待接入后端
        </el-tag>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch, useCssModule } from 'vue';
import { useRouter } from 'vue-router';
import { View, ChatLineSquare, Star, StarFilled, Close } from '@element-plus/icons-vue';
import request from '@/utils/request';
import { fromNow } from '@/utils/format';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { boardName, BOARD_ICON, BOARD_DESC } from '@/config/boards';
// 共享原子类（CSS Modules）：gcard / grow … 各页长得一样的外观都在这份里
import shared from '@/styles/ui.module.less';

// 一个句柄拿两类样式：ui.module.css 的共享原子类 + 本组件 @import '@/styles/mixins.less';
const s = { ...shared, ...useCssModule() };

const router = useRouter();
const user = useUserStore(); // 「我发的帖子」标记要靠登录用户 id
// 「我发的帖子」标记：拿登录用户的 id 与列表里的 author_id 比。
// tb_id 可能为空（老会话没存），拿不到就退化成按作者名比对，再不行就不标 —— 不能因此报错
const myId = Number(localStorage.getItem('tb_id')) || 0;
const myName = localStorage.getItem('tb_username') || '';
const isMine = (p) => (myId && p.author_id ? Number(p.author_id) === myId : !!myName && p.author === myName);

// 板块枚举：后端 /community/boards 只返回 {key,name}，图标/描述用 config/boards.js 的静态表补
// （前端展示，不与后端耦合）—— 之前这份表在本页重复抄了一份，抽成公共字典后本页只留映射逻辑
const BOARD_META = {};
for (const [key, icon] of Object.entries(BOARD_ICON)) {
  BOARD_META[key] = { icon, desc: BOARD_DESC[key] || '' };
}

const kw = ref('');
const curBoard = ref('all');
// 板块筛选栏锚点：用于切板块后把列表滚进视野
const boardBarRef = ref(null);
// 点板块（顶栏 chips / 侧栏「热门板块」）：先切数据，再把筛选栏滚进来。
// 窄屏下侧栏是单列布局的第二块，排在帖子列表「下面」——以前只改 curBoard 不滚动，
// 列表在屏幕外悄悄换了，用户只看到原地不动，就觉得「点了没定位过去」。
async function selectBoard(key) {
  curBoard.value = key;
  await nextTick();
  // block: 'start' 让筛选栏落回视口顶部，配合 .chips 的 scroll-margin 留一点呼吸位
  boardBarRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
// 详情就地展开：记当前展开的那一条（null = 全收起）。用 id 而不是索引，
// 本地发帖 unshift 到最前面后索引会错位
const expandedId = ref(null);
// 发帖用内联面板，不是弹窗（功能表单一律就地填，用户不该被盖住视线）
const postOpen = ref(false);
const composerRef = ref(null);
const postForm = ref({ board: 'help', title: '', body: '' });

// 板块 + 帖子来自 MySQL 后端。分页：手机滚动加载（滚到底自动追加下一页），
// PC 页码翻页 —— 后端 /posts 本来就返回 {list,total,page,pageSize}，之前前端没接 page
import { useIsMobile, useInfiniteOnScroll } from '@/utils/infinite';
const boards = ref([]);
const posts = ref([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const firstLoading = ref(true); // 首屏 / 翻页整列表 loading
const loadingMore = ref(false); // 滚动追加时只显示底部小字，不闪整页 loading
const noMore = computed(() => total.value > 0 && posts.value.length >= total.value);
const isMobile = useIsMobile(900);
// 滚动加载只在手机端生效：busy / 到底 / 列表为空都不再触发
const infEnabled = computed(
  () => isMobile.value && !firstLoading.value && !loadingMore.value && !noMore.value && posts.value.length > 0
);
useInfiniteOnScroll(infEnabled, loadMore);

// 点同一条 = 收起，点另一条 = 换一条展开
function toggleDetail(p) {
  expandedId.value = expandedId.value === p.id ? null : p.id;
}

// 收藏走后端 /posts/:id/collect（点赞是 /posts/:id/like，这里按钮叫「收藏」用 collect）。
// 计数同步收藏态，不再 ±likes（likes 是另一个维度）。
async function toggleLike(p) {
  try {
    const { collected, collects } = await request.post('/posts/' + p.id + '/collect');
    p.liked = !!collected;
    if (typeof collects === 'number') p.collects = collects;
    ElMessage.success(p.liked ? '已收藏，去「我的」页收藏夹能看到' : '已取消收藏');
  } catch (e) {
    ElMessage.error(e?.message || '操作失败');
  }
}

// 内联面板是插在帖子列表上方的，页面一长它就在首屏外 —— 展开后把它滚进视野，
// 否则用户只会看到列表往下顶了一下，以为按钮没反应
async function openPost() {
  postOpen.value = !postOpen.value;
  if (!postOpen.value) return;
  await nextTick();
  // block: 'center' 而不是 'start'：顶栏是 sticky，'start' 会被压在栏下面
  composerRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function closePost() {
  postOpen.value = false;
  resetPost();
}
function resetPost() {
  // 必须是 board_key（help），不是中文名 —— el-option 的 :value 就是 key。
  // 原来这里写死中文 '互助求助'，重置后 v-model 匹配不到任何 option，板块框直接空着
  postForm.value = { board: 'help', title: '', body: '' };
}

async function submitPost() {
  if (!postForm.value.title.trim()) return ElMessage.warning('标题不能为空');
  if (!postForm.value.body.trim()) return ElMessage.warning('正文不能为空');
  try {
    const { id } = await request.post('/posts', {
      board: postForm.value.board, // 后端要的是 board_key
      title: postForm.value.title.trim(),
      body: postForm.value.body.trim(),
      tags: []
    });
    // 本地预插一条，立即在列表顶部看到自己刚发的（无需整页刷新）
    posts.value.unshift({
      id,
      board: postForm.value.board,
      title: postForm.value.title.trim(),
      author: user.username || '我',
      author_id: myId,
      mine: true,
      avatar: '🙋',
      time: '刚刚',
      views: 0,
      likes: 0,
      comments: 0,
      tags: ['我发布的'],
      body: postForm.value.body.trim(),
      liked: false
    });
    postOpen.value = false;
    resetPost();
    curBoard.value = 'all';
    expandedId.value = null;
    total.value += 1; // 本地预插了一条，总数跟着 +1，分页才不会少算一页
    ElMessage.success('发帖成功');
  } catch (e) {
    ElMessage.error(e?.message || '发帖失败');
  }
}

// 板块：后端只返回 {key,name}，图标/描述用本地静态表补
async function loadBoards() {
  try {
    const list = await request.get('/community/boards');
    boards.value = (list || []).map((b) => ({
      ...b,
      icon: (BOARD_META[b.key] || {}).icon || 'Comment',
      desc: (BOARD_META[b.key] || {}).desc || ''
    }));
  } catch (e) {
    console.error('[ Community ] 加载板块失败：', e);
  }
}

// 帖子列表：board / q / page 全部下推后端（服务端过滤 + 分页），前端不再二次筛
async function fetchPosts(p) {
  const params = { page: p, pageSize: pageSize.value };
  if (curBoard.value !== 'all') params.board = curBoard.value;
  if (kw.value) params.q = kw.value;
  const data = await request.get('/posts', { params });
  return {
    list: (data.list || []).map((p) => ({
      id: p.id,
      board: p.board_key,
      title: p.title,
      author: p.author_name,
      author_id: p.author_id,
      mine: isMine(p),
      avatar: '🙋',
      time: fromNow(p.created_at),
      views: p.views,
      likes: p.likes,
      collects: p.collects,
      comments: p.comments,
      tags: [],
      body: p.body,
      // 收藏态以服务端为准（列表接口带 collected）：以前硬编码 false，刷新后按钮又变回
      // 「收藏」，用户再点一下其实是「取消收藏」，跟心里的预期完全相反
      liked: !!p.collected
    })),
    total: data.total || 0
  };
}

// 首屏 / 切板块 / 换关键词 / PC 翻页：整列表替换
async function reloadPosts(p = 1) {
  firstLoading.value = true;
  try {
    const { list, total: t } = await fetchPosts(p);
    posts.value = list;
    total.value = t;
    page.value = p;
    // PC 翻页后回到列表顶部，别让用户停在第 4 页的位置看第 1 页
    if (p > 1) window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    console.error('[ Community ] 加载帖子失败：', e);
  } finally {
    firstLoading.value = false;
  }
}

// 手机滚动到底：追加下一页
async function loadMore() {
  if (loadingMore.value || noMore.value) return;
  loadingMore.value = true;
  try {
    const { list, total: t } = await fetchPosts(page.value + 1);
    posts.value.push(...list);
    total.value = t;
    page.value += 1;
  } catch (e) {
    console.error('[ Community ] 加载更多帖子失败：', e);
  } finally {
    loadingMore.value = false;
  }
}

// PC 页码点击
function goPage(p) {
  if (p === page.value) return;
  reloadPosts(p);
}

onMounted(() => {
  loadBoards();
  reloadPosts();
});

// 切换板块立即重载；搜关键词做 300ms 防抖，避免每敲一个字打一次接口
watch(curBoard, () => reloadPosts());
let kwTimer = null;
watch(kw, () => {
  clearTimeout(kwTimer);
  kwTimer = setTimeout(() => reloadPosts(), 300);
});

// 回复：进帖子详情页发（详情页已接 /posts/:id/comments）
function replyTo(p) {
  router.push('/post/' + p.id);
}
</script>
<style lang="less" module>@import '@/styles/mixins.less';
/* 只放「本页特有」的样式；卡片外观吃 ui.module.css，别重复抄一遍 */

.forum { display: grid; grid-template-columns: 1fr 300px; gap: 16px; align-items: start; }
/* 左列是 1fr，长标题/长标签会把它撑破栅格，min-width:0 是 grid 子项的保命写法 */
.mainCol { min-width: 0; }

/* 顶栏 / 帖子卡 / 侧栏卡：卡片外观统一 composes 自 tb-card，这里只写本页的排版 */
.bar { composes: tb-card from global; display: flex; gap: 12px; padding: 12px 14px; margin-bottom: 12px; }
.post { composes: tb-card from global; display: flex; gap: 14px; padding: 16px; cursor: pointer; transition: 0.2s; }
.post:hover { transform: translateY(-2px); box-shadow: 0 14px 32px rgba(80, 40, 160, 0.16); }
/* 展开态：品牌描边压住 hover 的灰调，让人一眼看出这条是开着的 */
.postOn { border-color: var(--tb-primary); }
/* 我发的帖子：左侧一道品牌竖条 + 极淡的底色，扫一眼就能从别人的帖子里挑出来。
   用 border-left 而不是 outline —— 竖条在圆角卡片里不会溢出，左边距也不会被撑开 */
.postMine {
  border-left: 3px solid var(--tb-primary);
  background: linear-gradient(90deg, var(--tb-primary-soft) 0%, transparent 42%);
}
.mineTag {
  display: inline-flex;
  align-items: center;
  height: 16px;
  margin-left: 6px;
  padding: 0 6px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--tb-primary), var(--tb-secondary));
  color: #fff;
  font-size: 10.5px;
  font-weight: 700;
  line-height: 1;
  vertical-align: 1px;
}
.sideCard { composes: tb-card from global; padding: 16px 18px; }

.chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; scroll-margin-top: 12px; }
.chip { cursor: pointer; }

.list { display: flex; flex-direction: column; gap: 12px; }
.avatar {
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #ede9fe, #e0f2fe);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.postBody { flex: 1; min-width: 0; }
.postTitle { font-weight: 700; margin-bottom: 6px; }
.postTitle:hover { color: var(--tb-primary); }
.meta { font-size: 12px; color: var(--tb-sub); }
.dot { margin: 0 6px; }
.tags { margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap; }
.nums { text-align: right; font-size: 12px; color: var(--tb-sub); display: grid; gap: 5px; min-width: 66px; }
.nums div { display: flex; align-items: center; justify-content: flex-end; gap: 4px; }

.side { display: flex; flex-direction: column; gap: 16px; }
.sideH { font-weight: 700; margin-bottom: 10px; }
.sideRow {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid rgba(124, 58, 237, 0.1);
  font-size: 14px;
  cursor: pointer;
}
.sideRow:hover { color: var(--tb-primary); }
/* 当前板块：侧栏以前没有任何选中态，点完不知道到底切没切 */
.sideRowOn { color: var(--tb-primary); font-weight: 700; }
.sideRowOn .sideDesc { color: var(--tb-primary); opacity: 0.7; }
.sideDesc { font-size: 12px; color: var(--tb-sub); margin-left: auto; }
.rule { font-size: 13px; color: var(--tb-sub); line-height: 1.7; margin: 0 0 6px; }

/* —— 发帖内联面板：卡片外观 composes 自 tb-card，只写本页排版 —— */
.composer { composes: tb-card from global; padding: 18px 20px; margin-bottom: 14px; }
/* 品牌竖条标记。注意别复用 .bar —— 那是顶栏（composes tb-card，带卡片底 + flex + 内边距），
   拿它当小竖条会被 tb-card 的底色盖掉渐变 */
.barMark { width: 3px; height: 15px; border-radius: 3px; flex: none; background: linear-gradient(135deg, var(--tb-primary), var(--tb-secondary)); }
.composerHead { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.composerHead b { font-size: 15px; }
.composerX {
  margin-left: auto;
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; padding: 0;
  border: 1px solid transparent; border-radius: 50%;
  background: transparent; cursor: pointer; color: var(--tb-sub);
  transition: 0.18s;
}
.composerX:hover { color: var(--tb-text); background: var(--tb-primary-soft-2, rgba(124, 58, 237, 0.1)); }
.composerX:active { transform: scale(0.92); }

/* 表单：label 与输入框同排等宽，窄屏自动折行，不用 el-form 那套 label 列 */
.form { display: grid; grid-template-columns: 64px 1fr; gap: 12px 10px; align-items: center; }
.fl { font-size: 13px; font-weight: 600; color: var(--tb-sub); }
/* 正文要跨两行且自己撑高，否则会被 textarea 的 rows 撑破栅格 */
.form > :global(.el-textarea) { grid-column: 2; }
.formFoot { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; }

.dBody { line-height: 1.9; color: var(--tb-sub); margin: 12px 0 0; padding-top: 12px; border-top: 1px dashed var(--tb-line-dashed, rgba(124, 58, 237, 0.14)); }
.dOps { display: flex; align-items: center; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
/* 已收藏态：实心品牌渐变 + 白字，一眼区别于未收藏的淡底空心（原来两态几乎一样，看不出点没点过） */
.btnCollected {
  background: linear-gradient(135deg, var(--tb-primary), var(--tb-secondary));
  border-color: transparent;
  color: #fff;
  box-shadow: 0 6px 16px var(--tb-primary-ring);

  &:hover {
    background: linear-gradient(135deg, var(--tb-primary), var(--tb-secondary));
    color: #fff;
    transform: translateY(-1px);
    box-shadow: 0 10px 22px var(--tb-primary-ring);
  }
}
.dHint { font-size: 12px; color: var(--tb-sub); }

/* —— 分页 —— */
/* 滚动追加的小字提示 / 到底提示：细灰居中一行 */
.loadingTip {
  text-align: center;
  font-size: 12.5px;
  color: var(--tb-sub);
  padding: 6px 0 2px;
}
/* PC 页码：居中；手机上走滚动加载，整块隐藏 */
.pager { display: flex; justify-content: center; padding: 18px 0 4px; }

@media (max-width: 900px) {
  .forum { grid-template-columns: 1fr; gap: 12px; }
  .side { order: -1; }
  .sideCard { padding: 13px 14px; }
  .post { padding: 12px; gap: 10px; }
  .avatar { width: 38px; height: 38px; flex-basis: 38px; font-size: 19px; border-radius: 12px; }
  .bar { padding: 10px 12px; flex-wrap: wrap; }
  /* 手机上「+ 发帖」跟搜索框同行会被挤掉，让它掉到第二行占满。
     用 .bar :global(.el-button) 而不是裸 :deep(.el-button) —— 后者会命中整页所有按钮。
     同理，:global 挂在本页局部类下面，既穿透到子组件又不外溢 */
  .bar :global(.el-button) { flex: none; width: 100%; margin-top: 4px; }
  .nums { min-width: 56px; }
  /* 发帖面板：label 列太挤，改成 label 独占一行 */
  .composer { padding: 14px; }
  .form { grid-template-columns: 1fr; gap: 8px; }
  .form > :global(.el-textarea) { grid-column: 1; }
  .formFoot { margin-top: 14px; }
  .formFoot :global(.el-button), .formFoot button { flex: 1; }
  /* 展开详情时整张卡要「立」出来，不然跟普通帖子分不出来 */
  .postOn { border-color: var(--tb-primary); }
  /* 手机端：滚动加载负责分页，页码不出现 */
  .pager { display: none; }
}
@media (max-width: 480px) {
  .nums { display: none; }
  .postBody .postTitle { font-size: 14px; }
}
</style>
