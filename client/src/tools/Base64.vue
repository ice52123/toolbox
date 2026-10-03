<template>
  <div class="b64">
    <el-input v-model="input" type="textarea" :rows="6" placeholder="输入文本" />
    <div class="ops">
      <el-button type="primary" @click="encode">编码 →</el-button>
      <el-button @click="decode">← 解码</el-button>
    </div>
    <el-input v-model="output" type="textarea" :rows="6" readonly />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

defineProps({ tool: Object });
const input = ref('');
const output = ref('');

// UTF-8 安全的 Base64（中文不会乱码）
function encode() {
  output.value = btoa(unescape(encodeURIComponent(input.value)));
}
function decode() {
  try {
    output.value = decodeURIComponent(escape(atob(input.value)));
  } catch (e) {
    ElMessage.error('解码失败，不是合法 Base64');
  }
}
</script>

<style lang="less" scoped>@import '@/styles/mixins.less';
.ops { margin: 10px 0; }
</style>
