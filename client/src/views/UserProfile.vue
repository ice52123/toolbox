<template>
  <div :class="s.page">
    <button type="button" :class="s.back" @click="router.push('/message')">
      <el-icon :size="16"><ArrowLeft /></el-icon><span>返回消息中心</span>
    </button>

    <template v-if="user">
      <!-- 资料卡 -->
      <div :class="s.prof">
        <div :class="s.bigAva">{{ user.avatar }}</div>
        <div :class="s.pMain">
          <div :class="s.pTop">
            <b :class="s.pName">{{ name }}</b>
            <el-tag size="small" effect="plain" :type="isOfficial ? 'warning' : 'primary'">
              {{ isOfficial ? '官方助手' : '在校同学' }}
            </el-tag>
          </div>
          <div :class="s.pDept">{{ user.dept }}</div>
          <p :class="s.pIntro">{{ user.intro }}</p>
          <div :class="s.pStats">
            <span><b>{{ goods.length }}</b> 在售闲置</span>
            <span><b>{{ posts.length }}</b> 条帖子</span>
            <span><b>{{ followers }}</b> 关注者</span>
          </div>
        </div>
        <el-button
          v-if="!isOfficial"
          :class="s.followBtn"
          :type="following ? 'default' : 'primary'"
          plain
          @click="toggleFollow"
        >
          {{ following ? '已关注' : '关注' }}
        </el-button>
      </div>

      <!-- 在售闲置 -->
      <div :class="s.sec">
        <div :class="s.secHead"><b>在售闲置</b><span :class="s.secNum">{{ goods.length }}</span></div>
        <div :class="s.gList">
          <div v-for="g in goods" :key="g.id" :class="s.gItem">
            <div :class="s.gThumb">🛍️</div>
            <div :class="s.gMain">
              <div :class="s.gTitle">{{ g.title }}</div>
              <div :class="s.gMeta">{{ g.cat }} · {{ g.place }}</div>
            </div>
            <div :class="s.gPrice">¥{{ g.price }}</div>
          </div>
          <el-empty v-if="!goods.length" description="TA 还没有在售的闲置" :image-size="66" />
        </div>
      </div>

      <!-- 帖子 -->
      <div :class="s.sec">
        <div :class="s.secHead"><b>发布的帖子</b><span :class="s.secNum">{{ posts.length }}</span></div>
        <div :class="s.list">
          <div
            v-for="p in posts"
            :key="p.id"
            :class="s.pItem"
            @click="router.push('/post/' + p.id)"
          >
            <div :class="s.pMore"><el-icon :size="15"><ArrowRight /></el-icon></div>
            <div :class="s.pMain">
              <div :class="s.pTitle">{{ p.title }}</div>
              <div :class="s.pMeta">
                <el-tag size="small" effect="plain" type="primary">{{ p.board }}</el-tag>
                {{ p.time }} · {{ p.comments }} 回复 · {{ p.likes }} 赞
              </div>
            </div>
          </div>
          <el-empty v-if="!posts.length" description="TA 还没发过帖子" :image-size="66" />
        </div>
      </div>
    </template>

    <el-empty v-else description="找不到这位同学" />
  </div>
</template>

<script setup>
import { ref, computed, useCssModule } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { users as mockUsers, latestGoods, posts as mockPosts } from '@/config/mockData';
// 共享原子类（CSS Modules）：s.card / s.row … 各页长得一样的外观都在这份里
import shared from '@/styles/ui.module.less';

// 一个句柄拿两类样式：ui.module.css 的共享原子类 + 本组件 @import '@/styles/mixins.less';
const s = { ...shared, ...useCssModule() };

const route = useRoute();
const router = useRouter();
// 路由参数会被 vue-router 自动解码，/user/王同学 进来拿到的就是「王同学」
const name = computed(() => route.params.name || '');
const user = computed(() => mockUsers[name.value] || null);
const isOfficial = computed(() => !!user.value && !!user.value.dept.includes('官方'));
const following = ref(false);

