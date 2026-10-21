// 学校数据初始化（幂等）：读 data/schools-baseline.json（真实高校名单基线）灌库。
// 用法：node scripts/seed-schools.js
// 想换/补全数据：
//   · 小改：直接编辑 data/schools-baseline.json 后重跑本脚本（按 code upsert，不会重复）
//   · 拉全量真实名单（全国 3167 所）：node scripts/refresh-schools.js（需联网，会写回 baseline 再 upsert）
require('../config'); // 加载 dotenv + 拿到 mongoUri
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const School = require('../models/School');

const BASELINE = path.join(__dirname, '..', 'data', 'schools-baseline.json');

async function seed() {
  const raw = fs.readFileSync(BASELINE, 'utf8');
  const schools = JSON.parse(raw);

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/toolbox', {
    serverSelectionTimeoutMS: 8000
  });
  console.log('[seed-schools] MongoDB connected, 待写入', schools.length, '所');

  for (const s of schools) {
    // region 默认等于 province（前端切换器按 region 分组）
    const doc = { ...s, region: s.region || s.province || '' };
    await School.updateOne({ code: s.code }, { $set: doc }, { upsert: true });
  }

  const total = await School.countDocuments();
  console.log(`[seed-schools] done，schools 总数 = ${total}`);
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error('[seed-schools] 失败：', e.message);
  process.exit(1);
});
