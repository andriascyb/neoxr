const crypto = require('crypto');
const cfg = require('./config');
const {
  normalizeWhatsAppNumber,
  validatePin,
  hashPin,
  verifyPin,
  createSessionToken,
  getClientIp,
  MEMBER_SESSION_TTL_DAYS
} = require('./member_auth');
const { createDeposit, checkDepositStatus, getMergedDepositMethods } = require('./h2h_deposit');

function getRegistrationStatus() {
  const enabled = Number(cfg.appConfig.member_register_enabled || 0) === 1;
  const reopenAtRaw = String(cfg.appConfig.member_register_reopen_at || '').trim();
  const reopenAt = reopenAtRaw ? new Date(reopenAtRaw) : null;
  const now = new Date();
  const hasValidReopenAt = !!(reopenAt && !Number.isNaN(reopenAt.getTime()));

  if (enabled) {
    return { enabled: true, closed: false, reopen_at: null, seconds_left: 0 };
  }

  if (hasValidReopenAt && reopenAt.getTime() > now.getTime()) {
    return {
      enabled: false,
      closed: true,
      reopen_at: reopenAt.toISOString(),
      seconds_left: Math.max(1, Math.ceil((reopenAt.getTime() - now.getTime()) / 1000))
    };
  }

  if (hasValidReopenAt && reopenAt.getTime() <= now.getTime()) {
    return { enabled: true, closed: false, reopen_at: null, seconds_left: 0 };
  }

  return { enabled: false, closed: true, reopen_at: null, seconds_left: 0 };
}

async function expireStalePendingTopups(memberId, conn = cfg.dbPool) {
  await conn.query(
    `UPDATE member_topups
     SET status = 'expired', updated_at = NOW()
     WHERE member_id = ?
       AND LOWER(status) = 'pending'
       AND expired_at IS NOT NULL
       AND expired_at <= NOW()`,
    [memberId]
  );
}

function generateApiKey() {
  return `ckr_${crypto.randomUUID().replace(/-/g, '')}`;
}

function generateMemberInvoice(prefix) {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}${datePart}${rand}`;
}

async function createApiKeyForMember(conn, member, options = {}) {
  const apiKey = generateApiKey();
  const initialBalance = Number(options.balance || 0);
  const billingType = 'balance';
  const packageId = null;
  const expiry = null;
  const isActive = options.is_active === 0 ? 0 : 1;
  const [result] = await conn.query(
    `INSERT INTO api_keys (api_key, name, whatsapp_number, balance, billing_type, package_id, is_active, expiry, created_at, last_used)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [apiKey, member.name, member.whatsapp_number, initialBalance, billingType, packageId, isActive, expiry]
  );
  await conn.query(
    'UPDATE member_api_keys SET is_primary = 0 WHERE member_id = ? AND revoked_at IS NULL',
    [member.id]
  );
  await conn.query(
    'INSERT INTO member_api_keys (member_id, api_key_id, is_primary) VALUES (?, ?, 1)',
    [member.id, result.insertId]
  );
  return { id: result.insertId, api_key: apiKey };
}

