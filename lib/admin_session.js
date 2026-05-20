/**
 * lib/admin_session.js
 * Single source of truth untuk admin session HMAC token.
 *
 * Format token: v1.<timestamp_ms>.<nonce_hex>.<hmac_sha256_hex>
 * - Signed dengan ADMIN_SESSION_SECRET (env) atau cfg.ADMIN_KEY sebagai fallback.
 * - TTL default: 12 jam, drift toleran 5 menit.
 *
 * Diakses dari:
 *   - server.js (cookie/header shim middleware)
 *   - routes/admin.js (login/logout/render gating)
 */

const crypto = require('crypto');
const cfg = require('./config');

const ADMIN_SESSION_TTL_SEC = 60 * 60 * 12;
const ADMIN_SESSION_TTL_MS = ADMIN_SESSION_TTL_SEC * 1000;
const ADMIN_SESSION_DRIFT_MS = 5 * 60 * 1000; // 5 menit toleransi clock skew
const ADMIN_SESSION_COOKIE = 'admin_session';
const ADMIN_LEGACY_COOKIE = 'admin_key';

function getAdminSessionSecret() {
  const raw = String(process.env.ADMIN_SESSION_SECRET || cfg.ADMIN_KEY || 'admin_session_secret').trim();
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function createAdminSessionToken() {
  const ts = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');
  const sig = crypto
    .createHmac('sha256', getAdminSessionSecret())
    .update(`${ts}.${nonce}`)
    .digest('hex');
  return `v1.${ts}.${nonce}.${sig}`;
}

function verifyAdminSessionToken(token) {
  const parts = String(token || '').trim().split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') return false;
  const ts = Number(parts[1]);
  const nonce = parts[2];
  const sig = parts[3];
  if (!Number.isFinite(ts) || !nonce || !sig) return false;
  if ((Date.now() - ts) > ADMIN_SESSION_TTL_MS || ts > (Date.now() + ADMIN_SESSION_DRIFT_MS)) return false;
  const expected = crypto
    .createHmac('sha256', getAdminSessionSecret())
    .update(`${ts}.${nonce}`)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch (e) {
    return false;
  }
}

function safeCompare(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  if (x.length !== y.length) return false;
  try {
    return crypto.timingSafeEqual(x, y);
  } catch (e) {
    return false;
  }
}

function readCookieValue(cookieHeader, name) {
  const src = String(cookieHeader || '');
  if (!src) return '';
  const wanted = `${name}=`;
  const parts = src.split(';');
  for (const part of parts) {
    const item = part.trim();
    if (item.startsWith(wanted)) {
      try {
        return decodeURIComponent(item.slice(wanted.length));
      } catch (e) {
        return item.slice(wanted.length);
      }
    }
  }
  return '';
}

function isSecureRequest(req) {
  if (!req) return false;
  if (req.secure) return true;
  const proto = String((req.headers && req.headers['x-forwarded-proto']) || '').split(',')[0].trim();
  return proto === 'https';
}

function buildSessionCookieAttrs(req) {
  const sessionToken = createAdminSessionToken();
  const attrs = [
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(sessionToken)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${ADMIN_SESSION_TTL_SEC}`
  ];
  if (isSecureRequest(req)) attrs.push('Secure');
  return attrs.join('; ');
}

function buildLegacyClearCookieAttrs(req) {
  const attrs = [
    `${ADMIN_LEGACY_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0'
  ];
  if (isSecureRequest(req)) attrs.push('Secure');
  return attrs.join('; ');
}

function buildClearSessionCookieAttrs(req) {
  const sessionAttrs = [
    `${ADMIN_SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0'
  ];
  if (isSecureRequest(req)) sessionAttrs.push('Secure');
  return sessionAttrs.join('; ');
}

function setAdminCookie(req, res) {
  res.setHeader('Set-Cookie', [
    buildSessionCookieAttrs(req),
    buildLegacyClearCookieAttrs(req)
  ]);
}

function clearAdminCookie(req, res) {
  res.setHeader('Set-Cookie', [
    buildClearSessionCookieAttrs(req),
    buildLegacyClearCookieAttrs(req)
  ]);
}

function getCookie(req, name) {
  return readCookieValue(req && req.headers ? req.headers.cookie : '', name);
}

module.exports = {
  ADMIN_SESSION_COOKIE,
  ADMIN_LEGACY_COOKIE,
  ADMIN_SESSION_TTL_SEC,
  ADMIN_SESSION_TTL_MS,
  getAdminSessionSecret,
  createAdminSessionToken,
  verifyAdminSessionToken,
  safeCompare,
  readCookieValue,
  getCookie,
  setAdminCookie,
  clearAdminCookie,
  isSecureRequest
};
