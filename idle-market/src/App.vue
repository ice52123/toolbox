<template>
  <div class="im">
    <!-- 独立运行时才显示自己的顶栏；内嵌（qiankun）时主站顶部已有导航 + 搜索，
         再摞一条就是用户说的「布局乱」，所以这一条整个收掉，只留列表页里那条工具条 -->
    <header v-if="!embedded" class="im-bar">
      <div class="im-brand">🛍️ 闲置市场</div>
      <nav class="im-nav">
        <router-link to="/list">逛一逛</router-link>
        <router-link to="/publish">发布闲置</router-link>
      </nav>
      <el-button size="small" @click="back">返回工具箱</el-button>
    </header>
    <main class="im-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { qiankunWindow } from 'vite-plugin-qiankun/es/helper';

const embedded = qiankunWindow.__POWERED_BY_QIANKUN__;

// 返回主站（独立运行时才显示按钮；跳主站 toolbox 首页而非自身）
function back() {
  window.location.href = import.meta.env.VITE_MAIN_APP_URL || 'http://localhost:5173';
}
</script>

<style scoped>
.im { min-height: 100vh; }
.im-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(124, 58, 237, 0.14);
  position: sticky;
  top: 0;
  z-index: 10;
}
.im-brand { font-weight: 800; font-size: 18px; }
.im-nav { display: flex; gap: 14px; margin-left: 8px; }
.im-nav a { color: #6b6480; text-decoration: none; }
.im-nav a.router-link-active { color: #7c3aed; font-weight: 600; }
.im-main { padding: 20px; }
</style>
