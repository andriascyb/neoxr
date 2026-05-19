/**
 * routes/admin.js
 * Admin dashboard, stats, settings, VPS status, WA management routes
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const os = require('os');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const cfg = require('../lib/config');
const { getStatsFromDB, getHistoricalStats, statsCache } = require('../lib/stats');
const wa = require('../lib/whatsapp');
const { getAdminHTML } = require('../admin_ui');
const vps = require('../lib/vps_utils');
const { getProviderMetricsSnapshot, resetProviderMetrics } = require('../lib/provider_runtime');
const redisCache = require('../lib/redis_cache');
const apiCheckerModule = require('./api_checker');
const { getWaOtpLogsPaged, clearWaOtpLogs } = require('../lib/wa_otp');
const aiStorage = require('../lib/ai_storage');
const poolCookieRefresher = require('../lib/pool_cookie_refresher');

const sharedQiospayWaiters = apiCheckerModule.qiospayWaiters || new Map();
const qiospayTesterResults = new Map();
const QIOSPAY_TESTER_TTL_MS = 5 * 60 * 1000;

const parseServerPoolText = (rawText, baseAlias) => {
  const text = String(rawText || '').trim();
  if (!text) return [];
  const lines = text.split(/\r?\n/).map((v) => String(v || '').trim()).filter(Boolean);
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    const row = lines[i];
    const sep = row.indexOf('|');
    if (sep < 1) continue;
    const endpoint = row.slice(0, sep).trim();
    const cookie = row.slice(sep + 1).trim();
    if (!endpoint || !cookie) continue;
    let validEndpoint = '';
    try {
      const u = new URL(endpoint);
      if (/^https?:$/i.test(u.protocol)) validEndpoint = u.toString();
    } catch (_) {}
    if (!validEndpoint) continue;
    const alias = `${baseAlias}${String.fromCharCode(97 + out.length)}`;
    out.push({
      id: alias,
      label: alias.toUpperCase(),
      endpoint: validEndpoint,
      cookie,
      status: 'on'
    });
  }
  return out;
};
const parseServer7PoolText = (rawText) => parseServerPoolText(rawText, 'server7');
const parseServer3PoolText = (rawText) => parseServerPoolText(rawText, 'server3');

const getCekApiEwalletName = (payload) => {
  const data = payload && typeof payload === 'object' && payload.data && typeof payload.data === 'object' ? payload.data : {};
  const username = String(data.username || data.name || data.account_name || '').trim();
  return username ? username.split('/')[0].trim() : '';
};

const normalizeServer8EwalletName = (rawName) => String(rawName || '')
  .trim()
  .replace(/^(?:GOPAY|DANA|OVO|SHOPEEPAY|LINKAJA|ISAKU|GRAB|GOPAY\s*DRIVER)\s*(?:\u2605|\*)\s*/i, '')
  .replace(/\s+/g, ' ')
  .trim();

const postFormRelaxedTls = (endpoint, headers, body, timeoutMs) => new Promise((resolve, reject) => {
  let target;
  try {
    target = new URL(endpoint);
  } catch (e) {
    reject(e);
    return;
  }
  const isHttps = target.protocol === 'https:';
  const transport = isHttps ? https : http;
  const cleanHeaders = {};
  for (const [key, value] of Object.entries(headers || {})) {
    if (value !== undefined && value !== null && value !== '') cleanHeaders[key] = value;
  }
  cleanHeaders['Content-Length'] = Buffer.byteLength(String(body || ''));
  const req = transport.request({
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port || (isHttps ? 443 : 80),
    path: `${target.pathname}${target.search || ''}`,
    method: 'POST',
    headers: cleanHeaders,
    rejectUnauthorized: false,
    timeout: timeoutMs
  }, (response) => {
    const chunks = [];
    response.on('data', (chunk) => chunks.push(chunk));
    response.on('end', () => resolve({
      status: response.statusCode || 0,
      ok: (response.statusCode || 0) >= 200 && (response.statusCode || 0) < 300,
      text: Buffer.concat(chunks).toString('utf8')
    }));
  });
  req.on('timeout', () => {
    req.destroy(Object.assign(new Error('timeout'), { name: 'AbortError' }));
  });
  req.on('error', reject);
  req.write(String(body || ''));
  req.end();
});

setInterval(() => {
  const now = Date.now();
  for (const [refID, item] of qiospayTesterResults.entries()) {
    if ((item.expires_at || 0) < now) qiospayTesterResults.delete(refID);
  }
}, 60 * 1000).unref?.();

const adminSession = require('../lib/admin_session');
const {
  getCookie,
  safeCompare,
  setAdminCookie,
  clearAdminCookie,
  createAdminSessionToken,
  verifyAdminSessionToken
} = adminSession;

const ADMIN_SESSION_TTL_SEC = adminSession.ADMIN_SESSION_TTL_SEC;
const ADMIN_SESSION_TTL_MS = adminSession.ADMIN_SESSION_TTL_MS;
const loginAttempts = new Map();
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILS = 8;

const getLoginAttemptKey = (req) => {
  const ip = String((req.headers['x-forwarded-for'] || req.ip || '').split(',')[0] || '').trim();
  const ua = String(req.headers['user-agent'] || '').slice(0, 120);
  return `${ip}|${ua}`;
};

const getAttemptState = (key) => {
  const now = Date.now();
  const prev = loginAttempts.get(key);
  if (!prev || (now - prev.firstFailAt) > LOGIN_ATTEMPT_WINDOW_MS) {
    const fresh = { count: 0, firstFailAt: now, blockedUntil: 0 };
    loginAttempts.set(key, fresh);
    return fresh;
  }
  return prev;
};

const isAttemptBlocked = (req) => {
  const key = getLoginAttemptKey(req);
  const state = getAttemptState(key);
  const now = Date.now();
  if (state.blockedUntil && state.blockedUntil > now) {
    return { blocked: true, waitSec: Math.ceil((state.blockedUntil - now) / 1000), key };
  }
  return { blocked: false, key };
};

const markLoginFailed = (req) => {
  const key = getLoginAttemptKey(req);
  const state = getAttemptState(key);
  state.count += 1;
  if (state.count >= LOGIN_MAX_FAILS) {
    const penalty = Math.min(30 * 60 * 1000, Math.pow(2, state.count - LOGIN_MAX_FAILS) * 1000);
    state.blockedUntil = Date.now() + penalty;
  }
  loginAttempts.set(key, state);
};

const markLoginSuccess = (req) => {
  const key = getLoginAttemptKey(req);
  loginAttempts.delete(key);
};

const renderAdminLoginPage = (message) => `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Login Admin</title>
  <style>
    body { margin:0; min-height:100vh; display:grid; place-items:center; background:linear-gradient(135deg,#0f172a,#111827); font-family:Inter,system-ui,Segoe UI,Arial,sans-serif; color:#e5e7eb; }
    .card { width:min(420px,92vw); background:#111827; border:1px solid #374151; border-radius:14px; padding:24px; box-shadow:0 10px 35px rgba(0,0,0,.35); }
    h1 { margin:0 0 8px; font-size:22px; }
    p { margin:0 0 18px; color:#9ca3af; font-size:14px; }
    .err { margin:0 0 14px; padding:10px 12px; border-radius:10px; background:#3f1d1d; color:#fecaca; border:1px solid #7f1d1d; font-size:13px; }
    label { display:block; font-size:13px; margin:0 0 8px; color:#cbd5e1; }
    input { width:100%; box-sizing:border-box; padding:12px; border-radius:10px; border:1px solid #4b5563; background:#0b1220; color:#f3f4f6; outline:none; }
    input:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.2); }
    button { margin-top:14px; width:100%; border:0; border-radius:10px; padding:12px; background:#2563eb; color:#fff; font-weight:600; cursor:pointer; }
    button:hover { background:#1d4ed8; }
  </style>
</head>
<body>
  <form class="card" method="post" action="/admin/login">
    <h1>Admin Login</h1>
    <p>Masukkan Admin Key untuk masuk dashboard.</p>
    ${message ? `<div class="err">${message}</div>` : ''}
    <label for="admin_key">Admin Key</label>
    <input id="admin_key" name="admin_key" type="password" required autocomplete="current-password" />
    <button type="submit">Masuk</button>
  </form>
</body>
</html>`;

// VPS Utilities moved to lib/vps_utils.js

const normalizeQiospaySn = (raw) => {
  let sn = String(raw || '').trim();
  if (!sn) return '';
  sn = sn.split('/')[0].trim();
  return sn.replace(/\s+/g, ' ').trim();
};

const normalizeServer3EwalletName = (raw) => {
  let name = String(raw || '').trim();
  if (!name) return '';
  name = name.replace(/\s+/g, ' ').trim();
  name = name.replace(/\/nominal:.*$/i, '').trim();
  name = name.replace(/^ShopeePay-/i, '').trim();
  name = name.replace(/^OVO\s+OVO\s+/i, 'OVO ');
  name = name.replace(/\.+$/, '').trim();
  return name;
};

const maskCookieValue = (cookie) => {
  const v = String(cookie || '').trim();
  if (!v) return '';
  if (v.length <= 12) return '***';
  return `${v.slice(0, 6)}...${v.slice(-4)}`;
};

const parseQiospaySn = (payload) => {
  const data = normalizeQiospayPayload(payload);
  const direct = [data && data.sn, data && data.SN, data && data.account_name, data && data.accountName]
    .find((v) => typeof v === 'string' && v.trim());
  if (direct) return normalizeQiospaySn(direct);
  const message = String((data && (data.message || data.msg || data.keterangan)) || '');
  const m = message.match(/SN\s*:\s*([\s\S]*?)(?:\.?\s+Saldo\b|\.?\s*@\d{2}\/\d{2}\/\d{4}|\r?\n|$)/i);
  return m && m[1] ? normalizeQiospaySn(m[1].trim().replace(/\.$/, '').trim()) : '';
};

const normalizeQiospayPayload = (payload) => {
  const raw = payload || {};
  let data = raw.data && typeof raw.data === 'object' ? raw.data : raw;
  if (raw.data && typeof raw.data === 'string') {
    try { data = JSON.parse(raw.data); } catch (e) { data = raw; }
  }
  const normalized = { ...(data || raw) };
  const rawKey = String(normalized.key || '').trim();
  const qIndex = rawKey.indexOf('?');
  if (qIndex !== -1) {
    normalized.key = rawKey.slice(0, qIndex);
    try {
      const extra = new URLSearchParams(rawKey.slice(qIndex + 1));
      for (const [k, v] of extra.entries()) {
        if (normalized[k] === undefined) normalized[k] = v;
      }
    } catch (e) { }
  }
  return normalized;
};

