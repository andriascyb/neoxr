const fs = require('fs');
const cfg = require('./config');

let running = false;
let timer = null;
const inMemoryStatus = {
  bank_server3: { last_run_at: null, updated: 0, failed: 0, message: '' },
  ewallet_server7: { last_run_at: null, updated: 0, failed: 0, message: '' }
};

function parseCookieMap(cookieString) {
  const out = {};
  const src = String(cookieString || '');
  if (!src) return out;
  src.split(';').forEach((part) => {
    const item = String(part || '').trim();
    const sep = item.indexOf('=');
    if (sep < 1) return;
    const key = item.slice(0, sep).trim();
    const val = item.slice(sep + 1).trim();
    if (!key) return;
    out[key] = val;
  });
  return out;
}

function toCookieString(cookieMap) {
  return Object.entries(cookieMap)
    .filter(([k, v]) => String(k || '').trim() && String(v || '').trim())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

function getSetCookieLines(headers) {
  if (!headers) return [];
  try {
    if (typeof headers.getSetCookie === 'function') {
      const rows = headers.getSetCookie();
      if (Array.isArray(rows) && rows.length) return rows;
    }
  } catch (_) {}
  const single = headers.get ? headers.get('set-cookie') : '';
  return single ? [single] : [];
}

function parseSetCookieMap(lines) {
  const out = {};
  for (const line of (Array.isArray(lines) ? lines : [])) {
    const first = String(line || '').split(';')[0] || '';
    const sep = first.indexOf('=');
    if (sep < 1) continue;
    const key = first.slice(0, sep).trim();
    const val = first.slice(sep + 1).trim();
    if (!key || !val) continue;
    out[key] = val;
  }
  return out;
}

function originFromEndpoint(endpoint) {
  try {
    const u = new URL(String(endpoint || '').trim());
    return `${u.protocol}//${u.host}/`;
  } catch (_) {
    return '';
  }
}

function defaultRefreshUrlFromEndpoint(endpoint) {
  try {
    const u = new URL(String(endpoint || '').trim());
    const p = String(u.pathname || '/');
    if (/\/v2\/topup_merchant_result_ajax-pin$/i.test(p)) {
      u.pathname = p.replace(/\/topup_merchant_result_ajax-pin$/i, '/main-tpl');
      u.search = '';
      u.hash = '';
      return u.toString();
    }
    if (/\/v2\/ppob_result_ajax-pin$/i.test(p)) {
      u.pathname = p.replace(/\/ppob_result_ajax-pin$/i, '/main-tpl');
      u.search = '';
      u.hash = '';
      return u.toString();
    }
    return originFromEndpoint(endpoint);
  } catch (_) {
    return '';
  }
}

async function refreshSingleCookieTarget(target, timeoutMs) {
  const refreshUrl = String(target.refresh_url || '').trim() || defaultRefreshUrlFromEndpoint(target.endpoint);
  if (!refreshUrl) throw new Error('refresh_url kosong');
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), Math.max(2000, Number(timeoutMs) || 8000));
  try {
    const res = await fetch(refreshUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      redirect: 'follow',
      signal: controller.signal
    });
    const setCookieLines = getSetCookieLines(res.headers);
    const newCookieMap = parseSetCookieMap(setCookieLines);
    if (!Object.keys(newCookieMap).length) {
      const err = new Error(`Set-Cookie tidak ditemukan (HTTP ${res.status})`);
      err.code = 'NO_SET_COOKIE';
      throw err;
    }
    const oldCookieMap = parseCookieMap(target.cookie);
    const merged = { ...oldCookieMap, ...newCookieMap };
    const mergedString = toCookieString(merged);
    if (!mergedString) throw new Error('Cookie hasil refresh kosong');
    return {
      cookie: mergedString,
      refresh_url_used: refreshUrl,
      updated_keys: Object.keys(newCookieMap),
      http_status: res.status
    };
  } finally {
    clearTimeout(to);
  }
}

