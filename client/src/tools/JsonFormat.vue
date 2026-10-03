<template>
  <div class="json-tool">
    <el-input
      v-model="input"
      type="textarea"
      :rows="10"
      placeholder="粘贴 JSON 到这里…"
    />
    <div class="ops">
      <el-button type="primary" @click="format">格式化</el-button>
      <el-button @click="minify">压缩</el-button>
      <el-button @click="validate">校验</el-button>
      <el-button text @click="clear">清空</el-button>
      <span class="msg" :class="msgType">{{ msg }}</span>
    </div>
    <el-input v-model="output" type="textarea" :rows="10" readonly />
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({ tool: Object });
const input = ref('');
const output = ref('');
const msg = ref('');
const msgType = ref('');

function format() {
  try {
    output.value = JSON.stringify(JSON.parse(input.value), null, 2);
    msg.value = '格式化成功'; msgType.value = 'ok';
  } catch (e) {
    msg.value = '解析失败：' + e.message; msgType.value = 'err';
  }
}
function minify() {
  try {
    output.value = JSON.stringify(JSON.parse(input.value));
    msg.value = '压缩成功'; msgType.value = 'ok';
  } catch (e) {
    msg.value = '解析失败：' + e.message; msgType.value = 'err';
  }
}
function validate() {
  try {
    JSON.parse(input.value);
    msg.value = 'JSON 合法 ✓'; msgType.value = 'ok';
  } catch (e) {
    msg.value = '不合法：' + e.message; msgType.value = 'err';
  }
}
function clear() {
  input.value = ''; output.value = ''; msg.value = '';
}
</script>

<style lang="less" scoped>@import '@/styles/mixins.less';
.ops { margin: 12px 0; display: flex; align-items: center; gap: 10px; }
.msg.ok { color: #16a34a; }
.msg.err { color: #dc2626; }
</style>
