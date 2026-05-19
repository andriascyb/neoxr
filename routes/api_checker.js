/**
 * routes/api_checker.js
 * Main checker API: GET / and POST /api/v3/validate
 * Handles bank, ewallet, nik, whatsapp validation + ai tools
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const NodeCache = require('node-cache');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const cfg = require('../lib/config');
const wa = require('../lib/whatsapp');
const { authenticateRequest, deductBalance, incrementHitOnly, applyInvalidPenaltyIfNeeded, addChargedAmount } = require('../lib/auth');
const { checkPersistentCache, queueLog } = require('../lib/stats');
const { buildMapperSource, mapResponseData } = require('../lib/response_mapper');
const { isCircuitOpen, markSkippedOpen, recordSuccess, recordFailure } = require('../lib/provider_runtime');
const aiStorage = require('../lib/ai_storage');
const SERVER5_EWALLET_CODES = new Set(['dana', 'gopay', 'linkaja', 'ovo', 'shopeepay']);
const SERVER6_EWALLET_CODES = new Set(['gopay', 'dana', 'shopeepay', 'ovo', 'linkaja']);
const SERVER7_EWALLET_CODES = new Set(['dana', 'gopay', 'ovo', 'spay', 'shopeepay']);
const SERVER7_EWALLET_CODE_MAP = { dana: 'dana', gopay: 'gopay', ovo: 'ovo', spay: 'shopeepay', shopeepay: 'shopeepay' };
const SERVER8_EWALLET_CODE_MAP = {
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
const BILLING_KLIK_CODES = {
  bpjs: 'BPJSKS',
  pln: 'PLN'
};

const cache = new NodeCache({ stdTTL: 300 });
const mappingCache = new NodeCache({ stdTTL: 3600 });
const qiospayWaiters = new Map();

const QIOSPAY_PRODUCT_MAP = {
  dana: 'QDANAV',
  gopay: 'QGOPAYV',
  linkaja: 'QCEKLINKAJAV',
  ovo: 'QCEKOVV',
  shopeepay: 'QSPAYV'
};

const ewalletMapping = {
  'dana': 'wallet_dana', 'ovo': 'wallet_ovo', 'gopay': 'gopay_user',
  'gopay_user': 'gopay_user', 'gopay_driver': 'gopay_driver',
  'shopeepay': 'wallet_shopeepay', 'linkaja': 'wallet_linkaja',
  'grab': 'grab_user', 'grab_user': 'grab_user', 'isaku': 'wallet_isaku',
  'i.saku': 'wallet_isaku'
};

const getServer7PoolCandidates = () => {
  const endpoint = String(cfg.appConfig.ewallet_server7_base_url || '').trim();
  const apikey = String(cfg.appConfig.ewallet_server7_apikey || '').trim();
  if (!endpoint || !apikey) return [];
  return [{ alias: 'server7', endpoint, apikey }];
};

const getBankServer3PoolCandidates = () => {
  const endpoint = String(cfg.appConfig.bank_server3_base_url || '').trim();
  const cookie = String(cfg.appConfig.bank_server3_cookie || '').trim();
  if (!endpoint || !cookie) return [];
  return [{ alias: 'server3', endpoint, cookie }];
};

const getUserDetails = (req) => {
  const details = {
    id: req.user.id,
    name: req.user.name,
    balance: req.user.balance,
    package: req.user.package_name || 'No Package',
    expiry: req.user.expiry
  };
  if (req.cost > 0) {
    const balanceBefore = parseFloat(req.user.balance || 0);
    const amountDeducted = parseFloat(req.cost || 0);
    details.balance_before = balanceBefore;
    details.amount_deducted = amountDeducted;
    details.balance_after = parseFloat((balanceBefore - amountDeducted).toFixed(2));
  }
  return details;
};

const applyUsageBilling = async (req, res, description) => {
  if (req.cost > 0) {
    const billingResult = await deductBalance(req.user.api_key, req.cost, description);
    if (!billingResult || billingResult.ok !== true) {
      return res.status(402).json({
        status: false,
        message: 'Saldo tidak mencukupi.',
        current_balance: billingResult && billingResult.balance !== undefined ? billingResult.balance : req.user.balance,
        required_cost: req.cost
      });
    }
    addChargedAmount(req, billingResult.deducted_amount || req.cost || 0);
    return null;
  }

  await incrementHitOnly(req.user.api_key);
  return null;
};

function getBankMapping() {
  let mapping = mappingCache.get('bank_mapping_v2');
  if (mapping) return mapping;
  try {
    if (fs.existsSync('./bank_codes.json')) {
      let data = JSON.parse(fs.readFileSync('./bank_codes.json', 'utf8'));
      mapping = data.daftar_bank ? data.daftar_bank : data;
      mappingCache.set('bank_mapping_v2', mapping);
      return mapping;
    }
  } catch (err) { }
  return [
    { "name": "BANK RAKYAT INDONESIA (BRI)", "code": "bank_bri", "codeid": "002", "kode_s1": "bank_bri", "kode_s2": "bri", "nama_bank": "Bank Rakyat Indonesia" },
    { "name": "BANK MANDIRI", "code": "bank_mandiri", "codeid": "008", "kode_s1": "bank_mandiri", "kode_s2": "mandiri", "nama_bank": "Bank Mandiri" },
    { "name": "BANK CENTRAL ASIA (BCA)", "code": "bank_bca", "codeid": "014", "kode_s1": "bank_bca", "kode_s2": "bca", "nama_bank": "Bank Central Asia" }
  ];
}

function getBankServer3Mapping() {
  let mapping = mappingCache.get('bank_mapping_server3');
  if (mapping) return mapping;
  try {
    const s3Path = path.join(__dirname, '..', 'bank_code_server3.json');
    if (fs.existsSync(s3Path)) {
      const data = JSON.parse(fs.readFileSync(s3Path, 'utf8'));
      const list = Array.isArray(data) ? data : [];
      mapping = list
        .map((item) => ({
          code: String(item && item.code ? item.code : '').trim(),
          name: String(item && item.name ? item.name : '').trim()
        }))
        .filter((item) => item.code && item.name);
      mappingCache.set('bank_mapping_server3', mapping);
      return mapping;
    }
  } catch (e) { }
  return [];
}

function getBankServer3NameByCode(codeid) {
  const target = String(codeid || '').trim();
  if (!target) return '';
  const mapping = getBankServer3Mapping();
  const found = mapping.find((item) => String(item.code).trim() === target);
  return found ? String(found.name || '').trim() : '';
}

const extractJson = (text) => {
  try {
    const start = text.indexOf('{'); const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) return JSON.parse(text.substring(start, end + 1));
  } catch (e) { }
  return null;
};

const sanitizeDisplayName = (type, rawName) => {
  let cleanName = String(rawName || '').trim();
  if (type === 'ewallet') {
    cleanName = cleanName.replace(/^(DANA\s+TOP\s+UP|TOP\s+UP\s+DANA|GOPAY\s+TOP\s+UP|DANA\/)\s*/i, '').trim();
    cleanName = cleanName.replace(/^(?:GOPAY|DANA|OVO|SHOPEEPAY|LINKAJA|ISAKU|GRAB|GOPAY\s*DRIVER)\s*(?:\u2605|\*)\s*/i, '').trim();
  }
  return cleanName;
};

const normalizeServer8EwalletName = (rawName) => sanitizeDisplayName('ewallet', rawName).replace(/\s+/g, ' ').trim();

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

const extractKlikmbcLabelValue = (html, label) => {
  const source = String(html || '');
  const escapedLabel = String(label || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`<span class="label-text-grayscale">(?:<b>)?${escapedLabel}(?:<\\/b>)?<\\/span>[\\s\\S]*?<b>(.*?)<\\/b>`, 'i');
  const match = source.match(regex);
  return match && match[1] ? String(match[1]).trim() : '';
};

