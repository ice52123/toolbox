<div align="center">

<img src="./docs/logo.svg" alt="CampusToolBox" width="112" height="112" />

# 校园工具箱 · CampusToolBox

**22 个纯浏览器端在线工具 + MySQL / MongoDB 双后端 + qiankun 微前端的校园社区与闲置市场**

一个能真正跑起来的全栈练手项目：打开即用、不上传文件、PC 与手机同一套代码。

`English · 简体中文`

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Vue](https://img.shields.io/badge/Vue-3.4-%234fc08d)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff)](https://vitejs.dev/)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-2.7-409eff)](https://element-plus.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D18-339933)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479a1)](https://www.mysql.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8-47a248)](https://www.mongodb.com/)

</div>

---

## ✨ 它是什么

| | |
| --- | --- |
| 🧰 **在线工具箱** | 22 个工具全部在浏览器里跑：JSON 格式化、时间戳、Base64、哈希、进制、正则、JWT、图片压缩/转换/水印、PDF 合并/拆分、密码生成、UUID、颜色/单位换算、万年历、汇率、天气、快递、油价、公交 |
| 🏫 **校园微前端** | 主应用（工具箱 + 社区 + 订单 + 消息 + 好友）+ qiankun 子应用：已上线 `idle-market`（闲置市场），`campus-forum`(P3) / `message-center`(P5) 已注册占位 |
| 🌐 **多租户校园** | 顶部全局「校园切换器」，学校列表由后端 `/api/schools` 下发，内容按校区隔离（首页 / 社区 / 闲置 / 订单 / 消息 …） |
| 💬 **社交与交易** | 校园社区（板块 / 发帖 / 评论 / 点赞 / 收藏）、好友、私聊、订单闭环（下单 → 发货 → 收货 → 评价）、钱包、收货地址 |
| 🔌 **双后端** | `server`（MySQL，3201）与 `server-mongo`（MongoDB，3202），**接口契约一致，同一套前端可切换** |
| 📄 **接口清单** | 双后端已落地社区 / 订单 / 消息 / 聊天 / 好友 / 闲置 / 学校等模块接口（MySQL 版约 60+ 条、Mongo 版约 45+ 条），逐条说明见 [`docs/API-清单.md`](./docs/API-清单.md) |

> 这是练全栈做的项目，重点不在"功能多"，而在**清晰的扩展机制**：新增一个工具 = 写一个 Vue 组件 + 在注册表加一条，半小时上线。

---

## 🧱 技术栈

| 层 | 选型 |
| --- | --- |
| 前端（主应用） | Vue 3 + Vite 5 + Vue Router + Pinia + Element Plus + Less |
| 微前端 | qiankun（主应用 5173 挂载子应用 4200） |
| 后端（MySQL 版） | Node + Express + mysql2 + jsonwebtoken + multer + ioredis（可选） |
| 后端（Mongo 版） | Node + Express + mongoose + jsonwebtoken + multer + ioredis（可选） |
| 数据库 | MySQL 8 / MongoDB 8（任选其一，或都跑） |
| 前端工具能力 | Canvas（图片处理）、pdf-lib（PDF）、Web Crypto（哈希/JWT） |

---

## 🚀 快速开始

### 1. 装依赖

```bash
npm install --prefix client          # 前端主应用
npm install --prefix idle-market     # 闲置市场子应用
npm install --prefix server          # 后端 MySQL 版（3201）
npm install --prefix server-mongo    # 后端 MongoDB 版（3202）
```

> 若 esbuild 等原生包报 `could not be found`，补装平台包即可：
> `npm install @esbuild/win32-x64@0.21.5 --prefix client --no-save`

### 2. 建库（仅 MySQL 版需要）

```bash
mysql -uroot -padmin123 -e "CREATE DATABASE IF NOT EXISTS toolbox CHARACTER SET utf8mb4;"
mysql -uroot -padmin123 --default-character-set=utf8mb4 toolbox < server/sql/init.sql
```

MongoDB 版不用建库，连上自动建集合。Redis **可以忽略**，没装时自动降级直连数据库。

### 3. 启动

> **⚠️ MySQL 数据目录固定用 `data2`**：本项目 MySQL 数据在 **`F:\tools\mysql\data2`**（root 密码 `admin123`，库名 `toolbox`，utf8mb4）。
> **禁止**用 Windows 服务 `MySQL267`，也**禁止**初始化/连接 `F:\tools\mysql\data\Data` —— 那是一份早期空库（仅 4 个用户），一旦它占住 3306，前端就会连到“数据变没”的旧库。
> 已禁用 `MySQL267` 服务；本机 MySQL 服务权限问题用「命令行直启 data2」绕开，无需服务。

**一键启动（推荐）**：双击根目录 `start-all.bat`，自动拉起 MySQL(data2) → Redis → 后端(3201) → 前端(5173) → 闲置市场(4200)。

手动启动：

```bash
# MySQL（data2 目录，命令行直启，不用服务）
F:\tools\mysql\bin\mysqld.exe --console --basedir=F:\tools\mysql --datadir=F:\tools\mysql\data2 --port=3306 --character-set-server=utf8mb4

# Redis（可选，未安装时后端自动降级）
F:\tools\Redis\redis-server.exe --port 6379

node server/app.js          # 后端 MySQL 版  → http://localhost:3201
node server-mongo/app.js    # 后端 MongoDB 版 → http://localhost:3202

cd client && npm run dev        # 主应用        → http://localhost:5173
cd idle-market && npm run dev   # 闲置市场子应用 → http://localhost:4200
```

前端开发服务器已配好 `/api` 代理，默认打到 3201；想测 Mongo 版，改 `client/vite.config.js` 里的 target 为 `3202` 即可。

> **开发并行启动**：在 `client/` 下跑 `npm run dev:all`（或 `npm run dev:daemon` 后台模式），会并行拉起主应用、闲置市场、双后端，省去逐个开窗口。
>
> **生产 / 沙箱同源托管**：`node serve.mjs` 把主站（`web/main`）与子应用（`web/idle`）合并到同一个端口（qiankun 在公网下要求同源）。产物先由 `node scripts/sync-build.mjs` 从各 `dist` 同步到 `web/`。

### 4. 端口一览

| 服务 | 端口 | 说明 |
| --- | --- | --- |
| 前端主应用 | 5173 | Vue 3，含社区 / 订单 / 消息 / 好友 / 钱包 / 关于 / 路线图 |
| 闲置市场子应用 | 4200 | qiankun 子应用 `idle-market`，独立可跑 |
| 校园社区子应用（占位） | 4300 | `campus-forum`，P3 阶段拆分后启用 |
| 消息中心子应用（占位） | 4400 | `message-center`，P5 阶段拆分后启用 |
| 后端 MySQL 版 | 3201 | 用户 / 工具 / 上传 / 学校 / 首页 / 社区 / 帖子 / 个人 / 闲置 / 订单 / 消息 / 聊天 / 好友 |
| 后端 MongoDB 版 | 3202 | 同上契约一致的 Mongo 实现 |

打开 http://localhost:5173 即可。

---

## 🧰 在线工具箱（22 个）

全部**在浏览器端**处理，不依赖后端：输入内容 → 立刻出结果，复制即用。

| 类别 | 数量 | 工具 |
| --- | --- | --- |
| 文本 | 7 | JSON 格式化 · 时间戳转换 · Base64 编解码 · 哈希计算 · 进制转换 · 正则测试 · JWT 解析 |
| 实用 | 4 | 密码生成 · UUID 生成 · 颜色转换 · 单位换算 |
| 图片 | 3 | 图片压缩 · 格式转换 · 图片水印 |
| 文档 | 2 | PDF 合并 · PDF 拆分 |
| 生活 | 6 | 万年历 · 汇率换算 · 天气预报 · 快递查询 · 今日油价 · 公交查询 |

生活类（汇率 / 天气 / 快递 / 油价 / 公交）当前是**示例数据**，页面已标注；接口就绪后把 `client/src/config/mockData.js` 里的假数据换成就接口请求即可。

---

## 🧩 微前端（qiankun）

子应用在 `client/src/config/microApps.js` 注册，主应用通过 `client/src/views/MicroAppHost.vue` 通用宿主按路由 `/m/:app` 懒挂载；本地 dev 走 `devUrl`（子应用独立端口），公网部署经 `serve.mjs` 同源托管。

| 子应用 | key | 状态 | 说明 |
| --- | --- | --- | --- |
| `idle-market` | `idle` | ✅ 已上线 | 闲置市场：发布 / 列表 / 详情 / 订单 / 订单详情 / 订单列表 |
| `campus-forum` | `forum` | ⬜ 占位（P3） | 论坛：二手 / 互助 / 组队 / 吐槽 / 失物招领 |
| `message-center` | `message` | ⬜ 占位（P5） | 实时通知：回复 / 交易 / 系统消息 |

- 子应用既能被主应用嵌入，也能单独 `npm run dev` 独立运行。
- 子应用与后端共用 `/api` 前缀和同一套 JWT 鉴权。

---

## 🗺 研发路线（P1 → P6）

| 阶段 | 内容 | 状态 |
| --- | --- | --- |
| P1 | 主站壳与导航：微应用注册表 + 通用宿主、顶部导航、工具分类、闲置市场接入 | ✅ 完成 |
| P2 | 后端基座与用户中心：JWT 鉴权、注册登录、个人资料、我的发布 / 收藏、收货地址、钱包 | ✅ 完成 |
| P2.5 | 多租户校园：顶部「校园切换器」+ `/api/schools`，内容按校区隔离 | ✅ 完成 |
| P3 | 校园社区：板块与发帖、列表 / 详情 / 评论 / 点赞 / 收藏 / 搜索 | ✅ 完成 |
| P4 | 交易闭环：下单 / 订单状态机（pending → paid → shipping → done）、发货 / 收货 / 评价、闲置发布 | ✅ 完成 |
| P5 | 实时通知与社交：消息中心、好友、私聊（HTTP 接口已通；Socket.IO 实时推送待做） | 🔄 进行中 |
| P6 | 部署打磨：serve.mjs 同源托管 / 首屏与分包优化 / 埋点 | ⬜ 待做 |

> P1 ~ P4 以及多租户、好友、私聊均已落地：社区、订单、订单详情、评价、消息中心、好友、聊天、用户资料、钱包、地址、公告详情、校园切换等页面与双后端接口齐备。P5 的 HTTP 消息 / 聊天已通，Socket.IO 实时推送留待后续；生活类工具（汇率 / 天气 / 快递 / 油价 / 公交）仍为示例数据，替换 `client/src/config/mockData.js` 即接真接口。

---

## 🛠 如何新增一个工具

1. 在 `client/src/tools/` 下新建 `.vue` 组件（照抄 `JsonFormat.vue`）。
2. 打开 `client/src/config/tools.js`，在 `tools` 数组加一条：
   ```js
   { id: 'md5', name: 'MD5 计算', cat: 'text', icon: 'Lock', desc: '…',
     comp: () => import('@/tools/Md5.vue') }
   ```
3. 纯前端计算写在组件里；需要文件处理时，后端路由骨架已在 `server/routes/upload.js` 就位。

首页网格、搜索、分类、暗色主题、路由**全自动生效**，不用改别的地方。

---

## 📁 目录结构

```
toolbox/
├── client/                 # 主应用（Vue 3）
│   └── src/
│       ├── config/
│       │   ├── tools.js    #   ★ 工具注册表（扩展点）
│       │   ├── modules.js  #   顶部导航模块（含下拉 children）
│       │   ├── microApps.js#   qiankun 子应用注册表（idle / forum / message）
│       │   ├── schools.js  #   校园切换器学校列表（常量兜底，待接 /api/schools）
│       │   ├── boards.js   #   社区板块字典（key → 中文名 / 图标 / 描述）
│       │   └── mockData.js #   各页面的示例数据（生活类工具仍在用）
│       ├── layout/         # 顶栏（搜索 / 主题 / 登录 / 校园切换）+ 侧边分类
│       ├── views/          # Home / Tools / ToolView / Community / Orders /
│       │                   # Message / Me / Friends / Chat / Wallet / Address /
│       │                   # MyList / About / Roadmap / Notice / UserProfile / ...
│       ├── tools/          # 每个工具一个组件（22 个）
│       ├── stores/         # pinia：user / ui / school
│       └── utils/          # request(axios 拦截器带 school) / cloud / wallet / ...
├── idle-market/            # 闲置市场子应用（qiankun，4200）
├── server/                 # 后端 MySQL 版（用户/工具/上传/学校/首页/社区/
│   ├── db/mysql.js         #   连接池 + query/exec/transaction
│   ├── db/redis.js         #   带降级的 Redis 封装
│   ├── middlewares/        #   idempotency（写请求幂等去重）
│   ├── routes/             #   user / tool / upload / schools / home /
│   │                     #   community / posts / profile / goods / orders /
│   │                     #   messages / chats / friends
│   └── sql/init.sql        #   建库建表（含旧库字段自动补齐）
├── server-mongo/           # 后端 MongoDB 版（契约一致）
│   ├── db/mongo.js
│   ├── models/             #   User / School / ...
│   └── routes/             #   同上（user / tool / upload / schools / home /
│   │                     #   notice / community / post / profile / order /
│   │                     #   message / chat / good / favorite）
├── scripts/                # sync-build.mjs 等构建同步脚本
├── serve.mjs               # 生产/沙箱同源托管（合并主站 + 子应用到单端口）
├── start-all.bat / stop-all.bat  # 一键拉起 / 关闭（MySQL data2 + Redis + 后端 + 前端）
└── docs/                   # 文档
    ├── API-清单.md         #   双后端接口逐条说明（含多租户校园）
    ├── 技术文档.md          #   详细设计文档
    └── logo.svg
```

---

## ⚠️ 已知限制与 TODO

- MySQL 数据目录固定 `data2`（`F:\tools\mysql\data2`，root/admin123），已用命令行直启绕开本机服务权限问题；`MySQL267` 服务与 `data\Data` 旧库已弃用。写库类接口已端到端验证通过。
- 图片 / PDF 处理走浏览器端库，后端 `upload.js` 只搭了路由骨架（多图发布需改 `upload.array('files', 6)`，见 `docs/API-清单.md` 第 6 节）。
- Redis 未安装，工具使用排走访数据库实时聚合（量小无碍）；后端写请求已加幂等中间件 `middlewares/idempotency.js` 防重复提交。
- 多租户校园：`/api/schools` 后端尚未实现，前端用 `client/src/config/schools.js` 的 `FALLBACK_SCHOOLS` 常量兜底；`request.js` 拦截器已自动带 `?school=<id>`，后端接口按 `school` 隔离。
- 生活类工具（汇率 / 天气 / 快递 / 油价 / 公交）仍为 `mockData.js` 示例数据，接口就绪即替换；其余页面（社区 / 订单 / 消息 / 好友 / 闲置）已接后端。
- `campus-forum`(P3) 与 `message-center`(P5) 子应用仅注册占位，尚未拆分出独立子工程。
- 前端 Element Plus 全量引入，主包偏大，后续可按需引入 / 手动分包。

---

## 📄 开源协议

[MIT](./LICENSE) © CampusToolBox
