<template>
  <div class="tb-page">
    <!-- 顶栏：返回 + 标题 + 说明 -->
    <div :class="s.bar">
      <button type="button" :class="s.back" @click="router.push('/me')">
        <el-icon :size="16"><ArrowLeft /></el-icon><span>返回我的</span>
      </button>
      <div>
        <h2 :class="s.h2">我的清单</h2>
        <p :class="s.sub">我发布的闲置与我收藏的内容，都在这里管</p>
      </div>
      <el-button type="primary" @click="router.push('/m/idle/publish')">+ 发布闲置</el-button>
    </div>

    <!-- 两个 tab 用胶囊选择器：发布 / 收藏 -->
    <div :class="s.tabs">
      <button
        v-for="t in TABS"
        :key="t.key"
        type="button"
        :class="[s.chip, { [s.chipOn]: tab === t.key }]"
        @click="switchTab(t.key)"
      >
        <el-icon :size="14"><component :is="t.icon" /></el-icon>
        {{ t.name }}
        <b :class="s.chipNum">{{ t.key === 'publish' ? publish.length : fav.length }}</b>
      </button>
    </div>

    <!-- —— 我的发布 —— -->
    <template v-if="tab === 'publish'">
      <div v-if="publish.length" :class="s.list">
        <div v-for="g in publish" :key="g.id" :class="s.item">
          <div :class="s.thumb">
            <img v-if="g.images && g.images[0]" :src="imgUrl(g.images[0])" :alt="g.title" />
            <span v-else>🗂️</span>
          </div>
          <div :class="s.main">
            <div :class="s.title">{{ g.title }}</div>
            <div :class="s.sub">
              ¥{{ g.price }} · {{ g.cat || '其他' }} · {{ fromNow(g.created_at) }}
            </div>
            <div :class="s.tags">
              <span :class="[s.pill, g.status === 'on' ? s.pillOk : s.pillMute]">
                {{ g.status === 'on' ? '在售' : '已下架' }}
              </span>
              <span v-if="g.cond" :class="[s.pill, s.pillMute]">{{ g.cond }}</span>
              <span v-if="g.place" :class="[s.pill, s.pillMute]">{{ g.place }}</span>
            </div>
          </div>
          <div :class="s.ops">
            <button type="button" :class="s.btnSm" @click="goDetail(g.id)">看详情</button>
            <button type="button" :class="s.btnSm" @click="toggle(g)">
              {{ g.status === 'on' ? '下架' : '重新上架' }}
            </button>
            <!-- 删除是破坏性操作，就地两步确认，不弹确认框 -->
            <button
              v-if="delId !== g.id"
              type="button"
              :class="[s.btnSm, s.danger]"
              @click="delId = g.id"
            >
              删除
            </button>
            <button v-else type="button" :class="[s.btnSm, s.danger, s.delOn]" @click="remove(g)">
              确认删除？
            </button>
          </div>
        </div>
      </div>
      <el-empty v-else description="还没发布过闲置">
        <el-button type="primary" @click="router.push('/m/idle/publish')">去发布</el-button>
      </el-empty>
    </template>

    <!-- —— 我的收藏 —— -->
    <template v-else>
      <div v-if="fav.length" :class="s.list">
        <div v-for="f in fav" :key="(f.kind === 'post' ? 'p' : 'g') + f.id" :class="s.item">
          <div :class="s.thumb">
            <img v-if="f.kind === 'goods' && f.images && f.images[0]" :src="imgUrl(f.images[0])" :alt="f.title" />
            <span v-else>{{ f.kind === 'post' ? '📄' : '🔖' }}</span>
          </div>
          <div :class="s.main">
            <div :class="s.title">{{ f.title }}</div>
            <div :class="s.sub">
              <template v-if="f.kind === 'post'">
                社区 · {{ f.author_name || '同学' }} · {{ f.comments || 0 }} 回复
              </template>
              <template v-else>
                ¥{{ f.price }} · {{ f.cat || '其他' }} · {{ f.owner_name || '同学' }}
              </template>
            </div>
            <div :class="s.tags">
              <span :class="[s.pill, s.pillOk]">{{ f.kind === 'post' ? '社区帖子' : '闲置' }}</span>
              <span :class="[s.pill, s.pillMute]">{{ fromNow(f.created_at) }}收藏</span>
            </div>
          </div>
          <div :class="s.ops">
            <button type="button" :class="s.btnSm" @click="goFav(f)">
              {{ f.kind === 'post' ? '看帖子' : '看闲置' }}
            </button>
            <button type="button" :class="[s.btnSm, s.danger]" @click="unfav(f)">取消收藏</button>
          </div>
        </div>
      </div>
      <el-empty v-else description="收藏夹是空的">
        <el-button type="primary" plain @click="router.push('/community')">去社区逛逛</el-button>
      </el-empty>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, useCssModule } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, Box, Star } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';
import { fromNow } from '@/utils/format';
import shared from '@/styles/ui.module.less';

const s = { ...shared, ...useCssModule() };
const router = useRouter();

