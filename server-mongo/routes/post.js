// ── 社区 · 帖子（Community.vue / PostDetail.vue / 首页热门帖）｜清单 #5 #7-13 ──
// 【多租户 school 隔离】列表/hot/详情列表均按 req.query.school 过滤；发帖把 school 存为当前校区（见下方各 TODO 注释）
// ⚠️ GET /hot 必须注册在 GET /:id 之前，否则 "hot" 会被当成帖子 id 吃掉
// 提示：
//  - posts 建议 { board, title, body, author(ref User), authorName, views, likeUsers:[ObjectId], collectUsers:[ObjectId], tags:[] }
//  - 列表 ?board=&q=&sort=&page=&pageSize=，返回 { list, total, page, pageSize }（契约见清单第 0 节）
//  - q 搜标题/正文：$or + $regex，用户输入先 escapeRegExp，别把正则元字符放进去
//  - views 用 updateOne({ $inc: { views: 1 } }) 原子自增，别先查后写
//  - 点赞/收藏切换：$addToSet / $pull 各一行搞定，不用先查再判断
//  - 评论单独 collection：{ post, parent, user, name, text }，parent 为空是一级评论，指向父评论 id 就是二级回复
const express = require('express');
const router = express.Router();
const { ok, fail } = require('../utils/response');
const { auth } = require('../middlewares/auth');

// 清单 #5：GET /api/posts/hot?limit= —— 首页「热门帖子」（游客可见）
router.get('/hot', async (req, res) => {
  // TODO(小喵) 首页「热门帖子」
  // 入参：query.limit?（默认 10，记得 Number() 化）
  // 出参：ok(res, [{ id, title, board, authorName, views, likes, createdAt }])，likes = likeUsers.length
  // 涉及：Post（likeUsers 是点赞人 ObjectId 数组）
  // 写法提示：
  //   · 排序按浏览/点赞：聚合 $addFields 算 likes = { $size: '$likeUsers' }，再 sort({ likes:-1, views:-1 }).limit(limit)
  //   · school 隔离（多租户）：聚合最前面 $match 加 { school: req.query.school }（切校只看本校热门）
  //   · 或简单点 sort({ views:-1 }).limit(limit)，先跑通再说
  return fail(res, '接口还没实现', 501);
});

// 清单 #7：GET /api/posts?board=&q=&sort=&page=&pageSize= —— 列表（游客可见）
router.get('/', async (req, res) => {
  // TODO(小喵) 帖子列表（Community.vue）
  // 入参：query.board? / q?（搜标题+正文）/ sort?(latest|hot) / page / pageSize
  // 出参：ok(res, { list:[{ id, title, board, authorName, views, likes, createdAt }], total, page, pageSize })
  // 涉及：Post
  // 写法提示：
  //   · 过滤：const filter = {}; if (board) filter.board = board;
  //   · school 隔离（多租户）：filter.school = req.query.school（切校只看本校帖子）
  //           if (q) { const re = new RegExp(escapeRegExp(q), 'i'); filter.$or = [{ title: re }, { body: re }]; }
  //   · ⚠️ q 必须 escapeRegExp，用户输入里的 . * ( ) 等会被当正则元字符
  //   · 分页：skip = (page-1)*pageSize, limit = pageSize，返回 list + total（契约见清单第 0 节）
  return fail(res, '接口还没实现', 501);
});

// 清单 #10：POST /api/posts —— 发帖（auth）
router.post('/', auth, async (req, res) => {
  // TODO(小喵) 发帖（auth）
  // 入参 body：{ title, board, body, tags?:[] }
  // 出参：ok(res, { id }) 或返回建好的整条
  // 涉及：Post；author / authorName 从登录态拿，别让前端传
  // 写法提示：
  //   · req.userId 是 auth 中间件解 token 挂上的；作者名用 req.user.name（或 nickname）
  //   · new Post({ ...req.body, author: req.userId, authorName: req.user.name, school: req.query.school }).save()
  //   · school 隔离（多租户）：发帖把 school 存当前校区 —— school 取 req.query.school（拦截器自动带过来的）
  //   · tags 是数组，前端没传就默认 []
  return fail(res, '接口还没实现', 501);
});

// 清单 #8：GET /api/posts/:id —— 详情（游客可见，顺手 views 自增）
router.get('/:id', async (req, res) => {
  // TODO(小喵) 帖子详情
  // 入参：params.id
  // 出参：ok(res, { id, title, body, board, author:{id,name}, views, likes, tags, commentsCount, createdAt })
  // 涉及：Post + Comment（commentsCount 用 Comment.countDocuments({ post:id })）
  // 坑：
  //   · 先 isValidObjectId(id) 挡非法，否则 CastError → 500
  //   · views 原子自增：updateOne({ _id:id }, { $inc:{ views:1 } })，别先查后写
  //   · 自增完再 findOne 返回；找不到返回 404
  return fail(res, '接口还没实现', 501);
});

// 清单 #9：GET /api/posts/:id/comments —— 评论列表 + 二级回复（游客可见）
router.get('/:id/comments', async (req, res) => {
  // TODO(小喵) 评论列表 + 二级回复
  // 入参：params.id
  // 出参：ok(res, [{ id, user:{id,name}, text, createdAt, replies:[{ id, user:{id,name}, text, createdAt }] }])
  // 涉及：Comment { post, parent, user, name, text, createdAt }，parent 为空=一级，指向父评论=二级
  // 写法提示：
  //   · parent 为空是一级评论；parent 指向某条一级评论 id 就是它的二级回复
  //   · 把树拼好再返回，别把一维数组拍平丢给前端（前端按 replies 渲染）
  return fail(res, '接口还没实现', 501);
});

// 清单 #13：POST /api/posts/:id/comments —— 评论 / 回复（auth）
router.post('/:id/comments', auth, async (req, res) => {
  // TODO(小喵) 评论 / 回复（auth）
  // 入参 body：{ text, parentId? }，带 parentId 就是二级回复
  // 出参：ok(res, { id }) 或返回建好的这条
  // 涉及：Comment
  // 写法提示：
  //   · new Comment({ post:req.params.id, parent:parentId||null, user:req.userId, name:req.user.name, text }).save()
  //   · parent 为空存 null（一级），有值存父评论 id
  return fail(res, '接口还没实现', 501);
});

// 清单 #11：POST /api/posts/:id/like —— 点赞切换（auth）
router.post('/:id/like', auth, async (req, res) => {
  // TODO(小喵) 点赞切换（auth）
  // 入参：params.id
  // 出参：ok(res, { liked:<Boolean>, likes:<Number> })  —— 返回切换后状态和最新点赞数
  // 涉及：Post.likeUsers
  // 写法提示：$addToSet / $pull 一行搞定切换，不用先查再判断
  //   · 先 findOne 看 likeUsers 是否含 req.userId → 含则 $pull 否则 $addToSet
  //   · 更新后回来 likes = 新长度，liked = 是否含自己
  return fail(res, '接口还没实现', 501);
});

// 清单 #12：POST /api/posts/:id/collect —— 收藏切换（auth）
router.post('/:id/collect', auth, async (req, res) => {
  // TODO(小喵) 收藏切换（auth）
  // 入参：params.id
  // 出参：ok(res, { collected:<Boolean>, collects:<Number> })
  // 涉及：Post.collectUsers，思路和 like 完全一致
  return fail(res, '接口还没实现', 501);
});

module.exports = router;
