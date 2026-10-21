<template>
  <el-card shadow="never" v-loading="loading">
    <el-button text :icon="ArrowLeft" @click="$router.push('/list')">返回列表</el-button>

      <el-result
        v-if="err"
        icon="warning"
        title="这件闲置没拉到"
        :sub-title="err"
      >
        <template #extra>
          <el-button type="primary" @click="$router.push('/list')">回列表</el-button>
        </template>
      </el-result>

      <div v-else-if="g" class="d">
        <div class="gallery">
          <el-image
            v-for="(img, i) in g.images"
            :key="i"
            :src="img"
            :preview-src-list="g.images"
            :initial-index="i"
            fit="cover"
            class="shot"
          />
          <div v-if="!g.images.length" class="shot placeholder">{{ emojiOf(g.cat) }}</div>
        </div>

        <h2>{{ g.title }}</h2>
        <div class="price">¥{{ g.price }}</div>
        <div class="chips">
          <el-tag type="primary" effect="light">{{ g.cat }}</el-tag>
          <el-tag v-if="g.cond" effect="light">{{ g.cond }}</el-tag>
          <el-tag v-for="w in g.ways" :key="w" effect="plain">{{ w }}</el-tag>
          <el-tag v-if="g.mine" type="success" effect="dark">我发布的</el-tag>
          <el-tag v-if="sold && !myOrderId" type="danger" effect="dark">已售出</el-tag>
          <el-tag v-else-if="myOrderId" type="warning" effect="dark">我已下单</el-tag>
        </div>
        <div class="meta">
          {{ g.place || '自提点待定' }} · 发布人 {{ g.owner }}
          <span v-if="g.createdAt"> · {{ timeAgo(g.createdAt) }}</span>
        </div>

        <el-divider content-position="left">商品描述</el-divider>
        <p class="desc">{{ g.desc || '这个家伙很懒，什么都没写～' }}</p>

        <div class="actions">
          <el-button
            v-if="myOrderId"
            type="warning"
            size="large"
            @click="$router.push('/order/detail/' + myOrderId)"
          >查看我的订单</el-button>
          <el-button
            v-else
            type="success"
            size="large"
            :loading="ordering"
            :disabled="sold"
            @click="goOrder"
          >{{ sold ? '已售出' : '下单' }}</el-button>
          <el-button type="primary" size="large" :loading="chatting" @click="chat">聊聊</el-button>
          <el-button size="large" :type="g.faved ? 'warning' : 'default'" :loading="faving" @click="toggleFav">
            {{ g.faved ? '已收藏' : '收藏' }}
          </el-button>
        </div>
      </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useRouter } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { emojiOf, timeAgo } from '@/store';
import { api, mapGoods, isLogin, goMain, soldGoodsIds, myOrderOf } from '@/api';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const err = ref('');
const g = ref(null);
const faving = ref(false);
const chatting = ref(false);
const ordering = ref(false);
// 已被下单锁定：这件闲置不能再下（真实系统由后端在商品上返回 sold）
const sold = ref(false);
// 如果是我自己对该商品下的未终态订单，详情页给「查看我的订单」入口
const myOrderId = ref('');

// 下单：未登录 / 自己的闲置 / 已被买走 都不给下，否则跳下单页（Order.vue）
function goOrder() {
  if (!isLogin()) return ElMessage.warning('登录后才能下单');
  if (g.value.mine) return ElMessage.info('这是你自己发布的闲置，不用和自己下单～');
  if (sold.value) return ElMessage.warning('这件闲置已经被买走了');
  router.push('/order/' + g.value.id);
}

async function load() {
  loading.value = true;
  err.value = '';
  try {
    g.value = mapGoods(await api.get('/goods/' + route.params.id));
    // 本地订单里只要有人下过单（含未付款），这件就置为已锁定
    sold.value = soldGoodsIds().includes(g.value.id);
    // 若是我自己下的单，给「查看我的订单」而非「已售出」
    myOrderId.value = myOrderOf(g.value.id);
  } catch (e) {
    err.value = e.message || '加载失败';
    g.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(load);

// 聊聊：拿卖家 6 位 code 开私聊会话（没有就建），然后跳主站的聊天界面
async function chat() {
  if (!isLogin()) return ElMessage.warning('登录后才能和卖家聊聊');
  if (g.value.mine) return ElMessage.info('这是你自己发布的闲置，不用和自己聊～');
  chatting.value = true;
  try {
    const data = await api.post('/chats/with/' + g.value.ownerCode);
    // SPA 切到主站的聊天页（qiankun 内嵌走主站 router.push）。
    // 以前 location.href 整页刷新：跳转瞬间主站重载一遍，白屏后才进聊天
    goMain('/chat/' + data.convId);
  } catch (e) {
    ElMessage.error(e.message || '打开会话失败');
  } finally {
    chatting.value = false;
  }
}

// 收藏：后端做「有则删、无则插」的切换，返回 faved 就是切换后的状态
async function toggleFav() {
  if (!isLogin()) return ElMessage.warning('登录后才能收藏');
  faving.value = true;
  try {
    const data = await api.post('/goods/' + g.value.id + '/fav');
    g.value.faved = data.faved; // 按钮文案/颜色跟着状态走
    ElMessage.success(data.faved ? '已加入收藏' : '已取消收藏');
  } catch (e) {
    ElMessage.error(e.message || '收藏失败');
  } finally {
    faving.value = false;
  }
}
</script>

<style scoped>
.d { padding: 10px 0; text-align: center; }
.gallery {
  display: flex;
  gap: 10px;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 16px;
  /* 图片居中：不能用 justify-content: center —— 多图溢出时它会把最左边那张
     推到滚动区外，往回滚不回来。改成给首尾两张各加一个 auto 外边距：
     不溢出时两侧平分空白 = 居中；溢出时 auto 边距塌成 0，横向滚动照常 */
}
.gallery > .shot:first-child { margin-left: auto; }
.gallery > .shot:last-child { margin-right: auto; }
.shot {
  width: 220px;
  height: 220px;
  flex: none;
  border-radius: 14px;
  border: 1px solid rgba(124, 58, 237, 0.18);
}
.shot.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 90px;
  background: var(--im-surface-2);
  border: 1px solid var(--im-line-2);
}
h2 { font-size: 20px; margin: 4px 0 8px; color: var(--im-fg); }
.price { color: var(--im-brand); font-weight: 800; font-size: 26px; }
.chips { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 10px; }
.meta { color: var(--im-fg-soft); margin-top: 10px; font-size: 13px; }
.desc {
  text-align: left;
  line-height: 1.7;
  color: var(--im-fg-soft);
  background: var(--im-tint);
  border-radius: 12px;
  padding: 14px 16px;
}
.actions { display: flex; gap: 12px; justify-content: center; margin-top: 18px; }

@media (max-width: 900px) {
  .shot, .shot.placeholder { width: 170px; height: 170px; border-radius: 12px; }
  .shot.placeholder { font-size: 66px; }
  h2 { font-size: 17px; }
  .price { font-size: 22px; }
  .desc { padding: 12px 13px; font-size: 13px; }
  .actions { gap: 10px; }
  .actions .el-button { flex: 1; }
}
</style>
