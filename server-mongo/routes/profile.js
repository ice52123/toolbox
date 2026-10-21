// ── 社区 · 他人主页（UserProfile.vue）｜清单 #14｜鉴权：optional ──
// 【多租户 school 隔离】TA 的帖子列表按 req.query.school 过滤，只看当前校区内容
// 挂载在 /api/users → 完整路径 GET /api/users/:nickname/profile
const express = require('express');
const router = express.Router();
const { ok, fail } = require('../utils/response');
const { optionalAuth } = require('../middlewares/auth');

// 清单 #14：GET /api/users/:nickname/profile（游客可见）
router.get('/:nickname/profile', optionalAuth, async (req, res) => {
  // TODO(小喵) 他人主页（UserProfile.vue）
  // 入参：params.nickname
  // 出参：ok(res, { profile:{ nickname, name, avatar, bio? }, posts:[{ id,title,board,views,createdAt }] })
  // 涉及：User + Post
  // 写法提示：
  //   · 按昵称查人：User.findOne({ nickname: req.params.nickname })，
  //     注册没填昵称的兜底用 username（先 findOne nickname，没有再 findOne username 兜底）
  //   · 帖子部分复用帖子列表投影：Post.find({ author: user._id, school: req.query.school }).sort({ createdAt:-1 })
  //   · school 隔离（多租户）：TA 的帖子只看当前校区内容
  //   · 找不到人返回 404，别返回空
  return fail(res, '接口还没实现', 501);
});

module.exports = router;
