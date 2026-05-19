const express = require('express');
const cfg = require('../lib/config');
const { normalizeWhatsAppNumber, validatePin, hashPin } = require('../lib/member_auth');
const { regeneratePrimaryApiKey } = require('../lib/member_service');
const wa = require('../lib/whatsapp');

const router = express.Router();

function ensureAdmin(req, res) {
  if (req.query.key !== cfg.ADMIN_KEY) {
    res.status(401).json({ status: false, error: 'Unauthorized' });
    return false;
  }
  return true;
}

router.get('/', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const [rows] = await cfg.dbPool.query(`
      SELECT m.id, m.member_code, m.name, m.whatsapp_number, m.registration_ip, m.active_mode, m.wallet_balance, m.is_active, m.last_login_at, m.created_at,
             a.api_key, a.balance as api_balance, a.billing_type, a.package_id, a.expiry, p.name as package_name,
             COALESCE(ipdup.duplicate_count, 0) as duplicate_ip_count
      FROM member_accounts m
      LEFT JOIN member_api_keys mak ON mak.member_id = m.id AND mak.revoked_at IS NULL AND mak.is_primary = 1
      LEFT JOIN api_keys a ON a.id = mak.api_key_id
      LEFT JOIN packages p ON p.package_id = a.package_id
      LEFT JOIN (
        SELECT registration_ip, COUNT(*) as duplicate_count
        FROM member_accounts
        WHERE registration_ip IS NOT NULL AND registration_ip <> ''
        GROUP BY registration_ip
        HAVING COUNT(*) > 1
      ) ipdup ON ipdup.registration_ip = m.registration_ip
      ORDER BY m.id DESC
    `);
    res.json({ status: true, data: rows || [] });
  } catch (err) {
    console.error('[ADMIN][MEMBERS][LIST] Error:', err);
    res.status(500).json({ status: false, error: 'Terjadi kesalahan server.' });
  }
});

// Unified account list: linked(api+portal), portal_only, api_only
router.get('/unified', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const [portalRows] = await cfg.dbPool.query(`
      SELECT m.id AS member_id, m.member_code, m.name, m.whatsapp_number, m.registration_ip, m.active_mode, m.wallet_balance, m.is_active,
             a.id AS api_key_id, a.api_key, a.balance AS api_balance, a.billing_type, a.package_id, a.expiry,
             COALESCE(ipdup.duplicate_count, 0) as duplicate_ip_count
      FROM member_accounts m
      LEFT JOIN member_api_keys mak ON mak.member_id = m.id AND mak.revoked_at IS NULL AND mak.is_primary = 1
      LEFT JOIN api_keys a ON a.id = mak.api_key_id
      LEFT JOIN (
        SELECT registration_ip, COUNT(*) as duplicate_count
        FROM member_accounts
        WHERE registration_ip IS NOT NULL AND registration_ip <> ''
        GROUP BY registration_ip
        HAVING COUNT(*) > 1
      ) ipdup ON ipdup.registration_ip = m.registration_ip
      ORDER BY m.id DESC
    `);

    const [apiOnlyRows] = await cfg.dbPool.query(`
      SELECT u.id AS api_key_id, u.name, u.api_key, u.whatsapp_number, u.balance AS api_balance, u.billing_type, u.package_id, u.expiry, u.is_active
      FROM api_keys u
      WHERE NOT EXISTS (
        SELECT 1
        FROM member_api_keys mk
        WHERE mk.api_key_id = u.id AND mk.revoked_at IS NULL
      )
      ORDER BY u.id DESC
    `);

    const unified = [];
    for (const m of (portalRows || [])) {
      const mode = m.api_key_id ? 'linked' : 'portal_only';
      unified.push({
        mode,
        member_id: m.member_id,
        api_key_id: m.api_key_id || null,
        member_code: m.member_code || null,
        name: m.name || '-',
        whatsapp_number: m.whatsapp_number || '-',
        registration_ip: m.registration_ip || '-',
        active_mode: m.active_mode || '-',
        wallet_balance: Number(m.wallet_balance || 0),
        api_key: m.api_key || null,
        billing_type: m.billing_type || null,
        api_balance: Number(m.api_balance || 0),
        package_id: m.package_id || null,
        expiry: m.expiry || null,
        is_active: Number(m.is_active) === 1 ? 1 : 0,
        duplicate_ip_count: Number(m.duplicate_ip_count || 0)
      });
    }
    for (const u of (apiOnlyRows || [])) {
      unified.push({
        mode: 'api_only',
        member_id: null,
        api_key_id: u.api_key_id,
        member_code: null,
        name: u.name || '-',
        whatsapp_number: u.whatsapp_number || '-',
        registration_ip: '-',
        active_mode: 'api-only',
        wallet_balance: Number(u.api_balance || 0),
        api_key: u.api_key || null,
        billing_type: u.billing_type || null,
        api_balance: Number(u.api_balance || 0),
        package_id: u.package_id || null,
        expiry: u.expiry || null,
        is_active: Number(u.is_active) === 1 ? 1 : 0,
        duplicate_ip_count: 0
      });
    }

    const data = q
      ? unified.filter((row) => {
          const hay = [
            row.mode, row.member_id, row.api_key_id, row.member_code, row.name,
            row.whatsapp_number, row.registration_ip, row.active_mode, row.api_key,
            row.wallet_balance, row.is_active ? 'aktif active on' : 'nonaktif inactive off'
          ].map((v) => String(v || '').toLowerCase()).join(' ');
          return hay.includes(q);
        })
      : unified;

    res.json({ status: true, data });
  } catch (err) {
    console.error('[ADMIN][MEMBERS][UNIFIED_LIST] Error:', err);
    res.status(500).json({ status: false, error: 'Terjadi kesalahan server.' });
  }
});

