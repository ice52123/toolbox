const express = require('express');
const router = express.Router();
const { query, exec, transaction } = require('../db/mysql');
const { ok, fail } = require('../utils/response');
const { auth } = require('../middlewares/auth');

// 建表（幂等，启动钩子调一次）。好友关系「双向各存一行」表达：
// A 的好友里有 B、B 的好友里也有 A，互看都看得到，删的时候也成对删。
// status: pending(申请中，待对方通过) / accepted(已是好友)；requester_id 记谁发起的申请。
async function ensureFriendsTable() {
  await exec(`CREATE TABLE IF NOT EXISTS friends (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED    NOT NULL,   -- 这条记录挂在「谁」的好友列表下
    friend_id   INT UNSIGNED    NOT NULL,   -- 好友是谁
    remark      VARCHAR(50)     NOT NULL DEFAULT '',  -- 备注名（可选）
    status      VARCHAR(10)     NOT NULL DEFAULT 'accepted',
    requester_id INT UNSIGNED   NOT NULL DEFAULT 0,   -- 申请发起人（pending 时才有意义）
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_pair (user_id, friend_id),
    KEY idx_user (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  // 旧库补列（早期版本没有 status / requester_id，默认 accepted 让老好友不受影响）
  const cols = await query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'friends'`
  );
  const has = new Set(cols.map((c) => c.COLUMN_NAME));
  if (!has.has('status')) await exec("ALTER TABLE friends ADD COLUMN status VARCHAR(10) NOT NULL DEFAULT 'accepted'");
  if (!has.has('requester_id')) await exec('ALTER TABLE friends ADD COLUMN requester_id INT UNSIGNED NOT NULL DEFAULT 0');
}

// 按 6 位 code 查用户（添加好友 / 对方主页复用）
async function userByCode(code) {
  const rows = await query(
    'SELECT id, code, username, nickname, avatar FROM users WHERE code = ?',
    [code]
  );
  return rows[0] || null;
}

// 添加好友：用对方 6 位 code 发「好友申请」。双向写 pending 行，
// 被申请方在「新朋友」入口看到并「通过」后才真正成好友（独立入口，不再塞进消息中心）。
router.post('/', auth, async (req, res) => {
  try {
    const code = (req.body.code || '').trim().toUpperCase();
    if (!/^[2-9A-Z]{6}$/.test(code)) return fail(res, '请输入 6 位好友 ID');
    const target = await userByCode(code);
    if (!target) return fail(res, '没有找到这个 ID 对应的用户');
    if (target.id === req.userId) return fail(res, '不能添加自己为好友');

    // 已是好友？（任一方视角 accepted 都算）
    const [[acc]] = [await query(
      'SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ? AND status = ?',
      [req.userId, target.id, 'accepted']
    )];
    if (acc) return fail(res, '你们已经是好友啦');

    // 已在申请流程中？（pending 双向任一行都算，避免重复申请）
    const [[pend]] = [await query(
      `SELECT 1 FROM friends WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)) AND status = ?`,
      [req.userId, target.id, target.id, req.userId, 'pending']
    )];
    if (pend) return fail(res, '申请已发送，等待对方通过');

    // 双向写 pending 行（A 视角=「我发出的」、B 视角=「收到的申请」），事务保证一致
    await transaction(async (conn) => {
      const q = (sql, p) => conn.execute(sql, p).then(([r]) => r);
      await q('INSERT INTO friends (user_id, friend_id, status, requester_id) VALUES (?, ?, ?, ?)',
        [req.userId, target.id, 'pending', req.userId]);
      await q('INSERT INTO friends (user_id, friend_id, status, requester_id) VALUES (?, ?, ?, ?)',
        [target.id, req.userId, 'pending', req.userId]);
    });

    return ok(res, {
      id: target.id,
      code: target.code,
      nickname: target.nickname || target.username,
      avatar: target.avatar,
      pending: true
    }, '申请已发送，等待对方通过');
  } catch (e) {
    return fail(res, '发送申请失败：' + e.message);
  }
});

// 我的好友列表：只取 accepted，带对方资料 + 与该好友的未读数（红点）
router.get('/', auth, async (req, res) => {
  try {
    const rows = await query(
      `SELECT f.friend_id AS id, u.code, u.nickname, u.avatar, f.remark, f.created_at,
              COALESCE(CASE WHEN c.user_a = ? THEN c.unread_a ELSE c.unread_b END, 0) AS unread
       FROM friends f
       JOIN users u ON u.id = f.friend_id
       LEFT JOIN conversations c
         ON c.user_a = LEAST(f.user_id, f.friend_id) AND c.user_b = GREATEST(f.user_id, f.friend_id)
       WHERE f.user_id = ? AND f.status = 'accepted'
       ORDER BY f.created_at DESC`,
      [req.userId, req.userId]
    );
    return ok(res, rows.map((r) => ({
      id: r.id,
      code: r.code,
      nickname: r.nickname || '',
      avatar: r.avatar || '',
      remark: r.remark || '',
      unread: Number(r.unread) || 0,
      created_at: r.created_at
    })));
  } catch (e) {
    return fail(res, '加载好友失败：' + e.message);
  }
});

