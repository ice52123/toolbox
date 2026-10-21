<template>
  <div :class="s.page">
    <button type="button" :class="s.back" @click="router.push('/message')">
      <el-icon :size="16"><ArrowLeft /></el-icon><span>返回消息中心</span>
    </button>

    <template v-if="user">
      <!-- 资料卡 -->
      <div :class="s.prof">
        <div :class="s.bigAva">
          <img v-if="avatarUrl && avatarOk" :src="avatarUrl" :class="s.bigAvaImg" :alt="name" @error="avatarOk = false" />
          <span v-else>{{ user.avatar || '🙂' }}</span>
        </div>
        <div :class="s.pMain">
          <div :class="s.pTop">
            <b :class="s.pName">{{ name }}</b>
            <el-tag size="small" effect="plain" :type="isOfficial ? 'warning' : 'primary'">
              {{ isOfficial ? '官方助手' : '在校同学' }}
            </el-tag>
          </div>
          <div v-if="user.dept" :class="s.pDept">{{ user.dept }}</div>
          <p v-if="user.intro" :class="s.pIntro">{{ user.intro }}</p>
          <div :class="s.pStats">
            <span><b>{{ goods.length }}</b> 在售闲置</span>
            <span><b>{{ posts.length }}</b> 条帖子</span>
            <span><b>{{ followers }}</b> 关注者</span>
          </div>
        </div>
        <!-- 自己的主页不放关注/聊聊；非官方账号才显示操作区 -->
        <div v-if="!isOfficial && !isMe" :class="s.actions">
          <el-button :type="following ? 'default' : 'primary'" plain @click="toggleFollow">
            {{ following ? '已关注' : '关注' }}
          </el-button>
          <el-button type="primary" :loading="chatting" @click="goChat">聊聊</el-button>
        </div>
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
                <el-tag size="small" effect="plain" type="primary">{{ boardName(p.board) }}</el-tag>
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
import { ref, computed, watch, onMounted, useCssModule } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';
import { useUserStore } from '@/stores/user';
import { fromNow } from '@/utils/format';
import { boardName } from '@/config/boards';
// 共享原子类（CSS Modules）：s.card / s.row … 各页长得一样的外观都在这份里
import shared from '@/styles/ui.module.less';

// 一个句柄拿两类样式：ui.module.css 的共享原子类 + 本组件 @import '@/styles/mixins.less';
const s = { ...shared, ...useCssModule() };

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
// 路由参数会被 vue-router 自动解码，/user/王同学 进来拿到的就是「王同学」
const name = computed(() => route.params.name || '');
// 资料 / 在售闲置 / 帖子全部来自后端 /:nickname/profile（+ /goods?owner=）
const user = ref(null);
const goods = ref([]);
const posts = ref([]);
const following = ref(false);
const chatting = ref(false);
const avatarOk = ref(true);
// 本人视角：看自己主页时不显示「关注/聊聊」
const isMe = computed(() => !!user.value && String(user.value.id) === String(userStore.id));
// 头像是可访问的 URL（/files/xxx 或 http）才用 <img>，否则当 emoji 文本
const avatarUrl = computed(() => {
  const a = user.value?.avatar || '';
  return /^https?:\/\//.test(a) || a.startsWith('/files') ? a : '';
});
// 后端档案目前没有 dept / intro 字段，默认非官方（「官方助手」需后端补资料）
const isOfficial = computed(() => false);
const followers = computed(() => 12 + posts.value.length * 3 + goods.value.length);

async function load() {
  avatarOk.value = true;
  try {
    // 注意别漏了 /users 前缀：后端把 profile 挂在 /api/users 下，request 的 baseURL 只到 /api
    const data = await request.get('/users/' + encodeURIComponent(name.value) + '/profile');
    user.value = {
      id: data.user.id,
      username: data.user.username,
      nickname: data.user.nickname,
      avatar: data.user.avatar,
      code: data.user.code || '',
      dept: '',
      intro: ''
    };
    // 帖子已在 profile 接口返回，直接映射字段（board_key → board，created_at → time）
    posts.value = (data.posts || []).map((p) => ({
      id: p.id,
      title: p.title,
      board: p.board_key,
      time: fromNow(p.created_at),
      comments: p.comments,
      likes: p.likes
    }));
    // 在售闲置：profile 不含 goods，单独按 owner 拉（仅 status='on'）
    const g = await request.get('/goods', { params: { owner: data.user.id, pageSize: 50 } });
    goods.value = (g.list || []).map((x) => ({
      id: x.id,
      title: x.title,
      cat: x.cat,
      place: x.owner_name,
      price: x.price
    }));
  } catch (e) {
    user.value = null;
    console.error('[ UserProfile ] 加载失败：', e);
  }
}

function toggleFollow() {
  following.value = !following.value;
  ElMessage.success(following.value ? `已关注 ${name.value}` : `已取消关注 ${name.value}`);
}

// 和 TA 开聊：拿 profile 返回的 6 位 code 换会话 id，再进聊天页
async function goChat() {
  if (!userStore.isLogin) {
    ElMessage.warning('先登录再和别人聊聊吧');
    return;
  }
  if (!user.value?.code) {
    ElMessage.error('暂时联系不上 TA（缺少同学码）');
    return;
  }
  chatting.value = true;
  try {
    const data = await request.post('/chats/with/' + user.value.code);
    router.push('/chat/' + data.convId);
  } catch (e) {
    ElMessage.error(e.message || '打开会话失败');
  } finally {
    chatting.value = false;
  }
}

onMounted(load);
// 同路由不同昵称（/user/A → /user/B）时重载
watch(name, load);
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
  display: flex; align-items: center; justify-content: center; overflow: hidden;
  background: linear-gradient(135deg, #ede9fe, #e0f2fe);
  box-shadow: 0 10px 24px rgba(124, 58, 237, 0.18);
}
.bigAvaImg { width: 100%; height: 100%; object-fit: cover; }
.pMain { flex: 1; min-width: 0; }
.pTop { display: flex; align-items: center; gap: 9px; }
.pName { font-size: 20px; }
.pDept { font-size: 13px; color: var(--tb-sub); margin-top: 5px; }
.pIntro { margin: 9px 0 0; font-size: 13.8px; line-height: 1.75; color: var(--tb-sub); }
.pStats { display: flex; gap: 18px; margin-top: 12px; font-size: 12.5px; color: var(--tb-sub); }
.pStats b { color: var(--tb-text); font-size: 14px; }
.actions { flex: none; display: flex; gap: 10px; }

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
