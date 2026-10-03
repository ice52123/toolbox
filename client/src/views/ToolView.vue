<template>
  <div class="tool-page tb-card">
    <div class="head">
      <el-button text class="back" @click="$router.push('/tools')">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <div class="ht">
        <h2>{{ tool?.name || '工具' }}</h2>
        <p class="sub">{{ tool?.desc || '' }}</p>
      </div>
      <el-tag v-if="tool?.wip" type="warning" effect="plain" size="small">待实现</el-tag>
      <el-tag v-if="tool?.cat" type="info" effect="plain" size="small">
        {{ catName }}
      </el-tag>
    </div>

    <!-- 工具内容统一限宽居中，避免宽屏下元素被拉成一条、视觉上"错位" -->
    <div class="tool-body">
      <el-skeleton v-if="!comp" :rows="6" animated />
      <component :is="comp" v-else :tool="tool" />
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { getTool } from '@/config/tools';
import { categories } from '@/config/tools';
import { ArrowLeft } from '@element-plus/icons-vue';

const route = useRoute();
const tool = ref(getTool(route.params.id));
const comp = shallowRef(null);

const catName = computed(() => {
  const c = categories.find((x) => x.key === tool.value?.cat);
  return c ? c.name : '';
});

watch(
  () => route.params.id,
  async (id) => {
    tool.value = getTool(id);
    comp.value = null;
    if (tool.value && tool.value.comp) {
      const m = await tool.value.comp();
      comp.value = m.default;
    }
  },
  { immediate: true }
);
</script>

<style lang="less" scoped>
@import '@/styles/mixins.less';

.tool-page {
  padding: 22px 26px 30px;
  min-height: 60vh;
  width: 100%;
  max-width: var(--tb-max-w, 1240px);
  margin: 0 auto;

  .m-sm({
    padding: 14px 12px 20px;
  });
}

.head {
  .flex-center();
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(124, 58, 237, 0.14);

  h2 {
    margin: 0;
    font-size: 22px;
    font-weight: 800;
  }
  .sub {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--tb-sub);
  }

  .m-sm({
    gap: 8px;
    margin-bottom: 14px;
    padding-bottom: 12px;

    h2 {
      font-size: 18px;
    }
    .sub {
      font-size: 12px;
    }
  });
  /* 超窄屏：状态/分类标签挤走标题，先让位 */
  .m-phone({
    .el-tag:last-child {
      display: none;
    }
  });
}
.back {
  padding-left: 0;
  font-size: 14px;
}
.ht {
  flex: 1;
  min-width: 180px;
}

/* 内容区限宽居中：表单类工具本身再各自限宽，两层都稳 */
.tool-body {
  max-width: 860px;
  margin: 0 auto;

  .m-sm({
    max-width: 100%;
  });
}
</style>
