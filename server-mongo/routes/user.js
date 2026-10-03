const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const { ok, fail } = require('../utils/response');
const { auth } = require('../middlewares/auth');

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return fail(res, '用户名和密码必填');
    if (password.length < 6) return fail(res, '密码至少 6 位');
    if (await User.exists({ username })) return fail(res, '用户名已被注册');
    const hash = bcrypt.hashSync(password, 10);
    const user = await User.create({ username, password: hash });
    return ok(res, { id: String(user._id) }, '注册成功');
  } catch (e) {
    return fail(res, '注册失败：' + e.message);
  }
});

// 登录（密码默认 select:false，必须 .select('+password') 显式取出）
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return fail(res, '用户名和密码必填');
    const user = await User.findOne({ username }).select('+password');
    if (!user) return fail(res, '用户不存在');
    if (!bcrypt.compareSync(password, user.password)) return fail(res, '密码错误');
    const token = jwt.sign({ userId: String(user._id) }, config.jwtSecret, { expiresIn: config.jwtExpire });
    return ok(res, { token, username: user.username, id: String(user._id) });
  } catch (e) {
    return fail(res, '登录失败：' + e.message);
  }
});

// 当前用户
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return fail(res, '用户不存在', 1, 404);
    return ok(res, { id: String(user._id), username: user.username, nickname: user.nickname, avatar: user.avatar });
  } catch (e) {
    return fail(res, '查询失败：' + e.message);
  }
});

module.exports = router;
