const express = require('express');
const router = express.Router();
const { query, exec } = require('../db/mysql');
const { ok, fail } = require('../utils/response');
const { auth } = require('../middlewares/auth');

// 消息列表：type 过滤（reply/trade/system/follow）
router.get('/', auth, async (req, res) => {
  try {
    const type = (req.query.type || '').trim();
    const where = ['user_id = ?'];
    const params = [req.userId];
    if (type) { where.push('type = ?'); params.push(type); }
    const rows = await query(
      'SELECT id, type, title, content, from_user, ref_type, ref_id, unread, created_at FROM messages WHERE ' +
      where.join(' AND ') + ' ORDER BY id DESC LIMIT 50',
      params
    );
    return ok(res, rows);
  } catch (e) {
    return fail(res, '消息列表失败：' + e.message);
  }
});

// 单条标已读
router.post('/:id/read', auth, async (req, res) => {
  try {
    await exec('UPDATE messages SET unread = 0 WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    return ok(res, null, '已读');
  } catch (e) {
    return fail(res, '标记已读失败：' + e.message);
  }
});

// 未读计数（导航红点）
router.get('/unread-count', auth, async (req, res) => {
  try {
    const [[row]] = [await query('SELECT COUNT(*) AS c FROM messages WHERE user_id = ? AND unread = 1', [req.userId])];
    return ok(res, { count: row.c });
  } catch (e) {
    return fail(res, '未读计数失败：' + e.message);
  }
});

module.exports = router;
