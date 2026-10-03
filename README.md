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
| 🏫 **校园微前端** | 主应用（工具箱 + 社区 + 订单 + 消息）+ qiankun 子应用 `idle-market`（闲置市场：发布 / 列表 / 详情） |
| 🔌 **双后端** | `server`（MySQL，3201）与 `server-mongo`（MongoDB，3202），**接口契约一致，同一套前端可切换** |
| 📄 **接口清单** | 39 条接口逐条写明请求参数、响应结构、状态机，见 [`docs/API-清单.md`](./docs/API-清单.md) |

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

```bash
node server/app.js          # 后端 MySQL 版  → http://localhost:3201
node server-mongo/app.js    # 后端 MongoDB 版 → http://localhost:3202

cd client && npm run dev        # 主应用        → http://localhost:5173
cd idle-market && npm run dev   # 闲置市场子应用 → http://localhost:4200
```

前端开发服务器已配好 `/api` 代理，默认打到 3201；想测 Mongo 版，改 `client/vite.config.js` 里的 target 为 `3202` 即可。

### 4. 端口一览

| 服务 | 端口 | 说明 |
| --- | --- | --- |
| 前端主应用 | 5173 | Vue 3，含社区 / 订单 / 消息 / 关于 / 路线图 |
| 闲置市场子应用 | 4200 | qiankun 子应用，独立可跑 |
| 后端 MySQL 版 | 3201 | 12 条接口 |
| 后端 MongoDB 版 | 3202 | 8 条接口 |

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

## 🧩 微前端：闲置市场（idle-market）

- 主应用通过 qiankun 注册并挂载子应用，子应用既能被主应用嵌入，也能单独 `npm run dev` 独立运行。
- 页面：发布（Publish）· 列表（List）· 详情（Detail），当前用 CSS，下一步迁 Less。
- 子应用与后端共用 `/api` 前缀和同一套 JWT 鉴权。

---

## 🗺 研发路线（P1 → P6）

| 阶段 | 内容 | 状态 |
| --- | --- | --- |
| P1 | 主站壳与导航：微应用注册表 + 通用宿主、顶部导航、工具分类、闲置市场接入 | ✅ 完成 |
| P2 | 后端基座与用户中心：JWT 鉴权、注册登录、个人资料、我的发布 / 收藏 | 🔄 进行中 |
| P3 | 校园社区：板块与发帖、列表 / 详情 / 搜索 | ⬜ 页面已写，接后端 |
| P4 | 交易闭环：下单 / 订单状态机（pending → paid → shipping → done）、评价 | ⬜ 页面已写，接后端 |
| P5 | 实时通知：Socket.IO 房间推送、未读红点联动 | ⬜ 待做 |
| P6 | 部署打磨：Docker / Nginx、首屏与分包优化、埋点 | ⬜ 待做 |

> P1、P2 相关的页面（社区、订单、订单详情、评价、消息中心、关于、路线图、用户资料、公告详情）都已落地，数据目前走 `mockData.js`，后端就绪即替换。

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
│       ├── config/tools.js # ★ 工具注册表（扩展点）
│       ├── config/mockData.js  # 各页面的示例数据
│       ├── layout/         # 顶栏（搜索 / 主题 / 登录）+ 侧边分类
│       ├── views/          # Home / Tools / ToolView / Community / Orders /
│       │                   # Message / Me / About / Roadmap / Notice / ...
│       ├── tools/          # 每个工具一个组件（22 个）
│       ├── micro/          # qiankun 注册与通用宿主
│       └── stores/         # pinia：user / theme
├── idle-market/            # 闲置市场子应用（qiankun，4200）
├── server/                 # 后端 MySQL 版（12 条接口）
│   ├── db/mysql.js         #   连接池 + query/exec/transaction
│   ├── db/redis.js         #   带降级的 Redis 封装
│   ├── routes/             #   user / tool / upload
│   └── sql/init.sql        #   建库建表
├── server-mongo/           # 后端 MongoDB 版（8 条接口，契约一致）
│   ├── db/mongo.js
│   ├── models/             #   User / History
│   └── routes/             #   同上
└── docs/                   # 文档
    ├── API-清单.md         #   39 条接口逐条说明
    └── logo.svg
```

---

## ⚠️ 已知限制与 TODO

- MySQL 本机权限还没修好（`net start MySQL267` 报错误 5），写库类接口尚未端到端验证。
- 图片 / PDF 处理走浏览器端库，后端 `upload.js` 只搭了路由骨架。
- Redis 未安装，工具使用排行走数据库实时聚合（量小无碍）。
- P3 ~ P6 页面数据来自 `mockData.js`，接口打通后逐页替换。
- 前端 Element Plus 全量引入，主包偏大，后续可按需引入 / 手动分包。

---

## 📄 开源协议

[MIT](./LICENSE) © CampusToolBox
