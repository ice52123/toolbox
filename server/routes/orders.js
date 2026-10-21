const express = require('express');
const router = express.Router();
const { query, exec } = require('../db/mysql');
const { ok, fail } = require('../utils/response');
const { auth } = require('../middlewares/auth');

const REVIEW_DIMS = [
  { key: 'desc', label: '描述相符' },
  { key: 'attitude', label: '服务态度' },
  { key: 'logistics', label: '物流速度' }
];
const REVIEW_TAGS = ['描述一致', '发货很快', '态度超好', '包装仔细', '性价比高', '沟通顺畅'];

function genOrderId() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const ymd = '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
  const rnd = String(Math.floor(100 + Math.random() * 900));
  return 'SO' + ymd + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) + rnd;
}

// 我的订单：买家或卖家都看得到，前端按角色分「买到的/卖出的」
router.get('/', auth, async (req, res) => {
  try {
    const status = (req.query.status || '').trim();
    const where = ['(buyer_id = ? OR seller_id = ?)', req.userId, req.userId];
    const params = [req.userId, req.userId];
    if (status) { where.push('status = ?'); params.push(status); }
    const rows = await query(
      'SELECT o.id, o.buyer_id, o.seller_id, o.title, o.price, o.status, o.created_at,' +
      ' (r.order_id IS NOT NULL) AS reviewed,' +
      ' COALESCE(NULLIF(b.nickname, \'\'), NULLIF(b.username, \'\'), \'同学\') AS buyer_name,' +
      ' COALESCE(NULLIF(s.nickname, \'\'), NULLIF(s.username, \'\'), \'同学\') AS seller_name' +
      ' FROM orders o' +
      ' LEFT JOIN users b ON b.id = o.buyer_id' +
      ' LEFT JOIN users s ON s.id = o.seller_id' +
      ' LEFT JOIN order_reviews r ON r.order_id = o.id' +
      ' WHERE ' + where.join(' AND ') + ' GROUP BY o.id ORDER BY o.id DESC',
      params
    );
    // 昵称已在 SQL 里拍平成 buyer_name / seller_name；reviewed 用来把「去评价」换成「已评价」，
    // 不然已评过的单还能点进评价页，进去才发现评过了 —— 用户看到的是「找不到这张订单」
    return ok(res, rows);
  } catch (e) {
    return fail(res, '订单列表失败：' + e.message);
  }
});

// 详情 + 状态时间线
router.get('/:id', auth, async (req, res) => {
  try {
    const [[o]] = [await query('SELECT * FROM orders WHERE id = ?', [req.params.id])];
    if (!o) return fail(res, '订单不存在', 1, 404);
    if (o.buyer_id !== req.userId && o.seller_id !== req.userId) return fail(res, '无权查看该订单', 1, 403);
    const logs = await query('SELECT from_status, to_status, note, created_at FROM order_logs WHERE order_id = ? ORDER BY id ASC', [req.params.id]);
    const [[rev]] = [await query('SELECT ratings, tags, text, created_at FROM order_reviews WHERE order_id = ?', [req.params.id])];
    return ok(res, { order: o, logs, review: rev || null });
  } catch (e) {
    return fail(res, '订单详情失败：' + e.message);
  }
});

// 下单：goodsId 查商品，买家=当前用户，卖家=商品主
router.post('/', auth, async (req, res) => {
  try {
    const { goodsId } = req.body;
    if (!goodsId) return fail(res, 'goodsId 必填');
    const [[g]] = [await query('SELECT id, title, price, owner_id, school FROM goods WHERE id = ?', [goodsId])];
    if (!g) return fail(res, '商品不存在');
    if (g.owner_id === req.userId) return fail(res, '不能买自己的商品');
    const id = genOrderId();
    const price = Number(req.body.price) || g.price;
    await exec(
      'INSERT INTO orders (id, buyer_id, seller_id, goods_id, title, price, status, school) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.userId, g.owner_id, g.id, g.title, price, 'pending', g.school]
    );
    await exec('INSERT INTO order_logs (order_id, from_status, to_status, note) VALUES (?, NULL, ?, ?)', [id, 'pending', '创建订单']);
    return ok(res, { id }, '下单成功');
  } catch (e) {
    return fail(res, '下单失败：' + e.message);
  }
});

// 取消（限 pending，买家）
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const [[o]] = [await query('SELECT * FROM orders WHERE id = ?', [req.params.id])];
    if (!o) return fail(res, '订单不存在', 1, 404);
    if (o.buyer_id !== req.userId) return fail(res, '只能取消自己买的订单', 1, 403);
    if (o.status !== 'pending') return fail(res, '只有待付款订单可取消', 1, 400);
    await exec('UPDATE orders SET status = ? WHERE id = ?', ['cancel', req.params.id]);
    await exec('INSERT INTO order_logs (order_id, from_status, to_status, note) VALUES (?, ?, ?, ?)', [req.params.id, 'pending', 'cancel', '买家取消']);
    return ok(res, null, '已取消');
  } catch (e) {
    return fail(res, '取消失败：' + e.message);
  }
});

