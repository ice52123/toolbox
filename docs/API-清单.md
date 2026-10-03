# CampusHub 接口清单（待写）

> 前端页面已按 mock 全部跑通，本文件是**待写后端接口的完整清单**。
> 目标：写一条 → 前端换一条数据源 → 划掉一条。
> 双后端并行：`server/`(MySQL, :3201) 与 `server-mongo/`(MongoDB, :3202) 契约一致。

## 0. 全局约定（新接口必须遵守）

| 项 | 约定 |
|---|---|
| baseURL | `/api` |
| 成功 | `{ code: 0, message: 'success', data }` |
| 失败 | `{ code != 0, message, data: null }`，HTTP 状态码统一 200（除鉴权 401） |
| 鉴权 | `Authorization: Bearer <token>`；中间件 `auth`（强制登录）/ `optionalAuth`（游客可用） |
| token | `{ userId }`，7 天，存前端 `localStorage.tb_token` |
| 分页 | query 传 `page` / `pageSize`；返回 `{ list, total, page, pageSize }` |
| 统一响应 | 走 `server/utils/response.js` 的 `ok(res, data)` / `fail(res, msg, code, status)` |

⚠️ 前端 `axios` 拦截器只认 `code === 0` 当成功，返回体格式错一个字段整页就报错。

## 1. 现状盘点

### 后端已有（别重写）

`server/routes/user.js`

```
POST /user/register          POST /user/login
POST /user/sms-login         POST /user/quick-login
POST /user/reset-password    GET  /user/me          （auth）
POST /user/avatar            （auth，multer 5MB，jpeg/png/gif/webp）
```

`server/routes/tool.js`　`POST /history`(auth) · `GET /history`(auth) · `GET /rank`
`server/routes/upload.js`　`POST /image`(auth) · `POST /pdf`(auth)
`app.js`　`GET /api/health`

### 前端目前真调的只有 6 条

`stores/user.js` 的 login / register / sms-login / quick-login / reset-password + `Me.vue` 的 avatar。

> **两个不对称（容易误判，注意）**
> 1. `/api/tool/history`、`/api/tool/rank`、`/api/upload/*` 后端都写了，但**没有任何页面调用**。
> 2. `server-mongo/` 缺 4 条：`sms-login`、`quick-login`、`reset-password`、`avatar`（只有 MySQL 版有）。

### 数据表现状

`server/sql/init.sql` 只有 `users`、`tool_history` 两张表。
社区 / 订单 / 消息 / 闲置全部**还没有表**，第七章给了建表骨架。

---

## 2. 首页 · 公告（Home.vue / Notice.vue）

| # | 接口 | 鉴权 | 消费页面 |
|---|---|---|---|
| 1 | `GET /api/home/stats` | optional | 首页三张统计卡 |
| 2 | `GET /api/notices?tag=` | 否 | 首页公告滚动条 + 公告中心列表 |
| 3 | `GET /api/notices/:id` | 否 | 公告详情 |
| 4 | `GET /api/goods/latest` | 否 | 首页「最新动态」 |
| 5 | `GET /api/posts/hot?limit=` | 否 | 首页「热门帖子」 |

- MySQL：`notices(id, tag, title, date, content)`；统计可用 `COUNT(*)` 聚合或常量表。
- Mongo：`notices` collection；stats 建议做成文档里写死的配置字段，不必聚合。

## 3. 校园社区（P3 · Community / PostDetail / UserProfile）