const getQiospayRefIdFromPayload = (payload) => {
  const data = normalizeQiospayPayload(payload);
  const direct = String(data.refid || data.refID || data.refId || data.ref_id || '').trim();
  if (direct) return direct;
  const message = String(data.message || data.msg || data.keterangan || '');
  const fromMessage = message.match(/\bR#([A-Za-z0-9_-]+)/i);
  return fromMessage && fromMessage[1] ? fromMessage[1].trim() : '';
};

const makeQiospayRefId = () => `TRX${Date.now()}${Math.floor(Math.random() * 1000)}`;

const resolvePublicBaseUrl = (req) => {
  const configured = String((cfg.appConfig && cfg.appConfig.public_base_url) || '').trim();
  if (configured) return configured.replace(/\/+$/, '');
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
  const host = req.get('host');
  return `${proto}://${host}`.replace(/\/+$/, '');
};

const logQiospayTester = (msg) => {
  try {
    const logDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    fs.appendFileSync(path.join(logDir, 'qiospay_tester.log'), line, 'utf8');
  } catch (e) { }
};

router.get('/login', (req, res) => {
  const sessionToken = getCookie(req, 'admin_session');
  if (sessionToken && verifyAdminSessionToken(sessionToken)) {
    return res.redirect('/admin');
  }
  const cookieKey = getCookie(req, 'admin_key');
  if (cookieKey && safeCompare(cookieKey, cfg.ADMIN_KEY)) {
    return res.redirect('/admin');
  }
  return res.send(renderAdminLoginPage(''));
});

router.post('/login', (req, res) => {
  const block = isAttemptBlocked(req);
  if (block.blocked) {
    return res.status(429).send(renderAdminLoginPage(`Terlalu banyak percobaan login. Coba lagi dalam ${block.waitSec} detik.`));
  }
  const submitted = String((req.body && req.body.admin_key) || '').trim();
  if (!submitted || !safeCompare(submitted, cfg.ADMIN_KEY)) {
    markLoginFailed(req);
    clearAdminCookie(req, res);
    return res.status(401).send(renderAdminLoginPage('Admin key tidak valid.'));
  }
  markLoginSuccess(req);
  setAdminCookie(req, res, submitted);
  return res.redirect('/admin');
});

router.post('/logout', (req, res) => {
  clearAdminCookie(req, res);
  return res.redirect('/admin/login');
});

// ==================== WA ROUTES ====================
router.get('/wa-debug', (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).send('Unauthorized');
  const p = wa.getProviderSummary ? wa.getProviderSummary() : {};
  res.json({
    connectionStatus: wa.connectionStatus,
    hasSocket: false,
    hasQr: false,
    qrLength: 0,
    providers: p,
    timestamp: new Date().toISOString()
  });
});

router.get('/wa-check-v2', (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const p = wa.getProviderSummary ? wa.getProviderSummary() : {};
  const internal = wa.getBaileysState ? wa.getBaileysState() : {};
  res.json({
    status: wa.connectionStatus,
    connected: !!(internal && internal.connected),
    qr: null,
    qr_available: !!(internal && internal.qr_available),
    qr_updated_at: internal && internal.qr_updated_at ? internal.qr_updated_at : null,
    connected_number: internal && internal.connected_number ? internal.connected_number : null,
    pairing_code: internal && internal.pairing_code ? internal.pairing_code : null,
    pairing_updated_at: internal && internal.pairing_updated_at ? internal.pairing_updated_at : null,
    last_disconnect_reason: internal && internal.last_disconnect_reason ? internal.last_disconnect_reason : null,
    reconnect_attempts: internal && internal.reconnect_attempts ? internal.reconnect_attempts : 0,
    connected_jid: internal && internal.connected_jid ? internal.connected_jid : null,
    internal,
    providers: p,
    time: Date.now()
  });
});

router.get('/wa-qr', (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const qr = wa.qrCodeBase64 || null;
  const internal = wa.getBaileysState ? wa.getBaileysState() : {};
  return res.json({
    status: true,
    connected: !!(internal && internal.connected),
    qr_available: !!qr,
    qr_base64: qr,
    qr_updated_at: internal && internal.qr_updated_at ? internal.qr_updated_at : null,
    connected_number: internal && internal.connected_number ? internal.connected_number : null,
    pairing_code: internal && internal.pairing_code ? internal.pairing_code : null,
    pairing_updated_at: internal && internal.pairing_updated_at ? internal.pairing_updated_at : null
  });
});

router.all('/wa-logout', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).send('Unauthorized');
  try {
    const out = wa.logoutBaileys ? await wa.logoutBaileys() : { ok: false, message: 'Baileys engine tidak tersedia.' };
    res.json({ status: !!out.ok, message: out.message || 'Sesi logout diproses.' });
  } catch (e) {
    res.status(500).json({ status: false, message: e.message || 'Gagal logout Baileys.' });
  }
});

router.get('/wa-restart', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).send('Unauthorized');
  try {
    const out = wa.startBaileys ? await wa.startBaileys(true) : { ok: false, message: 'Baileys engine tidak tersedia.' };
    return res.send(`<h1>${out.ok ? 'Starting' : 'Failed'}</h1><p>${String(out.message || '').replace(/</g, '&lt;')}</p><script>setTimeout(()=>history.back(), 1800)</script>`);
  } catch (e) {
    return res.send(`<h1>Failed</h1><p>${String(e.message || 'Unknown error').replace(/</g, '&lt;')}</p><script>setTimeout(()=>history.back(), 1800)</script>`);
  }
});

router.post('/wa-restart', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const out = wa.startBaileys ? await wa.startBaileys(true) : { ok: false, message: 'Baileys engine tidak tersedia.' };
    res.json({ status: !!out.ok, message: out.message || 'Restart Baileys diproses.' });
  } catch (e) {
    res.status(500).json({ status: false, message: e.message || 'Gagal restart Baileys.' });
  }
});

router.get('/server7-pool-analyze', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  const codeRaw = String(req.query.code || 'dana').toLowerCase().replace(/^wallet_/, '').trim();
  const accountNumber = String(req.query.account_number || req.query.nomor || req.query.number || '081234567890').replace(/[^0-9]/g, '');
  const supportedCodes = new Set(['dana', 'gopay', 'linkaja', 'ovo', 'shopeepay']);
  const merchantMap = { dana: 'DANA', gopay: 'GOPAY', linkaja: 'LINKAJA', ovo: 'OVO', shopeepay: 'SHOPEEPAY' };
  if (!supportedCodes.has(codeRaw)) {
    return res.status(400).json({ status: false, error: 'Code tidak didukung untuk server7 pool.' });
  }
  try {
    const poolEnabled = String(cfg.appConfig.ewallet_server7_pool_enabled || 'off') === 'on';
    const rawPool = Array.isArray(cfg.appConfig.ewallet_server7_pool) ? cfg.appConfig.ewallet_server7_pool : [];
    const activePool = rawPool
      .filter((row) => row && String(row.status || 'on').toLowerCase() === 'on')
      .map((row, idx) => {
        const fallbackAlias = `server7${String.fromCharCode(97 + idx)}`;
        const alias = String(row.id || fallbackAlias).trim() || fallbackAlias;
        const endpoint = String(row.endpoint || '').trim();
        const cookie = String(row.cookie || '').trim();
        let host = '-';
        try { host = endpoint ? (new URL(endpoint)).host : '-'; } catch (_) {}
        return { alias, endpoint, cookie, host };
      })
      .filter((row) => !!row.endpoint && !!row.cookie);

    const fallbackEndpoint = String(cfg.appConfig.ewallet_server7_base_url || '').trim();
    const fallbackCookie = String(cfg.appConfig.ewallet_server7_cookie || '').trim();
    const candidates = (poolEnabled && activePool.length)
      ? activePool
      : (fallbackEndpoint && fallbackCookie ? [{ alias: 'server7', endpoint: fallbackEndpoint, cookie: fallbackCookie, host: (() => { try { return new URL(fallbackEndpoint).host; } catch (_) { return '-'; } })() }] : []);

    if (!candidates.length) {
      return res.json({ status: true, data: [], message: 'Tidak ada kandidat server7 yang siap.' });
    }

    const results = [];
    for (const item of candidates) {
      const started = Date.now();
      let ok = false;
      let reason = '';
      try {
        const bodyData = new URLSearchParams({
          merchant: merchantMap[codeRaw],
          nomorpelanggan: accountNumber,
          nominal: '10.000'
        });
        const controller = new AbortController();
        const to = setTimeout(() => controller.abort(), Number(cfg.appConfig.timeout_ms) || 7000);
        const r = await fetch(item.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0',
            'Cookie': item.cookie
          },
          body: bodyData.toString(),
          signal: controller.signal
        });
        clearTimeout(to);
        const html = await r.text();
        const m = html.match(/<span class="label-text-grayscale">Nama Penerima<\/span>[\s\S]*?<b>(.*?)<\/b>/i);
        const name = m && m[1] ? String(m[1]).trim().split('/')[0].trim() : '';
        ok = !!(r.ok && name);
        reason = ok ? 'Session OK' : (r.ok ? 'Session/parse invalid' : (`HTTP ${r.status}`));
      } catch (e) {
        reason = e && e.name === 'AbortError' ? 'Timeout' : (e.message || 'Request error');
      }
      results.push({
        alias: item.alias,
        host: item.host,
        ok,
        latency_ms: Date.now() - started,
        reason
      });
    }

    return res.json({ status: true, data: results });
  } catch (err) {
    return res.status(500).json({ status: false, error: err.message || 'Gagal analisa pool server7' });
  }
});

router.get('/server3-pool-analyze', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  const accountNumber = String(req.query.account_number || req.query.nomor || req.query.number || '1234567890').replace(/[^0-9]/g, '');
  const bankCode = String(req.query.bank_code || req.query.code || '014').trim();
  try {
    const { getBankServer3NameByCode } = require('./api_checker');
    const bankName = String(getBankServer3NameByCode(bankCode) || '').trim();
    if (!bankName) {
      return res.status(400).json({ status: false, error: 'Mapping bank server3 tidak ditemukan untuk codeid tersebut.' });
    }
    const poolEnabled = String(cfg.appConfig.bank_server3_pool_enabled || 'off') === 'on';
    const rawPool = Array.isArray(cfg.appConfig.bank_server3_pool) ? cfg.appConfig.bank_server3_pool : [];
    const activePool = rawPool
      .filter((row) => row && String(row.status || 'on').toLowerCase() === 'on')
      .map((row, idx) => {
        const fallbackAlias = `server3${String.fromCharCode(97 + idx)}`;
        const alias = String(row.id || fallbackAlias).trim() || fallbackAlias;
        const endpoint = String(row.endpoint || '').trim();
        const cookie = String(row.cookie || '').trim();
        let host = '-';
        try { host = endpoint ? (new URL(endpoint)).host : '-'; } catch (_) {}
        return { alias, endpoint, cookie, host };
      })
      .filter((row) => !!row.endpoint && !!row.cookie);

    const fallbackEndpoint = String(cfg.appConfig.bank_server3_base_url || '').trim();
    const fallbackCookie = String(cfg.appConfig.bank_server3_cookie || '').trim();
    const candidates = (poolEnabled && activePool.length)
      ? activePool
      : (fallbackEndpoint && fallbackCookie ? [{ alias: 'server3', endpoint: fallbackEndpoint, cookie: fallbackCookie, host: (() => { try { return new URL(fallbackEndpoint).host; } catch (_) { return '-'; } })() }] : []);

    if (!candidates.length) {
      return res.json({ status: true, data: [], message: 'Tidak ada kandidat server3 yang siap.' });
    }

    const results = [];
    for (const item of candidates) {
      const started = Date.now();
      let ok = false;
      let reason = '';
      try {
        const bodyData = new URLSearchParams({
          merchant: `TRANSFER ONLINE|${bankName}|${bankCode}`,
          nomorpelanggan: accountNumber,
          nominal: '10.000',
          payment_desc: '',
          merchant_favorit: '',
          tambahfavorit: 'NO',
          rekeningbaru: 'NO',
          metode: 'BIFAST'
        });
        const endpointUrl = new URL(item.endpoint);
        const origin = `${endpointUrl.protocol}//${endpointUrl.host}`;
        const controller = new AbortController();
        const to = setTimeout(() => controller.abort(), Number(cfg.appConfig.timeout_ms) || 7000);
        const r = await fetch(item.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0',
            'Accept': '*/*',
            'Origin': origin,
            'Referer': `${origin}/`,
            'Cookie': item.cookie
          },
          body: bodyData.toString(),
          signal: controller.signal
        });
        clearTimeout(to);
        const html = await r.text();
        const m = html.match(/<span class="label-text-grayscale">Nama Penerima<\/span>[\s\S]*?<b>(.*?)<\/b>/i);
        const name = m && m[1] ? String(m[1]).trim().split('/')[0].trim() : '';
        ok = !!(r.ok && name);
        reason = ok ? 'Session OK' : (r.ok ? 'Session/parse invalid' : (`HTTP ${r.status}`));
      } catch (e) {
        reason = e && e.name === 'AbortError' ? 'Timeout' : (e.message || 'Request error');
      }
      results.push({
        alias: item.alias,
        host: item.host,
        ok,
        latency_ms: Date.now() - started,
        reason
      });
    }
    return res.json({ status: true, data: results });
  } catch (err) {
    return res.status(500).json({ status: false, error: err.message || 'Gagal analisa pool server3' });
  }
});

