<template>
  <div>
    <!-- 一条工具条就说完事：面包屑 / 搜索 / 筛选 / 发布全在同一行，不再上下摞两排 -->
    <div class="sub-nav">
      <el-button text class="back" :icon="HomeFilled" @click="backToMain">返回主站</el-button>

      <span class="brand">
        <el-icon :size="18"><Shop /></el-icon>
        <b>闲置市场</b>
        <router-link to="/list" class="nav-link">逛一逛</router-link>
      </span>

      <span class="grow" />

      <el-select v-model="cat" placeholder="全部分类" clearable class="sel">
        <el-option v-for="c in cats" :key="c" :label="c" :value="c" />
      </el-select>

      <el-input v-model="kw" placeholder="搜闲置…" clearable class="ip" />

      <el-tag v-if="mine.size" type="primary" effect="light" round class="mine-tag">
        我发布的 {{ mine.size }} 件
      </el-tag>

      <el-button class="cta" type="primary" size="small" @click="$router.push('/publish')">发布闲置</el-button>
    </div>

    <div class="grid">
      <div v-for="g in filtered" :key="g.id" class="card" @click="$router.push('/detail/' + g.id)">
        <div class="thumb">
          <img v-if="g.images && g.images.length" :src="g.images[0]" :alt="g.title" />
          <span v-else class="emoji">{{ g.emoji }}</span>
          <span v-if="g.images && g.images.length > 1" class="cnt">1/{{ g.images.length }}</span>
        </div>
        <div class="title">{{ g.title }}</div>
        <div class="price">¥{{ g.price }}</div>
        <div class="meta">{{ g.cat }} · {{ g.cond || '成色—' }} · {{ g.place }}</div>
        <div class="owner">
          {{ g.owner }}
          <el-tag v-if="g.mine" size="small" type="success" effect="plain">我发布的</el-tag>
        </div>
      </div>
    </div>

    <el-empty v-if="!filtered.length" description="暂无匹配的闲置，去发布一件？">
      <el-button type="primary" plain @click="$router.push('/publish')">发布闲置</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Shop, HomeFilled } from '@element-plus/icons-vue';
import { loadGoods, cats } from '@/store';

const kw = ref('');
const cat = ref('');
const goods = ref([]);

onMounted(() => {
  goods.value = loadGoods();
});

const mine = computed(() => new Set(goods.value.filter((g) => g.mine).map((g) => g.id)));

const filtered = computed(() =>
  goods.value.filter((g) => {
    const okCat = !cat.value || g.cat === cat.value;
    const kwOk = !kw.value || g.title.includes(kw.value) || g.desc.includes(kw.value);
    return okCat && kwOk;
  })
);

function backToMain() {
  window.location.href = import.meta.env.VITE_MAIN_APP_URL || 'http://localhost:5173';
}
</script>

<style scoped>
.sub-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 2px 14px;
  font-size: 15px;
}
.sub-nav .back { color: #6b6480; padding-left: 0; padding-right: 4px; }
.sub-nav .back:hover { color: var(--el-color-primary); }
.sub-nav .brand { display: inline-flex; align-items: center; gap: 7px; white-space: nowrap; }
.sub-nav .nav-link {
  color: #6b6480; text-decoration: none; font-size: 13px;
  padding: 2px 9px; border-radius: 999px; background: rgba(124, 58, 237, 0.08);
}
.sub-nav .nav-link:hover { color: var(--el-color-primary); }
.sub-nav .nav-link.router-link-active {
  color: #fff; background: var(--el-color-primary); font-weight: 600;
}
.sub-nav .grow { flex: 1; }
.sub-nav .cta { flex: 0 0 auto; }
.sub-nav .mine-tag { flex: 0 0 auto; }

/* 搜索做成胶囊，和主站头部一套观感 */
.sub-nav .ip :deep(.el-input__wrapper) {
  border-radius: 999px;
  box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.14);
  transition: 0.25s;
}
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
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(124, 58, 237, 0.14);
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
.thumb {
  position: relative;
  width: 100%;
  height: 170px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #f3f0ff, #eef6ff);
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
.title { font-weight: 600; margin-bottom: 6px; }
.price { color: #7c3aed; font-weight: 800; font-size: 18px; }
.meta { font-size: 12px; color: #6b6480; margin-top: 4px; }
.owner { font-size: 12px; color: #6b6480; margin-top: 6px; display: flex; align-items: center; gap: 6px; }

@media (max-width: 900px) {
  /* 一行挤不下就分两排：第一排标题 + 发布，第二排搜索 + 分类 */
  .sub-nav {
    flex-wrap: wrap;
    gap: 8px;
    padding-bottom: 12px;
  }
  .sub-nav .grow { display: none; }
  .sub-nav .brand { order: 1; flex: 1; }
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
