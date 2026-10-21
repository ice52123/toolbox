const express = require('express');
const router = express.Router();
const { query } = require('../db/mysql');
const { ok, fail } = require('../utils/response');

// 学校列表（游客可见，供给顶部/登录页切换器下拉）。
// 支持 ?q=校名模糊、?province=省份过滤、?current=标当前选中。
// 返回数组，元素 { id(=code), name, province, city, level }，与 Mongo 版契约一致。
router.get('/', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const province = (req.query.province || '').trim();
    const current = (req.query.current || '').trim();

    const where = [];
    const params = [];
    if (q) { where.push('name LIKE ?'); params.push('%' + q + '%'); }
    if (province) { where.push('province = ?'); params.push(province); }
    const sql =
      'SELECT code, name, province, city, level FROM schools' +
      (where.length ? ' WHERE ' + where.join(' AND ') : '') +
      ' ORDER BY sort ASC';
    const rows = await query(sql, params);
    const data = rows.map((r) => ({
      id: r.code,
      name: r.name,
      province: r.province,
      city: r.city,
      level: r.level,
      isCurrent: current ? r.code === current : undefined
    }));
    return ok(res, data);
  } catch (e) {
    return fail(res, '查询学校失败：' + e.message);
  }
});

module.exports = router;