function getServiceDef(serviceKey) {
  if (serviceKey === 'bank_server3') {
    return {
      serviceKey,
      enabledKey: 'bank_server3_cookie_auto_refresh',
      hoursKey: 'bank_server3_cookie_refresh_hours',
      poolEnabledKey: 'bank_server3_pool_enabled',
      poolKey: 'bank_server3_pool',
      singleEndpointKey: 'bank_server3_base_url',
      singleCookieKey: 'bank_server3_cookie'
    };
  }
  if (serviceKey === 'ewallet_server7') {
    return {
      serviceKey,
      enabledKey: 'ewallet_server7_cookie_auto_refresh',
      hoursKey: 'ewallet_server7_cookie_refresh_hours',
      poolEnabledKey: 'ewallet_server7_pool_enabled',
      poolKey: 'ewallet_server7_pool',
      singleEndpointKey: 'ewallet_server7_base_url',
      singleCookieKey: 'ewallet_server7_cookie'
    };
  }
  return null;
}

async function persistConfig() {
  fs.writeFileSync(cfg.CONFIG_FILE_PATH, JSON.stringify(cfg.appConfig, null, 2));
  await cfg.syncSettingsToDB();
}

async function refreshServicePool(serviceKey, options = {}) {
  const def = getServiceDef(serviceKey);
  if (!def) throw new Error('Service pool tidak dikenal');
  const force = !!options.force;
  const aliasFilter = String(options.alias || '').trim().toLowerCase();
  const now = Date.now();
  const enabled = String(cfg.appConfig[def.enabledKey] || 'off') === 'on';
  const refreshHours = Math.max(1, parseInt(cfg.appConfig[def.hoursKey], 10) || 24);
  const timeoutMs = Math.max(2000, parseInt(cfg.appConfig.pool_cookie_refresh_timeout_ms, 10) || 8000);

  if (!enabled && !force) {
    return { status: true, skipped: true, message: `${serviceKey} auto refresh OFF` };
  }

  const poolEnabled = String(cfg.appConfig[def.poolEnabledKey] || 'off') === 'on';
  const rawPool = Array.isArray(cfg.appConfig[def.poolKey]) ? cfg.appConfig[def.poolKey] : [];
  const poolTargets = rawPool
    .map((row, idx) => ({
      row,
      idx,
      alias: String(row.id || `${serviceKey.replace('_', '')}${String.fromCharCode(97 + idx)}`).trim().toLowerCase(),
      endpoint: String(row.endpoint || '').trim(),
      cookie: String(row.cookie || '').trim(),
      status: String(row.status || 'on').toLowerCase()
    }))
    .filter((t) => t.status === 'on' && t.endpoint && t.cookie);

  let targets = [];
  if (poolEnabled && poolTargets.length) {
    targets = poolTargets;
  } else {
    const endpoint = String(cfg.appConfig[def.singleEndpointKey] || '').trim();
    const cookie = String(cfg.appConfig[def.singleCookieKey] || '').trim();
    if (endpoint && cookie) {
      targets = [{ row: null, idx: -1, alias: serviceKey, endpoint, cookie, status: 'on' }];
    }
  }
  if (aliasFilter) targets = targets.filter((t) => t.alias === aliasFilter);
  if (!targets.length) return { status: true, skipped: true, message: `${serviceKey} tidak punya target aktif` };

  const changes = [];
  const failures = [];
  const skipped = [];
  for (const t of targets) {
    const lastAt = t.row ? (t.row.last_cookie_refresh_at || '') : String(cfg.appConfig[`${serviceKey}_cookie_last_refresh_at`] || '');
    const lastTs = lastAt ? Date.parse(lastAt) : 0;
    const due = !lastTs || ((now - lastTs) >= refreshHours * 3600 * 1000);
    if (!due && !force) continue;
    try {
      const refreshed = await refreshSingleCookieTarget(t, timeoutMs);
      const stamp = new Date().toISOString();
      if (t.row) {
        t.row.cookie = refreshed.cookie;
        t.row.last_cookie_refresh_at = stamp;
        t.row.last_cookie_refresh_status = 'ok';
        t.row.last_cookie_refresh_error = '';
      } else {
        cfg.appConfig[def.singleCookieKey] = refreshed.cookie;
        cfg.appConfig[`${serviceKey}_cookie_last_refresh_at`] = stamp;
        cfg.appConfig[`${serviceKey}_cookie_last_refresh_status`] = 'ok';
        cfg.appConfig[`${serviceKey}_cookie_last_refresh_error`] = '';
      }
      changes.push({ alias: t.alias, status: 'ok', updated_keys: refreshed.updated_keys, refresh_url_used: refreshed.refresh_url_used });
    } catch (err) {
      const msg = err && err.message ? err.message : 'refresh_failed';
      const stamp = new Date().toISOString();
      const errCode = String((err && err.code) || '').toUpperCase();
      if (t.row) {
        t.row.last_cookie_refresh_at = stamp;
        t.row.last_cookie_refresh_status = (errCode === 'NO_SET_COOKIE') ? 'no_set_cookie' : 'error';
        t.row.last_cookie_refresh_error = msg;
      } else {
        cfg.appConfig[`${serviceKey}_cookie_last_refresh_at`] = stamp;
        cfg.appConfig[`${serviceKey}_cookie_last_refresh_status`] = (errCode === 'NO_SET_COOKIE') ? 'no_set_cookie' : 'error';
        cfg.appConfig[`${serviceKey}_cookie_last_refresh_error`] = msg;
      }
      if (errCode === 'NO_SET_COOKIE') {
        skipped.push({ alias: t.alias, status: 'no_set_cookie', error: msg });
      } else {
        failures.push({ alias: t.alias, status: 'error', error: msg });
      }
    }
  }

  if (changes.length || failures.length || skipped.length) {
    await persistConfig();
  }

  inMemoryStatus[serviceKey] = {
    last_run_at: new Date().toISOString(),
    updated: changes.length,
    failed: failures.length,
    message: (changes.length || failures.length || skipped.length)
      ? `updated=${changes.length}, failed=${failures.length}, skipped=${skipped.length}`
      : 'no_due_target'
  };

  return {
    status: true,
    service: serviceKey,
    updated: changes.length,
    failed: failures.length,
    skipped: skipped.length,
    changes,
    failures,
    skipped_targets: skipped
  };
}

