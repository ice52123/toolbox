const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { query, exec } = require('../db/mysql');
const config = require('../config');
const { ok, fail } = require('../utils/response');
const { auth } = require('../middlewares/auth');

// 头像上传：只收图片，文件名固定成 avatar-{userId}.{ext} 覆盖式写，
// 既不会堆垃圾文件，也避免两个用户撞名互相顶掉
const AVATAR_MAX = 5 * 1024 * 1024;
const IMG_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp' };
const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, config.upload.dir),
    filename: (req, file, cb) => cb(null, 'avatar-' + req.userId + (IMG_EXT[file.mimetype] || '.png'))
  }),
  limits: { fileSize: AVATAR_MAX },
  fileFilter: (req, file, cb) => cb(null, !!IMG_EXT[file.mimetype])
});
// multer 在中间件阶段就抛错（文件超限等），我们的 try/catch 拦不到，这里兜一下换个人话
const singleAvatar = (req, res, next) =>
  avatarUpload.single('file')(req, res, (err) => (err ? fail(res, '上传失败：图片不能超过 5MB') : next()));

router.post('/avatar', auth, singleAvatar, async (req, res) => {
  try {
    if (!req.file) return fail(res, '请选择图片文件');
    const url = '/files/' + path.basename(req.file.filename);
    await exec('UPDATE users SET avatar = ? WHERE id = ?', [url, req.userId]);
    return ok(res, { avatar: url }, '头像已更新');
  } catch (e) {
    return fail(res, '上传失败：' + e.message);
  }
});

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return fail(res, '用户名和密码必填');
    if (password.length < 6) return fail(res, '密码至少 6 位');
    const exists = await query('SELECT id FROM users WHERE username = ?', [username]);
    if (exists.length) return fail(res, '用户名已被注册');
    const hash = bcrypt.hashSync(password, 10);
    const result = await exec('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash]);
    return ok(res, { id: result.insertId }, '注册成功');
  } catch (e) {
    return fail(res, '注册失败：' + e.message);
  }
});

// —— 手机号验证码：演示环境没接短信通道，验证码只存本进程内存（5 分钟有效，一次即用）——
const codes = new Map();
const CODE_TTL = 5 * 60 * 1000;

function issueCode(phone) {
  const code = String(Math.floor(1000 + Math.random() * 9000));
  codes.set(phone, { code, expire: Date.now() + CODE_TTL });
  return code;
}
// 返回 null 表示通过，否则返回错误文案交给 fail()
function verifyCode(phone, input) {
  const rec = codes.get(phone);
  if (!rec) return '请先获取验证码';
  if (Date.now() > rec.expire) {
    codes.delete(phone);
    return '验证码已过期，请重新获取';
  }
  if (rec.code !== String(input == null ? '' : input).trim()) return '验证码不正确';
  codes.delete(phone); // 用过即焚
  return null;
}
const signToken = (id) => jwt.sign({ userId: id }, config.jwtSecret, { expiresIn: config.jwtExpire });

// 旧库升级用：users 表补 phone 列 + 唯一索引。幂等，失败只告警、不阻断启动。
async function ensurePhoneColumn() {
  try {
    const cols = await query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone'`
    );
    if (cols.length) return;
    await exec(
      'ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL DEFAULT NULL, ADD UNIQUE KEY uk_phone (phone)'
    );
    console.log('[migrate] users 表已补 phone 列（手机号登录就绪）');
  } catch (e) {
    console.warn('[migrate] 补 users.phone 失败，不影响启动：', e.message);
  }
}

// 一键登录 / 验证码登录共用：手机号存在就直接登录，不存在就自动开号。
// 返回 { token, username, id, isNew }，isNew=true 表示这次是顺手建的号。
async function openByPhone(phone) {
  const rows = await query('SELECT id, username FROM users WHERE phone = ?', [phone]);
  if (rows.length) {
    const u = rows[0];
    return { token: signToken(u.id), username: u.username, id: u.id, isNew: false };
  }
  // 没注册过：自动建号，用户名用手机号后四位，撞了就往后加数字
  let username = '同学' + phone.slice(-4);
  for (let n = 1; n < 50; n++) {
    const dup = await query('SELECT id FROM users WHERE username = ?', [username]);
    if (!dup.length) break;
    username = '同学' + phone.slice(-4) + n;
  }
  const hash = bcrypt.hashSync(String(Date.now()) + Math.random(), 10);
  const r = await exec(
    'INSERT INTO users (username, password, phone) VALUES (?, ?, ?)',
    [username, hash, phone]
  );
  return { token: signToken(r.insertId), username, id: r.insertId, isNew: true };
}

// 手机号 + 验证码：注册过直接登录，没注册过自动开号（验证码登录入口用）
router.post('/sms-login', async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!/^1[3-9]\d{9}$/.test(phone || '')) return fail(res, '手机号格式不对');
    const err = verifyCode(phone, code);
    if (err) return fail(res, err);

    const data = await openByPhone(phone);
    return ok(res, data, data.isNew ? '注册并登录成功' : '登录成功');
  } catch (e) {
    return fail(res, '登录失败：' + e.message);
  }
});

// —— 一键登录（本机号码，不弹验证码）——
// 真机要走运营商「号码认证服务」拿到真实手机号再调这个接口；
// 演示环境前端直接传号码，同样注册过即登录、没注册过自动开号。
router.post('/quick-login', async (req, res) => {
  try {
    const phone = String(req.body.phone || '').trim();
    if (!/^1[3-9]\d{9}$/.test(phone)) return fail(res, '手机号格式不对');
    const data = await openByPhone(phone);
    return ok(res, data, data.isNew ? '已帮你开通校园集账号' : '登录成功');
  } catch (e) {
    return fail(res, '登录失败：' + e.message);
  }
});

// 忘记密码：验过手机号 + 验证码，直接改密码（不要求用户名）
router.post('/reset-password', async (req, res) => {
  try {
    const { phone, code, password } = req.body;
    if (!/^1[3-9]\d{9}$/.test(phone || '')) return fail(res, '手机号格式不对');
    const err = verifyCode(phone, code);
    if (err) return fail(res, err);
    if (!password || password.length < 6) return fail(res, '新密码至少 6 位');

    const rows = await query('SELECT id FROM users WHERE phone = ?', [phone]);
    if (!rows.length) return fail(res, '该手机号还没注册过');
    const hash = bcrypt.hashSync(password, 10);
    await exec('UPDATE users SET password = ? WHERE phone = ?', [hash, phone]);
    return ok(res, null, '密码已重置');
  } catch (e) {
    return fail(res, '重置失败：' + e.message);
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return fail(res, '用户名和密码必填');
    const rows = await query('SELECT * FROM users WHERE username = ?', [username]);
    if (!rows.length) return fail(res, '用户不存在');
    const user = rows[0];
    if (!bcrypt.compareSync(password, user.password)) return fail(res, '密码错误');
    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: config.jwtExpire });
    return ok(res, { token, username: user.username, id: user.id });
  } catch (e) {
    return fail(res, '登录失败：' + e.message);
  }
});

// 当前用户
router.get('/me', auth, async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, username, nickname, avatar, created_at FROM users WHERE id = ?',
      [req.userId]
    );
    if (!rows.length) return fail(res, '用户不存在', 1, 404);
    return ok(res, rows[0]);
  } catch (e) {
    return fail(res, '查询失败：' + e.message);
  }
});

module.exports = router;
module.exports.ensurePhoneColumn = ensurePhoneColumn;