async function registerMember(payload) {
  const regStatus = getRegistrationStatus();
  if (regStatus.closed) {
    if (regStatus.reopen_at) {
      throw new Error('Pendaftaran member ditutup sementara. Silakan tunggu hingga jadwal dibuka kembali.');
    }
    throw new Error('Pendaftaran member sedang ditutup oleh admin.');
  }

  const name = String(payload.name || '').trim();
  const whatsappNumber = normalizeWhatsAppNumber(payload.whatsapp_number || payload.whatsapp || '');
  const pin = String(payload.pin || '');
  const registrationIp = getClientIp(payload.req || payload.__req || {});

  if (!name) throw new Error('Nama wajib diisi.');
  if (!whatsappNumber || whatsappNumber.length < 10) throw new Error('Nomor WhatsApp tidak valid.');
  if (!validatePin(pin)) throw new Error('PIN harus 6 digit angka.');

  const bonus = Number(cfg.appConfig.member_register_bonus || 50);
  const conn = await cfg.dbPool.getConnection();
  try {
    await conn.beginTransaction();
    const [existing] = await conn.query('SELECT id FROM member_accounts WHERE whatsapp_number = ? LIMIT 1', [whatsappNumber]);
    if (existing.length > 0) {
      throw new Error('Nomor WhatsApp sudah terdaftar.');
    }
    const [result] = await conn.query(
      `INSERT INTO member_accounts
       (name, whatsapp_number, registration_ip, pin_hash, active_mode, wallet_balance, is_active, failed_pin_attempts, pin_locked_until, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'balance', ?, 1, 0, NULL, NOW(), NOW())`,
      [name, whatsappNumber, registrationIp, hashPin(pin), bonus]
    );
    const memberCode = `MBR${String(result.insertId).padStart(6, '0')}`;
    await conn.query(
      `UPDATE member_accounts SET member_code = ? WHERE id = ?`,
      [memberCode, result.insertId]
    );
    const member = { id: result.insertId, member_code: memberCode, name, whatsapp_number: whatsappNumber };
    await conn.query(
      `INSERT INTO member_wallet_transactions
       (member_id, type, amount, balance_before, balance_after, description, reference_type, reference_id, created_at)
       VALUES (?, 'bonus', ?, 0, ?, 'Bonus registrasi member', 'register_bonus', ?, NOW())`,
      [member.id, bonus, bonus, String(member.id)]
    );
    const apiKey = await createApiKeyForMember(conn, member);
    await conn.commit();
    return {
      member: {
        id: member.id,
        member_code: member.member_code,
        name,
        whatsapp_number: whatsappNumber,
        wallet_balance: bonus,
        active_mode: 'balance'
      },
      api_key: apiKey.api_key
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function loginMember(payload, req) {
  const whatsappNumber = normalizeWhatsAppNumber(payload.whatsapp_number || payload.whatsapp || '');
  const pin = String(payload.pin || '');
  if (!whatsappNumber) throw new Error('Nomor WhatsApp wajib diisi.');
  if (!validatePin(pin)) throw new Error('PIN harus 6 digit angka.');

  const [rows] = await cfg.dbPool.query(
    'SELECT * FROM member_accounts WHERE whatsapp_number = ? LIMIT 1',
    [whatsappNumber]
  );
  if (!rows || rows.length === 0) {
    throw new Error('Akun member tidak ditemukan.');
  }
  const member = rows[0];
  if (!member.is_active) {
    throw new Error('Akun member tidak aktif.');
  }
  if (member.pin_locked_until && new Date(member.pin_locked_until) > new Date()) {
    const lockedUntil = new Date(member.pin_locked_until);
    const remainingMinutes = Math.max(1, Math.ceil((lockedUntil.getTime() - Date.now()) / 60000));
    const err = new Error(`PIN terkunci. Coba lagi dalam ${remainingMinutes} menit.`);
    err.code = 'PIN_LOCKED';
    throw err;
  }
  if (!verifyPin(pin, member.pin_hash)) {
    const maxAttempts = Number(cfg.appConfig.member_pin_max_attempts || 5);
    const lockMinutes = Number(cfg.appConfig.member_pin_lock_minutes || 15);
    const nextAttempts = Number(member.failed_pin_attempts || 0) + 1;
    if (nextAttempts >= maxAttempts) {
      await cfg.dbPool.query(
        'UPDATE member_accounts SET failed_pin_attempts = 0, pin_locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?',
        [lockMinutes, member.id]
      );
      const err = new Error(`PIN terkunci karena ${maxAttempts}x percobaan gagal. Coba lagi dalam ${lockMinutes} menit.`);
      err.code = 'PIN_LOCKED';
      throw err;
    }
    await cfg.dbPool.query(
      'UPDATE member_accounts SET failed_pin_attempts = ? WHERE id = ?',
      [nextAttempts, member.id]
    );
    const left = maxAttempts - nextAttempts;
    const err = new Error(`PIN salah. Sisa percobaan: ${left}x.`);
    err.code = 'INVALID_PIN';
    throw err;
  }

  const token = createSessionToken();
  await cfg.dbPool.query(
    `INSERT INTO member_sessions (member_id, session_token, expires_at, ip_address, user_agent, created_at)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? DAY), ?, ?, NOW())`,
    [member.id, token, MEMBER_SESSION_TTL_DAYS, getClientIp(req), String(req.headers['user-agent'] || '').slice(0, 255)]
  );
  await cfg.dbPool.query(
    'UPDATE member_accounts SET failed_pin_attempts = 0, pin_locked_until = NULL, last_login_at = NOW() WHERE id = ?',
    [member.id]
  );
  return { token };
}

async function logoutMember(token) {
  if (!token) return;
  await cfg.dbPool.query('DELETE FROM member_sessions WHERE session_token = ?', [token]);
}

async function getMemberProfile(memberId) {
  const [rows] = await cfg.dbPool.query(
    `SELECT id, member_code, name, whatsapp_number, active_mode, wallet_balance, is_active, failed_pin_attempts, pin_locked_until, last_login_at, created_at
     FROM member_accounts WHERE id = ? LIMIT 1`,
    [memberId]
  );
  return rows[0] || null;
}

async function getPrimaryApiKey(memberId) {
  const [rows] = await cfg.dbPool.query(`
    SELECT mak.id as mapping_id, a.id as api_key_id, a.api_key, a.balance, a.billing_type, a.package_id, a.is_active, a.expiry,
           NULL as package_name
    FROM member_api_keys mak
    INNER JOIN api_keys a ON a.id = mak.api_key_id
    WHERE mak.member_id = ? AND mak.revoked_at IS NULL
    ORDER BY mak.is_primary DESC, mak.id DESC
    LIMIT 1
  `, [memberId]);
  return rows[0] || null;
}

async function getMemberDashboard(memberId) {
  await expireStalePendingTopups(memberId);
  const [memberRows] = await cfg.dbPool.query(
    `SELECT id, member_code, name, whatsapp_number, active_mode, wallet_balance, is_active, last_login_at, created_at
     FROM member_accounts WHERE id = ? LIMIT 1`,
    [memberId]
  );
  if (!memberRows || memberRows.length === 0) return null;
  const member = memberRows[0];
  const apiKey = await getPrimaryApiKey(memberId);
  let hitStats = {
    today: { total: 0, success: 0, failed: 0 },
    last7d: { total: 0, success: 0, failed: 0 },
    last30d: { total: 0, success: 0, failed: 0 },
    alltime: { total: 0, success: 0, failed: 0 }
  };
  let balanceConsumption = { today: 0, last7d: 0, last30d: 0, alltime: 0 };
  if (apiKey && apiKey.api_key) {
    const [hitRows] = await cfg.dbPool.query(
      `SELECT
         SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS today_total,
         SUM(CASE WHEN DATE(created_at) = CURDATE() AND is_success = 1 THEN 1 ELSE 0 END) AS today_success,
         SUM(CASE WHEN DATE(created_at) = CURDATE() AND is_success = 0 THEN 1 ELSE 0 END) AS today_failed,
         SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS last7d_total,
         SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND is_success = 1 THEN 1 ELSE 0 END) AS last7d_success,
         SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND is_success = 0 THEN 1 ELSE 0 END) AS last7d_failed,
         SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS last30d_total,
         SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND is_success = 1 THEN 1 ELSE 0 END) AS last30d_success,
         SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND is_success = 0 THEN 1 ELSE 0 END) AS last30d_failed,
         COUNT(*) AS alltime_total,
         SUM(CASE WHEN is_success = 1 THEN 1 ELSE 0 END) AS alltime_success,
         SUM(CASE WHEN is_success = 0 THEN 1 ELSE 0 END) AS alltime_failed
       FROM api_logs
       WHERE api_key = ?`,
      [apiKey.api_key]
    );
    const row = (hitRows && hitRows[0]) || {};
    hitStats = {
      today: {
        total: Number(row.today_total || 0),
        success: Number(row.today_success || 0),
        failed: Number(row.today_failed || 0)
      },
      last7d: {
        total: Number(row.last7d_total || 0),
        success: Number(row.last7d_success || 0),
        failed: Number(row.last7d_failed || 0)
      },
      last30d: {
        total: Number(row.last30d_total || 0),
        success: Number(row.last30d_success || 0),
        failed: Number(row.last30d_failed || 0)
      },
      alltime: {
        total: Number(row.alltime_total || 0),
        success: Number(row.alltime_success || 0),
        failed: Number(row.alltime_failed || 0)
      }
    };

    const [costRows] = await cfg.dbPool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() AND amount < 0 THEN -amount ELSE 0 END), 0) AS today,
         COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND amount < 0 THEN -amount ELSE 0 END), 0) AS last7d,
         COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND amount < 0 THEN -amount ELSE 0 END), 0) AS last30d,
         COALESCE(SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END), 0) AS alltime
       FROM balance_logs
       WHERE api_key = ?`,
      [apiKey.api_key]
    );
    const cost = (costRows && costRows[0]) || {};
    balanceConsumption = {
      today: Number(cost.today || 0),
      last7d: Number(cost.last7d || 0),
      last30d: Number(cost.last30d || 0),
      alltime: Number(cost.alltime || 0)
    };
  }
  const [walletTx] = await cfg.dbPool.query(
    `SELECT id, type, amount, balance_before, balance_after, description, created_at
     FROM member_wallet_transactions WHERE member_id = ? ORDER BY id DESC LIMIT 20`,
    [memberId]
  );
  const [topupRows] = await cfg.dbPool.query(
    `SELECT id, invoice, amount, fee, total_amount, method_code, method_name, payment_type, status, expired_at, credited_at, provider_response, created_at
     FROM member_topups WHERE member_id = ? ORDER BY id DESC LIMIT 20`,
    [memberId]
  );
  const topups = (topupRows || []).map((item) => {
    let provider = null;
    try {
      provider = item.provider_response ? JSON.parse(item.provider_response) : null;
    } catch (err) {
      provider = null;
    }
    const providerData = provider?.data || {};
    const providerRawData = provider?.raw?.data || {};
    return {
      ...item,
      payment_method_name: item.method_name || providerData.payment_method_name || providerRawData.payment_method_name || null,
      qr_string: providerData.qr_string || providerRawData.qr_string || null
    };
  });
  return {
    member,
    api_key: apiKey,
    hit_stats: hitStats,
    balance_consumption: balanceConsumption,
    pricing: {
      bank: Number(cfg.appConfig.cost_bank || 0),
      ewallet: Number(cfg.appConfig.cost_ewallet || 0),
      ai: Number(cfg.appConfig.cost_ai || 0)
    },
    pricing_services: (() => {
      const isOn = (value) => String(value || '').toLowerCase() === 'on';
      const bankActive = [1, 2, 3, 4, 5, 6, 7].some((n) => isOn(cfg.appConfig['bank_server' + n + '_status']));
      const ewalletActive = [1, 2, 3, 5, 6, 7, 8].some((n) => isOn(cfg.appConfig['ewallet_server' + n + '_status']));
      const nikActive = isOn(cfg.appConfig.nik_status);
      const whatsappActive = isOn(cfg.appConfig.whatsapp_status);
      const gamesActive = isOn(cfg.appConfig.games_status);
      const bpjsActive = isOn(cfg.appConfig.bpjs_status);
      const plnActive = isOn(cfg.appConfig.pln_status);
      const aiActive = isOn(cfg.appConfig.ai_status);
      const base = [
        { key: 'bank', label: 'Bank', price: Number(cfg.appConfig.cost_bank || 0), unit: 'per hit sukses', active: bankActive },
        { key: 'ewallet', label: 'E-Wallet', price: Number(cfg.appConfig.cost_ewallet || 0), unit: 'per hit sukses', active: ewalletActive },
        { key: 'nik', label: 'NIK', price: Number(cfg.appConfig.cost_nik || 0), unit: 'per hit sukses', active: nikActive },
        { key: 'whatsapp', label: 'WhatsApp', price: Number(cfg.appConfig.cost_whatsapp || 0), unit: 'per hit sukses', active: whatsappActive },
        { key: 'games', label: 'Games', price: Number(cfg.appConfig.cost_games || 0), unit: 'per hit sukses', active: gamesActive },
        { key: 'bpjs', label: 'BPJS', price: Number(cfg.appConfig.cost_bpjs || 0), unit: 'per hit sukses', active: bpjsActive },
        { key: 'pln', label: 'PLN', price: Number(cfg.appConfig.cost_pln || 0), unit: 'per hit sukses', active: plnActive },
        { key: 'ai', label: 'Foto Editor', price: Number(cfg.appConfig.cost_ai || 0), unit: 'per request sukses', active: aiActive }
      ];
      return base;
    })(),
    invalid_policy: {
      enabled: true,
      invalid_quota_24h: Number(cfg.appConfig.invalid_quota_24h || 500),
      invalid_penalty_percent: Number(cfg.appConfig.invalid_penalty_percent || 50)
    },
    wallet_transactions: walletTx || [],
    topups: topups || [],
    subscriptions: [],
    package_invoices: []
  };
}

async function revokePrimaryApiKey(memberId) {
  const conn = await cfg.dbPool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(`
      SELECT mak.id as mapping_id, a.id as api_key_id
      FROM member_api_keys mak
      INNER JOIN api_keys a ON a.id = mak.api_key_id
      WHERE mak.member_id = ? AND mak.revoked_at IS NULL
      ORDER BY mak.is_primary DESC, mak.id DESC
      LIMIT 1
    `, [memberId]);
    if (!rows || rows.length === 0) throw new Error('API key aktif tidak ditemukan.');
    const current = rows[0];
    await conn.query('UPDATE api_keys SET is_active = 0 WHERE id = ?', [current.api_key_id]);
    await conn.query('UPDATE member_api_keys SET revoked_at = NOW(), is_primary = 0 WHERE id = ?', [current.mapping_id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function regeneratePrimaryApiKey(memberId) {
  const profile = await getMemberProfile(memberId);
  if (!profile) throw new Error('Member tidak ditemukan.');
  const conn = await cfg.dbPool.getConnection();
  try {
    await conn.beginTransaction();
    const [currentRows] = await conn.query(`
      SELECT a.balance, a.billing_type, a.package_id, a.is_active, a.expiry
      FROM member_api_keys mak
      INNER JOIN api_keys a ON a.id = mak.api_key_id
      WHERE mak.member_id = ? AND mak.revoked_at IS NULL
      ORDER BY mak.is_primary DESC, mak.id DESC
      LIMIT 1
    `, [memberId]);
    const currentState = currentRows[0] || {
      balance: 0,
      billing_type: 'balance',
      package_id: null,
      is_active: 1,
      expiry: null
    };
    const [activeRows] = await conn.query(`
      SELECT mak.id as mapping_id, a.id as api_key_id
      FROM member_api_keys mak
      INNER JOIN api_keys a ON a.id = mak.api_key_id
      WHERE mak.member_id = ? AND mak.revoked_at IS NULL
    `, [memberId]);
    for (const row of activeRows) {
      await conn.query('UPDATE api_keys SET is_active = 0 WHERE id = ?', [row.api_key_id]);
      await conn.query('UPDATE member_api_keys SET revoked_at = NOW(), is_primary = 0 WHERE id = ?', [row.mapping_id]);
    }
    const apiKey = await createApiKeyForMember(conn, profile, {
      balance: currentState.balance,
      billing_type: 'balance',
      package_id: null,
      is_active: currentState.is_active,
      expiry: null
    });
    await conn.commit();
    return apiKey.api_key;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function createMemberTopup(memberId, amount, methodCode) {
  await expireStalePendingTopups(memberId);
  const [pendingRows] = await cfg.dbPool.query(
    `SELECT invoice, expired_at
     FROM member_topups
     WHERE member_id = ?
       AND LOWER(status) = 'pending'
       AND (expired_at IS NULL OR expired_at > NOW())
     ORDER BY id DESC
     LIMIT 1`,
    [memberId]
  );
  if (pendingRows.length) {
    const pending = pendingRows[0];
    const expiryMsg = pending.expired_at ? ` sampai ${new Date(pending.expired_at).toLocaleString('id-ID')}` : '';
    throw new Error(`Masih ada deposit pending (${pending.invoice})${expiryMsg}. Selesaikan atau tunggu expired sebelum membuat topup baru.`);
  }
  const methods = await getMergedDepositMethods();
  const methodCodeRaw = String(methodCode || '').trim();
  const methodCodeNorm = methodCodeRaw.toLowerCase();
  const method = methods.find((item) => (
    (String(item.code || '').toLowerCase() === methodCodeNorm ||
     String(item.provider_code || '').toLowerCase() === methodCodeNorm) &&
    item.enabled
  ));
  if (!method) throw new Error('Metode pembayaran tidak tersedia.');
  const numericAmount = Number(amount || 0);
  if (!Number.isFinite(numericAmount) || numericAmount < Number(method.min_amount || 0)) {
    throw new Error(`Nominal topup minimal ${method.min_amount || 0}.`);
  }
  if (method.max_amount && numericAmount > Number(method.max_amount)) {
    throw new Error(`Nominal topup maksimal ${method.max_amount}.`);
  }
  const response = await createDeposit(numericAmount, method.provider_code || method.code);
  const data = response.data || {};
  await cfg.dbPool.query(
    `INSERT INTO member_topups
     (member_id, invoice, amount, fee, total_amount, method_code, method_name, payment_type, status, expired_at, provider_response, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      memberId,
      data.invoice,
      Number(data.amount || numericAmount),
      Number(data.fee || 0),
      Number(data.total_amount || numericAmount),
      String(data.payment_method || method.code),
      String(data.payment_method_name || method.name),
      String(data.type || method.type || ''),
      String(data.status || 'pending'),
      data.expired_at ? new Date(data.expired_at) : null,
      JSON.stringify(response)
    ]
  );
  return response;
}

