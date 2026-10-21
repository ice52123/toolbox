// ── 闲置 · 我的收藏｜清单 #36｜鉴权：auth ──
// 【多租户 school 隔离】收藏反查按 req.query.school 过滤，只返回当前校区收藏的闲置
// 挂载在 /api/user/me → 完整路径 GET /api/user/me/favorites
// 注意：app.js 里这个挂载要放在 /api/user 之前（虽然 /me 不吞 /me/favorites，但顺序放前面最稳）
// 提示：goods 里 favUsers 包含自己的就是收藏，find({ favUsers: req.userId }) 反查即可，
//       别再建一张收藏表 —— Mongo 里数组反查足够，建表反而多一次同步
const express = require('express');
const router = express.Router();
const { ok, fail } = require('../utils/response');
const { auth } = require('../middlewares/auth');

// 清单 #36：GET /api/user/me/favorites（auth）
router.get('/favorites', auth, async (req, res) => {
  // TODO(小喵) 我的收藏（auth）
  // 入参：无（可选 page / pageSize 分页）
  // 出参：ok(res, { list:[{ id, title, price, cat, images:[], owner:{id,name} }] })
  // 涉及：Good（favUsers 含自己）
  // 写法提示：反查即可 find({ favUsers: req.userId })，别再建收藏表
  //   · 投影首页列表需要的字段（标题/价格/图/owner），别把 desc 等大字段都捞回来
  //   · school 隔离（多租户）：find({ favUsers: req.userId, school: req.query.school }) 只返回当前校区收藏
  return fail(res, '接口还没实现', 501);
});

module.exports = router;
