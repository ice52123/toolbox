const express = require('express');
const router = express.Router();
const { query, exec } = require('../db/mysql');
const { ok, fail } = require('../utils/response');
const { auth } = require('../middlewares/auth');

// conversations 升级成「两人私聊 + 双侧未读」。旧表只有全局 unread，这里幂等补列，
// 让 A、B 各记各的未读数，红点才不会串台。
async function ensureChatSchema() {
  const cols = await query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'conversations'`
  );
  const has = new Set(cols.map((c) => c.COLUMN_NAME));
  if (!has.has('user_a')) await exec('ALTER TABLE conversations ADD COLUMN user_a INT UNSIGNED NOT NULL DEFAULT 0');
  if (!has.has('user_b')) await exec('ALTER TABLE conversations ADD COLUMN user_b INT UNSIGNED NOT NULL DEFAULT 0');
  if (!has.has('unread_a')) await exec('ALTER TABLE conversations ADD COLUMN unread_a INT UNSIGNED NOT NULL DEFAULT 0');
  if (!has.has('unread_b')) await exec('ALTER TABLE conversations ADD COLUMN unread_b INT UNSIGNED NOT NULL DEFAULT 0');
  if (!has.has('last_sender')) await exec('ALTER TABLE conversations ADD COLUMN last_sender INT UNSIGNED NOT NULL DEFAULT 0');
}

// chat_messages 补 type/img 列，让聊天能发图片（旧库由 ensureChatSchema 幂等补列）
async function ensureMsgCols() {
  const cols = await query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages'`
  );
  const has = new Set(cols.map((c) => c.COLUMN_NAME));
  if (!has.has('type')) await exec("ALTER TABLE chat_messages ADD COLUMN type VARCHAR(10) NOT NULL DEFAULT 'text'");
  if (!has.has('img')) await exec("ALTER TABLE chat_messages ADD COLUMN img VARCHAR(512) NOT NULL DEFAULT ''");
}

function peerOf(conv, me) {
  return conv.user_a === me ? conv.user_b : conv.user_a;
}
function myUnread(conv, me) {
  return conv.user_a === me ? conv.unread_a : conv.unread_b;
}

// 会话列表：我参与的私聊，带对方资料 + 末条预览 + 我的未读数
router.get('/', auth, async (req, res) => {
  try {
    const rows = await query(
      `SELECT c.id, c.user_a, c.user_b, c.last_msg, c.last_sender, c.unread_a, c.unread_b, c.updated_at,
              u.id AS pid, u.code, u.nickname, u.avatar
       FROM conversations c
       JOIN users u ON u.id = (CASE WHEN c.user_a = ? THEN c.user_b ELSE c.user_a END)
       WHERE c.user_a = ? OR c.user_b = ?
       ORDER BY c.updated_at DESC LIMIT 50`,
      [req.userId, req.userId, req.userId]
    );
    return ok(res, rows.map((c) => ({
      id: c.id,
      peer: { id: c.pid, code: c.code, nickname: c.nickname || '', avatar: c.avatar || '' },
      last_msg: c.last_msg || '',
      unread: myUnread(c, req.userId),
      updated_at: c.updated_at
    })));
  } catch (e) {
    return fail(res, '会话列表失败：' + e.message);
  }
});

// 取/建与某人的会话（按对方 6 位 code；好友、闲置市场卖家都能开）。会话唯一行用 user_a=min, user_b=max 定位
router.post('/with/:code', auth, async (req, res) => {
  try {
    const code = (req.params.code || '').trim().toUpperCase();
    const [[peer]] = [await query('SELECT id, code FROM users WHERE code = ?', [code])];
    if (!peer) return fail(res, '对方不存在');
    if (peer.id === req.userId) return fail(res, '不能和自己聊天');
    // 不再强制好友关系：闲置市场「聊聊」要能直接跟卖家开聊（好友流程本来就过得了这道门）。
    // 会话唯一行用 user_a=min, user_b=max 定位
    const a = Math.min(req.userId, peer.id), b = Math.max(req.userId, peer.id);
    let [[c]] = [await query('SELECT id FROM conversations WHERE user_a = ? AND user_b = ?', [a, b])];
    if (!c) {
      const r = await exec('INSERT INTO conversations (user_a, user_b, type) VALUES (?, ?, ?)', [a, b, 'single']);
      c = { id: r.insertId };
    }
    return ok(res, { convId: c.id }, 'ok');
  } catch (e) {
    return fail(res, '打开会话失败：' + e.message);
  }
});