async function syncMemberTopupStatus(memberId, invoice) {
  await expireStalePendingTopups(memberId);
  const [rows] = await cfg.dbPool.query(
    'SELECT * FROM member_topups WHERE member_id = ? AND invoice = ? LIMIT 1',
    [memberId, invoice]
  );
  if (!rows.length) throw new Error('Invoice topup tidak ditemukan.');
  const topup = rows[0];
  const response = await checkDepositStatus(invoice);
  const data = response.data || {};
  let status = String(data.status || topup.status || 'pending').toLowerCase();
  const providerExpiredAt = data.expired_at ? new Date(data.expired_at) : (topup.expired_at ? new Date(topup.expired_at) : null);
  if (status === 'pending' && providerExpiredAt && !Number.isNaN(providerExpiredAt.getTime()) && providerExpiredAt.getTime() <= Date.now()) {
    status = 'expired';
  }
  const conn = await cfg.dbPool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      'UPDATE member_topups SET status = ?, provider_response = ?, expired_at = ?, updated_at = NOW() WHERE id = ?',
      [status, JSON.stringify(response), data.expired_at ? new Date(data.expired_at) : topup.expired_at, topup.id]
    );
    if (status === 'success' && !topup.credited_at) {
      const amount = Number(data.amount || topup.amount || 0);
      const [apiRows] = await conn.query(
        `SELECT a.id, a.balance
         FROM member_api_keys mak
         INNER JOIN api_keys a ON a.id = mak.api_key_id
         WHERE mak.member_id = ? AND mak.revoked_at IS NULL
         ORDER BY mak.is_primary DESC, mak.id DESC
         LIMIT 1
         FOR UPDATE`,
        [memberId]
      );
      if (!apiRows.length) throw new Error('API key aktif tidak ditemukan.');
      const apiKey = apiRows[0];
      await conn.query(
        'UPDATE api_keys SET balance = balance + ?, billing_type = ?, package_id = NULL, expiry = NULL WHERE id = ?',
        [amount, 'balance', apiKey.id]
      );
      await conn.query('UPDATE member_topups SET credited_at = NOW() WHERE id = ?', [topup.id]);
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return response;
}

