const express = require('express');
const router = express.Router();
const { query } = require('../db/mysql');
const { ok, fail } = require('../utils/response');
const { auth } = require('../middlewares/auth');
const redis = require('../db/redis');

// 记录某工具的使用（登录用户）。summary 可存「MD5(xxx)」之类简短摘要
router.post('/history', auth, async (req, res) => {
  try {
    const { toolId, toolName, summary } = req.body;
    if (!toolId) return fail(res, 'toolId 必填');
    await query(
      'INSERT INTO tool_history (user_id, tool_id, tool_name, summary, created_at) VALUES (?, ?, ?, ?, NOW())',
      [req.userId, toolId, toolName || '', summary || '']
    );
    redis.incr('tool:stat:' + toolId); // 没装 Redis 自动降级
    return ok(res, null, '已记录');
  } catch (e) {
    return fail(res, '记录失败：' + e.message);
  }
});

// 我的历史
router.get('/history', auth, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    const rows = await query(
      'SELECT id, tool_id, tool_name, summary, created_at FROM tool_history WHERE user_id = ? ORDER BY id DESC LIMIT ? OFFSET ?',
      [req.userId, pageSize, offset]
    );
    const [totalRow] = await query('SELECT COUNT(*) AS c FROM tool_history WHERE user_id = ?', [req.userId]);
    return ok(res, { list: rows, total: totalRow.c });
  } catch (e) {
    return fail(res, '查询失败：' + e.message);
  }
});

// 工具使用排行（游客可见，体现「大家都在用」）
router.get('/rank', async (req, res) => {
  try {
    const rows = await query(
      'SELECT tool_id, tool_name, COUNT(*) AS cnt FROM tool_history GROUP BY tool_id, tool_name ORDER BY cnt DESC LIMIT 10'
    );
    return ok(res, rows);
  } catch (e) {
    return fail(res, '查询失败：' + e.message);
  }
});

module.exports = router;
