<template>
  <div class="soon tb-card">
    <el-icon :size="46" class="soon-icon"><Tools /></el-icon>
    <h2>{{ view.title }}</h2>
    <p class="desc">{{ view.desc }}</p>
    <el-tag v-if="view.phase" type="warning" effect="plain">{{ view.phase }} 阶段建设</el-tag>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, default: '' },
  desc: { type: String, default: '' },
  phase: { type: String, default: '' }
});

// 走一层 computed：即使父级没传 props（或传了 undefined），也保证渲染期读不到空值
const view = computed(() => ({
  title: props.title || '建设中',
  desc: props.desc || '该模块尚未接入',
  phase: props.phase || ''
}));
</script>

<style lang="less" scoped>
@import '@/styles/mixins.less';

.soon {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  .flex-center();
  gap: 14px;
  text-align: center;

  h2 {
    margin: 0;
    font-size: 22px;
  }
}
.soon-icon {
  color: var(--tb-primary);
}
.desc {
  margin: 0;
  color: var(--tb-sub);
  max-width: 420px;
}
</style>
