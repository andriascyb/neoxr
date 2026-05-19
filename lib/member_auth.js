const crypto = require('crypto');
const cfg = require('./config');

const MEMBER_SESSION_COOKIE = 'member_session';
const MEMBER_SESSION_TTL_DAYS = 30;

function normalizeWhatsAppNumber(input) {
  const digits = String(input || '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  return '62' + digits;
}

function validatePin(pin) {
  return /^[0-9]{6}$/.test(String(pin || ''));
}

function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(pin), salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

function verifyPin(pin, storedHash) {
  const raw = String(storedHash || '');
  const parts = raw.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, expected] = parts;
  const actual = crypto.scryptSync(String(pin), salt, 64).toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
  } catch (err) {
    return false;
  }
}

function createSessionToken() {
  return crypto.randomBytes(48).toString('hex');
}

function parseCookies(req) {
  const raw = String((req && req.headers && req.headers.cookie) || '');
  return raw.split(';').reduce((acc, item) => {
    const idx = item.indexOf('=');
    if (idx === -1) return acc;
    const key = item.slice(0, idx).trim();
    const val = item.slice(idx + 1).trim();
    if (key) acc[key] = decodeURIComponent(val);
    return acc;
  }, {});
}

function getSessionTokenFromRequest(req) {
  const cookies = parseCookies(req);
  return cookies[MEMBER_SESSION_COOKIE] || req.headers['x-member-session'] || '';
}

function shouldUseSecureCookie(req) {
  const forceSecure = String(process.env.FORCE_SECURE_COOKIE || '').trim() === '1';
  if (forceSecure) return true;
  if (!req) return false;
  const proto = String((req.headers && req.headers['x-forwarded-proto']) || '').toLowerCase();
  if (proto.includes('https')) return true;
  return !!req.secure;
}

function buildSessionCookie(token, req) {
  const maxAge = MEMBER_SESSION_TTL_DAYS * 24 * 60 * 60;
  const securePart = shouldUseSecureCookie(req) ? '; Secure' : '';
  return `${MEMBER_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax${securePart}; Max-Age=${maxAge}`;
}

function buildClearSessionCookie(req) {
  const securePart = shouldUseSecureCookie(req) ? '; Secure' : '';
  return `${MEMBER_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax${securePart}; Max-Age=0`;
}

function getClientIp(req) {
  const forwarded = req && req.headers ? req.headers['x-forwarded-for'] : '';
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return (req && (req.ip || req.socket?.remoteAddress)) || '127.0.0.1';
}

async function requireMemberAuth(req, res, next) {
  try {
    const token = getSessionTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ status: false, message: 'Member session tidak ditemukan.' });
    }
    const [rows] = await cfg.dbPool.query(`
      SELECT s.id as session_id, s.session_token, s.expires_at, m.*
      FROM member_sessions s
      INNER JOIN member_accounts m ON m.id = s.member_id
      WHERE s.session_token = ? AND s.expires_at > NOW() AND m.is_active = 1
      LIMIT 1
    `, [token]);
    if (!rows || rows.length === 0) {
      return res.status(401).json({ status: false, message: 'Session member tidak valid atau sudah habis.' });
    }
    req.member = rows[0];
    req.memberSessionToken = token;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  MEMBER_SESSION_COOKIE,
  MEMBER_SESSION_TTL_DAYS,
  normalizeWhatsAppNumber,
  validatePin,
  hashPin,
  verifyPin,
  createSessionToken,
  parseCookies,
  getSessionTokenFromRequest,
  buildSessionCookie,
  buildClearSessionCookie,
  getClientIp,
  requireMemberAuth
};
