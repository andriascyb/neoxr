const crypto = require('crypto');
const cfg = require('./config');
const { normalizeWhatsAppNumber } = require('./member_auth');

let waModuleCache = null;
function getWaModule() {
  if (!waModuleCache) waModuleCache = require('./whatsapp');
  return waModuleCache;
}

function maskOtp(otp) {
  const raw = String(otp || '');
  if (raw.length <= 2) return '**';
  return `${raw[0]}***${raw.slice(-1)}`;
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getOtpStatusSecret() {
  return String(
    (cfg.appConfig && cfg.appConfig.member_otp_status_secret) ||
    cfg.ADMIN_KEY ||
    process.env.MEMBER_OTP_STATUS_SECRET ||
    'otp_status_secret_fallback'
  );
}

function buildOtpStatusToken(draftId, otpSessionId) {
  const d = parseInt(draftId, 10);
  const s = parseInt(otpSessionId, 10);
  if (!Number.isFinite(d) || d <= 0 || !Number.isFinite(s) || s <= 0) return '';
  const body = `${d}:${s}`;
  const digest = crypto
    .createHmac('sha256', getOtpStatusSecret())
    .update(body)
    .digest('hex');
  return `v1_${digest}`;
}

function verifyOtpStatusToken(draftId, otpSessionId, token) {
  const expected = buildOtpStatusToken(draftId, otpSessionId);
  const given = String(token || '').trim();
  if (!expected || !given) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  } catch (e) {
    return false;
  }
}