// 聊天记录分页：cursor 之前的更早消息（按 id 倒序取一页）
router.get('/:id/messages', auth, async (req, res) => {
  try {
    const convId = Number(req.params.id);
    const [[conv]] = [await query('SELECT id, user_a, user_b FROM conversations WHERE id = ?', [convId])];
    if (!conv) return fail(res, '会话不存在', 1, 404);
    if (conv.user_a !== req.userId && conv.user_b !== req.userId) return fail(res, '无权访问', 1, 403);
    const cursor = Number(req.query.cursor) || 0;
    const pageSize = Number(req.query.pageSize) || 30;
    const rows = await query(
      'SELECT id, conv_id, sender_id, type, text, img, created_at FROM chat_messages WHERE conv_id = ?' +
      (cursor ? ' AND id < ?' : '') + ' ORDER BY id DESC LIMIT ?',
      cursor ? [convId, cursor, pageSize] : [convId, pageSize]
    );
    rows.reverse(); // 时间正序返回，前端好渲染
    const nextCursor = rows.length ? rows[0].id : 0;
    return ok(res, { list: rows, nextCursor });
  } catch (e) {
    return fail(res, '聊天记录失败：' + e.message);
  }
});

// 发消息：写记录 + 更新预览 + 对方未读 +1（自己的未读不动）
router.post('/:id/messages', auth, async (req, res) => {
  try {
    const convId = Number(req.params.id);
    const type = (req.body.type || 'text') === 'image' ? 'image' : 'text';
    const text = (req.body.text || '').trim();
    const img = (req.body.img || '').trim();
    // 图片消息只需 img；文字消息需 text
    if (type === 'image') {
      if (!img) return fail(res, '图片消息缺少地址');
    } else if (!text) {
      return fail(res, '消息内容不能为空');
    }
    const [[conv]] = [await query(
      'SELECT id, user_a, user_b, unread_a, unread_b, last_sender FROM conversations WHERE id = ?',
      [convId]
    )];
    if (!conv) return fail(res, '会话不存在', 1, 404);
    if (conv.user_a !== req.userId && conv.user_b !== req.userId) return fail(res, '无权访问', 1, 403);
    const preview = type === 'image' ? '[图片]' : text;
    const r = await exec(
      'INSERT INTO chat_messages (conv_id, sender_id, type, text, img) VALUES (?, ?, ?, ?, ?)',
      [convId, req.userId, type, text, img]
    );
    const peer = peerOf(conv, req.userId);
    const incCol = peer === conv.user_a ? 'unread_a' : 'unread_b';
    await exec(
      `UPDATE conversations SET last_msg = ?, last_sender = ?, ${incCol} = ${incCol} + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [preview, req.userId, convId]
    );
    return ok(res, { id: r.insertId, convId, type, img }, '已发送');
  } catch (e) {
    return fail(res, '发送失败：' + e.message);
  }
});

// 点开会话：把「我的」未读清零
router.post('/:id/read', auth, async (req, res) => {
  try {
    const convId = Number(req.params.id);
    const [[conv]] = [await query('SELECT id, user_a, user_b, unread_a, unread_b FROM conversations WHERE id = ?', [convId])];
    if (!conv) return fail(res, '会话不存在', 1, 404);
    if (conv.user_a !== req.userId && conv.user_b !== req.userId) return fail(res, '无权访问', 1, 403);
    const col = req.userId === conv.user_a ? 'unread_a' : 'unread_b';
    await exec(`UPDATE conversations SET ${col} = 0 WHERE id = ?`, [convId]);
    return ok(res, null, '已读');
  } catch (e) {
    return fail(res, '标记已读失败：' + e.message);
  }
});

// 删除会话（仅参与者）：连聊天记录一起清。好友页「聊过的陌生人」和聊天列表都能用它
router.delete('/:id', auth, async (req, res) => {
  try {
    const convId = Number(req.params.id);
    const [[conv]] = [await query('SELECT id, user_a, user_b FROM conversations WHERE id = ?', [convId])];
    if (!conv) return ok(res, null, '已删除');
    if (conv.user_a !== req.userId && conv.user_b !== req.userId) return fail(res, '无权操作', 1, 403);
    await exec('DELETE FROM chat_messages WHERE conv_id = ?', [convId]);
    await exec('DELETE FROM conversations WHERE id = ?', [convId]);
    return ok(res, null, '已删除');
  } catch (e) {
    return fail(res, '删除会话失败：' + e.message);
  }
});

// 未读总数（导航红点）
router.get('/unread-count', auth, async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, user_a, user_b, unread_a, unread_b FROM conversations WHERE user_a = ? OR user_b = ?',
      [req.userId, req.userId]
    );
    const total = rows.reduce((n, c) => n + myUnread(c, req.userId), 0);
    return ok(res, { count: total });
  } catch (e) {
    return fail(res, '未读计数失败：' + e.message);
  }
});

module.exports = router;
module.exports.ensureChatSchema = ensureChatSchema;
module.exports.ensureMsgCols = ensureMsgCols;
