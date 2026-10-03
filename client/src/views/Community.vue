<template>
  <div :class="s.forum">
    <!-- 左：板块 + 帖子列表 -->
    <div :class="s.mainCol">
      <div :class="s.bar"><!-- card 外观走 ui.module.css 的 .bar 的 composes -->
        <el-input v-model="kw" placeholder="搜帖子…" clearable style="flex: 1" />
        <el-button type="primary" @click="openPost">+ 发帖</el-button>
      </div>

      <div :class="s.chips">
        <el-tag
          v-for="b in boards"
          :key="b.key"
          effect="plain"
          round
          :class="s.chip"
          :type="curBoard === b.key ? 'primary' : 'info'"
          @click="curBoard = b.key"
        >
          {{ b.name }}
        </el-tag>
      </div>

      <!-- 发帖：就地展开的内联面板（功能表单一律就地填，不用弹窗） -->
      <div v-if="postOpen" :class="s.composer">
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
              :value="b.name"
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

      <div :class="s.list">
        <div
          v-for="p in filteredPosts"
          :key="p.id"
          :class="[s.post, { [s.postOn]: expandedId === p.id }]"
          @click="toggleDetail(p)"
        >
          <div :class="s.avatar">{{ p.avatar }}</div>
          <div :class="s.postBody">
            <div :class="s.postTitle">{{ p.title }}</div>
            <div :class="s.meta">
              <el-tag size="small" effect="plain" type="primary">{{ p.board }}</el-tag>
              <span :class="s.dot">·</span>{{ p.author }}<span :class="s.dot">·</span>{{ p.time }}
            </div>
            <div :class="s.tags">
              <el-tag v-for="tg in p.tags" :key="tg" size="small" type="info" effect="plain">{{ tg }}</el-tag>
            </div>

            <!-- 详情就地展开：点同一条收起，不再弹抽屉 -->
            <template v-if="expandedId === p.id">
              <p :class="s.dBody">{{ p.body }}</p>
              <div :class="s.dOps">
                <button type="button" :class="s.btnSm" @click.stop="toggleLike(p)">
                  <el-icon :size="13"><Star /></el-icon>{{ p.liked ? '已收藏' : '收藏' }}
                </button>
                <button type="button" :class="s.btnSm" @click.stop="ElMessage.info('回复暂未接入后端')">
                  <el-icon :size="13"><ChatLineSquare /></el-icon>回复
                </button>
                <span :class="s.dHint">再点一下标题栏可收起</span>
              </div>
            </template>
          </div>
          <div :class="s.nums">
            <div><el-icon :size="13"><View /></el-icon> {{ p.views }}</div>
            <div><el-icon :size="13"><ChatLineSquare /></el-icon> {{ p.comments }}</div>
            <div><el-icon :size="13"><Star /></el-icon> {{ p.likes }}</div>
          </div>
        </div>

        <el-empty v-if="!filteredPosts.length" description="这个板块还没有帖子" />
      </div>
    </div>

    <!-- 右：侧栏 -->
    <div :class="s.side">
      <div :class="s.sideCard">
        <div :class="s.sideH">热门板块</div>
        <div v-for="b in boards.filter((x) => x.key !== 'all')" :key="b.key" :class="s.sideRow" @click="curBoard = b.key">
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
import { ref, computed, onMounted, useCssModule } from 'vue';
import { View, ChatLineSquare, Star, Close } from '@element-plus/icons-vue';
import { boards, posts as mockPosts } from '@/config/mockData';
import { ElMessage } from 'element-plus';
// 共享原子类（CSS Modules）：gcard / grow … 各页长得一样的外观都在这份里
import shared from '@/styles/ui.module.less';

// 一个句柄拿两类样式：ui.module.css 的共享原子类 + 本组件 @import '@/styles/mixins.less';
const s = { ...shared, ...useCssModule() };

const kw = ref('');
const curBoard = ref('all');
// 详情就地展开：记当前展开的那一条（null = 全收起）。用 id 而不是索引，
// 本地发帖 unshift 到最前面后索引会错位
const expandedId = ref(null);
// 发帖用内联面板，不是弹窗（功能表单一律就地填，用户不该被盖住视线）
const postOpen = ref(false);
const postForm = ref({ board: '互助求助', title: '', body: '' });

const posts = ref([...mockPosts]);

const filteredPosts = computed(() =>
  posts.value.filter((p) => {
    const okBoard = curBoard.value === 'all' || p.board === curBoard.value;
    const okKw = !kw.value || p.title.includes(kw.value);
    return okBoard && okKw;
  })
);

// 点同一条 = 收起，点另一条 = 换一条展开
function toggleDetail(p) {
  expandedId.value = expandedId.value === p.id ? null : p.id;
}

// 收藏就地翻面，别弹 confirm（那是「破坏性操作」才配有的待遇）
function toggleLike(p) {
  p.liked = !p.liked;
  p.likes += p.liked ? 1 : -1;
  ElMessage.success(p.liked ? '已收藏' : '已取消收藏');
}

function openPost() {
  postOpen.value = !postOpen.value;
}
function closePost() {
  postOpen.value = false;
  resetPost();
}
function resetPost() {
  postForm.value = { board: '互助求助', title: '', body: '' };
}

function submitPost() {
  if (!postForm.value.title.trim()) return ElMessage.warning('标题不能为空');
  if (!postForm.value.body.trim()) return ElMessage.warning('正文不能为空');
  const id = Date.now();
  posts.value.unshift({
    id,
    board: postForm.value.board,
    title: postForm.value.title.trim(),
    author: '我',
    avatar: '🙋',
    time: '刚刚',
    views: 0,
    likes: 0,
    comments: 0,
    tags: ['我发布的'],
    body: postForm.value.body.trim()
  });
  postOpen.value = false;
  resetPost();
  curBoard.value = 'all';
  expandedId.value = null;
  ElMessage.success('发帖成功（本地草稿，P3 接后端后上云）');
}

onMounted(() => {
  // 给每条帖子补一段正文，详情页直接展示
  posts.value.forEach((p) => {
    if (!p.body) p.body = `大家好，想聊聊「${p.title}」这件事。最近在校园里碰到不少同学问，整理一下经验给后来人参考，也欢迎在下面补充你们的情况～`;
  });
});
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
.sideCard { composes: tb-card from global; padding: 16px 18px; }

.chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
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

.dBody { line-height: 1.9; color: #4b4560; margin: 12px 0 0; padding-top: 12px; border-top: 1px dashed var(--tb-line-dashed, rgba(124, 58, 237, 0.14)); }
.dOps { display: flex; align-items: center; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
.dHint { font-size: 12px; color: var(--tb-sub); }

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
}
@media (max-width: 480px) {
  .nums { display: none; }
  .postBody .postTitle { font-size: 14px; }
}
</style>
