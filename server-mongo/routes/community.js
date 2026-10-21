// ── 社区 · 板块枚举（Community.vue 顶部 tab）｜清单 #6｜鉴权：否 ──
// 【多租户 school 隔离】boards 可按 school 定制（不同校区板块不同），先全站统一也行；列表类接口按 school 过滤
const express = require('express');
const router = express.Router();
const { ok, fail } = require('../utils/response');

// 清单 #6：GET /api/community/boards（游客可见）
router.get('/boards', async (req, res) => {
  // TODO(小喵) 板块枚举（Community.vue 顶部 tab）
  // 入参：无
  // 出参：ok(res, [{ key, name, icon? }])，key 要跟帖子里 board 字段对上（前端 mockData.boards 有现成 key）
  // 两种做法（自己选）：
  //   a. 不建集合，直接返回常量数组（最简单，板块不常变）
  //   b. 建 models/Board.js 存库（更灵活，但要多维护一张表）
  // 坑：key 必须和 posts.board 的取值一致，否则前端按 board 过滤会拿不到数据
  //   · school 隔离：板块默认全站统一（不按 school 过滤）；若要做「各校板块不同」，这里按 req.query.school 过滤 Board 集合
  return fail(res, '接口还没实现', 501);
});

module.exports = router;
