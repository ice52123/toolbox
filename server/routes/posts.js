const express = require('express');
const router = express.Router();
const { query, exec, transaction } = require('../db/mysql');
const { ok, fail } = require('../utils/response');
const { auth, optionalAuth } = require('../middlewares/auth');

// 热门帖子：按点赞数排序（首页「热门帖子」用）
router.get('/hot', async (req, res) => {
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

// 给帖子打上「当前用户是否收藏过」：未登录 / 没收藏一律 false。
// 前端靠它决定按钮显示「收藏」还是「已收藏」——少了这个字段，刷新后按钮又变回未收藏，
// 用户再点一次会误以为是收藏，实际把收藏取消了。
async function markCollected(rows, userId) {
  if (!rows || !rows.length) return;
  if (!userId) {
    rows.forEach((r) => { r.collected = false; });
    return;
  }
  const ids = rows.map((r) => r.id);
  const ph = ids.map(() => '?').join(',');
  const mine = await query(
    `SELECT post_id FROM post_collects WHERE user_id = ? AND post_id IN (${ph})`,
    [userId, ...ids]
  );
  const set = new Set(mine.map((m) => m.post_id));
  rows.forEach((r) => { r.collected = set.has(r.id); });
}

// 列表：board / q(标题正文) / sort(latest|hot) / school 下推 SQL
router.get('/', optionalAuth, async (req, res) => {
  try {
    const board = (req.query.board || '').trim();
    const q = (req.query.q || '').trim();
    const sort = (req.query.sort || 'latest') === 'hot' ? 'hot' : 'latest';
    const school = req.query.school || null;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;

    const where = [];
    const params = [];
    if (board) { where.push('board_key = ?'); params.push(board); }
    if (school) { where.push('school = ?'); params.push(school); }
    if (q) { where.push('(title LIKE ? OR body LIKE ?)'); params.push('%' + q + '%', '%' + q + '%'); }

    const sql =
      'SELECT id, board_key, title, body, author_id, author_name, school, views, likes, collects, comments, created_at FROM posts' +
      (where.length ? ' WHERE ' + where.join(' AND ') : '') +
      ' ORDER BY ' + (sort === 'hot' ? 'likes DESC, ' : '') + 'id DESC LIMIT ? OFFSET ?';
    const rows = await query(sql, [...params, pageSize, offset]);
    await markCollected(rows, req.userId);
    const [[totalRow]] = [await query(
      'SELECT COUNT(*) AS c FROM posts' + (where.length ? ' WHERE ' + where.join(' AND ') : ''),
      params
    )];
    return ok(res, { list: rows, total: totalRow.c, page, pageSize });
  } catch (e) {
    return fail(res, '帖子列表失败：' + e.message);
  }
});

// 详情：阅读量原子自增，返回帖子 + 作者 + 评论数
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    await exec('UPDATE posts SET views = views + 1 WHERE id = ?', [req.params.id]);
    const [[row]] = [await query(
      'SELECT id, board_key, title, body, author_id, author_name, school, views, likes, collects, comments, created_at FROM posts WHERE id = ?',
      [req.params.id]
    )];
    if (!row) return fail(res, '帖子不存在', 1, 404);
    await markCollected([row], req.userId);
    return ok(res, row);
  } catch (e) {
    return fail(res, '帖子详情失败：' + e.message);
  }
});

// 评论列表（含二级回复）：parent 为顶楼，replies 挂在下面
router.get('/:id/comments', async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, post_id, parent_id, user_id, name, text, created_at FROM post_comments WHERE post_id = ? ORDER BY id ASC',
      [req.params.id]
    );
    const top = [];
    const byId = {};
    rows.forEach((c) => {
      c.replies = [];
      byId[c.id] = c;
      if (!c.parent_id) top.push(c);
      else if (byId[c.parent_id]) byId[c.parent_id].replies.push(c);
    });
    return ok(res, top);
  } catch (e) {
    return fail(res, '评论列表失败：' + e.message);
  }
});

