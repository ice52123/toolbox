// ── 首页 · 公告（Home.vue 滚动条 + Notice.vue 公告中心）｜清单 #2 #3｜鉴权：否 ──
// 【多租户 school 隔离】列表/详情按 req.query.school 过滤；公告 school 为空表示全站公告（对所有校区可见），写时 school 取当前校区
// 一条公告 = { tag, title, content, date, pinned, published }，tag 取值参考 mockData：版本更新/社区/工具箱
const express = require('express');
const router = express.Router();
const { ok, fail } = require('../utils/response');

// 清单 #2：GET /api/notices?tag= —— 列表（游客可见）
router.get('/', async (req, res) => {
  // TODO(小喵) 公告列表（首页滚动条 + 公告中心列表）
  // 入参：query.tag?（可选，按分类过滤：版本更新 / 社区 / 工具箱）
  // 出参：ok(res, [{ id, tag, title, date, pinned }])  —— 列表【不要】带 content
  // 涉及：models/Notice.js（待建）：{ tag, title, content, date, pinned, published }
  // 写法提示：
  //   · 过滤：const filter = { published: true }; if (req.query.tag) filter.tag = req.query.tag;
  //   · school 隔离（多租户）：filter.school = req.query.school || null；school 为 null/空 = 全站公告（对所有校区可见）；写公告时 school 取发布者当前校区
  //   · 排序：置顶优先 sort({ pinned: -1, createdAt: -1 })
  //   · tag 过滤直接下推进 find 条件即可，别用正则
  //   · 给前端返回 id（Schema toJSON 里把 _id 转字符串、删掉 __v），别直接吐 _id
  return fail(res, '接口还没实现', 501);
});

// 清单 #3：GET /api/notices/:id —— 详情（游客可见）
router.get('/:id', async (req, res) => {
  // TODO(小喵) 公告详情
  // 入参：params.id
  // 出参：ok(res, { id, tag, title, content, date, pinned })  —— 详情才带 content
  // 涉及：Notice
  // 坑：
  //   · 详情按 id 取即可，不用按 school 过滤（公告本身带 school 字段标识归属，全站公告 school 为空）
  //   · 先 mongoose.isValidObjectId(req.params.id) 挡一下，非法 id 直接 fail(res,'公告不存在',404,404)，
  //     否则会抛 CastError → 500，前端红点报错的锅
  //   · 找不到也返回 404，不要返回空对象
  return fail(res, '接口还没实现', 501);
});

module.exports = router;
