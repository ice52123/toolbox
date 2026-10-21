// 接口防重（幂等）中间件。
//
// 解决的问题：用户连点「发布 / 下单 / 发消息 / 加好友」等写操作，前端还没禁掉按钮时，
// 后端可能收到两份一模一样的请求，于是创建出两条重复数据（重复帖子、重复订单…）。
//
// 策略（双层）：
//   1) 客户端带上 X-Idempotency-Key 时，直接用这个键去重（适合「重试同一操作」场景）。
//   2) 否则只对「创建类」白名单接口，用 sha1(userId + method + path + body) 做内容指纹，
//      5 秒内相同指纹 = 误触重复提交，直接去重（并发的拦下返回 429，已完成的重放返回首次结果）。
//
// 为什么是白名单而不是全量？因为「点赞 / 收藏 / fav」这类切换接口，相同 body 代表的是
// 「点赞」和「取消点赞」两种相反语义，不能按 body 去重；聊天发同一句话是正常操作也不能去重。
// 所以只挑「创建型」接口做内容指纹去重，其余接口只有在客户端显式传幂等键时才去重。
//
// 存储后端：优先 Redis（多实例共享、天然 TTL 过期），Redis 不可用（没装 / 挂了）时自动降级到
// 进程内内存 Map，保证服务不挂。两种路径行为一致。

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { fail } = require('../utils/response');
const redis = require('../db/redis');

const CACHE_TTL = 5000; // 5 秒内相同请求视为重复
const TTL_SEC = Math.ceil(CACHE_TTL / 1000);

// key -> true：正在处理中（并发重复直接拦）
const processing = new Map();
// key -> { ts, result }：已完成的成功响应（重放时直接回放，保证幂等）
const doneCache = new Map();

// 受保护的「创建类」接口：相同内容 5s 内重复提交视为误触。
const BODY_HASH_PATHS = [
  /^\/api\/posts$/,                       // 发帖
  /^\/api\/posts\/[^/]+\/comments$/,      // 评论 / 回复
  /^\/api\/goods$/,                       // 发布闲置
  /^\/api\/orders$/,                      // 下单
  /^\/api\/orders\/[^/]+\/review$/,       // 提交评价
  /^\/api\/friends$/,                     // 加好友申请
  /^\/api\/user\/register$/,              // 注册
  /^\/api\/user\/sms-login$/,             // 验证码登录
  /^\/api\/user\/quick-login$/            // 一键登录
];

function isWrite(method) {
  return method === 'POST' || method === 'PUT' || method === 'DELETE';
}
function matchBodyHash(path) {
  return BODY_HASH_PATHS.some((re) => re.test(path));
}
// 尽量拿到 userId 拼进指纹，避免两个不同用户发了相同内容被互相去重
function uidOf(req) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer\s+(.+)$/);
  if (!m) return 'anon';
  try {
    const p = jwt.decode(m[1]);
    return 'u' + (p && p.userId != null ? p.userId : 'anon');
  } catch {
    return 'anon';
  }
}
function computeKey(req) {
  const clientKey = req.headers['x-idempotency-key'];
  if (clientKey) return 'k:' + String(clientKey).slice(0, 128);
  if (matchBodyHash(req.path)) {
    const body = JSON.stringify(req.body && typeof req.body === 'object' ? req.body : {});
    const bh = crypto.createHash('sha1').update(body).digest('hex');
    return 'b:' + uidOf(req) + '|' + req.method + '|' + req.path + '|' + bh;
  }
  return null; // 不在保护范围、也没传幂等键 → 不去重
}

// 内存降级版（Redis 不可用时的兜底，与旧版行为一致）
function memoryGuard(key, req, res, next) {
  const now = Date.now();
  const done = doneCache.get(key);
  if (done && now - done.ts < CACHE_TTL) {
    return res.json(done.result); // 重放 → 回放首次结果（幂等）
  }
  if (processing.has(key)) {
    return fail(res, '操作进行中，请勿重复提交', 1, 429);
  }
  // 同步加锁：Node 单线程下「检查 + 加锁」中间没有 await，并发重复请求会被这里拦下
  processing.set(key, true);

  const origJson = res.json.bind(res);
  res.json = (payload) => {
    // 只缓存成功的响应（code===0）；失败的当场放行，用户可以立刻重试
    if (payload && payload.code === 0) {
      doneCache.set(key, { ts: Date.now(), result: payload });
      setTimeout(() => {
        const d = doneCache.get(key);
        if (d && Date.now() - d.ts >= CACHE_TTL) doneCache.delete(key);
      }, CACHE_TTL + 1000);
    }
    processing.delete(key);
    return origJson(payload);
  };
  next();
}

// Redis 版：SET NX 原子锁（并发重复抢不到锁 → 429）+ done 缓存（重放首结果，TTL 自动过期）
async function redisGuard(key, req, res, next) {
  const doneKey = key + ':done';
  const lockKey = key + ':lock';

  // 1) 已完成？直接回放首次结果（幂等）
  const cached = await redis.get(doneKey);
  if (cached) {
    try {
      return res.json(JSON.parse(cached));
    } catch {
      /* 缓存损坏则继续往下走，重新处理 */
    }
  }

  // 2) 抢锁（SET key 1 NX EX ttl）。拿到 'OK' 才算独占，否则并发重复 → 429
  const got = await redis.setnx(lockKey, '1', TTL_SEC);
  if (got !== 'OK') {
    return fail(res, '操作进行中，请勿重复提交', 1, 429);
  }

  // 3) 处理完成后：成功则缓存首结果、无论成败都释放锁
  const origJson = res.json.bind(res);
  res.json = (payload) => {
    try {
      if (payload && payload.code === 0) {
        redis.set(doneKey, JSON.stringify(payload), TTL_SEC);
      }
    } finally {
      redis.del(lockKey);
    }
    return origJson(payload);
  };
  next();
}

function idempotency() {
  return async (req, res, next) => {
    if (!isWrite(req.method)) return next();
    const key = computeKey(req);
    if (!key) return next();

    if (redis.isAvailable()) {
      try {
        return await redisGuard(key, req, res, next);
      } catch (e) {
        // Redis 中途异常，降级到内存，保证请求不卡死
        return memoryGuard(key, req, res, next);
      }
    }
    // 降级：进程内内存
    return memoryGuard(key, req, res, next);
  };
}

module.exports = { idempotency, BODY_HASH_PATHS, CACHE_TTL };