// 发帖：auth，school 取请求里的 ?school（切换器带）
router.post('/', auth, async (req, res) => {
  try {
    const { board, title, body, tags } = req.body;
    if (!title || !body) return fail(res, '标题和正文必填');
    const school = req.query.school || req.body.school || null;
    const [[u]] = [await query('SELECT id, nickname, username FROM users WHERE id = ?', [req.userId])];
    const authorName = (u && (u.nickname || u.username)) || '同学';
    const result = await exec(
      'INSERT INTO posts (board_key, title, body, author_id, author_name, school) VALUES (?, ?, ?, ?, ?, ?)',
      [board || 'general', title, body, req.userId, authorName, school]
    );
    const postId = result.insertId;
    if (Array.isArray(tags) && tags.length) {
      for (const t of tags) await exec('INSERT INTO post_tags (post_id, tag) VALUES (?, ?)', [postId, String(t)]);
    }
    return ok(res, { id: postId }, '发布成功');
  } catch (e) {
    return fail(res, '发帖失败：' + e.message);
  }
});

// 点赞切换：已点→取消并计数-1，未点→插入并+1
router.post('/:id/like', auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const exist = await query('SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, req.userId]);
    let liked;
    if (exist.length) {
      await transaction(async (conn) => {
        await conn.execute('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, req.userId]);
        await conn.execute('UPDATE posts SET likes = GREATEST(likes - 1, 0) WHERE id = ?', [postId]);
      });
      liked = false;
    } else {
      await transaction(async (conn) => {
        await conn.execute('INSERT IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)', [postId, req.userId]);
        await conn.execute('UPDATE posts SET likes = likes + 1 WHERE id = ?', [postId]);
      });
      liked = true;
    }
    const [[row]] = [await query('SELECT likes FROM posts WHERE id = ?', [postId])];
    return ok(res, { liked, likes: row.likes }, liked ? '已点赞' : '已取消点赞');
  } catch (e) {
    return fail(res, '点赞失败：' + e.message);
  }
});

// 收藏切换
router.post('/:id/collect', auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const exist = await query('SELECT 1 FROM post_collects WHERE post_id = ? AND user_id = ?', [postId, req.userId]);
    let collected;
    if (exist.length) {
      await transaction(async (conn) => {
        await conn.execute('DELETE FROM post_collects WHERE post_id = ? AND user_id = ?', [postId, req.userId]);
        await conn.execute('UPDATE posts SET collects = GREATEST(collects - 1, 0) WHERE id = ?', [postId]);
      });
      collected = false;
    } else {
      await transaction(async (conn) => {
        await conn.execute('INSERT IGNORE INTO post_collects (post_id, user_id) VALUES (?, ?)', [postId, req.userId]);
        await conn.execute('UPDATE posts SET collects = collects + 1 WHERE id = ?', [postId]);
      });
      collected = true;
    }
    const [[row]] = [await query('SELECT collects FROM posts WHERE id = ?', [postId])];
    return ok(res, { collected, collects: row.collects }, collected ? '已收藏' : '已取消收藏');
  } catch (e) {
    return fail(res, '收藏失败：' + e.message);
  }
});

// 评论 / 回复（parent_id 不为空即二级回复）
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const { text, parentId } = req.body;
    if (!text || !text.trim()) return fail(res, '评论内容不能为空');
    const [[u]] = [await query('SELECT nickname, username FROM users WHERE id = ?', [req.userId])];
    const name = (u && (u.nickname || u.username)) || '同学';
    await transaction(async (conn) => {
      await conn.execute(
        'INSERT INTO post_comments (post_id, parent_id, user_id, name, text) VALUES (?, ?, ?, ?, ?)',
        [postId, parentId || null, req.userId, name, text.trim()]
      );
      await conn.execute('UPDATE posts SET comments = comments + 1 WHERE id = ?', [postId]);
    });
    return ok(res, null, '评论成功');
  } catch (e) {
    return fail(res, '评论失败：' + e.message);
  }
});

module.exports = router;
