/**
 * routes/public_api.js
 * Public endpoints: status, check-apikey, bank-codes, codes, packages
 * Also admin routes: bank-routing, settings, cache clear
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const cfg = require('../lib/config');
const wa = require('../lib/whatsapp');
const { getHistoricalStats } = require('../lib/stats');
const { apiKeyCache, settingsCache, trial429Cache } = require('../lib/auth');
const vps = require('../lib/vps_utils');
const os = require('os');
const { getMergedDepositMethods, savePaymentMethodOverrides } = require('../lib/h2h_deposit');
const publicUploadStore = require('../lib/public_upload_store');

async function safeQuery(sql, params = [], fallbackRows = []) {
  try {
    return await cfg.dbPool.query(sql, params);
  } catch (err) {
    if (err && (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_FIELD_ERROR' || String(err.errno) === '1146' || String(err.errno) === '1054')) {
      return [fallbackRows];
    }
    throw err;
  }
}

// GET /api/v3/status
router.get('/status', (req, res) => {
  const internal = wa.getBaileysState ? wa.getBaileysState() : {};
  res.json({
    status: wa.connectionStatus,
    connected: !!(wa.isCheckerReady && wa.isCheckerReady()),
    qr_available: !!(internal && internal.qr_available),
    system: cfg.appConfig.server_name,
    timestamp: Date.now()
  });
});

// GET /api/v3/services-status
router.get('/services-status', (req, res) => {
  const app = cfg.appConfig || {};
  const isOn = (v, def = 'on') => String(v === undefined ? def : v).toLowerCase() === 'on';
  return res.json({
    status: true,
    data: {
      bank: isOn(app.bank_status, 'on'),
      ewallet: isOn(app.ewallet_status, 'on'),
      whatsapp: isOn(app.whatsapp_status, 'on'),
      nik: isOn(app.nik_status, 'on'),
      games: isOn(app.games_status, 'off'),
      bpjs: isOn(app.bpjs_status, 'off'),
      pln: isOn(app.pln_status, 'off'),
      ai: isOn(app.ai_status, 'off')
    },
    timestamp: Date.now()
  });
});

// GET /api/v3/check-apikey
router.get('/check-apikey', async (req, res) => {
  const apikey = String(req.query.api_key || req.query.apikey || '').trim();
  if (!apikey) return res.status(400).json({ status: false, error: 'api_key required' });
  try {
    const [rows] = await cfg.dbPool.query(`
      SELECT u.api_key, u.is_active, u.expiry, u.billing_type, u.package_id, p.name as package_name
      FROM api_keys u LEFT JOIN packages p ON u.package_id = p.package_id WHERE u.api_key = ? LIMIT 1
    `, [apikey]);
    if (!rows || rows.length === 0) return res.json({ status: true, valid: false, message: 'API Key tidak ditemukan.' });
    const u = rows[0];
    if (!u.is_active) return res.json({ status: true, valid: false, message: 'API Key tidak aktif.' });
    let daysLeft = null;
    const masked = apikey.length <= 10 ? apikey : (apikey.slice(0, 6) + '...' + apikey.slice(-4));
    res.json({ status: true, valid: true, message: 'API Key valid.', data: { api_key_masked: masked, billing_type: 'balance', package_id: null, package_name: null, expiry: null, days_left: daysLeft } });
  } catch (err) {
    console.error('[PUBLIC_API][CHECK_APIKEY] Error:', err);
    res.status(500).json({ status: false, error: 'Terjadi kesalahan server.' });
  }
});

// GET /api/v3/bank-codes
router.get('/bank-codes', (req, res) => {
  try {
    let mapping;
    try { if (fs.existsSync('./bank_codes.json')) { let data = JSON.parse(fs.readFileSync('./bank_codes.json', 'utf8')); mapping = data.daftar_bank ? data.daftar_bank : data; } } catch (e) { }
    if (!mapping) mapping = [];
    const publicList = mapping.filter(b => b.codeid).map(b => ({ name: b.nama_bank || b.name, codeid: b.codeid }));
    res.json({ status: true, data: publicList });
  } catch (err) {
    console.error('[PUBLIC_API][BANK_CODES] Error:', err);
    res.status(500).json({ status: false, message: 'Gagal mengambil data bank.' });
  }
});

// GET /api/v3/codes
router.get('/codes', (req, res) => {
  try {
    if (fs.existsSync('./bank_codes.json')) {
      const data = JSON.parse(fs.readFileSync('./bank_codes.json', 'utf8'));
      const list = data.daftar_bank || data;
      const formattedList = list.filter(b => b.codeid && b.codeid.trim() !== "").map(b => ({ name: b.nama_bank || b.name, code: b.codeid.trim() }));
      res.json({ status: true, data: formattedList });
    } else { res.status(404).json({ status: false, message: 'File bank_codes.json tidak ditemukan.' }); }
  } catch (err) {
    console.error('[PUBLIC_API][CODES] Error:', err);
    res.status(500).json({ status: false, message: 'Gagal membaca data kode.' });
  }
});

// GET /api/v3/public/packages
router.get('/public/packages', async (req, res) => {
  try {
    if (parseInt(cfg.appConfig.show_packages) !== 1) {
      return res.json({ status: true, data: [] });
    }
    const [rows] = await cfg.dbPool.query("SELECT * FROM packages WHERE is_active = 1 ORDER BY price ASC");
    res.json({ status: true, data: rows });
  } catch (err) {
    console.error('[PUBLIC_API][PACKAGES] Error:', err);
    res.status(500).json({ status: false, message: 'Gagal mengambil data paket.' });
  }
});

// GET /api/v3/games - Daftar game yang didukung
router.get('/games', (req, res) => {
  res.json({
    status: true,
    total: 16,
    data: [
      { service: 'region-ml',   name: 'Mobile Legends – Region',            category: 'Mobile Legends', requires_zone_id: true  },
      { service: 'mlbb-bundle', name: 'Mobile Legends – Bundle',            category: 'Mobile Legends', requires_zone_id: true  },
      { service: 'mlcreate',    name: 'Mobile Legends – Create Date',       category: 'Mobile Legends', requires_zone_id: true  },
      { service: 'first-topup', name: 'Mobile Legends – First Topup',       category: 'Mobile Legends', requires_zone_id: true  },
      { service: 'first-mcgg',  name: 'Magic Chess Go Go – First Topup',   category: 'Mobile Legends', requires_zone_id: true  },
      { service: 'free-fire',   name: 'Free Fire',                          category: 'Garena',         requires_zone_id: false },
      { service: 'undawn',      name: 'Garena Undawn',                      category: 'Garena',         requires_zone_id: false },
      { service: 'pubg',        name: 'PUBG Mobile',                        category: 'Tencent',        requires_zone_id: false },
      { service: 'codm',        name: 'Call of Duty Mobile',                category: 'Activision',     requires_zone_id: false },
      { service: 'genshin',     name: 'Genshin Impact',                     category: 'HoYoverse',      requires_zone_id: false },
      { service: 'hsr',         name: 'Honkai: Star Rail',                  category: 'HoYoverse',      requires_zone_id: false },
      { service: 'zenless',     name: 'Zenless Zone Zero',                  category: 'HoYoverse',      requires_zone_id: false },
      { service: 'hok',         name: 'Honor of Kings',                     category: 'TiMi Studio',    requires_zone_id: false },
      { service: 'blood-strike',name: 'Blood Strike',                       category: 'NetEase',        requires_zone_id: false },
      { service: 'valorant',    name: 'Valorant',                           category: 'Riot Games',     requires_zone_id: false, note: 'user_id format: name#tag' },
      { service: 'roblox',      name: 'Roblox',                             category: 'Roblox Corp',    requires_zone_id: false, note: 'user_id berupa username' }
    ]
  });
});

// GET /api/v3/image-base64?url=https://...
router.get('/image-base64', async (req, res) => {
  try {
    const rawUrl = String(req.query.url || '').trim();
    if (!rawUrl) return res.status(400).json({ status: false, message: 'url required' });
    let parsed;
    try { parsed = new URL(rawUrl); } catch (e) { parsed = null; }
    if (!parsed || !/^https?:$/i.test(parsed.protocol)) {
      return res.status(400).json({ status: false, message: 'url must be http/https' });
    }
    const controller = new AbortController();
    const tm = setTimeout(() => controller.abort(), 15000);
    const r = await fetch(parsed.toString(), { signal: controller.signal });
    clearTimeout(tm);
    if (!r.ok) return res.status(400).json({ status: false, message: 'failed to fetch image source' });
    const contentType = String(r.headers.get('content-type') || 'image/png').split(';')[0].trim() || 'image/png';
    if (!contentType.startsWith('image/')) return res.status(400).json({ status: false, message: 'source is not an image' });
    const arrBuf = await r.arrayBuffer();
    const base64 = Buffer.from(arrBuf).toString('base64');
    return res.json({
      status: true,
      data: {
        mime: contentType,
        bytes: Buffer.byteLength(base64, 'base64'),
        data_uri: `data:${contentType};base64,${base64}`
      }
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: 'failed to convert image to base64' });
  }
});

// POST /api/v3/upload-image-temp
// Body JSON: { filename, mime, data_base64 }
router.post('/upload-image-temp', async (req, res) => {
  try {
    const body = req.body || {};
    const filename = String(body.filename || '').trim();
    const mime = String(body.mime || '').trim().toLowerCase();
    const dataBase64 = String(body.data_base64 || '').trim();
    if (!mime || !dataBase64) {
      return res.status(400).json({ status: false, message: 'mime dan data_base64 wajib diisi.' });
    }
    const saved = publicUploadStore.saveBase64Image({ mime, base64: dataBase64, originalName: filename });
    const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
    const host = req.get('host');
    const baseUrl = `${proto}://${host}`.replace(/\/+$/, '');
    return res.json({
      status: true,
      data: {
        image_url: `${baseUrl}/api/v3/tmp-upload/${encodeURIComponent(saved.token)}`,
        token: saved.token,
        bytes: saved.bytes,
        mime: saved.mime,
        expires_at: saved.expires_at,
        ttl_seconds: Math.floor((saved.ttl_ms || 30000) / 1000)
      }
    });
  } catch (err) {
    const msg = String(err && err.message || '');
    if (msg === 'INVALID_MIME') {
      return res.status(400).json({ status: false, message: 'Format file harus JPG/JPEG/PNG.' });
    }
    if (msg === 'FILE_TOO_LARGE') {
      return res.status(400).json({ status: false, message: 'Ukuran file maksimal 4MB.' });
    }
    if (msg === 'EMPTY_FILE') {
      return res.status(400).json({ status: false, message: 'File kosong atau tidak valid.' });
    }
    return res.status(500).json({ status: false, message: 'Gagal upload file sementara.' });
  }
});

// GET /api/v3/tmp-upload/:token
router.get('/tmp-upload/:token', (req, res) => {
  try {
    const row = publicUploadStore.getByToken(req.params.token);
    if (!row) return res.status(404).send('File not found or expired');
    res.setHeader('Content-Type', row.mime || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.sendFile(row.path);
  } catch (err) {
    return res.status(500).send('Failed to load temporary file');
  }
});

// GET /api/v3/admin/stats/history
router.get('/admin/stats/history', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const history = await getHistoricalStats();
  res.json({ status: true, data: history });
});

// GET/POST /api/v3/admin/bank-routing
router.get('/admin/bank-routing', (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    let mapping;
    try { if (fs.existsSync('./bank_codes.json')) { let data = JSON.parse(fs.readFileSync('./bank_codes.json', 'utf8')); mapping = data.daftar_bank ? data.daftar_bank : data; } } catch (e) { mapping = []; }
    const banks = (mapping || []).filter(b => b.codeid && String(b.codeid).trim() !== '').map(b => ({ codeid: String(b.codeid).trim(), name: b.nama_bank || b.name || '-' }));
    res.json({ status: true, data: { banks, toggles: cfg.appConfig.bank_code_server_toggles || {} } });
  } catch (err) {
    console.error('[PUBLIC_API][BANK_ROUTING_GET] Error:', err);
    res.status(500).json({ status: false, error: 'Terjadi kesalahan server.' });
  }
});

router.post('/admin/bank-routing', (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    const bodyToggles = req.body && req.body.toggles ? req.body.toggles : {};
    let mapping;
    try { if (fs.existsSync('./bank_codes.json')) { let data = JSON.parse(fs.readFileSync('./bank_codes.json', 'utf8')); mapping = data.daftar_bank ? data.daftar_bank : data; } } catch (e) { mapping = []; }
    const allowed = new Set((mapping || []).filter(b => b.codeid && String(b.codeid).trim() !== '').map(b => String(b.codeid).trim()));
    const cleaned = {};
    Object.keys(bodyToggles || {}).forEach(codeid => {
      const key = String(codeid).trim(); if (!allowed.has(key)) return;
      const row = bodyToggles[codeid] || {};
      cleaned[key] = {
        s1: (row.s1 === 0 || row.s1 === '0' || row.s1 === false) ? 0 : 1,
        s2: (row.s2 === 0 || row.s2 === '0' || row.s2 === false) ? 0 : 1,
        s3: (row.s3 === 0 || row.s3 === '0' || row.s3 === false) ? 0 : 1,
        s4: (row.s4 === 0 || row.s4 === '0' || row.s4 === false) ? 0 : 1,
        s5: (row.s5 === 0 || row.s5 === '0' || row.s5 === false) ? 0 : 1,
        s6: (row.s6 === 0 || row.s6 === '0' || row.s6 === false) ? 0 : 1,
        s7: (row.s7 === 0 || row.s7 === '0' || row.s7 === false) ? 0 : 1
      };
    });
    cfg.appConfig.bank_code_server_toggles = cleaned;
    fs.writeFileSync('./config.json', JSON.stringify(cfg.appConfig, null, 2));
    cfg.syncSettingsToDB().catch(e => console.error('[CONFIG] Bank routing sync failed:', e));
    res.json({ status: true, message: 'Routing bank tersimpan.' });
  } catch (err) {
    console.error('[PUBLIC_API][BANK_ROUTING_POST] Error:', err);
    res.status(500).json({ status: false, error: 'Terjadi kesalahan server.' });
  }
});

// GET /api/v3/admin/settings
router.get('/admin/settings', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const [rows] = await cfg.dbPool.query("SELECT * FROM api_settings");
    res.json({ status: true, data: rows });
  } catch (err) {
    console.error('[PUBLIC_API][ADMIN_SETTINGS] Error:', err);
    res.status(500).json({ status: false, error: 'Terjadi kesalahan server.' });
  }
});

// GET /api/v3/admin/payment-methods
router.get('/admin/payment-methods', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    const methods = await getMergedDepositMethods();
    res.json({ status: true, data: methods });
  } catch (err) {
    const overrides = cfg.appConfig.payment_method_overrides || {};
    const fallback = Object.keys(overrides).map((code) => ({ code, ...(overrides[code] || {}) }));
    res.status(400).json({ status: false, error: err.message, data: fallback });
  }
});

// POST /api/v3/admin/payment-methods
router.post('/admin/payment-methods', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    const methods = Array.isArray(req.body?.methods) ? req.body.methods : [];
    await savePaymentMethodOverrides(methods);
    fs.writeFileSync(cfg.CONFIG_FILE_PATH, JSON.stringify(cfg.appConfig, null, 2));
    await cfg.syncSettingsToDB();
    res.json({ status: true, message: 'Metode pembayaran berhasil disimpan.' });
  } catch (err) {
    console.error('[PUBLIC_API][PAYMENT_METHODS_POST] Error:', err);
    res.status(500).json({ status: false, error: 'Terjadi kesalahan server.' });
  }
});


// POST /api/v3/admin/cache/clear
router.post('/admin/cache/clear', (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    const { cache, mappingCache } = require('./api_checker');
    cache.flushAll(); mappingCache.flushAll(); apiKeyCache.flushAll(); settingsCache.flushAll(); trial429Cache.flushAll();
    res.json({ status: true, message: 'Cache cleared.' });
  } catch (err) {
    console.error('[PUBLIC_API][CACHE_CLEAR] Error:', err);
    res.status(500).json({ status: false, error: 'Terjadi kesalahan server.' });
  }
});

// GET /api/v3/admin/revenue/summary (fallback endpoint)
router.get('/admin/revenue/summary', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    const [topupRows] = await safeQuery(
      `SELECT
         COALESCE(SUM(CASE WHEN LOWER(status) = 'success' THEN amount ELSE 0 END), 0) AS total_topup_success,
         COALESCE(SUM(CASE WHEN LOWER(status) = 'pending' THEN amount ELSE 0 END), 0) AS total_topup_pending,
         COALESCE(SUM(CASE WHEN LOWER(status) = 'expired' THEN amount ELSE 0 END), 0) AS total_topup_expired,
         COUNT(*) AS total_topup_count
       FROM member_topups`,
      [],
      [{ total_topup_success: 0, total_topup_pending: 0, total_topup_expired: 0, total_topup_count: 0 }]
    );
    const [pkgRows] = await safeQuery(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS total_package_paid,
         COUNT(*) AS total_package_invoice
       FROM member_package_invoices`,
      [],
      [{ total_package_paid: 0, total_package_invoice: 0 }]
    );
    let walletRows = [{ wallet_credit: 0, wallet_debit: 0, wallet_debit_today: 0 }];
    const [balanceDebitRows] = await safeQuery(
      `SELECT
         0 AS wallet_credit,
         COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) AS wallet_debit,
         COALESCE(SUM(CASE WHEN amount < 0 AND DATE(created_at) = CURDATE() THEN ABS(amount) ELSE 0 END), 0) AS wallet_debit_today
       FROM balance_logs`,
      [],
      [{ wallet_credit: 0, wallet_debit: 0, wallet_debit_today: 0 }]
    );
    const [apiDebitRows] = await safeQuery(
      `SELECT
         COALESCE(SUM(CASE WHEN charged_amount > 0 THEN charged_amount ELSE 0 END), 0) AS wallet_debit,
         COALESCE(SUM(CASE WHEN charged_amount > 0 AND DATE(created_at) = CURDATE() THEN charged_amount ELSE 0 END), 0) AS wallet_debit_today
       FROM api_logs`,
      [],
      [{ wallet_debit: 0, wallet_debit_today: 0 }]
    );
    const balanceDebit = (balanceDebitRows && balanceDebitRows[0]) || {};
    const apiDebit = (apiDebitRows && apiDebitRows[0]) || {};
    walletRows = [{
      wallet_credit: 0,
      wallet_debit: Math.max(Number(balanceDebit.wallet_debit || 0), Number(apiDebit.wallet_debit || 0)),
      wallet_debit_today: Math.max(Number(balanceDebit.wallet_debit_today || 0), Number(apiDebit.wallet_debit_today || 0))
    }];
    const [dailyRows] = await safeQuery(
      `SELECT DATE(created_at) AS dt, COALESCE(SUM(CASE WHEN LOWER(status) = 'success' THEN amount ELSE 0 END), 0) AS total
       FROM member_topups
       GROUP BY DATE(created_at)
       ORDER BY dt DESC
       LIMIT 14`,
      [],
      []
    );
    res.json({
      status: true,
      data: {
        topups: topupRows[0] || {},
        packages: pkgRows[0] || {},
        wallet: walletRows[0] || {},
        daily: (dailyRows || []).reverse()
      }
    });
  } catch (err) {
    console.error('[PUBLIC_API][REVENUE_SUMMARY] Error:', err);
    res.status(500).json({ status: false, error: 'Terjadi kesalahan server.' });
  }
});

// GET /api/v3/admin/revenue/topups (fallback endpoint)
router.get('/admin/revenue/topups', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '100', 10)));
    const [rows] = await safeQuery(
      `SELECT t.id, t.invoice, t.amount, t.fee, t.total_amount, t.method_name, t.status, t.expired_at, t.created_at, t.credited_at,
              m.id as member_id, m.name as member_name, m.whatsapp_number
       FROM member_topups t
       LEFT JOIN member_accounts m ON m.id = t.member_id
       ORDER BY t.id DESC
       LIMIT ?`,
      [limit],
      []
    );
    res.json({ status: true, data: rows || [] });
  } catch (err) {
    console.error('[PUBLIC_API][REVENUE_TOPUPS] Error:', err);
    res.status(500).json({ status: false, error: 'Terjadi kesalahan server.' });
  }
});

// GET /api/v3/vps-status
router.get('/vps-status', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const totalMem = os.totalmem(); const freeMem = os.freemem(); const usedMem = totalMem - freeMem;
  const loadAvg = os.loadavg(); const uptime = os.uptime(); const cpus = os.cpus();
  const disk = vps.getDiskInfo(); const network = vps.getNetworkInfo(); const top_processes = await vps.getTopProcesses();
  const ifaces = os.networkInterfaces();
  const ips = [];
  Object.entries(ifaces).forEach(([name, addrs]) => {
    (addrs || []).forEach(a => {
      if (a.family === 'IPv4' && !a.internal) ips.push({ iface: name, address: a.address });
    });
  });
  res.json({
    status: true, data: {
      cpu: { model: cpus[0].model, cores: cpus.length, load_1m: loadAvg[0], load_5m: loadAvg[1], load_15m: loadAvg[2] },
      memory: { total_mb: Math.round(totalMem / 1024 / 1024), used_mb: Math.round(usedMem / 1024 / 1024), usage_percent: ((usedMem / totalMem) * 100).toFixed(2) },
      disk, network, top_processes,
      ip: ips,
      wa: {
        connected: !!(wa.isCheckerReady && wa.isCheckerReady()),
        status: wa.connectionStatus,
        qr_available: !!(wa.getBaileysState && wa.getBaileysState().qr_available)
      },
      process: { pid: process.pid, uptime_seconds: process.uptime() },
      uptime_seconds: uptime, timestamp: Date.now()
    }
  });
});

module.exports = router;
