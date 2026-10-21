// ── 校园切换 · 学校列表（全局切换器数据源）｜清单 #37（新增）｜鉴权：否 ──
// 多租户总入口：切换器选定后存 localStorage(tb_school)，axios 拦截器自动带 ?school=<code>
// 所有列表接口按 req.query.school 过滤，只显示当前校区内容（见各 routes 文件头）
// 数据：School 集合（scripts/seed-schools.js 灌真实基线；scripts/refresh-schools.js 联网拉全量 3167 所）
const express = require('express');
const router = express.Router();
const School = require('../models/School');
const { ok, fail } = require('../utils/response');

// 清单 #37：GET /api/schools —— 学校列表（游客可见，给切换器下拉用）
// 入参：
//   · ?current=<code>  标出当前选中项（前端用 localStorage.tb_school 传）
//   · ?q=<关键词>       按校名模糊搜（名单上千所时必用）
//   · ?province=<省>    按省份过滤
// 出参：ok(res, [{ id, name, province, city, region, level, logo, sort, isCurrent? }])
//   · id = school.code（和下拉/过滤口径一致）
//   · 排序：sort 升序，再按 name
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.province) filter.province = req.query.province;
    if (req.query.q) {
      // 校名模糊匹配：用户输入可能是「华南」「大学」之类，正则别忘转义
      const re = new RegExp(req.query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.name = re;
    }
    const list = await School.find(filter).sort({ sort: 1, name: 1 }).lean();
    const current = (req.query.current || '').toString();
    const data = list.map((s) => ({
      id: s.code,
      name: s.name,
      province: s.province || '',
      city: s.city || '',
      region: s.region || s.province || '',
      level: s.level || '',
      logo: s.logo || '',
      sort: s.sort || 0,
      isCurrent: current ? s.code === current : undefined
    }));
    return ok(res, data);
  } catch (e) {
    return fail(res, '查询失败：' + e.message);
  }
});

module.exports = router;
