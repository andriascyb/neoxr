const cfg = require('./config');

function getH2HAuthParams() {
  return {
    memberID: String(cfg.appConfig.h2h_member_id || '').trim(),
    pin: String(cfg.appConfig.h2h_pin || '').trim(),
    password: String(cfg.appConfig.h2h_password || '').trim()
  };
}

function ensureH2HConfigured() {
  const auth = getH2HAuthParams();
  if (!auth.memberID || !auth.pin || !auth.password) {
    throw new Error('Konfigurasi H2H belum lengkap.');
  }
  return auth;
}

async function requestH2H(pathname, extraParams = {}) {
  const auth = ensureH2HConfigured();
  const baseUrl = String(cfg.appConfig.h2h_base_url || 'https://api.h2h.id/api/trx').replace(/\/+$/, '');
  const query = new URLSearchParams({ ...auth, ...extraParams });
  const url = `${baseUrl}${pathname}?${query.toString()}`;
  const response = await fetch(url);
  const data = await response.json();
  if (!data || data.status !== true) {
    throw new Error((data && data.message) || 'H2H request gagal.');
  }
  return data;
}

function getStoredPaymentMethodOverrides() {
  const raw = cfg.appConfig.payment_method_overrides;
  if (!raw || typeof raw !== 'object') return {};
  const normalized = {};
  Object.keys(raw).forEach((key) => {
    const k = String(key || '').trim().toLowerCase();
    if (!k) return;
    normalized[k] = raw[key] || {};
  });
  return normalized;
}

async function loadPaymentMethodOverridesFromDB() {
  try {
    const [rows] = await cfg.dbPool.query(
      `SELECT method_code, enabled, label, icon_url, sort_order
       FROM payment_method_settings`
    );
    if (!Array.isArray(rows) || rows.length === 0) return {};
    const overrides = {};
    rows.forEach((row) => {
      const code = String(row.method_code || '').trim().toLowerCase();
      if (!code) return;
      overrides[code] = {
        enabled: isMethodEnabled(row.enabled),
        label: row.label || '',
        icon_url: row.icon_url || '',
        sort_order: Number(row.sort_order || 0)
      };
    });
    return overrides;
  } catch (err) {
    if (err && (err.code === 'ER_NO_SUCH_TABLE' || String(err.errno) === '1146')) {
      return {};
    }
    throw err;
  }
}

function isMethodEnabled(value) {
  if (value === false || value === 0 || value === '0') return false;
  const raw = String(value == null ? '' : value).trim().toLowerCase();
  if (!raw) return true;
  if (raw === 'false' || raw === 'off' || raw === 'no') return false;
  return true;
}

function normalizeMethod(method, overrides = {}) {
  const rawCode = String(method.code || method.payment_method || '').trim();
  const code = rawCode.toLowerCase();
  const custom = overrides[code] || {};
  return {
    code,
    provider_code: rawCode,
    name: custom.label || method.name || method.payment_method_name || code,
    original_name: method.name || method.payment_method_name || code,
    type: method.type || method.payment_type || '',
    fee_type: method.fee_type || '',
    fee_amount: Number(method.fee_amount || method.fee || 0),
    min_amount: Number(method.min_amount || 0),
    max_amount: Number(method.max_amount || 0),
    bank_account: method.bank_account || null,
    enabled: isMethodEnabled(custom.enabled),
    icon_url: custom.icon_url || '',
    sort_order: Number(custom.sort_order || 0)
  };
}

async function fetchDepositMethods() {
  const response = await requestH2H('/deposit/methods');
  return Array.isArray(response?.data?.methods) ? response.data.methods : [];
}

async function getMergedDepositMethods() {
  const methods = await fetchDepositMethods();
  const dbOverrides = await loadPaymentMethodOverridesFromDB();
  const fallbackOverrides = getStoredPaymentMethodOverrides();
  const overrides = Object.keys(dbOverrides).length ? dbOverrides : fallbackOverrides;
  return methods
    .map((method) => normalizeMethod(method, overrides))
    .sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.name.localeCompare(b.name, 'id');
    });
}

async function savePaymentMethodOverrides(methods) {
  const next = {};
  (methods || []).forEach((method) => {
    const code = String(method.code || '').trim().toLowerCase();
    if (!code) return;
    next[code] = {
      enabled: isMethodEnabled(method.enabled),
      icon_url: String(method.icon_url || '').trim(),
      label: String(method.label || method.name || '').trim(),
      sort_order: Number(method.sort_order || 0)
    };
  });

  const conn = await cfg.dbPool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM payment_method_settings');
    const entries = Object.entries(next);
    for (const [methodCode, data] of entries) {
      await conn.query(
        `INSERT INTO payment_method_settings (method_code, enabled, label, icon_url, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        [
          methodCode,
          data.enabled ? 1 : 0,
          data.label || null,
          data.icon_url || null,
          Number(data.sort_order || 0)
        ]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // Keep legacy config fallback in sync for compatibility.
  cfg.appConfig.payment_method_overrides = next;
  return next;
}

async function createDeposit(amount, methodCode) {
  return requestH2H('/deposit', {
    amount: String(Math.floor(Number(amount || 0))),
    method: String(methodCode || '').trim()
  });
}

async function checkDepositStatus(invoice) {
  return requestH2H('/deposit/status', {
    invoice: String(invoice || '').trim()
  });
}

module.exports = {
  ensureH2HConfigured,
  fetchDepositMethods,
  getMergedDepositMethods,
  savePaymentMethodOverrides,
  createDeposit,
  checkDepositStatus
};
