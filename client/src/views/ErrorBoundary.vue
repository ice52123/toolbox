<template>
  <!-- 错误边界：任一层级组件在 render / setup 抛错时，只降级这一块，不再整树卸载（避免白屏） -->
  <div v-if="error" class="err-box tb-card">
    <el-icon :size="40" class="e-ico"><WarningFilled /></el-icon>
    <h3>这个页面出错了</h3>
    <p class="e-msg">{{ error.message || '未知渲染错误' }}</p>
    <div class="e-ops">
      <el-button type="primary" @click="retry">重试</el-button>
      <el-button @click="goHome">回首页</el-button>
    </div>
  </div>
  <slot v-else />
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue';
import { useRouter } from 'vue-router';
import { WarningFilled } from '@element-plus/icons-vue';

const error = ref(null);
const router = useRouter();

// 返回 false = 拦截住，不再往上抛（Vue 默认会继续抛到根，导致整站被卸载成白屏）
onErrorCaptured((err) => {
  error.value = err instanceof Error ? err : new Error(String(err));
  return false;
});

function retry() {
  error.value = null;
}

function goHome() {
  error.value = null;
  router.push('/');
}
</script>

<style lang="less" scoped>
@import '@/styles/mixins.less';

.err-box {
  max-width: 560px;
  margin: 40px auto;
  padding: 40px 24px;
  text-align: center;

  h3 {
    margin: 14px 0 8px;
    font-size: 18px;
  }
}
.e-ico {
  color: var(--tb-warn);
}
.e-msg {
  margin: 0 auto 20px;
  color: var(--tb-sub);
  font-size: 13px;
  line-height: 1.7;
  word-break: break-all;
  max-width: 420px;
}
.e-ops {
  .flex-center();
  gap: 12px;
}
</style>
