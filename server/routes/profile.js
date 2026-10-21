const express = require('express');
const router = express.Router();
const { query } = require('../db/mysql');
const { ok, fail } = require('../utils/response');
const { optionalAuth } = require('../middlewares/auth');

// 个人主页：定位方式尽量宽容——6 位 code / 纯数字 id / 昵称 / 用户名 都认。
// 消息中心的「查看主页」、帖子作者名给的都是「昵称」，而昵称会被改名、甚至可能为空，
// 只按昵称精确匹配会出现「点查看主页 → 找不到这位同学」。多认 code / id 后，
// 旧链接、按 code 拼的链接都能兜住（code 是稳定且唯一的）。
router.get('/:key/profile', optionalAuth, async (req, res) => {
  try {
    const key = String(req.params.key || '').trim();
    if (!key) return fail(res, '参数错误', 1, 400);

    const params = [key.toUpperCase(), key, key];
    let sql =
      'SELECT id, username, nickname, avatar, code, created_at FROM users WHERE code = ? OR nickname = ? OR username = ?';
    if (/^\d+$/.test(key)) {
      sql += ' OR id = ?';
      params.push(Number(key));
    }
    const rows = await query(sql + ' LIMIT 1', params);
    const u = rows[0];
    if (!u) return fail(res, '用户不存在', 1, 404);
    const posts = await query(
      'SELECT id, board_key, title, likes, comments, created_at FROM posts WHERE author_id = ? ORDER BY id DESC LIMIT 20',
      [u.id]
    );
    return ok(res, { user: u, posts });
  } catch (e) {
    return fail(res, '查询主页失败：' + e.message);
  }
});

module.exports = router;
