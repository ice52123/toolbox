<template>
  <div :class="s.page">
    <div :class="s.bar">
      <button type="button" :class="s.back" @click="router.push('/community')">
        <el-icon :size="16"><ArrowLeft /></el-icon><span>返回社区</span>
      </button>
      <!-- 板块标签：后端存的是 board_key（general），必须翻成中文，
           直接渲染就成了英文标签 -->
      <el-tag v-if="cur" size="small" type="primary" effect="plain">{{ boardName(cur.board) }}</el-tag>
    </div>

    <!-- 加载中先给骨架，别让用户误以为帖子没了：
         以前 cur 初始是 null，数据没回来时直接走 v-else 渲染「帖子不存在或已删除」，
         网络一慢就先闪半天错误页，内容回来才被顶掉 -->
    <div v-if="loading" :class="s.card">
      <el-skeleton :rows="4" animated />
      <el-skeleton :rows="2" animated style="margin-top: 26px" />
    </div>

    <template v-else-if="cur">
      <!-- 正文卡 -->
      <div :class="s.card">
        <h1 :class="s.title">{{ cur.title }}</h1>
        <div :class="s.author">
          <div :class="s.avaBig">{{ cur.avatar }}</div>
          <div :class="s.aMain">
            <router-link :to="'/user/' + encodeURIComponent(cur.author)" :class="s.aName">
              {{ cur.author }}
              <el-icon :size="13"><Right /></el-icon>
            </router-link>
            <span v-if="cur.mine" :class="s.mineTag">我</span>
            <div :class="s.aMeta">{{ cur.time }} · {{ cur.views }} 次浏览</div>
          </div>
          <!-- 收藏：已收藏时实心星星 + 品牌渐变，和未收藏的淡底空心区分开 -->
          <button type="button" :class="[s.btnSm, { [s.btnCollected]: liked }]" @click="toggleLike">
            <el-icon :size="13"><component :is="liked ? StarFilled : Star" /></el-icon>
            {{ liked ? '已收藏' : '收藏' }}
          </button>
        </div>

        <p :class="s.body">{{ cur.body }}</p>

        <div :class="s.tags">
          <el-tag v-for="tg in cur.tags" :key="tg" size="small" type="info" effect="plain">{{ tg }}</el-tag>
        </div>

        <div :class="s.nums">
          <span><el-icon :size="13"><View /></el-icon> {{ cur.views }}</span>
          <span><el-icon :size="13"><ChatLineSquare /></el-icon> {{ cur.comments }}</span>
          <span :class="{ [s.liked]: liked }"><el-icon :size="13"><Star /></el-icon> {{ cur.likes }}</span>
        </div>
      </div>

      <!-- 评论区 -->
      <div :class="s.card">
        <div :class="s.cHead">全部回复 <span :class="s.cNum">{{ comments.length }}</span></div>

        <div :class="s.reply">
          <div :class="[s.ava, s.self]">🙋</div>
          <el-input
            v-model="draft"
            :class="s.replyInput"
            placeholder="友善回复，落款院系楼层能更快被看到…"
            @keyup.enter="send"
          />
          <el-button type="primary" :disabled="!draft.trim()" @click="send">发送</el-button>
        </div>

        <div v-for="c in comments" :key="c.id" :class="s.cItem">
          <div :class="s.ava">{{ c.avatar }}</div>
          <div :class="s.cMain">
            <div :class="s.cName">
              <router-link :to="'/user/' + encodeURIComponent(c.name)" :class="s.cLink">{{ c.name }}</router-link>
              <span :class="s.cTime">{{ c.time }}</span>
            </div>
            <p :class="s.cText">{{ c.text }}</p>
          </div>
        </div>

        <el-empty v-if="!comments.length" description="还没有人回复，来抢占一楼" :image-size="70" />
      </div>
    </template>

    <!-- 「帖子不存在或已删除」只在「确实加载完且没拿到」时出现，加载中绝不显示 -->
    <el-empty v-else description="帖子不存在或已删除" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, useCssModule } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, ChatLineSquare, Right, Star, StarFilled, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';