const buildKlikmbcHeaders = (endpoint, cookie) => {
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

const postKlikmbcForm = (endpoint, headers, body, timeoutMs) => new Promise((resolve, reject) => {
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

const getCekApiEwalletName = (payload) => {
  const data = payload && typeof payload === 'object' && payload.data && typeof payload.data === 'object' ? payload.data : {};
  const username = String(data.username || data.name || data.account_name || '').trim();
  return username ? username.split('/')[0].trim() : '';
};

const getServer8EwalletCode = (rawCode) => {
  const key = String(rawCode || '').trim().toLowerCase();
  return SERVER8_EWALLET_CODE_MAP[key] || SERVER8_EWALLET_CODE_MAP[key.replace(/^wallet_/, '')] || '';
};

const buildServer8EwalletUrl = (baseUrl, walletCode, phoneNumber, apikey) => {
  const normalizedBase = String(baseUrl || '').trim().replace(/\/+$/, '');
  const u = new URL(`${normalizedBase}/${encodeURIComponent(walletCode)}/`);
  u.searchParams.set('hp', String(phoneNumber || '').trim());
  u.searchParams.set('key', String(apikey || '').trim());
  return u.toString();
};

const normalizeQiospaySn = (raw) => {
  let sn = String(raw || '').trim();
  if (!sn) return '';
  // Format umum callback Qiospay: "NAMA/SN.../Ref..."
  // Ambil hanya bagian sebelum "/" agar account_name bersih.
  sn = sn.split('/')[0].trim();
  return sn.replace(/\s+/g, ' ').trim();
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

const getQiospayRefId = (payload) => {
  const data = normalizeQiospayPayload(payload);
  const direct = String(data.refid || data.refID || data.refId || data.ref_id || '').trim();
  if (direct) return direct;
  const message = String(data.message || data.msg || data.keterangan || '');
  const fromMessage = message.match(/\bR#([A-Za-z0-9_-]+)/i);
  return fromMessage && fromMessage[1] ? fromMessage[1].trim() : '';
};

const makeRefId = () => `TRX${Date.now()}${Math.floor(Math.random() * 1000)}`;

const logQiospayCallback = (msg) => {
  try {
    const logDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(path.join(logDir, 'qiospay_callback.log'), `[${new Date().toISOString()}] ${msg}\n`, 'utf8');
  } catch (e) { }
};

const resolvePublicBaseUrl = (req) => {
  const configured = String((cfg.appConfig && cfg.appConfig.public_base_url) || '').trim();
  if (configured) return configured.replace(/\/+$/, '');
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
  const host = req.get('host');
  return `${proto}://${host}`.replace(/\/+$/, '');
};

const isPrivilegedDebugRequest = (req, params) => {
  const rawDev = params && (params.dev === 'true' || params.dev === '1' || params.dev === '');
  if (!rawDev) return false;
  const allowPublic = String(process.env.ALLOW_PUBLIC_DEBUG_INFO || '').trim() === '1';
  if (allowPublic) return true;
  const adminKey = String(cfg.ADMIN_KEY || '').trim();
  if (!adminKey) return false;
  const headerKey = String(req.headers['x-admin-key'] || '').trim();
  const queryKey = String((req.query && req.query.key) || '').trim();
  const bodyKey = String((params && params.key) || '').trim();
  return headerKey === adminKey || queryKey === adminKey || bodyKey === adminKey;
};

const handleCheckRequest = async (req, res, params, startTime) => {
  const type = (params.type || 'bank').toLowerCase();
  const isDev = isPrivilegedDebugRequest(req, params);
  const debug_errors = [];

  let input_code = (params.bank_code || params.ewallet_code || params.code || params.bankCode || '').trim().toLowerCase();
  let account_number = (params.account_number || params.accountNumber || params.phone_number || params.number || params.nomor || '').replace(/[^0-9]/g, '');
  let nik_number = (params.nik || '').replace(/[^0-9]/g, '');
  let wa_number = (params.nomor || params.whatsapp_number || params.number || '').replace(/[^0-9]/g, '');
  let game_service = (params.game_service || params.service || '').trim().toLowerCase();
  let game_user_id = (params.game_user_id || params.user_id || '').trim();
  let game_zone_id = (params.game_zone_id || params.zone_id || '').trim();
  const ai_image = String(params.image || params.image_url || '').trim();
  const ai_q_raw = String(params.q || params.query || '').trim();
  const appConfig = cfg.appConfig;

  if (!['bank', 'ewallet', 'nik', 'whatsapp', 'games', 'bpjs', 'pln', 'ai'].includes(type)) {
    return res.status(400).json({ status: false, message: 'Tipe tidak didukung. Gunakan bank, ewallet, nik, whatsapp, games, bpjs, pln, atau ai.' });
  }

  const applyInvalidPenaltyMeta = async (payload) => {
    try {
      const meta = await applyInvalidPenaltyIfNeeded(req, type, req.cost);
      return { ...payload, ...meta };
    } catch (e) {
      return payload;
    }
  };

  const serviceOff = (serviceName) => {
    return res.status(503).json({
      status: false,
      code: 'SERVICE_OFF',
      service: String(serviceName || type).toLowerCase(),
      message: `Layanan ${serviceName} saat ini tidak tersedia (OFF).`
    });
  };
  if (type === 'whatsapp' && String(appConfig.whatsapp_status || 'on').toLowerCase() !== 'on') {
    return serviceOff('WhatsApp');
  }
  if (type === 'bank' && String(appConfig.bank_status || 'on').toLowerCase() !== 'on') {
    return serviceOff('Bank');
  }
  if (type === 'ewallet' && String(appConfig.ewallet_status || 'on').toLowerCase() !== 'on') {
    return serviceOff('E-Wallet');
  }
  if (type === 'nik' && String(appConfig.nik_status || 'on').toLowerCase() !== 'on') {
    return serviceOff('NIK');
  }
  if (type === 'games' && appConfig.games_status !== 'on') {
    return serviceOff('Games');
  }
  if (type === 'bpjs' && String(appConfig.bpjs_status || 'off').toLowerCase() !== 'on') {
    return serviceOff('BPJS');
  }
  if (type === 'pln' && String(appConfig.pln_status || 'off').toLowerCase() !== 'on') {
    return serviceOff('PLN');
  }
  if (type === 'ai' && String(appConfig.ai_status || 'off').toLowerCase() !== 'on') {
    return serviceOff('AI');
  }

  if (type === 'ai') {
    let imageUrl = '';
    try {
      const parsedImage = new URL(ai_image);
      if (!/^https?:$/i.test(parsedImage.protocol)) throw new Error('invalid_protocol');
      imageUrl = parsedImage.toString();
    } catch (e) {
      if (params.nocache !== '1') queueLog(req, type, false, { message: 'Invalid image url' }, 400, startTime);
      return res.status(400).json({
        status: false,
        message: 'Parameter image wajib berupa URL http/https yang valid.',
        data: { image: ai_image || null }
      });
    }

    const qValue = ai_q_raw.trim();
    if (!qValue || qValue.length > 100) {
      if (params.nocache !== '1') queueLog(req, type, false, { message: 'Invalid q' }, 400, startTime);
      return res.status(400).json({
        status: false,
        message: 'Parameter q wajib diisi dan maksimal 100 karakter.',
        data: { q_length: qValue.length }
      });
    }

    const endpoint = String(appConfig.ai_endpoint || 'https://api.neoxr.eu/api/photo-editor').trim();
    const apikey = String(appConfig.ai_apikey || '9ViEsr').trim();
    if (!endpoint || !apikey) {
      return res.status(503).json({
        status: false,
        code: 'SERVICE_MISCONFIG',
        service: 'ai',
        message: 'Layanan AI belum dikonfigurasi dengan benar.'
      });
    }

    const elapsed = () => Number((((performance.now() - startTime) / 1000)).toFixed(3));
    try {
      const controller = new AbortController();
      const timeoutMs = Math.max(1000, parseInt(appConfig.ai_timeout_ms, 10) || parseInt(appConfig.timeout_ms, 10) || 15000);
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const requestUrl = new URL(endpoint);
      requestUrl.searchParams.set('image', imageUrl);
      requestUrl.searchParams.set('q', qValue);
      requestUrl.searchParams.set('apikey', apikey);

      const apiResponse = await fetch(requestUrl.toString(), { method: 'GET', signal: controller.signal });
      clearTimeout(timeoutId);

      let payload;
      try {
        payload = await apiResponse.json();
      } catch (e) {
        payload = null;
      }
      if (!apiResponse.ok || !payload || payload.status !== true || !payload.data) {
        if (params.nocache !== '1') queueLog(req, type, false, payload || { message: 'Invalid AI provider response' }, 400, startTime);
        return res.status(400).json({
          status: false,
          service: 'ai',
          message: (payload && payload.message) ? String(payload.message) : 'Gagal memproses request AI.',
          provider: 'neoxr',
          execution_time: elapsed()
        });
      }

      const sourceImageUrl = String(payload.data.downloadUrl || payload.data.url || '').trim();
      let localFile = null;
      if (!sourceImageUrl) {
        return res.status(400).json({
          status: false,
          service: 'ai',
          message: 'Provider AI tidak mengembalikan URL hasil gambar.',
          provider: 'neoxr',
          execution_time: elapsed()
        });
      }
      try {
        const ttlHours = Math.max(1, parseInt(appConfig.ai_file_ttl_hours, 10) || 12);
        localFile = await aiStorage.saveFromRemote({
          remoteUrl: sourceImageUrl,
          code: payload.data.code || '',
          ttlHours
        });
      } catch (e) {
        return res.status(500).json({
          status: false,
          service: 'ai',
          message: 'Gagal menyimpan hasil gambar AI ke server lokal.',
          provider: 'neoxr',
          execution_time: elapsed()
        });
      }

      const baseUrl = resolvePublicBaseUrl(req);
      const mappedData = {
        code: payload.data.code || '',
        bytes: Number(payload.data.bytes || 0),
        expired_at: localFile ? localFile.expires_at : (payload.data.expired_at || null),
        downloadUrl: `${baseUrl}/get/ai?code=${encodeURIComponent(localFile ? localFile.code : (payload.data.code || ''))}`
      };
      const finalResponse = {
        status: true,
        message: 'AI request berhasil diproses.',
        service: 'ai',
        data: mappedData,
        provider: 'neoxr',
        user_details: getUserDetails(req),
        execution_time: elapsed()
      };
      const billingResponse = await applyUsageBilling(req, res, 'AI photo editor');
      if (billingResponse) return billingResponse;
      if (params.nocache !== '1') queueLog(req, type, true, finalResponse, 200, startTime);
      return res.status(200).json(finalResponse);
    } catch (err) {
      const isTimeout = err && (err.name === 'AbortError' || /aborted|timeout/i.test(String(err.message || '')));
      const fail = {
        status: false,
        service: 'ai',
        message: isTimeout ? 'Timeout menghubungi server AI.' : 'Terjadi error saat menghubungi server AI.',
        provider: 'neoxr',
        execution_time: elapsed()
      };
      if (params.nocache !== '1') queueLog(req, type, false, fail, isTimeout ? 504 : 500, startTime);
      return res.status(isTimeout ? 504 : 500).json(fail);
    }
  }

  if (type === 'nik') {
    if (nik_number.length < 15) {
      const errPayload = await applyInvalidPenaltyMeta({ status: false, message: 'Parameter NIK tidak valid atau kurang lengkap.', data: { nik: nik_number } });
      if (params.nocache !== '1') queueLog(req, type, false, { message: 'NIK Invalid' }, 400, startTime);
      return res.status(400).json(errPayload);
    }
  } else if (type === 'whatsapp') {
    if (!wa_number) {
      const errPayload = await applyInvalidPenaltyMeta({ status: false, data: { pesan: "Parameter 'nomor' wajib diisi." } });
      if (params.nocache !== '1') queueLog(req, type, false, { message: 'Nomor WA Kosong' }, 400, startTime);
      return res.status(400).json(errPayload);
    }
  } else if (type === 'games') {
    const GAMES_WITH_ZONE = ['region-ml', 'mlbb-bundle', 'mlcreate', 'first-topup', 'first-mcgg'];
    const VALID_SERVICES = ['region-ml','mlbb-bundle','mlcreate','first-topup','first-mcgg','undawn','free-fire','pubg','codm','zenless','hok','blood-strike','valorant','genshin','hsr','roblox'];
    if (!game_service || !VALID_SERVICES.includes(game_service)) {
      return res.status(400).json({ status: false, message: 'Parameter game_service tidak valid.', valid_services: VALID_SERVICES });
    }
    if (!game_user_id) {
      return res.status(400).json({ status: false, message: 'Parameter game_user_id wajib diisi.' });
    }
    if (GAMES_WITH_ZONE.includes(game_service) && !game_zone_id) {
      return res.status(400).json({ status: false, message: 'Parameter game_zone_id wajib diisi untuk game ini.' });
    }
  } else {
    if (!input_code || (type === 'bank' && account_number.length < 10) || (type === 'ewallet' && account_number.length < 9)) {
      if (params.nocache !== '1') queueLog(req, type, false, { message: 'Invalid params' }, 400, startTime);
      const errPayload = await applyInvalidPenaltyMeta({ status: false, message: 'Parameter tidak lengkap atau tidak valid.', data: { type, code: input_code, number: account_number, name: null } });
      return res.status(400).json(errPayload);
    }
  }

  if (type === 'bpjs' || type === 'pln') {
    if (!account_number || account_number.length < 8) {
      if (params.nocache !== '1') queueLog(req, type, false, { message: 'Invalid params' }, 400, startTime);
      const errPayload = await applyInvalidPenaltyMeta({
        status: false,
        message: 'Nomor pelanggan tidak valid.',
        data: { type, account_number }
      });
      return res.status(400).json(errPayload);
    }

    const cache_key = `v3_${crypto.createHash('md5').update(type + account_number).digest('hex')}`;
    if (parseInt(appConfig.cache_enabled) === 1 && params.nocache !== '1') {
      const cached = cache.get(cache_key);
      if (cached) {
        const billingResponse = (req.cost > 0 && cached.status === true)
          ? await applyUsageBilling(req, res, `Cek ${type} sukses (cache)`)
          : (await incrementHitOnly(req.user.api_key), null);
        if (billingResponse) return billingResponse;
        if (params.nocache !== '1') queueLog(req, type, true, cached, 200, startTime);
        const elapsed = (performance.now() - startTime) / 1000;
        return res.status(200).json({ ...cached, cached: true, user_details: getUserDetails(req), execution_time: Number(elapsed.toFixed(3)) });
      }
      const dbCached = await checkPersistentCache(type, account_number, '');
      if (dbCached) {
        const billingResponse = await applyUsageBilling(req, res, `Cek ${type} sukses (db-cache)`);
        if (billingResponse) return billingResponse;
        if (params.nocache !== '1') queueLog(req, type, true, dbCached, 200, startTime);
        cache.set(cache_key, dbCached, appConfig.cache_time);
        const elapsed = (performance.now() - startTime) / 1000;
        return res.status(200).json({ ...dbCached, provider: 'cache', cached: 'database', user_details: getUserDetails(req), execution_time: Number(elapsed.toFixed(3)) });
      }
    }

    const serverOn = String(appConfig.ewallet_server7_status || 'off') === 'on';
    const endpoint = String(appConfig.klikmbc_ppob_base_url || 'https://klikmbc.biz/v2/ppob_result_ajax-pin').trim();
    const cookie = String(appConfig.klikmbc_ppob_cookie || appConfig.ewallet_server7_cookie || '').trim();
    if (!serverOn || !endpoint || !cookie) {
      return res.status(503).json({
        status: false,
        code: 'SERVICE_MISCONFIG',
        service: type,
        message: 'Layanan saat ini belum siap, silakan hubungi admin.'
      });
    }

    try {
      const providerStart = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Number(appConfig.timeout_ms) || 7000);
      const bodyData = new URLSearchParams({
        ppob: BILLING_KLIK_CODES[type],
        nomorpelanggan: String(account_number || '').trim(),
        nominal: 'PLNS20',
        bulanbpjs: '1',
        browser: 'Mozilla/5.0'
      });
      const apiResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0',
          'Cookie': cookie
        },
        body: bodyData.toString(),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const html = await apiResponse.text();

      const customerName = extractKlikmbcLabelValue(html, 'Nama Pelanggan');
      if (!apiResponse.ok || !customerName) {
        recordFailure(type, 'server7', {
          latencyMs: performance.now() - providerStart,
          errorType: 'invalid_response',
          errorMessage: `Data ${type.toUpperCase()} tidak ditemukan`
        });
        const elapsed = (performance.now() - startTime) / 1000;
        const error_res = await applyInvalidPenaltyMeta({
          status: false,
          message: `Tagihan ${type.toUpperCase()} tidak ditemukan.`,
          data: { account_number },
          user_details: getUserDetails(req),
          execution_time: Number(elapsed.toFixed(3)),
          provider: 'none',
          system: appConfig.server_name
        });
        if (params.nocache !== '1') queueLog(req, type, false, error_res, 400, startTime);
        return res.status(400).json(error_res);
      }

      recordSuccess(type, 'server7', performance.now() - providerStart);
      const parsed = {
        service: type,
        account_number: extractKlikmbcLabelValue(html, 'Nomor Pelanggan') || account_number,
        customer_name: customerName,
        total_bill: extractKlikmbcLabelValue(html, 'Total Tagihan'),
        admin_fee: extractKlikmbcLabelValue(html, 'Biaya Admin'),
        total_pay: extractKlikmbcLabelValue(html, 'Total Bayar')
      };
      if (type === 'bpjs') {
        parsed.participant_name = extractKlikmbcLabelValue(html, 'Nama Peserta');
        parsed.participant_count = extractKlikmbcLabelValue(html, 'Jumlah Peserta');
        parsed.bill_period = extractKlikmbcLabelValue(html, 'Bayar sampai');
      } else {
        parsed.tariff_power = extractKlikmbcLabelValue(html, 'Tarif Daya');
        parsed.meter_stand = extractKlikmbcLabelValue(html, 'Stand Meter');
        parsed.bill_period = extractKlikmbcLabelValue(html, 'Bulan, Tahun(BL/TH)');
      }

      const elapsed = (performance.now() - startTime) / 1000;
      const final_response = {
        status: true,
        message: 'Validasi Berhasil',
        data: parsed,
        user_details: getUserDetails(req),
        execution_time: Number(elapsed.toFixed(3)),
        provider: 'server7',
        system: appConfig.server_name
      };
      const billingResponse = await applyUsageBilling(req, res, `Validation: ${type}`);
      if (billingResponse) return billingResponse;
      if (params.nocache !== '1') {
        if (parseInt(appConfig.cache_enabled) === 1) cache.set(cache_key, final_response, appConfig.cache_time);
        queueLog(req, type, true, final_response, 200, startTime);
      }
      return res.status(200).json(final_response);
    } catch (e) {
      const elapsed = (performance.now() - startTime) / 1000;
      const error_res = await applyInvalidPenaltyMeta({
        status: false,
        message: 'Timeout atau error menghubungi server tagihan.',
        data: { account_number },
        user_details: getUserDetails(req),
        execution_time: Number(elapsed.toFixed(3)),
        provider: 'none',
        system: appConfig.server_name
      });
      if (params.nocache !== '1') queueLog(req, type, false, error_res, 400, startTime);
      return res.status(400).json(error_res);
    }
  }

  // --- GAMES LOGIC ---
  if (type === 'games') {
    const apikey = appConfig.ewallet_server3_apikey;
    if (!apikey) {
      return res.status(503).json({ status: false, message: 'API key untuk layanan Games belum dikonfigurasi.' });
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Number(appConfig.timeout_ms) || 8000);
    let games_url = `https://api.cutiezy.id/api/check/games?service=${encodeURIComponent(game_service)}&user_id=${encodeURIComponent(game_user_id)}&apikey=${encodeURIComponent(apikey)}`;
    if (game_zone_id) games_url += `&zone_id=${encodeURIComponent(game_zone_id)}`;
    try {
      const r = await fetch(games_url, { headers: { 'X-API-Key': apikey }, signal: controller.signal });
      clearTimeout(timeoutId);
      const d = await r.json();
      const elapsed = (performance.now() - startTime) / 1000;
      const isSuccess = !!(d && (d.ok === true || d.success === true) && d.data);
      if (isSuccess) {
        const sourceData = buildMapperSource('games', 'server3', {
          game_service,
          game_user_id,
          game_zone_id
        }, d, {
          data_utama: d.data
        });
        const mappedData = await mapResponseData('games', 'server3', sourceData, d.data);
        const final_response = { status: true, message: 'Berhasil', service: game_service, data: mappedData, user_details: getUserDetails(req), execution_time: Number(elapsed.toFixed(3)) };
        const billingResponse = await applyUsageBilling(req, res, `Cek games ${game_service}`);
        if (billingResponse) return billingResponse;
        if (params.nocache !== '1') queueLog(req, type, true, final_response, 200, startTime);
        return res.status(200).json(final_response);
      } else {
        const error_res = await applyInvalidPenaltyMeta({ status: false, message: d.message || 'Data games tidak ditemukan.', service: game_service, data: null, user_details: getUserDetails(req), execution_time: Number(elapsed.toFixed(3)) });
        if (params.nocache !== '1') queueLog(req, type, false, error_res, 400, startTime);
        return res.status(400).json(error_res);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      const elapsed = (performance.now() - startTime) / 1000;
      const error_res = await applyInvalidPenaltyMeta({ status: false, message: 'Timeout atau error menghubungi server Games.', service: game_service, execution_time: Number(elapsed.toFixed(3)) });
      if (params.nocache !== '1') queueLog(req, type, false, error_res, 400, startTime);
      return res.status(400).json(error_res);
    }
  }
  if (type === 'whatsapp') {
    let target_number = wa.normalizeTo62(wa_number);
    let cache_key = `v3_${crypto.createHash('md5').update('wa' + target_number).digest('hex')}`;

    if (parseInt(appConfig.cache_enabled) === 1 && params.nocache !== '1') {
      const cached = cache.get(cache_key);
      if (cached) {
        if (type === 'bank' || type === 'ewallet') {
          recordSuccess(type, 'cache-memory', performance.now() - startTime);
        }
        const billingResponse = (req.cost > 0 && cached.status !== false && cached.data && cached.data.name !== null)
          ? await applyUsageBilling(req, res, `Cek ${type} sukses (cache)`)
          : (await incrementHitOnly(req.user.api_key), null);
        if (billingResponse) {
          if (params.nocache !== '1') queueLog(req, type, false, { status: false, message: 'Billing gagal pada data cache.' }, 402, startTime);
          return billingResponse;
        }
        if (params.nocache !== '1') queueLog(req, type, true, cached, 200, startTime);
        const elapsed = (performance.now() - startTime) / 1000;
        return res.status(200).json({ ...cached, cached: true, user_details: getUserDetails(req), execution_time: Number(elapsed.toFixed(3)) });
      }
      const dbCached = await checkPersistentCache('whatsapp', target_number);
      if (dbCached) {
        const billingResponse = await applyUsageBilling(req, res, `Cek ${type} sukses (db-cache)`);
        if (billingResponse) {
          if (params.nocache !== '1') queueLog(req, type, false, { status: false, message: 'Billing gagal pada db-cache.' }, 402, startTime);
          return billingResponse;
        }
        if (params.nocache !== '1') queueLog(req, type, true, dbCached, 200, startTime);
        cache.set(cache_key, dbCached, appConfig.cache_time);
        const elapsed = (performance.now() - startTime) / 1000;
        return res.status(200).json({ ...dbCached, provider: 'cache', cached: 'database', user_details: getUserDetails(req), execution_time: Number(elapsed.toFixed(3)) });
      }
    }

    const priority = String(appConfig.wa_validation_priority || appConfig.wa_priority || '1,2')
      .split(',')
      .map(n => n.trim())
      .filter(n => n === '1' || n === '2');
    if (!priority.length) priority.push('1', '2');
    const activeWaPriority = priority.filter(id => {
      if (id === '1') return !!String(appConfig.fonnte_token || '').trim();
      if (id === '2') return !!String(appConfig.pitucode_apikey || '').trim();
      return false;
    });
    if (!activeWaPriority.length) {
      return res.status(503).json({
        status: false,
        code: 'SERVICE_MISCONFIG',
        service: 'whatsapp',
        message: 'Layanan WhatsApp ON tetapi konfigurasi provider belum lengkap.'
      });
    }
    let wa_result = null; let server_found = 'none'; let wa_raw_response = null;
    let waAttemptedProvider = false;

    for (let id of activeWaPriority) {
      const providerCode = id === '1' ? 'server1' : 'server2';
      if (isCircuitOpen(type, providerCode)) {
        markSkippedOpen(type, providerCode);
        if (isDev) debug_errors.push(`${providerCode}: circuit breaker OPEN`);
        continue;
      }
      waAttemptedProvider = true;
      if (id === '1') {
        try {
          const providerStart = performance.now();
          const formData = new URLSearchParams();
          formData.append('target', wa.normalizeTo08(target_number));
          formData.append('countryCode', '62');
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), Number(appConfig.timeout_ms) || 7000);
          const waRes = await fetch("https://api.fonnte.com/validate", { method: 'POST', headers: { 'Authorization': appConfig.fonnte_token, 'Content-Type': 'application/x-www-form-urlencoded' }, body: formData.toString(), signal: controller.signal });
          clearTimeout(timeoutId);
          const waJson = await waRes.json();
          if (waJson.status === true && waJson.data && waJson.data[0] && waJson.data[0].valid) {
            recordSuccess(type, providerCode, performance.now() - providerStart);
            wa_raw_response = waJson;
            wa_result = { pesan: "Nomor terdaftar di WhatsApp.", phone_number: wa.normalizeTo08(waJson.data[0].phone || target_number), is_valid: true, is_whatsapp: true };
            server_found = "server1";
          } else {
            if (isDev) { debug_errors.push(`Fonnte: ${JSON.stringify(waJson)}`); }
          }
        } catch (e) {
          recordFailure(type, providerCode, { latencyMs: 0, errorType: e.name === 'AbortError' ? 'timeout' : 'request_error', errorMessage: e.message });
          if (isDev) debug_errors.push(`Fonnte Error: ${e.message}`);
        }
      } else if (id === '2') {
        try {
          const providerStart = performance.now();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), Number(appConfig.timeout_ms) || 7000);
          const url = `https://api.pitucode.com/whatsapp-checker-stalker?apikey=${encodeURIComponent(appConfig.pitucode_apikey)}&number=${encodeURIComponent(target_number)}`;
          const waRes = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          const waJson = await waRes.json();
          if (waJson.success === true) {
            recordSuccess(type, providerCode, performance.now() - providerStart);
            wa_raw_response = waJson;
            wa_result = { pesan: "Nomor terdaftar di WhatsApp.", phone_number: wa.normalizeTo08((waJson.result && waJson.result.number) ? waJson.result.number : target_number), is_valid: true, is_whatsapp: true };
            server_found = "server2";
          } else {
            if (isDev) { debug_errors.push(`Pitucode: ${JSON.stringify(waJson)}`); }
          }
        } catch (e) {
          recordFailure(type, providerCode, { latencyMs: 0, errorType: e.name === 'AbortError' ? 'timeout' : 'request_error', errorMessage: e.message });
          if (isDev) debug_errors.push(`Pitucode Error: ${e.message}`);
        }
      }
      if (wa_result) break;
    }

    const elapsed = (performance.now() - startTime) / 1000;
    if (!wa_result && !waAttemptedProvider) {
      const final_response = { status: false, code: 'PROVIDERS_TEMPORARILY_UNAVAILABLE', service: 'whatsapp', message: 'Semua server WhatsApp aktif sedang cooldown karena gagal beruntun. Silakan coba beberapa saat lagi.', user_details: getUserDetails(req), execution_time: Number(elapsed.toFixed(3)) };
      if (isDev && debug_errors.length > 0) final_response.debug_info = debug_errors;
      if (params.nocache !== '1') queueLog(req, type, false, final_response, 503, startTime);
      return res.status(503).json(final_response);
    }
    if (wa_result) {
      const sourceData = buildMapperSource('whatsapp', server_found, {
        nomor: target_number
      }, wa_raw_response || wa_result, {
        data_utama: wa_result
      });
      const mappedData = await mapResponseData('whatsapp', server_found, sourceData, wa_result);
      const final_response = { status: true, server_source: server_found, data: mappedData, user_details: getUserDetails(req), execution_time: Number(elapsed.toFixed(3)) };
      const billingResponse = await applyUsageBilling(req, res, `Validation: ${type} ${target_number}`);
      if (billingResponse) {
        if (params.nocache !== '1') queueLog(req, type, false, { status: false, message: 'Billing gagal setelah validasi sukses.' }, 402, startTime);
        return billingResponse;
      }
      if (params.nocache !== '1') { if (parseInt(appConfig.cache_enabled) === 1) cache.set(cache_key, final_response, appConfig.cache_time); queueLog(req, type, true, final_response, 200, startTime); }
      return res.status(200).json(final_response);
    } else {
      const final_response = await applyInvalidPenaltyMeta({ status: false, server_source: "none", data: { pesan: "Nomor tidak terdaftar atau tidak valid di semua server.", phone_number: target_number, is_valid: false, is_whatsapp: false }, user_details: getUserDetails(req), execution_time: Number(elapsed.toFixed(3)) });
      if (params.nocache !== '1') queueLog(req, type, false, final_response, 400, startTime);
      return res.status(400).json(final_response);
    }
  }

  // --- BANK, EWALLET, NIK LOGIC ---
  let api_target_code = input_code.toLowerCase();
  let api_target_code_s2 = input_code.toLowerCase();
  let api_target_code_s4 = null;
  let api_target_bank_name_s3 = '';
  let display_name = '';
  let bank_codeid_for_toggle = '';

  if (type === 'bank') {
    const bank_mapping = getBankMapping();
    for (const bank of bank_mapping) {
      const codeS1 = bank.kode_s1 ? bank.kode_s1.toLowerCase() : (bank.code ? bank.code.toLowerCase() : '');
      const codeS2 = bank.kode_s2 ? bank.kode_s2.toLowerCase() : '';
      if (codeS1 === api_target_code || codeS2 === api_target_code || (bank.codeid && bank.codeid === input_code) || (bank.code && bank.code.toLowerCase() === api_target_code)) {
        api_target_code = bank.kode_s1 || bank.code || input_code;
        api_target_code_s2 = bank.kode_s2 || bank.kode_s1 || bank.code || input_code;
        api_target_code_s4 = bank.codeid ? String(bank.codeid).trim() : null;
        display_name = bank.nama_bank || bank.name;
        bank_codeid_for_toggle = bank.codeid ? String(bank.codeid).trim() : '';
        api_target_bank_name_s3 = getBankServer3NameByCode(bank_codeid_for_toggle);
        break;
      }
    }
    if (!display_name) {
      api_target_code = input_code;
      api_target_code_s2 = input_code;
      api_target_code_s4 = input_code;
      api_target_bank_name_s3 = getBankServer3NameByCode(input_code);
    }
  } else if (type === 'ewallet') {
    display_name = input_code.toUpperCase();
    api_target_code = ewalletMapping[api_target_code] || input_code;
  }

  let cache_key = '';
  if (type === 'nik') cache_key = `v3_${crypto.createHash('md5').update('nik' + nik_number).digest('hex')}`;
  else cache_key = `v3_${crypto.createHash('md5').update(type + input_code + account_number).digest('hex')}`;

  if (parseInt(appConfig.cache_enabled) === 1 && params.nocache !== '1') {
    const cached = cache.get(cache_key);
    if (cached) {
      const billingResponse = (req.cost > 0 && cached.status !== false && cached.data && cached.data.name !== null)
        ? await applyUsageBilling(req, res, `Cek ${type} sukses (cache)`)
        : (await incrementHitOnly(req.user.api_key), null);
      if (billingResponse) {
        if (params.nocache !== '1') queueLog(req, type, false, { status: false, message: 'Billing gagal pada data cache.' }, 402, startTime);
        return billingResponse;
      }
      if (params.nocache !== '1') queueLog(req, type, true, cached, 200, startTime);
      const elapsed = (performance.now() - startTime) / 1000;
      return res.status(200).json({ ...cached, cached: true, user_details: getUserDetails(req), execution_time: Number(elapsed.toFixed(3)) });
    }
      const dbCached = await checkPersistentCache(type, type === 'nik' ? nik_number : account_number, input_code);
      if (dbCached) {
        if (type === 'bank' || type === 'ewallet') {
          recordSuccess(type, 'cache-db', performance.now() - startTime);
        }
        const billingResponse = await applyUsageBilling(req, res, `Cek ${type} sukses (db-cache)`);
        if (billingResponse) {
          if (params.nocache !== '1') queueLog(req, type, false, { status: false, message: 'Billing gagal pada db-cache.' }, 402, startTime);
        return billingResponse;
      }
      if (params.nocache !== '1') queueLog(req, type, true, dbCached, 200, startTime);
      cache.set(cache_key, dbCached, appConfig.cache_time);
      const elapsed = (performance.now() - startTime) / 1000;
      return res.status(200).json({ ...dbCached, provider: 'cache', cached: 'database', user_details: getUserDetails(req), execution_time: Number(elapsed.toFixed(3)) });
    }
  }

  let result_data = null; let final_provider = 'Main'; let provider_code_for_mapping = null; let raw_provider_response = null;
  let provider_unavailable_error = null;
  try {
    if (type === 'bank') {
      let activeServers = [];
      const codeKey = bank_codeid_for_toggle || (input_code && String(input_code).trim());
      const bankToggle = (appConfig.bank_code_server_toggles && codeKey && appConfig.bank_code_server_toggles[codeKey]) ? appConfig.bank_code_server_toggles[codeKey] : null;
      const allowS1 = bankToggle ? !(bankToggle.s1 === 0 || bankToggle.s1 === '0' || bankToggle.s1 === false) : true;
      const allowS2 = bankToggle ? !(bankToggle.s2 === 0 || bankToggle.s2 === '0' || bankToggle.s2 === false) : true;
      const allowS3 = bankToggle ? !(bankToggle.s3 === 0 || bankToggle.s3 === '0' || bankToggle.s3 === false) : true;
      const allowS4 = bankToggle ? !(bankToggle.s4 === 0 || bankToggle.s4 === '0' || bankToggle.s4 === false) : true;
      const allowS5 = bankToggle ? !(bankToggle.s5 === 0 || bankToggle.s5 === '0' || bankToggle.s5 === false) : true;
      const allowS6 = bankToggle ? !(bankToggle.s6 === 0 || bankToggle.s6 === '0' || bankToggle.s6 === false) : true;
      const allowS7 = bankToggle ? !(bankToggle.s7 === 0 || bankToggle.s7 === '0' || bankToggle.s7 === false) : true;
      if (appConfig.bank_server1_status === 'on' && appConfig.bank_endpoint && appConfig.api_key && allowS1) activeServers.push('server1');
      if (appConfig.bank_server2_status === 'on' && appConfig.bank_server2_apikey && allowS2) activeServers.push('server2');
      if (appConfig.bank_server3_status === 'on' && allowS3) {
        const s3Candidates = getBankServer3PoolCandidates();
        s3Candidates.forEach((c) => activeServers.push(c.alias));
      }
      if (appConfig.bank_server4_status === 'on' && appConfig.bank_server4_apikey && allowS4) activeServers.push('server4');
      if (appConfig.bank_server5_status === 'on' && appConfig.server5_base_url && allowS5) activeServers.push('server5');
      if (appConfig.bank_server6_status === 'on' && appConfig.bank_server6_base_url && appConfig.bank_server6_apikey && allowS6) activeServers.push('server6');
      if (appConfig.bank_server7_status === 'on' && appConfig.bank_server7_base_url && appConfig.bank_server7_apikey && allowS7) activeServers.push('server7');
      if (activeServers.length === 0) {
        if (allowS1 || allowS2 || allowS3 || allowS4 || allowS5 || allowS6 || allowS7) {
          return serviceOff('Bank');
        }
        return res.status(400).json({
          status: false,
          code: 'BANK_NOT_SUPPORTED',
          service: 'bank',
          message: 'Bank ini tidak didukung oleh penyedia layanan mana pun.'
        });
      }
      activeServers.sort(() => Math.random() - 0.5);

      let attemptedProvider = false;
      for (let selectedServer of activeServers) {
        if (isCircuitOpen(type, selectedServer)) {
          markSkippedOpen(type, selectedServer);
          if (isDev) debug_errors.push(`${selectedServer}: circuit breaker OPEN`);
          continue;
        }
        attemptedProvider = true;
        if (selectedServer === 'server2') {
          try {
            const providerStart = performance.now();
            const controller = new AbortController();
            const timeoutId = setTimeout(
              () => controller.abort(),
              Math.max(
                1000,
                Number(appConfig.pool_attempt_timeout_ms) || 0,
                Number(appConfig.timeout_ms) || 0,
                10000
              )
            );
            const s2_url = `https://aasardconnect.biz.id/connection/bank/?norek=${encodeURIComponent(account_number)}&kode=${encodeURIComponent(api_target_code_s2)}&key=${encodeURIComponent(appConfig.bank_server2_apikey)}`;
            const apiResponse = await fetch(s2_url, { signal: controller.signal });
            clearTimeout(timeoutId);
            const resData = extractJson(await apiResponse.text());
            if (resData && (resData.status === 200 || resData.status === "200") && (resData.msg === "Sukses" || resData.message?.includes("Success"))) {
              const foundName = resData.nickname || (resData.data && resData.data.username);
              if (foundName) {
                recordSuccess(type, selectedServer, performance.now() - providerStart);
                result_data = { name: foundName, code: api_target_code }; raw_provider_response = resData; display_name = resData.bank || display_name; final_provider = appConfig.server_name; provider_code_for_mapping = 'server2'; break;
              }
            }
            recordFailure(type, selectedServer, { latencyMs: performance.now() - providerStart, errorType: 'invalid_response', errorMessage: 'Nama akun tidak ditemukan di response server2' });
            if (isDev) { debug_errors.push(`server2: ${JSON.stringify(resData)}`); }
          } catch (e) {
            recordFailure(type, selectedServer, { latencyMs: 0, errorType: e.name === 'AbortError' ? 'timeout' : 'request_error', errorMessage: e.message });
            if (isDev) debug_errors.push(`server2 Error: ${e.message}`);
          }
        } else if (String(selectedServer).startsWith('server3')) {
          try {
            const target_code_s3 = api_target_code_s4 ? String(api_target_code_s4).trim() : '';
            const target_bank_name_s3 = String(api_target_bank_name_s3 || '').trim();
            if (!target_code_s3 || !target_bank_name_s3) {
              recordFailure(type, selectedServer, { latencyMs: 0, errorType: 'invalid_code', errorMessage: 'Mapping codeid->nama bank server3 tidak ditemukan.' });
              if (isDev) debug_errors.push('server3: mapping codeid ke nama bank tidak ditemukan');
              continue;
            }
            const providerStart = performance.now();
            const controller = new AbortController();
            const timeoutId = setTimeout(
              () => controller.abort(),
              Math.max(
                1000,
                Number(appConfig.pool_attempt_timeout_ms) || 0,
                Number(appConfig.timeout_ms) || 0,
                10000
              )
            );
            const s3Candidates = getBankServer3PoolCandidates();
            const selectedS3 = s3Candidates.find((row) => row.alias === selectedServer) || s3Candidates[0] || null;
            const s3Endpoint = String((selectedS3 && selectedS3.endpoint) || '').trim();
            const s3Cookie = String((selectedS3 && selectedS3.cookie) || '').trim();
            if (!s3Endpoint || !s3Cookie) {
              recordFailure(type, selectedServer, { latencyMs: 0, errorType: 'config_error', errorMessage: 'Config server3 pool tidak lengkap.' });
              if (isDev) debug_errors.push('server3: config pool tidak lengkap');
              continue;
            }
            const endpointUrl = new URL(s3Endpoint);
            const origin = `${endpointUrl.protocol}//${endpointUrl.host}`;
            const s3Body = new URLSearchParams({
              merchant: `TRANSFER ONLINE|${target_bank_name_s3}|${target_code_s3}`,
              nomorpelanggan: account_number,
              nominal: '10.000',
              payment_desc: '',
              merchant_favorit: '',
              tambahfavorit: 'NO',
              rekeningbaru: 'NO',
              metode: 'BIFAST'
            });
            const s3Response = await fetch(s3Endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Origin': origin,
                'Referer': `${origin}/`,
                'Cookie': s3Cookie
              },
              body: s3Body.toString(),
              signal: controller.signal
            });
            const s3Status = s3Response.status;
            const s3Html = await s3Response.text();
            const accountName = extractKlikmbcLabelValue(s3Html, 'Nama Penerima');
            clearTimeout(timeoutId);
            if (accountName) {
              recordSuccess(type, selectedServer, performance.now() - providerStart);
              result_data = { name: accountName, code: api_target_code };
              raw_provider_response = {
                parsed: true,
                http_status: s3Status,
                bank_name: target_bank_name_s3,
                bank_codeid: target_code_s3,
                rekening_tujuan: extractKlikmbcLabelValue(s3Html, 'Rekening Tujuan') || '',
                bank_tujuan: extractKlikmbcLabelValue(s3Html, 'Bank Tujuan') || ''
              };
              display_name = target_bank_name_s3;
              final_provider = selectedServer;
              provider_code_for_mapping = selectedServer;
              break;
            }
            recordFailure(type, selectedServer, { latencyMs: performance.now() - providerStart, errorType: 'invalid_response', errorMessage: 'Nama akun tidak ditemukan di response server3' });
            if (isDev) debug_errors.push(`server3: parsed=false http=${s3Response.status}`);
          } catch (e) {
            recordFailure(type, selectedServer, { latencyMs: 0, errorType: e.name === 'AbortError' ? 'timeout' : 'request_error', errorMessage: e.message });
            if (isDev) debug_errors.push(`server3 Error: ${e.message}`);
          }
        } else if (selectedServer === 'server4') {
          try {
            const providerStart = performance.now();
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), Number(appConfig.timeout_ms) || 7000);
            const target_code_s4 = api_target_code_s4 || api_target_code || input_code;
            const s4_url = `https://api.cutiezy.id/api/check/bank?service=cek_bank&code=${encodeURIComponent(target_code_s4)}&user_id=${encodeURIComponent(account_number)}&apikey=${encodeURIComponent(appConfig.bank_server4_apikey)}`;
            const apiResponse = await fetch(s4_url, { signal: controller.signal });
            clearTimeout(timeoutId);
            const resData = await apiResponse.json();
            if (resData && resData.ok === true && resData.data && resData.data.accountname) {
              recordSuccess(type, selectedServer, performance.now() - providerStart);
              result_data = { name: resData.data.accountname, code: api_target_code };
              raw_provider_response = resData;
              final_provider = 'server4';
              provider_code_for_mapping = 'server4';
              break;
            }
            recordFailure(type, selectedServer, { latencyMs: performance.now() - providerStart, errorType: 'invalid_response', errorMessage: 'Nama akun tidak ditemukan di response server4' });
            if (isDev) debug_errors.push(`server4 (Cutiezy): ${JSON.stringify(resData)}`);
          } catch (e) {
            recordFailure(type, selectedServer, { latencyMs: 0, errorType: e.name === 'AbortError' ? 'timeout' : 'request_error', errorMessage: e.message });
            if (isDev) debug_errors.push(`server4 Error: ${e.message}`);
          }
        } else if (selectedServer === 'server5') {
          try {
            const providerStart = performance.now();
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), Number(appConfig.timeout_ms) || 7000);
            const target_code_s5 = api_target_code_s4 || input_code;
            const s5_url = `${appConfig.server5_base_url}?bank=${encodeURIComponent(target_code_s5)}&accountNumber=${encodeURIComponent(account_number)}`;
            const apiResponse = await fetch(s5_url, { signal: controller.signal });
            clearTimeout(timeoutId);
            const resData = await apiResponse.json();
            if (resData && resData.success === true && resData.data && resData.data.accountName) {
              recordSuccess(type, selectedServer, performance.now() - providerStart);
              result_data = { name: resData.data.accountName, code: api_target_code };
              raw_provider_response = resData;
              display_name = resData.data.bankName || display_name;
              final_provider = 'server5';
              provider_code_for_mapping = 'server5';
              break;
            }
            recordFailure(type, selectedServer, { latencyMs: performance.now() - providerStart, errorType: 'invalid_response', errorMessage: (resData && (resData.message || resData.error)) ? String(resData.message || resData.error) : 'Nama akun tidak ditemukan di response server5' });
            if (isDev) debug_errors.push(`server5: ${JSON.stringify(resData)}`);
          } catch (e) {
            recordFailure(type, selectedServer, { latencyMs: 0, errorType: e.name === 'AbortError' ? 'timeout' : 'request_error', errorMessage: e.message });
            if (isDev) debug_errors.push(`server5 Error: ${e.message}`);
          }
        } else if (selectedServer === 'server6') {
          try {
            const target_code_s6 = api_target_code_s4 ? String(api_target_code_s4).trim() : '';
            if (!target_code_s6) {
              recordFailure(type, selectedServer, { latencyMs: 0, errorType: 'invalid_code', errorMessage: 'Server6 hanya mendukung codeid bank.' });
              if (isDev) debug_errors.push('server6: codeid bank tidak tersedia');
              continue;
            }
            const providerStart = performance.now();
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), Number(appConfig.timeout_ms) || 7000);
            const baseUrl = String(appConfig.bank_server6_base_url || '').replace(/\/+$/, '');
            const s6_url = `${baseUrl}/?kode=${encodeURIComponent(target_code_s6)}&nomor=${encodeURIComponent(account_number)}&api_key=${encodeURIComponent(appConfig.bank_server6_apikey)}`;
            const apiResponse = await fetch(s6_url, { signal: controller.signal });
            clearTimeout(timeoutId);
            const resData = await apiResponse.json();
            const statusCode = resData && resData.result ? String(resData.result.status || '') : '';
            const accountName = resData && resData.nickname ? String(resData.nickname).trim() : '';
            if (statusCode === '200' && accountName) {
              recordSuccess(type, selectedServer, performance.now() - providerStart);
              result_data = { name: accountName, code: api_target_code };
              raw_provider_response = resData;
              final_provider = 'server6';
              provider_code_for_mapping = 'server6';
              break;
            }
            recordFailure(type, selectedServer, { latencyMs: performance.now() - providerStart, errorType: 'invalid_response', errorMessage: (resData && (resData.message || resData.error)) ? String(resData.message || resData.error) : 'Nama akun tidak ditemukan di response server6' });
            if (isDev) debug_errors.push(`server6: ${JSON.stringify(resData)}`);
          } catch (e) {
            recordFailure(type, selectedServer, { latencyMs: 0, errorType: e.name === 'AbortError' ? 'timeout' : 'request_error', errorMessage: e.message });
            if (isDev) debug_errors.push(`server6 Error: ${e.message}`);
          }
        } else if (selectedServer === 'server7') {
          try {
            const target_code_s7 = api_target_code_s4 ? String(api_target_code_s4).trim() : '';
            if (!target_code_s7) {
              recordFailure(type, selectedServer, { latencyMs: 0, errorType: 'invalid_code', errorMessage: 'Server7 hanya mendukung codeid bank.' });
              if (isDev) debug_errors.push('server7: codeid bank tidak tersedia');
              continue;
            }
            const providerStart = performance.now();
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), Number(appConfig.timeout_ms) || 7000);
            const baseUrl = String(appConfig.bank_server7_base_url || '').replace(/\/+$/, '');
            const s7Url = new URL(`${baseUrl}/`);
            s7Url.searchParams.set('rekening', account_number);
            s7Url.searchParams.set('bank', target_code_s7);
            s7Url.searchParams.set('key', String(appConfig.bank_server7_apikey || '').trim());
            const apiResponse = await fetch(s7Url.toString(), {
              method: 'GET',
              headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            const resData = await apiResponse.json();
            const accountName = String(resData && resData.name || '').trim();
            if (apiResponse.ok && resData && resData.status === true && String(resData.code || '') === '200' && accountName) {
              recordSuccess(type, selectedServer, performance.now() - providerStart);
              result_data = { name: accountName, code: api_target_code };
              raw_provider_response = resData;
              display_name = resData.bank_name || display_name;
              final_provider = 'server7';
              provider_code_for_mapping = 'server7';
              break;
            }
            recordFailure(type, selectedServer, { latencyMs: performance.now() - providerStart, errorType: 'invalid_response', errorMessage: (resData && (resData.message || resData.error)) ? String(resData.message || resData.error) : 'Nama akun tidak ditemukan di response server7' });
            if (isDev) debug_errors.push(`server7 bank: ${JSON.stringify(resData).slice(0, 500)}`);
          } catch (e) {
            recordFailure(type, selectedServer, { latencyMs: 0, errorType: e.name === 'AbortError' ? 'timeout' : 'request_error', errorMessage: e.message });
            if (isDev) debug_errors.push(`server7 bank Error: ${e.message}`);
          }
        } else {
          try {
            const providerStart = performance.now();
            const formData = new URLSearchParams();
            formData.append('api_key', appConfig.api_key);
            formData.append('bank_code', api_target_code);
            formData.append('account_number', account_number);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), Number(appConfig.timeout_ms) || 7000);
            const apiResponse = await fetch(appConfig.bank_endpoint, { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'Connection': 'keep-alive', 'User-Agent': 'Mozilla/5.0' }, body: formData.toString(), signal: controller.signal });
            clearTimeout(timeoutId);
            const resData = await apiResponse.json();
            if (resData.status && resData.status.toLowerCase() === 'success' && resData.data && resData.data.customer_name) {
              recordSuccess(type, selectedServer, performance.now() - providerStart);
              result_data = { name: resData.data.customer_name, code: api_target_code }; raw_provider_response = resData; final_provider = "server1"; provider_code_for_mapping = 'server1'; break;
            }
            recordFailure(type, selectedServer, { latencyMs: performance.now() - providerStart, errorType: 'invalid_response', errorMessage: 'Nama akun tidak ditemukan di response server1' });
            if (isDev) { debug_errors.push(`server1: ${JSON.stringify(resData)}`); }
          } catch (e) {
            recordFailure(type, selectedServer, { latencyMs: 0, errorType: e.name === 'AbortError' ? 'timeout' : 'request_error', errorMessage: e.message });
            if (isDev) debug_errors.push(`server1 Error: ${e.message}`);
          }
        }
        if (result_data) break;
      }
      if (!result_data && activeServers.length > 0 && !attemptedProvider) {
        provider_unavailable_error = {
          status: false,
          code: 'PROVIDERS_TEMPORARILY_UNAVAILABLE',
          service: 'bank',
          message: 'Semua server Bank aktif sedang cooldown karena gagal beruntun. Silakan coba beberapa saat lagi.'
        };
      }
    } else {
      let activeEwalletServers = [];
      if (type === 'ewallet') {
        const server1On = appConfig.ewallet_server1_status === 'on';
        const server2On = appConfig.ewallet_server2_status === 'on';
        const server3On = appConfig.ewallet_server3_status === 'on';
        const server5On = appConfig.ewallet_server5_status === 'on';
        const server6On = appConfig.ewallet_server6_status === 'on';
        const server7On = appConfig.ewallet_server7_status === 'on';
        const server8On = appConfig.ewallet_server8_status === 'on';
        const server7PoolCandidates = getServer7PoolCandidates();

        const server1Ready = server1On && !!String(appConfig.ewallet_endpoint || '').trim() && !!String(appConfig.api_key || '').trim();
        const server2Ready = server2On && !!String(appConfig.ewallet_server2_base_url || '').trim();
        const server3Ready = server3On && !!String(appConfig.ewallet_server3_apikey || '').trim();
        const server5Ready = server5On &&
          !!String(appConfig.qiospay_member_id || '').trim() &&
          !!String(appConfig.qiospay_pin || '').trim() &&
          !!String(appConfig.qiospay_password || '').trim();
        const server6Ready = server6On &&
          !!String(appConfig.ewallet_server6_base_url || '').trim() &&
          !!String(appConfig.ewallet_server6_apikey || '').trim();
        const server7Ready = server7On && server7PoolCandidates.length > 0;
        const server8Ready = server8On &&
          !!String(appConfig.ewallet_server8_base_url || '').trim() &&
          !!String(appConfig.ewallet_server8_apikey || '').trim();

        const anyOn = (server1On || server2On || server3On || server5On || server6On || server7On || server8On);
        const anyReady = (server1Ready || server2Ready || server3Ready || server5Ready || server6Ready || server7Ready || server8Ready);

        if (server1Ready) activeEwalletServers.push('server1');
        if (server2Ready) activeEwalletServers.push('server2');
        if (server3Ready) activeEwalletServers.push('server3');
        if (server5Ready && SERVER5_EWALLET_CODES.has(input_code)) activeEwalletServers.push('server5');
        if (server6Ready && SERVER6_EWALLET_CODES.has(input_code)) activeEwalletServers.push('server6');
        if (server7Ready && SERVER7_EWALLET_CODES.has(input_code)) {
          server7PoolCandidates.forEach((c) => activeEwalletServers.push(c.alias));
        }
        if (server8Ready && getServer8EwalletCode(input_code)) activeEwalletServers.push('server8');
        if (activeEwalletServers.length === 0) {
          if (!anyOn) return serviceOff('E-Wallet');
          if (!anyReady) {
            return res.status(503).json({
              status: false,
              code: 'SERVICE_MISCONFIG',
              service: 'ewallet',
              message: 'Layanan E-Wallet ON tetapi konfigurasi server belum lengkap.'
            });
          }
          return res.status(400).json({
            status: false,
            code: 'EWALLET_CODE_NOT_SUPPORTED',
            service: 'ewallet',
            message: 'Kode E-Wallet tidak didukung pada server yang aktif.'
          });
        }
        activeEwalletServers.sort(() => Math.random() - 0.5); // random load balance
      } else {
        const nikReady = !!String(appConfig.nik_endpoint || '').trim() && !!String(appConfig.api_key || '').trim();
        if (!nikReady) {
          return res.status(503).json({
            status: false,
            code: 'SERVICE_MISCONFIG',
            service: 'nik',
            message: 'Layanan NIK ON tetapi konfigurasi endpoint/API key belum lengkap.'
          });
        }
        activeEwalletServers = ['server1']; // nik uses server1 only
      }

      let attemptedProvider = false;
      for (let selectedServer of activeEwalletServers) {
        if (isCircuitOpen(type, selectedServer)) {
          markSkippedOpen(type, selectedServer);
          if (isDev) debug_errors.push(`${selectedServer}: circuit breaker OPEN`);
          continue;
        }
        attemptedProvider = true;
        if (selectedServer === 'server2' && type === 'ewallet') {
          try {
            const providerStart = performance.now();
            const s2_ew_code = input_code.toLowerCase().replace('wallet_', '');
            const s2base = String(appConfig.ewallet_server2_base_url || 'https://billpaketdata.com/cekid/ewallet/check_packages').replace(/\/+$/, '');
            const s2_ew_url = `${s2base}/${encodeURIComponent(account_number)}/${encodeURIComponent(s2_ew_code)}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), Number(appConfig.timeout_ms) || 7000);
            const apiResponse = await fetch(s2_ew_url, {
              headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            const resData = await apiResponse.json();
            if (resData && resData.success === true) {
              const foundName = String(resData.cust_name || '').trim();
              if (foundName) {
                recordSuccess(type, selectedServer, performance.now() - providerStart);
                result_data = { name: foundName, code: api_target_code }; raw_provider_response = resData; final_provider = 'server2'; provider_code_for_mapping = 'server2'; break;
              }
            }
            recordFailure(type, selectedServer, { latencyMs: performance.now() - providerStart, errorType: 'invalid_response', errorMessage: 'Nama akun tidak ditemukan di response server2' });
            if (isDev) { debug_errors.push(`server2: ${JSON.stringify(resData)}`); }
          } catch (e) {
            recordFailure(type, selectedServer, { latencyMs: 0, errorType: e.name === 'AbortError' ? 'timeout' : 'request_error', errorMessage: e.message });
            if (isDev) debug_errors.push(`server2 Error: ${e.message}`);
          }
        } else if (selectedServer === 'server3' && type === 'ewallet') {
          try {
            // api.cutiezy.id — GET with apikey query param
            const providerStart = performance.now();
            const s3_ew_code = input_code.toLowerCase().replace('wallet_', '');
            const s3_url = `https://api.cutiezy.id/api/check/ewallet?service=${encodeURIComponent(s3_ew_code)}&user_id=${encodeURIComponent(account_number)}&apikey=${encodeURIComponent(appConfig.ewallet_server3_apikey)}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), Number(appConfig.timeout_ms) || 7000);
            const apiResponse = await fetch(s3_url, {
              method: 'GET',
              headers: { 'Accept': 'application/json' },
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            const resData = await apiResponse.json();
            // Response: { ok: true, data: { nickname, id, brand } }
            if (resData && (resData.ok === true || resData.success === true) && resData.data) {
              const foundName = normalizeServer3EwalletName(resData.data.nickname);
              if (foundName) {
                recordSuccess(type, selectedServer, performance.now() - providerStart);
                result_data = { name: foundName, code: api_target_code };
                raw_provider_response = resData;
                display_name = resData.data.brand || display_name;
                final_provider = 'server3';
                provider_code_for_mapping = 'server3';
                break;
              }
            }
            recordFailure(type, selectedServer, { latencyMs: performance.now() - providerStart, errorType: 'invalid_response', errorMessage: 'Nama akun tidak ditemukan di response server3' });
            if (isDev) { debug_errors.push(`server3 (Cutiezy): ${JSON.stringify(resData)}`); }
          } catch (e) {
            recordFailure(type, selectedServer, { latencyMs: 0, errorType: e.name === 'AbortError' ? 'timeout' : 'request_error', errorMessage: e.message });
            if (isDev) debug_errors.push(`server3 Error: ${e.message}`);
          }
        } else if (selectedServer === 'server5' && type === 'ewallet') {
          try {
            const s5_ew_code = input_code.toLowerCase().replace('wallet_', '');
            const qiospayProduct = QIOSPAY_PRODUCT_MAP[s5_ew_code];
            if (!SERVER5_EWALLET_CODES.has(s5_ew_code) || !qiospayProduct) {
              if (isDev) debug_errors.push(`server5: unsupported code ${s5_ew_code}`);
            } else {
              const memberId = String(appConfig.qiospay_member_id || '').trim();
              const pin = String(appConfig.qiospay_pin || '').trim();
              const password = String(appConfig.qiospay_password || '').trim();
              if (!memberId || !pin || !password) {
                recordFailure(type, selectedServer, { latencyMs: 0, errorType: 'config_error', errorMessage: 'Qiospay config belum lengkap' });
                if (isDev) debug_errors.push('server5: qiospay config belum lengkap (member_id/pin/password)');
                continue;
              }
              const providerStart = performance.now();
              const refID = makeRefId();
              const waitMs = Number(appConfig.qiospay_wait_timeout_ms) || Number(appConfig.timeout_ms) || 10000;
              const qs = new URLSearchParams({
                product: qiospayProduct,
                dest: account_number,
                refID,
                memberID: memberId,
                pin,
                password
              });
              const callbackPayloadPromise = new Promise((resolve) => {
                const timer = setTimeout(() => {
                  qiospayWaiters.delete(refID);
                  resolve({ __timeout: true });
                }, waitMs);
                qiospayWaiters.set(refID, {
                  resolve: (payload) => {
                    clearTimeout(timer);
                    resolve(payload);
                  }
                });
              });
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), Number(appConfig.timeout_ms) || 7000);
              const apiResponse = await fetch(`https://qiospay.id/api/h2h/trx?${qs.toString()}`, { method: 'GET', signal: controller.signal });
              clearTimeout(timeoutId);
              const qiospayAckText = await apiResponse.text();
              if (!apiResponse.ok) {
                qiospayWaiters.delete(refID);
                recordFailure(type, selectedServer, { latencyMs: performance.now() - providerStart, errorType: 'provider_http_error', errorMessage: `Qiospay HTTP ${apiResponse.status}` });
                if (isDev) debug_errors.push(`server5 qiospay ack ${apiResponse.status}: ${qiospayAckText}`);
                continue;
              }
              const callbackPayload = await callbackPayloadPromise;
              if (callbackPayload && callbackPayload.__timeout) {
                recordFailure(type, selectedServer, { latencyMs: performance.now() - providerStart, errorType: 'timeout', errorMessage: 'Qiospay callback timeout' });
                if (isDev) debug_errors.push(`server5 qiospay timeout: ${qiospayAckText}`);
                continue;
              }
              const snName = parseQiospaySn(callbackPayload);
              if (snName) {
                recordSuccess(type, selectedServer, performance.now() - providerStart);
                result_data = { name: snName, code: api_target_code };
                raw_provider_response = { request_ack: qiospayAckText, callback: callbackPayload };
                final_provider = 'server5';
                provider_code_for_mapping = 'server5';
                break;
              }
              recordFailure(type, selectedServer, { latencyMs: performance.now() - providerStart, errorType: 'invalid_response', errorMessage: 'SN/account name tidak ditemukan di callback Qiospay' });
              if (isDev) { debug_errors.push(`server5 qiospay: ${JSON.stringify(callbackPayload)}`); }
            }
          } catch (e) {
            recordFailure(type, selectedServer, { latencyMs: 0, errorType: e.name === 'AbortError' ? 'timeout' : 'request_error', errorMessage: e.message });
            if (isDev) debug_errors.push(`server5 Error: ${e.message}`);
          }
        } else if (selectedServer === 'server6' && type === 'ewallet') {
          try {
            const s6_ew_code = input_code.toLowerCase().replace('wallet_', '');
            if (!SERVER6_EWALLET_CODES.has(s6_ew_code)) {
              if (isDev) debug_errors.push(`server6: unsupported code ${s6_ew_code}`);
            } else {
              const providerStart = performance.now();
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), Number(appConfig.timeout_ms) || 7000);
              const s6_url = `${String(appConfig.ewallet_server6_base_url || '').replace(/\/+$/, '')}/${encodeURIComponent(s6_ew_code)}/?nomor=${encodeURIComponent(account_number)}&api_key=${encodeURIComponent(appConfig.ewallet_server6_apikey)}`;
              const apiResponse = await fetch(s6_url, { signal: controller.signal });
              clearTimeout(timeoutId);
              const resData = await apiResponse.json();
              if (resData && (resData.status === 200 || resData.status === '200') && resData.message) {
                recordSuccess(type, selectedServer, performance.now() - providerStart);
                result_data = { name: resData.message, code: api_target_code };
                raw_provider_response = resData;
                final_provider = 'server6';
                provider_code_for_mapping = 'server6';
                break;
              }
              recordFailure(type, selectedServer, { latencyMs: performance.now() - providerStart, errorType: 'invalid_response', errorMessage: (resData && (resData.message || resData.error)) ? String(resData.message || resData.error) : 'Nama akun tidak ditemukan di response server6' });
              if (isDev) { debug_errors.push(`server6: ${JSON.stringify(resData)}`); }
            }
          } catch (e) {
            recordFailure(type, selectedServer, { latencyMs: 0, errorType: e.name === 'AbortError' ? 'timeout' : 'request_error', errorMessage: e.message });
            if (isDev) debug_errors.push(`server6 Error: ${e.message}`);
          }
        } else if (String(selectedServer).startsWith('server7') && type === 'ewallet') {
          try {
            const s7_ew_code = input_code.toLowerCase().replace('wallet_', '');
            const cekapiCode = SERVER7_EWALLET_CODE_MAP[s7_ew_code];
            if (!SERVER7_EWALLET_CODES.has(s7_ew_code) || !cekapiCode) {
              if (isDev) debug_errors.push(`server7: unsupported code ${s7_ew_code}`);
            } else {
              const server7Candidates = getServer7PoolCandidates();
              const picked = server7Candidates.find((row) => row.alias === selectedServer) || server7Candidates[0] || null;
              const apikey = String((picked && picked.apikey) || '').trim();
              const endpoint = String((picked && picked.endpoint) || '').trim();
              if (!apikey || !endpoint) {
                recordFailure(type, selectedServer, { latencyMs: 0, errorType: 'config_error', errorMessage: 'server7 cekapi config belum lengkap' });
                if (isDev) debug_errors.push('server7: config belum lengkap (base_url/apikey)');
                continue;
              }
              const providerStart = performance.now();
              const server7TimeoutMs = Math.max(
                1000,
                Number(appConfig.pool_attempt_timeout_ms) || 0,
                Number(appConfig.timeout_ms) || 0,
                10000
              );
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), server7TimeoutMs);
              const u = new URL(endpoint);
              u.searchParams.set('customer_no', String(account_number || '').trim());
              u.searchParams.set('ewallet', cekapiCode);
              u.searchParams.set('apikey', apikey);
              const apiResponse = await fetch(u.toString(), {
                method: 'GET',
                headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
                signal: controller.signal
              });
              clearTimeout(timeoutId);
              const resData = await apiResponse.json();
              const foundName = getCekApiEwalletName(resData);
              const providerStatus = String(resData && resData.data && resData.data.status || '').toLowerCase();
              if (apiResponse.ok && providerStatus === 'ditemukan' && foundName) {
                recordSuccess(type, selectedServer, performance.now() - providerStart);
                result_data = { name: foundName, code: api_target_code };
                raw_provider_response = resData;
                final_provider = selectedServer;
                provider_code_for_mapping = selectedServer;
                break;
              }
              recordFailure(type, selectedServer, { latencyMs: performance.now() - providerStart, errorType: 'invalid_response', errorMessage: 'Nama akun tidak ditemukan di response server7 cekapi' });
              if (isDev) { debug_errors.push(`server7 cekapi: ${JSON.stringify(resData).slice(0, 500)}`); }
            }
          } catch (e) {
            recordFailure(type, selectedServer, { latencyMs: 0, errorType: e.name === 'AbortError' ? 'timeout' : 'request_error', errorMessage: e.message });
            if (isDev) debug_errors.push(`server7 Error: ${e.message}`);
          }
        } else if (selectedServer === 'server8' && type === 'ewallet') {
          try {
            const providerStart = performance.now();
            const s8Code = getServer8EwalletCode(input_code);
            if (!s8Code) {
              if (isDev) debug_errors.push(`server8: unsupported code ${input_code}`);
              continue;
            }
            const endpoint = String(appConfig.ewallet_server8_base_url || '').trim();
            const apikey = String(appConfig.ewallet_server8_apikey || '').trim();
            if (!endpoint || !apikey) {
              recordFailure(type, selectedServer, { latencyMs: 0, errorType: 'config_error', errorMessage: 'server8 config belum lengkap' });
              if (isDev) debug_errors.push('server8: config belum lengkap (base_url/apikey)');
              continue;
            }
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), Number(appConfig.timeout_ms) || 7000);
            const apiResponse = await fetch(buildServer8EwalletUrl(endpoint, s8Code, account_number, apikey), {
              method: 'GET',
              headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            const resData = await apiResponse.json();
            const foundName = normalizeServer8EwalletName(resData && resData.name);
            if (apiResponse.ok && resData && resData.status === true && String(resData.code || '') === '200' && foundName) {
              recordSuccess(type, selectedServer, performance.now() - providerStart);
              result_data = { name: foundName, code: api_target_code };
              raw_provider_response = resData;
              display_name = String(resData.wallet || s8Code).toUpperCase();
              final_provider = 'server8';
              provider_code_for_mapping = 'server8';
              break;
            }
            recordFailure(type, selectedServer, { latencyMs: performance.now() - providerStart, errorType: 'invalid_response', errorMessage: 'Nama akun tidak ditemukan di response server8' });
            if (isDev) debug_errors.push(`server8: ${JSON.stringify(resData).slice(0, 500)}`);
          } catch (e) {
            recordFailure(type, selectedServer, { latencyMs: 0, errorType: e.name === 'AbortError' ? 'timeout' : 'request_error', errorMessage: e.message });
            if (isDev) debug_errors.push(`server8 Error: ${e.message}`);
          }
        } else {
          try {
            const providerStart = performance.now();
            const formDataNikEwalet = new URLSearchParams();
            let target_endpoint = '';
            formDataNikEwalet.append('api_key', appConfig.api_key);
            if (type === 'ewallet') { formDataNikEwalet.append('ewallet_code', api_target_code); formDataNikEwalet.append('phone_number', account_number); target_endpoint = appConfig.ewallet_endpoint; }
            else if (type === 'nik') { formDataNikEwalet.append('nik', nik_number); target_endpoint = appConfig.nik_endpoint; }
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), Number(appConfig.timeout_ms) || 7000);
            const apiResponse = await fetch(target_endpoint, { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'Connection': 'keep-alive', 'User-Agent': 'Mozilla/5.0' }, body: formDataNikEwalet.toString(), signal: controller.signal });
            clearTimeout(timeoutId);
            const resData = await apiResponse.json();
            if (resData.status && resData.status.toLowerCase() === 'success' && resData.data) {
              if (type === 'nik') {
                if (resData.data.name && resData.data.name !== null) {
                  recordSuccess(type, selectedServer, performance.now() - providerStart);
                  result_data = resData.data; raw_provider_response = resData; final_provider = 'server1'; provider_code_for_mapping = 'server1'; break;
                }
              }
              else if (resData.data.customer_name) {
                recordSuccess('ewallet', selectedServer, performance.now() - providerStart);
                result_data = { name: resData.data.customer_name, code: type === 'bank' ? api_target_code : (resData.data.ewallet_code || api_target_code) }; raw_provider_response = resData; final_provider = 'server1'; provider_code_for_mapping = 'server1'; break;
              }
            }
            if (type === 'ewallet' || type === 'nik') {
              recordFailure(type, selectedServer, { latencyMs: performance.now() - providerStart, errorType: 'invalid_response', errorMessage: 'Nama akun tidak ditemukan di response server1' });
            }
            if (isDev) { debug_errors.push(`server1: ${JSON.stringify(resData)}`); }
          } catch (e) {
            if (type === 'ewallet' || type === 'nik') {
              recordFailure(type, selectedServer, { latencyMs: 0, errorType: e.name === 'AbortError' ? 'timeout' : 'request_error', errorMessage: e.message });
            }
            if (isDev) debug_errors.push(`server1 Error: ${e.message}`);
          }
        }
        if (result_data) break;
      }
      if (!result_data && activeEwalletServers.length > 0 && !attemptedProvider) {
        provider_unavailable_error = {
          status: false,
          code: 'PROVIDERS_TEMPORARILY_UNAVAILABLE',
          service: type,
          message: `Semua server ${type} aktif sedang cooldown karena gagal beruntun. Silakan coba beberapa saat lagi.`
        };
      }
    }
  } catch (error) { }

  const elapsed = (performance.now() - startTime) / 1000;

  if (!result_data && provider_unavailable_error) {
    const error_res = { ...provider_unavailable_error, user_details: getUserDetails(req), execution_time: Number(elapsed.toFixed(3)) };
    if (isDev && debug_errors.length > 0) error_res.debug_info = debug_errors;
    if (params.nocache !== '1') queueLog(req, type, false, error_res, 503, startTime);
    return res.status(503).json(error_res);
  }

  if (result_data) {
    let res_data_payload = {}; let final_message = '';
    if (type === 'nik') { final_message = 'Check NIK successfully!'; res_data_payload = result_data; }
    else {
      let clean_name = sanitizeDisplayName(type, result_data.name);
      final_message = type === 'bank' ? 'Validasi Berhasil' : 'Check ewallet successfully!';
      res_data_payload = type === 'bank'
        ? { bank_code: input_code, bank_name: display_name, account_number, account_name: clean_name }
        : { ewallet_code: result_data.code, ewallet_name: display_name, account_number, account_name: clean_name };
    }
    const sourceData = buildMapperSource(type, provider_code_for_mapping || 'server1', {
      kode_input: input_code,
      nomor_tujuan: account_number,
      nik: nik_number
    }, raw_provider_response || result_data, {
      data_utama: type === 'nik' ? result_data : res_data_payload,
      nama_bank_tampil: type === 'bank' ? display_name : '',
      nama_ewallet_tampil: type === 'ewallet' ? display_name : '',
      nama_akun_asli: result_data && result_data.name ? result_data.name : '',
      nama_akun_bersih: result_data && result_data.name ? sanitizeDisplayName(type, result_data.name) : '',
      kode_output: result_data && result_data.code ? result_data.code : input_code
    });
    const mappedPayload = await mapResponseData(type, provider_code_for_mapping || 'server1', sourceData, res_data_payload);
    const final_response = { status: true, message: final_message, data: mappedPayload, user_details: getUserDetails(req), execution_time: Number(elapsed.toFixed(3)), provider: final_provider, system: appConfig.server_name };
    const billingResponse = await applyUsageBilling(req, res, `Validation: ${type} ${input_code || ''}`);
    if (billingResponse) {
      if (params.nocache !== '1') queueLog(req, type, false, { status: false, message: 'Billing gagal setelah validasi sukses.' }, 402, startTime);
      return billingResponse;
    }
    if (params.nocache !== '1') { if (parseInt(appConfig.cache_enabled) === 1) cache.set(cache_key, final_response, appConfig.cache_time); queueLog(req, type, true, final_response, 200, startTime); }
    return res.status(200).json(final_response);
  } else {
    let fail_data = {};
    if (type === 'nik') fail_data = { nik: nik_number };
    else fail_data = type === 'bank'
      ? { bank_code: input_code, account_number, account_name: null }
      : { ewallet_code: input_code, account_number, account_name: null };
    const error_res = await applyInvalidPenaltyMeta({ status: false, message: type === 'bank' ? 'Validasi Gagal. Cek kembali Kode Bank atau Nomor Rekening.' : (type === 'nik' ? 'Gagal mengecek NIK atau data tidak ditemukan.' : 'Nomor tidak ditemukan.'), data: fail_data, user_details: getUserDetails(req), execution_time: Number(elapsed.toFixed(3)), provider: "none", system: appConfig.server_name });
    if (isDev && debug_errors.length > 0) error_res.debug_info = debug_errors;
    if (params.nocache !== '1') queueLog(req, type, false, error_res, 400, startTime);
    return res.status(400).json(error_res);
  }
};

