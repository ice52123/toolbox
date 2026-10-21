// 拉取「外部真实高校名单」并落库（开发期一次性，不在运行时依赖网络）。
// 用法：node scripts/refresh-schools.js
// 数据源：教育部《全国高等学校名单》（截至 2025-06 共 3167 所），公开镜像见下方 SOURCE 列表。
//   ⚠️ 你的环境有代理，curl/fetch 常返回假失败；联网正常的地方跑本脚本即可，跑完数据就进库了。
// 行为：
//   1) 逐个 SOURCE 尝试下载真实 JSON
//   2) 归一化成 { code, name, province, city, level } —— code 用名单里的官方代码（没有就 sch+序号）
//   3) 写回 data/schools-baseline.json（缓存），再 upsert 进 School 集合
//   4) 下载全失败则回退到已提交的 baseline（不联网也能 seed）
require('../config');
const fs = require('fs');
const path = require('path');
const https = require('https');
const mongoose = require('mongoose');
const School = require('../models/School');

// 公开真实名单源（任选其一，按可用网络挑）。字段格式各异，下方 normalize 做适配。
const SOURCES = [
  // 教育部 2025 全量（Excel→JSON），字段：{ index,name,code,department,location,level,remark }
  'https://raw.githubusercontent.com/lzy201314/Universities2025/main/W020250627301230143042.json',
  // 开源高校基础数据（CSV→JSON），字段：{ 序号,校名,省份,城市,办学层次,办学性质,... }
  'https://raw.githubusercontent.com/luhuadong/open-edu-data/main/dist/china-universities.json'
];

const BASELINE = path.join(__dirname, '..', 'data', 'schools-baseline.json');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 20000 }, (res) => {
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      let d = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve(d));
    }).on('error', reject).on('timeout', () => reject(new Error('timeout')));
  });
}

// 把不同源的结构归一化成统一形状
function normalize(list) {
  const out = [];
  list.forEach((it, i) => {
    // 两种源分别适配
    const name = it.name || it['校名'];
    if (!name) return;
    const province = it.province || it['省份'] || '';
    const city = it.city || it['城市'] || '';
    const level = it.level || it['办学层次'] || '';
    const code = String(it.code || it['代码'] || 'sch' + String(i + 1).padStart(4, '0'));
    out.push({ code, name, province, city, level, region: province });
  });
  return out;
}

async function refresh() {
  let schools = null;
  for (const url of SOURCES) {
    try {
      console.log('[refresh-schools] 尝试下载', url);
      const txt = await get(url);
      const parsed = JSON.parse(txt);
      const arr = Array.isArray(parsed) ? parsed : parsed.data || parsed.list;
      if (!Array.isArray(arr)) throw new Error('结构不认识');
      schools = normalize(arr).filter((s) => s.name);
      if (schools.length) {
        console.log('[refresh-schools] 下载成功，归一化', schools.length, '所');
        break;
      }
    } catch (e) {
      console.log('[refresh-schools] 源失败：', e.message);
    }
  }

  if (!schools || !schools.length) {
    console.log('[refresh-schools] 所有外部源都失败，回退到已提交的 baseline');
    schools = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  }

  // 写回 baseline（下次离线 seed 也能用全量）
  fs.writeFileSync(BASELINE, JSON.stringify(schools, null, 2), 'utf8');
  console.log('[refresh-schools] baseline 已更新（', schools.length, '所）');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/toolbox', {
    serverSelectionTimeoutMS: 8000
  });
  for (const s of schools) {
    await School.updateOne({ code: s.code }, { $set: s }, { upsert: true });
  }
  const total = await School.countDocuments();
  console.log(`[refresh-schools] done，schools 总数 = ${total}`);
  await mongoose.disconnect();
}

refresh().catch((e) => {
  console.error('[refresh-schools] 失败：', e.message);
  process.exit(1);
});
