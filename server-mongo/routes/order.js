// ── 交易 · 订单（Orders.vue / OrderDetail.vue / OrderReview.vue）｜清单 #15-23｜鉴权：全 auth ──
// 【多租户 school 隔离】我的订单列表 / 下单均按 req.query.school 过滤与归属；订单属于发布时所在校区
// 提示：
//  - 状态机 pending → paid → shipping → done，外加 cancel 旁路。
//    状态常量单独放 utils/orderStatus.js（或同目录），前端 orderStatusMap 写死了这四个值，返回必须一致
//  - 记 order_logs { order, fromStatus, toStatus, note, createdAt }，详情页时间线直接查它
//  - 业务单号别用裸 ObjectId：SO + 日期 + 序号这种，前端展示和截图都好看
//  - 买家/卖家视角：前端按 seller 分「买到的 / 卖出的」，查的时候 $or 两个条件都给
//  - 支付类接口本轮明确不做（清单第 8 节），别顺手加 pay
// 涉及待建模型：Order(buyerId,sellerId,goodsId,title,price,status,createdAt)、
//              OrderLog(order,fromStatus,toStatus,note,createdAt)、OrderReview(order,userId,ratings,tags,text)
const express = require('express');
const router = express.Router();
const { ok, fail } = require('../utils/response');
const { auth } = require('../middlewares/auth');

// 清单 #15：GET /api/orders?status= —— 我的订单列表（买到的 + 卖出的）
router.get('/', auth, async (req, res) => {
  // TODO(小喵) 我的订单列表（买到的 + 卖出的）
  // 入参：query.status?（pending/paid/shipping/done/cancel）
  // 出参：ok(res, { list:[{ id, title, price, status, role:'buyer'|'seller', createdAt }], total, page, pageSize })
  // 涉及：Order（buyerId, sellerId 都存）
  // 写法提示：
  //   · 自己的订单：$or:[{ buyerId:req.userId }, { sellerId:req.userId }]
  //   · school 隔离（多租户）：订单归属发布时校区，查的时候再 and { school: req.query.school }（下单时存 school，见 POST /）
  //   · status 过滤下推进条件；role 字段前端按 buyer/seller 分「买到的/卖出的」
  return fail(res, '接口还没实现', 501);
});

// 清单 #17：POST /api/orders —— 下单 body: { goodsId, title, price }
router.post('/', auth, async (req, res) => {
  // TODO(小喵) 下单（auth）
  // 入参 body：{ goodsId, title, price }
  // 出参：ok(res, { id }) 或返回建好的订单
  // 涉及：Order + OrderLog（状态时间线）；状态机见文件头
  // 写法提示：
  //   · 初始 status = 'pending'（见 utils/orderStatus.js 常量，别写字符串散落各处）
  //   · 写第一条 OrderLog：{ order, fromStatus:null, toStatus:'pending', note:'创建订单' }
  //   · goodsId 最好校验 Good 存在，不存在 fail 掉；price 以入参为准（别信前端也行，自己查 Good）
  //   · school 隔离（多租户）：下单把 school 存为当前校区 —— school: req.query.school
  return fail(res, '接口还没实现', 501);
});

// 清单 #22：GET /api/orders/:id/review-form —— 评价页数据，必须注册在 /:id 之前
router.get('/:id/review-form', auth, async (req, res) => {
  // TODO(小喵) 评价页数据（必须注册在 /:id 之前）
  // 入参：params.id
  // 出参：ok(res, { dims:[...], tags:[...], order:{ id,title,price,status } })
  // 涉及：dims / tags 常量在 client/src/config/mockData.js 的 reviewDims / reviewTags，后端照抄成常量返回
  //   · 加订单摘要（让前端评价页不用再单独调详情）
  //   · 校验 ownership（买家且 status==='done' 才能评），否则 404/403
  return fail(res, '接口还没实现', 501);
});

// 清单 #16：GET /api/orders/:id —— 详情 + 状态时间线
router.get('/:id', auth, async (req, res) => {
  // TODO(小喵) 订单详情 + 状态时间线
  // 入参：params.id
  // 出参：ok(res, { ...order, logs:[{ fromStatus, toStatus, note, createdAt }] })
  // 涉及：Order + OrderLog
  // 坑：只有买家/卖家本人能看，别的 id 直接 404（别漏 ownership 校验）
  return fail(res, '接口还没实现', 501);
});

// 清单 #18：POST /api/orders/:id/cancel —— 取消（限 pending）
router.post('/:id/cancel', auth, async (req, res) => {
  // TODO(小喵) 取消订单（限 pending）
  // 入参：params.id
  // 出参：ok(res, { status:'cancel' })
  // 状态机：pending → cancel
  // 坑：先查订单确认 status==='pending' 才放行，否则 fail(res,'当前状态不可取消',400)
  //   · 同时写一条 OrderLog 记录这次变更
  return fail(res, '接口还没实现', 501);
});

// 清单 #19：POST /api/orders/:id/remind —— 提醒发货
router.post('/:id/remind', auth, async (req, res) => {
  // TODO(小喵) 提醒发货（买家操作）
  // 入参：params.id
  // 出参：ok(res, { reminded:true })
  // 逻辑：给卖家发一条消息（Message），等消息接口做完后联动写入 messages 集合
  //   · 校验自己是买家；重复提醒可加冷却（可选）
  return fail(res, '接口还没实现', 501);
});

// 清单 #20：POST /api/orders/:id/ship —— 发货 body: { sn 快递单号 }
router.post('/:id/ship', auth, async (req, res) => {
  // TODO(小喵) 发货（卖家操作）
  // 入参 body：{ sn } 快递单号
  // 出参：ok(res, { status:'shipping' })
  // 状态机：paid → shipping
  // 坑：校验自己是卖家且 status==='paid'；写 OrderLog（note 可带 sn）
  return fail(res, '接口还没实现', 501);
});

// 清单 #21：POST /api/orders/:id/receive —— 确认收货
router.post('/:id/receive', auth, async (req, res) => {
  // TODO(小喵) 确认收货（买家操作）
  // 入参：params.id
  // 出参：ok(res, { status:'done' })
  // 状态机：shipping → done
  // 坑：校验自己是买家且 status==='shipping'
  return fail(res, '接口还没实现', 501);
});

// 清单 #23：POST /api/orders/:id/review —— 提交评价 body: { ratings:{desc,attitude,logistics}, tags[], text }
router.post('/:id/review', auth, async (req, res) => {
  // TODO(小喵) 提交评价（auth）
  // 入参 body：{ ratings:{ desc, attitude, logistics }, tags:[], text }
  // 出参：ok(res, { id })
  // 涉及：OrderReview（{ order, userId, ratings, tags, text }）
  // 坑：
  //   · 仅 status==='done' 可评
  //   · 一人一单一条：OrderReview 上加 { order:1, userId:1 } 唯一索引，重复提交会 E11000，catch 掉返回「已评价」
  //   · 评完可以把订单标记 reviewed（可选）
  return fail(res, '接口还没实现', 501);
});

module.exports = router;