async function logWaMessage({
  direction,
  provider,
  whatsappNumber,
  messageText,
  messageType,
  relatedOtpId = null,
  status,
  reason = '',
  payload = null
}) {
  try {
    await cfg.dbPool.query(
      `INSERT INTO wa_message_logs
       (direction, provider, whatsapp_number, message_text, message_type, related_otp_id, status, reason, payload_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        String(direction || 'inbound'),
        String(provider || ''),
        String(whatsappNumber || ''),
        String(messageText || '').slice(0, 1000),
        String(messageType || 'otp'),
        relatedOtpId,
        String(status || 'received'),
        String(reason || '').slice(0, 500),
        payload ? JSON.stringify(payload).slice(0, 15000) : null
      ]
    );
  } catch (e) { }
}

async function createRegistrationOtpChallenge(payload = {}) {
  const name = String(payload.name || '').trim();
  const whatsappNumber = normalizeWhatsAppNumber(payload.whatsapp_number || payload.whatsapp || '');
  const pinHash = String(payload.pin_hash || '');
  const registrationIp = String(payload.registration_ip || '');

  if (!name) throw new Error('Nama wajib diisi.');
  if (!whatsappNumber || whatsappNumber.length < 10) throw new Error('Nomor WhatsApp tidak valid.');
  if (!pinHash) throw new Error('Data PIN tidak valid.');

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiryMin = Math.max(1, parseInt(cfg.appConfig.wa_otp_expiry_minutes, 10) || 5);
  const maxAttempts = Math.max(1, parseInt(cfg.appConfig.wa_otp_max_attempts, 10) || 5);

  const conn = await cfg.dbPool.getConnection();
  try {
    await conn.beginTransaction();
    const [existingDraft] = await conn.query(
      `SELECT id FROM member_registration_drafts WHERE whatsapp_number = ? AND status = 'pending' LIMIT 1`,
      [whatsappNumber]
    );
    if (existingDraft.length > 0) {
      throw new Error('Masih ada proses registrasi OTP yang berjalan untuk nomor ini.');
    }

    const [existingMember] = await conn.query(
      `SELECT id FROM member_accounts WHERE whatsapp_number = ? LIMIT 1`,
      [whatsappNumber]
    );
    if (existingMember.length > 0) {
      throw new Error('Nomor WhatsApp sudah terdaftar.');
    }

    const [otpInsert] = await conn.query(
      `INSERT INTO wa_otp_sessions
       (whatsapp_number, otp_code_hash, otp_code_masked, purpose, status, expires_at, attempts, max_attempts, created_at)
       VALUES (?, ?, ?, 'register', 'pending', DATE_ADD(NOW(), INTERVAL ? MINUTE), 0, ?, NOW())`,
      [whatsappNumber, otpHash, maskOtp(otp), expiryMin, maxAttempts]
    );
    const otpId = otpInsert.insertId;

    const [draftInsert] = await conn.query(
      `INSERT INTO member_registration_drafts
       (name, whatsapp_number, pin_hash, registration_ip, otp_session_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [name, whatsappNumber, pinHash, registrationIp, otpId]
    );
    const draftId = draftInsert.insertId;

    await conn.commit();
    return {
      draft_id: draftId,
      otp_session_id: otpId,
      whatsapp_number: whatsappNumber,
      otp_code: otp,
      otp_status_token: buildOtpStatusToken(draftId, otpId)
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function getRegistrationOtpStatus(draftId) {
  const [rows] = await cfg.dbPool.query(
    `SELECT d.id, d.otp_session_id, d.status, d.verified_at, d.member_id, d.whatsapp_number, s.expires_at
     FROM member_registration_drafts d
     LEFT JOIN wa_otp_sessions s ON s.id = d.otp_session_id
     WHERE d.id = ? LIMIT 1`,
    [draftId]
  );
  if (!rows.length) return null;
  const row = rows[0];
  return {
    draft_id: row.id,
    otp_session_id: row.otp_session_id,
    status: row.status,
    verified_at: row.verified_at,
    member_id: row.member_id,
    whatsapp_number: row.whatsapp_number,
    expires_at: row.expires_at
  };
}

async function sendOtpInstructionIfPossible(challenge) {
  const targetAdmin = normalizeWhatsAppNumber(cfg.appConfig.member_register_otp_target_number || '');
  if (!targetAdmin) return { ok: false, skipped: true, reason: 'target_admin_number_empty' };
  const msg = `Kode OTP registrasi Anda: ${challenge.otp_code}\nBalas/ kirim kode ini ke nomor WA admin ini untuk verifikasi.\nBerlaku ${Math.max(1, parseInt(cfg.appConfig.wa_otp_expiry_minutes, 10) || 5)} menit.`;
  const wa = getWaModule();
  const sent = await wa.sendWAText(challenge.whatsapp_number, msg);
  return sent;
}

async function verifyDraftAndCreateMemberByOtpSession(otpSessionId) {
  const conn = await cfg.dbPool.getConnection();
  try {
    await conn.beginTransaction();
    const [draftRows] = await conn.query(
      `SELECT * FROM member_registration_drafts WHERE otp_session_id = ? AND status = 'pending' LIMIT 1 FOR UPDATE`,
      [otpSessionId]
    );
    if (!draftRows.length) {
      await conn.rollback();
      return { ok: false, reason: 'draft_not_found_or_not_pending' };
    }
    const draft = draftRows[0];

    const [memberExists] = await conn.query(
      `SELECT id FROM member_accounts WHERE whatsapp_number = ? LIMIT 1`,
      [draft.whatsapp_number]
    );
    if (memberExists.length) {
      await conn.query(`UPDATE member_registration_drafts SET status='failed', failure_reason='member_exists', updated_at=NOW() WHERE id=?`, [draft.id]);
      await conn.commit();
      return { ok: false, reason: 'member_exists' };
    }

    const bonus = Number(cfg.appConfig.member_register_bonus || 50);
    const [memberInsert] = await conn.query(
      `INSERT INTO member_accounts
       (name, whatsapp_number, registration_ip, pin_hash, active_mode, wallet_balance, is_active, failed_pin_attempts, pin_locked_until, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'balance', ?, 1, 0, NULL, NOW(), NOW())`,
      [draft.name, draft.whatsapp_number, draft.registration_ip || null, draft.pin_hash, bonus]
    );
    const memberId = memberInsert.insertId;
    const memberCode = `MBR${String(memberId).padStart(6, '0')}`;
    await conn.query(`UPDATE member_accounts SET member_code = ? WHERE id = ?`, [memberCode, memberId]);

    await conn.query(
      `INSERT INTO member_wallet_transactions
       (member_id, type, amount, balance_before, balance_after, description, reference_type, reference_id, created_at)
       VALUES (?, 'bonus', ?, 0, ?, 'Bonus registrasi member', 'register_bonus', ?, NOW())`,
      [memberId, bonus, bonus, String(memberId)]
    );

    const apiKey = `ckr_${crypto.randomUUID().replace(/-/g, '')}`;
    const [apiInsert] = await conn.query(
      `INSERT INTO api_keys (api_key, name, whatsapp_number, balance, billing_type, package_id, is_active, expiry, created_at, last_used)
       VALUES (?, ?, ?, ?, 'balance', NULL, 1, NULL, NOW(), NOW())`,
      [apiKey, draft.name, draft.whatsapp_number, bonus]
    );
    await conn.query(
      `INSERT INTO member_api_keys (member_id, api_key_id, is_primary) VALUES (?, ?, 1)`,
      [memberId, apiInsert.insertId]
    );

    await conn.query(
      `UPDATE member_registration_drafts
       SET status='verified', verified_at=NOW(), member_id=?, updated_at=NOW()
       WHERE id=?`,
      [memberId, draft.id]
    );
    await conn.commit();
    return {
      ok: true,
      draft_id: draft.id,
      member_id: memberId,
      member_code: memberCode,
      api_key: apiKey,
      whatsapp_number: draft.whatsapp_number
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function processInboundOtpMessage({ fromNumber, text, rawPayload }) {
  const normalized = normalizeWhatsAppNumber(fromNumber || '');
  const body = String(text || '').trim();
  const otp = /^\d{6}$/.test(body) ? body : '';

  await logWaMessage({
    direction: 'inbound',
    provider: 'internal_baileys',
    whatsappNumber: normalized,
    messageText: body,
    messageType: 'otp',
    status: 'received',
    reason: otp ? 'otp_plain_digits' : 'invalid_format',
    payload: rawPayload
  });

  if (!normalized || !otp) return { matched: false, reason: 'invalid_format_only_digits_allowed' };

  const [rows] = await cfg.dbPool.query(
    `SELECT id, whatsapp_number, otp_code_hash, status, expires_at, attempts, max_attempts
     FROM wa_otp_sessions
     WHERE whatsapp_number = ? AND purpose = 'register' AND status = 'pending'
     ORDER BY id DESC
     LIMIT 1`,
    [normalized]
  );
  if (!rows.length) {
    await logWaMessage({
      direction: 'inbound',
      provider: 'internal_baileys',
      whatsappNumber: normalized,
      messageText: body,
      messageType: 'otp',
      status: 'ignored',
      reason: 'no_pending_session'
    });
    return { matched: false, reason: 'no_pending_session' };
  }

  const session = rows[0];
  const now = new Date();
  if (session.expires_at && new Date(session.expires_at) <= now) {
    await cfg.dbPool.query(`UPDATE wa_otp_sessions SET status='expired' WHERE id=?`, [session.id]);
    await logWaMessage({
      direction: 'inbound',
      provider: 'internal_baileys',
      whatsappNumber: normalized,
      messageText: body,
      messageType: 'otp',
      relatedOtpId: session.id,
      status: 'expired',
      reason: 'session_expired'
    });
    return { matched: true, verified: false, reason: 'expired' };
  }

  const otpHash = hashOtp(otp);
  if (otpHash !== String(session.otp_code_hash || '')) {
    const nextAttempts = Number(session.attempts || 0) + 1;
    const maxAttempts = Number(session.max_attempts || 5);
    const finalStatus = nextAttempts >= maxAttempts ? 'failed' : 'pending';
    await cfg.dbPool.query(
      `UPDATE wa_otp_sessions SET attempts = ?, status = ? WHERE id = ?`,
      [nextAttempts, finalStatus, session.id]
    );
    await logWaMessage({
      direction: 'inbound',
      provider: 'internal_baileys',
      whatsappNumber: normalized,
      messageText: body,
      messageType: 'otp',
      relatedOtpId: session.id,
      status: finalStatus === 'failed' ? 'failed' : 'invalid',
      reason: finalStatus === 'failed' ? 'max_attempt_reached' : 'otp_mismatch'
    });
    return { matched: true, verified: false, reason: finalStatus === 'failed' ? 'failed' : 'mismatch' };
  }

  await cfg.dbPool.query(
    `UPDATE wa_otp_sessions SET status='verified', verified_at=NOW(), attempts = attempts + 1 WHERE id = ?`,
    [session.id]
  );
  const finalize = await verifyDraftAndCreateMemberByOtpSession(session.id);

  await logWaMessage({
    direction: 'inbound',
    provider: 'internal_baileys',
    whatsappNumber: normalized,
    messageText: body,
    messageType: 'otp',
    relatedOtpId: session.id,
    status: finalize && finalize.ok ? 'verified' : 'failed',
    reason: finalize && finalize.ok ? 'otp_verified' : (finalize && finalize.reason ? finalize.reason : 'finalize_failed'),
    payload: finalize
  });

  return { matched: true, verified: !!(finalize && finalize.ok), result: finalize };
}

async function getWaOtpLogs(params = {}) {
  const direction = String(params.direction || '').trim().toLowerCase();
  const number = normalizeWhatsAppNumber(params.number || '');
  const status = String(params.status || '').trim().toLowerCase();
  const messageType = String(params.message_type || '').trim().toLowerCase();
  const reason = String(params.reason || '').trim().toLowerCase();
  const limit = Math.max(1, Math.min(parseInt(params.limit, 10) || 100, 500));
  const where = [];
  const values = [];
  if (direction === 'inbound' || direction === 'outbound') {
    where.push('direction = ?');
    values.push(direction);
  }
  if (number) {
    where.push('whatsapp_number = ?');
    values.push(number);
  }
  if (status) {
    where.push('status = ?');
    values.push(status);
  }
  if (messageType) {
    where.push('LOWER(message_type) = ?');
    values.push(messageType);
  }
  if (reason) {
    where.push('LOWER(reason) LIKE ?');
    values.push(`%${reason}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await cfg.dbPool.query(
    `SELECT id, direction, provider, whatsapp_number, message_text, message_type, related_otp_id, status, reason, created_at
     FROM wa_message_logs
     ${whereSql}
     ORDER BY id DESC
     LIMIT ?`,
    [...values, limit]
  );
  return rows || [];
}

function buildWaOtpLogWhere(params = {}) {
  const direction = String(params.direction || '').trim().toLowerCase();
  const number = normalizeWhatsAppNumber(params.number || '');
  const status = String(params.status || '').trim().toLowerCase();
  const messageType = String(params.message_type || '').trim().toLowerCase();
  const reason = String(params.reason || '').trim().toLowerCase();
  const where = [];
  const values = [];
  if (direction === 'inbound' || direction === 'outbound') {
    where.push('direction = ?');
    values.push(direction);
  }
  if (number) {
    where.push('whatsapp_number = ?');
    values.push(number);
  }
  if (status) {
    where.push('status = ?');
    values.push(status);
  }
  if (messageType) {
    where.push('LOWER(message_type) = ?');
    values.push(messageType);
  }
  if (reason) {
    where.push('LOWER(reason) LIKE ?');
    values.push(`%${reason}%`);
  }
  return {
    where,
    values,
    whereSql: where.length ? `WHERE ${where.join(' AND ')}` : ''
  };
}

async function getWaOtpLogsPaged(params = {}) {
  const pageSize = Math.max(1, Math.min(parseInt(params.page_size || params.limit, 10) || 25, 200));
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const offset = (page - 1) * pageSize;
  const { whereSql, values } = buildWaOtpLogWhere(params);

  const [countRows] = await cfg.dbPool.query(
    `SELECT COUNT(*) AS total FROM wa_message_logs ${whereSql}`,
    values
  );
  const total = Number((countRows && countRows[0] && countRows[0].total) || 0);

  const [rows] = await cfg.dbPool.query(
    `SELECT id, direction, provider, whatsapp_number, message_text, message_type, related_otp_id, status, reason, created_at
     FROM wa_message_logs
     ${whereSql}
     ORDER BY id DESC
     LIMIT ? OFFSET ?`,
    [...values, pageSize, offset]
  );
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    rows: rows || [],
    pagination: {
      page,
      page_size: pageSize,
      total,
      total_pages: totalPages,
      has_prev: page > 1,
      has_next: page < totalPages
    }
  };
}

async function clearWaOtpLogs(params = {}) {
  const mode = String(params.mode || '').trim().toLowerCase();
  const { where, whereSql, values } = buildWaOtpLogWhere(params);
  if (mode !== 'all' && where.length === 0) {
    throw new Error('Filter wajib diisi untuk bersihkan log (atau gunakan mode=all).');
  }
  const [result] = await cfg.dbPool.query(
    `DELETE FROM wa_message_logs ${mode === 'all' ? '' : whereSql}`,
    mode === 'all' ? [] : values
  );
  return Number((result && result.affectedRows) || 0);
}

module.exports = {
  createRegistrationOtpChallenge,
  getRegistrationOtpStatus,
  verifyOtpStatusToken,
  sendOtpInstructionIfPossible,
  processInboundOtpMessage,
  getWaOtpLogs,
  getWaOtpLogsPaged,
  clearWaOtpLogs,
  logWaMessage
};
