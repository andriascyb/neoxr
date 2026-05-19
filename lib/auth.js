/**
 * lib/auth.js
 * Authentication middleware, billing (deductBalance, incrementHitOnly)
 */

const NodeCache = require('node-cache');
const cfg = require('./config');
const { getLocalDate } = require('./stats');

const apiKeyCache = new NodeCache({ stdTTL: 600 });
const settingsCache = new NodeCache({ stdTTL: 600 });
const trial429Cache = new NodeCache({ stdTTL: 60 });
const serviceCooldownCache = new NodeCache({ stdTTL: 86400 });
const serviceCooldownLocks = new Map();

function parsePackageFeatures(rawFeatures) {
  return String(rawFeatures || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function isPackageFeatureAllowed(type, rawFeatures) {
  const normalizedType = String(type || '').trim().toLowerCase();
  const features = parsePackageFeatures(rawFeatures);
  if (!normalizedType) return true;
  if (features.length === 0) return true;
  return features.includes(normalizedType);
}

async function authenticateRequest(req, res, next) {
  // Bypass for docs, bank-codes, or status check
  const isDocsRequest = req.method === 'GET' && req.path === '/' && !req.query.type && !req.query.accountNumber && !req.query.nik && !req.query.nomor;
  if (isDocsRequest || 
      (req.method === 'GET' && req.path === '/api/v3/bank-codes') ||
      (req.query.check_status === '1')
  ) {
    return next();
  }

  const params = req.method === 'POST' ? req.body : req.query;
  const apikey = params.api_key || params.apikey;
  const type = String(params.type || 'bank').trim().toLowerCase();

  if (!apikey) {
    try {
      const today = getLocalDate();
      const forwarded = req.headers['x-forwarded-for'];
      const ip = (forwarded ? String(forwarded).split(',')[0].trim() : (req.ip || '127.0.0.1'));
      const cacheKey = `trial429_${today}_${ip}`;
      const cached429 = trial429Cache.get(cacheKey);
      if (cached429) {
        return res.status(429).json({ ...cached429, cached: true });
      }
      const [rows] = await cfg.dbPool.query(
        "SELECT COUNT(*) as hit_count FROM api_logs WHERE ip_address = ? AND api_key = 'PUBLIC_TRIAL' AND DATE(created_at) = ?",
        [ip, today]
      );

      const hitCount = rows[0].hit_count;
      if (hitCount >= 10) {
        const resp = {
          status: false,
          message: `Limit harian percobaan gratis tercapai (${hitCount}/10). Silakan upgrade ke Premium untuk akses tanpa batas!`,
          trial_limit_reached: true
        };
        trial429Cache.set(cacheKey, resp);
        return res.status(429).json(resp);
      }

      req.user = {
        name: 'Public Trial',
        api_key: 'PUBLIC_TRIAL',
        billing_type: 'trial',
        trial_info: { current: hitCount, limit: 10 }
      };
      return next();
    } catch (err) {
      console.error('[AUTH-TRIAL] Error:', err);
      return res.status(500).json({ status: false, message: 'Server error during trial validation.' });
    }
  }

  let user = apiKeyCache.get(apikey);
  if (!user) {
    try {
      const [rows] = await cfg.dbPool.query(`
        SELECT u.*, p.name as package_name, p.max_requests_per_day, p.features as package_features
        FROM api_keys u 
        LEFT JOIN packages p ON u.package_id = p.package_id 
        WHERE u.api_key = ? AND u.is_active = 1
      `, [apikey]);
      if (rows.length === 0) {
        return res.status(401).json({ status: false, message: 'API Key tidak valid atau tidak aktif.' });
      }
      user = rows[0];

      // Auto-Pause for Balance Users (Inactivity > 28 days)
      if (user.billing_type === 'balance' && user.is_active === 1 && user.last_used) {
        const lastUsedDate = new Date(user.last_used);
        const diffDays = (new Date() - lastUsedDate) / (1000 * 3600 * 24);
        if (diffDays >= 28) {
          try {
            await cfg.dbPool.query("UPDATE api_keys SET is_active = 0 WHERE id = ?", [user.id]);
            return res.status(401).json({ status: false, message: 'Akun dinonaktifkan otomatis karena tidak ada aktivitas selama 28 hari.' });
          } catch (e) { console.error('[AUTH] Auto-pause error:', e); }
        }
      }

      // Saldo-only mode: expiry/package tidak dipakai untuk blokir akses.
      apiKeyCache.set(apikey, user);
    } catch (err) {
      console.error('[MYSQL] Auth Error:', err);
      return res.status(500).json({ status: false, message: 'Kesalahan server saat validasi apikey.' });
    }
  }

  // Cooldown per layanan (per API key flow). Tetap mode silent sleep.
  const perServiceRaw = cfg.appConfig[`cooldown_${type}`];
  const perServiceCooldown = Number.isFinite(Number(perServiceRaw))
    ? Math.max(0, parseInt(perServiceRaw, 10))
    : 0;
  const globalCooldown = Number.isFinite(Number(cfg.appConfig.api_cooldown_seconds))
    ? Math.max(0, parseInt(cfg.appConfig.api_cooldown_seconds, 10))
    : 0;
  const cooldownSeconds = perServiceCooldown > 0 ? perServiceCooldown : globalCooldown;

  if (cooldownSeconds > 0 && apikey) {
    const cooldownKey = `svc_cd:${apikey}:${type}`;
    const previous = serviceCooldownLocks.get(cooldownKey) || Promise.resolve();
    const current = previous
      .catch(() => {})
      .then(async () => {
        const nowMs = Date.now();
        const lastMs = Number(serviceCooldownCache.get(cooldownKey) || 0);
        if (lastMs > 0) {
          const elapsedMs = nowMs - lastMs;
          const minIntervalMs = cooldownSeconds * 1000;
          if (elapsedMs < minIntervalMs) {
            const waitMs = minIntervalMs - elapsedMs;
            await new Promise(resolve => setTimeout(resolve, waitMs));
          }
        }
        serviceCooldownCache.set(cooldownKey, Date.now(), Math.max(cooldownSeconds * 2, 60));
      });
    serviceCooldownLocks.set(cooldownKey, current);
    try {
      await current;
    } finally {
      if (serviceCooldownLocks.get(cooldownKey) === current) {
        serviceCooldownLocks.delete(cooldownKey);
      }
    }
  }

  // Billing Logic
  const defaultCosts = { bank: 150, ewallet: 150, whatsapp: 50, nik: 250, games: 100, bpjs: 100, pln: 100, ai: 0 };
  let costType = 'cost_' + (type || 'bank');
  let cost = settingsCache.get(costType);
  if (cost === undefined) {
    try {
      const [sRows] = await cfg.dbPool.query("SELECT setting_value FROM api_settings WHERE setting_key = ?", [costType]);
      cost = sRows.length > 0 ? parseFloat(sRows[0].setting_value) : (defaultCosts[type] || 0);
      settingsCache.set(costType, cost);
    } catch (err) { cost = defaultCosts[type] || 0; }
  }

  const balance = parseFloat(user.balance || 0);
  if (balance < cost) {
    return res.status(402).json({
      status: false,
      message: 'Saldo tidak mencukupi.',
      current_balance: user.balance,
      required_cost: cost
    });
  }

  req.user = { ...user, api_key: user.api_key || user.apikey };
  req.cost = cost;
  next();
}

async function deductBalance(apikey, amount, desc) {
  if (amount <= 0) return { ok: true, skipped: true };
  try {
    const [result] = await cfg.dbPool.query(
      "UPDATE api_keys SET balance = balance - ?, total_hits = total_hits + 1, last_used = NOW() WHERE api_key = ? AND balance >= ?",
      [amount, apikey, amount]
    );
    if (!result || result.affectedRows === 0) {
      apiKeyCache.del(apikey);
      const [rows] = await cfg.dbPool.query("SELECT balance FROM api_keys WHERE api_key = ? LIMIT 1", [apikey]);
      return {
        ok: false,
        reason: 'INSUFFICIENT_BALANCE',
        balance: rows && rows[0] ? Number(rows[0].balance || 0) : 0
      };
    }
    await cfg.dbPool.query(
      "INSERT INTO balance_logs (api_key, amount, description, current_balance) SELECT api_key, ?, ?, balance FROM api_keys WHERE api_key = ?",
      [-amount, desc, apikey]
    );
    apiKeyCache.del(apikey);
    return { ok: true, deducted_amount: Number(amount) };
  } catch (err) {
    console.error('[MYSQL] Balance Deduction Error:', err);
    return { ok: false, reason: 'DEDUCTION_ERROR', error: err };
  }
}

async function incrementHitOnly(apikey) {
  try {
    await cfg.dbPool.query("UPDATE api_keys SET total_hits = total_hits + 1, last_used = NOW() WHERE api_key = ?", [apikey]);
  } catch (err) { }
}

function addChargedAmount(req, amount) {
  const n = Number(amount || 0);
  if (!req || !Number.isFinite(n) || n <= 0) return;
  req.__charged_amount = Number((Number(req.__charged_amount || 0) + n).toFixed(2));
}

async function applyInvalidPenaltyIfNeeded(req, serviceType, baseCost) {
  const normalizedType = String(serviceType || '').trim().toLowerCase();
  const apikey = req && req.user && req.user.api_key ? String(req.user.api_key) : '';
  const limit = Math.max(1, parseInt(cfg.appConfig.invalid_quota_24h, 10) || 500);
  const percent = Math.max(0, Math.min(100, parseFloat(cfg.appConfig.invalid_penalty_percent) || 50));
  const unitCost = Number(baseCost || 0);

  const meta = {
    invalid_24h_count: 0,
    invalid_24h_limit: limit,
    penalty_percent: percent,
    penalty_applied: false,
    penalty_amount: 0,
    penalty_reason: 'threshold_not_reached'
  };

  if (!apikey || apikey === 'PUBLIC_TRIAL' || !normalizedType || unitCost <= 0 || percent <= 0) {
    return meta;
  }

  try {
    const [rows] = await cfg.dbPool.query(
      `SELECT COUNT(*) AS cnt
       FROM api_logs
       WHERE api_key = ? AND log_type = ? AND is_success = 0
         AND created_at >= (NOW() - INTERVAL 24 HOUR)`,
      [apikey, normalizedType]
    );
    const currentCount = Number(rows && rows[0] ? rows[0].cnt : 0);
    const projectedCount = currentCount + 1; // include current failed request
    meta.invalid_24h_count = projectedCount;
    if (projectedCount <= limit) return meta;

    const penaltyAmount = Number((unitCost * (percent / 100)).toFixed(2));
    meta.penalty_amount = penaltyAmount;
    if (penaltyAmount <= 0) {
      meta.penalty_reason = 'penalty_zero';
      return meta;
    }

    const deduction = await deductBalance(
      apikey,
      penaltyAmount,
      `Penalty invalid 24h ${normalizedType} (count=${projectedCount}, limit=${limit}, percent=${percent}%)`
    );
    if (deduction && deduction.ok === true) {
      addChargedAmount(req, penaltyAmount);
      meta.penalty_applied = true;
      meta.penalty_reason = 'applied';
      return meta;
    }
    meta.penalty_reason = (deduction && deduction.reason === 'INSUFFICIENT_BALANCE')
      ? 'insufficient_balance'
      : 'deduction_error';
    return meta;
  } catch (err) {
    meta.penalty_reason = 'penalty_check_error';
    return meta;
  }
}

module.exports = {
  apiKeyCache,
  settingsCache,
  trial429Cache,
  serviceCooldownCache,
  parsePackageFeatures,
  isPackageFeatureAllowed,
  authenticateRequest,
  deductBalance,
  incrementHitOnly,
  applyInvalidPenaltyIfNeeded,
  addChargedAmount
};
