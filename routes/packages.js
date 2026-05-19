/**
 * routes/packages.js
 * Package management (CRUD)
 */

const express = require('express');
const router = express.Router();
const cfg = require('../lib/config');
const { apiKeyCache } = require('../lib/auth');

// GET /api/v3/admin/packages
router.get('/', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    let [rows] = await cfg.dbPool.query('SELECT * FROM packages ORDER BY package_id DESC');
    if (!rows || rows.length === 0) {
      await cfg.dbPool.query(
        `INSERT IGNORE INTO packages (package_id, name, price, duration_days, features, description, max_requests_per_day, is_active)
         VALUES
         (1, 'Starter', 0, 30, 'bank,whatsapp', 'Fitur Dasar - Cek Bank & WhatsApp', 1000, 1),
         (2, 'Pro', 50000, 30, 'bank,ewallet,nik,whatsapp', 'Fitur Lengkap - Bank, E-Wallet, NIK & WhatsApp', 100000, 1)`
      );
      [rows] = await cfg.dbPool.query('SELECT * FROM packages ORDER BY package_id DESC');
    }
    res.json({ status: true, data: rows });
  } catch (err) {
    res.json({ status: false, error: err.message });
  }
});

// GET /api/v3/admin/packages/:id
router.get('/:id', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    const [rows] = await cfg.dbPool.query('SELECT * FROM packages WHERE package_id = ?', [req.params.id]);
    res.json({ status: true, data: rows[0] || null });
  } catch (err) {
    res.json({ status: false, error: err.message });
  }
});

// POST /api/v3/admin/packages (create)
router.post('/', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    const { name, price, features, duration_days } = req.body;
    const [result] = await cfg.dbPool.query(
      'INSERT INTO packages (name, price, duration_days, features, created_at) VALUES (?, ?, ?, ?, NOW())',
      [name, price || 0, Math.max(1, parseInt(duration_days || 30, 10) || 30), features || '']
    );
    apiKeyCache.flushAll();
    res.json({ status: true, id: result.insertId, message: 'Package created' });
  } catch (err) {
    res.json({ status: false, error: err.message });
  }
});

// POST /api/v3/admin/packages/:id (update)
router.post('/:id', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    const { name, price, features, duration_days } = req.body;
    await cfg.dbPool.query(
      'UPDATE packages SET name = ?, price = ?, duration_days = ?, features = ? WHERE package_id = ?',
      [name, price || 0, Math.max(1, parseInt(duration_days || 30, 10) || 30), features || '', req.params.id]
    );
    apiKeyCache.flushAll();
    res.json({ status: true, message: 'Package updated' });
  } catch (err) {
    res.json({ status: false, error: err.message });
  }
});

// POST /api/v3/admin/packages/:id/delete
router.post('/:id/delete', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    await cfg.dbPool.query('DELETE FROM packages WHERE package_id = ?', [req.params.id]);
    apiKeyCache.flushAll();
    res.json({ status: true, message: 'Package deleted' });
  } catch (err) {
    res.json({ status: false, error: err.message });
  }
});

module.exports = router;
