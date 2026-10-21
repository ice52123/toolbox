// ── 消息中心（Message.vue + 导航红点）｜清单 #24-26｜鉴权：auth ──
// 【多租户 school 隔离】消息列表 / 未读计数按 req.query.school 过滤（系统公告类消息可 school 为空=全站）
// 提示：
//  - message = { user, type(reply/trade/system/follow), title, fromUser, refType, refId, read, createdAt }
//  - #26 unread-count 是导航红点专用轻接口：countDocuments 只数未读，千万别拉全量列表再数
//  - type 过滤下推进 find 条件
const express = require('express');
const router = express.Router();
const { ok, fail } = require('../utils/response');
const { auth } = require('../middlewares/auth');

// 清单 #26：GET /api/messages/unread-count —— 红点，必须注册在 /:id 之前
router.get('/unread-count', auth, async (req, res) => {
  // TODO(小喵) 导航红点专用轻接口（必须注册在 /:id 之前）
  // 入参：无
  // 出参：ok(res, { count:<Number> })
  // 涉及：Message（user, type, read）
  // 坑：countDocuments({ user:req.userId, read:false }) 只数未读，千万别拉全量列表回来再数（浪费）
  //   · school 隔离（多租户）：and { school: req.query.school }；系统级公告消息 school 留空=全站，可单独不计入校区过滤
  return fail(res, '接口还没实现', 501);
});

// 清单 #24：GET /api/messages?type= —— 消息列表
router.get('/', auth, async (req, res) => {
  // TODO(小喵) 消息列表
  // 入参：query.type?（reply/trade/system/follow）
  // 出参：ok(res, { list:[{ id, type, title, fromUser, refType, refId, read, createdAt }], total, page, pageSize })
  // 涉及：Message；type 过滤下推进 find 条件
  //   · 只查自己的：filter.user = req.userId
  //   · school 隔离（多租户）：filter.school = req.query.school（系统公告类 school 留空则不过滤）
  return fail(res, '接口还没实现', 501);
});

// 清单 #25：POST /api/messages/:id/read —— 单条标已读
router.post('/:id/read', auth, async (req, res) => {
  // TODO(小喵) 单条标已读
  // 入参：params.id
  // 出参：ok(res, { read:true })
  // 坑：只允许改自己的消息，updateOne({ _id:id, user:req.userId }, { read:true })，
  //     别人的 id 直接 404（别只按 _id 改，会改到别人的）
  return fail(res, '接口还没实现', 501);
});

module.exports = router;
