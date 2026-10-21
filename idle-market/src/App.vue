<template>
  <div class="im">
    <!-- 独立运行时才显示自己的顶栏；内嵌（qiankun）时主站顶部已有导航 + 搜索，
         再摞一条就是用户说的「布局乱」，所以这一条整个收掉，只留列表页里那条工具条 -->
    <header v-if="!embedded" class="im-bar">
      <div class="im-brand">🛍️ 闲置市场</div>
      <nav class="im-nav">
        <router-link to="/list">逛一逛</router-link>
        <router-link to="/publish">发布闲置</router-link>
        <router-link to="/orders">我的订单</router-link>
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
/* inline-size 容器查询的基准：子应用被 qiankun 塞进窄容器时，
   媒体查询按窗口算会失灵，这里让组件按自身宽度判断点 */
.im { min-height: 100vh; container-type: inline-size; }
.im-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: var(--im-bar-bg);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--im-line);
  position: sticky;
  top: 0;
  z-index: 10;
}
.im-brand { font-weight: 800; font-size: 18px; color: var(--im-fg); }
.im-nav { display: flex; gap: 14px; margin-left: 8px; }
.im-nav a { color: var(--im-fg-soft); text-decoration: none; }
.im-nav a.router-link-active { color: var(--im-brand); font-weight: 600; }
.im-main { padding: 20px; }
</style>