async function getMemberTopupQrString(memberId, invoice) {
  const [rows] = await cfg.dbPool.query(
    `SELECT invoice, provider_response
     FROM member_topups
     WHERE member_id = ? AND invoice = ?
     LIMIT 1`,
    [memberId, invoice]
  );
  if (!rows.length) throw new Error('Invoice topup tidak ditemukan.');
  const topup = rows[0];
  let provider = null;
  try {
    provider = topup.provider_response ? JSON.parse(topup.provider_response) : null;
  } catch (err) {
    provider = null;
  }
  const providerData = provider?.data || {};
  const providerRawData = provider?.raw?.data || {};
  const qrString = providerData.qr_string || providerRawData.qr_string || null;
  if (!qrString) throw new Error('QRIS belum tersedia untuk invoice ini.');
  return { invoice: topup.invoice, qr_string: qrString };
}

async function findRegistrationIpConflicts(ip, options = {}) {
  const registrationIp = String(ip || '').trim();
  if (!registrationIp || registrationIp === 'unknown') {
    return { total: 0, members: [] };
  }
  const limit = Math.max(1, Math.min(parseInt(options.limit, 10) || 5, 20));
  const [rows] = await cfg.dbPool.query(
    `SELECT id, member_code, name, whatsapp_number, created_at
     FROM member_accounts
     WHERE registration_ip = ?
     ORDER BY id ASC
     LIMIT ?`,
    [registrationIp, limit]
  );
  return {
    total: Array.isArray(rows) ? rows.length : 0,
    members: Array.isArray(rows) ? rows : []
  };
}

module.exports = {
  getRegistrationStatus,
  registerMember,
  loginMember,
  logoutMember,
  getMemberDashboard,
  revokePrimaryApiKey,
  regeneratePrimaryApiKey,
  createMemberTopup,
  syncMemberTopupStatus,
  getMemberTopupQrString,
  getPrimaryApiKey,
  findRegistrationIpConflicts
};