import { fromNow } from '@/utils/format';
import { boardName } from '@/config/boards';
// 共享原子类（CSS Modules）：s.card / s.row … 各页长得一样的外观都在这份里
import shared from '@/styles/ui.module.less';

// 一个句柄拿两类样式：ui.module.css 的共享原子类 + 本组件 @import '@/styles/mixins.less';
const s = { ...shared, ...useCssModule() };

const route = useRoute();
const router = useRouter();
// 帖子详情 + 评论都来自后端：详情调 /posts/:id（阅读量自增），评论调 /posts/:id/comments
const cur = ref(null);
const comments = ref([]);
// 加载态：与「帖子不存在」严格分开 —— 加载中显示骨架，加载完没数据才显示空态
const loading = ref(true);
// 收藏态：进页面时以服务端返回的 collected 为准（以前默认 false，已经收藏过的帖子
// 按钮仍显示「收藏」，点一下反而把收藏取消了）
const liked = ref(false);
const draft = ref('');
// 登录用户 id：用来判断「这是我发的帖子」（tb_id 为空时退化为不打标）
const myId = Number(localStorage.getItem('tb_id')) || 0;

async function loadPost() {
  const id = route.params.id;
  loading.value = true; // 换帖重载时先回骨架态，避免上一帖残留或闪空态
  try {
    const p = await request.get('/posts/' + id);
    cur.value = {
      id: p.id,
      board: p.board_key,
      title: p.title,
      author: p.author_name,
      // 我发的帖子打标：详情页也要能一眼认出「这是我发的」
      mine: !!myId && Number(p.author_id) === myId,
      avatar: '🙋',
      time: fromNow(p.created_at),
      views: p.views,
      likes: p.likes,
      comments: p.comments,
      body: p.body,
      tags: []
    };
    liked.value = !!p.collected;
  } catch (e) {
    cur.value = null;
    console.error('[ PostDetail ] 加载帖子失败：', e);
  } finally {
    loading.value = false;
  }
  await loadComments();
}

async function loadComments() {
  try {
    const list = await request.get('/posts/' + route.params.id + '/comments');
    comments.value = (list || []).map((c) => ({
      id: c.id,
      name: c.name,
      avatar: '🙋',
      time: fromNow(c.created_at),
      text: c.text
    }));
  } catch (e) {
    comments.value = [];
    console.error('[ PostDetail ] 加载评论失败：', e);
  }
}

onMounted(loadPost);
// 同一页内点「下一篇」时 route.params.id 变了，重新拉
watch(() => route.params.id, loadPost);

// 收藏走后端 /posts/:id/collect（点赞是 like，这里按钮叫收藏用 collect）
async function toggleLike() {
  if (!cur.value) return;
  try {
    const { collected } = await request.post('/posts/' + cur.value.id + '/collect');
    liked.value = !!collected;
    ElMessage.success(liked.value ? '已收藏' : '已取消收藏');
  } catch (e) {
    ElMessage.error(e?.message || '操作失败');
  }
}

async function send() {
  const text = draft.value.trim();
  if (!text || !cur.value) return;
  try {
    await request.post('/posts/' + cur.value.id + '/comments', { text, parentId: null });
    comments.value.push({ id: Date.now(), name: '我', avatar: '🙋', time: '刚刚', text });
    draft.value = '';
    if (cur.value) cur.value.comments += 1;
  } catch (e) {
    ElMessage.error(e?.message || '评论失败');
  }
}
</script>

<style lang="less" module>@import '@/styles/mixins.less';
/* 只放「本页特有」的样式；卡片外观吃 ui.module.css，别重复抄一遍 */

.page { composes: tb-page from global; max-width: 880px; }

