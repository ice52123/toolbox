// 学校数据 seed：读 server-mongo 的基线 JSON（73 所真实高校），幂等 upsert 进 schools 表
const fs = require('fs');
const path = require('path');
const { query, exec } = require('../db/mysql');

const SRC = path.join(__dirname, '..', '..', 'server-mongo', 'data', 'schools-baseline.json');

async function main() {
  const list = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  let n = 0;
  for (let i = 0; i < list.length; i++) {
    const s = list[i];
    await exec(
      'INSERT INTO schools (code, name, province, city, level, sort) VALUES (?, ?, ?, ?, ?, ?) ' +
      'ON DUPLICATE KEY UPDATE name=VALUES(name), province=VALUES(province), city=VALUES(city), level=VALUES(level), sort=VALUES(sort)',
      [s.code, s.name, s.province || '', s.city || '', s.level || '', i + 1]
    );
    n++;
  }
  const [row] = await query('SELECT COUNT(*) AS c FROM schools');
  console.log(`已 upsert ${n} 所，schools 表共 ${row.c} 条`);
  process.exit(0);
}

main().catch((e) => {
  console.error('seed schools 失败：', e.message);
  process.exit(1);
});
