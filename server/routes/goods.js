const express = require('express');
const router = express.Router();
const { query, exec } = require('../db/mysql');
const { ok, fail } = require('../utils/response');
const { auth, optionalAuth } = require('../middlewares/auth');

// 列表：cat / kw / school 下推 SQL
router.get('/', async (req, res) => {
  try {
    const cat = (req.query.cat || '').trim();
    const kw = (req.query.kw || '').trim();
    const school = req.query.school || null;
    // owner：按发布人过滤（「我的发布」/ 他人主页「在售闲置」用），传用户 id
    const owner = req.query.owner || null;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 12;
    const offset = (page - 1) * pageSize;

    const where = ["status = 'on'"];
    const params = [];
    if (cat && cat !== 'all') { where.push('cat = ?'); params.push(cat); }
    if (school) { where.push('school = ?'); params.push(school); }
    if (owner) { where.push('owner_id = ?'); params.push(owner); }
    if (kw) { where.push('(title LIKE ? OR `desc` LIKE ?)'); params.push('%' + kw + '%', '%' + kw + '%'); }

    const rows = await query(
      'SELECT id, title, cat, price, images, place, cond, ways, owner_id, owner_name, school, created_at FROM goods WHERE ' +
      where.join(' AND ') + ' ORDER BY id DESC LIMIT ? OFFSET ?',
      [...params, pageSize, offset]
    );
    const [[totalRow]] = [await query('SELECT COUNT(*) AS c FROM goods WHERE ' + where.join(' AND '), params)];
    // 列表 SQL 没带 desc：卡片只要封面/标题/价格/成色/自提点，正文留给详情页拉
    rows.forEach((g) => {
      try { g.images = JSON.parse(g.images); } catch { g.images = []; }
      try { g.ways = JSON.parse(g.ways); } catch { g.ways = []; }
    });
    return ok(res, { list: rows, total: totalRow.c, page, pageSize });
  } catch (e) {
    return fail(res, '商品列表失败：' + e.message);
  }
});

// 详情：多图解析。optionalAuth 让游客也能看，登录用户额外带 faved（收藏态）
// 和 owner_code（卖家 6 位 code，「聊聊」拿它开私聊会话）
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const [[row]] = [await query(
      `SELECT g.id, g.title, g.cat, g.price, g.\`desc\`, g.images, g.place, g.cond, g.ways,
              g.owner_id, g.owner_name, g.school, g.status, g.created_at, u.code AS owner_code
       FROM goods g LEFT JOIN users u ON u.id = g.owner_id
       WHERE g.id = ?`,
      [req.params.id]
    )];
    if (!row) return fail(res, '商品不存在', 1, 404);
    try { row.images = JSON.parse(row.images); } catch { row.images = []; }
    try { row.ways = JSON.parse(row.ways); } catch { row.ways = []; }
    row.faved = false;
    if (req.userId) {
      const [[fv]] = [await query('SELECT 1 AS x FROM goods_fav WHERE goods_id = ? AND user_id = ?', [row.id, req.userId])];
      row.faved = !!fv;
    }
    return ok(res, row);
  } catch (e) {
    return fail(res, '商品详情失败：' + e.message);
  }
});

// 发布：images 收数组，落 JSON；school 取请求里的 ?school
router.post('/', auth, async (req, res) => {
  try {
    const { title, cat, price, desc, images, place, cond, ways } = req.body;
    if (!title) return fail(res, '标题必填');
    let imgArr = [];
    if (Array.isArray(images)) imgArr = images;
    else if (typeof images === 'string') { try { imgArr = JSON.parse(images); } catch { imgArr = []; } }
    // ways 同 images：既能收数组也能收 JSON 字符串（子应用走 fetch 时两种都可能）
    let wayArr = [];
    if (Array.isArray(ways)) wayArr = ways;
    else if (typeof ways === 'string') { try { wayArr = JSON.parse(ways); } catch { wayArr = ways ? [ways] : []; } }
    const school = req.query.school || req.body.school || null;
    const [[u]] = [await query('SELECT nickname, username FROM users WHERE id = ?', [req.userId])];
    const ownerName = (u && (u.nickname || u.username)) || '同学';
    const result = await exec(
      'INSERT INTO goods (title, cat, price, `desc`, images, place, cond, ways, owner_id, owner_name, school) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, cat || 'other', Number(price) || 0, desc || '', JSON.stringify(imgArr), place || '', cond || '', JSON.stringify(wayArr), req.userId, ownerName, school]
    );
    return ok(res, { id: result.insertId }, '发布成功');
  } catch (e) {
    return fail(res, '发布失败：' + e.message);
  }
});

