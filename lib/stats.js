/**
 * lib/stats.js
 * API stats, historical data, request logging, persistent cache
 */

const NodeCache = require('node-cache');
const { performance } = require('perf_hooks');
const cfg = require('./config');
const redisCache = require('./redis_cache');

const statsCache = new NodeCache({ stdTTL: 3 });
let historicalStatsCache = { data: null, lastUpdate: 0 };

function getLocalDate() {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const jkt = new Date(utc + (3600000 * 7));
  return `${jkt.getFullYear()}-${String(jkt.getMonth() + 1).padStart(2, '0')}-${String(jkt.getDate()).padStart(2, '0')}`;
}

async function getStatsFromDB() {
  const cached = statsCache.get('dashboard_stats');
  if (cached) return cached;

  const today = getLocalDate();
  const stats = {
    date: today,
    bank: { today: { valid: 0, failed: 0, total: 0 }, all: { valid: 0, failed: 0, total: 0 } },
    ewallet: { today: { valid: 0, failed: 0, total: 0 }, all: { valid: 0, failed: 0, total: 0 } },
    nik: { today: { valid: 0, failed: 0, total: 0 }, all: { valid: 0, failed: 0, total: 0 } },
    whatsapp: { today: { valid: 0, failed: 0, total: 0 }, all: { valid: 0, failed: 0, total: 0 } },
    games: { today: { valid: 0, failed: 0, total: 0 }, all: { valid: 0, failed: 0, total: 0 } },
    bpjs: { today: { valid: 0, failed: 0, total: 0 }, all: { valid: 0, failed: 0, total: 0 } },
    pln: { today: { valid: 0, failed: 0, total: 0 }, all: { valid: 0, failed: 0, total: 0 } },
    ai: { today: { valid: 0, failed: 0, total: 0 }, all: { valid: 0, failed: 0, total: 0 } }
  };

  try {
    const [rows] = await cfg.dbPool.query(`
      SELECT 'today' as period, log_type, is_success, COUNT(*) as count 
      FROM api_logs WHERE DATE(created_at) = ? GROUP BY log_type, is_success
      UNION ALL
      SELECT 'all' as period, log_type, is_success, COUNT(*) as count 
      FROM api_logs GROUP BY log_type, is_success
    `, [today]);

    rows.forEach(r => {
      if (stats[r.log_type]) {
        const key = r.is_success ? 'valid' : 'failed';
        stats[r.log_type][r.period][key] += r.count;
        stats[r.log_type][r.period].total += r.count;
      }
    });

    statsCache.set('dashboard_stats', stats);
    return stats;
  } catch (err) {
    console.error('[STATS] DB Error:', err);
    return stats;
  }
}

async function getHistoricalStats() {
  const now = Date.now();
  if (historicalStatsCache.data && (now - historicalStatsCache.lastUpdate < 300000)) {
    return historicalStatsCache.data;
  }

  try {
    const [rows] = await cfg.dbPool.query(`
      SELECT 
        DATE(created_at) as date,
        is_success,
        COUNT(*) as count
      FROM api_logs 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(created_at), is_success
      ORDER BY date ASC
    `);

    const labels = [];
    const successData = [];
    const failedData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      labels.push(ds);

      const s = rows.find(r => r.date.toISOString().split('T')[0] === ds && r.is_success === 1);
      const f = rows.find(r => r.date.toISOString().split('T')[0] === ds && r.is_success === 0);

      successData.push(s ? s.count : 0);
      failedData.push(f ? f.count : 0);
    }

    const result = { labels, success: successData, failed: failedData };
    historicalStatsCache = { data: result, lastUpdate: now };
    return result;
  } catch (err) {
    console.error('[STATS-HIST] Error:', err);
    return { labels: [], success: [], failed: [] };
  }
}

