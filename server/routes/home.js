const express = require('express');
const router = express.Router();
const { query } = require('../db/mysql');
const { ok, fail } = require('../utils/response');
const { optionalAuth } = require('../middlewares/auth');

// 首页统计卡。optionalAuth 仅用于拿到 userId（不影响返回）。
// school 隔离：帖子/闲置按选中校区计数；用户/公告/工具为全站量级。
router.get('/stats', optionalAuth, async (req, res) => {
  try {
    const school = req.query.school || null;
    const sw = school ? ' WHERE school = ?' : '';
    const p = school ? [school] : [];
    const [[posts]] = [await query(`SELECT COUNT(*) AS c FROM posts${sw}`, p)];
    const goodsWhere = school ? " WHERE school = ? AND status = 'on'" : " WHERE status = 'on'";
    const [[goods]] = [await query('SELECT COUNT(*) AS c FROM goods' + goodsWhere, school ? [school] : [])];
    const [[users]] = [await query('SELECT COUNT(*) AS c FROM users')];
    const [[notices]] = [await query('SELECT COUNT(*) AS c FROM notices WHERE school IS NULL')];
    const [[tools]] = [await query('SELECT COUNT(*) AS c FROM tool_history')];
    return ok(res, {
      posts: posts.c,
      goods: goods.c,
      users: users.c,
      notices: notices.c,
      tools: tools.c
    });
  } catch (e) {
    return fail(res, '统计失败：' + e.message);
  }
});

// 公告列表：tag 过滤；school 为空=全站公告，选了校区则额外带该校公告
router.get('/notices', async (req, res) => {
  try {
    const tag = (req.query.tag || '').trim();
    const school = req.query.school || null;
    const where = [];
    const params = [];
    if (tag) { where.push('tag = ?'); params.push(tag); }
    if (school) { where.push('(school IS NULL OR school = ?)'); params.push(school); }
    else { where.push('school IS NULL'); }
    const rows = await query(
      'SELECT id, tag, title, content, date FROM notices WHERE ' + where.join(' AND ') + ' ORDER BY date DESC, id DESC',
      params
    );
    return ok(res, rows);
  } catch (e) {
    return fail(res, '公告列表失败：' + e.message);
  }
});

// 公告详情
router.get('/notices/:id', async (req, res) => {
  try {
    const [[row]] = [await query('SELECT id, tag, title, content, date FROM notices WHERE id = ?', [req.params.id])];
    if (!row) return fail(res, '公告不存在', 1, 404);
    return ok(res, row);
  } catch (e) {
    return fail(res, '公告详情失败：' + e.message);
  }
});

// 首页「最新动态」：最新上架闲置
router.get('/goods/latest', optionalAuth, async (req, res) => {
  try {
    const school = req.query.school || null;
    const limit = Number(req.query.limit) || 8;
    const rows = await query(
      'SELECT id, title, price, images, owner_name, created_at FROM goods WHERE status = \'on\'' +
      (school ? ' AND school = ?' : '') + ' ORDER BY id DESC LIMIT ?',
      school ? [school, limit] : [limit]
    );
    rows.forEach((g) => { try { g.images = JSON.parse(g.images); } catch { g.images = []; } });
    return ok(res, rows);
  } catch (e) {
    return fail(res, '最新闲置失败：' + e.message);
  }
});

// 首页「热门帖子」：按点赞数排序
router.get('/posts/hot', optionalAuth, async (req, res) => {
  try {
    const school = req.query.school || null;
    const limit = Number(req.query.limit) || 8;
    const rows = await query(
      'SELECT id, board_key, title, author_name, likes, comments, created_at FROM posts' +
      (school ? ' WHERE school = ?' : '') + ' ORDER BY likes DESC, id DESC LIMIT ?',
      school ? [school, limit] : [limit]
    );
    return ok(res, rows);
  } catch (e) {
    return fail(res, '热门帖子失败：' + e.message);
  }
});

module.exports = router;
