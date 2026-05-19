/**
 * routes/users.js
 * User management (CRUD) + WhatsApp notification
 */

const express = require('express');
const router = express.Router();
const cfg = require('../lib/config');
const wa = require('../lib/whatsapp');

let apiKeysWaColumnsEnsured = false;
function toPositiveInt(value) {
  const n = parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

async function deleteApiUsersByIds(ids) {
  const cleanIds = Array.isArray(ids)
    ? ids.map((v) => toPositiveInt(v)).filter((v) => v > 0)
    : [];
  if (!cleanIds.length) return { deleted: 0 };

  const conn = await cfg.dbPool.getConnection();
  try {
    await conn.beginTransaction();
    const placeholders = cleanIds.map(() => '?').join(',');
    const [memberRows] = await conn.query(
      `SELECT DISTINCT member_id
       FROM member_api_keys
       WHERE api_key_id IN (${placeholders}) AND member_id IS NOT NULL`,
      cleanIds
    );
    const relatedMemberIds = (memberRows || [])
      .map((row) => toPositiveInt(row.member_id))
      .filter((v) => v > 0);

    // Backward compatible: some old DBs may not have ON DELETE CASCADE on member_api_keys.
    await conn.query(`DELETE FROM member_api_keys WHERE api_key_id IN (${placeholders})`, cleanIds);
    const [result] = await conn.query(`DELETE FROM api_keys WHERE id IN (${placeholders})`, cleanIds);

    let membersDeactivated = 0;
    if (relatedMemberIds.length) {
      const memberPlaceholders = relatedMemberIds.map(() => '?').join(',');
      const [activeKeyRows] = await conn.query(
        `SELECT mak.member_id, COUNT(*) AS active_count
         FROM member_api_keys mak
         INNER JOIN api_keys a ON a.id = mak.api_key_id
         WHERE mak.member_id IN (${memberPlaceholders}) AND mak.revoked_at IS NULL
         GROUP BY mak.member_id`,
        relatedMemberIds
      );
      const activeMap = new Map();
      for (const row of (activeKeyRows || [])) {
        activeMap.set(toPositiveInt(row.member_id), Number(row.active_count || 0));
      }

      const targetMemberIds = relatedMemberIds.filter((memberId) => Number(activeMap.get(memberId) || 0) < 1);
      if (targetMemberIds.length) {
        const targetMemberPlaceholders = targetMemberIds.map(() => '?').join(',');
        const [memberProfileRows] = await conn.query(
          `SELECT id, whatsapp_number FROM member_accounts WHERE id IN (${targetMemberPlaceholders})`,
          targetMemberIds
        );
        const targetNumbers = (memberProfileRows || [])
          .map((row) => String(row.whatsapp_number || '').trim())
          .filter((n) => n.length > 0 && !n.startsWith('del'));

        await conn.query(
          `DELETE FROM member_sessions WHERE member_id IN (${targetMemberPlaceholders})`,
          targetMemberIds
        );
        const [memberUpdateResult] = await conn.query(
          `UPDATE member_accounts
           SET is_active = 0,
               failed_pin_attempts = 0,
               pin_locked_until = NULL,
               whatsapp_number = CASE
                 WHEN whatsapp_number IS NULL OR whatsapp_number = '' THEN whatsapp_number
                 WHEN whatsapp_number LIKE 'del%' THEN whatsapp_number
                 ELSE CONCAT('del', id, '_', UNIX_TIMESTAMP())
               END,
               updated_at = NOW()
           WHERE id IN (${targetMemberPlaceholders})`,
          targetMemberIds
        );
        membersDeactivated = Number((memberUpdateResult && memberUpdateResult.affectedRows) || 0);

        if (targetNumbers.length) {
          const waPlaceholders = targetNumbers.map(() => '?').join(',');
          await conn.query(
            `UPDATE member_registration_drafts
             SET status = 'cancelled', failure_reason = 'admin_user_deleted', updated_at = NOW()
             WHERE whatsapp_number IN (${waPlaceholders}) AND status = 'pending'`,
            targetNumbers
          );
          await conn.query(
            `UPDATE wa_otp_sessions
             SET status = 'cancelled'
             WHERE whatsapp_number IN (${waPlaceholders}) AND status = 'pending'`,
            targetNumbers
          );
        }
      }
    }

    await conn.commit();
    return { deleted: Number((result && result.affectedRows) || 0), members_deactivated: membersDeactivated };
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    throw err;
  } finally {
    conn.release();
  }
}

async function ensureApiKeysWaColumns() {
  if (apiKeysWaColumnsEnsured) return;
  const stmts = [
    `ALTER TABLE api_keys ADD COLUMN whatsapp_number VARCHAR(25) DEFAULT NULL`,
    `ALTER TABLE api_keys ADD COLUMN wa_expiry_warned_at DATETIME NULL DEFAULT NULL`,
    `ALTER TABLE api_keys ADD COLUMN wa_expiry_warned_for DATETIME NULL DEFAULT NULL`
  ];
  try {
    for (const s of stmts) {
      try {
        await cfg.dbPool.query(s);
      } catch (e) {
        const ignoredCodes = ['ER_DUP_FIELDNAME', '1060'];
        const isIgnored = ignoredCodes.includes(e.code) || ignoredCodes.includes(String(e.errno)) || String(e.message || '').toLowerCase().includes('duplicate');
        if (!isIgnored) throw e;
      }
    }
    apiKeysWaColumnsEnsured = true;
  } catch (e) {
    apiKeysWaColumnsEnsured = false;
  }
}

// GET /api/v3/admin/users
router.get('/', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    await ensureApiKeysWaColumns();
    const dropdown = String(req.query.dropdown || '') === '1';
    const activeOrStandaloneFilter = `(
      NOT EXISTS (SELECT 1 FROM member_api_keys mk_any WHERE mk_any.api_key_id = u.id)
      OR EXISTS (SELECT 1 FROM member_api_keys mk_active WHERE mk_active.api_key_id = u.id AND mk_active.revoked_at IS NULL)
    )`;
    if (dropdown) {
      const [rows] = await cfg.dbPool.query(
        `SELECT u.id, u.name, u.api_key FROM api_keys u WHERE ${activeOrStandaloneFilter} ORDER BY u.id DESC`
      );
      return res.json({ status: true, data: rows || [] });
    }
    const pageRaw = req.query.page !== undefined ? parseInt(req.query.page, 10) : null;
    const limitRaw = req.query.limit !== undefined ? parseInt(req.query.limit, 10) : null;
    const usePaging = Number.isFinite(pageRaw) || Number.isFinite(limitRaw);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(100, limitRaw) : 10;
    const offset = (page - 1) * limit;

    const withWa = `SELECT u.id, u.name, u.api_key, u.whatsapp_number, u.balance, u.billing_type, u.package_id, u.is_active, u.expiry, u.total_hits, u.created_at, p.name as package_name, m.member_code
                    FROM api_keys u
                    LEFT JOIN packages p ON u.package_id = p.package_id
                    LEFT JOIN member_api_keys mak ON mak.api_key_id = u.id AND mak.revoked_at IS NULL
                    LEFT JOIN member_accounts m ON m.id = mak.member_id`;
    const noWa = `SELECT u.id, u.name, u.api_key, u.balance, u.billing_type, u.package_id, u.is_active, u.expiry, u.total_hits, u.created_at, p.name as package_name, m.member_code
                  FROM api_keys u
                  LEFT JOIN packages p ON u.package_id = p.package_id
                  LEFT JOIN member_api_keys mak ON mak.api_key_id = u.id AND mak.revoked_at IS NULL
                  LEFT JOIN member_accounts m ON m.id = mak.member_id`;

    const showExpired = String(req.query.show_expired || '') === '1';
    const expiredFilterClause = showExpired
      ? ''
      : " AND (u.expiry IS NULL OR u.expiry >= NOW())";

    if (!usePaging) {
      let rows = [];
      try {
        const r = await cfg.dbPool.query(`${withWa} WHERE ${activeOrStandaloneFilter}${expiredFilterClause} ORDER BY u.id DESC`);
        rows = r[0] || [];
      } catch (e) {
        if (String(e.message || '').includes('Unknown column') && String(e.message).includes('whatsapp_number')) {
          const r = await cfg.dbPool.query(`${noWa} WHERE ${activeOrStandaloneFilter}${expiredFilterClause} ORDER BY u.id DESC`);
          rows = (r[0] || []).map(u => ({ ...u, whatsapp_number: null }));
        } else throw e;
      }
      return res.json({ status: true, data: rows });
    }
    let whereClause = `WHERE ${activeOrStandaloneFilter}`;
    whereClause += expiredFilterClause;

    const [countRows] = await cfg.dbPool.query(`SELECT COUNT(*) as total FROM api_keys u ${whereClause}`);
    const total = countRows && countRows[0] ? parseInt(countRows[0].total, 10) : 0;
    const total_pages = total > 0 ? Math.ceil(total / limit) : 1;

    let rows = [];
    try {
      const r = await cfg.dbPool.query(`${withWa} ${whereClause} ORDER BY u.id DESC LIMIT ? OFFSET ?`, [limit, offset]);
      rows = r[0] || [];
    } catch (e) {
      if (String(e.message || '').includes('Unknown column') && String(e.message).includes('whatsapp_number')) {
        const r = await cfg.dbPool.query(`${noWa} ${whereClause} ORDER BY u.id DESC LIMIT ? OFFSET ?`, [limit, offset]);
        rows = (r[0] || []).map(u => ({ ...u, whatsapp_number: null }));
      } else throw e;
    }
    res.json({ status: true, data: rows, meta: { page, limit, total, total_pages } });
  } catch (err) {
    console.error('[ADMIN][USERS][LIST] Error:', err);
    res.status(500).json({ status: false, error: 'Terjadi kesalahan server.' });
  }
});