router.get('/pool-cookie-refresh/status', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  return res.json({ status: true, data: poolCookieRefresher.getStatus() });
});

router.post('/pool-cookie-refresh', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    const service = String((req.body && req.body.service) || req.query.service || 'all').trim().toLowerCase();
    const alias = String((req.body && req.body.alias) || req.query.alias || '').trim().toLowerCase();
    if (service === 'bank_server3') {
      const out = await poolCookieRefresher.refreshServicePool('bank_server3', { force: true, alias });
      return res.json({ status: true, data: out });
    }
    if (service === 'ewallet_server7') {
      const out = await poolCookieRefresher.refreshServicePool('ewallet_server7', { force: true, alias });
      return res.json({ status: true, data: out });
    }
    const outAll = await poolCookieRefresher.runCycle(true);
    return res.json({ status: true, data: outAll || { message: 'refresh cycle triggered' } });
  } catch (err) {
    return res.status(500).json({ status: false, error: err.message || 'Gagal refresh cookie pool' });
  }
});

router.post('/wa-pairing-code', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, message: 'Unauthorized' });
  try {
    const number = (req.body && (req.body.number || req.body.phone || req.body.msisdn)) || '';
    const out = wa.requestBaileysPairingCode
      ? await wa.requestBaileysPairingCode(number)
      : { ok: false, message: 'Baileys pairing belum tersedia.' };
    return res.status(out.ok ? 200 : 400).json({
      status: !!out.ok,
      message: out.message || (out.ok ? 'Pairing code berhasil dibuat.' : 'Gagal membuat pairing code.'),
      code: out.code || null,
      connected: !!out.already_connected,
      connected_number: out.connected_number || null,
      updated_at: out.updated_at || null
    });
  } catch (e) {
    return res.status(500).json({ status: false, message: e.message || 'Gagal pairing code.' });
  }
});

// JSON API moved to public_api.js

router.get('/vps-status', (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.redirect('/admin/login');
  const cookieKey = getCookie(req, 'admin_key');
  if (cookieKey !== cfg.ADMIN_KEY) {
    setAdminCookie(req, res, cfg.ADMIN_KEY);
  }
  const ADMIN_KEY = '';
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>VPS Status – Real-Time Monitoring</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
  <style>
    .sidebar-overlay { display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:90;backdrop-filter:blur(4px); }
    .sidebar-overlay.show { display:block; }
    .mob-btn { display:none;background:#21262d;border:1px solid #30363d;color:#e6edf3;padding:6px 10px;border-radius:6px;cursor:pointer; }
    @media(max-width:768px){ .layout{display:block;} .sidebar{position:fixed;left:-250px;top:0;bottom:0;width:250px;transition:transform 0.3s ease;z-index:100;height:100vh;} .sidebar.show{transform:translateX(250px);} .main{width:100%;} .mob-btn{display:inline-flex!important;} }
  </style>
</head>
<body class="layout">
  <div class="sidebar-overlay" id="sb-overlay" onclick="toggleSidebar()"></div>
  <aside class="sidebar" id="sidebar">
    <div class="sb-brand"><div class="sb-logo"><div class="sb-icon">⚡</div><div><div class="sb-name">API Checker v3.1</div></div></div></div>
    <a class="nav-a" href="/admin?key=${ADMIN_KEY}">📊 Dashboard</a>
    <a class="nav-a" href="/admin?key=${ADMIN_KEY}#users">👥 User Management</a>
    <a class="nav-a" href="/admin?key=${ADMIN_KEY}#settings">⚙️ Pengaturan</a>
    <a class="nav-a ac" href="/admin/vps-status?key=${ADMIN_KEY}">🖥️ VPS Status</a>
  </aside>
  <div class="main">
    <div class="topbar">
      <button class="mob-btn" onclick="toggleSidebar()">☰</button>
      <div style="display:flex;align-items:center;gap:10px;justify-content:space-between;width:100%;">
        <h1 style="margin:0;">🖥️ VPS Status</h1>
        <form method="post" action="/admin/logout" style="margin:0;">
          <button type="submit" style="background:#7f1d1d;border:1px solid #b91c1c;color:#fff;padding:6px 10px;border-radius:8px;cursor:pointer;font-size:12px;">Logout</button>
        </form>
      </div>
    </div>
    <div class="content">
      <div class="grid">
        <div class="card" id="cpu-card"><strong>CPU</strong>Loading…</div>
        <div class="card" id="mem-card"><strong>Memory</strong>Loading…</div>
        <div class="card" id="uptime-card"><strong>Uptime</strong>Loading…</div>
      </div>
    </div>
  </div>
  <script>
    async function loadStatus(){
      try {
        const r = await fetch('/api/v3/vps-status?key=${ADMIN_KEY}');
        const j = await r.json();
        if(!j.status) return;
        const d = j.data;
        document.getElementById('cpu-card').innerHTML = \`<strong>CPU</strong>\${d.cpu.model}<br/><br/>\${d.cpu.cores} cores<br/>Load 1m: \${d.cpu.load_1m.toFixed(2)}\`;
        document.getElementById('mem-card').innerHTML = \`<strong>Memory</strong>\${d.memory.used_mb} MB / \${d.memory.total_mb} MB<br/><br/>Usage: \${d.memory.usage_percent}%\`;
        const up = Math.floor(d.uptime_seconds/3600)+'h '+Math.floor((d.uptime_seconds%3600)/60)+'m';
        document.getElementById('uptime-card').innerHTML = \`<strong>Uptime</strong>\${up}\`;
      } catch(e) { console.error(e); }
    }
    loadStatus();
    setInterval(function(){ if (document.visibilityState === 'visible') loadStatus(); }, 15000);
    function toggleSidebar() { document.getElementById('sidebar').classList.toggle('show'); document.getElementById('sb-overlay').classList.toggle('show'); }
  </script>
</body>
</html>`;
  res.send(html);
});

// ==================== STATS ====================
router.get('/stats', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const stats = await getStatsFromDB();
  res.json(stats);
});

router.get('/wa-otp/logs', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    const pageData = await getWaOtpLogsPaged({
      direction: req.query.direction,
      number: req.query.number,
      status: req.query.status,
      message_type: req.query.message_type,
      reason: req.query.reason,
      page: req.query.page,
      page_size: req.query.page_size || req.query.limit
    });
    return res.json({ status: true, data: pageData.rows, pagination: pageData.pagination });
  } catch (err) {
    return res.status(500).json({ status: false, error: err.message || 'Failed to load WA OTP logs.' });
  }
});

router.post('/wa-otp/logs/clear', async (req, res) => {
  const reqKey = req.query.key || (req.body && req.body.key);
  if (reqKey !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    const deleted = await clearWaOtpLogs({
      mode: req.body && req.body.mode,
      direction: req.body && req.body.direction,
      number: req.body && req.body.number,
      status: req.body && req.body.status,
      message_type: req.body && req.body.message_type,
      reason: req.body && req.body.reason
    });
    return res.json({ status: true, deleted, message: `Berhasil menghapus ${deleted} log.` });
  } catch (err) {
    return res.status(400).json({ status: false, error: err.message || 'Failed to clear WA OTP logs.' });
  }
});

router.get('/provider-metrics', (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const serviceType = req.query.service ? String(req.query.service).toLowerCase() : null;
  return res.json({
    status: true,
    data: getProviderMetricsSnapshot(serviceType)
  });
});

router.get('/redis-audit/status', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const status = await redisCache.getClientStatus();
  let keys = [];
  try { keys = await redisCache.scanKeysByPrefix({ limit: 1000 }); } catch (e) { keys = []; }
  return res.json({ status: true, data: { ...status, key_count: keys.length } });
});

router.get('/redis-audit/keys', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const service = String(req.query.service || '').toLowerCase();
  const q = String(req.query.q || '');
  const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 50, 200));
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const scanLimit = Math.max(limit + 1, Math.min((page * limit) + 1, 5000));
  const keys = await redisCache.scanKeysByPrefix({ service, q, limit: scanLimit });
  const offset = (page - 1) * limit;
  const pageKeys = keys.slice(offset, offset + limit);
  const hasMore = keys.length > (offset + limit);
  const rows = [];
  for (const key of pageKeys) {
    const meta = await redisCache.getKeyMeta(key);
    if (meta) rows.push(meta);
  }
  return res.json({
    status: true,
    data: rows,
    pagination: {
      page,
      limit,
      has_more: hasMore
    }
  });
});

router.delete('/redis-audit/key', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const targetKey = String(req.query.target_key || '').trim();
  if (!targetKey) return res.status(400).json({ status: false, error: 'target_key wajib diisi.' });
  const deleted = await redisCache.deleteKey(targetKey);
  return res.json({ status: true, deleted });
});

router.post('/redis-audit/flush-prefix', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const deleted = await redisCache.flushPrefix();
  return res.json({ status: true, deleted, message: 'Redis cache prefix aplikasi berhasil dibersihkan.' });
});

router.post('/provider-metrics/reset', (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const serviceType = req.body && req.body.service ? String(req.body.service).toLowerCase() : null;
  const result = resetProviderMetrics(serviceType);
  return res.json({
    status: true,
    message: `Provider runtime metrics berhasil direset${result.reset && result.reset !== 'all' ? ` untuk ${result.reset}` : ''}.`
  });
});