| # | 接口 | 鉴权 | 说明 |
|---|---|---|---|
| 6 | `GET /api/community/boards` | 否 | 板块枚举（也可前端常量，接口版更灵活） |
| 7 | `GET /api/posts?board=&q=&sort=&page=&pageSize=` | 否 | 列表；`q` 搜索标题正文 |
| 8 | `GET /api/posts/:id` | 否 | 详情（含 body、作者、评论数） |
| 9 | `GET /api/posts/:id/comments` | 否 | 评论列表 + 二级回复 |
| 10 | `POST /api/posts` | auth | 发帖，body: title/board/body/tags[] |
| 11 | `POST /api/posts/:id/like` | auth | 切换点赞 |
| 12 | `POST /api/posts/:id/collect` | auth | 切换收藏 |
| 13 | `POST /api/posts/:id/comments` | auth | 评论 / 回复 |
| 14 | `GET /api/users/:nickname/profile` | optional | 个人主页：档案 + TA 的帖子 |

**MySQL 表**
```sql
posts(id, board_key, title, body, author_id, author_name, views, likes, created_at)
post_tags(id, post_id, tag)
post_comments(id, post_id, parent_id, user_id, name, text, created_at)
```
> `post_tags` 拆表别图省事塞 VARCHAR —— 首页要按 tag 过滤，逗号分隔查询必踩坑。
> `views` 用 `UPDATE ... SET views = views + 1` 原子自增，别先查后写。

**Mongo**
```js
posts: { board, title, body, author: ObjectId, views, likeUsers: [ObjectId], tags: [] }
comments: { post: ObjectId, user, text, parent: ObjectId }
```
> 点赞走 `likeUsers` 数组，`$addToSet` / `$pull` 一行搞定切换，比 MySQL 的关联表轻。

## 4. 交易闭环（P4 · Orders / OrderDetail / OrderReview）

> **支付类接口本轮不做**，见第 8 节。

| # | 接口 | 鉴权 | 说明 |
|---|---|---|---|
| 15 | `GET /api/orders?status=` | auth | 我的订单列表（前端按 seller 分「买到的/卖出的」） |
| 16 | `GET /api/orders/:id` | auth | 详情 + 状态时间线 |
| 17 | `POST /api/orders` | auth | 下单 body: goodsId / title / price |
| 18 | `POST /api/orders/:id/cancel` | auth | 取消（限 pending） |
| 19 | `POST /api/orders/:id/remind` | auth | 提醒发货 |
| 20 | `POST /api/orders/:id/ship` | auth | 发货，body: `sn` 快递单号 |
| 21 | `POST /api/orders/:id/receive` | auth | 确认收货 |
| 22 | `GET /api/orders/:id/review-form` | auth | 评价页：dims + tags + 订单摘要 |
| 23 | `POST /api/orders/:id/review` | auth | 提交评价 body: `ratings{desc,attitude,logistics}` / `tags[]` / `text` |

**MySQL 表**
```sql
orders(id, buyer_id, seller_id, title, price, status, created_at)   -- id 是业务单号如 SO2026100301
order_logs(id, order_id, from_status, to_status, note, created_at)  -- 详情页时间线
order_reviews(id, order_id, user_id, ratings, tags, text, created_at)
```

**状态机（重要，别写散在业务里）**
`pending → paid → shipping → done`，加上 `cancel` 旁路。
建议单独维护一张 `order_status` 映射表或常量文件，前端 `orderStatusMap` 已经写死这四个值，后端返回必须一致，否则页面状态文案对不上。

## 5. 消息与聊天（P5 · Message / Chat / 导航红点）

| # | 接口 | 鉴权 | 说明 |
|---|---|---|---|
| 24 | `GET /api/messages?type=` | auth | 消息列表（type: reply/trade/system/follow） |
| 25 | `POST /api/messages/:id/read` | auth | 单条标已读 |
| 26 | `GET /api/messages/unread-count` | auth | **导航红点专用**，轻接口别拉全量 |
| 27 | `GET /api/chats` | auth | 会话列表（含 lastMsg、unread） |
| 28 | `GET /api/chats/:id/messages?cursor=` | auth | 聊天记录分页 |
| 29 | `POST /api/chats/:id/messages` | auth | 发消息 |

