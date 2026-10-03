<template>
  <el-card shadow="never" v-loading="loading">
    <el-button text :icon="ArrowLeft" @click="$router.push('/list')">返回列表</el-button>

    <div v-if="g" class="d">
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
        <div v-if="!g.images || !g.images.length" class="shot placeholder">{{ g.emoji }}</div>
      </div>

      <h2>{{ g.title }}</h2>
      <div class="price">¥{{ g.price }}</div>
      <div class="chips">
        <el-tag type="primary" effect="light">{{ g.cat }}</el-tag>
        <el-tag v-if="g.cond" effect="light">{{ g.cond }}</el-tag>
        <el-tag v-for="w in g.ways || []" :key="w" effect="plain">{{ w }}</el-tag>
        <el-tag v-if="g.mine" type="success" effect="dark">我发布的</el-tag>
      </div>
      <div class="meta">{{ g.place }} · 发布人 {{ g.owner }}</div>

      <el-divider content-position="left">商品描述</el-divider>
      <p class="desc">{{ g.desc || '这个家伙很懒，什么都没写～' }}</p>

      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="详情页待完善"
        description="私信沟通、收藏、下单等功能待实现（P4 交易闭环）。"
        style="margin-top: 16px"
      />

      <div class="actions">
        <el-button type="primary" size="large">聊聊</el-button>
        <el-button size="large">收藏</el-button>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';
import { getGoodsById } from '@/store';

const route = useRoute();
const loading = ref(true);
const g = ref(null);

onMounted(() => {
  g.value = getGoodsById(route.params.id) || null;
  loading.value = false;
});
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
}
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
  background: linear-gradient(135deg, #f3f0ff, #eef6ff);
}
h2 { font-size: 20px; margin: 4px 0 8px; }
.price { color: #7c3aed; font-weight: 800; font-size: 26px; }
.chips { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 10px; }
.meta { color: #6b6480; margin-top: 10px; font-size: 13px; }
.desc {
  text-align: left;
  line-height: 1.7;
  color: #4b4560;
  background: rgba(124, 58, 237, 0.05);
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
