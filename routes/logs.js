/**
 * routes/logs.js
 * Log management: retention, count, recent, delete, cleanup, file viewer
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const cfg = require('../lib/config');
const { statsCache } = require('../lib/stats');

const logDir = path.join(__dirname, '..', 'logs');

async function cleanupOldLogs() {
  if (cfg.logRetentionDays <= 0) return;
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - cfg.logRetentionDays);
    const cutoffDateStr = cutoffDate.toISOString().slice(0, 19).replace('T', ' ');
    const [result] = await cfg.dbPool.query(
      "DELETE FROM api_logs WHERE (created_at < ? OR created_at IS NULL) AND is_success = 0",
      [cutoffDateStr]
    );
    if (result.affectedRows > 0) {
      console.log(`[LOG-CLEANUP] Deleted ${result.affectedRows} failed logs (older than ${cfg.logRetentionDays} days)`);
    }
  } catch (err) {
    console.error('[LOG-CLEANUP] Error cleaning up logs:', err);
  }
}

// Schedule cleanup
setInterval(cleanupOldLogs, 6 * 60 * 60 * 1000);
setTimeout(cleanupOldLogs, 5 * 60 * 1000);

// GET /api/v3/admin/logs/retention
router.get('/retention', (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ status: true, data: { retention_days: cfg.logRetentionDays, message: cfg.logRetentionDays === 0 ? 'Unlimited (no auto-cleanup)' : `${cfg.logRetentionDays} days` } });
});

// POST /api/v3/admin/logs/retention
router.post('/retention', (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  let days = parseInt(req.body.retention_days);
  if (isNaN(days)) days = 30;
  cfg.logRetentionDays = Math.max(0, days);
  try {
    const configPath = './config.json';
    let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.api_log_retention_days = cfg.logRetentionDays;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    cfg.syncSettingsToDB().catch(e => console.error('[CONFIG] Log retention sync failed:', e));
  } catch (e) { }
  res.json({ status: true, message: `Log retention updated to ${cfg.logRetentionDays === 0 ? 'unlimited' : cfg.logRetentionDays + ' days'}`, retention_days: cfg.logRetentionDays });
});

// GET /api/v3/admin/logs/count
router.get('/count', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const [rows] = await cfg.dbPool.query(`
      SELECT COUNT(*) as total_logs, COUNT(DISTINCT api_key) as unique_keys, MIN(created_at) as oldest_log, MAX(created_at) as newest_log,
      ROUND(SUM(CHAR_LENGTH(api_logs.request_data) + CHAR_LENGTH(api_logs.response_data)) / 1024 / 1024, 2) as size_mb FROM api_logs
    `);
    res.json({ status: true, data: rows[0] });
  } catch (err) { res.json({ status: false, error: err.message }); }
});

// GET /api/v3/admin/logs/per-key
router.get('/per-key', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const [rows] = await cfg.dbPool.query(`
      SELECT api_key, COUNT(*) as log_count, ROUND(SUM(CHAR_LENGTH(request_data) + CHAR_LENGTH(response_data)) / 1024, 2) as size_kb, MAX(created_at) as last_log
      FROM api_logs GROUP BY api_key ORDER BY log_count DESC
    `);
    res.json({ status: true, data: rows });
  } catch (err) { res.json({ status: false, error: err.message }); }
});

// GET /api/v3/admin/logs/recent
router.get('/recent', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    const limitRaw = parseInt(req.query.limit) || 20;
    const limit = Math.max(1, Math.min(50, limitRaw));
    const type = (req.query.type || '').toString().toLowerCase().trim();
    const allowedTypes = new Set(['bank', 'ewallet', 'whatsapp', 'nik']);
    let query = `SELECT l.id, l.api_key, l.ip_address, l.endpoint, l.request_data, l.response_data, l.status_code, l.response_time, l.log_type, l.is_success, l.created_at, l.charged_amount, k.id AS user_id, k.name AS user_name
                 FROM api_logs l
                 LEFT JOIN api_keys k ON k.api_key = l.api_key`;
    const values = [];
    if (type && allowedTypes.has(type)) { query += ` WHERE l.log_type = ? `; values.push(type); }
    query += ` ORDER BY l.id DESC LIMIT ? `;
    values.push(limit);
    const [rows] = await cfg.dbPool.query(query, values);
    const data = (rows || []).map(r => {
      const reqData = String(r.request_data || ''); const resData = String(r.response_data || '');
      return { id: r.id, api_key: r.api_key, user_id: r.user_id, user_name: r.user_name, ip_address: r.ip_address, endpoint: r.endpoint, status_code: r.status_code, response_time: r.response_time, log_type: r.log_type, is_success: r.is_success, created_at: r.created_at, charged_amount: Number(r.charged_amount || 0), request_data: reqData.length > 1200 ? reqData.slice(0, 1200) + '...' : reqData, response_data: resData.length > 1200 ? resData.slice(0, 1200) + '...' : resData };
    });
    res.json({ status: true, data });
  } catch (err) { res.status(500).json({ status: false, error: err.message }); }
});

// POST /api/v3/admin/logs/delete-apikey
router.post('/delete-apikey', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const apikey = req.body.api_key;
  if (!apikey) return res.status(400).json({ status: false, error: 'api_key required' });
  try {
    const [result] = await cfg.dbPool.query("DELETE FROM api_logs WHERE api_key = ?", [apikey]);
    res.json({ status: true, message: `Deleted ${result.affectedRows} logs for API key`, deleted_count: result.affectedRows });
  } catch (err) { res.json({ status: false, error: err.message }); }
});

// POST /api/v3/admin/logs/delete-all
router.post('/delete-all', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  if (req.body.confirm !== true) return res.status(400).json({ status: false, error: 'Confirmation required (confirm: true)' });
  try {
    const [result] = await cfg.dbPool.query("DELETE FROM api_logs WHERE is_success = 0");
    statsCache.del('dashboard_stats');
    res.json({ status: true, message: `Failed logs deleted (Successful logs preserved for cache)`, deleted_count: result.affectedRows });
  } catch (err) { res.json({ status: false, error: err.message }); }
});

// POST /api/v3/admin/logs/cleanup-now
router.post('/cleanup-now', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  try {
    await cleanupOldLogs();
    res.json({ status: true, message: `Cleanup triggered for logs older than ${cfg.logRetentionDays} days`, retention_days: cfg.logRetentionDays });
  } catch (err) { res.json({ status: false, error: err.message }); }
});

// GET /api/v3/admin/logs/file
router.get('/file', (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const type = req.query.type === 'error' ? 'error.log' : 'combined.log';
  const filePath = path.join(logDir, type);
  if (!fs.existsSync(filePath)) return res.json({ status: false, error: 'Log file not found' });
  try {
    const lines = parseInt(req.query.lines) || 100;
    const content = fs.readFileSync(filePath, 'utf8').split('\n');
    const tail = content.slice(-lines).join('\n');
    res.json({ status: true, file: type, lines, content: tail });
  } catch (err) { res.json({ status: false, error: err.message }); }
});

module.exports = { router, cleanupOldLogs };