router.get('/unified/detail', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const mode = String(req.query.mode || '').toLowerCase();
    const memberId = Number(req.query.member_id || 0);
    const apiKeyId = Number(req.query.api_key_id || 0);
    if (!mode || (!memberId && !apiKeyId)) {
      return res.status(400).json({ status: false, error: 'Parameter mode/member_id/api_key_id tidak valid.' });
    }

    if (mode === 'api_only') {
      const [rows] = await cfg.dbPool.query(
        `SELECT id, name, whatsapp_number, balance, billing_type, package_id, is_active, expiry, api_key, total_hits, created_at
         FROM api_keys WHERE id = ? LIMIT 1`,
        [apiKeyId]
      );
      const api = rows && rows[0] ? rows[0] : null;
      if (!api) return res.json({ status: true, data: null });
      return res.json({
        status: true,
        data: {
          mode: 'api_only',
          member: null,
          api,
          topups: [],
          wallet_transactions: [],
          package_invoices: [],
          subscriptions: []
        }
      });
    }

    const [rows] = await cfg.dbPool.query(`
      SELECT m.*, a.id AS api_key_id, a.api_key, a.balance as api_balance, a.billing_type, a.package_id, a.expiry
      FROM member_accounts m
      LEFT JOIN member_api_keys mak ON mak.member_id = m.id AND mak.revoked_at IS NULL AND mak.is_primary = 1
      LEFT JOIN api_keys a ON a.id = mak.api_key_id
      WHERE m.id = ? LIMIT 1
    `, [memberId]);
    const member = rows[0] || null;
    if (!member) return res.json({ status: true, data: null });

    const [topups] = await cfg.dbPool.query(
      `SELECT id, invoice, amount, fee, total_amount, method_name, status, expired_at, created_at, credited_at
       FROM member_topups WHERE member_id = ? ORDER BY id DESC LIMIT 20`,
      [memberId]
    );
    const [walletTx] = await cfg.dbPool.query(
      `SELECT id, type, amount, balance_before, balance_after, description, created_at
       FROM member_wallet_transactions WHERE member_id = ? ORDER BY id DESC LIMIT 30`,
      [memberId]
    );
    let pkgInvoices = [];
    try {
      const [invoiceRows] = await cfg.dbPool.query(
        `SELECT id, invoice_no, package_name, amount, duration_days, payment_method, status, created_at, confirmed_at
         FROM member_package_invoices WHERE member_id = ? ORDER BY id DESC LIMIT 20`,
        [memberId]
      );
      pkgInvoices = invoiceRows || [];
    } catch (err) {
      if (!(err && (err.code === 'ER_NO_SUCH_TABLE' || String(err.errno) === '1146'))) throw err;
    }
    const [subs] = await cfg.dbPool.query(
      `SELECT s.id, s.status, s.started_at, s.ended_at, s.price, p.name as package_name, p.features
       FROM member_package_subscriptions s
       LEFT JOIN packages p ON p.package_id = s.package_id
       WHERE s.member_id = ?
       ORDER BY s.id DESC LIMIT 20`,
      [memberId]
    );
    res.json({
      status: true,
      data: {
        mode: member.api_key_id ? 'linked' : 'portal_only',
        member,
        api: member.api_key_id ? {
          id: member.api_key_id,
          api_key: member.api_key,
          balance: member.api_balance,
          billing_type: member.billing_type,
          package_id: member.package_id,
          expiry: member.expiry
        } : null,
        topups: topups || [],
        wallet_transactions: walletTx || [],
        package_invoices: pkgInvoices || [],
        subscriptions: subs || []
      }
    });
  } catch (err) {
    console.error('[ADMIN][MEMBERS][UNIFIED_DETAIL] Error:', err);
    res.status(500).json({ status: false, error: 'Terjadi kesalahan server.' });
  }
});