async function runCycle(force = false) {
  if (running) return;
  running = true;
  try {
    await refreshServicePool('bank_server3', { force });
    await refreshServicePool('ewallet_server7', { force });
  } catch (err) {
    console.error('[COOKIE-REFRESH] Cycle error:', err.message);
  } finally {
    running = false;
  }
}

function initPoolCookieRefresher() {
  const checkMinutes = Math.max(1, parseInt(cfg.appConfig.pool_cookie_refresh_check_minutes, 10) || 10);
  if (timer) clearInterval(timer);
  timer = setInterval(() => { runCycle(false); }, checkMinutes * 60 * 1000);
  if (typeof timer.unref === 'function') timer.unref();
}

function getStatus() {
  return {
    running,
    config: {
      check_minutes: Math.max(1, parseInt(cfg.appConfig.pool_cookie_refresh_check_minutes, 10) || 10),
      timeout_ms: Math.max(2000, parseInt(cfg.appConfig.pool_cookie_refresh_timeout_ms, 10) || 8000),
      bank_server3_enabled: String(cfg.appConfig.bank_server3_cookie_auto_refresh || 'off'),
      bank_server3_hours: Math.max(1, parseInt(cfg.appConfig.bank_server3_cookie_refresh_hours, 10) || 24),
      ewallet_server7_enabled: String(cfg.appConfig.ewallet_server7_cookie_auto_refresh || 'off'),
      ewallet_server7_hours: Math.max(1, parseInt(cfg.appConfig.ewallet_server7_cookie_refresh_hours, 10) || 24)
    },
    services: inMemoryStatus
  };
}

module.exports = {
  initPoolCookieRefresher,
  refreshServicePool,
  runCycle,
  getStatus
};
