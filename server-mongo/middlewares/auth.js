// 鉴权中间件（与 MySQL 版保持一致）
const jwt = require('jsonwebtoken');
const config = require('../config');

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ code: 401, message: '请先登录', data: null });
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.userId = payload.userId;
    next();
  } catch (e) {
    return res.status(401).json({ code: 401, message: '登录已过期', data: null });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      req.userId = payload.userId;
    } catch (e) { /* 无效 token 忽略 */ }
  }
  next();
}

module.exports = { auth, optionalAuth };
