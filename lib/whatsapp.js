/**
 * lib/whatsapp.js
 * WhatsApp service:
 * - Validation checker: external providers (Fonnte/Pitucode)
 * - Notification sender: external or internal Baileys (when enabled)
 */

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const pino = require('pino');
let baileysMod = null;
async function loadBaileys() {
  if (!baileysMod) baileysMod = await import('@whiskeysockets/baileys');
  return baileysMod;
}
const cfg = require('./config');
const waOtp = require('./wa_otp');

let waJobsInitialized = false;
let waExpiryInterval = null;
let waAutoPauseInterval = null;
let waQueueInterval = null;

let sock = null;
let isStarting = false;
let qrCodeBase64 = null;
let lastQrAt = null;
let connectedJid = null;
let connectedNumber = null;
let lastPairingCode = null;
let lastPairingAt = null;
let connectionStatus = 'External Not Configured';
let baileysReconnectTimer = null;
let baileysReconnectAttempts = 0;
let suppressReconnectOnce = false;
let lastDisconnectReason = null;
const BAILEYS_SESSION_DIR = path.join(__dirname, '..', 'tmp', 'wa_baileys_auth');

function ensureDir(dirPath) {
  try { fs.mkdirSync(dirPath, { recursive: true }); } catch (e) { }
}

function clearBaileysSessionFiles() {
  try {
    fs.rmSync(BAILEYS_SESSION_DIR, { recursive: true, force: true });
  } catch (e) { }
}

function clearBaileysReconnectTimer() {
  if (baileysReconnectTimer) {
    clearTimeout(baileysReconnectTimer);
    baileysReconnectTimer = null;
  }
}

function scheduleBaileysReconnect(reason) {
  if (baileysReconnectTimer || baileysReconnectAttempts >= 5) return;
  baileysReconnectAttempts += 1;
  const delay = Math.min(3000 + (baileysReconnectAttempts * 1500), 12000);
  connectionStatus = `Baileys Reconnecting (${baileysReconnectAttempts}/5)`;
  console.warn('[WA] Baileys reconnect scheduled:', reason || 'unknown', `in ${delay}ms`);
  baileysReconnectTimer = setTimeout(() => {
    baileysReconnectTimer = null;
    startBaileys(false).catch((err) => {
      console.error('[WA] Baileys reconnect failed:', err && err.message ? err.message : err);
    });
  }, delay);
}

function normalizeTo62(number) {
  let clean = String(number || '').replace(/[^0-9]/g, '');
  if (clean.startsWith('08')) clean = '628' + clean.substring(2);
  return clean;
}

function normalizeTo08(number) {
  let clean = String(number || '').replace(/[^0-9]/g, '');
  if (clean.startsWith('62')) clean = '0' + clean.substring(2);
  return clean;
}

function extractTextFromMessage(message, depth = 0) {
  if (!message || depth > 6) return '';
  const direct =
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    message.buttonsResponseMessage?.selectedDisplayText ||
    message.buttonsResponseMessage?.selectedButtonId ||
    message.listResponseMessage?.title ||
    message.listResponseMessage?.singleSelectReply?.selectedRowId ||
    message.templateButtonReplyMessage?.selectedDisplayText ||
    message.templateButtonReplyMessage?.selectedId ||
    '';
  if (String(direct || '').trim()) return String(direct).trim();

  const nested = [
    message.ephemeralMessage?.message,
    message.viewOnceMessage?.message,
    message.viewOnceMessageV2?.message,
    message.viewOnceMessageV2Extension?.message,
    message.editedMessage?.message,
    message.documentWithCaptionMessage?.message,
    message.protocolMessage?.editedMessage
  ];
  for (const n of nested) {
    const txt = extractTextFromMessage(n, depth + 1);
    if (txt) return txt;
  }
  return '';
}

function isDirectUserJid(jid) {
  const raw = String(jid || '').trim().toLowerCase();
  if (!raw) return false;
  if (raw === 'status@broadcast') return false;
  if (raw.endsWith('@g.us')) return false;
  if (raw.endsWith('@broadcast')) return false;
  return raw.endsWith('@s.whatsapp.net') || raw.endsWith('@lid');
}

function digitsFromJid(jid) {
  const raw = String(jid || '').trim();
  if (!raw) return '';
  const bare = raw.split('@')[0].split(':')[0];
  return bare.replace(/[^0-9]/g, '');
}