// 商品按 users 里记的 id 从 latestGoods 取，帖子按 author 从 posts 取 —— 同一份数据不重复存
const goods = computed(() =>
  user.value ? latestGoods.filter((g) => user.value.goods.includes(g.id)) : []
);
const posts = computed(() =>
  user.value ? mockPosts.filter((p) => p.author === name.value) : []
);
const followers = computed(() => (isOfficial.value ? 4820 : 12 + posts.value.length * 3 + goods.value.length));

function toggleFollow() {
  following.value = !following.value;
  ElMessage.success(following.value ? `已关注 ${name.value}` : `已取消关注 ${name.value}`);
}
</script>

<style lang="less" module>@import '@/styles/mixins.less';
/* 只放「本页特有」的样式；卡片外观吃 ui.module.css，别重复抄一遍 */

.page { composes: tb-page from global; max-width: 880px; }

.back {
  display: inline-flex; align-items: center; gap: 5px;
  height: 30px; padding: 0 12px; margin-bottom: 14px;
  border: 1px solid var(--tb-border); border-radius: 10px;
  background: transparent; color: var(--tb-sub); font-size: 12.5px; font-weight: 600; cursor: pointer;
  transition: 0.18s;
}
.back:hover { color: var(--tb-primary); border-color: var(--tb-primary); }

/* 资料卡 / 区块卡：卡片外观 composes 自 tb-card */
.prof { composes: tb-card from global; display: flex; align-items: center; gap: 16px; padding: 22px 24px; margin-bottom: 16px; }
.bigAva {
  width: 72px; height: 72px; flex: 0 0 72px; border-radius: 22px; font-size: 36px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #ede9fe, #e0f2fe);
  box-shadow: 0 10px 24px rgba(124, 58, 237, 0.18);
}
.pMain { flex: 1; min-width: 0; }
.pTop { display: flex; align-items: center; gap: 9px; }
.pName { font-size: 20px; }
.pDept { font-size: 13px; color: var(--tb-sub); margin-top: 5px; }
.pIntro { margin: 9px 0 0; font-size: 13.8px; line-height: 1.75; color: #46405e; }
.pStats { display: flex; gap: 18px; margin-top: 12px; font-size: 12.5px; color: var(--tb-sub); }
.pStats b { color: var(--tb-text); font-size: 14px; }
.followBtn { flex: none; }

.sec { composes: tb-card from global; padding: 18px 20px 20px; margin-bottom: 16px; }
.secHead { display: flex; align-items: baseline; gap: 8px; margin-bottom: 14px; }
.secHead b { font-size: 15.5px; }
.secNum { font-size: 12.5px; color: var(--tb-sub); margin-left: auto; }

.gList { display: flex; flex-direction: column; gap: 10px; }
.gItem { composes: tb-row from global; display: flex; align-items: center; gap: 12px; }
.gThumb {
  width: 46px; height: 46px; flex: 0 0 46px; border-radius: 13px; font-size: 22px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #f3f0ff, #eef6ff);
}
.gMain { flex: 1; min-width: 0; }
.gTitle { font-size: 14px; font-weight: 600; .ellipsis-one(); }
.gMeta { font-size: 12px; color: var(--tb-sub); margin-top: 3px; }
.gPrice { color: var(--tb-primary); font-weight: 800; font-size: 16px; flex: none; }

.list { display: flex; flex-direction: column; gap: 10px; }
.pItem { composes: tb-row from global; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.18s; }
.pItem:hover { color: var(--tb-primary); }
.pMain { flex: 1; min-width: 0; }
.pTitle { .ellipsis-one(); font-weight: 600; }
.pMeta { font-size: 12px; color: var(--tb-sub); margin-top: 4px; }
.pMore { color: var(--tb-sub); flex: none; }
.pItem:hover .pMore { color: var(--tb-primary); }

.m-sm({
  .page { max-width: 100%; }
  .back span { display: none; }
  .back { width: 30px; padding: 0; margin-bottom: 10px; justify-content: center; }
  .prof { padding: 16px 14px; gap: 12px; flex-wrap: wrap; }
  .bigAva { width: 58px; height: 58px; flex: 0 0 58px; border-radius: 18px; font-size: 29px; }
  .pName { font-size: 17px; }
  .sec { padding: 15px 14px 16px; }
  .gThumb { width: 40px; height: 40px; flex: 0 0 40px; border-radius: 11px; font-size: 19px; }
});
</style>
