<template>
  <div :class="s.page">
    <div :class="s.bar">
      <button type="button" :class="s.back" @click="router.push('/community')">
        <el-icon :size="16"><ArrowLeft /></el-icon><span>返回社区</span>
      </button>
      <el-tag size="small" type="primary" effect="plain">{{ cur.board }}</el-tag>
    </div>

    <template v-if="cur">
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
            <div :class="s.aMeta">{{ cur.time }} · {{ cur.views }} 次浏览</div>
          </div>
          <el-button size="small" plain :type="liked ? 'warning' : 'default'" @click="toggleLike">
            <el-icon :size="13"><Star /></el-icon>{{ liked ? '已收藏' : '收藏' }}
          </el-button>
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

    <el-empty v-else description="帖子不存在或已删除" />
  </div>
</template>

<script setup>
import { ref, computed, useCssModule } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, ChatLineSquare, Right, Star, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { posts as mockPosts, postComments } from '@/config/mockData';
// 共享原子类（CSS Modules）：s.card / s.row … 各页长得一样的外观都在这份里
import shared from '@/styles/ui.module.less';

// 一个句柄拿两类样式：ui.module.css 的共享原子类 + 本组件 @import '@/styles/mixins.less';
const s = { ...shared, ...useCssModule() };

const route = useRoute();
const router = useRouter();
// 帖子本身沿用社区列表那份 mock（本地发帖 unshift 进去后这里也能读到刚发的那条）
const cur = computed(() => mockPosts.find((p) => String(p.id) === String(route.params.id)) || null);
const comments = ref([...(postComments[route.params.id] || [])]);
const liked = ref(false);
const draft = ref('');

const toggleLike = () => {
  liked.value = !liked.value;
  if (cur.value) cur.value.likes += liked.value ? 1 : -1;
  ElMessage.success(liked.value ? '已收藏' : '已取消收藏');
};

function send() {
  const text = draft.value.trim();
  if (!text) return;
  comments.value.push({ id: Date.now(), name: '我', avatar: '🙋', time: '刚刚', text });
  draft.value = '';
  if (cur.value) cur.value.comments += 1;
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

.body { margin: 18px 0 0; font-size: 15px; line-height: 1.95; color: #3c3752; white-space: pre-wrap; }
.tags { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 16px; }
.nums { display: flex; gap: 18px; margin-top: 18px; padding-top: 14px; border-top: 1px solid rgba(124, 58, 237, 0.1); font-size: 12.5px; color: var(--tb-sub); }
.nums span { display: inline-flex; align-items: center; gap: 5px; }
.liked { color: #f59e0b; font-weight: 600; }

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
.cText { margin: 5px 0 0; font-size: 14px; line-height: 1.8; color: #443d5e; }

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