// GET /api/v3/admin/users/:id
router.get('/:id', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    await ensureApiKeysWaColumns();
    let data = null;
    try {
      const [rows] = await cfg.dbPool.query(`
        SELECT u.id, u.name, u.api_key, u.whatsapp_number, u.balance, u.billing_type, u.package_id, u.is_active, u.expiry, m.member_code,
               COALESCE(mak.member_id, (SELECT mk2.member_id FROM member_api_keys mk2 WHERE mk2.api_key_id = u.id ORDER BY mk2.id DESC LIMIT 1)) AS member_id
        FROM api_keys u
        LEFT JOIN member_api_keys mak ON mak.api_key_id = u.id AND mak.revoked_at IS NULL
        LEFT JOIN member_accounts m ON m.id = mak.member_id
        WHERE u.id = ? LIMIT 1
      `, [req.params.id]);
      data = rows[0] || null;
    } catch (e) {
      if (String(e.message || '').includes('Unknown column') && String(e.message).includes('whatsapp_number')) {
        const [rows] = await cfg.dbPool.query(`
          SELECT u.id, u.name, u.api_key, u.balance, u.billing_type, u.package_id, u.is_active, u.expiry, m.member_code,
                 COALESCE(mak.member_id, (SELECT mk2.member_id FROM member_api_keys mk2 WHERE mk2.api_key_id = u.id ORDER BY mk2.id DESC LIMIT 1)) AS member_id
          FROM api_keys u
          LEFT JOIN member_api_keys mak ON mak.api_key_id = u.id AND mak.revoked_at IS NULL
          LEFT JOIN member_accounts m ON m.id = mak.member_id
          WHERE u.id = ? LIMIT 1
        `, [req.params.id]);
        data = rows[0] ? { ...rows[0], whatsapp_number: null } : null;
      } else throw e;
    }
    if (data && data.member_id) {
      const [histRows] = await cfg.dbPool.query(
        `SELECT a.id, a.api_key, a.is_active, a.created_at, mak.is_primary, mak.revoked_at
         FROM member_api_keys mak
         INNER JOIN api_keys a ON a.id = mak.api_key_id
         WHERE mak.member_id = ?
         ORDER BY (mak.revoked_at IS NULL) DESC, mak.is_primary DESC, mak.id DESC`,
        [data.member_id]
      );
      data.history_keys = histRows || [];
    } else {
      data = data ? { ...data, history_keys: [] } : data;
    }
    res.json({ status: true, data });
  } catch (err) {
    console.error('[ADMIN][USERS][GET] Error:', err);
    res.status(500).json({ status: false, error: 'Terjadi kesalahan server.' });
  }
});