.bar { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.back {
  display: inline-flex; align-items: center; gap: 5px;
  height: 30px; padding: 0 12px;
  border: 1px solid var(--tb-border); border-radius: 10px;
  background: transparent; color: var(--tb-sub); font-size: 12.5px; font-weight: 600; cursor: pointer;
  transition: 0.18s;
}
.back:hover { color: var(--tb-primary); border-color: var(--tb-primary); }

/* 正文 / 评论两块卡：卡片外观 composes 自 tb-card */
.card { composes: tb-card from global; padding: 24px 26px; margin-bottom: 16px; }
.title { margin: 0 0 16px; font-size: 24px; line-height: 1.45; font-weight: 800; }

.author { display: flex; align-items: center; gap: 12px; padding-bottom: 18px; border-bottom: 1px dashed var(--tb-line-dashed); }
/* 头像底：.ava 是评论/输入框那档（34px），.avaBig 是作者行（42px）。
   别写成两条同名 .ava —— CSS Modules 下同名只算一个类，后写的会把前面那条整条盖掉 */
.ava, .avaBig {
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #f3f0ff, #eef6ff);
}
.ava { width: 34px; height: 34px; flex: 0 0 34px; border-radius: 11px; font-size: 17px; }
.avaBig { width: 42px; height: 42px; flex: 0 0 42px; border-radius: 14px; font-size: 21px; }
.self { background: linear-gradient(135deg, #ede9fe, #e0f2fe); }
.aMain { flex: 1; min-width: 0; }
.aName {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 14.5px; font-weight: 700; color: var(--tb-text); text-decoration: none;
}
.aName:hover { color: var(--tb-primary); }
.aMeta { font-size: 12px; color: var(--tb-sub); margin-top: 3px; }
/* 「我」标记：品牌渐变小胶囊，跟社区列表里那条一致 */
.mineTag {
  display: inline-flex;
  align-items: center;
  height: 17px;
  padding: 0 7px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--tb-primary), var(--tb-secondary));
  color: #fff;
  font-size: 10.5px;
  font-weight: 700;
  line-height: 1;
  vertical-align: 2px;
}

.body { margin: 18px 0 0; font-size: 15px; line-height: 1.95; color: var(--tb-sub); white-space: pre-wrap; }
/* 已收藏态：实心品牌渐变填充，和未收藏的淡底空心一眼能分开 */
.btnCollected {
  background: linear-gradient(135deg, var(--tb-primary), var(--tb-secondary));
  border-color: transparent;
  color: @c-white;
  box-shadow: 0 6px 16px var(--tb-primary-ring);

  &:hover {
    background: linear-gradient(135deg, var(--tb-primary), var(--tb-secondary));
    color: @c-white;
    transform: translateY(-1px);
    box-shadow: 0 10px 22px var(--tb-primary-ring);
  }
}
.tags { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 16px; }
.nums { display: flex; gap: 18px; margin-top: 18px; padding-top: 14px; border-top: 1px solid rgba(124, 58, 237, 0.1); font-size: 12.5px; color: var(--tb-sub); }
.nums span { display: inline-flex; align-items: center; gap: 5px; }
.liked { color: var(--tb-warn); font-weight: 600; }

/* —— 评论 —— */
.cHead { font-size: 15px; font-weight: 700; margin-bottom: 14px; }
.cNum { color: var(--tb-sub); font-weight: 600; font-size: 12.5px; }

.reply { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.replyInput { flex: 1; }

.cItem { display: flex; gap: 11px; padding: 12px 0; border-top: 1px solid rgba(124, 58, 237, 0.1); }
.cMain { flex: 1; min-width: 0; }
.cName { display: flex; align-items: baseline; gap: 9px; }
.cLink { font-size: 13.5px; font-weight: 700; color: var(--tb-text); text-decoration: none; }
.cLink:hover { color: var(--tb-primary); }
.cTime { font-size: 11.5px; color: var(--tb-sub); }
.cText { margin: 5px 0 0; font-size: 14px; line-height: 1.8; color: var(--tb-sub); }

.m-sm({
  .page { max-width: 100%; }
  .card { padding: 17px 15px; }
  .title { font-size: 19px; }
  .back span { display: none; }
  .back { width: 30px; padding: 0; justify-content: center; }
  .body { font-size: 14.5px; line-height: 1.85; }
  .author { flex-wrap: wrap; }
  .author :global(.el-button) { order: -1; }
});
</style>