// 好友申请（独立入口的数据）：incoming=别人加我待我通过，outgoing=我发出的待对方通过
router.get('/requests', auth, async (req, res) => {
  try {
    const rows = await query(
      `SELECT f.id, f.friend_id, f.requester_id, f.created_at,
              u.id AS uid, u.code, u.nickname, u.avatar
       FROM friends f
       JOIN users u ON u.id = f.friend_id
       WHERE f.user_id = ? AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [req.userId]
    );
    const incoming = [], outgoing = [];
    for (const r of rows) {
      const peer = { id: r.uid, code: r.code, nickname: r.nickname || '', avatar: r.avatar || '' };
      if (r.requester_id === req.userId) outgoing.push({ id: r.id, user: peer, created_at: r.created_at });
      else incoming.push({ id: r.id, user: peer, created_at: r.created_at });
    }
    return ok(res, { incoming, outgoing });
  } catch (e) {
    return fail(res, '加载申请失败：' + e.message);
  }
});

// 通过好友申请（只有被申请方、且不是自己发起的才能通过）
router.post('/requests/:id/accept', auth, async (req, res) => {
  try {
    const rid = Number(req.params.id);
    const [[row]] = [await query(
      'SELECT user_id, friend_id, requester_id FROM friends WHERE id = ? AND user_id = ? AND status = ?',
      [rid, req.userId, 'pending']
    )];
    if (!row) return fail(res, '申请不存在或已处理');
    if (row.requester_id === req.userId) return fail(res, '不能接受自己发出的申请');
    // 双向两行一起置 accepted（(我,对方) 与 (对方,我)）
    await exec(
      `UPDATE friends SET status = ? WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`,
      ['accepted', req.userId, row.friend_id, row.friend_id, req.userId]
    );
    return ok(res, null, '已添加为好友');
  } catch (e) {
    return fail(res, '通过申请失败：' + e.message);
  }
});

// 忽略 / 拒绝好友申请：删掉双向 pending 行（不影响已是好友的关系）
router.post('/requests/:id/decline', auth, async (req, res) => {
  try {
    const rid = Number(req.params.id);
    const [[row]] = [await query(
      'SELECT user_id, friend_id FROM friends WHERE id = ? AND user_id = ? AND status = ?',
      [rid, req.userId, 'pending']
    )];
    if (!row) return fail(res, '申请不存在或已处理');
    await exec(
      'DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
      [req.userId, row.friend_id, row.friend_id, req.userId]
    );
    return ok(res, null, '已忽略申请');
  } catch (e) {
    return fail(res, '忽略申请失败：' + e.message);
  }
});

// 添加前预览：查 code 对应的用户 + 是否已是好友，避免加错人
router.get('/search', auth, async (req, res) => {
  try {
    const code = (req.query.code || '').trim().toUpperCase();
    if (!/^[2-9A-Z]{6}$/.test(code)) return fail(res, 'ID 格式不对');
    const u = await userByCode(code);
    if (!u) return ok(res, { found: false });
    const [[acc]] = [await query(
      'SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ? AND status = ?',
      [req.userId, u.id, 'accepted']
    )];
    const [[pend]] = [await query(
      `SELECT 1 FROM friends WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)) AND status = ?`,
      [req.userId, u.id, u.id, req.userId, 'pending']
    )];
    return ok(res, {
      found: true,
      isFriend: !!acc,
      pending: !!pend,
      user: { id: u.id, code: u.code, nickname: u.nickname || u.username, avatar: u.avatar }
    });
  } catch (e) {
    return fail(res, '查询失败：' + e.message);
  }
});

// 删除好友：删双向关系 + 清掉两人之间的会话（含消息），事务保证一致
router.delete('/:friendId', auth, async (req, res) => {
  try {
    const fid = Number(req.params.friendId);
    if (!fid) return fail(res, '参数错误');
    await transaction(async (conn) => {
      const q = (sql, p) => conn.execute(sql, p).then(([r]) => r);
      await q('DELETE FROM friends WHERE user_id = ? AND friend_id = ?', [req.userId, fid]);
      await q('DELETE FROM friends WHERE user_id = ? AND friend_id = ?', [fid, req.userId]);
      // 清会话：两人之间的唯一一行（user_a=min, user_b=max）
      const [[c]] = [await q(
        'SELECT id FROM conversations WHERE user_a = ? AND user_b = ?',
        [Math.min(req.userId, fid), Math.max(req.userId, fid)]
      )];
      if (c) {
        await q('DELETE FROM chat_messages WHERE conv_id = ?', [c.id]);
        await q('DELETE FROM conversations WHERE id = ?', [c.id]);
      }
    });
    return ok(res, null, '已删除好友');
  } catch (e) {
    return fail(res, '删除失败：' + e.message);
  }
});

module.exports = router;
module.exports.ensureFriendsTable = ensureFriendsTable;
