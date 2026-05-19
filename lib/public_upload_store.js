const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORE_DIR = path.join(__dirname, '..', 'tmp', 'public_uploads');
const TTL_MS = 30 * 1000;
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png']);
const index = new Map();

function ensureDir() {
  try { fs.mkdirSync(STORE_DIR, { recursive: true }); } catch (_) {}
}

function cleanupExpired() {
  const now = Date.now();
  for (const [token, row] of index.entries()) {
    if (!row || Number(row.expires_at || 0) <= now) {
      try { if (row && row.path) fs.rmSync(row.path, { force: true }); } catch (_) {}
      index.delete(token);
    }
  }
}

function extByMime(mime) {
  const m = String(mime || '').toLowerCase();
  if (m === 'image/png') return '.png';
  return '.jpg';
}

function sanitizeBase64(raw) {
  return String(raw || '').trim().replace(/^data:[^;]+;base64,/i, '');
}

function saveBase64Image({ mime, base64, originalName = '' }) {
  cleanupExpired();
  ensureDir();
  const cleanMime = String(mime || '').toLowerCase();
  if (!ALLOWED_MIME.has(cleanMime)) throw new Error('INVALID_MIME');
  const payload = sanitizeBase64(base64);
  const buf = Buffer.from(payload, 'base64');
  if (!buf || !buf.length) throw new Error('EMPTY_FILE');
  if (buf.length > MAX_BYTES) throw new Error('FILE_TOO_LARGE');
  const token = crypto.randomBytes(9).toString('base64url');
  const ext = extByMime(cleanMime);
  const fileName = `${token}${ext}`;
  const filePath = path.join(STORE_DIR, fileName);
  fs.writeFileSync(filePath, buf);
  const row = {
    token,
    path: filePath,
    mime: cleanMime,
    bytes: buf.length,
    original_name: String(originalName || '').slice(0, 200),
    created_at: Date.now(),
    expires_at: Date.now() + TTL_MS
  };
  index.set(token, row);
  return { ...row, ttl_ms: TTL_MS };
}

function getByToken(token) {
  cleanupExpired();
  const key = String(token || '').trim();
  if (!key) return null;
  const row = index.get(key);
  if (!row) return null;
  if (!fs.existsSync(row.path)) {
    index.delete(key);
    return null;
  }
  return row;
}

module.exports = {
  TTL_MS,
  MAX_BYTES,
  ALLOWED_MIME,
  saveBase64Image,
  getByToken
};