// POST /api/v3/admin/users (create)
router.post('/', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    await ensureApiKeysWaColumns();
    const { name, api_key, whatsapp_number, balance, is_active } = req.body;
    const finalBillingType = 'balance';
    const finalExpiry = null;

    const [result] = await cfg.dbPool.query(
      'INSERT INTO api_keys (name, api_key, whatsapp_number, balance, billing_type, package_id, is_active, expiry, created_at, last_used) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [name, api_key, whatsapp_number || null, balance || 0, finalBillingType, null, is_active || 1, finalExpiry]
    );

    let waSent = null;
    if (parseInt(cfg.appConfig.wa_notify_enabled) === 1 && whatsapp_number) {
      const packageName = 'Saldo Only';
      const proto = (req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http'));
      const base_url = proto + '://' + req.headers.host;
      const vars = { name, api_key, whatsapp_number, expiry: finalExpiry || 'No Expiry', package: packageName, balance: balance || 0, base_url };
      const msg = wa.applyTemplate(cfg.appConfig.wa_notify_enabled === 1 ? cfg.appConfig.wa_template_new_user : '', vars);
      if (msg) waSent = await wa.sendWAText(whatsapp_number, msg);
    }
    res.json({ status: true, id: result.insertId, message: 'User created', wa_sent: waSent });
  } catch (err) {
    console.error('[ADMIN][USERS][CREATE] Error:', err);
    res.status(500).json({ status: false, error: 'Terjadi kesalahan server.' });
  }
});

