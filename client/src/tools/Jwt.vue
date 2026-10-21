<template>
  <div class="jwt-tool">
    <el-card shadow="never">
      <template #header>JWT 解析</template>
      <el-input
        v-model="token"
        type="textarea"
        :rows="3"
        placeholder="粘贴 JWT，形如 eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiemhhbmdzYW4ifQ.xxxx"
      />
      <div class="row">
        <el-button type="primary" :disabled="!token.trim()" @click="parse">解析</el-button>
        <el-button text @click="clear">清空</el-button>
        <span v-if="expInfo" class="exp" :class="expInfo.dead ? 'dead' : ''">{{ expInfo.text }}</span>
      </div>

      <el-alert v-if="err" type="error" :closable="false" :title="err" show-icon />

      <div v-if="header" class="grid">
        <div class="blk">
          <div class="lab">Header</div>
          <pre>{{ json(header) }}</pre>
        </div>
        <div class="blk">
          <div class="lab">Payload</div>
          <pre>{{ json(payload) }}</pre>
        </div>
      </div>

      <div v-if="sig" class="sig">
        <div class="lab">Signature（{{ sig.length }} 字符）</div>
        <code>{{ sig }}</code>
      </div>
      <div class="tip">
        前端只能解析与目视核对，<b>验签必须服务端做</b>（比对密钥算出的签名），
        本地拿不到密钥也算不了 HMAC。
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

defineProps({ tool: Object });
const token = ref('');
const err = ref('');
const header = ref(null);
const payload = ref(null);
const sig = ref('');

// base64url 解码：把 - _ 换回 + /，再补 '=' 到 4 的倍数
function b64url(str) {
  const b = str.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(
    escape(atob(b + '==='.slice((b.length + 3) % 4)))
  );
}

const expInfo = computed(() => {
  const exp = payload.value?.exp;
  if (!exp) return null;
  const diff = exp * 1000 - Date.now();
  const d = new Date(exp * 1000);
  if (diff <= 0) return { dead: true, text: '已于 ' + d.toLocaleString('zh-CN') + ' 过期' };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  return { dead: false, text: '过期时间 ' + d.toLocaleString('zh-CN') + '（剩余 ' + (days ? days + ' 天 ' : '') + hours + ' 小时）' };
});

function parse() {
  err.value = '';
  header.value = null;
  payload.value = null;
  sig.value = '';
  const parts = token.value.trim().split('.');
  if (parts.length !== 3) { err.value = 'JWT 必须是由两个点分隔的三段'; return; }
  try {
    header.value = JSON.parse(b64url(parts[0]));
    payload.value = JSON.parse(b64url(parts[1]));
    sig.value = parts[2];
  } catch (e) {
    err.value = '解析失败：' + e.message;
  }
}

function clear() { token.value = ''; parse(); }
function json(o) { return JSON.stringify(o, null, 2); }
</script>

<style lang="less" scoped>@import '@/styles/mixins.less';
.jwt-tool { max-width: 720px; }
.row { margin: 12px 0; display: flex; align-items: center; gap: 10px; }
.row :deep(.el-input) { flex: 1; min-width: 0; }
.exp { margin-left: auto; font-size: 13px; color: var(--tb-ok); }
.exp.dead { color: var(--el-color-danger); }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 760px) { .grid { grid-template-columns: 1fr; } }
.blk {
  border: 1px solid var(--tb-line, #e2e8f0);
  border-radius: 6px;
  overflow: hidden;
}
.lab {
  padding: 7px 12px;
  font-size: 12.5px;
  color: var(--tb-sub, #64748b);
  background: rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid var(--tb-line, #e2e8f0);
}
pre {
  margin: 0;
  padding: 10px 12px;
  max-height: 260px;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12.5px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
.sig { margin-top: 12px; }
.sig code {
  display: block;
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--tb-ok-soft, #f0fdf4);
  font-family: ui-monospace, Menlo, monospace;
  font-size: 12.5px;
  word-break: break-all;
}
.tip { margin-top: 14px; font-size: 12.5px; line-height: 1.7; color: var(--tb-sub); }
</style>
