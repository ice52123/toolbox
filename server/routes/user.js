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
    const { username, password, school } = req.body;
    if (!username || !password) return fail(res, '用户名和密码必填');
    if (password.length < 6) return fail(res, '密码至少 6 位');
    const exists = await query('SELECT id FROM users WHERE username = ?', [username]);
    if (exists.length) return fail(res, '用户名已被注册');
    const hash = bcrypt.hashSync(password, 10);
    const result = await exec('INSERT INTO users (username, password, code, school) VALUES (?, ?, ?, ?)', [username, hash, genCode(), school || null]);
    const code = (await query('SELECT code FROM users WHERE id = ?', [result.insertId]))[0]?.code;
    return ok(res, { id: result.insertId, code }, '注册成功');
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

// —— 6 位用户 ID（字母数字混合，唯一）——
// 去掉肉眼易混的 0/O/1/I/L，剩 29 个字符；29^6 ≈ 5.9 亿，个人项目撞键概率可忽略
const CODE_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
function genCode() {
  let s = '';
  for (let i = 0; i < 6; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}

// 旧库升级：users 补 code 列（6 位唯一ID）。分三步走幂等：
// ① 补列（不带唯一键，否则存量多行都是 '' 会直接违反唯一约束）
// ② 给 code 为空的老用户逐个回填（撞键就重生成，最多 20 次）
// ③ 回填完再加唯一索引。失败只告警、不阻断启动。
async function ensureUserCode() {
  try {
    const cols = await query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'code'`
    );
    if (!cols.length) {
      await exec("ALTER TABLE users ADD COLUMN code CHAR(6) NOT NULL DEFAULT ''");
      console.log('[migrate] users 表已补 code 列（6 位唯一用户ID）');
    }
    const missing = await query("SELECT id FROM users WHERE code = '' OR code IS NULL");
    for (const u of missing) {
      for (let i = 0; i < 20; i++) {
        try {
          await exec("UPDATE users SET code = ? WHERE id = ? AND (code = '' OR code IS NULL)", [genCode(), u.id]);
          break;
        } catch (e) {
          if (!/Duplicate entry/i.test(e.message)) throw e;
        }
      }
    }
    if (missing.length) console.log('[migrate] 已为 ' + missing.length + ' 位老用户回填 6 位用户ID');
    const idx = await query(
      `SELECT INDEX_NAME FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'uk_user_code'`
    );
    if (!idx.length) {
      await exec('ALTER TABLE users ADD UNIQUE KEY uk_user_code (code)');
      console.log('[migrate] users.code 唯一索引已就位');
    }
  } catch (e) {
    console.warn('[migrate] 补 users.code 失败，不影响启动：', e.message);
  }
}

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
async function openByPhone(phone, school) {
  const rows = await query('SELECT id, username, code FROM users WHERE phone = ?', [phone]);
  if (rows.length) {
    const u = rows[0];
    return { token: signToken(u.id), username: u.username, id: u.id, code: u.code, isNew: false };
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
    'INSERT INTO users (username, password, code, phone, school) VALUES (?, ?, ?, ?, ?)',
    [username, hash, genCode(), phone, school || null]
  );
  // 刚插入拿不到回读值，直接把生成的那份带回去（genCode 的值已落库）
  const code = (await query('SELECT code FROM users WHERE id = ?', [r.insertId]))[0]?.code;
  return { token: signToken(r.insertId), username, id: r.insertId, code, isNew: true };
}

// 手机号 + 验证码：注册过直接登录，没注册过自动开号（验证码登录入口用）
router.post('/sms-login', async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!/^1[3-9]\d{9}$/.test(phone || '')) return fail(res, '手机号格式不对');
    const err = verifyCode(phone, code);
    if (err) return fail(res, err);

    const data = await openByPhone(phone, req.query.school || req.body.school || null);
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
    const data = await openByPhone(phone, req.query.school || req.body.school || null);
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
    return ok(res, { token, username: user.username, id: user.id, code: user.code });
  } catch (e) {
    return fail(res, '登录失败：' + e.message);
  }
});

// 当前用户
router.get('/me', auth, async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, code, username, nickname, avatar, school, created_at FROM users WHERE id = ?',
      [req.userId]
    );
    if (!rows.length) return fail(res, '用户不存在', 1, 404);
    return ok(res, rows[0]);
  } catch (e) {
    return fail(res, '查询失败：' + e.message);
  }
});

// 我的发布：按 token 里的 userId 查，不走 ?owner= 参数。
// 两个原因不能继续用 /goods?owner=：
//   ① 那个接口只返回 status='on'，已下架的自己的商品就消失了（页面却要显示「已下架」标签）；
//   ② 它依赖前端传的用户 id，localStorage 里没存 tb_id（老会话 / 换入口登录）就传 0，永远查不到。
router.get('/me/goods', auth, async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, title, cat, price, images, place, cond, ways, owner_id, owner_name, status, created_at' +
      ' FROM goods WHERE owner_id = ? ORDER BY id DESC',
      [req.userId]
    );
    rows.forEach((g) => {
      try { g.images = JSON.parse(g.images); } catch { g.images = []; }
      try { g.ways = JSON.parse(g.ways); } catch { g.ways = []; }
      g.price = Number(g.price) || 0;
    });
    return ok(res, rows);
  } catch (e) {
    return fail(res, '查询我的发布失败：' + e.message);
  }
});

// 我的收藏：社区帖子（post_collects）+ 闲置商品（goods_fav）合并返回。
// 以前只查 goods_fav，用户在社区点了收藏，「我的」页收藏夹里永远看不到 —— 两套收藏各存各的表，
// 这里按 kind 区分（post / goods），统一按收藏时间倒序，前端据此跳不同详情页。
router.get('/me/favorites', auth, async (req, res) => {
  try {
    const goodsRows = await query(
      `SELECT g.id, g.title, g.cat, g.price, g.images, g.owner_name, g.school, f.created_at AS fav_at
       FROM goods_fav f JOIN goods g ON g.id = f.goods_id
       WHERE f.user_id = ?`,
      [req.userId]
    );
    const postRows = await query(
      `SELECT p.id, p.title, p.board_key, p.author_name, p.comments, c.created_at AS fav_at
       FROM post_collects c JOIN posts p ON p.id = c.post_id
       WHERE c.user_id = ?`,
      [req.userId]
    );

    const goods = goodsRows.map((g) => {
      let images = [];
      try { images = JSON.parse(g.images); } catch { images = []; }
      return {
        kind: 'goods',
        id: g.id,
        title: g.title,
        cat: g.cat,
        price: Number(g.price) || 0,
        owner_name: g.owner_name,
        images,
        created_at: g.fav_at
      };
    });
    const posts = postRows.map((p) => ({
      kind: 'post',
      id: p.id,
      title: p.title,
      board_key: p.board_key,
      author_name: p.author_name,
      comments: p.comments,
      created_at: p.fav_at
    }));

    const all = [...posts, ...goods].sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );
    return ok(res, all);
  } catch (e) {
    return fail(res, '查询收藏失败：' + e.message);
  }
});

module.exports = router;
module.exports.ensurePhoneColumn = ensurePhoneColumn;
module.exports.ensureUserCode = ensureUserCode;
