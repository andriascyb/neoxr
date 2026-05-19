const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORE_DIR = path.join(__dirname, '..', 'tmp', 'ai_media');
const META_PATH = path.join(STORE_DIR, 'index.json');

function ensureStore() {
  try { fs.mkdirSync(STORE_DIR, { recursive: true }); } catch (_) { }
}

function readMeta() {
  ensureStore();
  try {
    if (!fs.existsSync(META_PATH)) return {};
    const raw = fs.readFileSync(META_PATH, 'utf8');
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_) {
    return {};
  }
}

function writeMeta(meta) {
  ensureStore();
  try {
    fs.writeFileSync(META_PATH, JSON.stringify(meta || {}, null, 2), 'utf8');
  } catch (_) { }
}

function extFromMime(mime) {
  const m = String(mime || '').toLowerCase();
  if (m.includes('png')) return '.png';
  if (m.includes('jpeg') || m.includes('jpg')) return '.jpg';
  if (m.includes('webp')) return '.webp';
  if (m.includes('gif')) return '.gif';
  return '.bin';
}

function parseCode(raw) {
  return String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 80);
}

function cleanupExpired(nowMs = Date.now()) {
  const meta = readMeta();
  let changed = false;
  Object.keys(meta).forEach((code) => {
    const row = meta[code] || {};
    const exp = Number(row.expires_at || 0);
    if (!exp || exp <= nowMs) {
      const fp = row.path ? path.join(STORE_DIR, String(row.path)) : '';
      if (fp) {
        try { fs.rmSync(fp, { force: true }); } catch (_) { }
      }
      delete meta[code];
      changed = true;
    }
  });
  if (changed) writeMeta(meta);
}

async function saveFromRemote(options = {}) {
  const remoteUrl = String(options.remoteUrl || '').trim();
  const ttlHoursRaw = Number(options.ttlHours || 12);
  const ttlHours = Number.isFinite(ttlHoursRaw) ? Math.max(1, Math.min(168, ttlHoursRaw)) : 12;
  const preferredCode = parseCode(options.code || '');
  if (!remoteUrl) throw new Error('remoteUrl is required');
  let parsed;
  try { parsed = new URL(remoteUrl); } catch (_) { parsed = null; }
  if (!parsed || !/^https?:$/i.test(parsed.protocol)) throw new Error('invalid remoteUrl');

  ensureStore();
  cleanupExpired();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);
  const r = await fetch(parsed.toString(), { signal: controller.signal });
  clearTimeout(timeoutId);
  if (!r.ok) throw new Error(`source fetch failed: ${r.status}`);

  const mime = String(r.headers.get('content-type') || 'application/octet-stream').split(';')[0].trim();
  const arr = await r.arrayBuffer();
  const buf = Buffer.from(arr);
  const code = preferredCode || crypto.randomBytes(6).toString('base64url').slice(0, 8);
  const ext = extFromMime(mime);
  const fileName = `${code}${ext}`;
  const filePath = path.join(STORE_DIR, fileName);
  fs.writeFileSync(filePath, buf);

  const meta = readMeta();
  const now = Date.now();
  const expiresAt = now + (ttlHours * 60 * 60 * 1000);
  meta[code] = {
    code,
    path: fileName,
    mime,
    bytes: buf.length,
    created_at: now,
    expires_at: expiresAt
  };
  writeMeta(meta);
  return { code, mime, bytes: buf.length, expires_at: expiresAt, filePath, fileName };
}

function getByCode(code) {
  const cleanCode = parseCode(code);
  if (!cleanCode) return null;
  cleanupExpired();
  const meta = readMeta();
  const row = meta[cleanCode];
  if (!row) return null;
  const fp = path.join(STORE_DIR, String(row.path || ''));
  if (!fs.existsSync(fp)) {
    delete meta[cleanCode];
    writeMeta(meta);
    return null;
  }
  return {
    code: cleanCode,
    filePath: fp,
    mime: String(row.mime || 'application/octet-stream'),
    bytes: Number(row.bytes || 0),
    expires_at: Number(row.expires_at || 0),
    created_at: Number(row.created_at || 0)
  };
}

module.exports = {
  cleanupExpired,
  saveFromRemote,
  getByCode
};

