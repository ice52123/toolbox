// ── 闲置市场（idle-market List/Detail/Publish.vue + 首页最新动态）｜清单 #4 #30-35 ──
// 【多租户 school 隔离】列表/latest 按 req.query.school 过滤；发布闲置把 school 存为当前校区
// 提示：
//  - 前端数据层现在在 idle-market/src/store.js 的 localStorage（key: campus_idle_items），整层换掉即可，页面代码不用动
//  - good = { title, price, cat, place, desc, images:[], owner(ref User), favUsers:[ObjectId], status, createdAt }
//  - 发布多图：前端先把图传 /api/upload/image 拿 URL 列表，再一起提交；上传接口目前是单文件 single('file')，多图要改 upload.array（/pdf 路由有现成 array 写法可抄）
//  - 编辑/删除校验 ownership：只有 owner 本人能动
//  - GET /latest 必须注册在 GET /:id 之前
const express = require('express');
const router = express.Router();
const { ok, fail } = require('../utils/response');
const { auth } = require('../middlewares/auth');

// 清单 #4：GET /api/goods/latest —— 首页「最新动态」（游客可见，必须注册在 /:id 之前）
router.get('/latest', async (req, res) => {
  // TODO(小喵) 首页「最新动态」
  // 入参：query.limit?（默认取前几条）
  // 出参：ok(res, [{ id, title, price, cat, place, owner:{id,name}, time }])
  //   · 字段对齐 mockData.latestGoods，前端首页直接换数据源
  //   · school 隔离（多租户）：find({ school: req.query.school }).sort({ createdAt:-1 }).limit(limit)（切校只看本校最新）
  // 涉及：Good；sort({ createdAt:-1 }).limit(limit)
  return fail(res, '接口还没实现', 501);
});

// 清单 #30：GET /api/goods?cat=&kw=&page=&pageSize= —— 列表（游客可见）
router.get('/', async (req, res) => {
  // TODO(小喵) 闲置列表（游客可见）
  // 入参：query.cat?（分类）/ kw?（关键词搜标题+描述）/ page / pageSize
  // 出参：ok(res, { list:[{ id, title, price, cat, place, images:[], owner:{id,name} }], total, page, pageSize })
  // 涉及：Good
  //   · kw 过滤同帖子：title/desc $or + $regex（记得 escapeRegExp）
  //   · school 隔离（多租户）：filter.school = req.query.school（切校只看本校闲置）
  //   · 分页返回 list+total（契约见清单第 0 节）
  return fail(res, '接口还没实现', 501);
});

// 清单 #32：POST /api/goods —— 发布（auth）
router.post('/', auth, async (req, res) => {
  // TODO(小喵) 发布闲置（auth）
  // 入参 body：{ title, price, cat, place, desc, images:[] }
  //   · images 是前端先调 /api/upload/image 拿到的 URL 数组，别在这接收文件
  //   · school 隔离（多租户）：发布把 school 存当前校区 —— school: req.query.school
  // 出参：ok(res, { id })
  // 涉及：Good；owner = req.userId（auth 中间件挂的）
  return fail(res, '接口还没实现', 501);
});

// 清单 #31：GET /api/goods/:id —— 详情（游客可见，多图）
router.get('/:id', async (req, res) => {
  // TODO(小喵) 闲置详情（游客可见，多图）
  // 入参：params.id
  // 出参：ok(res, { id, title, price, cat, place, desc, images:[], owner:{id,name,avatar}, createdAt })
  // 涉及：Good
  // 坑：先 isValidObjectId(id) 挡非法，否则 CastError → 500；找不到 404
  return fail(res, '接口还没实现', 501);
});

// 清单 #33：PUT /api/goods/:id —— 编辑（auth + owner）
router.put('/:id', auth, async (req, res) => {
  // TODO(小喵) 编辑闲置（auth + owner）
  // 入参 body：可改字段（title/price/cat/place/desc/images）
  // 出参：ok(res, { id })
  // 坑：先查 Good 确认 owner===req.userId，否则 403；再 updateOne
  return fail(res, '接口还没实现', 501);
});

// 清单 #34：DELETE /api/goods/:id —— 下架/删除（auth + owner）
router.delete('/:id', auth, async (req, res) => {
  // TODO(小喵) 下架/删除闲置（auth + owner）
  // 入参：params.id
  // 出参：ok(res, { deleted:true })
  // 坑：owner 校验同编辑；软删除可加 status 字段，硬删直接 deleteOne
  return fail(res, '接口还没实现', 501);
});

// 清单 #35：POST /api/goods/:id/fav —— 收藏切换（auth）
router.post('/:id/fav', auth, async (req, res) => {
  // TODO(小喵) 收藏切换（auth）
  // 入参：params.id
  // 出参：ok(res, { faved:<Boolean>, favCount:<Number> })
  // 涉及：Good.favUsers
  // 写法提示：$addToSet / $pull 切换，返回最新状态和收藏数（和帖子 like 一个套路）
  return fail(res, '接口还没实现', 501);
});

module.exports = router;