function normalizeIncomingNumber(rawNumber) {
  const digits = String(rawNumber || '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  return digits.length >= 9 ? ('62' + digits) : digits;
}

function extractIncomingNumberFromMessage(m) {
  const key = (m && m.key) || {};
  const candidates = [
    key.remoteJidAlt,
    key.participantAlt,
    key.participant,
    key.remoteJid,
    m && m.participant,
    m && m.participantAlt
  ];
  for (const c of candidates) {
    const d = digitsFromJid(c);
    if (d) return normalizeIncomingNumber(d);
  }
  return '';
}

function applyTemplate(template, vars) {
  const t = String(template || '');
  return t.replace(/\{([a-zA-Z0-9_]+)\}/g, (m, k) => {
    if (vars && Object.prototype.hasOwnProperty.call(vars, k)) return String(vars[k]);
    return m;
  });
}

function getNotificationProvider() {
  const appConfig = cfg.appConfig || {};
  const raw = String(appConfig.wa_notification_provider || 'fonnte').trim().toLowerCase();
  if (raw === 'internal' || raw === 'baileys') return 'internal_baileys';
  if (raw === 'pitucode') return 'pitucode';
  return raw === 'internal_baileys' ? raw : 'fonnte';
}

function getProviderSummary() {
  const appConfig = cfg.appConfig || {};
  return {
    checker_fonnte: !!String(appConfig.fonnte_token || '').trim(),
    checker_pitucode: !!String(appConfig.pitucode_apikey || '').trim(),
    sender_fonnte: !!String(appConfig.fonnte_token || '').trim(),
    sender_internal_baileys: !!(sock && connectionStatus === 'Baileys Connected'),
    selected_notification_provider: getNotificationProvider()
  };
}

function isCheckerReady() {
  const summary = getProviderSummary();
  return summary.checker_fonnte || summary.checker_pitucode;
}

function getConnectionStatus() {
  const summary = getProviderSummary();
  const provider = summary.selected_notification_provider;
  if (provider === 'internal_baileys') return connectionStatus || 'Baileys Idle';
  if (summary.checker_fonnte || summary.checker_pitucode) return 'External Ready';
  return 'External Not Configured';
}

function getBaileysState() {
  return {
    enabled: getNotificationProvider() === 'internal_baileys',
    connected: connectionStatus === 'Baileys Connected',
    status: connectionStatus,
    qr_available: !!qrCodeBase64,
    qr_updated_at: lastQrAt,
    connected_jid: connectedJid,
    connected_number: connectedNumber,
    pairing_code: lastPairingCode,
    pairing_updated_at: lastPairingAt,
    reconnect_attempts: baileysReconnectAttempts,
    last_disconnect_reason: lastDisconnectReason
  };
}

async function requestBaileysPairingCode(rawNumber) {
  const num = normalizeTo62(rawNumber);
  if (!num) return { ok: false, message: 'Nomor WA wajib diisi.' };

  if (!sock || connectionStatus === 'Baileys Disconnected' || connectionStatus === 'Baileys Logged Out') {
    const boot = await startBaileys(true);
    if (!boot || !boot.ok) return { ok: false, message: (boot && boot.message) || 'Gagal memulai Baileys.' };
  }
  if (!sock) return { ok: false, message: 'Socket Baileys belum siap.' };
  if (connectionStatus === 'Baileys Connected') {
    return { ok: true, already_connected: true, message: 'Baileys sudah terkoneksi.', connected_number: connectedNumber || null };
  }
  if (typeof sock.requestPairingCode !== 'function') {
    return { ok: false, message: 'Versi Baileys ini belum mendukung pairing code. Gunakan QR login.' };
  }

  try {
    let code = '';
    for (let i = 0; i < 5; i += 1) {
      try {
        // requestPairingCode expects MSISDN without symbols.
        code = await sock.requestPairingCode(num);
        if (code) break;
      } catch (e) {
        if (i === 4) throw e;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    if (!code) return { ok: false, message: 'Pairing code belum tersedia. Coba lagi dalam beberapa detik.' };
    lastPairingCode = String(code);
    lastPairingAt = new Date().toISOString();
    return { ok: true, code: lastPairingCode, updated_at: lastPairingAt };
  } catch (err) {
    return { ok: false, message: err && err.message ? err.message : 'Gagal membuat pairing code.' };
  }
}

async function startBaileys(forceRestart = false) {
 try {
    const mod = await loadBaileys();
    const makeWASocket = mod.default;
    const useMultiFileAuthState = mod.useMultiFileAuthState;
    const fetchLatestBaileysVersion = mod.fetchLatestBaileysVersion;
    const DisconnectReason = mod.DisconnectReason;
    const Browsers = mod.Browsers;
    if (!makeWASocket || !useMultiFileAuthState || !fetchLatestBaileysVersion || !DisconnectReason) {
      throw new Error('Baileys module tidak lengkap/invalid.');
    }
    if (isStarting) return { ok: true, status: 'starting', message: 'Baileys sedang inisialisasi.' };
    if (sock && connectionStatus === 'Baileys Connected' && !forceRestart) {
      return { ok: true, status: 'connected', message: 'Baileys sudah terhubung.' };
    }

    isStarting = true;
    clearBaileysReconnectTimer();
    if (forceRestart) baileysReconnectAttempts = 0;
    connectionStatus = 'Baileys Starting';
    qrCodeBase64 = null;
    if (forceRestart && sock) {
      suppressReconnectOnce = true;
      try { sock.end?.(); } catch (e) { }
      sock = null;
    }

    ensureDir(BAILEYS_SESSION_DIR);
    const { state, saveCreds } = await useMultiFileAuthState(BAILEYS_SESSION_DIR);
    const latest = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      auth: state,
      version: latest.version,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: (Browsers && typeof Browsers.macOS === 'function') ? Browsers.macOS('Desktop') : ['API Checker', 'Chrome', '1.0.0'],
      markOnlineOnConnect: false,
      syncFullHistory: false,
      connectTimeoutMs: 60 * 1000
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update || {};

      if (qr) {
        try {
          qrCodeBase64 = await QRCode.toDataURL(qr, { margin: 1, width: 280 });
          lastQrAt = new Date().toISOString();
          connectionStatus = 'Baileys QR Ready';
        } catch (e) {
          connectionStatus = 'Baileys QR Error';
        }
      }

      if (connection === 'open') {
        baileysReconnectAttempts = 0;
        qrCodeBase64 = null;
        connectionStatus = 'Baileys Connected';
        const rawId = String((sock && sock.user && sock.user.id) || '').trim();
        connectedJid = rawId || null;
        connectedNumber = rawId ? rawId.split(':')[0].replace(/[^0-9]/g, '') : null;
      } else if (connection === 'close') {
        const statusCode = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output
          ? lastDisconnect.error.output.statusCode
          : null;
        const loggedOut = statusCode === DisconnectReason.loggedOut;
        const reason = statusCode ? `code=${statusCode}` : (lastDisconnect && lastDisconnect.error ? String(lastDisconnect.error.message || lastDisconnect.error) : 'unknown');
        lastDisconnectReason = reason;
        console.warn('[WA] Baileys connection closed:', reason);
        if (suppressReconnectOnce) {
          suppressReconnectOnce = false;
          return;
        }
        if (loggedOut) {
          clearBaileysSessionFiles();
          clearBaileysReconnectTimer();
          connectionStatus = 'Baileys Logged Out';
          connectedJid = null;
          connectedNumber = null;
          sock = null;
          return;
        }
        connectionStatus = `Baileys Disconnected (${reason})`;
        connectedJid = null;
        connectedNumber = null;
        sock = null;
        scheduleBaileysReconnect(reason);
      }
    });

    sock.ev.on('messages.upsert', async (evt) => {
      try {
        const arr = evt && Array.isArray(evt.messages) ? evt.messages : [];
        for (const m of arr) {
          if (!m || m.key?.fromMe) continue;
          const key = m.key || {};
          const remoteJid = String(key.remoteJid || '');
          const remoteJidAlt = String(key.remoteJidAlt || '');
          const primaryJid = remoteJid || remoteJidAlt;
          if (!isDirectUserJid(primaryJid) && !isDirectUserJid(remoteJidAlt)) continue;
          const fromNumber = extractIncomingNumberFromMessage(m);
          if (!fromNumber) {
            if (waOtp && typeof waOtp.logWaMessage === 'function') {
              await waOtp.logWaMessage({
                direction: 'inbound',
                provider: 'internal_baileys',
                whatsappNumber: '',
                messageText: '',
                messageType: 'otp',
                status: 'ignored',
                reason: 'sender_number_not_detected',
                payload: {
                  id: key.id || null,
                  remoteJid,
                  remoteJidAlt,
                  participant: key.participant || null,
                  participantAlt: key.participantAlt || null,
                  pushName: m.pushName || '',
                  messageTimestamp: m.messageTimestamp || null
                }
              });
            }
            continue;
          }
          const text = extractTextFromMessage(m.message);
          if (!text) {
            if (waOtp && typeof waOtp.logWaMessage === 'function') {
              await waOtp.logWaMessage({
                direction: 'inbound',
                provider: 'internal_baileys',
                whatsappNumber: fromNumber,
                messageText: '',
                messageType: 'otp',
                status: 'ignored',
                reason: 'no_text_detected',
                payload: {
                  id: key.id || null,
                  remoteJid,
                  remoteJidAlt,
                  pushName: m.pushName || '',
                  messageTimestamp: m.messageTimestamp || null
                }
              });
            }
            continue;
          }
          await waOtp.processInboundOtpMessage({
            fromNumber,
            text,
            rawPayload: {
              id: key.id || null,
              remoteJid,
              remoteJidAlt,
              pushName: m.pushName || '',
              messageTimestamp: m.messageTimestamp || null
            }
          });
        }
      } catch (e) {
        console.error('[WA][INBOUND] messages.upsert handler error:', e && e.message ? e.message : e);
      }
    });

    return { ok: true, status: 'starting', message: 'Baileys starting, scan QR saat tersedia.' };
  } catch (err) {
    const msg = (err && err.stack) ? err.stack : (err && err.message ? err.message : String(err));
    connectionStatus = `Baileys Error: ${(err && err.message) ? err.message : 'Unknown error'}`;
    console.error('[WA] startBaileys failed:', msg);
    return { ok: false, status: 'error', message: (err && err.message) ? err.message : 'Unknown error' };
  } finally {
    isStarting = false;
  }
}

async function logoutBaileys() {
  try {
    if (sock) {
      suppressReconnectOnce = true;
      try { await sock.logout(); } catch (e) { }
      try { sock.end?.(); } catch (e) { }
    }
    sock = null;
    qrCodeBase64 = null;
    clearBaileysReconnectTimer();
    baileysReconnectAttempts = 0;
    clearBaileysSessionFiles();
    connectionStatus = 'Baileys Logged Out';
    return { ok: true, message: 'Sesi Baileys dihapus. Silakan scan QR ulang.' };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

async function sendViaBaileys(targetNumber, message) {
  const to62 = normalizeTo62(targetNumber);
  if (!to62) return { ok: false, error: 'Nomor WA tidak valid.' };
  if (!sock || connectionStatus !== 'Baileys Connected') {
    return { ok: false, error: 'Baileys belum terhubung. Scan QR terlebih dahulu.' };
  }
  const jid = `${to62}@s.whatsapp.net`;
  await sock.sendMessage(jid, { text: String(message || '') });
  return { ok: true, provider: 'internal_baileys' };
}

async function sendViaFonnte(targetNumber, message) {
  const appConfig = cfg.appConfig || {};
  if (!String(appConfig.fonnte_token || '').trim()) {
    return { ok: false, error: 'Provider notifikasi Fonnte belum dikonfigurasi (token kosong).' };
  }
  const to62 = normalizeTo62(targetNumber);
  const form = new URLSearchParams();
  form.append('target', to62);
  form.append('message', String(message || ''));
  const r = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: { Authorization: appConfig.fonnte_token, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString()
  });
  const txt = await r.text();
  if (r.ok) return { ok: true, provider: 'fonnte', raw: txt };
  return { ok: false, error: 'Fonnte send failed', raw: txt };
}

async function logOutboundMessage(targetNumber, message, result, provider) {
  try {
    await cfg.dbPool.query(
      `INSERT INTO wa_message_logs
       (direction, provider, whatsapp_number, message_text, message_type, related_otp_id, status, reason, payload_json, created_at)
       VALUES ('outbound', ?, ?, ?, 'notif', NULL, ?, ?, ?, NOW())`,
      [
        String(provider || ''),
        normalizeTo62(targetNumber),
        String(message || '').slice(0, 1000),
        result && result.ok ? 'sent' : 'failed',
        result && result.ok ? 'ok' : String((result && result.error) || 'send_failed').slice(0, 255),
        result ? JSON.stringify(result).slice(0, 15000) : null
      ]
    );
  } catch (e) { }
}

async function sendWAText(targetNumber, message, options = {}) {
  try {
    const clean = normalizeTo62(targetNumber);
    if (!clean) return { ok: false, error: 'Empty number' };
    const forcedProvider = String((options && options.provider) || '').trim().toLowerCase();
    const provider = forcedProvider || getNotificationProvider();

    return await runWithPerNumberSendDelay(clean, async () => {
      if (provider === 'internal_baileys') {
        const out = await sendViaBaileys(clean, message);
        await logOutboundMessage(clean, message, out, 'internal_baileys');
        return out;
      }
      if (provider === 'pitucode') {
        const out = { ok: false, error: 'Provider notifikasi pitucode belum didukung untuk kirim pesan.' };
        await logOutboundMessage(clean, message, out, 'pitucode');
        return out;
      }
      const out = await sendViaFonnte(clean, message);
      await logOutboundMessage(clean, message, out, 'fonnte');
      return out;
    });
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

const WA_BALANCE_SEND_GAP_MS = 2 * 60 * 1000;
const WA_PER_NUMBER_SEND_GAP_MS = 10 * 1000;
const waNumberSendChains = new Map();
const waNumberLastSentAt = new Map();
let waLowBalanceJobRunning = false;
let waLowBalanceQueue = [];
let waLowBalanceQueued = new Set();
let waLowBalanceNextSendAt = 0;
let waLowBalanceSending = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

function runWithPerNumberSendDelay(targetNumber, task) {
  const to62 = normalizeTo62(targetNumber);
  if (!to62) return task();

  const previous = waNumberSendChains.get(to62) || Promise.resolve();
  const next = previous
    .catch(() => { })
    .then(async () => {
      const lastSentAt = waNumberLastSentAt.get(to62) || 0;
      const waitMs = (lastSentAt + WA_PER_NUMBER_SEND_GAP_MS) - Date.now();
      if (waitMs > 0) await sleep(waitMs);
      try {
        return await task();
      } finally {
        waNumberLastSentAt.set(to62, Date.now());
      }
    })
    .finally(() => {
      if (waNumberSendChains.get(to62) === next) waNumberSendChains.delete(to62);
    });

  waNumberSendChains.set(to62, next);
  return next;
}

function calcLowBalanceStep(balanceRaw) {
  const balance = Number(balanceRaw || 0);
  if (!Number.isFinite(balance)) return 0;
  if (balance > 5000) return 0;
  const step = Math.floor((5000 - Math.max(balance, 0)) / 1000) + 1;
  return Math.max(1, Math.min(5, step));
}

function calcLowBalanceThreshold(step) {
  const s = Math.max(1, Math.min(5, Number(step || 1)));
  return 5000 - ((s - 1) * 1000);
}

function enqueueLowBalanceNotifications(rows) {
  for (const u of rows || []) {
    const k = `${u.id}_${u.warn_step}`;
    if (waLowBalanceQueued.has(k)) continue;
    waLowBalanceQueued.add(k);
    waLowBalanceQueue.push({ ...u, _queue_key: k });
  }
}

async function processLowBalanceWaQueue() {
  if (waLowBalanceSending) return;
  const appConfig = cfg.appConfig;
  if (parseInt(appConfig.wa_notify_enabled, 10) !== 1) return;
  if (!waLowBalanceQueue.length) return;
  const now = Date.now();
  if (now < waLowBalanceNextSendAt) return;

  const u = waLowBalanceQueue.shift();
  if (u && u._queue_key) waLowBalanceQueued.delete(u._queue_key);

  waLowBalanceSending = true;
  try {
    const base_url = appConfig.public_base_url || '';
    const threshold = calcLowBalanceThreshold(u.warn_step);
    const vars = {
      name: u.name, api_key: u.api_key, whatsapp_number: u.whatsapp_number,
      package: u.package_name || 'No Package',
      balance: Number(u.balance || 0).toLocaleString('id-ID'),
      threshold: Number(threshold).toLocaleString('id-ID'),
      base_url
    };
    const msg = applyTemplate(appConfig.wa_template_expiry_2d, vars);
    const sent = await sendWAText(u.whatsapp_number, msg);
    if (sent && sent.ok) {
      await cfg.dbPool.query('UPDATE api_keys SET wa_low_balance_warn_step = ?, wa_expiry_warned_at = NOW() WHERE id = ?', [u.warn_step, u.id]);
    }
  } finally {
    waLowBalanceNextSendAt = Date.now() + WA_BALANCE_SEND_GAP_MS;
    waLowBalanceSending = false;
  }
}

async function runLowBalanceWaNotifier() {
  if (waLowBalanceJobRunning) return;
  const appConfig = cfg.appConfig;
  if (parseInt(appConfig.wa_notify_enabled, 10) !== 1) return;
  waLowBalanceJobRunning = true;
  try {
    await cfg.dbPool.query(
      `UPDATE api_keys
       SET wa_low_balance_warn_step = 0
       WHERE is_active = 1 AND balance > 5000 AND COALESCE(wa_low_balance_warn_step, 0) <> 0`
    );

    const [rows] = await cfg.dbPool.query(`
      SELECT u.id, u.name, u.api_key, u.whatsapp_number, u.balance, u.package_id, COALESCE(u.wa_low_balance_warn_step, 0) as wa_low_balance_warn_step, p.name as package_name
      FROM api_keys u
      LEFT JOIN packages p ON u.package_id = p.package_id
      WHERE u.is_active = 1
        AND u.whatsapp_number IS NOT NULL AND u.whatsapp_number <> ''
        AND u.balance <= 5000
      ORDER BY u.balance ASC
      LIMIT 200
    `);

    const targets = [];
    for (const row of rows || []) {
      const step = calcLowBalanceStep(row.balance);
      const warned = Number(row.wa_low_balance_warn_step || 0);
      if (step > warned) {
        targets.push({ ...row, warn_step: step });
      }
    }
    enqueueLowBalanceNotifications(targets);
  } finally {
    waLowBalanceJobRunning = false;
  }
}

async function runAutoPauseJob() {
  try {
    const [result] = await cfg.dbPool.query(`
      UPDATE api_keys
      SET is_active = 0
      WHERE billing_type = 'balance'
        AND is_active = 1
        AND last_used < DATE_SUB(NOW(), INTERVAL 28 DAY)
    `);
    if (result && result.affectedRows > 0) {
      console.log(`[AUTO-PAUSE] ${result.affectedRows} users deactivated due to 28 days inactivity.`);
    }
  } catch (err) {
    console.error('[AUTO-PAUSE] Job Error:', err);
  }
}

function initWaJobs() {
  if (waJobsInitialized) return;
  waJobsInitialized = true;

  waExpiryInterval = setInterval(runLowBalanceWaNotifier, 30 * 60 * 1000);
  setTimeout(runLowBalanceWaNotifier, 60 * 1000);

  waAutoPauseInterval = setInterval(runAutoPauseJob, 60 * 60 * 1000);
  setTimeout(runAutoPauseJob, 30 * 1000);

  waQueueInterval = setInterval(processLowBalanceWaQueue, 10 * 1000);
  setTimeout(processLowBalanceWaQueue, 10 * 1000);

  // Safety: do not auto-start Baileys on boot by default.
  // This prevents full app startup failure when Baileys runtime is unstable on VPS.
  // Enable only if explicitly requested via env WA_BAILEYS_AUTOSTART=1.
  if (getNotificationProvider() === 'internal_baileys' && String(process.env.WA_BAILEYS_AUTOSTART || '') === '1') {
    startBaileys(false).catch((err) => {
      console.error('[WA] Auto-start Baileys failed:', err && err.message ? err.message : err);
    });
  }
}

module.exports = {
  get sock() { return sock; },
  get qrCodeBase64() { return qrCodeBase64; },
  set qrCodeBase64(v) { qrCodeBase64 = v; },
  get connectionStatus() { return getConnectionStatus(); },
  set connectionStatus(v) { connectionStatus = v; },
  getProviderSummary,
  getBaileysState,
  requestBaileysPairingCode,
  isCheckerReady,
  startBaileys,
  logoutBaileys,
  sendWAText,
  applyTemplate,
  normalizeTo62,
  normalizeTo08,
  initWaJobs
};
