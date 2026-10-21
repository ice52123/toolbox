// ── 首页 · 统计卡（Home.vue 三张卡）｜清单 #1｜鉴权：optional ──
// 【多租户 school 隔离】统计按 req.query.school（各校独立数字：tools/goods/users 均为当前校区）
// 提示：
//  · users 走 User.estimatedDocumentCount() 拿真实计数；
//  · tools / goods 这类「没有专门集合」的展示数字，建个 settings 集合存 config 字段即可，别硬编码；
//    嫌麻烦也可直接返回常量数组（首页这些数变化不频繁）
const express = require('express');
const router = express.Router();
const { ok, fail } = require('../utils/response');
const { optionalAuth } = require('../middlewares/auth');

// 清单 #1：GET /api/home/stats（游客/登录都可见）
router.get('/stats', optionalAuth, async (req, res) => {
  // TODO(小喵) 三条统计卡，返回数组（顺序即卡片顺序）：
  //   [{ key:'tools',  label:'在线工具', value:<Number>, unit:'个' },
  //    { key:'goods',  label:'校园闲置', value:<Number>, unit:'件' },
  //    { key:'users',  label:'在校同学', value:<Number>, unit:'人' }]
  // 入参：无（optionalAuth，登录/游客都行，这里用不到 req.userId）
  // 涉及：
  //   · users 计数 —— User.find({ school: req.query.school }).countDocuments() 拿「当前校区在校同学」（多租户：按 school 隔离）
  //   · tools / goods 展示数 —— 在 models/Settings.js 存一个文档，文档加 school 字段（全站级留空），按 req.query.school 取
  //   · tools / goods 展示数 —— 在 models/Settings.js 存一个文档
  //     { key:'home', value:{ tools:22, goods:0 } }，这里 Settings.findOne({ key:'home' }) 取；
  // 坑：value 必须是数字，别返回字符串；tools 数来自 settings 别从 users 凑；
  //     改完代码要重启 node 才生效（require 缓存会给你旧进程的假结果）
  return fail(res, '接口还没实现', 501);
});

module.exports = router;
