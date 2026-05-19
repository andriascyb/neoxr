/**
 * routes/mysql_manager.js
 * MySQL database browser, backup, import, test connection
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const cfg = require('../lib/config');

// =================== HELPER ===================
function splitSqlStatements(sqlText) {
  const out = [];
  let buf = '';
  let inSingle = false, inDouble = false, inBacktick = false, escape = false;
  for (let i = 0; i < sqlText.length; i++) {
    const ch = sqlText[i];
    if (escape) { buf += ch; escape = false; continue; }
    if (ch === '\\') { buf += ch; if (inSingle || inDouble) escape = true; continue; }
    if (!inDouble && !inBacktick && ch === "'") { inSingle = !inSingle; buf += ch; continue; }
    if (!inSingle && !inBacktick && ch === '"') { inDouble = !inDouble; buf += ch; continue; }
    if (!inSingle && !inDouble && ch === '`') { inBacktick = !inBacktick; buf += ch; continue; }
    if (!inSingle && !inDouble && !inBacktick && ch === ';') { const stmt = buf.trim(); if (stmt) out.push(stmt); buf = ''; continue; }
    buf += ch;
  }
  const last = buf.trim(); if (last) out.push(last);
  return out;
}

async function validateSqlForImport(sqlText) {
  const forbidden = /\b(DROP|TRUNCATE|ALTER|GRANT|REVOKE|CREATE\s+DATABASE|USE|SET\s+GLOBAL|SET\s+PASSWORD)\b/i;
  if (forbidden.test(sqlText)) return { ok: false, error: 'SQL mengandung statement terlarang (DROP/TRUNCATE/ALTER/GRANT/USE/...).' };
  const [tables] = await cfg.dbPool.query(`SHOW TABLES FROM \`${cfg.mysqlConfig.database}\``);
  const allowedTables = new Set(tables.map(t => Object.values(t)[0]));
  const statements = splitSqlStatements(sqlText);
  const touched = new Set();
  for (let i = 0; i < statements.length; i++) {
    const s = statements[i].trim();
    const upper = s.substring(0, 30).toUpperCase();
    let m = null;
    if (/^CREATE\s+TABLE/i.test(s)) {
      m = s.match(/CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?`([^`]+)`/i);
      if (!m) return { ok: false, error: `CREATE TABLE tidak valid (statement #${i + 1}).` };
      if (!allowedTables.has(m[2])) return { ok: false, error: `Tabel tidak diizinkan: ${m[2]}` };
      touched.add(m[2]); continue;
    }
    if (/^INSERT\s+INTO/i.test(s)) {
      m = s.match(/INSERT\s+INTO\s+`([^`]+)`/i);
      if (!m) return { ok: false, error: `INSERT INTO tidak valid (statement #${i + 1}).` };
      if (!allowedTables.has(m[1])) return { ok: false, error: `Tabel tidak diizinkan: ${m[1]}` };
      touched.add(m[1]); continue;
    }
    return { ok: false, error: `Statement tidak diizinkan (statement #${i + 1}): ${upper}` };
  }
  return { ok: true, statements_count: statements.length, tables: Array.from(touched) };
}

// =================== ROUTES ===================
router.get('/info', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  let conn;
  try {
    conn = await cfg.dbPool.getConnection();
    const [rows] = await conn.query("SELECT VERSION() as version, DATABASE() as db_name, CURRENT_USER as user_info");
    res.json({ status: true, data: { version: rows[0].version, database: rows[0].db_name, user: rows[0].user_info, config: { host: cfg.mysqlConfig.host, port: cfg.mysqlConfig.port, database: cfg.mysqlConfig.database } } });
  } catch (err) { res.json({ status: false, error: err.message }); }
  finally { if (conn) conn.release(); }
});

router.get('/tables', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const [tableInfos] = await cfg.dbPool.query(`SELECT TABLE_NAME as name, ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb, CREATE_TIME as created FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY data_length DESC`, [cfg.mysqlConfig.database]);
    const tablesWithCounts = await Promise.all(tableInfos.map(async (t) => {
      try {
        const [countResult] = await cfg.dbPool.query(`SELECT COUNT(*) as exact_count FROM \`${t.name}\``);
        return { name: t.name, rows: countResult[0].exact_count, size_mb: t.size_mb, created: t.created };
      } catch (e) { return { ...t, rows: 0 }; }
    }));
    const totalSize = tablesWithCounts.reduce((sum, t) => sum + parseFloat(t.size_mb || 0), 0);
    res.json({ status: true, data: { total_size_mb: totalSize.toFixed(2), tables: tablesWithCounts } });
  } catch (err) { res.json({ status: false, error: err.message }); }
});

router.get('/table/:tableName', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const tableName = req.params.tableName;
  const page = parseInt(req.query.page) || 1;
  const limit = 100;
  const offset = (page - 1) * limit;
  try {
    const [columns] = await cfg.dbPool.query(`DESCRIBE \`${tableName}\``);
    const [pks] = await cfg.dbPool.query(`SHOW KEYS FROM \`${tableName}\` WHERE Key_name = 'PRIMARY'`);
    const primaryKey = pks.length > 0 ? pks[0].Column_name : null;
    const [data] = await cfg.dbPool.query(`SELECT * FROM \`${tableName}\` ORDER BY 1 DESC LIMIT ? OFFSET ?`, [limit, offset]);
    const [countResult] = await cfg.dbPool.query(`SELECT COUNT(*) as total FROM \`${tableName}\``);
    const totalRows = countResult[0].total;
    res.json({ status: true, data: { tableName, columns, primaryKey, rows: data, pagination: { current: page, total: Math.ceil(totalRows / limit), totalRows } } });
  } catch (err) { res.json({ status: false, error: err.message }); }
});

router.post('/table/:tableName/update', async (req, res) => {
  if (req.body.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const { pk_column, pk_value, data } = req.body;
  if (!pk_column || pk_value === undefined || !data) return res.status(400).json({ status: false, error: 'Missing parameters for update.' });
  try {
    const sets = Object.keys(data).map(k => `\`${k}\` = ?`).join(', ');
    const values = [...Object.values(data), pk_value];
    await cfg.dbPool.query(`UPDATE \`${req.params.tableName}\` SET ${sets} WHERE \`${pk_column}\` = ?`, values);
    res.json({ status: true, message: 'Row updated successfully.' });
  } catch (err) { res.json({ status: false, error: err.message }); }
});

router.post('/table/:tableName/delete', async (req, res) => {
  if (req.body.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const { pk_column, pk_value } = req.body;
  if (!pk_column || pk_value === undefined) return res.status(400).json({ status: false, error: 'Missing primary key info for deletion.' });
  try {
    await cfg.dbPool.query(`DELETE FROM \`${req.params.tableName}\` WHERE \`${pk_column}\` = ?`, [pk_value]);
    res.json({ status: true, message: 'Row deleted successfully.' });
  } catch (err) { res.json({ status: false, error: err.message }); }
});

router.get('/backup', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup_${timestamp}.sql`;
    const backupDir = path.resolve('./backups');
    const backupPath = path.join(backupDir, backupName);
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const [tables] = await cfg.dbPool.query(`SHOW TABLES FROM \`${cfg.mysqlConfig.database}\``);
    const escapeValue = (val) => {
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'number') return Number.isFinite(val) ? String(val) : 'NULL';
      if (typeof val === 'boolean') return val ? '1' : '0';
      if (val instanceof Date) { const iso = new Date(val.getTime() - (val.getTimezoneOffset() * 60000)).toISOString().slice(0, 19).replace('T', ' '); return `'${iso.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`; }
      const s = String(val);
      return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\u0000/g, '')}'`;
    };
    let sql = `-- APIV3 MySQL Backup\n-- Database: ${cfg.mysqlConfig.database}\n-- Created: ${new Date().toISOString()}\n\n`;
    for (const tableRecord of tables) {
      const tableName = Object.values(tableRecord)[0];
      try {
        const [createRows] = await cfg.dbPool.query(`SHOW CREATE TABLE \`${tableName}\``);
        const createSqlRaw = createRows && createRows[0] ? (createRows[0]['Create Table'] || '') : '';
        if (createSqlRaw) {
          sql += `-- Table structure for \`${tableName}\`\n${createSqlRaw.replace(/^CREATE TABLE\s+`/i, 'CREATE TABLE IF NOT EXISTS `')};\n\n`;
        }
        const [rows] = await cfg.dbPool.query(`SELECT * FROM \`${tableName}\``);
        if (rows && rows.length) {
          const cols = Object.keys(rows[0]);
          const colSql = cols.map(c => `\`${c}\``).join(', ');
          sql += `-- Data for \`${tableName}\`\n`;
          const chunkSize = 200;
          for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize);
            const valuesSql = chunk.map(r => '(' + cols.map(c => escapeValue(r[c])).join(', ') + ')').join(',\n');
            sql += `INSERT INTO \`${tableName}\` (${colSql}) VALUES\n${valuesSql};\n\n`;
          }
        }
      } catch (e) { }
    }
    fs.writeFileSync(backupPath, sql, 'utf8');
    res.json({ status: true, message: 'Backup SQL created successfully', file: backupName, size_kb: (fs.statSync(backupPath).size / 1024).toFixed(2), download_url: `/api/v3/admin/mysql/backup/download?key=${encodeURIComponent(cfg.ADMIN_KEY)}&file=${encodeURIComponent(backupName)}` });
  } catch (err) { res.json({ status: false, error: err.message }); }
});

router.get('/backup/download', (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).send('Unauthorized');
  try {
    const file = String(req.query.file || '');
    if (!/^[a-zA-Z0-9._-]+\.sql$/.test(file)) return res.status(400).send('Invalid file');
    const backupDir = path.resolve('./backups');
    const filePath = path.resolve(path.join(backupDir, file));
    if (!filePath.startsWith(backupDir)) return res.status(400).send('Invalid path');
    if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
    res.setHeader('Content-Type', 'application/sql; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${file}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) { res.status(500).send('Error: ' + err.message); }
});

router.get('/backups', (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const backupDir = path.resolve('./backups');
    if (!fs.existsSync(backupDir)) return res.json({ status: true, data: [] });
    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.sql')).map(f => ({ name: f, size_kb: (fs.statSync(`${backupDir}/${f}`).size / 1024).toFixed(2), created: fs.statSync(`${backupDir}/${f}`).mtime })).sort((a, b) => new Date(b.created) - new Date(a.created));
    res.json({ status: true, data: files });
  } catch (err) { res.json({ status: false, error: err.message }); }
});

router.post('/import', express.text({ type: '*/*', limit: '10mb' }), async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    const sqlText = String(req.body || '');
    if (!sqlText.trim()) return res.status(400).json({ status: false, error: 'Empty SQL' });
    const validation = await validateSqlForImport(sqlText);
    if (!validation.ok) return res.status(400).json({ status: false, error: validation.error });
    if (String(req.query.dry_run || '') === '1') return res.json({ status: true, message: 'Valid', ...validation });
    const statements = splitSqlStatements(sqlText);
    let executed = 0;
    for (const stmt of statements) { await cfg.dbPool.query(stmt); executed++; }
    res.json({ status: true, message: 'Import berhasil', executed, tables: validation.tables });
  } catch (err) { res.status(500).json({ status: false, error: err.message }); }
});

