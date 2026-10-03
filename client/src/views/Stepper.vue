<template>
  <div class="stepper">
    <div v-for="it in items" :key="it.idx" class="seg">
      <span class="line" :class="it.line" />
      <div class="st" :class="it.state">
        <i>{{ it.state === 'done' ? '✓' : it.idx }}</i>
        <b>{{ it.label }}</b>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// 扁平数组先算好状态再渲染：v-for 里套 v-if 是这套项目最难缠的编译坑，一律避开
const props = defineProps({
  steps: { type: Array, required: true },
  cur: { type: Number, default: 1 }
});

const items = computed(() =>
  props.steps.map((label, i) => {
    const idx = i + 1;
    const state = idx < props.cur ? 'done' : idx === props.cur ? 'cur' : 'todo';
    // 第一条前面、最后一条后面不该有线
    const line = idx === 1 ? 'hide' : state === 'done' ? 'fill' : 'empty';
    return { idx, label, state, line };
  })
);
</script>

<style lang="less" scoped>
@import '@/styles/mixins.less';

.stepper {
  .flex-center();
  margin-bottom: 20px;
}
.seg {
  .flex-center();
  flex: 1;
  min-width: 0;
}
.line {
  flex: 1;
  height: 2px;
  border-radius: 2px;
  background: rgba(124, 58, 237, 0.15);

  &.fill {
    background: var(--tb-primary);
  }
  &.hide {
    visibility: hidden;
    background: transparent;
  }
}

.st {
  display: flex;
  flex-direction: column;
  .flex-center();
  gap: 5px;
  flex: 0 0 auto;

  i {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    .flex-center();
    font-size: 12px;
    font-weight: 700;
    font-style: normal;
    background: rgba(124, 58, 237, 0.12);
    color: var(--tb-sub);
    border: 1px solid transparent;
    transition: 0.25s;
  }
  b {
    font-size: 11px;
    font-weight: 600;
    color: var(--tb-sub);
    white-space: nowrap;
  }

  &.done i {
    background: var(--tb-primary);
    color: @c-white;
  }
  &.cur {
    i {
      .grad-brand();
      color: @c-white;
      box-shadow: 0 0 0 4px var(--tb-primary-soft, rgba(124, 58, 237, 0.14));
      transform: scale(1.06);
    }
    b {
      color: var(--tb-text);
    }
  }
}
</style>
