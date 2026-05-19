const express = require('express');
const QRCode = require('qrcode');
const NodeCache = require('node-cache');
const cfg = require('../lib/config');
const wa = require('../lib/whatsapp');
const {
  buildSessionCookie,
  buildClearSessionCookie,
  getSessionTokenFromRequest,
  requireMemberAuth,
  getClientIp,
  normalizeWhatsAppNumber,
  validatePin,
  hashPin
} = require('../lib/member_auth');
const {
  createRegistrationOtpChallenge,
  getRegistrationOtpStatus,
  verifyOtpStatusToken,
  sendOtpInstructionIfPossible
} = require('../lib/wa_otp');
const {
  registerMember,
  getRegistrationStatus,
  loginMember,
  logoutMember,
  getMemberDashboard,
  revokePrimaryApiKey,
  regeneratePrimaryApiKey,
  createMemberTopup,
  syncMemberTopupStatus,
  getMemberTopupQrString,
  findRegistrationIpConflicts
} = require('../lib/member_service');
const { getMergedDepositMethods } = require('../lib/h2h_deposit');

const router = express.Router();
const authRateCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

function applyFixedWindowRateLimit(key, limit, windowSec) {
  const now = Date.now();
  const bucket = authRateCache.get(key) || { count: 0, resetAt: now + (windowSec * 1000) };
  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + (windowSec * 1000);
  }
  bucket.count += 1;
  authRateCache.set(key, bucket, Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)));
  if (bucket.count > limit) {
    return { limited: true, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  return { limited: false, retryAfterSec: 0 };
}

function enforceMemberAuthRateLimit(req, res, mode) {
  const ip = String(getClientIp(req) || 'unknown');
  const wa = normalizeWhatsAppNumber((req.body && (req.body.whatsapp_number || req.body.whatsapp)) || '');

  const byIp = mode === 'register'
    ? applyFixedWindowRateLimit(`member_reg_ip:${ip}`, 5, 600)
    : applyFixedWindowRateLimit(`member_login_ip:${ip}`, 20, 600);
  if (byIp.limited) {
    res.setHeader('Retry-After', String(byIp.retryAfterSec));
    res.status(429).json({ status: false, message: 'Terlalu banyak percobaan dari IP ini. Coba lagi beberapa saat.', code: 'RATE_LIMIT_IP' });
    return true;
  }

  if (wa) {
    const byWa = mode === 'register'
      ? applyFixedWindowRateLimit(`member_reg_wa:${wa}`, 3, 1800)
      : applyFixedWindowRateLimit(`member_login_wa:${wa}`, 10, 600);
    if (byWa.limited) {
      res.setHeader('Retry-After', String(byWa.retryAfterSec));
      res.status(429).json({ status: false, message: 'Terlalu banyak percobaan untuk nomor ini. Coba lagi nanti.', code: 'RATE_LIMIT_WA' });
      return true;
    }
  }

  return false;
}

router.get('/register-status', async (req, res) => {
  try {
    const status = getRegistrationStatus();
    res.json({ status: true, data: { ...status, server_time: new Date().toISOString() } });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/register', async (req, res) => {
  if (enforceMemberAuthRateLimit(req, res, 'register')) return;
  try {
    const registrationIp = getClientIp(req);
    const ipConflicts = await findRegistrationIpConflicts(registrationIp, { limit: 5 });
    if (ipConflicts && ipConflicts.total > 0) {
      const refs = (ipConflicts.members || []).map((m) => {
        const code = String(m.member_code || ('ID#' + m.id));
        const name = String(m.name || '-');
        const wa = String(m.whatsapp_number || '-');
        return `${code} - ${name} (${wa})`;
      });
      const detailText = refs.join(', ');
      return res.status(409).json({
        status: false,
        code: 'REGISTER_IP_CONFLICT',
        message: 'IP ini sudah pernah dipakai untuk registrasi akun lain.',
        detail: detailText,
        data: {
          registration_ip: registrationIp,
          total_match: ipConflicts.total,
          matched_members: ipConflicts.members
        }
      });
    }

    const requireOtp = Number(cfg.appConfig.member_register_require_otp || 0) === 1;
    if (requireOtp) {
      const waProvider = String(cfg.appConfig.wa_notification_provider || '').trim().toLowerCase();
      if (waProvider === 'internal_baileys') {
        const internalState = wa.getBaileysState ? wa.getBaileysState() : null;
        if (!internalState || !internalState.connected) {
          return res.status(503).json({
            status: false,
            message: 'Verifikasi OTP sedang offline. Silakan hubungkan Internal Baileys (scan QR/pairing) terlebih dahulu.',
            code: 'OTP_CHANNEL_OFFLINE'
          });
        }
      }

      const body = req.body || {};
      const name = String(body.name || '').trim();
      const whatsapp = normalizeWhatsAppNumber(body.whatsapp_number || body.whatsapp || '');
      const pin = String(body.pin || '');
      if (!name) throw new Error('Nama wajib diisi.');
      if (!whatsapp || whatsapp.length < 10) throw new Error('Nomor WhatsApp tidak valid.');
      if (!validatePin(pin)) throw new Error('PIN harus 6 digit angka.');

      const challenge = await createRegistrationOtpChallenge({
        name,
        whatsapp_number: whatsapp,
        pin_hash: hashPin(pin),
        registration_ip: registrationIp
      });
      const sendResult = await sendOtpInstructionIfPossible(challenge);
      const adminTarget = normalizeWhatsAppNumber(cfg.appConfig.member_register_otp_target_number || '');
      const waMeLink = adminTarget
        ? `https://wa.me/${adminTarget}?text=${encodeURIComponent(challenge.otp_code)}`
        : null;

      return res.json({
        status: true,
        message: 'Registrasi dimulai. Silakan kirim OTP ke nomor WA admin untuk verifikasi.',
        data: {
          otp_required: true,
          draft_id: challenge.draft_id,
          otp_session_id: challenge.otp_session_id,
          otp_status_token: challenge.otp_status_token,
          otp_code: challenge.otp_code,
          otp_expires_minutes: Math.max(1, parseInt(cfg.appConfig.wa_otp_expiry_minutes, 10) || 5),
          send_instruction_status: sendResult && sendResult.ok ? 'sent' : 'failed_or_skipped',
          admin_target_number: adminTarget || null,
          send_wa_link: waMeLink
        }
      });
    }

    const result = await registerMember({ ...(req.body || {}), req });
    const loginResult = await loginMember(req.body || {}, req);
    res.setHeader('Set-Cookie', buildSessionCookie(loginResult.token, req));
    res.json({ status: true, message: 'Registrasi berhasil.', data: result });
  } catch (err) {
    res.status(400).json({ status: false, message: err.message });
  }
});

router.get('/register/otp-status', async (req, res) => {
  try {
    const draftId = parseInt(req.query.draft_id, 10);
    const statusToken = String(req.query.token || '').trim();
    if (!Number.isFinite(draftId) || draftId <= 0) {
      return res.status(400).json({ status: false, message: 'draft_id tidak valid.' });
    }
    if (!statusToken) {
      return res.status(400).json({ status: false, message: 'token OTP wajib diisi.' });
    }
    const data = await getRegistrationOtpStatus(draftId);
    if (!data) return res.status(404).json({ status: false, message: 'Draft registrasi tidak ditemukan.' });
    if (!verifyOtpStatusToken(draftId, data.otp_session_id, statusToken)) {
      return res.status(403).json({ status: false, message: 'Token OTP status tidak valid.' });
    }
    return res.json({
      status: true,
      data: {
        draft_id: data.draft_id,
        status: data.status,
        verified_at: data.verified_at,
        member_id: data.member_id,
        whatsapp_number: data.whatsapp_number,
        expires_at: data.expires_at
      }
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/login', async (req, res) => {
  if (enforceMemberAuthRateLimit(req, res, 'login')) return;
  try {
    const result = await loginMember(req.body || {}, req);
    res.setHeader('Set-Cookie', buildSessionCookie(result.token, req));
    res.json({ status: true, message: 'Login berhasil.' });
  } catch (err) {
    const statusCode = err.code === 'PIN_LOCKED' ? 423 : 400;
    res.status(statusCode).json({ status: false, message: err.message, code: err.code || 'LOGIN_FAILED' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    await logoutMember(getSessionTokenFromRequest(req));
    res.setHeader('Set-Cookie', buildClearSessionCookie(req));
    res.json({ status: true, message: 'Logout berhasil.' });
  } catch (err) {
    console.error('[MEMBER][LOGOUT] Error:', err);
    res.status(500).json({ status: false, message: 'Terjadi kesalahan server.', code: 'INTERNAL_ERROR' });
  }
});

router.get('/me', requireMemberAuth, async (req, res) => {
  try {
    const data = await getMemberDashboard(req.member.id);
    res.json({ status: true, data });
  } catch (err) {
    console.error('[MEMBER][ME] Error:', err);
    res.status(500).json({ status: false, message: 'Terjadi kesalahan server.', code: 'INTERNAL_ERROR' });
  }
});

router.post('/apikey/revoke', requireMemberAuth, async (req, res) => {
  try {
    await revokePrimaryApiKey(req.member.id);
    res.json({ status: true, message: 'API key berhasil direvoke.' });
  } catch (err) {
    res.status(400).json({ status: false, message: err.message });
  }
});

router.post('/apikey/regenerate', requireMemberAuth, async (req, res) => {
  try {
    const apiKey = await regeneratePrimaryApiKey(req.member.id);
    res.json({ status: true, message: 'API key baru berhasil dibuat.', data: { api_key: apiKey } });
  } catch (err) {
    res.status(400).json({ status: false, message: err.message });
  }
});

router.post('/packages/:id/purchase', requireMemberAuth, async (req, res) => {
  res.status(410).json({ status: false, message: 'Fitur package sudah dinonaktifkan. Gunakan saldo langsung.' });
});

router.get('/deposit/methods', requireMemberAuth, async (req, res) => {
  try {
    const methods = await getMergedDepositMethods();
    res.json({ status: true, data: methods.filter((item) => item.enabled) });
  } catch (err) {
    console.error('[MEMBER][DEPOSIT_METHODS] Error:', err);
    res.status(400).json({ status: false, message: 'Gagal memuat metode pembayaran.' });
  }
});

router.post('/deposit', requireMemberAuth, async (req, res) => {
  try {
    const response = await createMemberTopup(req.member.id, req.body.amount, req.body.method_code);
    res.json({ status: true, data: response.data, raw: response });
  } catch (err) {
    res.status(400).json({ status: false, message: err.message });
  }
});

router.post('/deposit/:invoice/check', requireMemberAuth, async (req, res) => {
  try {
    const response = await syncMemberTopupStatus(req.member.id, req.params.invoice);
    res.json({ status: true, data: response.data, raw: response });
  } catch (err) {
    res.status(400).json({ status: false, message: err.message });
  }
});

router.get('/deposit/:invoice/qr', requireMemberAuth, async (req, res) => {
  try {
    const payload = await getMemberTopupQrString(req.member.id, req.params.invoice);
    const png = await QRCode.toBuffer(payload.qr_string, {
      type: 'png',
      width: 360,
      margin: 1,
      errorCorrectionLevel: 'M'
    });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'private, max-age=30');
    res.send(png);
  } catch (err) {
    res.status(404).json({ status: false, message: err.message });
  }
});

module.exports = router;