// POST /api/v3/admin/users/:id (update)
router.post('/:id', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    await ensureApiKeysWaColumns();
    const { name, api_key, whatsapp_number, balance, is_active } = req.body;
    const finalBillingType = 'balance';
    const finalExpiry = null;

    await cfg.dbPool.query(
      'UPDATE api_keys SET name = ?, api_key = ?, whatsapp_number = ?, balance = ?, billing_type = ?, package_id = ?, is_active = ?, wa_expiry_warned_at = IF(expiry <> ?, NULL, wa_expiry_warned_at), wa_expiry_warned_for = IF(expiry <> ?, NULL, wa_expiry_warned_for), expiry = ? WHERE id = ?',
      [name, api_key, whatsapp_number || null, balance || 0, finalBillingType, null, is_active || 1, finalExpiry, finalExpiry, finalExpiry, req.params.id]
    );
    res.json({ status: true, message: 'User updated' });
  } catch (err) {
    console.error('[ADMIN][USERS][UPDATE] Error:', err);
    res.status(500).json({ status: false, error: 'Terjadi kesalahan server.' });
  }
});

// POST /api/v3/admin/users/:id/resend-wa
router.post('/:id/resend-wa', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    await ensureApiKeysWaColumns();
    const [rows] = await cfg.dbPool.query(`
      SELECT u.id, u.name, u.api_key, u.whatsapp_number, u.balance, u.package_id, u.expiry, u.is_active, p.name as package_name
      FROM api_keys u LEFT JOIN packages p ON u.package_id = p.package_id WHERE u.id = ? LIMIT 1
    `, [req.params.id]);
    const u = rows && rows[0] ? rows[0] : null;
    if (!u) return res.status(404).json({ status: false, error: 'User tidak ditemukan' });
    if (!u.whatsapp_number) return res.status(400).json({ status: false, error: 'Nomor WhatsApp user masih kosong' });

    const proto = (req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http'));
    const base_url = cfg.appConfig.public_base_url || (proto + '://' + req.headers.host);
    const vars = { name: u.name, api_key: u.api_key, whatsapp_number: u.whatsapp_number, expiry: u.expiry, package: u.package_name || 'No Package', balance: u.balance || 0, base_url };
    const msg = wa.applyTemplate(cfg.appConfig.wa_template_new_user, vars);
    const waSent = await wa.sendWAText(u.whatsapp_number, msg, { provider: 'internal_baileys' });
    res.json({ status: true, message: 'Resend WA executed', wa_sent: waSent });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// POST /api/v3/admin/users/:id/delete
router.post('/:id/delete', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) return res.status(400).json({ status: false, error: 'ID user tidak valid' });
    const { deleted, members_deactivated } = await deleteApiUsersByIds([id]);
    if (deleted < 1) {
      return res.status(404).json({ status: false, error: 'User tidak ditemukan atau sudah terhapus' });
    }
    res.json({ status: true, message: 'User deleted', deleted, members_deactivated: Number(members_deactivated || 0) });
  } catch (err) {
    console.error('[ADMIN][USERS][DELETE] Error:', err);
    res.status(500).json({ status: false, error: 'Terjadi kesalahan server.' });
  }
});

// POST /api/v3/admin/users/bulk-delete
router.post('/bulk-delete', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    const idsRaw = Array.isArray(req.body && req.body.ids) ? req.body.ids : [];
    const ids = idsRaw.map((v) => toPositiveInt(v)).filter((v) => v > 0);
    if (!ids.length) {
      return res.status(400).json({ status: false, error: 'Tidak ada user yang dipilih' });
    }
    const { deleted, members_deactivated } = await deleteApiUsersByIds(ids);
    res.json({ status: true, message: 'Bulk delete completed', deleted, members_deactivated: Number(members_deactivated || 0) });
  } catch (err) {
    console.error('[ADMIN][USERS][BULK_DELETE] Error:', err);
    res.status(500).json({ status: false, error: 'Terjadi kesalahan server.' });
  }
});

module.exports = router;