router.all('/callback_qiospay_tester', (req, res) => {
  const callbackKey = String((cfg.appConfig && cfg.appConfig.qiospay_callback_key) || '112233').trim();
  const payload = normalizeQiospayPayload({ ...req.query, ...req.body });
  if (callbackKey && String(payload.key || '') !== callbackKey) {
    return res.status(401).json({ status: false, message: 'Unauthorized callback key' });
  }
  const refID = getQiospayRefIdFromPayload(payload);
  const waiter = refID ? sharedQiospayWaiters.get(refID) : null;
  logQiospayTester(`TESTER_CALLBACK refID=${refID || '-'} has_waiter=${!!waiter} waiters=${sharedQiospayWaiters.size} payload=${JSON.stringify(payload).slice(0, 500)}`);
  if (waiter) {
    sharedQiospayWaiters.delete(refID);
    waiter.resolve(payload);
  }
  return res.json({ status: true, message: 'Callback diterima' });
});

// ==================== ADMIN PANEL ====================
async function renderAdminPage(req, res, pageName) {
  if (req.query.key !== cfg.ADMIN_KEY) return res.redirect('/admin/login');
  try {
    const cookieKey = getCookie(req, 'admin_key');
    if (cookieKey !== cfg.ADMIN_KEY) {
      setAdminCookie(req, res, cfg.ADMIN_KEY);
    }
    const stats = await getStatsFromDB();
    req.appConfig = cfg.appConfig;
    // Never embed raw admin key into rendered HTML/JS.
    const html = getAdminHTML('', stats, req, pageName);
    res.send(html);
  } catch (err) {
    console.error('[ADMIN-LOAD] Error rendering admin panel:', err);
    res.status(500).send('<h1>500 Internal Server Error</h1><p>Failed to render admin panel: ' + (err.message || err) + '</p>');
  }
}

router.get('/', async (req, res) => {
  return renderAdminPage(req, res, 'dashboard');
});

router.get('/wa-settings', async (req, res) => {
  return renderAdminPage(req, res, 'wa-settings');
});

router.get('/expiry-notif', async (req, res) => {
  return res.redirect('/admin/wa-settings');
});

router.get('/:page', async (req, res, next) => {
  const allowed = new Set(['dashboard', 'live', 'users', 'members', 'services', 'packages', 'wa-settings', 'tester', 'mysql', 'revenue', 'settings', 'redis-cache', 'vps']);
  const page = String(req.params.page || '').toLowerCase();
  if (!allowed.has(page)) return next();
  return renderAdminPage(req, res, page);
});

router.post('/save', (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).send('Unauthorized');
  const appConfig = cfg.appConfig;
  const pickNumber = (value, fallback) => {
    if (value === undefined || value === null || value === '') return fallback;
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? fallback : n;
  };
  appConfig.api_key = req.body.api_key || appConfig.api_key;
  appConfig.admin_key = req.body.admin_key || appConfig.admin_key;
  cfg.ADMIN_KEY = appConfig.admin_key;
  appConfig.bank_server1_status = req.body.bank_server1_status || appConfig.bank_server1_status;
  appConfig.bank_status = req.body.bank_status || appConfig.bank_status || 'on';
  appConfig.bank_server2_status = req.body.bank_server2_status || appConfig.bank_server2_status;
  appConfig.ewallet_status = req.body.ewallet_status || appConfig.ewallet_status || 'on';
  appConfig.ewallet_server1_status = req.body.ewallet_server1_status || appConfig.ewallet_server1_status;
  appConfig.ewallet_server2_status = req.body.ewallet_server2_status || appConfig.ewallet_server2_status;
  appConfig.ewallet_server2_base_url = req.body.ewallet_server2_base_url || appConfig.ewallet_server2_base_url || 'https://billpaketdata.com/cekid/ewallet/check_packages';
  appConfig.bank_server2_apikey = req.body.bank_server2_apikey || appConfig.bank_server2_apikey;
  appConfig.bank_server3_status = req.body.bank_server3_status || appConfig.bank_server3_status || 'off';
  appConfig.bank_server3_auto_window_enabled = req.body.bank_server3_auto_window_enabled || appConfig.bank_server3_auto_window_enabled || 'on';
  appConfig.bank_server3_base_url = req.body.bank_server3_base_url || appConfig.bank_server3_base_url || 'https://rrtravelnbx.com/v2/topup_merchant_result_ajax-pin';
  appConfig.bank_server3_cookie = req.body.bank_server3_cookie || appConfig.bank_server3_cookie || '';
  appConfig.bank_server3_pool_enabled = 'off';
  appConfig.bank_server3_pool = [];
  appConfig.timeout_ms = parseInt(req.body.timeout_ms) || appConfig.timeout_ms;
  appConfig.pool_attempt_timeout_ms = pickNumber(req.body.pool_attempt_timeout_ms, appConfig.pool_attempt_timeout_ms || 10000);
  appConfig.pool_cookie_refresh_timeout_ms = pickNumber(req.body.pool_cookie_refresh_timeout_ms, appConfig.pool_cookie_refresh_timeout_ms || 8000);
  appConfig.pool_cookie_refresh_check_minutes = pickNumber(req.body.pool_cookie_refresh_check_minutes, appConfig.pool_cookie_refresh_check_minutes || 10);
  appConfig.bank_server3_cookie_auto_refresh = req.body.bank_server3_cookie_auto_refresh || appConfig.bank_server3_cookie_auto_refresh || 'off';
  appConfig.bank_server3_cookie_refresh_hours = pickNumber(req.body.bank_server3_cookie_refresh_hours, appConfig.bank_server3_cookie_refresh_hours || 24);
  appConfig.ai_endpoint = req.body.ai_endpoint || appConfig.ai_endpoint || 'https://api.neoxr.eu/api/photo-editor';
  appConfig.ai_apikey = req.body.ai_apikey || appConfig.ai_apikey || '9ViEsr';
  appConfig.fonnte_token = req.body.fonnte_token || appConfig.fonnte_token;
  appConfig.pitucode_apikey = req.body.pitucode_apikey || appConfig.pitucode_apikey;
  const incomingWaPriority = String(req.body.wa_validation_priority || req.body.wa_priority || appConfig.wa_validation_priority || appConfig.wa_priority || '1,2')
    .split(',')
    .map((x) => x.trim())
    .filter((x) => x === '1' || x === '2');
  appConfig.wa_validation_priority = incomingWaPriority.length ? incomingWaPriority.join(',') : '1,2';
  // backward-compat: keep legacy key in sync for older runtime paths
  appConfig.wa_priority = appConfig.wa_validation_priority;
  const notifProviderRaw = String(req.body.wa_notification_provider || appConfig.wa_notification_provider || 'fonnte').trim().toLowerCase();
  appConfig.wa_notification_provider = ['fonnte', 'pitucode', 'internal_baileys'].includes(notifProviderRaw)
    ? notifProviderRaw
    : 'fonnte';
  appConfig.show_packages = pickNumber(req.body.show_packages, appConfig.show_packages || 0);
  appConfig.cache_enabled = pickNumber(req.body.cache_enabled, appConfig.cache_enabled || 0);
  appConfig.db_cache_enabled = pickNumber(req.body.db_cache_enabled, appConfig.db_cache_enabled || 0);
  appConfig.cache_time = pickNumber(req.body.cache_time, appConfig.cache_time);
  appConfig.redis_cache_enabled = pickNumber(req.body.redis_cache_enabled, appConfig.redis_cache_enabled || 0);
  appConfig.redis_url = req.body.redis_url || appConfig.redis_url || 'redis://127.0.0.1:6379';
  appConfig.redis_prefix = req.body.redis_prefix || appConfig.redis_prefix || 'apiv3';
  appConfig.redis_ttl_seconds = pickNumber(req.body.redis_ttl_seconds, appConfig.redis_ttl_seconds || appConfig.cache_time || 300);
  appConfig.public_base_url = req.body.public_base_url !== undefined ? req.body.public_base_url : appConfig.public_base_url;
  appConfig.wa_notify_enabled = pickNumber(req.body.wa_notify_enabled, appConfig.wa_notify_enabled || 0);
  appConfig.wa_notify_days_before = pickNumber(req.body.wa_notify_days_before, appConfig.wa_notify_days_before || 2);
  appConfig.wa_template_new_user = req.body.wa_template_new_user || appConfig.wa_template_new_user;
  appConfig.wa_template_expiry_2d = req.body.wa_template_expiry_2d || appConfig.wa_template_expiry_2d;
  appConfig.member_register_require_otp = pickNumber(req.body.member_register_require_otp, appConfig.member_register_require_otp || 0);
  appConfig.member_register_otp_target_number = req.body.member_register_otp_target_number || appConfig.member_register_otp_target_number || '';
  appConfig.wa_otp_expiry_minutes = pickNumber(req.body.wa_otp_expiry_minutes, appConfig.wa_otp_expiry_minutes || 5);
  appConfig.wa_otp_max_attempts = pickNumber(req.body.wa_otp_max_attempts, appConfig.wa_otp_max_attempts || 5);
  appConfig.cooldown_bank = pickNumber(req.body.cooldown_bank, appConfig.cooldown_bank || 0);
  appConfig.cooldown_ewallet = pickNumber(req.body.cooldown_ewallet, appConfig.cooldown_ewallet || 0);
  appConfig.cooldown_whatsapp = pickNumber(req.body.cooldown_whatsapp, appConfig.cooldown_whatsapp || 0);
  appConfig.cooldown_nik = pickNumber(req.body.cooldown_nik, appConfig.cooldown_nik || 0);
  appConfig.cooldown_bpjs = pickNumber(req.body.cooldown_bpjs, appConfig.cooldown_bpjs || 0);
  appConfig.cooldown_pln = pickNumber(req.body.cooldown_pln, appConfig.cooldown_pln || 0);
  appConfig.cooldown_ai = pickNumber(req.body.cooldown_ai, appConfig.cooldown_ai || 0);
  appConfig.provider_circuit_fail_threshold = pickNumber(req.body.provider_circuit_fail_threshold, appConfig.provider_circuit_fail_threshold || 3);
  appConfig.provider_circuit_cooldown_ms = pickNumber(req.body.provider_circuit_cooldown_ms, appConfig.provider_circuit_cooldown_ms || 60000);
  appConfig.cost_bank = pickNumber(req.body.cost_bank, appConfig.cost_bank || 0);
  appConfig.cost_ewallet = pickNumber(req.body.cost_ewallet, appConfig.cost_ewallet || 0);
  appConfig.cost_nik = pickNumber(req.body.cost_nik, appConfig.cost_nik || 0);
  appConfig.cost_whatsapp = pickNumber(req.body.cost_whatsapp, appConfig.cost_whatsapp || 0);
  appConfig.cost_bpjs = pickNumber(req.body.cost_bpjs, appConfig.cost_bpjs || 0);
  appConfig.cost_pln = pickNumber(req.body.cost_pln, appConfig.cost_pln || 0);
  appConfig.cost_ai = pickNumber(req.body.cost_ai, appConfig.cost_ai || 0);
  appConfig.ai_timeout_ms = pickNumber(req.body.ai_timeout_ms, appConfig.ai_timeout_ms || 15000);
  appConfig.ai_file_ttl_hours = pickNumber(req.body.ai_file_ttl_hours, appConfig.ai_file_ttl_hours || 12);
  appConfig.invalid_quota_24h = pickNumber(req.body.invalid_quota_24h, appConfig.invalid_quota_24h || 500);
  appConfig.invalid_penalty_percent = pickNumber(req.body.invalid_penalty_percent, appConfig.invalid_penalty_percent || 50);
  appConfig.nik_status = req.body.nik_status || appConfig.nik_status || 'on';
  appConfig.whatsapp_status = req.body.whatsapp_status || appConfig.whatsapp_status || 'on';
  appConfig.bpjs_status = req.body.bpjs_status || appConfig.bpjs_status || 'off';
  appConfig.pln_status = req.body.pln_status || appConfig.pln_status || 'off';
  appConfig.ai_status = req.body.ai_status || appConfig.ai_status || 'off';
  appConfig.bank_server4_status = req.body.bank_server4_status || appConfig.bank_server4_status;
  appConfig.bank_server4_apikey = req.body.bank_server4_apikey || appConfig.bank_server4_apikey;
  appConfig.ewallet_server3_status = req.body.ewallet_server3_status || appConfig.ewallet_server3_status;
  appConfig.ewallet_server3_apikey = req.body.ewallet_server3_apikey || appConfig.ewallet_server3_apikey;
  appConfig.bank_server5_status = req.body.bank_server5_status || appConfig.bank_server5_status;
  appConfig.ewallet_server5_status = req.body.ewallet_server5_status || appConfig.ewallet_server5_status;
  appConfig.server5_base_url = req.body.server5_base_url || appConfig.server5_base_url;
  appConfig.qiospay_member_id = req.body.qiospay_member_id || appConfig.qiospay_member_id || '';
  appConfig.qiospay_pin = req.body.qiospay_pin || appConfig.qiospay_pin || '';
  appConfig.qiospay_password = req.body.qiospay_password || appConfig.qiospay_password || '';
  appConfig.qiospay_callback_key = req.body.qiospay_callback_key || appConfig.qiospay_callback_key || '112233';
  appConfig.qiospay_wait_timeout_ms = parseInt(req.body.qiospay_wait_timeout_ms, 10) || appConfig.qiospay_wait_timeout_ms || 10000;
  appConfig.bank_server6_status = req.body.bank_server6_status || appConfig.bank_server6_status;
  appConfig.bank_server6_apikey = req.body.bank_server6_apikey || appConfig.bank_server6_apikey;
  appConfig.bank_server6_base_url = req.body.bank_server6_base_url || appConfig.bank_server6_base_url;
  appConfig.bank_server7_status = req.body.bank_server7_status || appConfig.bank_server7_status || 'off';
  appConfig.bank_server7_base_url = req.body.bank_server7_base_url || appConfig.bank_server7_base_url || 'https://rikipilkonokos.xyz/api/bank';
  appConfig.bank_server7_apikey = req.body.bank_server7_apikey !== undefined ? req.body.bank_server7_apikey : (appConfig.bank_server7_apikey || '');
  appConfig.ewallet_server6_status = req.body.ewallet_server6_status || appConfig.ewallet_server6_status;
  appConfig.ewallet_server6_apikey = req.body.ewallet_server6_apikey || appConfig.ewallet_server6_apikey;
  appConfig.ewallet_server6_base_url = req.body.ewallet_server6_base_url || appConfig.ewallet_server6_base_url;
  appConfig.ewallet_server7_status = req.body.ewallet_server7_status || appConfig.ewallet_server7_status;
  appConfig.ewallet_server7_auto_window_enabled = req.body.ewallet_server7_auto_window_enabled || appConfig.ewallet_server7_auto_window_enabled || 'on';
  appConfig.ewallet_server7_base_url = req.body.ewallet_server7_base_url || appConfig.ewallet_server7_base_url || 'https://v1.cekapi.com/cekewallet';
  appConfig.ewallet_server7_apikey = req.body.ewallet_server7_apikey || appConfig.ewallet_server7_apikey || '68a561-32cf0d-7f267b-484a96-90eb34';
  appConfig.ewallet_server7_cookie = req.body.ewallet_server7_cookie || appConfig.ewallet_server7_cookie || '';
  appConfig.ewallet_server7_pool_enabled = 'off';
  appConfig.ewallet_server7_pool = [];
  appConfig.ewallet_server8_status = req.body.ewallet_server8_status || appConfig.ewallet_server8_status || 'off';
  appConfig.ewallet_server8_base_url = req.body.ewallet_server8_base_url || appConfig.ewallet_server8_base_url || 'https://rikipilkonokos.xyz/api/ewallet';
  appConfig.ewallet_server8_apikey = req.body.ewallet_server8_apikey !== undefined ? req.body.ewallet_server8_apikey : (appConfig.ewallet_server8_apikey || '');
  appConfig.klikmbc_ppob_base_url = req.body.klikmbc_ppob_base_url || appConfig.klikmbc_ppob_base_url || 'https://klikmbc.biz/v2/ppob_result_ajax-pin';
  appConfig.klikmbc_ppob_cookie = req.body.klikmbc_ppob_cookie || appConfig.klikmbc_ppob_cookie || '';
  appConfig.games_status = req.body.games_status || appConfig.games_status;
  appConfig.ewallet_server7_cookie_auto_refresh = req.body.ewallet_server7_cookie_auto_refresh || appConfig.ewallet_server7_cookie_auto_refresh || 'off';
  appConfig.ewallet_server7_cookie_refresh_hours = pickNumber(req.body.ewallet_server7_cookie_refresh_hours, appConfig.ewallet_server7_cookie_refresh_hours || 24);
  appConfig.cost_games = pickNumber(req.body.cost_games, appConfig.cost_games || 0);
  appConfig.h2h_member_id = req.body.h2h_member_id || appConfig.h2h_member_id;
  appConfig.h2h_pin = req.body.h2h_pin || appConfig.h2h_pin;
  appConfig.h2h_password = req.body.h2h_password || appConfig.h2h_password;
  appConfig.h2h_base_url = req.body.h2h_base_url || appConfig.h2h_base_url;
  appConfig.member_register_bonus = pickNumber(req.body.member_register_bonus, appConfig.member_register_bonus || 50);
  const pauseHoursRaw = parseInt(req.body.member_register_pause_hours, 10);
  const memberRegisterEnabledRaw = String(req.body.member_register_enabled || '0');
  if (!Number.isNaN(pauseHoursRaw) && pauseHoursRaw > 0) {
    // Auto-close registration when pause duration is set.
    appConfig.member_register_enabled = 0;
    const reopenAt = new Date(Date.now() + (pauseHoursRaw * 3600 * 1000));
    appConfig.member_register_reopen_at = reopenAt.toISOString();
  } else {
    appConfig.member_register_enabled = memberRegisterEnabledRaw === '1' ? 1 : 0;
    if (appConfig.member_register_enabled === 1) {
      appConfig.member_register_reopen_at = '';
    } else if (!appConfig.member_register_reopen_at) {
      appConfig.member_register_reopen_at = '';
    }
  }
  appConfig.member_pin_max_attempts = pickNumber(req.body.member_pin_max_attempts, appConfig.member_pin_max_attempts || 5);
  appConfig.member_pin_lock_minutes = pickNumber(req.body.member_pin_lock_minutes, appConfig.member_pin_lock_minutes || 15);
  fs.writeFileSync(cfg.CONFIG_FILE_PATH, JSON.stringify(appConfig, null, 2));
  cfg.syncSettingsToDB().catch(e => console.error('[CONFIG] Background sync failed:', e));
  try {
    const { settingsCache } = require('../lib/auth');
    settingsCache.flushAll();
  } catch (e) {}
  try { poolCookieRefresher.initPoolCookieRefresher(); } catch (e) {}
  const isAjax = req.headers['x-requested-with'] === 'XMLHttpRequest';
  if (isAjax) return res.json({ ok: true });
  res.redirect('/admin?saved=1');
});

