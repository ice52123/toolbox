<template>
  <div :class="s.rm">
    <!-- 详情模式：/notice/n1 之外这条时间轴自己就能看完，返回只需要一个出口 -->
    <div :class="s.backBar">
      <el-button text :icon="ArrowLeft" @click="go('/about')">返回关于</el-button>
    </div>

    <div :class="s.secHead">
      <h3>研发路线（P1 → P6）</h3>
      <p>从主站外壳到部署打磨，一个人从 0 到 1 的推进顺序</p>
    </div>

    <div :class="s.stat">
      <div v-for="k in stats" :key="k.label">
        <b>{{ k.value }}</b><span>{{ k.label }}</span>
      </div>
    </div>

    <div :class="s.tl">
      <div v-for="(r, i) in roadmap" :key="r.phase" :class="s.step">
        <span :class="s.dot" :data-st="r.status"></span>
        <div :class="s.card">
          <div :class="s.head">
            <span :class="s.phase">{{ r.phase }}</span>
            <b :class="s.name">{{ r.name }}</b>
            <span :class="s.pill">{{ statusText(r.status) }}</span>
          </div>
          <ul :class="s.items">
            <li v-for="it in r.items" :key="it" :data-st="r.status">
              <el-icon :size="13">
                <SuccessFilled v-if="r.status === 'done'" />
                <Clock v-else />
              </el-icon>
              <span>{{ it }}</span>
            </li>
          </ul>
          <div :class="s.foot">{{ r.items.length }} 个交付项 · {{ statusText(r.status) }}</div>
        </div>
        <i v-if="i < roadmap.length - 1" :class="s.line"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, useCssModule } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, SuccessFilled, Clock } from '@element-plus/icons-vue';
import { roadmap } from '@/config/mockData';
import shared from '@/styles/ui.module.less';

const s = { ...shared, ...useCssModule() };

const router = useRouter();

const stats = computed(() => [
  { value: roadmap.length, label: '阶段规划' },
  { value: roadmap.filter((r) => r.status === 'done').length, label: '已完成' },
  { value: roadmap.filter((r) => r.status === 'doing').length, label: '进行中' },
  { value: roadmap.filter((r) => r.status === 'todo').length, label: '待开始' }
]);

function statusText(st) {
  return { done: '已完成', doing: '进行中', todo: '待开始' }[st];
}

const go = (path) => router.push(path);
</script>

<style lang="less" module>@import '@/styles/mixins.less';

.rm { max-width: 860px; margin: 0 auto; }

.backBar { margin-bottom: 8px; }

.secHead { margin-bottom: 14px; }
.secHead h3 { margin: 0; font-size: 21px; }
.secHead p { margin: 6px 0 0; font-size: 13px; color: var(--tb-sub); }

/* —— 统计条：阶段数 + 三种状态各几个，数字都是 computed 出来的，改数据不用改这里 —— */
.stat {
  display: flex;
  gap: 28px;
  margin-bottom: 16px;
  b { display: block; font-size: 21px; color: var(--tb-primary); }
  span { font-size: 12px; color: var(--tb-sub); }

  .m-sm({
    gap: 16px;
    flex-wrap: wrap;
    b { font-size: 18px; }
  });
}

/* —— 时间轴：每条 .step 是「圆点列 + 卡片」，竖线用 .step 里的 .line 拼 —— */
.tl { display: flex; flex-direction: column; }
.step { position: relative; display: flex; gap: 14px; align-items: stretch; }

/* 圆点：用 box-shadow 环（而不是 border）—— border 会把 28px 撑成 32px，和竖线对不齐 */
.dot {
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  margin-top: 14px;
  border-radius: 50%;
  position: absolute;
  left: 0;
  &[data-st='done'] { background: var(--tb-ok); box-shadow: 0 0 0 4px var(--tb-ok-soft); }
  &[data-st='doing'] { background: linear-gradient(135deg, var(--tb-primary), var(--tb-secondary)); box-shadow: 0 0 0 4px var(--tb-primary-ring-soft); }
  &[data-st='todo'] { background: var(--tb-card); box-shadow: inset 0 0 0 2px var(--tb-line); }
}

.line {
  position: absolute;
  left: 13px;
  top: 42px;
  bottom: 0;
  width: 2px;
  background: var(--tb-line);
}

.card { composes: tb-card from global; flex: 1; padding: 16px 18px; min-width: 0; }

.head { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; margin-bottom: 2px; }
.phase {
  font-size: 12px;
  font-weight: 700;
  color: var(--tb-primary);
  padding: 2px 8px;
  border-radius: @r-xs;
  background: var(--tb-primary-soft);
}
.name { font-size: 15px; font-weight: 600; }

.items {
  list-style: none;
  margin: 12px 0 0;
  padding: 12px 0 0;
  border-top: 1px dashed var(--tb-line-dashed);
  display: grid;
  gap: 9px;
  li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13.5px;
    line-height: 1.6;
    color: var(--tb-sub);
  }
}

.foot { margin-top: 12px; font-size: 12px; color: var(--tb-mute); }

@media (max-width: 900px) {
  .secHead h3 { font-size: 18px; }
  .card { padding: 14px 15px; }
  .name { font-size: 14px; }
}
</style>