router.post('/unified/save', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const mode = String(req.body.mode || '').toLowerCase();
    const memberId = Number(req.body.member_id || 0);
    const apiKeyId = Number(req.body.api_key_id || 0);
    const name = String(req.body.name || '').trim();
    const whatsappNumber = normalizeWhatsAppNumber(req.body.whatsapp_number || '');
    const walletBalance = Number(req.body.wallet_balance || 0);
    const isActive = Number(req.body.is_active) === 0 ? 0 : 1;
    if (!name) return res.status(400).json({ status: false, error: 'Nama wajib diisi.' });
    if (!whatsappNumber) return res.status(400).json({ status: false, error: 'Nomor WhatsApp wajib diisi.' });

    const conn = await cfg.dbPool.getConnection();
    try {
      await conn.beginTransaction();
      if (mode === 'api_only') {
        if (!apiKeyId) throw new Error('Akun API tidak valid.');
        await conn.query(
          'UPDATE api_keys SET name = ?, whatsapp_number = ?, balance = ?, is_active = ? WHERE id = ?',
          [name, whatsappNumber, walletBalance, isActive, apiKeyId]
        );
      } else {
        if (!memberId) throw new Error('Akun member tidak valid.');
        await conn.query(
          'UPDATE member_accounts SET name = ?, whatsapp_number = ?, wallet_balance = ?, is_active = ? WHERE id = ?',
          [name, whatsappNumber, walletBalance, isActive, memberId]
        );
        await conn.query(
          `UPDATE api_keys a
           INNER JOIN member_api_keys mak ON mak.api_key_id = a.id
           SET a.name = ?, a.whatsapp_number = ?, a.is_active = ?
           WHERE mak.member_id = ? AND mak.revoked_at IS NULL`,
          [name, whatsappNumber, isActive, memberId]
        );
      }
      await conn.commit();
      return res.json({ status: true, message: 'Data akun berhasil diperbarui.' });
    } catch (e) {
      try { await conn.rollback(); } catch (_) {}
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('[ADMIN][MEMBERS][UNIFIED_SAVE] Error:', err);
    res.status(500).json({ status: false, error: err.message || 'Terjadi kesalahan server.' });
  }
});

router.post('/unified/reset-pin', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const mode = String(req.body.mode || '').toLowerCase();
    const memberId = Number(req.body.member_id || 0);
    const pin = String(req.body.pin || '').trim();
    if (mode === 'api_only') {
      return res.status(400).json({ status: false, error: 'Akun API-only tidak memiliki PIN portal.' });
    }
    if (!memberId) return res.status(400).json({ status: false, error: 'Member tidak valid.' });
    if (!validatePin(pin)) return res.status(400).json({ status: false, error: 'PIN baru harus 6 digit angka.' });
    await cfg.dbPool.query(
      'UPDATE member_accounts SET pin_hash = ?, failed_pin_attempts = 0, pin_locked_until = NULL WHERE id = ?',
      [hashPin(pin), memberId]
    );
    await cfg.dbPool.query(
      'INSERT INTO member_pin_reset_logs (member_id, reset_by, notes, created_at) VALUES (?, ?, ?, NOW())',
      [memberId, 'admin', 'Reset PIN via unified admin panel']
    );
    res.json({ status: true, message: 'PIN member berhasil direset.' });
  } catch (err) {
    console.error('[ADMIN][MEMBERS][UNIFIED_RESET_PIN] Error:', err);
    res.status(500).json({ status: false, error: 'Terjadi kesalahan server.' });
  }
});

