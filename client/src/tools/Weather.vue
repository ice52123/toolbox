<template>
  <div class="wx">
    <el-card class="tb-card search" shadow="never">
      <div class="row">
        <el-input v-model="city" placeholder="输入城市名，如 北京 / 上海 / 东京" clearable @keyup.enter="search" style="flex:1" />
        <el-button type="primary" :loading="loading" @click="search">查询</el-button>
      </div>
      <el-alert v-if="error" type="warning" :closable="false" :title="error" class="mt" />
    </el-card>

    <template v-if="now">
      <el-card class="tb-card current" shadow="never">
        <div class="c-name">{{ place }}</div>
        <div class="c-main">
          <span class="c-emoji">{{ now.emoji }}</span>
          <span class="c-temp">{{ now.temp }}°</span>
        </div>
        <div class="c-desc">{{ now.desc }}</div>
      </el-card>

      <el-card class="tb-card forecast" shadow="never">
        <div class="f-title">未来几天</div>
        <div class="f-grid">
          <div v-for="(d, i) in daily" :key="i" class="f-item">
            <div class="f-day">{{ d.label }}</div>
            <div class="f-emoji">{{ d.emoji }}</div>
            <div class="f-temp">{{ d.min }}° / {{ d.max }}°</div>
          </div>
        </div>
      </el-card>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const city = ref('北京');
const place = ref('');
const now = ref(null);
const daily = ref([]);
const loading = ref(false);
const error = ref('');

const WMO = {
  0: ['晴', '☀️'], 1: ['晴间多云', '🌤️'], 2: ['多云', '⛅'], 3: ['阴', '☁️'],
  45: ['雾', '🌫️'], 48: ['雾凇', '🌫️'], 51: ['毛毛雨', '🌦️'], 53: ['小雨', '🌦️'],
  55: ['中雨', '🌧️'], 61: ['小雨', '🌧️'], 63: ['中雨', '🌧️'], 65: ['大雨', '🌧️'],
  71: ['小雪', '🌨️'], 73: ['中雪', '🌨️'], 75: ['大雪', '❄️'], 80: ['阵雨', '🌦️'],
  81: ['阵雨', '🌧️'], 82: ['强阵雨', '⛈️'], 95: ['雷雨', '⛈️'], 96: ['雷阵雨伴冰雹', '⛈️'], 99: ['强雷暴', '⛈️']
};
function wmo(code) {
  return WMO[code] || ['未知', '🌡️'];
}

async function search() {
  const name = city.value.trim();
  if (!name) return;
  loading.value = true;
  error.value = '';
  now.value = null;
  daily.value = [];
  try {
    const g = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=zh&format=json`);
    const gd = await g.json();
    if (!gd.results || !gd.results.length) throw new Error('未找到该城市');
    const loc = gd.results[0];
    place.value = `${loc.name}${loc.country ? ' · ' + loc.country : ''}`;
    const f = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`);
    const fd = await f.json();
    const [emoji, desc] = wmo(fd.current.weather_code);
    now.value = { temp: Math.round(fd.current.temperature_2m), emoji, desc };
    const days = fd.daily.time;
    daily.value = days.map((t, i) => {
      const [e, d] = wmo(fd.daily.weather_code[i]);
      const dt = new Date(t);
      const label = i === 0 ? '今天' : `${dt.getMonth() + 1}/${dt.getDate()}`;
      return { label, emoji: e, desc: d, min: Math.round(fd.daily.temperature_2m_min[i]), max: Math.round(fd.daily.temperature_2m_max[i]) };
    });
  } catch (e) {
    error.value = e.message || '查询失败，请检查网络';
  } finally {
    loading.value = false;
  }
}

onMounted(search);
</script>

<style lang="less" scoped>
@import '@/styles/mixins.less';

.wx {
  display: flex;
  flex-direction: column;
  gap: var(--tb-gap);
}
.row {
  display: flex;
  gap: 10px;
}
.mt {
  margin-top: 12px;
}
.current {
  text-align: center;
  padding: 20px;
}
.c-name {
  font-weight: 700;
  color: var(--tb-sub);
  margin-bottom: 8px;
}
.c-main {
  .flex-center();
  gap: 12px;
}
.c-emoji {
  font-size: 48px;
}
.c-temp {
  font-size: 52px;
  font-weight: 800;
}
.c-desc {
  color: var(--tb-sub);
  margin-top: 6px;
}
.f-title {
  font-weight: 700;
  margin-bottom: 12px;
}
.f-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}
.f-item {
  text-align: center;
  padding: 12px 6px;
  border-radius: @r-sm;
  background: rgba(124, 58, 237, 0.06);
}
.f-day {
  font-weight: 600;
  font-size: 13px;
}
.f-emoji {
  font-size: 28px;
  margin: 6px 0;
}
.f-temp {
  font-size: 12px;
  color: var(--tb-sub);
}

/* 窄屏只是把格子挤紧，仍是 5 列（一行看完整周天气） */
.m-xs({
  .f-grid {
    gap: 4px;
  }
  .f-item {
    padding: 8px 2px;
  }
});
</style>