router.post('/reset', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).send('Unauthorized');
  try {
    await cfg.dbPool.query("DELETE FROM api_logs WHERE is_success = 0");
    statsCache.del('dashboard_stats');
    res.redirect('/admin?reset=1&msg=Deleted_failed_logs_only');
  } catch (err) {
    res.status(500).send('Error resetting logs: ' + err.message);
  }
});

router.get('/sync-db', (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const { apiKeyCache, settingsCache } = require('../lib/auth');
  apiKeyCache.flushAll();
  settingsCache.flushAll();
  res.json({ status: true, message: 'Database cache has been cleared and will be synced on next request.' });
});

router.get('/mysql-status', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const connection = await cfg.dbPool.getConnection();
    await connection.ping();
    connection.release();
    res.json({ status: true, connected: true, message: 'MySQL Connected' });
  } catch (err) {
    res.json({ status: false, connected: false, message: err.message });
  }
});

// ==================== ADMIN SERVER TESTER ====================
router.get('/test-server/qiospay-result', (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const refID = String(req.query.ref_id || '').trim();
  if (!refID) return res.status(400).json({ status: false, state: 'bad_request', message: 'ref_id wajib diisi.' });
  const item = qiospayTesterResults.get(refID);
  if (!item) return res.status(404).json({ status: false, state: 'not_found', ref_id: refID, message: 'Data transaksi tester tidak ditemukan.' });
  const ageMs = Date.now() - (item.created_at || Date.now());
  if (item.state === 'success') {
    return res.json({
      status: true,
      state: 'success',
      server: 'server5',
      ref_id: refID,
      name: item.account_name,
      raw: { request_ack: item.request_ack, callback: item.callback_payload },
      ms: ageMs
    });
  }
  if (item.state === 'callback_received') {
    return res.json({
      status: false,
      state: 'callback_received',
      server: 'server5',
      ref_id: refID,
      message: 'Callback diterima, tetapi SN/account_name belum ditemukan.',
      raw: { request_ack: item.request_ack, callback: item.callback_payload },
      ms: ageMs
    });
  }
  if (ageMs >= (item.wait_ms || 10000)) {
    qiospayTesterResults.set(refID, { ...item, state: 'timeout' });
    return res.status(504).json({
      status: false,
      state: 'timeout',
      server: 'server5',
      ref_id: refID,
      message: 'Timeout callback Qiospay.',
      raw: { request_ack: item.request_ack },
      ms: ageMs
    });
  }
  return res.status(202).json({
    status: false,
    state: item.state || 'waiting',
    server: 'server5',
    ref_id: refID,
    message: 'Masih menunggu callback Qiospay.',
    ms: ageMs
  });
});