router.post('/unified/resend-wa', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const mode = String(req.body.mode || '').toLowerCase();
    const memberId = Number(req.body.member_id || 0);
    const apiKeyId = Number(req.body.api_key_id || 0);
    let user = null;
    if (mode === 'api_only') {
      if (!apiKeyId) return res.status(400).json({ status: false, error: 'Akun API tidak valid.' });
      const [rows] = await cfg.dbPool.query(
        'SELECT id, name, api_key, whatsapp_number, balance, expiry FROM api_keys WHERE id = ? LIMIT 1',
        [apiKeyId]
      );
      user = rows && rows[0] ? rows[0] : null;
    } else {
      if (!memberId) return res.status(400).json({ status: false, error: 'Akun member tidak valid.' });
      const [rows] = await cfg.dbPool.query(
        `SELECT a.id, a.name, a.api_key, a.whatsapp_number, a.balance, a.expiry
         FROM api_keys a
         INNER JOIN member_api_keys mak ON mak.api_key_id = a.id
         WHERE mak.member_id = ? AND mak.revoked_at IS NULL
         ORDER BY mak.is_primary DESC, mak.id DESC
         LIMIT 1`,
        [memberId]
      );
      user = rows && rows[0] ? rows[0] : null;
    }
    if (!user) return res.status(404).json({ status: false, error: 'Data API key tidak ditemukan.' });
    if (!user.whatsapp_number) return res.status(400).json({ status: false, error: 'Nomor WhatsApp kosong.' });

    const baseUrl = cfg.appConfig.public_base_url || '';
    const vars = {
      name: user.name,
      api_key: user.api_key,
      whatsapp_number: user.whatsapp_number,
      expiry: user.expiry || null,
      package: 'Saldo Only',
      balance: Number(user.balance || 0),
      base_url: baseUrl
    };
    const msg = wa.applyTemplate(cfg.appConfig.wa_template_new_user, vars);
    const waSent = await wa.sendWAText(user.whatsapp_number, msg, { provider: 'internal_baileys' });
    return res.json({ status: true, message: 'Detail API berhasil dikirim ulang ke WA.', wa_sent: waSent });
  } catch (err) {
    console.error('[ADMIN][MEMBERS][UNIFIED_RESEND_WA] Error:', err);
    res.status(500).json({ status: false, error: err.message || 'Terjadi kesalahan server.' });
  }
});

router.get('/:id', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const [rows] = await cfg.dbPool.query(`
      SELECT m.*, a.api_key, a.balance as api_balance, a.billing_type, a.package_id, a.expiry, p.name as package_name,
             COALESCE(ipdup.duplicate_count, 0) as duplicate_ip_count
      FROM member_accounts m
      LEFT JOIN member_api_keys mak ON mak.member_id = m.id AND mak.revoked_at IS NULL AND mak.is_primary = 1
      LEFT JOIN api_keys a ON a.id = mak.api_key_id
      LEFT JOIN packages p ON p.package_id = a.package_id
      LEFT JOIN (
        SELECT registration_ip, COUNT(*) as duplicate_count
        FROM member_accounts
        WHERE registration_ip IS NOT NULL AND registration_ip <> ''
        GROUP BY registration_ip
        HAVING COUNT(*) > 1
      ) ipdup ON ipdup.registration_ip = m.registration_ip
      WHERE m.id = ? LIMIT 1
    `, [req.params.id]);
    const member = rows[0] || null;
    if (!member) return res.json({ status: true, data: null });
    const [topups] = await cfg.dbPool.query(
      `SELECT id, invoice, amount, fee, total_amount, method_name, status, expired_at, created_at, credited_at
       FROM member_topups WHERE member_id = ? ORDER BY id DESC LIMIT 20`,
      [req.params.id]
    );
    const [walletTx] = await cfg.dbPool.query(
      `SELECT id, type, amount, balance_before, balance_after, description, created_at
       FROM member_wallet_transactions WHERE member_id = ? ORDER BY id DESC LIMIT 30`,
      [req.params.id]
    );
    let pkgInvoices = [];
    try {
      const [invoiceRows] = await cfg.dbPool.query(
        `SELECT id, invoice_no, package_name, amount, duration_days, payment_method, status, created_at, confirmed_at
         FROM member_package_invoices WHERE member_id = ? ORDER BY id DESC LIMIT 20`,
        [req.params.id]
      );
      pkgInvoices = invoiceRows || [];
    } catch (err) {
      if (!(err && (err.code === 'ER_NO_SUCH_TABLE' || String(err.errno) === '1146'))) {
        throw err;
      }
    }
    const [subs] = await cfg.dbPool.query(
      `SELECT s.id, s.status, s.started_at, s.ended_at, s.price, p.name as package_name, p.features
       FROM member_package_subscriptions s
       LEFT JOIN packages p ON p.package_id = s.package_id
       WHERE s.member_id = ?
       ORDER BY s.id DESC LIMIT 20`,
      [req.params.id]
    );
    res.json({ status: true, data: { member, topups: topups || [], wallet_transactions: walletTx || [], package_invoices: pkgInvoices || [], subscriptions: subs || [] } });
  } catch (err) {
    console.error('[ADMIN][MEMBERS][DETAIL] Error:', err);
    res.status(500).json({ status: false, error: 'Terjadi kesalahan server.' });
  }
});