// 付款（买家，pending → paid）。真实支付沙箱未接，这里先做状态机那一段：
// 少了它，订单永远卡在「待付款」，后面的发货 / 收货 / 评价整条链都推不动。
router.post('/:id/pay', auth, async (req, res) => {
  try {
    const [[o]] = [await query('SELECT * FROM orders WHERE id = ?', [req.params.id])];
    if (!o) return fail(res, '订单不存在', 1, 404);
    if (o.buyer_id !== req.userId) return fail(res, '只能支付自己的订单', 1, 403);
    if (o.status !== 'pending') return fail(res, '只有待付款订单可支付', 1, 400);
    await exec('UPDATE orders SET status = ? WHERE id = ?', ['paid', req.params.id]);
    await exec('INSERT INTO order_logs (order_id, from_status, to_status, note) VALUES (?, ?, ?, ?)', [req.params.id, 'pending', 'paid', '买家付款']);
    return ok(res, null, '支付成功');
  } catch (e) {
    return fail(res, '支付失败：' + e.message);
  }
});

// 提醒发货（买家发起，不改状态）
router.post('/:id/remind', auth, async (req, res) => {
  try {
    const [[o]] = [await query('SELECT * FROM orders WHERE id = ?', [req.params.id])];
    if (!o) return fail(res, '订单不存在', 1, 404);
    if (o.buyer_id !== req.userId) return fail(res, '只能提醒自己的订单', 1, 403);
    await exec('INSERT INTO order_logs (order_id, from_status, to_status, note) VALUES (?, ?, ?, ?)', [req.params.id, o.status, o.status, '买家提醒发货']);
    return ok(res, null, '已提醒卖家发货');
  } catch (e) {
    return fail(res, '提醒失败：' + e.message);
  }
});

// 发货（卖家，paid → shipping，带快递单号）
router.post('/:id/ship', auth, async (req, res) => {
  try {
    const [[o]] = [await query('SELECT * FROM orders WHERE id = ?', [req.params.id])];
    if (!o) return fail(res, '订单不存在', 1, 404);
    if (o.seller_id !== req.userId) return fail(res, '只能发自己卖的订单', 1, 403);
    if (o.status !== 'paid') return fail(res, '只有已付款订单可发货', 1, 400);
    const sn = (req.body.sn || '').trim();
    await exec('UPDATE orders SET status = ? WHERE id = ?', ['shipping', req.params.id]);
    await exec('INSERT INTO order_logs (order_id, from_status, to_status, note) VALUES (?, ?, ?, ?)', [req.params.id, 'paid', 'shipping', sn ? '发货 单号' + sn : '卖家发货']);
    return ok(res, null, '已发货');
  } catch (e) {
    return fail(res, '发货失败：' + e.message);
  }
});

// 确认收货（买家，shipping → done）
router.post('/:id/receive', auth, async (req, res) => {
  try {
    const [[o]] = [await query('SELECT * FROM orders WHERE id = ?', [req.params.id])];
    if (!o) return fail(res, '订单不存在', 1, 404);
    if (o.buyer_id !== req.userId) return fail(res, '只能确认自己买的订单', 1, 403);
    if (o.status !== 'shipping') return fail(res, '只有待收货订单可确认', 1, 400);
    await exec('UPDATE orders SET status = ? WHERE id = ?', ['done', req.params.id]);
    await exec('INSERT INTO order_logs (order_id, from_status, to_status, note) VALUES (?, ?, ?, ?)', [req.params.id, 'shipping', 'done', '买家确认收货']);
    return ok(res, null, '已确认收货');
  } catch (e) {
    return fail(res, '确认收货失败：' + e.message);
  }
});

// 评价页：dims + tags + 订单摘要
router.get('/:id/review-form', auth, async (req, res) => {
  try {
    const [[o]] = [await query('SELECT * FROM orders WHERE id = ?', [req.params.id])];
    if (!o) return fail(res, '订单不存在', 1, 404);
    if (o.buyer_id !== req.userId) return fail(res, '只能评价自己买的订单', 1, 403);
    if (o.status !== 'done') return fail(res, '只有已完成订单可评价', 1, 400);
    const [[rev]] = [await query('SELECT 1 FROM order_reviews WHERE order_id = ?', [req.params.id])];
    if (rev) return fail(res, '该订单已评价', 1, 400);
    return ok(res, { order: { id: o.id, title: o.title, price: o.price }, dims: REVIEW_DIMS, tags: REVIEW_TAGS });
  } catch (e) {
    return fail(res, '评价页失败：' + e.message);
  }
});

// 提交评价
router.post('/:id/review', auth, async (req, res) => {
  try {
    const [[o]] = [await query('SELECT * FROM orders WHERE id = ?', [req.params.id])];
    if (!o) return fail(res, '订单不存在', 1, 404);
    if (o.buyer_id !== req.userId) return fail(res, '只能评价自己买的订单', 1, 403);
    if (o.status !== 'done') return fail(res, '只有已完成订单可评价', 1, 400);
    const { ratings, tags, text } = req.body;
    if (!ratings || ratings.desc == null || ratings.attitude == null || ratings.logistics == null) {
      return fail(res, '请完成三项评分');
    }
    await exec(
      'INSERT INTO order_reviews (order_id, user_id, ratings, tags, text) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, req.userId, JSON.stringify(ratings), JSON.stringify(Array.isArray(tags) ? tags : []), text || '']
    );
    return ok(res, null, '评价成功');
  } catch (e) {
    return fail(res, '评价失败：' + e.message);
  }
});

module.exports = router;