// 编辑（auth + owner）
router.put('/:id', auth, async (req, res) => {
  try {
    const [[g]] = [await query('SELECT owner_id FROM goods WHERE id = ?', [req.params.id])];
    if (!g) return fail(res, '商品不存在', 1, 404);
    if (g.owner_id !== req.userId) return fail(res, '只能编辑自己的商品', 1, 403);
    const { title, cat, price, desc, images, place, cond, ways, status } = req.body;
    let imgArr = undefined;
    if (Array.isArray(images)) imgArr = JSON.stringify(images);
    let wayArr = undefined;
    if (Array.isArray(ways)) wayArr = JSON.stringify(ways);
    const sets = [];
    const params = [];
    if (title != null) { sets.push('title = ?'); params.push(title); }
    if (cat != null) { sets.push('cat = ?'); params.push(cat); }
    if (price != null) { sets.push('price = ?'); params.push(Number(price)); }
    if (desc != null) { sets.push('`desc` = ?'); params.push(desc); }
    if (imgArr != null) { sets.push('images = ?'); params.push(imgArr); }
    if (place != null) { sets.push('place = ?'); params.push(place); }
    if (cond != null) { sets.push('cond = ?'); params.push(cond); }
    if (wayArr != null) { sets.push('ways = ?'); params.push(wayArr); }
    if (status != null) { sets.push('status = ?'); params.push(status); }
    if (!sets.length) return ok(res, null, '无变更');
    params.push(req.params.id);
    await exec('UPDATE goods SET ' + sets.join(', ') + ' WHERE id = ?', params);
    return ok(res, null, '已保存');
  } catch (e) {
    return fail(res, '编辑失败：' + e.message);
  }
});

// 下架 / 删除（auth + owner）
router.delete('/:id', auth, async (req, res) => {
  try {
    const [[g]] = [await query('SELECT owner_id FROM goods WHERE id = ?', [req.params.id])];
    if (!g) return fail(res, '商品不存在', 1, 404);
    if (g.owner_id !== req.userId) return fail(res, '只能删除自己的商品', 1, 403);
    await exec('DELETE FROM goods WHERE id = ?', [req.params.id]);
    return ok(res, null, '已删除');
  } catch (e) {
    return fail(res, '删除失败：' + e.message);
  }
});

// 收藏切换
router.post('/:id/fav', auth, async (req, res) => {
  try {
    const goodsId = req.params.id;
    const exist = await query('SELECT 1 FROM goods_fav WHERE goods_id = ? AND user_id = ?', [goodsId, req.userId]);
    let faved;
    if (exist.length) {
      await exec('DELETE FROM goods_fav WHERE goods_id = ? AND user_id = ?', [goodsId, req.userId]);
      faved = false;
    } else {
      await exec('INSERT IGNORE INTO goods_fav (goods_id, user_id) VALUES (?, ?)', [goodsId, req.userId]);
      faved = true;
    }
    return ok(res, { faved }, faved ? '已收藏' : '已取消收藏');
  } catch (e) {
    return fail(res, '收藏失败：' + e.message);
  }
});

// 旧库补列：发布页的自提点 / 成色 / 交易方式，老表没有这三列，启动顺手 ALTER 上。
// 跟 users.phone 一个做法——异步跑、失败只 warn，不拖累启动。
async function ensureGoodsColumns() {
  const need = [
    ['place', 'VARCHAR(50) NOT NULL DEFAULT \'\''],
    ['cond', 'VARCHAR(20) NOT NULL DEFAULT \'\''],
    ['ways', 'VARCHAR(255) NOT NULL DEFAULT \'[]\'']
  ];
  try {
    const cols = await query(
      `SELECT COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'goods'`
    );
    const has = new Set(cols.map((c) => c.COLUMN_NAME));
    const waysCol = cols.find((c) => c.COLUMN_NAME === 'ways');
    // 早期版本把 ways 建成了 TEXT —— TEXT 不许带默认值，会把没写 ways 的 INSERT 全挡下，
    // 这里顺手改成带默认值的字符串
    if (waysCol && /^text/i.test(waysCol.COLUMN_TYPE)) {
      await exec('ALTER TABLE goods MODIFY COLUMN ways VARCHAR(255) NOT NULL DEFAULT \'[]\'');
      console.log('[migrate] goods.ways 已由 TEXT 改为 VARCHAR(255)');
    }
    const miss = need.filter(([name]) => !has.has(name));
    if (!miss.length) return;
    await exec('ALTER TABLE goods ' + miss.map(([name, ddl]) => `ADD COLUMN ${name} ${ddl}`).join(', '));
    console.log('[migrate] goods 表已补列：' + miss.map(([n]) => n).join(', '));
  } catch (e) {
    console.warn('[migrate] 补 goods 列失败，不影响启动：', e.message);
  }
}

module.exports = router;
module.exports.ensureGoodsColumns = ensureGoodsColumns;