**后续（本轮可不写，留给 P5 实时）**：Socket.IO `chat/:roomId` 连接、`message` / `notify` 事件、离线消息补偿。
消息量上来后**聊天记录建议只放 Mongo**（写入密集），消息中心列表放 MySQL 也行，两边都给方案。

**MySQL**：`messages(id, user_id, type, title, from_user, ref_type, ref_id, unread, created_at)` ·
`conversations(id, type, name, last_msg, unread, updated_at)` · `chat_messages(id, conv_id, sender_id, text, created_at)`
**Mongo**：`messages{P2}` · `conversations(participants[])` · `chat_messages(conversation, sender, text)`

## 6. 闲置市场（子应用 idle-market · List / Detail / Publish）

数据层现在写死在 `idle-market/src/store.js` 的 `localStorage`（key `campus_idle_items`），整层换掉即可，页面代码不用动。

| # | 接口 | 鉴权 | 说明 |
|---|---|---|---|
| 30 | `GET /api/goods?cat=&kw=&page=&pageSize=` | 否 | 列表 |
| 31 | `GET /api/goods/:id` | 否 | 详情（多图） |
| 32 | `POST /api/goods` | auth | 发布，图片先走 `/api/upload/image` 拿 URL |
| 33 | `PUT /api/goods/:id` | auth + owner | 编辑 |
| 34 | `DELETE /api/goods/:id` | auth + owner | 下架 / 删除 |
| 35 | `POST /api/goods/:id/fav` | auth | 收藏切换 |
| 36 | `GET /api/user/me/favorites` | auth | 我的收藏 |

⚠️ 发布多图：前端现在是 `multer` 单文件 `upload.single('file')`，多图要改成 `upload.array('files', 6)`（`upload.js` 的 `/pdf` 已经是 array 写法，照抄）。

## 7. 工具侧补接（后端已有，前端没接）

| # | 事项 | 说明 |
|---|---|---|
| 37 | 前端接 `POST/GET /api/tool/history` | 工具页加「最近使用」；`auth` 强制登录 |
| 38 | 前端接 `POST /api/upload/image` | 图片类三工具（压缩/转换/水印）才能上线 |
| 39 | 前端接 `POST /api/upload/pdf` | PDF 合并 / 拆分才能上线 |

> 22 个工具里**只有 6 个有组件**（json / timestamp / base64 / calendar / exchange / weather），
> 其余 15 个在 `tools.js` 里标了 `wip: true`，是 `ToolPlaceholder.vue` 占位页。
> 这 15 个要写**前端组件**，`needBackend: true` 的那 5 个（图片 3 + PDF 2）才依赖第 38/39 条。

## 8. 本轮明确不做

- `POST /api/orders/:id/pay` 支付沙箱下单
- `POST /api/pay/callback` / `POST /api/pay/notify` 支付回调
- 退款 / 售后 / 投诉工单
- Socket.IO 实时推送（第 5 节标注的后续项，等消息接口先稳）

---

## 9. 建议的书写顺序

1. **第 7 节**（3 条）—— 纯接现有接口，零建表，先跑通「后端有前端没接」的欠账。
2. **第 2 节**（5 条）—— 首页立刻能换真数据，反馈最快。
3. **第 3 节社区**（9 条）—— 表最多最绕，趁早踩坑。
4. **第 4 节订单**（9 条）—— 状态机是重点。
5. **第 6 节闲置**（7 条）—— 子应用联调，注意 4200 端口。
6. **第 5 节消息**（6 条）—— 最后做，实时推送依赖它。

## 10. 环境提醒

- MySQL 版：`net start MySQL267` 目前报「系统错误 5 · 拒绝访问」，根因是 `F:\tools\mysql\data\Data` 权限，
  不修好写完也跑不通。
- Mongo 版：`mongodb://127.0.0.1:27017/toolbox`，8.2.12 已装。
- 前端 axios 实例在 `client/src/utils/request.js`，只挂了 `/api` 前缀，新接口直接加路径即可。
