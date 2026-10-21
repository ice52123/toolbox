<template>
  <div class="placeholder">
    <el-result
      icon="info"
      title="该工具骨架已就绪"
      :sub-title="`「${tool?.name || ''}」待实现，照 JSON 模板写组件即可`"
    >
      <template #extra>
        <el-alert type="warning" :closable="false" title="实现指引">
          <p>1. 在 client/src/tools/ 下新建 <b>{{ tool?.todo || 'Xxx' }}.vue</b></p>
          <p>2. 把本占位组件换成你的逻辑（参考 JsonFormat.vue）</p>
          <p>3. 在 config/tools.js 把该工具的 comp 指向新组件、去掉 wip 标记</p>
          <p v-if="tool?.needBackend" style="color: var(--el-color-danger)">
            注意：此工具需要后端（文件处理），后端路由骨架已在 server/routes/upload.js
          </p>
        </el-alert>
      </template>
    </el-result>
  </div>
</template>

<script setup>
defineProps({ tool: Object });
</script>

<style lang="less" scoped>@import '@/styles/mixins.less';
.placeholder { max-width: 640px; }
</style>