router.get('/test-server', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });

  const { type, server, code, account_number, nik, nomor, image, q } = req.query;
  const appConfig = cfg.appConfig;
  const t0 = Date.now();

  const extractJson = (text) => {
    try { const s = text.indexOf('{'); const e = text.lastIndexOf('}'); if (s !== -1 && e > s) return JSON.parse(text.substring(s, e + 1)); } catch (e) { } return null;
  };
  const extractKlikmbcLabelValue = (html, label) => {
    const escapedLabel = String(label || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`<span class=\"label-text-grayscale\">(?:<b>)?${escapedLabel}(?:<\\/b>)?<\\/span>[\\s\\S]*?<b>(.*?)<\\/b>`, 'i');
    const match = String(html || '').match(regex);
    return match && match[1] ? String(match[1]).trim() : '';
  };
  const timeout = (ms) => { const ctrl = new AbortController(); const id = setTimeout(() => ctrl.abort(), ms); return { signal: ctrl.signal, clear: () => clearTimeout(id) }; };
  const server5EwalletCodes = new Set(['dana', 'gopay', 'linkaja', 'ovo', 'shopeepay']);
  const server6EwalletCodes = new Set(['gopay', 'dana', 'shopeepay', 'ovo', 'linkaja']);
  const server7EwalletCodes = new Set(['dana', 'gopay', 'ovo', 'spay', 'shopeepay']);
  const server7CodeMap = { dana: 'dana', gopay: 'gopay', ovo: 'ovo', spay: 'shopeepay', shopeepay: 'shopeepay' };
  const server8CodeMap = {
    dana: 'dana',
    gopay: 'gopay',
    ovo: 'ovo',
    shopeepay: 'shopeepay',
    spay: 'shopeepay',
    wallet_shopeepay: 'shopeepay',
    linkaja: 'linkaja',
    wallet_linkaja: 'linkaja',
    isaku: 'isaku',
    wallet_isaku: 'isaku',
    grab: 'grab',
    grab_user: 'grab',
    'gopay-driver': 'gopay-driver',
    gopay_driver: 'gopay-driver'
  };
  const ms = appConfig.timeout_ms || 7000;
  const FAIL_MSG = 'Validasi gagal pada server ini.';
  const klikmbcHeaders = (endpoint, cookie) => {
    let origin = '';
    try {
      const u = new URL(endpoint);
      origin = `${u.protocol}//${u.host}`;
    } catch (e) {}
    return {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) WebTester/1.0',
      'Accept': '*/*',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Origin': origin || undefined,
      'Referer': origin ? `${origin}/v2/main-tpl` : undefined,
      'Cookie': cookie
    };
  };

  try {
    // -------- WHATSAPP --------
    if (type === 'whatsapp') {
      const raw = (nomor || '').replace(/[^0-9]/g, '');
      const target = raw.startsWith('62') ? raw : raw.startsWith('0') ? '62' + raw.slice(1) : '62' + raw;

      if (server === 'internal') return res.json({ status: false, server, message: 'WA Internal (Baileys) sudah dihapus', ms: Date.now() - t0 });
      if (server === 'server1') {
        const { signal, clear } = timeout(ms);
        const form = new URLSearchParams(); form.append('target', '0' + target.slice(2)); form.append('countryCode', '62');
        const r = await fetch('https://api.fonnte.com/validate', { method: 'POST', headers: { Authorization: appConfig.fonnte_token, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString(), signal });
        clear();
        const d = await r.json();
        const ok = !!(d.status === true && d.data && d.data[0] && d.data[0].valid);
        return res.json({ status: ok, server, message: ok ? 'Validasi berhasil.' : FAIL_MSG, raw: d, ms: Date.now() - t0 });
      }
      if (server === 'server2') {
        const { signal, clear } = timeout(ms);
        const url = `https://api.pitucode.com/whatsapp-checker-stalker?apikey=${encodeURIComponent(appConfig.pitucode_apikey)}&number=${encodeURIComponent(target)}`;
        const r = await fetch(url, { signal }); clear();
        const d = await r.json();
        const ok = !!(d.success === true);
        return res.json({ status: ok, server, message: ok ? 'Validasi berhasil.' : FAIL_MSG, raw: d, ms: Date.now() - t0 });
      }
      return res.json({ status: false, server, message: 'Server tidak dikenal', ms: Date.now() - t0 });
    }

    // -------- AI --------
    if (type === 'ai') {
      const imageUrl = String(image || account_number || '').trim();
      const queryText = String(q || code || '').trim();
      if (!imageUrl || !queryText) {
        return res.status(400).json({ status: false, server: 'neoxr', message: 'image dan q wajib diisi.', ms: Date.now() - t0 });
      }
      const endpoint = String(appConfig.ai_endpoint || 'https://api.neoxr.eu/api/photo-editor').trim();
      const apikey = String(appConfig.ai_apikey || '9ViEsr').trim();
      const aiTimeout = Math.max(1000, parseInt(appConfig.ai_timeout_ms, 10) || ms);
      const { signal, clear } = timeout(aiTimeout);
      const u = new URL(endpoint);
      u.searchParams.set('image', imageUrl);
      u.searchParams.set('q', queryText.slice(0, 100));
      u.searchParams.set('apikey', apikey);
      const r = await fetch(u.toString(), { signal });
      clear();
      const rawText = await r.text();
      let d = null;
      try { d = JSON.parse(rawText); } catch (e) { d = null; }
      if (!d || d.status !== true || !d.data) {
        return res.status(400).json({ status: false, server: 'neoxr', message: FAIL_MSG, raw: d || rawText, ms: Date.now() - t0 });
      }
      const sourceImageUrl = String(d.data.downloadUrl || d.data.url || '').trim();
      if (!sourceImageUrl) return res.status(400).json({ status: false, server: 'neoxr', message: 'Provider tidak mengembalikan URL hasil.', raw: d, ms: Date.now() - t0 });
      const ttlHours = Math.max(1, parseInt(appConfig.ai_file_ttl_hours, 10) || 12);
      const saved = await aiStorage.saveFromRemote({ remoteUrl: sourceImageUrl, code: d.data.code || '', ttlHours });
      const baseUrl = resolvePublicBaseUrl(req);
      const mapped = {
        code: saved.code || d.data.code || '',
        bytes: Number(saved.bytes || d.data.bytes || 0),
        expired_at: saved.expires_at || d.data.expired_at || null,
        downloadUrl: `${baseUrl}/get/ai?code=${encodeURIComponent(saved.code || d.data.code || '')}`
      };
      return res.json({ status: true, server: 'neoxr', message: 'AI berhasil diproses.', data: mapped, raw: d, ms: Date.now() - t0 });
    }

    // -------- NIK --------
    if (type === 'nik') {
      const nikNum = (nik || '').replace(/[^0-9]/g, '');
      const { signal, clear } = timeout(ms);
      const form = new URLSearchParams(); form.append('api_key', appConfig.api_key); form.append('nik', nikNum);
      const r = await fetch(appConfig.nik_endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString(), signal }); clear();
      const d = await r.json();
      const ok = !!(d.status && d.status.toLowerCase() === 'success' && d.data && d.data.name);
      return res.json({ status: ok, server: 'server1', message: ok ? 'Validasi berhasil.' : FAIL_MSG, raw: d, ms: Date.now() - t0 });
    }

    // -------- BPJS / PLN --------
    if (type === 'bpjs' || type === 'pln') {
      const target = (account_number || '').replace(/[^0-9]/g, '');
      if (!target) return res.status(400).json({ status: false, server, message: 'Nomor pelanggan wajib diisi.', ms: Date.now() - t0 });
      if (server !== 'server7') return res.json({ status: false, server, message: 'Server tidak dikenal', ms: Date.now() - t0 });

      const endpoint = String(appConfig.klikmbc_ppob_base_url || 'https://klikmbc.biz/v2/ppob_result_ajax-pin').trim();
      const cookie = String(appConfig.klikmbc_ppob_cookie || appConfig.ewallet_server7_cookie || '').trim();
      if (!endpoint || !cookie) {
        return res.json({ status: false, server, message: 'Konfigurasi server 7 belum lengkap.', ms: Date.now() - t0 });
      }

      const bodyData = new URLSearchParams({
        ppob: type === 'bpjs' ? 'BPJSKS' : 'PLN',
        nomorpelanggan: target,
        nominal: 'PLNS20',
        bulanbpjs: '1',
        browser: 'Mozilla/5.0'
      });
      const { signal, clear } = timeout(ms);
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0',
          'Cookie': cookie
        },
        body: bodyData.toString(),
        signal
      });
      clear();
      const html = await r.text();
      const customerName = extractKlikmbcLabelValue(html, 'Nama Pelanggan');
      const ok = !!(r.ok && customerName);
      if (!ok) {
        return res.json({ status: false, server, message: FAIL_MSG, raw: { parsed: false, http_status: r.status }, ms: Date.now() - t0 });
      }
      const data = {
        service: type,
        account_number: extractKlikmbcLabelValue(html, 'Nomor Pelanggan') || target,
        customer_name: customerName,
        total_bill: extractKlikmbcLabelValue(html, 'Total Tagihan'),
        admin_fee: extractKlikmbcLabelValue(html, 'Biaya Admin'),
        total_pay: extractKlikmbcLabelValue(html, 'Total Bayar')
      };
      if (type === 'bpjs') {
        data.participant_name = extractKlikmbcLabelValue(html, 'Nama Peserta');
        data.participant_count = extractKlikmbcLabelValue(html, 'Jumlah Peserta');
        data.bill_period = extractKlikmbcLabelValue(html, 'Bayar sampai');
      } else {
        data.tariff_power = extractKlikmbcLabelValue(html, 'Tarif Daya');
        data.meter_stand = extractKlikmbcLabelValue(html, 'Stand Meter');
        data.bill_period = extractKlikmbcLabelValue(html, 'Bulan, Tahun(BL/TH)');
      }
      return res.json({ status: true, server, message: 'Validasi berhasil.', data, raw: { parsed: true }, ms: Date.now() - t0 });
    }

    // -------- BANK --------
    if (type === 'bank') {
      const { getBankMapping, getBankServer3NameByCode } = require('./api_checker');
      const bankMapping = getBankMapping();
      let kode_s1 = code, kode_s2 = code, kode_s4 = null;
      for (const b of bankMapping) {
        const c1 = (b.kode_s1 || b.code || '').toLowerCase();
        const c2 = (b.kode_s2 || '').toLowerCase();
        if (c1 === code.toLowerCase() || c2 === code.toLowerCase() || (b.codeid && String(b.codeid) === code)) {
          kode_s1 = b.kode_s1 || b.code || code;
          kode_s2 = b.kode_s2 || kode_s1;
          kode_s4 = b.codeid ? String(b.codeid) : null;
          break;
        }
      }
      if (server === 'server1') {
        const { signal, clear } = timeout(ms);
        const form = new URLSearchParams(); form.append('api_key', appConfig.api_key); form.append('bank_code', kode_s1); form.append('account_number', account_number);
        const r = await fetch(appConfig.bank_endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString(), signal }); clear();
        const d = await r.json();
        const ok = !!(d.status && d.status.toLowerCase() === 'success' && d.data && d.data.customer_name);
        return res.json({ status: ok, server, message: ok ? 'Validasi berhasil.' : FAIL_MSG, name: d.data && d.data.customer_name, raw: d, ms: Date.now() - t0 });
      }
      if (server === 'server2') {
        const { signal, clear } = timeout(ms);
        const url = `https://aasardconnect.biz.id/connection/bank/?norek=${encodeURIComponent(account_number)}&kode=${encodeURIComponent(kode_s2)}&key=${encodeURIComponent(appConfig.bank_server2_apikey)}`;
        const r = await fetch(url, { signal }); clear();
        const d = extractJson(await r.text());
        const name = d && (d.nickname || (d.data && d.data.username));
        const ok = !!(name);
        return res.json({ status: ok, server, message: ok ? 'Validasi berhasil.' : FAIL_MSG, name, raw: d, ms: Date.now() - t0 });
      }
      if (String(server || '').startsWith('server3')) {
        const poolAttemptMs = Math.max(
          1000,
          parseInt(appConfig.pool_attempt_timeout_ms, 10) || 0,
          parseInt(appConfig.timeout_ms, 10) || 0,
          10000
        );
        const target_code = kode_s4 ? String(kode_s4).trim() : '';
        const target_bank_name = getBankServer3NameByCode(target_code);
        if (!target_code || !target_bank_name) {
          return res.json({ status: false, server, message: FAIL_MSG, raw: { parsed: false, reason: 'mapping_not_found' }, ms: Date.now() - t0 });
        }
        const fallbackEndpoint = String(appConfig.bank_server3_base_url || '').trim();
        const fallbackCookie = String(appConfig.bank_server3_cookie || '').trim();
        const baseCandidates = (fallbackEndpoint && fallbackCookie)
          ? [{ alias: 'server3', endpoint: fallbackEndpoint, cookie: fallbackCookie }]
          : [];
        if (!baseCandidates.length) {
          return res.json({ status: false, server: 'server3', message: 'Konfigurasi server 3 belum lengkap.', ms: Date.now() - t0 });
        }
        const candidates = baseCandidates.slice();

        const attempts = [];
        for (const candidate of candidates) {
          const endpoint = String(candidate.endpoint || '').trim();
          const cookie = String(candidate.cookie || '').trim();
          const alias = String(candidate.alias || 'server3').toLowerCase();
          if (!endpoint || !cookie) {
            attempts.push({ alias, ok: false, reason: 'config_incomplete' });
            continue;
          }
          let host = '-';
          let origin = '';
          try {
            const u = new URL(endpoint);
            host = u.host;
            origin = `${u.protocol}//${u.host}`;
          } catch (_) {}
          const body = new URLSearchParams({
            merchant: `TRANSFER ONLINE|${target_bank_name}|${target_code}`,
            nomorpelanggan: account_number,
            nominal: '10.000',
            payment_desc: '',
            merchant_favorit: '',
            tambahfavorit: 'NO',
            rekeningbaru: 'NO',
            metode: 'BIFAST'
          });
          try {
            const { signal, clear } = timeout(poolAttemptMs);
            const r = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Origin': origin || undefined,
                'Referer': origin ? `${origin}/` : undefined,
                'Cookie': cookie
              },
              body: body.toString(),
              signal
            });
            const html = await r.text();
            clear();
            const name = extractKlikmbcLabelValue(html, 'Nama Penerima');
            const ok = !!name;
            attempts.push({ alias, ok, http_status: r.status, reason: ok ? 'ok' : 'parse_failed' });
            if (!ok) continue;
            return res.json({
              status: true,
              server: alias,
              message: 'Validasi berhasil.',
              name,
              raw: {
                parsed: true,
                http_status: r.status,
                bank_name: target_bank_name,
                bank_codeid: target_code,
                rekening_tujuan: extractKlikmbcLabelValue(html, 'Rekening Tujuan') || '',
                bank_tujuan: extractKlikmbcLabelValue(html, 'Bank Tujuan') || '',
                request_debug: {
                  method: 'POST',
                  server_alias: alias,
                  host,
                  payload: Object.fromEntries(body.entries()),
                  headers_used: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Origin': origin,
                    'Referer': origin ? `${origin}/` : '',
                    'Cookie': maskCookieValue(cookie || '')
                  }
                },
                attempts
              },
              ms: Date.now() - t0
            });
          } catch (e) {
            attempts.push({ alias, ok: false, reason: e && e.name === 'AbortError' ? 'timeout' : (e.message || 'request_error') });
          }
        }

        return res.json({
          status: false,
          server: 'server3',
          message: FAIL_MSG,
          raw: { parsed: false, attempts },
          ms: Date.now() - t0
        });
      }
      if (server === 'server4') {
        const target_code = kode_s4 || code;
        const { signal, clear } = timeout(ms);
        const url = `https://api.cutiezy.id/api/check/bank?service=cek_bank&code=${encodeURIComponent(target_code)}&user_id=${encodeURIComponent(account_number)}&apikey=${encodeURIComponent(appConfig.bank_server4_apikey)}`;
        const r = await fetch(url, { signal }); clear();
        const d = await r.json();
        const ok = !!(d.ok === true && d.data && d.data.accountname);
        return res.json({ status: ok, server, message: ok ? 'Validasi berhasil.' : FAIL_MSG, name: d.data && d.data.accountname, raw: d, ms: Date.now() - t0 });
      }
      if (server === 'server5') {
        const target_code = kode_s4 || code;
        const { signal, clear } = timeout(ms);
        const url = `${appConfig.server5_base_url}?bank=${encodeURIComponent(target_code)}&accountNumber=${encodeURIComponent(account_number)}`;
        const r = await fetch(url, { signal }); clear();
        const d = await r.json();
        const ok = !!(d.success === true && d.data && d.data.accountName);
        return res.json({ status: ok, server, message: ok ? 'Validasi berhasil.' : FAIL_MSG, name: d.data && d.data.accountName, raw: d, ms: Date.now() - t0 });
      }
      if (server === 'server6') {
        const target_code = kode_s4 ? String(kode_s4).trim() : '';
        if (!target_code) {
          return res.json({ status: false, server, message: 'Server 6 hanya mendukung codeid bank yang valid.', ms: Date.now() - t0 });
        }
        const { signal, clear } = timeout(ms);
        const baseUrl = String(appConfig.bank_server6_base_url || '').replace(/\/+$/, '');
        const url = `${baseUrl}/?kode=${encodeURIComponent(target_code)}&nomor=${encodeURIComponent(account_number)}&api_key=${encodeURIComponent(appConfig.bank_server6_apikey || '')}`;
        const r = await fetch(url, { signal }); clear();
        const d = await r.json();
        const name = d && d.nickname;
        const statusCode = d && d.result ? String(d.result.status || '') : '';
        const ok = !!(statusCode === '200' && name);
        return res.json({ status: ok, server, message: ok ? 'Validasi berhasil.' : FAIL_MSG, name, raw: d, ms: Date.now() - t0 });
      }
      if (server === 'server7') {
        const target_code = kode_s4 ? String(kode_s4).trim() : '';
        if (!target_code) {
          return res.json({ status: false, server, message: 'Server 7 hanya mendukung codeid bank yang valid.', ms: Date.now() - t0 });
        }
        const endpoint = String(appConfig.bank_server7_base_url || 'https://rikipilkonokos.xyz/api/bank').trim().replace(/\/+$/, '');
        const apikey = String(appConfig.bank_server7_apikey || '').trim();
        if (!endpoint || !apikey) {
          return res.json({ status: false, server, message: 'Konfigurasi server 7 bank belum lengkap.', ms: Date.now() - t0 });
        }
        const { signal, clear } = timeout(ms);
        const u = new URL(`${endpoint}/`);
        u.searchParams.set('rekening', String(account_number || '').trim());
        u.searchParams.set('bank', target_code);
        u.searchParams.set('key', apikey);
        const r = await fetch(u.toString(), { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }, signal });
        clear();
        const d = await r.json();
        const name = normalizeServer8EwalletName(d && d.name);
        const ok = !!(r.ok && d && d.status === true && String(d.code || '') === '200' && name);
        return res.json({ status: ok, server, message: ok ? 'Validasi berhasil.' : FAIL_MSG, name, raw: d, ms: Date.now() - t0 });
      }
      return res.json({ status: false, server, message: 'Server tidak dikenal', ms: Date.now() - t0 });
    }

    // -------- EWALLET --------
    if (type === 'ewallet') {
      const ewalletMapping = { dana: 'wallet_dana', ovo: 'wallet_ovo', gopay: 'gopay_user', gopay_user: 'gopay_user', shopeepay: 'wallet_shopeepay', linkaja: 'wallet_linkaja', grab: 'grab_user', isaku: 'wallet_isaku' };
      const mapped = ewalletMapping[code.toLowerCase()] || code;
      if (server === 'server1') {
        const { signal, clear } = timeout(ms);
        const form = new URLSearchParams(); form.append('api_key', appConfig.api_key); form.append('ewallet_code', mapped); form.append('phone_number', account_number);
        const r = await fetch(appConfig.ewallet_endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString(), signal }); clear();
        const d = await r.json();
        const name = d.data && d.data.customer_name;
        const ok = !!(d.status && d.status.toLowerCase() === 'success' && name);
        return res.json({ status: ok, server, message: ok ? 'Validasi berhasil.' : FAIL_MSG, name, raw: d, ms: Date.now() - t0 });
      }
      if (server === 'server2') {
        const s2code = code.toLowerCase().replace('wallet_', '');
        const { signal, clear } = timeout(ms);
        const baseUrl = String(appConfig.ewallet_server2_base_url || 'https://billpaketdata.com/cekid/ewallet/check_packages').replace(/\/+$/, '');
        const url = `${baseUrl}/${encodeURIComponent(account_number)}/${encodeURIComponent(s2code)}`;
        const r = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }, signal }); clear();
        const d = await r.json();
        const name = String(d && d.cust_name || '').trim();
        const ok = !!(r.ok && d && d.success === true && name);
        return res.json({ status: ok, server, message: ok ? 'Validasi berhasil.' : FAIL_MSG, name, raw: d, ms: Date.now() - t0 });
      }
      if (server === 'server3') {
        const s3code = code.toLowerCase().replace('wallet_', '');
        const { signal, clear } = timeout(ms);
        const url = `https://api.cutiezy.id/api/check/ewallet?service=${encodeURIComponent(s3code)}&user_id=${encodeURIComponent(account_number)}&apikey=${encodeURIComponent(appConfig.ewallet_server3_apikey)}`;
        const r = await fetch(url, { signal }); clear();
        const d = await r.json();
        const name = normalizeServer3EwalletName(d.data && d.data.nickname);
        const ok = !!(d.ok === true && name);
        return res.json({ status: ok, server, message: ok ? 'Validasi berhasil.' : FAIL_MSG, name, raw: d, ms: Date.now() - t0 });
      }
      if (server === 'server5') {
        logQiospayTester(`START server5 test code=${String(code || '')} account=${String(account_number || '')}`);
        const s5code = code.toLowerCase().replace('wallet_', '');
        if (!server5EwalletCodes.has(s5code)) {
          return res.json({ status: false, server, message: 'Server 5 hanya mendukung dana, gopay, linkaja, ovo, dan shopeepay.', ms: Date.now() - t0 });
        }

        const qiospayProductMap = {
          dana: 'QDANAV',
          gopay: 'QGOPAYV',
          linkaja: 'QCEKLINKAJAV',
          ovo: 'QCEKOVV',
          shopeepay: 'QSPAYV'
        };
        const qiospayProduct = qiospayProductMap[s5code];
        const memberId = String(appConfig.qiospay_member_id || '').trim();
        const pin = String(appConfig.qiospay_pin || '').trim();
        const password = String(appConfig.qiospay_password || '').trim();
        const callbackKey = String(appConfig.qiospay_callback_key || '112233').trim();
        const waitMs = Number(appConfig.qiospay_wait_timeout_ms) || ms || 10000;

        if (!qiospayProduct || !memberId || !pin || !password) {
          logQiospayTester(`CONFIG_INCOMPLETE product=${qiospayProduct || '-'} member=${memberId ? 'ok' : 'empty'} pin=${pin ? 'ok' : 'empty'} password=${password ? 'ok' : 'empty'}`);
          return res.json({ status: false, server, message: 'Konfigurasi Qiospay belum lengkap untuk server5 ewallet.', ms: Date.now() - t0 });
        }

        const refID = makeQiospayRefId();
        const callback = `${resolvePublicBaseUrl(req)}/callback_qiospay?key=${encodeURIComponent(callbackKey)}`;
        const qs = new URLSearchParams({
          product: qiospayProduct,
          dest: account_number,
          refID,
          memberID: memberId,
          pin,
          password
        });

        qiospayTesterResults.set(refID, {
          state: 'waiting',
          request_ack: null,
          callback_payload: null,
          account_name: '',
          created_at: Date.now(),
          expires_at: Date.now() + QIOSPAY_TESTER_TTL_MS,
          wait_ms: waitMs
        });
        const timer = setTimeout(() => {
          sharedQiospayWaiters.delete(refID);
          const current = qiospayTesterResults.get(refID);
          if (current && current.state === 'waiting') {
            qiospayTesterResults.set(refID, { ...current, state: 'timeout' });
          }
          logQiospayTester(`CALLBACK_TIMEOUT refID=${refID}`);
        }, waitMs);
        sharedQiospayWaiters.set(refID, {
          resolve: (payload) => {
            clearTimeout(timer);
            const name = parseQiospaySn(payload);
            const current = qiospayTesterResults.get(refID) || {};
            qiospayTesterResults.set(refID, {
              ...current,
              state: name ? 'success' : 'callback_received',
              callback_payload: payload,
              account_name: name || '',
              expires_at: Date.now() + QIOSPAY_TESTER_TTL_MS
            });
            logQiospayTester(`CALLBACK_OK refID=${refID} name=${name || '-'} payload=${JSON.stringify(payload).slice(0, 500)}`);
          }
        });
        logQiospayTester(`WAIT_REGISTERED refID=${refID} callback=${callback}`);

        const { signal, clear } = timeout(ms);
        const ackRes = await fetch(`https://qiospay.id/api/h2h/trx?${qs.toString()}`, { method: 'GET', signal });
        clear();
        const ackText = await ackRes.text();
        const current = qiospayTesterResults.get(refID) || {};
        qiospayTesterResults.set(refID, { ...current, request_ack: ackText });
        logQiospayTester(`ACK refID=${refID} http=${ackRes.status} body=${String(ackText || '').slice(0, 400)}`);
        const ackJson = extractJson(ackText);
        if (!ackRes.ok) {
          sharedQiospayWaiters.delete(refID);
          clearTimeout(timer);
          qiospayTesterResults.set(refID, { ...current, state: 'provider_error', request_ack: ackText, expires_at: Date.now() + QIOSPAY_TESTER_TTL_MS });
          return res.status(502).json({
            status: false,
            server,
            message: `Qiospay HTTP ${ackRes.status} (request tidak diterima).`,
            debug: { refID, callback, ack_status: ackRes.status, ack_body: ackText },
            ms: Date.now() - t0
          });
        }
        if (ackJson && (ackJson.status === false || ackJson.success === false || Number(ackJson.code || 0) >= 400)) {
          sharedQiospayWaiters.delete(refID);
          clearTimeout(timer);
          qiospayTesterResults.set(refID, { ...current, state: 'rejected', request_ack: ackText, expires_at: Date.now() + QIOSPAY_TESTER_TTL_MS });
          return res.status(400).json({
            status: false,
            server,
            message: 'Qiospay menolak request awal, callback tidak akan dikirim.',
            debug: { refID, callback, ack: ackJson },
            ms: Date.now() - t0
          });
        }
        return res.status(202).json({
          status: false,
          state: 'pending',
          server,
          ref_id: refID,
          message: 'Transaksi Qiospay dibuat. Tester akan polling hasil callback.',
          raw: { request_ack: ackText },
          ms: Date.now() - t0
        });
      }
      if (server === 'server6') {
        const s6code = code.toLowerCase().replace('wallet_', '');
        if (!server6EwalletCodes.has(s6code)) {
          return res.json({ status: false, server, message: 'Server 6 hanya mendukung gopay, dana, shopeepay, ovo, dan linkaja.', ms: Date.now() - t0 });
        }
        const { signal, clear } = timeout(ms);
        const baseUrl = String(appConfig.ewallet_server6_base_url || '').replace(/\/+$/, '');
        const url = `${baseUrl}/${encodeURIComponent(s6code)}/?nomor=${encodeURIComponent(account_number)}&api_key=${encodeURIComponent(appConfig.ewallet_server6_apikey || '')}`;
        const r = await fetch(url, { signal }); clear();
        const d = await r.json();
        const name = d && d.message;
        const ok = !!((d.status === 200 || d.status === '200') && name);
        return res.json({ status: ok, server, message: ok ? 'Validasi berhasil.' : FAIL_MSG, name, raw: d, ms: Date.now() - t0 });
      }
      if (server === 'server7') {
        const poolAttemptMs = Math.max(
          1000,
          parseInt(appConfig.pool_attempt_timeout_ms, 10) || 0,
          parseInt(appConfig.timeout_ms, 10) || 0,
          10000
        );
        const s7code = code.toLowerCase().replace('wallet_', '');
        const cekapiCode = server7CodeMap[s7code];
        if (!server7EwalletCodes.has(s7code) || !cekapiCode) {
          return res.json({ status: false, server, message: 'Server 7 hanya mendukung dana, gopay, ovo, spay/shopeepay.', ms: Date.now() - t0 });
        }
        const endpoint = String(appConfig.ewallet_server7_base_url || 'https://v1.cekapi.com/cekewallet').trim();
        const apikey = String(appConfig.ewallet_server7_apikey || '').trim();
        if (!endpoint || !apikey) {
          return res.json({ status: false, server, message: 'Konfigurasi server 7 belum lengkap.', ms: Date.now() - t0 });
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), poolAttemptMs);
        const u = new URL(endpoint);
        u.searchParams.set('customer_no', String(account_number || '').trim());
        u.searchParams.set('ewallet', cekapiCode);
        u.searchParams.set('apikey', apikey);
        const r = await fetch(u.toString(), {
          method: 'GET',
          headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const d = await r.json();
        const name = getCekApiEwalletName(d);
        const providerStatus = String(d && d.data && d.data.status || '').toLowerCase();
        const ok = !!(r.ok && providerStatus === 'ditemukan' && name);
        return res.json({ status: ok, server, message: ok ? 'Validasi berhasil.' : FAIL_MSG, name, raw: d, ms: Date.now() - t0 });
      }
      if (server === 'server8') {
        const rawCode = String(code || '').trim().toLowerCase();
        const s8code = server8CodeMap[rawCode] || server8CodeMap[rawCode.replace(/^wallet_/, '')] || '';
        if (!s8code) {
          return res.json({ status: false, server, message: 'Server 8 mendukung dana, gopay, ovo, shopeepay, linkaja, isaku, grab, gopay-driver.', ms: Date.now() - t0 });
        }
        const endpoint = String(appConfig.ewallet_server8_base_url || 'https://rikipilkonokos.xyz/api/ewallet').trim().replace(/\/+$/, '');
        const apikey = String(appConfig.ewallet_server8_apikey || '').trim();
        if (!endpoint || !apikey) {
          return res.json({ status: false, server, message: 'Konfigurasi server 8 belum lengkap.', ms: Date.now() - t0 });
        }
        const { signal, clear } = timeout(ms);
        const u = new URL(`${endpoint}/${encodeURIComponent(s8code)}/`);
        u.searchParams.set('hp', String(account_number || '').trim());
        u.searchParams.set('key', apikey);
        const r = await fetch(u.toString(), { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }, signal });
        clear();
        const d = await r.json();
        const name = String(d && d.name || '').trim();
        const ok = !!(r.ok && d && d.status === true && String(d.code || '') === '200' && name);
        return res.json({ status: ok, server, message: ok ? 'Validasi berhasil.' : FAIL_MSG, name, raw: d, ms: Date.now() - t0 });
      }
      return res.json({ status: false, server, message: 'Server tidak dikenal', ms: Date.now() - t0 });
    }

    // -------- GAMES --------
    if (type === 'games') {
      const game_service = (req.query.game_service || '').trim();
      const game_user_id = (req.query.game_user_id || '').trim();
      const game_zone_id = (req.query.game_zone_id || '').trim();
      if (!game_service || !game_user_id) return res.status(400).json({ error: 'game_service dan game_user_id wajib diisi', ms: Date.now() - t0 });
      const apikey = appConfig.ewallet_server3_apikey;
      if (!apikey) return res.status(503).json({ error: 'API key Cutiezy belum dikonfigurasi', ms: Date.now() - t0 });
      const { signal, clear } = timeout(ms);
      let url = `https://api.cutiezy.id/api/check/games?service=${encodeURIComponent(game_service)}&user_id=${encodeURIComponent(game_user_id)}&apikey=${encodeURIComponent(apikey)}`;
      if (game_zone_id) url += `&zone_id=${encodeURIComponent(game_zone_id)}`;
      const r = await fetch(url, { headers: { 'X-API-Key': apikey }, signal }); clear();
      const d = await r.json();
      const isOk = !!(d && (d.ok === true || d.success === true) && d.data);
      return res.json({ status: isOk, server: 'cutiezy', service: game_service, nickname: d.data && d.data.nickname, data: d.data, raw: d, ms: Date.now() - t0 });
    }

    return res.status(400).json({ error: 'Type tidak valid' });
  } catch (err) {
    return res.status(500).json({ error: err.message, ms: Date.now() - t0 });
  }
});

// GET /admin/check-outbound-ip — cek IP outbound Node.js (untuk debug whitelist)
router.get('/check-outbound-ip', (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const https = require('https');
  https.get('https://api.ipify.org?format=json', (r) => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => {
      try { res.json({ status: true, outbound_ip: JSON.parse(d).ip }); }
      catch (e) { res.json({ status: true, outbound_ip: d.trim() }); }
    });
  }).on('error', (err) => {
    res.json({ status: false, error: err.message });
  });
});

module.exports = router;