async function checkPersistentCache(type, target, code = null) {
  const normalizedType = String(type || '').toLowerCase();
  const targetNumber = String(target || '').trim();
  const codeValue = String(code || '').trim().toLowerCase();

  if (redisCache.isRedisEnabled()) {
    const redisKey = redisCache.buildValidationKey(normalizedType, targetNumber, codeValue);
    const redisHit = await redisCache.getJSON(redisKey);
    if (redisHit && redisHit.status === true) {
      return redisHit;
    }
  }

  if (parseInt(cfg.appConfig.db_cache_enabled) !== 1) return null;

  try {
    let query = "";
    let values = [];

    if (normalizedType === 'whatsapp') {
      query = "SELECT response_data FROM api_logs WHERE log_type = 'whatsapp' AND is_success = 1 AND request_data LIKE ? ORDER BY id DESC LIMIT 1";
      values = [`%${targetNumber}%`];
    } else if (normalizedType === 'nik') {
      query = "SELECT response_data FROM api_logs WHERE log_type = 'nik' AND is_success = 1 AND request_data LIKE ? ORDER BY id DESC LIMIT 1";
      values = [`%${targetNumber}%`];
    } else if (normalizedType === 'bpjs' || normalizedType === 'pln') {
      query = "SELECT response_data FROM api_logs WHERE log_type = ? AND is_success = 1 AND request_data LIKE ? ORDER BY id DESC LIMIT 1";
      values = [normalizedType, `%${targetNumber}%`];
    } else {
      query = "SELECT response_data FROM api_logs WHERE log_type = ? AND is_success = 1 AND request_data LIKE ? AND request_data LIKE ? ORDER BY id DESC LIMIT 1";
      values = [normalizedType, `%${targetNumber}%`, `%${codeValue}%`];
    }

    const [rows] = await cfg.dbPool.query(query, values);
    if (rows && rows.length > 0) {
      try {
        const data = JSON.parse(rows[0].response_data);
        if (data && data.status === true) {
          if (redisCache.isRedisEnabled()) {
            const redisKey = redisCache.buildValidationKey(normalizedType, targetNumber, codeValue);
            await redisCache.setJSON(redisKey, data, Number(cfg.appConfig.redis_ttl_seconds || cfg.appConfig.cache_time || 300));
          }
          return data;
        }
      } catch (e) { }
    }
  } catch (err) { }
  return null;
}

async function queueLog(req, type, isSuccess, resData, statusCode, startTime) {
  if (!['bank', 'ewallet', 'nik', 'whatsapp', 'games', 'bpjs', 'pln', 'ai'].includes(type)) return;

  const responseTime = Math.round(performance.now() - (startTime || performance.now()));
  const params = req.method === 'POST' ? req.body : req.query;
  const apikey = (req.user && req.user.api_key) ? req.user.api_key : (params.api_key || params.apikey || 'no_key');

  try {
    const chargedAmount = Number(req && req.__charged_amount ? req.__charged_amount : 0);
    const query = "INSERT INTO api_logs (api_key, ip_address, endpoint, request_data, response_data, status_code, response_time, log_type, is_success, charged_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const values = [
      apikey,
      req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      req.path,
      JSON.stringify(params),
      JSON.stringify(resData),
      statusCode || 200,
      responseTime,
      type,
      isSuccess ? 1 : 0,
      Number.isFinite(chargedAmount) ? chargedAmount : 0
    ];
    await cfg.dbPool.query(query, values);

    if (isSuccess && resData && resData.status === true && redisCache.isRedisEnabled()) {
      const code = String(params.bank_code || params.ewallet_code || params.code || params.bankCode || '').trim().toLowerCase();
      const number = String(params.account_number || params.accountNumber || params.phone_number || params.number || params.nomor || '').replace(/[^0-9]/g, '');
      const nik = String(params.nik || '').replace(/[^0-9]/g, '');
      const logType = String(type || '').toLowerCase();
      let target = '';
      if (logType === 'nik') target = nik;
      else if (logType === 'whatsapp') target = number;
      else target = number;
      if (target) {
        const redisKey = redisCache.buildValidationKey(logType, target, code);
        await redisCache.setJSON(redisKey, resData, Number(cfg.appConfig.redis_ttl_seconds || cfg.appConfig.cache_time || 300));
      }
    }
  } catch (err) {
    console.error('[MYSQL] Error saving real-time log:', err.sqlMessage || err.message || err);
  }
}

module.exports = {
  statsCache,
  getStatsFromDB,
  getHistoricalStats,
  checkPersistentCache,
  queueLog,
  getLocalDate
};
