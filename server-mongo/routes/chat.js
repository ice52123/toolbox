// ── 聊天（Chat.vue）｜清单 #27-29｜鉴权：auth ──
// 【多租户 school 隔离】会话与消息按 req.query.school 过滤；会话归属当前校区
// 提示：
//  - conversation = { participants:[ObjectId], name?, lastMsg, unread, updatedAt }
//  - chatMessage = { conversation, sender, text, createdAt }
//  - 聊天记录 ?cursor= 游标分页：_id 倒序 + find({ _id: { $lt: cursor } })，比 skip 深翻页稳
//  - 发消息后顺手 updateOne 会话的 lastMsg / updatedAt / 对方的 unread+1（$inc）
//  - Socket.IO 实时推送是 P5 的事，本轮只做拉取 + 发送落库
const express = require('express');
const router = express.Router();
const { ok, fail } = require('../utils/response');
const { auth } = require('../middlewares/auth');

// 清单 #27：GET /api/chats —— 会话列表（含 lastMsg、unread）
router.get('/', auth, async (req, res) => {
  // TODO(小喵) 会话列表（含 lastMsg、unread）
  // 入参：无
  // 出参：ok(res, [{ id, name?, participants:[...], lastMsg, unread, updatedAt }])
  // 涉及：Conversation（participants:[ObjectId], lastMsg, unread, updatedAt）
  //   · 只查 participants 含自己的：find({ participants: req.userId })
  //   · school 隔离（多租户）：and { school: req.query.school }（会话归属当前校区）
  return fail(res, '接口还没实现', 501);
});

// 清单 #28：GET /api/chats/:id/messages?cursor= —— 聊天记录分页
router.get('/:id/messages', auth, async (req, res) => {
  // TODO(小喵) 聊天记录分页
  // 入参：params.id / query.cursor?（上一次最后一条 _id，用于游标翻页）
  // 出参：ok(res, { list:[{ id, sender:{id,name}, text, createdAt }], nextCursor })
  // 涉及：ChatMessage（conversation, sender, text）
  // 写法提示：游标分页 find({ conversation:id, _id:{ $lt:cursor } }).sort({_id:-1}).limit(n)，
  //   · school 隔离（多租户）：会话已带 school，这里不用再过滤（会话级已隔离）
  //   比 skip 深翻页稳；cursor 为空就从最新往前取
  // 坑：先校验自己在 conversation.participants 里，别让别人翻你的聊天记录
  return fail(res, '接口还没实现', 501);
});

// 清单 #29：POST /api/chats/:id/messages —— 发消息
router.post('/:id/messages', auth, async (req, res) => {
  // TODO(小喵) 发消息（auth）
  // 入参 body：{ text }
  // 出参：ok(res, { id }) 或返回建好的这条
  // 涉及：ChatMessage + Conversation
  // 写法提示：
  //   · 校验自己在会话里
  //   · 会话带 school，消息随会话归属校区，不用单独存 school（多租户在会话层已隔离）
  //   · 写 ChatMessage；再 updateOne 会话的 lastMsg / updatedAt / 对方 unread +1（$inc）
  //   · Socket.IO 实时推送是 P5 的事，本轮只落库，前端轮询或之后接 WS
  return fail(res, '接口还没实现', 501);
});

module.exports = router;