router.post('/import-file', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ status: false, error: 'Unauthorized' });
  try {
    const file = String((req.body && req.body.file) || '');
    if (!/^[a-zA-Z0-9._-]+\.sql$/.test(file)) return res.status(400).json({ status: false, error: 'Invalid file' });
    const backupDir = path.resolve('./backups');
    const filePath = path.resolve(path.join(backupDir, file));
    if (!filePath.startsWith(backupDir)) return res.status(400).json({ status: false, error: 'Invalid path' });
    if (!fs.existsSync(filePath)) return res.status(404).json({ status: false, error: 'Not found' });
    const sqlText = fs.readFileSync(filePath, 'utf8');
    const validation = await validateSqlForImport(sqlText);
    if (!validation.ok) return res.status(400).json({ status: false, error: validation.error });
    if (!!(req.body && req.body.dry_run)) return res.json({ status: true, message: 'Valid', ...validation });
    const statements = splitSqlStatements(sqlText);
    let executed = 0;
    for (const stmt of statements) { await cfg.dbPool.query(stmt); executed++; }
    res.json({ status: true, message: 'Import berhasil', executed, tables: validation.tables });
  } catch (err) { res.status(500).json({ status: false, error: err.message }); }
});

router.get('/test', async (req, res) => {
  if (req.query.key !== cfg.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  let conn;
  try {
    conn = await cfg.dbPool.getConnection();
    const [rows] = await conn.query("SELECT 1 as connected");
    res.json({ status: true, connected: rows[0].connected === 1, config: { host: cfg.mysqlConfig.host, database: cfg.mysqlConfig.database } });
  } catch (err) { res.json({ status: false, connected: false, error: 'Connection pool failed: ' + err.message }); }
  finally { if (conn) conn.release(); }
});

module.exports = router;