// ============ MAIN CHECKER GET / ============
router.get('/', async (req, res) => {
  const isDocsRequest = !req.query.type && !req.query.accountNumber && !req.query.nik && !req.query.nomor;
  if (isDocsRequest) {
    return res.redirect(302, '/docs');
  }

  if (req.query.check_status === '1') {
    const internal = wa.getBaileysState ? wa.getBaileysState() : {};
    return res.json({ status: true, message: 'WhatsApp provider status retrieved.', data: { connected: !!(wa.isCheckerReady && wa.isCheckerReady()), status: wa.connectionStatus, qr_available: !!internal.qr_available } });
  }

  return authenticateRequest(req, res, async () => {
    const startTime = performance.now();
    res.header('Content-Type', 'application/json; charset=utf-8');
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate');
    return handleCheckRequest(req, res, req.query, startTime);
  });
});

// ============ /api/v3/validate ============
router.all('/api/v3/validate', authenticateRequest, async (req, res) => {
  const params = req.method === 'POST' ? req.body : req.query;
  const startTime = performance.now();

  if (params.check_status === '1') {
    const internal = wa.getBaileysState ? wa.getBaileysState() : {};
    return res.json({ status: true, message: 'WhatsApp provider status retrieved.', data: { connected: !!(wa.isCheckerReady && wa.isCheckerReady()), status: wa.connectionStatus, qr_available: !!internal.qr_available } });
  }

  return handleCheckRequest(req, res, params, startTime);
});

