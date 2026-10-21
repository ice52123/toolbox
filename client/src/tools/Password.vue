<template>
  <div class="pwd-tool">
    <el-card shadow="never">
      <template #header>随机强密码生成</template>
      <div class="out" :style="{ background: ent ? '#16a34a' : '#dc2626' }"></div>
      <code class="val">{{ pwd || '—' }}</code>

      <div class="row">
        <el-input v-model="pwd" readonly />
        <el-button :icon="DocumentCopy" @click="copy">复制</el-button>
      </div>

      <div class="row">
        <span class="lab">长度</span>
        <el-input-number v-model="len" :min="6" :max="64" size="default" />
        <span class="strength" :class="level">{{ levelText }} · {{ bits }} bit</span>
      </div>

      <div class="checks">
        <el-checkbox v-model="opt.lower" label="小写 a-z" />
        <el-checkbox v-model="opt.upper" label="大写 A-Z" />
        <el-checkbox v-model="opt.digit" label="数字 0-9" />
        <el-checkbox v-model="opt.symbol" label="符号 !@#$" />
        <el-checkbox v-model="opt.noAmbiguous" label="排除 0O1lI" />
      </div>

      <div class="row">
        <el-button type="primary" @click="gen">生成</el-button>
        <el-button text @click="copy">复制</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { DocumentCopy } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

defineProps({ tool: Object });
const pwd = ref('');
const len = ref(16);
const opt = ref({ lower: true, upper: true, digit: true, symbol: true, noAmbiguous: false });

const POOL = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digit: '0123456789',
  symbol: '!@#$%^&*()-_=+[]{}<>,.?/'
};

// crypto.getRandomValues 是密码学安全的，Math.random 不能用来生成密码
function gen() {
  const use = Object.keys(POOL).filter((k) => opt.value[k] && !opt.value.noAmbiguous);
  const strict = Object.keys(POOL).filter((k) => opt.value[k]);
  if (!use.length) { pwd.value = ''; return; }
  let pool = use.map((k) => POOL[k]).join('');
  if (opt.value.noAmbiguous) pool = pool.replace(/[0O1lI]/g, '');
  if (!pool.length) { pwd.value = ''; return; }

  const out = new Uint8Array(len.value);
  crypto.getRandomValues(out);
  let s = '';
  for (let i = 0; i < len.value; i++) s += pool[out[i] % pool.length];
  // 严格模式下保证每类至少出现一个，否则弱配置会产出一串纯 a-z
  if (strict.length > 1) {
    strict.forEach((k, idx) => {
      const bytes = new Uint8Array(1);
      crypto.getRandomValues(bytes);
      const ch = POOL[k].replace(/[0O1lI]/g, '')[bytes[0] % (POOL[k].replace(/[0O1lI]/g, '').length || 1)];
      if (ch) s = s.split('').map((c, i) => (i === idx ? ch : c)).join('');
    });
  }
  pwd.value = s;
}

const bits = computed(() => {
  const use = Object.keys(POOL).filter((k) => opt.value[k] && !opt.value.noAmbiguous);
  let pool = use.map((k) => POOL[k]).join('');
  if (opt.value.noAmbiguous) pool = pool.replace(/[0O1lI]/g, '');
  if (!pool.length) return 0;
  return Math.round(len.value * Math.log2(new Set(pool).size));
});
const level = computed(() => (bits.value >= 80 ? 'strong' : bits.value >= 60 ? 'mid' : 'weak'));
const levelText = computed(() => ({ strong: '很强', mid: '中等', weak: '偏弱' })[level.value]);

function copy() {
  if (!pwd.value) return;
  navigator.clipboard?.writeText(pwd.value).catch(() => {});
  ElMessage.success('已复制');
}
onMounted(gen);
</script>

<style lang="less" scoped>@import '@/styles/mixins.less';
.pwd-tool { max-width: 640px; }
.out { height: 4px; border-radius: 3px; transition: background .2s; }
.val {
  display: block;
  margin: 8px 0 12px;
  padding: 10px 12px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.03);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 15px;
  letter-spacing: .5px;
  word-break: break-all;
}
.row { margin: 12px 0; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.row :deep(.el-input) { flex: 1; min-width: 0; }
.lab { font-size: 13px; color: var(--tb-sub, #64748b); }
.strength.strong { color: var(--tb-ok); } .strength.mid { color: var(--tb-warn); } .strength.weak { color: var(--el-color-danger); }
.checks {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
  padding: 10px 0;
  border-top: 1px dashed var(--tb-line-dashed, #cbd5e1);
  border-bottom: 1px dashed var(--tb-line-dashed, #cbd5e1);
}
@media (max-width: 620px) { .checks { grid-template-columns: 1fr; } }
</style>
