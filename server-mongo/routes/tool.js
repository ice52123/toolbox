const express = require('express');
const router = express.Router();
const History = require('../models/History');
const { ok, fail } = require('../utils/response');
const { auth } = require('../middlewares/auth');

// 记录使用历史
router.post('/history', auth, async (req, res) => {
  try {
    const { toolId, toolName, summary } = req.body;
    if (!toolId) return fail(res, 'toolId 必填');
    await History.create({ user: req.userId, toolId, toolName: toolName || '', summary: summary || '' });
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
    const list = await History.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .select('-user');
    const total = await History.countDocuments({ user: req.userId });
    return ok(res, { list, total });
  } catch (e) {
    return fail(res, '查询失败：' + e.message);
  }
});

// 工具使用排行（游客可见）
router.get('/rank', async (req, res) => {
  try {
    const rows = await History.aggregate([
      { $group: { _id: { toolId: '$toolId', toolName: '$toolName' }, cnt: { $sum: 1 } } },
      { $sort: { cnt: -1 } },
      { $limit: 10 },
      { $project: { tool_id: '$_id.toolId', tool_name: '$_id.toolName', cnt: 1, _id: 0 } }
    ]);
    return ok(res, rows);
  } catch (e) {
    return fail(res, '查询失败：' + e.message);
  }
});

module.exports = router;