const TABS = [
  { key: 'publish', name: '我的发布', icon: 'Box' },
  { key: 'fav', name: '我的收藏', icon: 'Star' }
];

const tab = ref('publish');
const publish = ref([]);
const fav = ref([]);
// 待删除的发布 id：删除改成就地两步确认（再点一次才真删）
const delId = ref(null);

// 图片存的是相对路径 /files/xxx，dev 下走 vite 代理；拼绝对地址前先判断
function imgUrl(p) {
  if (!p) return '';
  return /^https?:|^data:/.test(p) ? p : p;
}

// —— 我的发布：走 /user/me/goods（按 token 查，含已下架）——
async function loadPublish() {
  try {
    publish.value = (await request.get('/user/me/goods')) || [];
  } catch (e) {
    console.error('[ MyList ] 加载我的发布失败：', e);
  }
}

// —— 我的收藏：帖子 + 闲置合并（后端已按 kind 区分）——
async function loadFav() {
  try {
    fav.value = (await request.get('/user/me/favorites')) || [];
  } catch (e) {
    console.error('[ MyList ] 加载我的收藏失败：', e);
  }
}

function switchTab(k) {
  tab.value = k;
}

function goDetail(id) {
  router.push('/m/idle/detail/' + id);
}
function goFav(f) {
  router.push(f.kind === 'post' ? '/post/' + f.id : '/m/idle/detail/' + f.id);
}

// 下架 / 上架：同一颗按钮切换 status
async function toggle(g) {
  const next = g.status === 'on' ? 'off' : 'on';
  try {
    await request.put('/goods/' + g.id, { status: next });
    g.status = next;
    ElMessage.success(next === 'on' ? '已重新上架' : '已下架');
  } catch (e) {
    ElMessage.error(e?.message || '操作失败');
  }
}

async function remove(g) {
  delId.value = null;
  try {
    await request.delete('/goods/' + g.id);
    publish.value = publish.value.filter((x) => x.id !== g.id);
    ElMessage.success('已删除');
  } catch (e) {
    ElMessage.error(e?.message || '删除失败');
  }
}

// 取消收藏：帖子走 /posts/:id/collect，闲置走 /goods/:id/fav，都是切换接口
async function unfav(f) {
  try {
    if (f.kind === 'post') await request.post('/posts/' + f.id + '/collect');
    else await request.post('/goods/' + f.id + '/fav');
    fav.value = fav.value.filter((x) => !(x.kind === f.kind && x.id === f.id));
    ElMessage.success('已取消收藏');
  } catch (e) {
    ElMessage.error(e?.message || '操作失败');
  }
}

onMounted(() => {
  loadPublish();
  loadFav();
});
</script>

<style lang="less" module>@import '@/styles/mixins.less';

.bar { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; flex-wrap: wrap; }
.bar > div { flex: 1; min-width: 160px; }
.h2 { margin: 0; font-size: 21px; font-weight: 800; }
.sub { margin: 5px 0 0; font-size: 12.5px; color: var(--tb-sub); }
.back {
  display: inline-flex; align-items: center; gap: 5px;
  height: 32px; padding: 0 12px;
  border: 1px solid var(--tb-border); border-radius: 10px;
  background: transparent; color: var(--tb-sub);
  font-size: 12.5px; font-weight: 600; cursor: pointer;
  transition: 0.18s;
}
.back:hover { color: var(--tb-primary); border-color: var(--tb-primary); }

.tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
.chipNum {
  margin-left: 2px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(124, 58, 237, 0.12);
  font-size: 11px;
  font-weight: 700;
}

.list { display: flex; flex-direction: column; gap: 12px; }
.item {
  composes: tb-card from global;
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 14px 16px;
}
.thumb {
  width: 62px; height: 62px; flex: 0 0 62px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f3f0ff, #eef6ff);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px;
  overflow: hidden;

  img { width: 100%; height: 100%; object-fit: cover; }
}
.main { flex: 1; min-width: 0; }
.title { font-weight: 700; font-size: 15px; }
.sub { margin-top: 4px; font-size: 12.5px; color: var(--tb-sub); }
.tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.ops { display: flex; flex-direction: column; gap: 8px; flex: 0 0 auto; }
/* 危险操作（删除 / 取消收藏）用红色描边，别和「看详情」这类中性操作混成一排 */
.danger {
  color: var(--tb-danger);
  border-color: rgba(244, 63, 94, 0.35);

  &:hover {
    color: var(--tb-danger);
    border-color: var(--tb-danger);
    background: rgba(244, 63, 94, 0.08);
  }
}
/* 就地两步确认：第二次点击时高亮，避免误删 */
.delOn {
  background: rgba(244, 63, 94, 0.12);
  border-color: var(--tb-danger);
}

@media (max-width: 900px) {
  .bar { gap: 10px; }
  .item { flex-wrap: wrap; padding: 12px; gap: 10px; }
  .main { flex-basis: calc(100% - 72px); }
  /* 手机上操作按钮横排铺满，别竖着堆三行把卡片撑得老高 */
  .ops { flex-direction: row; width: 100%; }
  .ops :global(button), .ops button { flex: 1; }
}
</style>