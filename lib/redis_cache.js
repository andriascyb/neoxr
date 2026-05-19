/**
 * lib/redis_cache.js
 * Optional Redis cache helper (graceful fallback if redis module/service unavailable)
 */

const cfg = require('./config');

let redisModule = null;
let redisClient = null;
let connectPromise = null;
let warnedMissingModule = false;

function getRedisModule() {
  if (redisModule) return redisModule;
  try {
    // Optional dependency
    redisModule = require('redis');
    return redisModule;
  } catch (e) {
    if (!warnedMissingModule) {
      warnedMissingModule = true;
      console.warn('[REDIS] Package "redis" belum terpasang. Redis cache dinonaktifkan sementara.');
    }
    return null;
  }
}

function isRedisEnabled() {
  return Number(cfg.appConfig.redis_cache_enabled || 0) === 1;
}

async function ensureClient() {
  if (!isRedisEnabled()) return null;
  const redis = getRedisModule();
  if (!redis) return null;

  if (redisClient && redisClient.isOpen) return redisClient;
  if (connectPromise) return connectPromise;

  const url = String(cfg.appConfig.redis_url || '').trim();
  if (!url) return null;

  connectPromise = (async () => {
    try {
      redisClient = redis.createClient({
        url,
        socket: {
          reconnectStrategy: (retries) => Math.min(1000 + retries * 250, 5000)
        }
      });
      redisClient.on('error', (err) => {
        console.error('[REDIS] Error:', err && err.message ? err.message : err);
      });
      await redisClient.connect();
      console.log('[REDIS] Connected');
      return redisClient;
    } catch (err) {
      console.error('[REDIS] Connect failed:', err && err.message ? err.message : err);
      return null;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

function getPrefix() {
  return String(cfg.appConfig.redis_prefix || 'apiv3').trim() || 'apiv3';
}

function buildValidationKey(type, target, code = '') {
  const safeType = String(type || '').toLowerCase().trim();
  const safeTarget = String(target || '').trim();
  const safeCode = String(code || '').toLowerCase().trim();
  return `${getPrefix()}:val:v3:${safeType}:${safeCode}:${safeTarget}`;
}

async function getJSON(key) {
  try {
    const client = await ensureClient();
    if (!client) return null;
    const raw = await client.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

async function setJSON(key, value, ttlSeconds) {
  try {
    const client = await ensureClient();
    if (!client) return false;
    const ttl = Number(ttlSeconds) > 0 ? Number(ttlSeconds) : Number(cfg.appConfig.redis_ttl_seconds || cfg.appConfig.cache_time || 300);
    await client.set(key, JSON.stringify(value), { EX: ttl });
    return true;
  } catch (err) {
    return false;
  }
}

async function getClientStatus() {
  const enabled = isRedisEnabled();
  const url = String(cfg.appConfig.redis_url || '').trim();
  try {
    const client = await ensureClient();
    if (!enabled) return { enabled: false, connected: false, url, prefix: getPrefix(), error: null };
    if (!client || !client.isOpen) return { enabled: true, connected: false, url, prefix: getPrefix(), error: 'Redis belum terkoneksi.' };
    const pong = await client.ping();
    const memoryInfo = await client.info('memory');
    const usedMatch = String(memoryInfo || '').match(/used_memory_human:([^\r\n]+)/i);
    return { enabled: true, connected: pong === 'PONG', url, prefix: getPrefix(), used_memory_human: usedMatch ? usedMatch[1].trim() : '-' };
  } catch (err) {
    return { enabled, connected: false, url, prefix: getPrefix(), error: err && err.message ? err.message : 'Redis error' };
  }
}

async function scanKeysByPrefix({ service = '', q = '', limit = 200 } = {}) {
  const client = await ensureClient();
  if (!client || !client.isOpen) return [];
  const prefix = getPrefix();
  const safeService = String(service || '').trim().toLowerCase();
  const pattern = safeService
    ? `${prefix}:val:v3:${safeService}:*`
    : `${prefix}:val:v3:*`;
  const max = Math.max(1, Math.min(Number(limit) || 200, 1000));
  const out = [];
  for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
    const keyStr = String(key || '');
    if (q && !keyStr.toLowerCase().includes(String(q).toLowerCase())) continue;
    out.push(keyStr);
    if (out.length >= max) break;
  }
  return out;
}

function parseKeyParts(key) {
  const parts = String(key || '').split(':');
  if (parts.length < 6) return { type: '-', code: '-', target: '-' };
  return {
    type: parts[3] || '-',
    code: parts[4] || '-',
    target: parts.slice(5).join(':') || '-'
  };
}

async function getKeyMeta(key) {
  const client = await ensureClient();
  if (!client || !client.isOpen) return null;
  const prefix = getPrefix() + ':val:v3:';
  const keyStr = String(key || '');
  if (!keyStr.startsWith(prefix)) return null;
  const [ttl, raw] = await Promise.all([client.ttl(keyStr), client.get(keyStr)]);
  const parsed = parseKeyParts(keyStr);
  let parsedJson = null;
  try { parsedJson = raw ? JSON.parse(raw) : null; } catch (e) { parsedJson = null; }
  return {
    key: keyStr,
    ttl,
    size_bytes: raw ? Buffer.byteLength(raw, 'utf8') : 0,
    type: parsed.type,
    code: parsed.code,
    target: parsed.target,
    value: parsedJson
  };
}

async function deleteKey(key) {
  const client = await ensureClient();
  if (!client || !client.isOpen) return 0;
  const keyStr = String(key || '');
  const prefix = getPrefix() + ':val:v3:';
  if (!keyStr.startsWith(prefix)) return 0;
  return client.del(keyStr);
}

async function flushPrefix() {
  const client = await ensureClient();
  if (!client || !client.isOpen) return 0;
  const pattern = `${getPrefix()}:val:v3:*`;
  let deleted = 0;
  for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 200 })) {
    deleted += await client.del(String(key));
  }
  return deleted;
}

module.exports = {
  isRedisEnabled,
  buildValidationKey,
  getJSON,
  setJSON,
  getClientStatus,
  scanKeysByPrefix,
  getKeyMeta,
  deleteKey,
  flushPrefix
};
