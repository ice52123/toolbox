<template>
  <div :class="s.fields">
    <!-- 手机号：不带区号，输入框独占一行 -->
    <div :class="s.fld">
      <div :class="s.lbRow">
        <label :class="s.lb">手机号</label>
        <!-- 演示用：点一下把本机号（模拟）填进来 -->
        <button type="button" :class="s.auto" @click="onAuto">获取本机号码</button>
      </div>
      <el-input
        size="large"
        maxlength="11"
        inputmode="numeric"
        placeholder="请输入手机号"
        :model-value="phone"
        :prefix-icon="Phone"
        @update:model-value="onPhone"
        @keyup.enter="onSend"
      />
      <div :class="[s.hint, { [s.bad]: phone && !phoneOk }]">
        {{
          phone && !phoneOk
            ? '手机号格式不对：11 位数字，1 开头'
            : '用于接收验证码，同时也是你的登录账号'
        }}
      </div>
    </div>

    <!-- 验证码：输入框 + 倒计时按钮，两边必须等高等重 -->
    <div :class="s.fld">
      <label :class="s.lb">验证码</label>
      <div :class="s.codeRow">
        <el-input
          size="large"
          maxlength="6"
          inputmode="numeric"
          placeholder="6 位数字验证码"
          :model-value="code"
          :prefix-icon="Message"
          @update:model-value="onCode"
          @keyup.enter="onSubmit"
        />
        <button type="button" :class="s.codeBtn" :disabled="countdown > 0" @click="onSend">
          {{ countdown > 0 ? countdown + 's 后重发' : '获取验证码' }}
        </button>
      </div>
      <div v-if="tip" :class="[s.hint, s.tip]">
        <el-icon :size="13"><InfoFilled /></el-icon>
        <span>{{ tip }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, useCssModule } from 'vue';
import { Phone, Message, InfoFilled } from '@element-plus/icons-vue';
import shared from '@/styles/ui.module.less';

// 一个句柄拿两类样式：共享原子类 + 本组件局部类
const s = { ...shared, ...useCssModule() };

const props = defineProps({
  phone: { type: String, default: '' },
  code: { type: String, default: '' },
  countdown: { type: Number, default: 0 },
  tip: { type: String, default: '' }
});

const emit = defineEmits(['update:phone', 'update:code', 'send', 'submit', 'auto']);

// 只留数字：输入法带出来的空格/连字符会让人以为验证码填错了
function onPhone(v) {
  emit('update:phone', String(v == null ? '' : v).replace(/\D/g, '').slice(0, 11));
}
function onCode(v) {
  emit('update:code', String(v == null ? '' : v).replace(/\D/g, '').slice(0, 6));
}
function onSend() {
  emit('send');
}
function onSubmit() {
  emit('submit');
}
function onAuto() {
  emit('auto');
}

const phoneOk = computed(() => /^1[3-9]\d{9}$/.test(props.phone));
</script>

<style lang="less" module>
@import '@/styles/mixins.less';

.fields {
  display: flex;
  flex-direction: column;
}

.fld {
  margin-bottom: 15px;
}

/* 标题行：左边 label，右边「获取本机号码」，把辅助动作从输入框里挪出去 */
.lbRow {
  .flex-between();
  align-items: baseline;
  gap: 10px;
}
.lb {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--tb-sub);
  margin-bottom: 7px;
}
.auto {
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: 0;
  font-size: 12px;
  color: var(--tb-primary);
  white-space: nowrap;

  &:hover {
    opacity: 0.8;
  }
}

.hint {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  font-size: 11.5px;
  color: var(--tb-sub);
  margin-top: 7px;
  line-height: 1.5;

  /* 只标红文字，别整块变色，否则提示行会把下面内容顶得忽上忽下 */
  &.bad {
    color: var(--tb-danger);
  }
}
.tip {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(124, 58, 237, 0.08);
  border-radius: @r-sm;
  padding: 8px 10px;
  margin-top: 9px;

  b {
    color: var(--tb-primary);
    letter-spacing: 2px;
  }
}

.codeRow {
  display: flex;
  align-items: stretch;
  gap: 8px;

  /* .el-input 是子组件根节点、__wrapper 是它内部的，module 作用域下必须用 :global 穿透
     （写 :deep(.el-input) 会被连类名一起哈希成假类名，样式静默失效） */
  > :global(.el-input) {
    flex: 1;
    min-width: 0;
  }
  :global(.el-input__wrapper) {
    min-height: @h-input;
  }
}

/* 自己画的按钮，高度必须跟输入框一致，差几像素整行就歪 */
/* 和登录页「获取验证码」是同一个共享款（.tb-btn），别各画一份 */
.codeBtn {
  composes: tb-btn from global;
}

.m-xs({
  .lbRow {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
  .auto {
    align-self: flex-start;
  }
});
</style>
