<template>
  <div class="cal">
    <div class="cal-head">
      <el-button circle @click="prev"><el-icon><ArrowLeft /></el-icon></el-button>
      <div class="cal-title tb-gradient-text">{{ year }} 年 {{ month }} 月 · {{ gz }}{{ animal }}年</div>
      <el-button circle @click="next"><el-icon><ArrowRight /></el-icon></el-button>
      <el-button size="small" @click="toToday">今天</el-button>
    </div>

    <div class="week">
      <span v-for="w in weeks" :key="w">{{ w }}</span>
    </div>

    <div class="grid">
      <div
        v-for="(cell, i) in cells"
        :key="i"
        class="cell"
        :class="{ other: !cell.current, today: cell.isToday }"
        @click="pick(cell)"
      >
        <div class="d">{{ cell.day }}</div>
        <div class="l" :class="{ hl: cell.hl }">{{ cell.lunarText }}</div>
      </div>
    </div>

    <el-card v-if="sel" class="detail tb-card" shadow="never">
      <div class="dt-title">{{ sel.y }}-{{ sel.m }}-{{ sel.d }} {{ sel.weekName }}</div>
      <div class="dt-row">农历：{{ sel.lunar.month }}月{{ sel.lunar.day }}（{{ sel.lunar.gz }}{{ sel.lunar.animal }}年）</div>
      <div class="dt-row" v-if="sel.lunar.term">节气：{{ sel.lunar.term }}</div>
      <div class="dt-row" v-if="sel.lunar.festivals.length">节日：{{ sel.lunar.festivals.join('、') }}</div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue';
import solarLunar from 'solarlunar';

const weeks = ['日', '一', '二', '三', '四', '五', '六'];
const today = new Date();
const year = ref(today.getFullYear());
const month = ref(today.getMonth() + 1);
const sel = ref(null);

const gz = computed(() => {
  try {
    const s = solarLunar.solar.fromYmd(year.value, month.value, 1);
    return s.getLunar().getYearInGanZhi();
  } catch { return ''; }
});
const animal = computed(() => {
  try {
    const s = solarLunar.solar.fromYmd(year.value, month.value, 1);
    return s.getLunar().getAnimal();
  } catch { return ''; }
});

function lunarOf(y, m, d) {
  try {
    const s = solarLunar.solar.fromYmd(y, m, d);
    const l = s.getLunar();
    const fn = (n) => (typeof l[n] === 'function' ? l[n]() : '');
    const festivals = [].concat(fn('getFestivals'), fn('getLunarFestivals')).filter(Boolean);
    const term = fn('getTerm');
    return {
      month: fn('getMonthInChinese'),
      day: fn('getDayInChinese'),
      gz: fn('getYearInGanZhi'),
      animal: fn('getAnimal'),
      term,
      festivals
    };
  } catch {
    return { month: '', day: '', gz: '', animal: '', term: '', festivals: [] };
  }
}

function lunarText(l) {
  if (l.term) return l.term;
  if (l.festivals.length) return l.festivals[0];
  return l.day;
}

const cells = computed(() => {
  const y = year.value;
  const m = month.value;
  const first = new Date(y, m - 1, 1);
  const startWeek = first.getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  const prevDays = new Date(y, m - 1, 0).getDate();
  const list = [];
  for (let i = 0; i < startWeek; i++) {
    const d = prevDays - startWeek + 1 + i;
    const pm = m - 1 || 12;
    const py = pm === 12 ? y - 1 : y;
    list.push({ day: d, current: false, isToday: false, lunarText: lunarText(lunarOf(py, pm, d)), hl: false, y: py, m: pm, d });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const l = lunarOf(y, m, d);
    const isToday = d === today.getDate() && m === today.getMonth() + 1 && y === today.getFullYear();
    list.push({ day: d, current: true, isToday, lunarText: lunarText(l), hl: !!(l.term || l.festivals.length), y, m, d });
  }
  while (list.length % 7 !== 0) {
    const idx = list.length;
    const nd = idx - (startWeek + daysInMonth) + 1;
    const nm = m + 1 > 12 ? 1 : m + 1;
    const ny = nm === 1 ? y + 1 : y;
    list.push({ day: nd, current: false, isToday: false, lunarText: lunarText(lunarOf(ny, nm, nd)), hl: false, y: ny, m: nm, d: nd });
  }
  return list;
});

function pick(cell) {
  if (!cell.current) {
    year.value = cell.y;
    month.value = cell.m;
  }
  sel.value = { ...cell, weekName: weeks[new Date(cell.y, cell.m - 1, cell.d).getDay()], lunar: lunarOf(cell.y, cell.m, cell.d) };
}
function prev() { if (--month.value === 0) { month.value = 12; year.value--; } }
function next() { if (++month.value === 13) { month.value = 1; year.value++; } }
function toToday() { year.value = today.getFullYear(); month.value = today.getMonth() + 1; }
</script>

<style lang="less" scoped>
@import '@/styles/mixins.less';

.cal-head {
  .flex-center();
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.cal-title {
  font-size: 20px;
  font-weight: 800;
}
.week,
.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
.week {
  text-align: center;
  color: var(--tb-sub);
  font-size: 13px;
  margin-bottom: 8px;
}
.grid {
  gap: 6px;
}
.cell {
  aspect-ratio: 1 / 1;
  border-radius: @r-sm;
  background: rgba(124, 58, 237, 0.05);
  display: flex;
  flex-direction: column;
  .flex-center();
  cursor: pointer;
  transition: 0.2s;

  .d {
    font-size: 16px;
    font-weight: 600;
  }
  .l {
    font-size: 11px;
    color: var(--tb-sub);
    margin-top: 2px;

    &.hl {
      color: @c-brand-2;
      font-weight: 600;
    }
  }

  &:hover {
    background: rgba(124, 58, 237, 0.14);
  }
  &.other {
    opacity: 0.4;
  }
  &.today {
    background: var(--tb-primary);
    color: @c-white;

    .l.hl {
      color: @c-white;
    }
  }
}
.detail {
  margin-top: 18px;
  padding: 8px;
}
.dt-title {
  font-weight: 700;
  margin-bottom: 8px;
}
.dt-row {
  font-size: 14px;
  color: var(--tb-sub);
  line-height: 1.8;
}

.m-sm({
  .grid {
    gap: 3px;
  }
  .cell .d {
    font-size: 14px;
  }
});
</style>