router.all('/callback_qiospay', (req, res) => {
  const payload = normalizeQiospayPayload(Object.assign({}, req.query || {}, req.body || {}));
  const callbackKey = String((cfg.appConfig && cfg.appConfig.qiospay_callback_key) || '112233').trim();
  if (String(payload.key || '').trim() !== callbackKey) {
    logQiospayCallback(`INVALID_KEY received=${String(payload.key || '').trim() || '-'} waiters=${qiospayWaiters.size} payload=${JSON.stringify(payload).slice(0, 1000)}`);
    return res.status(403).json({ status: false, message: 'Invalid callback key' });
  }
  const refID = getQiospayRefId(payload);
  const sampleWaiters = Array.from(qiospayWaiters.keys()).slice(0, 5).join(',');
  logQiospayCallback(`IN refID=${refID || '-'} has_waiter=${refID ? qiospayWaiters.has(refID) : false} waiters=${qiospayWaiters.size} sample=${sampleWaiters || '-'} payload=${JSON.stringify(payload).slice(0, 1000)}`);
  if (!refID) return res.json({ ok: true, status: true, message: 'Callback endpoint ready' });
  const waiter = qiospayWaiters.get(refID);
  if (waiter) {
    qiospayWaiters.delete(refID);
    waiter.resolve(payload);
  }
  return res.json({ ok: true, status: true, message: 'Callback accepted', refID });
});

module.exports = { router, cache, mappingCache, getBankMapping, getBankServer3NameByCode, qiospayWaiters };