router.post('/:id', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const name = String(req.body.name || '').trim();
    const whatsappNumber = normalizeWhatsAppNumber(req.body.whatsapp_number || '');
    const walletBalance = Number(req.body.wallet_balance || 0);
    const isActive = Number(req.body.is_active) === 0 ? 0 : 1;
    if (!name) return res.status(400).json({ status: false, error: 'Nama wajib diisi.' });
    if (!whatsappNumber) return res.status(400).json({ status: false, error: 'Nomor WhatsApp wajib diisi.' });

    await cfg.dbPool.query(
      'UPDATE member_accounts SET name = ?, whatsapp_number = ?, wallet_balance = ?, is_active = ? WHERE id = ?',
      [name, whatsappNumber, walletBalance, isActive, req.params.id]
    );
    await cfg.dbPool.query(
      `UPDATE api_keys a
       INNER JOIN member_api_keys mak ON mak.api_key_id = a.id
       SET a.name = ?, a.whatsapp_number = ?, a.is_active = ?
       WHERE mak.member_id = ? AND mak.revoked_at IS NULL`,
      [name, whatsappNumber, isActive, req.params.id]
    );
    res.json({ status: true, message: 'Data member berhasil diperbarui.' });
  } catch (err) {
    console.error('[ADMIN][MEMBERS][UPDATE] Error:', err);
    res.status(500).json({ status: false, error: 'Terjadi kesalahan server.' });
  }
});

router.post('/:id/reset-pin', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const pin = String(req.body.pin || '').trim();
    if (!validatePin(pin)) {
      return res.status(400).json({ status: false, error: 'PIN baru harus 6 digit angka.' });
    }
    await cfg.dbPool.query(
      'UPDATE member_accounts SET pin_hash = ?, failed_pin_attempts = 0, pin_locked_until = NULL WHERE id = ?',
      [hashPin(pin), req.params.id]
    );
    await cfg.dbPool.query(
      'INSERT INTO member_pin_reset_logs (member_id, reset_by, notes, created_at) VALUES (?, ?, ?, NOW())',
      [req.params.id, 'admin', 'Reset PIN via admin panel']
    );
    res.json({ status: true, message: 'PIN member berhasil direset.' });
  } catch (err) {
    console.error('[ADMIN][MEMBERS][RESET_PIN] Error:', err);
    res.status(500).json({ status: false, error: 'Terjadi kesalahan server.' });
  }
});

router.post('/:id/regenerate-apikey', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const apiKey = await regeneratePrimaryApiKey(req.params.id);
    res.json({ status: true, message: 'API key member berhasil dibuat ulang.', data: { api_key: apiKey } });
  } catch (err) {
    console.error('[ADMIN][MEMBERS][REGENERATE_APIKEY] Error:', err);
    res.status(400).json({ status: false, error: 'Gagal membuat ulang API key.' });
  }
});

router.post('/:id/block', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    await cfg.dbPool.query('UPDATE member_accounts SET is_active = 0 WHERE id = ?', [req.params.id]);
    await cfg.dbPool.query(
      `UPDATE api_keys a
       INNER JOIN member_api_keys mak ON mak.api_key_id = a.id
       SET a.is_active = 0
       WHERE mak.member_id = ? AND mak.revoked_at IS NULL`,
      [req.params.id]
    );
    res.json({ status: true, message: 'Member berhasil diblokir.' });
  } catch (err) {
    console.error('[ADMIN][MEMBERS][BLOCK] Error:', err);
    res.status(500).json({ status: false, error: 'Terjadi kesalahan server.' });
  }
});

module.exports = router;
