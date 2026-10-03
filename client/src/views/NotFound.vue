<template>
  <div class="nf tb-card">
    <div class="nf-code">404</div>
    <h2>这个页面走丢了</h2>
    <p>地址可能输错了，或者模块还没建好</p>
    <div class="nf-ops">
      <el-button type="primary" @click="$router.push('/')">回首页</el-button>
      <el-button @click="$router.back()">返回上一页</el-button>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import '@/styles/mixins.less';

.nf {
  max-width: 460px;
  margin: 60px auto;
  padding: 48px 24px;
  text-align: center;

  h2 {
    margin: 14px 0 6px;
    font-size: 20px;
  }
  p {
    margin: 0 0 22px;
    color: var(--tb-sub);
  }
}
.nf-code {
  font-size: 56px;
  font-weight: 800;
  background: var(--tb-primary);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  line-height: 1;
}
.nf-ops {
  .flex-center();
  gap: 12px;
}
</style>
