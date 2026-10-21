const express = require('express');
const router = express.Router();
const { ok, fail } = require('../utils/response');

// 板块枚举（接口版更灵活，前端切换器可据此渲染）
const BOARDS = [
  { key: 'general', name: '综合灌水' },
  { key: 'secondhand', name: '二手闲置' },
  { key: 'study', name: '学习互助' },
  { key: 'lost', name: '失物招领' },
  { key: 'help', name: '求助问答' },
  { key: 'job', name: '校园兼职' }
];

router.get('/boards', (req, res) => ok(res, BOARDS));

module.exports = router;
