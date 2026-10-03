// Redis 封装，带自动降级。没装 Redis（或连不上）时所有方法静默失败，业务层直接调数据库。
const Redis = require('ioredis');
const config = require('../config');

let client = null;
let available = false;

try {
  client = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    enableOfflineQueue: false,
    lazyConnect: true,
    maxRetriesPerRequest: 1
  });
  client.on('ready', () => { available = true; });
  client.on('error', () => { available = false; });
  client.connect().catch(() => { available = false; });
} catch (e) {
  available = false;
}

const safe = (fn) => async (...args) => {
  if (!available || !client) return null;
  try { return await fn(...args); } catch (e) { return null; }
};

module.exports = {
  isAvailable: () => available,
  get: safe((k) => client.get(k)),
  set: safe((k, v, ttl) => ttl ? client.set(k, v, 'EX', ttl) : client.set(k, v)),
  incr: safe((k) => client.incr(k)),
  expire: safe((k, ttl) => client.expire(k, ttl))
};
