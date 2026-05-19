const express = require('express');
const cfg = require('../lib/config');

const router = express.Router();

async function safeQuery(sql, params = [], fallbackRows = []) {
  try {
    return await cfg.dbPool.query(sql, params);
  } catch (err) {
    if (err && (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_FIELD_ERROR' || String(err.errno) === '1146' || String(err.errno) === '1054')) {
      return [fallbackRows];
    }
    throw err;
  }
}

function ensureAdmin(req, res) {
  if (req.query.key !== cfg.ADMIN_KEY) {
    res.status(401).json({ status: false, error: 'Unauthorized' });
    return false;
  }
  return true;
}

router.get('/summary', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const [topupRows] = await safeQuery(
      `SELECT
         COALESCE(SUM(CASE WHEN LOWER(status) = 'success' THEN amount ELSE 0 END), 0) AS total_topup_success,
         COALESCE(SUM(CASE WHEN LOWER(status) = 'pending' THEN amount ELSE 0 END), 0) AS total_topup_pending,
         COALESCE(SUM(CASE WHEN LOWER(status) = 'expired' THEN amount ELSE 0 END), 0) AS total_topup_expired,
         COUNT(*) AS total_topup_count
       FROM member_topups`,
      [],
      [{ total_topup_success: 0, total_topup_pending: 0, total_topup_expired: 0, total_topup_count: 0 }]
    );
    const [pkgRows] = await safeQuery(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS total_package_paid,
         COUNT(*) AS total_package_invoice
       FROM member_package_invoices`,
      [],
      [{ total_package_paid: 0, total_package_invoice: 0 }]
    );
    let walletRows = [{ wallet_credit: 0, wallet_debit: 0, wallet_debit_today: 0 }];
    // Source utama konsumsi saldo: balance_logs (debit saja).
    // Ini paling presisi terhadap saldo riil user.
    const [balanceDebitRows] = await safeQuery(
      `SELECT
         0 AS wallet_credit,
         COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) AS wallet_debit,
         COALESCE(SUM(CASE WHEN amount < 0 AND DATE(created_at) = CURDATE() THEN ABS(amount) ELSE 0 END), 0) AS wallet_debit_today
       FROM balance_logs`,
      [],
      [{ wallet_credit: 0, wallet_debit: 0, wallet_debit_today: 0 }]
    );
    const [apiDebitRows] = await safeQuery(
      `SELECT
         COALESCE(SUM(CASE WHEN charged_amount > 0 THEN charged_amount ELSE 0 END), 0) AS wallet_debit,
         COALESCE(SUM(CASE WHEN charged_amount > 0 AND DATE(created_at) = CURDATE() THEN charged_amount ELSE 0 END), 0) AS wallet_debit_today
       FROM api_logs`,
      [],
      [{ wallet_debit: 0, wallet_debit_today: 0 }]
    );
    const balanceDebit = (balanceDebitRows && balanceDebitRows[0]) || {};
    const apiDebit = (apiDebitRows && apiDebitRows[0]) || {};
    walletRows = [{
      wallet_credit: 0,
      wallet_debit: Math.max(Number(balanceDebit.wallet_debit || 0), Number(apiDebit.wallet_debit || 0)),
      wallet_debit_today: Math.max(Number(balanceDebit.wallet_debit_today || 0), Number(apiDebit.wallet_debit_today || 0))
    }];

    const [dailyRows] = await safeQuery(
      `SELECT DATE(created_at) AS dt, COALESCE(SUM(CASE WHEN LOWER(status) = 'success' THEN amount ELSE 0 END), 0) AS total
       FROM member_topups
       GROUP BY DATE(created_at)
       ORDER BY dt DESC
       LIMIT 14`,
      [],
      []
    );

    res.json({
      status: true,
      data: {
        topups: topupRows[0] || {},
        packages: pkgRows[0] || {},
        wallet: walletRows[0] || {},
        daily: (dailyRows || []).reverse()
      }
    });
  } catch (err) {
    console.error('[ADMIN][REVENUE][SUMMARY] Error:', err);
    res.status(500).json({ status: false, error: 'Terjadi kesalahan server.' });
  }
});

router.get('/topups', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '100', 10)));
    const [rows] = await safeQuery(
      `SELECT t.id, t.invoice, t.amount, t.fee, t.total_amount, t.method_name, t.status, t.expired_at, t.created_at, t.credited_at,
              m.id as member_id, m.name as member_name, m.whatsapp_number
       FROM member_topups t
       LEFT JOIN member_accounts m ON m.id = t.member_id
       ORDER BY t.id DESC
       LIMIT ?`,
      [limit],
      []
    );
    res.json({ status: true, data: rows || [] });
  } catch (err) {
    console.error('[ADMIN][REVENUE][TOPUPS] Error:', err);
    res.status(500).json({ status: false, error: 'Terjadi kesalahan server.' });
  }
});

module.exports = router;
