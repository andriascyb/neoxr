module.exports = function renderAdminScripts(ctx = {}) {
  with (ctx) {
    const shouldLoadSettingsExtras = activePage === 'settings' || activePage === 'members' || activePage === 'revenue' || activePage === 'redis-cache';
    const extraScripts = shouldLoadSettingsExtras ? EXTRA_ADMIN_SCRIPTS : '';
    return `
/* ─── saveSettings: kNotify primary, Bootstrap Toast fallback ─── */
window.saveSettings = function(e) {
  e.preventDefault();
  var form = (e && e.target && e.target.tagName === 'FORM') ? e.target : document.getElementById('settings-form');
  if (!form) { if (window.kNotify) { kNotify.error('Form pengaturan tidak ditemukan.'); } else { alert('Form pengaturan tidak ditemukan.'); } return; }
  var btn = form.querySelector('button[type="submit"]');
  var origHTML = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
  }
  fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest' }, body: new URLSearchParams(new FormData(form)).toString() })
    .then(function(r) {
      if (r.ok) {
        if (window.kNotify) {
          kNotify.success('Pengaturan berhasil disimpan!');
        } else {
          var toastEl = document.getElementById('settings-toast');
          if (toastEl && window.bootstrap) new bootstrap.Toast(toastEl, { delay: 3000 }).show();
        }
      } else {
        if (window.kNotify) { kNotify.error('Gagal menyimpan. Status: ' + r.status); }
        else { alert('Gagal menyimpan pengaturan. Status: ' + r.status); }
      }
    })
    .catch(function(err) {
      if (window.kNotify) { kNotify.error('Error: ' + (err && err.message || err)); }
      else { alert('Error: ' + (err && err.message || err)); }
    })
    .finally(function() { if (btn) { btn.disabled = false; btn.innerHTML = origHTML; } });
};
window.syncDB = function() {
  log('Syncing MySQL cache...');
  fetch('/admin/sync-db?key=' + encodeURIComponent(window.__ADMIN_KEY__ || '')).then(r=>r.json()).then(function(d) {
    if (window.kNotify) { kNotify.success(d.message || 'Cache database di-reset.'); }
    else { alert(d.message); }
    log('DB Sync OK');
  }).catch(function(err) {
    if (window.kNotify) { kNotify.error('Sync gagal: ' + (err && err.message || err)); }
    else { alert('Sync gagal: ' + (err && err.message || err)); }
  });
};
window.log = function(m) {
  const el = document.getElementById('browser-logs');
  if(el) el.innerHTML = (m + '<br/>' + el.innerHTML).substring(0, 500);
  console.log('[BROWSER]', m);
};
window.onerror = function(msg, url, line) {
  log("Error: " + msg + " (L" + line + ")");
};
window.refreshPoolCookies = function(service) {
  var svc = String(service || '').trim();
  if (!svc) return;
  if (!confirm('Refresh cookie sekarang untuk ' + svc + '?')) return;
  fetch('/admin/pool-cookie-refresh?key=' + encodeURIComponent(window.__ADMIN_KEY__ || ''), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'service=' + encodeURIComponent(svc)
  })
    .then(function(r){ return r.json(); })
    .then(function(res){
      if (!res || !res.status) throw new Error((res && (res.error || res.message)) || 'Gagal refresh cookie');
      var d = (res && res.data) || {};
      var msg = 'Refresh cookie selesai. Updated: ' + Number(d.updated || 0) + ', Failed: ' + Number(d.failed || 0);
      if (window.kNotify) { kNotify.success(msg); } else { alert(msg); }
    })
    .catch(function(err) { var m = 'Error refresh cookie: ' + (err && err.message || err); if (window.kNotify) { kNotify.error(m); } else { alert(m); } });
};
window.stripAdminKeyFromUrl = function() {
  try {
    var current = new URL(window.location.href);
    if (!current.searchParams.has('key')) return;
    current.searchParams.delete('key');
    var qs = current.searchParams.toString();
    var nextUrl = current.pathname + (qs ? ('?' + qs) : '') + (current.hash || '');
    window.history.replaceState({}, document.title || '', nextUrl);
  } catch (e) { }
};
window.switchTab = function(id, btn) {
  document.querySelectorAll('.tab-pane').forEach(function(e){e.style.display='none';});
  var tabsRoot = document.getElementById('tester-tabs');
  if (!tabsRoot) return;
  var btns = tabsRoot.querySelectorAll('button');
  btns.forEach(function(b){ b.classList.remove('active'); });
  var tabPane = document.getElementById('tab-'+id);
  if (!tabPane) return;
  tabPane.style.display='block';
  if (btn) btn.classList.add('active');
};
window.toggleSidebar = function() {
  const sb = document.getElementById('sidebar');
  const overlay = document.getElementById('sb-overlay');
  if (!sb || !overlay) return;
  const willOpen = !sb.classList.contains('show');
  sb.classList.toggle('show', willOpen);
  overlay.classList.toggle('show', willOpen);
  document.body.classList.toggle('sidebar-open', willOpen);
};
window.togglePassword = function(id, btn) {
  const el = document.getElementById(id);
  const icon = btn.querySelector('i');
  if (el.type === 'password') {
    el.type = 'text';
    icon.classList.replace('bi-eye', 'bi-eye-slash');
  } else {
    el.type = 'password';
    icon.classList.replace('bi-eye-slash', 'bi-eye');
  }
};
window.switchMainTab = function(id, title) {
  const byId = function(v){ return document.getElementById(v); };
  const showPane = function(v){ var el = byId(v); if (el) el.style.display = 'block'; };
  const activateNav = function(v){ var el = byId(v); if (el) el.classList.add('active'); };
  const paneExists = document.getElementById('main-' + id);
  if (!paneExists) {
    window.location.href = '/admin/' + encodeURIComponent(id) + '?key=${ADMIN_KEY}';
    return;
  }
  if (window.innerWidth <= 768) {
    const mobileSidebar = document.getElementById('sidebar');
    const mobileOverlay = document.getElementById('sb-overlay');
    if (mobileSidebar) mobileSidebar.classList.remove('show');
    if (mobileOverlay) mobileOverlay.classList.remove('show');
    document.body.classList.remove('sidebar-open');
  }
  document.querySelectorAll('.main-tab-pane').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.sidebar-nav .nav-link').forEach(el => el.classList.remove('active'));
  const icons = { dashboard: 'bi-grid-1x2-fill', users: 'bi-people-fill', members: 'bi-person-badge-fill', services: 'bi-sliders2-vertical', 'wa-settings': 'bi-bell-fill', settings: 'bi-gear-fill', tester: 'bi-activity', mysql: 'bi-database-fill', 'redis-cache': 'bi-memory', vps: 'bi-hdd-stack-fill', live: 'bi-terminal-fill', revenue: 'bi-cash-stack' };
  var topbarTitleEl = byId('topbar-title');
  if (topbarTitleEl) topbarTitleEl.innerHTML = '<i class="bi ' + (icons[id]||'bi-circle') + '"></i> ' + title + '<span class="badge badge-blue ms-1" style="font-size:11px;">${appStats.date}</span>';
  if (id === 'dashboard') {
    showPane('main-dashboard');
    var waInternalSec = byId('wa-internal-sec'); if (waInternalSec) waInternalSec.style.display = 'block';
    activateNav('nav-dashboard');
    if (typeof window.startProviderMetricsMonitor === 'function') window.startProviderMetricsMonitor();
    if (typeof window.loadDashboardConsumption === 'function') window.loadDashboardConsumption();
  } else if (id === 'live') {
    if (typeof window.stopProviderMetricsMonitor === 'function') window.stopProviderMetricsMonitor();
    showPane('main-live');
    activateNav('nav-live');
    startLiveMonitor();
  } else if (id === 'users') {
    if (typeof window.stopProviderMetricsMonitor === 'function') window.stopProviderMetricsMonitor();
    showPane('main-users');
    activateNav('nav-users');
    loadUsers();
  } else if (id === 'members') {
    if (typeof window.stopProviderMetricsMonitor === 'function') window.stopProviderMetricsMonitor();
    showPane('main-members');
    activateNav('nav-members');
    loadMembersAdmin();
  } else if (id === 'tester') {
    if (typeof window.stopProviderMetricsMonitor === 'function') window.stopProviderMetricsMonitor();
    showPane('main-tester');
    activateNav('nav-tester');
  } else if (id === 'services' || id === 'packages') {
    if (typeof window.stopProviderMetricsMonitor === 'function') window.stopProviderMetricsMonitor();
    showPane('main-services');
    activateNav('nav-services');
    initServiceStatusSwitches();
  } else if (id === 'mysql') {
    if (typeof window.stopProviderMetricsMonitor === 'function') window.stopProviderMetricsMonitor();
    showPane('main-mysql');
    activateNav('nav-mysql');
    loadMySQLInfo();
    loadMySQLTables();
    loadLogStats();
    loadRetention();
    loadLogsPerKey();
  } else if (id === 'revenue') {
    if (typeof window.stopProviderMetricsMonitor === 'function') window.stopProviderMetricsMonitor();
    showPane('main-revenue');
    activateNav('nav-revenue');
    loadRevenueAnalytics();
  } else if (id === 'vps') {
    if (typeof window.stopProviderMetricsMonitor === 'function') window.stopProviderMetricsMonitor();
    showPane('main-vps');
    activateNav('nav-vps');
    loadVPSStatus();
  } else if (id === 'redis-cache') {
    if (typeof window.stopProviderMetricsMonitor === 'function') window.stopProviderMetricsMonitor();
    showPane('main-redis-cache');
    activateNav('nav-redis-cache');
    loadRedisAudit();
  } else if (id === 'settings') {
    if (typeof window.stopProviderMetricsMonitor === 'function') window.stopProviderMetricsMonitor();
    showPane('main-settings');
    activateNav('nav-settings');
    simplifySettingsTechnicalView();
    initSettingsCollapsible();
    loadPaymentMethods();
  } else if (id === 'wa-settings') {
    if (typeof window.stopProviderMetricsMonitor === 'function') window.stopProviderMetricsMonitor();
    showPane('main-wa-settings');
    activateNav('nav-wa-settings');
    if (typeof window.switchWaCenterTab === 'function') window.switchWaCenterTab('settings');
    if (typeof window.refreshWaQr === 'function') window.refreshWaQr(false);
    if (typeof window.loadWaOtpLogs === 'function') window.loadWaOtpLogs();
  }
};

window.__waLogPageSize = 25;
window.__waOtpLogPage = 1;
window.__waInboundOtpLogPage = 1;

window.escapeWaLogText = function(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

window.renderWaLogPagination = function(cfg) {
  var pagesWrap = document.getElementById(cfg.pagesId);
  var metaWrap = document.getElementById(cfg.metaId);
  if (!pagesWrap || !metaWrap) return;
  var p = cfg.pagination || {};
  var total = Number(p.total || 0);
  var page = Math.max(1, Number(p.page || 1));
  var pageSize = Math.max(1, Number(p.page_size || window.__waLogPageSize || 25));
  var totalPages = Math.max(1, Number(p.total_pages || 1));
  if (total <= 0) {
    metaWrap.textContent = 'Belum ada data.';
    pagesWrap.innerHTML = '';
    return;
  }

  var start = ((page - 1) * pageSize) + 1;
  var end = Math.min(total, page * pageSize);
  metaWrap.textContent = 'Menampilkan ' + start + '-' + end + ' dari ' + total + ' data';

  var minPage = Math.max(1, page - 2);
  var maxPage = Math.min(totalPages, page + 2);
  var html = '';
  html += '<button type="button" class="btn btn-outline-secondary ' + (page <= 1 ? 'disabled' : '') + '" ' + (page <= 1 ? '' : ('onclick="' + cfg.loader + '(' + (page - 1) + ')"')) + '>Prev</button>';
  for (var i = minPage; i <= maxPage; i += 1) {
    html += '<button type="button" class="btn ' + (i === page ? 'btn-primary' : 'btn-outline-secondary') + '" onclick="' + cfg.loader + '(' + i + ')">' + i + '</button>';
  }
  html += '<button type="button" class="btn btn-outline-secondary ' + (page >= totalPages ? 'disabled' : '') + '" ' + (page >= totalPages ? '' : ('onclick="' + cfg.loader + '(' + (page + 1) + ')"')) + '>Next</button>';
  pagesWrap.innerHTML = html;
};

window.loadWaOtpLogs = function(page) {
  var body = document.getElementById('wa-otp-logs-body');
  if (!body) return;
  if (Number.isFinite(page)) window.__waOtpLogPage = Math.max(1, parseInt(page, 10) || 1);
  var direction = (document.getElementById('wa-log-direction') || {}).value || '';
  var number = (document.getElementById('wa-log-number') || {}).value || '';
  var status = (document.getElementById('wa-log-status') || {}).value || '';
  body.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Memuat...</td></tr>';
  var qs = new URLSearchParams({
    key: '${ADMIN_KEY}',
    page: String(window.__waOtpLogPage || 1),
    page_size: String(window.__waLogPageSize || 25)
  });
  if (direction) qs.set('direction', direction);
  if (number) qs.set('number', number);
  if (status) qs.set('status', status);
  fetch('/admin/wa-otp/logs?' + qs.toString())
    .then(function(r){ return r.json(); })
    .then(function(res){
      if (!res || !res.status) throw new Error((res && (res.error || res.message)) || 'Gagal memuat log.');
      var rows = Array.isArray(res.data) ? res.data : [];
      var pagination = res.pagination || { page: 1, page_size: 25, total: rows.length, total_pages: 1 };
      if (!rows.length) {
        body.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Log kosong.</td></tr>';
      } else {
        body.innerHTML = rows.map(function(item){
          var dt = item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-';
          var msgRaw = String(item.message_text || '');
          var msgShort = msgRaw.length > 100 ? (msgRaw.slice(0, 100) + '...') : msgRaw;
          var msgTitle = window.escapeWaLogText(msgRaw);
          var msgCell = window.escapeWaLogText(msgShort);
          return '<tr>' +
            '<td style="white-space:nowrap;">' + dt + '</td>' +
            '<td><span class="badge ' + (item.direction === 'inbound' ? 'badge-blue' : 'badge-green') + '">' + (item.direction || '-') + '</span></td>' +
            '<td>' + window.escapeWaLogText(item.whatsapp_number || '-') + '</td>' +
            '<td>' + window.escapeWaLogText(item.message_type || '-') + '</td>' +
            '<td>' + window.escapeWaLogText(item.status || '-') + '</td>' +
            '<td>' + window.escapeWaLogText(item.reason || '-') + '</td>' +
            '<td title="' + msgTitle + '">' + msgCell + '</td>' +
          '</tr>';
        }).join('');
      }
      window.renderWaLogPagination({
        pagesId: 'wa-otp-logs-pages',
        metaId: 'wa-otp-logs-meta',
        pagination: pagination,
        loader: 'loadWaOtpLogs'
      });
    })
    .catch(function(err){
      body.innerHTML = '<tr><td colspan="7" class="text-center text-danger">' + window.escapeWaLogText(err.message || 'Gagal memuat log') + '</td></tr>';
      window.renderWaLogPagination({
        pagesId: 'wa-otp-logs-pages',
        metaId: 'wa-otp-logs-meta',
        pagination: { total: 0 },
        loader: 'loadWaOtpLogs'
      });
    });
};

window.loadWaInboundOtpLogs = function(page) {
  var body = document.getElementById('wa-inbound-otp-logs-body');
  if (!body) return;
  if (Number.isFinite(page)) window.__waInboundOtpLogPage = Math.max(1, parseInt(page, 10) || 1);
  var number = (document.getElementById('wa-inbound-log-number') || {}).value || '';
  var reason = (document.getElementById('wa-inbound-log-reason') || {}).value || '';
  body.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Memuat...</td></tr>';
  var qs = new URLSearchParams({
    key: '${ADMIN_KEY}',
    direction: 'inbound',
    message_type: 'otp',
    page: String(window.__waInboundOtpLogPage || 1),
    page_size: String(window.__waLogPageSize || 25)
  });
  if (number) qs.set('number', number);
  if (reason) qs.set('reason', reason);
  fetch('/admin/wa-otp/logs?' + qs.toString())
    .then(function(r){ return r.json(); })
    .then(function(res){
      if (!res || !res.status) throw new Error((res && (res.error || res.message)) || 'Gagal memuat log inbound OTP.');
      var rows = Array.isArray(res.data) ? res.data : [];
      var pagination = res.pagination || { page: 1, page_size: 25, total: rows.length, total_pages: 1 };
      if (!rows.length) {
        body.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Belum ada log pesan masuk OTP.</td></tr>';
      } else {
        var badgeClass = function(statusVal) {
          var s = String(statusVal || '').toLowerCase();
          if (s === 'verified') return 'badge-green';
          if (s === 'invalid' || s === 'failed') return 'badge-red';
          if (s === 'ignored' || s === 'expired') return 'badge-amber';
          return 'badge-blue';
        };
        body.innerHTML = rows.map(function(item){
          var dt = item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-';
          var msgRaw = String(item.message_text || '');
          var msgShort = msgRaw.length > 160 ? (msgRaw.slice(0, 160) + '...') : msgRaw;
          return '<tr>' +
            '<td style="white-space:nowrap;">' + dt + '</td>' +
            '<td>' + window.escapeWaLogText(item.whatsapp_number || '-') + '</td>' +
            '<td><span class="badge ' + badgeClass(item.status) + '">' + window.escapeWaLogText(item.status || '-') + '</span></td>' +
            '<td>' + window.escapeWaLogText(item.reason || '-') + '</td>' +
            '<td title="' + window.escapeWaLogText(msgRaw) + '">' + window.escapeWaLogText(msgShort) + '</td>' +
          '</tr>';
        }).join('');
      }
      window.renderWaLogPagination({
        pagesId: 'wa-inbound-otp-logs-pages',
        metaId: 'wa-inbound-otp-logs-meta',
        pagination: pagination,
        loader: 'loadWaInboundOtpLogs'
      });
    })
    .catch(function(err){
      body.innerHTML = '<tr><td colspan="5" class="text-center text-danger">' + window.escapeWaLogText(err.message || 'Gagal memuat log inbound OTP') + '</td></tr>';
      window.renderWaLogPagination({
        pagesId: 'wa-inbound-otp-logs-pages',
        metaId: 'wa-inbound-otp-logs-meta',
        pagination: { total: 0 },
        loader: 'loadWaInboundOtpLogs'
      });
    });
};

window.clearWaOtpLogs = function() {
  var direction = (document.getElementById('wa-log-direction') || {}).value || '';
  var number = (document.getElementById('wa-log-number') || {}).value || '';
  var status = (document.getElementById('wa-log-status') || {}).value || '';
  var hasFilter = !!(direction || number || status);
  var confirmMsg = hasFilter
    ? 'Hapus log sesuai filter saat ini?'
    : 'Filter kosong. Hapus SEMUA log OTP & pesan WA?';
  if (!window.confirm(confirmMsg)) return;
  var payload = { direction: direction, number: number, status: status };
  if (!hasFilter) payload.mode = 'all';
  fetch('/admin/wa-otp/logs/clear?key=${ADMIN_KEY}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(function(r){ return r.json(); })
    .then(function(res){
      if (!res || !res.status) throw new Error((res && (res.error || res.message)) || 'Gagal bersihkan log.');
      window.__waOtpLogPage = 1;
      if (typeof window.loadWaOtpLogs === 'function') window.loadWaOtpLogs(1);
      alert(res.message || 'Log berhasil dibersihkan.');
    })
    .catch(function(err){
      alert(err.message || 'Gagal bersihkan log.');
    });
};

window.clearWaInboundOtpLogs = function() {
  var number = (document.getElementById('wa-inbound-log-number') || {}).value || '';
  var reason = (document.getElementById('wa-inbound-log-reason') || {}).value || '';
  if (!window.confirm('Hapus log pesan masuk OTP sesuai filter saat ini?')) return;
  fetch('/admin/wa-otp/logs/clear?key=${ADMIN_KEY}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      direction: 'inbound',
      message_type: 'otp',
      number: number,
      reason: reason
    })
  })
    .then(function(r){ return r.json(); })
    .then(function(res){
      if (!res || !res.status) throw new Error((res && (res.error || res.message)) || 'Gagal bersihkan log inbound OTP.');
      window.__waInboundOtpLogPage = 1;
      if (typeof window.loadWaInboundOtpLogs === 'function') window.loadWaInboundOtpLogs(1);
      alert(res.message || 'Log inbound OTP berhasil dibersihkan.');
    })
    .catch(function(err){
      alert(err.message || 'Gagal bersihkan log inbound OTP.');
    });
};

window.switchWaCenterTab = function(tab) {
  var paneSettings = document.getElementById('wa-center-pane-settings');
  var paneLogs = document.getElementById('wa-center-pane-logs');
  var paneInbound = document.getElementById('wa-center-pane-inbound');
  var btnSettings = document.getElementById('wa-center-tab-btn-settings');
  var btnLogs = document.getElementById('wa-center-tab-btn-logs');
  var btnInbound = document.getElementById('wa-center-tab-btn-inbound');
  if (!paneSettings || !paneLogs || !paneInbound || !btnSettings || !btnLogs || !btnInbound) return;

  var tabKey = String(tab || '').toLowerCase();
  var isLogs = tabKey === 'logs';
  var isInbound = tabKey === 'inbound';
  paneSettings.style.display = (!isLogs && !isInbound) ? '' : 'none';
  paneLogs.style.display = isLogs ? '' : 'none';
  paneInbound.style.display = isInbound ? '' : 'none';

  if (isLogs) {
    btnSettings.className = 'btn btn-outline-secondary btn-sm wa-center-tab-btn';
    btnLogs.className = 'btn btn-primary btn-sm wa-center-tab-btn';
    btnInbound.className = 'btn btn-outline-secondary btn-sm wa-center-tab-btn';
    if (typeof window.loadWaOtpLogs === 'function') window.loadWaOtpLogs();
  } else if (isInbound) {
    btnSettings.className = 'btn btn-outline-secondary btn-sm wa-center-tab-btn';
    btnLogs.className = 'btn btn-outline-secondary btn-sm wa-center-tab-btn';
    btnInbound.className = 'btn btn-primary btn-sm wa-center-tab-btn';
    if (typeof window.loadWaInboundOtpLogs === 'function') window.loadWaInboundOtpLogs();
  } else {
    btnSettings.className = 'btn btn-primary btn-sm wa-center-tab-btn';
    btnLogs.className = 'btn btn-outline-secondary btn-sm wa-center-tab-btn';
    btnInbound.className = 'btn btn-outline-secondary btn-sm wa-center-tab-btn';
  }
};

window.initServiceStatusSwitches = function() {
  const root = document.getElementById('main-services');
  if (!root) return;
  root.querySelectorAll('.service-status-switch').forEach(function(sw) {
    if (sw.dataset.bound === '1') return;
    const targetId = sw.getAttribute('data-target');
    const hidden = targetId ? document.getElementById(targetId) : null;
    const label = sw.closest('.form-check') ? sw.closest('.form-check').querySelector('.service-status-label') : null;
    const apply = function() {
      const on = !!sw.checked;
      if (hidden) hidden.value = on ? 'on' : 'off';
      if (label) label.textContent = on ? 'ON' : 'OFF';
    };
    apply();
    sw.addEventListener('change', apply);
    sw.dataset.bound = '1';
  });
};


window.simplifySettingsTechnicalView = function() {
  const root = document.getElementById('main-settings');
  if (!root || root.dataset.technicalOnlyReady === '1') return;
  const namesToHide = [
    'bank_status', 'ewallet_status', 'whatsapp_status', 'nik_status', 'bpjs_status', 'pln_status', 'games_status',
    'cost_bank', 'cost_ewallet', 'cost_whatsapp', 'cost_nik', 'cost_bpjs', 'cost_pln', 'cost_games',
    'cooldown_bank', 'cooldown_ewallet', 'cooldown_whatsapp', 'cooldown_nik', 'cooldown_bpjs', 'cooldown_pln'
  ];
  namesToHide.forEach(function(name) {
    root.querySelectorAll('[name="' + name + '"]').forEach(function(el) {
      const block = el.closest('.col-md-6, .col-md-4, .col-md-3, .col-12, .row, .p-3.rounded.mb-3, .svc-server-card');
      if (block) block.style.display = 'none';
    });
  });

  const shell = root.querySelector('.settings-hero');
  if (shell && !root.querySelector('#settings-tech-note')) {
    const note = document.createElement('div');
    note.id = 'settings-tech-note';
    note.className = 'alert alert-info mt-3';
    note.innerHTML = '<i class="bi bi-info-circle me-1"></i> Status layanan, harga per hit, dan cooldown dipindahkan ke menu <strong>Setingan Layanan</strong>.';
    shell.insertAdjacentElement('afterend', note);
  }
  root.dataset.technicalOnlyReady = '1';
};

window.analyzeServer7Pool = function() {
  var body = document.getElementById('server7-pool-analyze-body');
  if (!body) return;
  body.innerHTML = '<tr><td colspan="5" class="text-muted">Memeriksa endpoint/session...</td></tr>';
  var number = window.prompt('Nomor uji untuk analisa server7 pool (contoh 081234567890):', '081234567890');
  if (!number) {
    body.innerHTML = '<tr><td colspan="5" class="text-muted">Dibatalkan.</td></tr>';
    return;
  }
  fetch('/admin/server7-pool-analyze?key=' + encodeURIComponent(window.__ADMIN_KEY__ || '') + '&code=dana&account_number=' + encodeURIComponent(String(number || '').replace(/[^0-9]/g, '')))
    .then(function(r){ return r.json(); })
    .then(function(res){
      if (!res || !res.status) throw new Error((res && (res.error || res.message)) || 'Gagal analisa server7 pool.');
      var rows = Array.isArray(res.data) ? res.data : [];
      if (!rows.length) {
        body.innerHTML = '<tr><td colspan="5" class="text-muted">Tidak ada kandidat server7 aktif.</td></tr>';
        return;
      }
      body.innerHTML = rows.map(function(row){
        var ok = !!row.ok;
        return '<tr>' +
          '<td><strong>' + escapeHtmlText(row.alias || '-') + '</strong></td>' +
          '<td>' + (ok ? '<span class="badge badge-green">ACTIVE</span>' : '<span class="badge badge-red">ISSUE</span>') + '</td>' +
          '<td>' + (ok ? '<span class="badge badge-blue">Session Hidup</span>' : '<span class="badge badge-amber">Session Bermasalah</span>') + '</td>' +
          '<td><span style="font-weight:700;">' + escapeHtmlText(String(row.latency_ms || 0)) + ' ms</span></td>' +
          '<td><span class="text-muted">' + escapeHtmlText((row.host || '-') + ' - ' + (row.reason || '-')) + '</span></td>' +
        '</tr>';
      }).join('');
    })
    .catch(function(err){
      body.innerHTML = '<tr><td colspan="5" class="text-danger">' + escapeHtmlText(err.message || 'Gagal analisa') + '</td></tr>';
    });
};

window.analyzeServer3Pool = function() {
  var body = document.getElementById('server3-pool-analyze-body');
  if (!body) return;
  body.innerHTML = '<tr><td colspan="5" class="text-muted">Memeriksa endpoint/session...</td></tr>';
  var number = window.prompt('Nomor rekening uji untuk analisa server3 pool (contoh 1234567890):', '1234567890');
  if (!number) {
    body.innerHTML = '<tr><td colspan="5" class="text-muted">Dibatalkan.</td></tr>';
    return;
  }
  var bankCode = window.prompt('Kode bank (codeid) untuk uji server3 pool (contoh 014 untuk BCA):', '014');
  if (!bankCode) {
    body.innerHTML = '<tr><td colspan="5" class="text-muted">Dibatalkan.</td></tr>';
    return;
  }
  fetch('/admin/server3-pool-analyze?key=' + encodeURIComponent(window.__ADMIN_KEY__ || '') + '&bank_code=' + encodeURIComponent(String(bankCode || '').trim()) + '&account_number=' + encodeURIComponent(String(number || '').replace(/[^0-9]/g, '')))
    .then(function(r){ return r.json(); })
    .then(function(res){
      if (!res || !res.status) throw new Error((res && (res.error || res.message)) || 'Gagal analisa server3 pool.');
      var rows = Array.isArray(res.data) ? res.data : [];
      if (!rows.length) {
        body.innerHTML = '<tr><td colspan="5" class="text-muted">Tidak ada kandidat server3 aktif.</td></tr>';
        return;
      }
      body.innerHTML = rows.map(function(row){
        var ok = !!row.ok;
        return '<tr>' +
          '<td><strong>' + escapeHtmlText(row.alias || '-') + '</strong></td>' +
          '<td>' + (ok ? '<span class="badge badge-green">ACTIVE</span>' : '<span class="badge badge-red">ISSUE</span>') + '</td>' +
          '<td>' + (ok ? '<span class="badge badge-blue">Session Hidup</span>' : '<span class="badge badge-amber">Session Bermasalah</span>') + '</td>' +
          '<td><span style="font-weight:700;">' + escapeHtmlText(String(row.latency_ms || 0)) + ' ms</span></td>' +
          '<td><span class="text-muted">' + escapeHtmlText((row.host || '-') + ' - ' + (row.reason || '-')) + '</span></td>' +
        '</tr>';
      }).join('');
    })
    .catch(function(err){
      body.innerHTML = '<tr><td colspan="5" class="text-danger">' + escapeHtmlText(err.message || 'Gagal analisa') + '</td></tr>';
    });
};

window.initSettingsCollapsible = function() {
  const root = document.getElementById('main-settings');
  if (!root || root.dataset.collapseReady === '1') return;
  const cards = Array.from(root.querySelectorAll('.settings-card'));
  if (!cards.length) return;

  cards.forEach(function(card, idx) {
    const header = card.querySelector('.card-header');
    const body = card.querySelector('.card-body');
    if (!header || !body) return;

    const title = (header.textContent || ('card-' + idx)).trim().toLowerCase().replace(/\s+/g, '-');
    const storageKey = 'settings-collapse:' + title + ':' + idx;
    const defaultOpen = idx < 2 ? '1' : '0';
    const saved = localStorage.getItem(storageKey);
    const isOpen = (saved === null ? defaultOpen : saved) === '1';

    header.style.cursor = 'pointer';
    header.style.userSelect = 'none';
    header.classList.add('d-flex', 'justify-content-between', 'align-items-center');
    if (!header.querySelector('.settings-collapse-toggle')) {
      const iconWrap = document.createElement('span');
      iconWrap.className = 'settings-collapse-toggle ms-2';
      iconWrap.innerHTML = '<i class="bi bi-chevron-down"></i>';
      header.appendChild(iconWrap);
    }
    const icon = header.querySelector('.settings-collapse-toggle i');

    const applyState = function(open) {
      body.style.display = open ? '' : 'none';
      if (icon) {
        icon.style.transition = 'transform .2s ease';
        icon.style.transform = open ? 'rotate(0deg)' : 'rotate(-90deg)';
      }
      localStorage.setItem(storageKey, open ? '1' : '0');
    };

    applyState(isOpen);
    header.addEventListener('click', function(e) {
      if (e.target && e.target.closest('button, input, select, textarea, a')) return;
      const currentlyOpen = body.style.display !== 'none';
      applyState(!currentlyOpen);
    });
  });

  root.dataset.collapseReady = '1';
};

window.switchSvcTab = function(tabId, btn) {
  // Hide all service tab panes
  document.querySelectorAll('.svc-tab-pane').forEach(function(el) { el.style.display = 'none'; });
  // Remove active from all tab buttons
  document.querySelectorAll('.svc-tab-btn, .svc-vnav__item').forEach(function(el) { el.classList.remove('active'); });
  // Show selected pane & activate button
  var pane = document.getElementById(tabId);
  if (pane) pane.style.display = 'block';
  if (btn) btn.classList.add('active');
};


let bankRoutingState = { banks: [], toggles: {} };

window.openBankRoutingModal = function() {
  const tbody = document.getElementById('bank-routing-tbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">Loading...</td></tr>';

  fetch('/api/v3/admin/bank-routing?key=${ADMIN_KEY}')
    .then(r => r.json())
    .then(res => {
      if (!res.status) throw new Error(res.error || 'Gagal load data');
      bankRoutingState = res.data || { banks: [], toggles: {} };
      renderBankRoutingTable('');

      const search = document.getElementById('bank-routing-search');
      if (search) {
        search.value = '';
        search.oninput = function() { renderBankRoutingTable(search.value); };
      }

      const modal = new bootstrap.Modal(document.getElementById('bankRoutingModal'));
      modal.show();
    })
    .catch(err => {
      if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Error: ' + (err.message || err) + '</td></tr>';
    });
};

function renderBankRoutingTable(query) {
  const tbody = document.getElementById('bank-routing-tbody');
  if (!tbody) return;

  const q = (query || '').toLowerCase().trim();
  const banks = Array.isArray(bankRoutingState.banks) ? bankRoutingState.banks : [];
  const toggles = bankRoutingState.toggles || {};

  const filtered = q
    ? banks.filter(b => (String(b.name || '').toLowerCase().includes(q) || String(b.codeid || '').toLowerCase().includes(q)))
    : banks;

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">Tidak ada data.</td></tr>';
    return;
  }

  let html = '';
  filtered.forEach(b => {
    const codeid = String(b.codeid || '').trim();
    const name = String(b.name || '-');
    const t = toggles[codeid] || {};
    const s1On = !(t.s1 === 0 || t.s1 === '0' || t.s1 === false);
    const s2On = !(t.s2 === 0 || t.s2 === '0' || t.s2 === false);
    const s3On = !(t.s3 === 0 || t.s3 === '0' || t.s3 === false);
    const s4On = !(t.s4 === 0 || t.s4 === '0' || t.s4 === false);
    const s5On = !(t.s5 === 0 || t.s5 === '0' || t.s5 === false);
    const s6On = !(t.s6 === 0 || t.s6 === '0' || t.s6 === false);
    const s7On = !(t.s7 === 0 || t.s7 === '0' || t.s7 === false);

    html += '<tr>' +
      '<td class="ps-3"><div style="font-weight:600;">' + name + '</div></td>' +
      '<td><span class="badge badge-blue">' + codeid + '</span></td>' +
      '<td class="text-center">' +
        '<div class="form-check form-switch m-0 d-flex justify-content-center">' +
          '<input class="form-check-input" type="checkbox" data-br-codeid="' + codeid + '" data-br-server="s1" ' + (s1On ? 'checked' : '') + '>' +
        '</div>' +
      '</td>' +
      '<td class="text-center">' +
        '<div class="form-check form-switch m-0 d-flex justify-content-center">' +
          '<input class="form-check-input" type="checkbox" data-br-codeid="' + codeid + '" data-br-server="s2" ' + (s2On ? 'checked' : '') + '>' +
        '</div>' +
      '</td>' +
      '<td class="text-center">' +
        '<div class="form-check form-switch m-0 d-flex justify-content-center">' +
          '<input class="form-check-input" type="checkbox" data-br-codeid="' + codeid + '" data-br-server="s3" ' + (s3On ? 'checked' : '') + '>' +
        '</div>' +
      '</td>' +
      '<td class="text-center">' +
        '<div class="form-check form-switch m-0 d-flex justify-content-center">' +
          '<input class="form-check-input" type="checkbox" data-br-codeid="' + codeid + '" data-br-server="s4" ' + (s4On ? 'checked' : '') + '>' +
        '</div>' +
      '</td>' +
      '<td class="text-center">' +
        '<div class="form-check form-switch m-0 d-flex justify-content-center">' +
          '<input class="form-check-input" type="checkbox" data-br-codeid="' + codeid + '" data-br-server="s5" ' + (s5On ? 'checked' : '') + '>' +
        '</div>' +
      '</td>' +
      '<td class="text-center">' +
        '<div class="form-check form-switch m-0 d-flex justify-content-center">' +
          '<input class="form-check-input" type="checkbox" data-br-codeid="' + codeid + '" data-br-server="s6" ' + (s6On ? 'checked' : '') + '>' +
        '</div>' +
      '</td>' +
      '<td class="text-center">' +
        '<div class="form-check form-switch m-0 d-flex justify-content-center">' +
          '<input class="form-check-input" type="checkbox" data-br-codeid="' + codeid + '" data-br-server="s7" ' + (s7On ? 'checked' : '') + '>' +
        '</div>' +
      '</td>' +
    '</tr>';
  });

  tbody.innerHTML = html;
}

window.saveBankRouting = function() {
  const btn = document.getElementById('bank-routing-save-btn');
  const orig = btn ? btn.innerHTML : '';
  if (btn) { btn.innerHTML = 'Menyimpan...'; btn.disabled = true; }

  const inputs = document.querySelectorAll('#bankRoutingModal input[data-br-codeid]');
  const temp = {};
  inputs.forEach(inp => {
    const codeid = inp.getAttribute('data-br-codeid');
    const server = inp.getAttribute('data-br-server');
    if (!codeid || !server) return;
    if (!temp[codeid]) temp[codeid] = { s1: 1, s2: 1, s3: 1, s4: 1, s5: 1, s6: 1, s7: 1 };
    temp[codeid][server] = inp.checked ? 1 : 0;
  });

  const toggles = {};
  Object.keys(temp).forEach(codeid => {
    const row = temp[codeid];
    // Jika ada salah satu yang OFF, baru kita simpan bypass-nya
    if (!(row.s1 === 1 && row.s2 === 1 && row.s3 === 1 && row.s4 === 1 && row.s5 === 1 && row.s6 === 1 && row.s7 === 1)) {
        toggles[codeid] = { s1: row.s1, s2: row.s2, s3: row.s3, s4: row.s4, s5: row.s5, s6: row.s6, s7: row.s7 };
    }
  });

  fetch('/api/v3/admin/bank-routing?key=${ADMIN_KEY}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toggles })
  })
  .then(r => r.json())
  .then(res => {
    if (!res.status) throw new Error(res.error || 'Gagal menyimpan');
    alert('Routing bank tersimpan.');
    bootstrap.Modal.getInstance(document.getElementById('bankRoutingModal')).hide();
  })
  .catch(err => alert('Gagal menyimpan: ' + (err.message || err)))
  .finally(() => {
    if (btn) { btn.innerHTML = orig; btn.disabled = false; }
  });
};

let responseMapperState = {
  initialized: false,
  catalog: [],
  selectedService: '',
  selectedProvider: '',
  current: null,
  draftMapping: null,
  previewTimer: null
};

function mapperApiUrl(path) {
  return '/api/v3/admin/response-mappings' + path + '?key=${ADMIN_KEY}';
}

function mapperEscapeText(value) {
  if (typeof escapeHtmlText === 'function') return escapeHtmlText(value);
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function mapperEscapeAttr(value) {
  if (typeof escapeHtmlAttr === 'function') return escapeHtmlAttr(value);
  return mapperEscapeText(value).replace(/"/g, '&quot;');
}

function parseMapperResponse(r, fallbackMessage) {
  return r.text().then(function(raw) {
    var data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch (e) {
      data = null;
    }
    if (!r.ok) {
      var message = (data && (data.message || data.error)) || (raw && raw.trim() ? raw.trim().slice(0, 200) : '') || (fallbackMessage || ('HTTP ' + r.status));
      throw new Error(message);
    }
    if (!data || typeof data !== 'object') {
      throw new Error(fallbackMessage || 'Respon server tidak valid.');
    }
    return data;
  });
}

window.initResponseMapper = function() {
  if (responseMapperState.initialized) return;
  fetch(mapperApiUrl('/catalog'))
    .then(function(r) { return parseMapperResponse(r, 'Gagal memuat katalog mapper.'); })
    .then(function(res) {
      if (!res.status) throw new Error(res.message || res.error || 'Gagal memuat katalog mapper.');
      responseMapperState.initialized = true;
      responseMapperState.catalog = Array.isArray(res.data) ? res.data : [];
      renderMapperServiceOptions();
    })
    .catch(function(err) {
      alert(err.message || err);
    });
};

function renderMapperServiceOptions() {
  var serviceSelect = document.getElementById('mapper-service');
  if (!serviceSelect) return;
  var uniqueServices = [];
  responseMapperState.catalog.forEach(function(item) {
    if (!uniqueServices.find(function(existing) { return existing.service_type === item.service_type; })) {
      uniqueServices.push({ service_type: item.service_type, service_label: item.service_label });
    }
  });
  serviceSelect.innerHTML = uniqueServices.map(function(item) {
    return '<option value="' + item.service_type + '">' + mapperEscapeText(item.service_label) + '</option>';
  }).join('');
  if (!responseMapperState.selectedService && uniqueServices[0]) {
    responseMapperState.selectedService = uniqueServices[0].service_type;
  }
  serviceSelect.value = responseMapperState.selectedService || '';
  onMapperServiceChange();
}

window.onMapperServiceChange = function() {
  var serviceSelect = document.getElementById('mapper-service');
  var providerSelect = document.getElementById('mapper-provider');
  if (!serviceSelect || !providerSelect) return;
  responseMapperState.selectedService = serviceSelect.value;
  var providerOptions = responseMapperState.catalog.filter(function(item) {
    return item.service_type === responseMapperState.selectedService;
  });
  providerSelect.innerHTML = providerOptions.map(function(item) {
    return '<option value="' + item.provider_code + '">' + mapperEscapeText(item.provider_label) + '</option>';
  }).join('');
  if (!providerOptions.find(function(item) { return item.provider_code === responseMapperState.selectedProvider; })) {
    responseMapperState.selectedProvider = providerOptions[0] ? providerOptions[0].provider_code : '';
  }
  providerSelect.value = responseMapperState.selectedProvider || '';
  updateMapperParameterVisibility();
  loadResponseMappingCurrent();
};

function updateMapperParameterVisibility() {
  var service = responseMapperState.selectedService;
  document.querySelectorAll('.mapper-param').forEach(function(el) { el.style.display = 'none'; });
  if (service === 'bank' || service === 'ewallet') {
    document.querySelectorAll('.mapper-param-' + service).forEach(function(el) { el.style.display = ''; });
  } else if (service === 'nik' || service === 'whatsapp' || service === 'games') {
    document.querySelectorAll('.mapper-param-' + service).forEach(function(el) { el.style.display = ''; });
  } else {
    document.querySelectorAll('.mapper-param-bank').forEach(function(el) { el.style.display = ''; });
  }
}

window.loadResponseMappingCurrent = function() {
  var service = document.getElementById('mapper-service') ? document.getElementById('mapper-service').value : '';
  var provider = document.getElementById('mapper-provider') ? document.getElementById('mapper-provider').value : '';
  if (!service || !provider) return;
  responseMapperState.selectedService = service;
  responseMapperState.selectedProvider = provider;
  fetch(mapperApiUrl('') + '&service_type=' + encodeURIComponent(service) + '&provider_code=' + encodeURIComponent(provider))
    .then(function(r) { return parseMapperResponse(r, 'Gagal memuat data mapping.'); })
    .then(function(res) {
      if (!res.status) throw new Error(res.message || res.error || 'Gagal memuat data mapping.');
      responseMapperState.current = res.data;
      responseMapperState.draftMapping = JSON.parse(JSON.stringify(res.data.draft_mapping || { field_output: [] }));
      renderResponseMappingPayload();
    })
    .catch(function(err) {
      alert(err.message || err);
    });
};

function renderResponseMappingPayload() {
  var current = responseMapperState.current || {};
  document.getElementById('mapper-active-name').textContent = current.active_mapping && current.active_mapping.nama_mapping ? current.active_mapping.nama_mapping : '-';
  document.getElementById('mapper-updated-at').textContent = current.updated_at || '-';
  renderResponseMapperVersions(current.versions || []);
  renderMapperSourceTree(current.sample_source || null);
  renderMapperFieldList();
  if (current.sample_source) {
    responseMapperPreview(false);
  } else {
    document.getElementById('mapper-preview-json').textContent = 'Belum ada preview. Ambil contoh respon terlebih dahulu.';
  }
}

function renderResponseMapperVersions(versions) {
  var select = document.getElementById('mapper-version-select');
  if (!select) return;
  if (!versions.length) {
    select.innerHTML = '<option value="">Belum ada versi publish</option>';
    return;
  }
  select.innerHTML = versions.map(function(item) {
    return '<option value="' + item.id + '">Versi ' + item.version_no + ' - ' + mapperEscapeText(item.created_at || '') + '</option>';
  }).join('');
}

function getMapperNodeType(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function renderMapperSourceNode(path, value) {
  var type = getMapperNodeType(value);
  var canMerge = value && typeof value === 'object' && !Array.isArray(value);
  var canField = !(value && typeof value === 'object');
  var buttons = '';
  if (canField) {
    buttons += '<button class="btn btn-sm btn-outline-info" type="button" onclick="responseMapperAddField(' + JSON.stringify(path) + ')">Tambah Field</button> ';
  }
  if (canMerge) {
    buttons += '<button class="btn btn-sm btn-outline-warning" type="button" onclick="responseMapperAddMerge(' + JSON.stringify(path) + ')">Gabungkan Objek</button>';
  }
  var valuePreview = canField ? mapperEscapeText(JSON.stringify(value)) : (type === 'array' ? '[Array ' + value.length + ']' : '{Objek}');
  var html = '<div class="mapper-source-node"><div class="mapper-source-head"><div><div class="mapper-source-path">' + mapperEscapeText(path || '(root)') + '</div><div class="mapper-source-value">' + valuePreview + '</div></div><div>' + buttons + '</div></div>';
  if (value && typeof value === 'object') {
    var entries = Array.isArray(value)
      ? value.map(function(item, index) { return [String(index), item]; })
      : Object.keys(value).map(function(key) { return [key, value[key]]; });
    if (entries.length) {
      html += '<details><summary>Lihat detail</summary>';
      entries.forEach(function(entry) {
        var childPath = path ? path + '.' + entry[0] : entry[0];
        html += renderMapperSourceNode(childPath, entry[1]);
      });
      html += '</details>';
    }
  }
  html += '</div>';
  return html;
}

function renderMapperSourceTree(source) {
  var el = document.getElementById('mapper-source-tree');
  if (!el) return;
  if (!source) {
    el.innerHTML = 'Belum ada contoh respon.';
    return;
  }
  el.innerHTML = renderMapperSourceNode('', source);
}

function mapperSuggestKey(path) {
  var parts = String(path || '').split('.');
  return (parts[parts.length - 1] || 'field').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
}

window.responseMapperAddField = function(path) {
  if (!responseMapperState.draftMapping) return;
  responseMapperState.draftMapping.field_output.push({
    id: 'field_' + Date.now(),
    jenis: 'field',
    label: mapperSuggestKey(path),
    kunci_output: mapperSuggestKey(path),
    sumber_data: path,
    tampilkan: true,
    formatter: 'string',
    fallback: ''
  });
  renderMapperFieldList();
  responseMapperPreview(false);
};

window.responseMapperAddMerge = function(path) {
  if (!responseMapperState.draftMapping) return;
  responseMapperState.draftMapping.field_output.push({
    id: 'merge_' + Date.now(),
    jenis: 'merge_object',
    label: 'Gabungkan ' + mapperSuggestKey(path),
    kunci_output: '',
    sumber_data: path,
    tampilkan: true,
    formatter: 'none',
    fallback: ''
  });
  renderMapperFieldList();
  responseMapperPreview(false);
};

function renderMapperFieldList() {
  var el = document.getElementById('mapper-field-list');
  if (!el) return;
  var fields = responseMapperState.draftMapping && Array.isArray(responseMapperState.draftMapping.field_output)
    ? responseMapperState.draftMapping.field_output
    : [];
  if (!fields.length) {
    el.innerHTML = 'Belum ada field dipilih.';
    return;
  }
  el.innerHTML = fields.map(function(item, index) {
    return '<div class="mapper-field-item" draggable="true" data-map-index="' + index + '">' +
      '<div class="mapper-field-title">' +
        '<div><span class="mapper-handle"><i class="bi bi-grip-vertical"></i></span> <strong>' + mapperEscapeText(item.jenis === 'merge_object' ? 'Gabungkan Objek' : 'Field Biasa') + '</strong></div>' +
        '<button class="btn btn-sm btn-danger-soft" type="button" onclick="responseMapperRemoveField(' + index + ')"><i class="bi bi-trash"></i></button>' +
      '</div>' +
      '<div class="mapper-field-grid">' +
        '<div><label class="form-label">Label</label><input class="form-control form-control-sm" value="' + mapperEscapeAttr(item.label || '') + '" oninput="responseMapperUpdateField(' + index + ', &quot;label&quot;, this.value)"></div>' +
        '<div><label class="form-label">Jenis</label><select class="form-select form-select-sm" onchange="responseMapperUpdateField(' + index + ', &quot;jenis&quot;, this.value)">' +
          '<option value="field"' + (item.jenis === 'field' ? ' selected' : '') + '>Field Biasa</option>' +
          '<option value="merge_object"' + (item.jenis === 'merge_object' ? ' selected' : '') + '>Gabungkan Objek</option>' +
        '</select></div>' +
        '<div><label class="form-label">Kunci Output</label><input class="form-control form-control-sm" value="' + mapperEscapeAttr(item.kunci_output || '') + '" ' + (item.jenis === 'merge_object' ? 'disabled' : '') + ' oninput="responseMapperUpdateField(' + index + ', &quot;kunci_output&quot;, this.value)"></div>' +
        '<div><label class="form-label">Sumber Data</label><input class="form-control form-control-sm" value="' + mapperEscapeAttr(item.sumber_data || '') + '" oninput="responseMapperUpdateField(' + index + ', &quot;sumber_data&quot;, this.value)"></div>' +
        '<div><label class="form-label">Formatter</label><select class="form-select form-select-sm" onchange="responseMapperUpdateField(' + index + ', &quot;formatter&quot;, this.value)">' +
          renderMapperFormatterOptions(item.formatter) +
        '</select></div>' +
        '<div><label class="form-label">Nilai Cadangan</label><input class="form-control form-control-sm" value="' + mapperEscapeAttr(item.fallback || '') + '" oninput="responseMapperUpdateField(' + index + ', &quot;fallback&quot;, this.value)"></div>' +
        '<div><label class="form-label">Tampilkan ke User</label><select class="form-select form-select-sm" onchange="responseMapperUpdateField(' + index + ', &quot;tampilkan&quot;, this.value === &quot;1&quot;)">' +
          '<option value="1"' + (item.tampilkan ? ' selected' : '') + '>Ya</option>' +
          '<option value="0"' + (!item.tampilkan ? ' selected' : '') + '>Tidak</option>' +
        '</select></div>' +
      '</div>' +
    '</div>';
  }).join('');
  bindMapperDragAndDrop();
}

function renderMapperFormatterOptions(activeValue) {
  var formats = [
    ['none', 'Tanpa Format'],
    ['string', 'String'],
    ['number', 'Number'],
    ['trim', 'Trim'],
    ['uppercase', 'Huruf Besar'],
    ['lowercase', 'Huruf Kecil'],
    ['boolean', 'Boolean'],
    ['mask_phone', 'Samarkan Nomor'],
    ['mask_account', 'Samarkan Rekening']
  ];
  return formats.map(function(item) {
    return '<option value="' + item[0] + '"' + (String(activeValue || '') === item[0] ? ' selected' : '') + '>' + item[1] + '</option>';
  }).join('');
}

window.responseMapperUpdateField = function(index, key, value) {
  if (!responseMapperState.draftMapping || !responseMapperState.draftMapping.field_output[index]) return;
  responseMapperState.draftMapping.field_output[index][key] = value;
  if (key === 'jenis' && value === 'merge_object') {
    responseMapperState.draftMapping.field_output[index].kunci_output = '';
    responseMapperState.draftMapping.field_output[index].formatter = 'none';
    renderMapperFieldList();
  } else if (key === 'jenis' && value === 'field') {
    renderMapperFieldList();
  }
  responseMapperPreview(false);
};

window.responseMapperRemoveField = function(index) {
  if (!responseMapperState.draftMapping) return;
  responseMapperState.draftMapping.field_output.splice(index, 1);
  renderMapperFieldList();
  responseMapperPreview(false);
};

function bindMapperDragAndDrop() {
  var dragIndex = null;
  document.querySelectorAll('#mapper-field-list .mapper-field-item').forEach(function(el) {
    el.addEventListener('dragstart', function() {
      dragIndex = parseInt(el.getAttribute('data-map-index'), 10);
      el.classList.add('dragging');
    });
    el.addEventListener('dragend', function() {
      el.classList.remove('dragging');
    });
    el.addEventListener('dragover', function(evt) {
      evt.preventDefault();
    });
    el.addEventListener('drop', function(evt) {
      evt.preventDefault();
      var dropIndex = parseInt(el.getAttribute('data-map-index'), 10);
      if (dragIndex === null || dropIndex === null || dragIndex === dropIndex) return;
      var list = responseMapperState.draftMapping.field_output;
      var moved = list.splice(dragIndex, 1)[0];
      list.splice(dropIndex, 0, moved);
      dragIndex = null;
      renderMapperFieldList();
      responseMapperPreview(false);
    });
  });
}

function collectMapperSamplePayload() {
  var service = responseMapperState.selectedService;
  var payload = {
    service_type: service,
    provider_code: responseMapperState.selectedProvider
  };
  if (service === 'bank' || service === 'ewallet') {
    payload.code = document.getElementById('mapper-param-code').value.trim();
    payload.account_number = document.getElementById('mapper-param-number').value.trim();
  } else if (service === 'nik') {
    payload.nik = document.getElementById('mapper-param-nik').value.trim();
  } else if (service === 'whatsapp') {
    payload.number = document.getElementById('mapper-param-wa').value.trim();
  } else if (service === 'games') {
    payload.game_service = document.getElementById('mapper-param-game-service').value.trim();
    payload.game_user_id = document.getElementById('mapper-param-game-userid').value.trim();
    payload.game_zone_id = document.getElementById('mapper-param-game-zoneid').value.trim();
  }
  return payload;
}

window.responseMapperFetchSample = function() {
  fetch(mapperApiUrl('/sample'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(collectMapperSamplePayload())
  })
    .then(function(r) { return parseMapperResponse(r, 'Gagal mengambil contoh respon.'); })
    .then(function(res) {
      if (!res.status) throw new Error(res.message || res.error || 'Gagal mengambil contoh respon.');
      responseMapperState.current = res.data;
      responseMapperState.draftMapping = JSON.parse(JSON.stringify(res.data.draft_mapping || { field_output: [] }));
      renderResponseMappingPayload();
      alert(res.message || 'Contoh respon berhasil diambil.');
    })
    .catch(function(err) {
      alert(err.message || err);
    });
};

window.responseMapperPreview = function(showAlert) {
  clearTimeout(responseMapperState.previewTimer);
  responseMapperState.previewTimer = setTimeout(function() {
    if (!responseMapperState.current || !responseMapperState.current.sample_source) return;
    fetch(mapperApiUrl('/preview'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_type: responseMapperState.selectedService,
        provider_code: responseMapperState.selectedProvider,
        mapping_json: responseMapperState.draftMapping
      })
    })
      .then(function(r) { return parseMapperResponse(r, 'Gagal membuat preview.'); })
      .then(function(res) {
        if (!res.status) throw new Error(res.message || res.error || 'Gagal membuat preview.');
        document.getElementById('mapper-preview-json').textContent = JSON.stringify(res.data, null, 2);
        if (showAlert) alert('Preview berhasil diperbarui.');
      })
      .catch(function(err) {
        document.getElementById('mapper-preview-json').textContent = 'Preview gagal dibuat.\\n' + (err.message || err);
        if (showAlert) alert(err.message || err);
      });
  }, showAlert ? 0 : 250);
};

window.responseMapperSaveDraft = function() {
  fetch(mapperApiUrl('/draft'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_type: responseMapperState.selectedService,
      provider_code: responseMapperState.selectedProvider,
      mapping_json: responseMapperState.draftMapping
    })
  })
    .then(function(r) { return parseMapperResponse(r, 'Gagal menyimpan draf.'); })
    .then(function(res) {
      if (!res.status) throw new Error(res.message || res.error || 'Gagal menyimpan draf.');
      responseMapperState.current = res.data;
      responseMapperState.draftMapping = JSON.parse(JSON.stringify(res.data.draft_mapping || { field_output: [] }));
      renderResponseMappingPayload();
      alert(res.message || 'Draf berhasil disimpan.');
    })
    .catch(function(err) {
      alert(err.message || err);
    });
};

window.responseMapperPublish = function() {
  if (!confirm('Terapkan draf mapping ini ke response aktif user?')) return;
  fetch(mapperApiUrl('/publish'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_type: responseMapperState.selectedService,
      provider_code: responseMapperState.selectedProvider
    })
  })
    .then(function(r) { return parseMapperResponse(r, 'Gagal menerapkan mapping.'); })
    .then(function(res) {
      if (!res.status) throw new Error(res.message || res.error || 'Gagal menerapkan mapping.');
      responseMapperState.current = res.data;
      responseMapperState.draftMapping = JSON.parse(JSON.stringify(res.data.draft_mapping || { field_output: [] }));
      renderResponseMappingPayload();
      alert(res.message || 'Mapping berhasil diterapkan.');
    })
    .catch(function(err) {
      alert(err.message || err);
    });
};

window.responseMapperResetDraft = function() {
  if (!confirm('Kembalikan draf ke pengaturan awal sistem saat ini?')) return;
  fetch(mapperApiUrl('/reset'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_type: responseMapperState.selectedService,
      provider_code: responseMapperState.selectedProvider
    })
  })
    .then(function(r) { return parseMapperResponse(r, 'Gagal reset draf.'); })
    .then(function(res) {
      if (!res.status) throw new Error(res.message || res.error || 'Gagal reset draf.');
      responseMapperState.current = res.data;
      responseMapperState.draftMapping = JSON.parse(JSON.stringify(res.data.draft_mapping || { field_output: [] }));
      renderResponseMappingPayload();
      alert(res.message || 'Draf berhasil dikembalikan ke pengaturan awal.');
    })
    .catch(function(err) {
      alert(err.message || err);
    });
};

window.responseMapperRollback = function() {
  var versionId = document.getElementById('mapper-version-select').value;
  if (!versionId) return alert('Belum ada versi publish untuk dikembalikan.');
  if (!confirm('Kembalikan mapping aktif ke versi publish yang dipilih?')) return;
  fetch(mapperApiUrl('/rollback'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_type: responseMapperState.selectedService,
      provider_code: responseMapperState.selectedProvider,
      version_id: versionId
    })
  })
    .then(function(r) { return parseMapperResponse(r, 'Gagal rollback mapping.'); })
    .then(function(res) {
      if (!res.status) throw new Error(res.message || res.error || 'Gagal rollback mapping.');
      responseMapperState.current = res.data;
      responseMapperState.draftMapping = JSON.parse(JSON.stringify(res.data.draft_mapping || { field_output: [] }));
      renderResponseMappingPayload();
      alert(res.message || 'Mapping berhasil dikembalikan.');
    })
    .catch(function(err) {
      alert(err.message || err);
    });
};

window.restartWA = function() {
  fetch('/admin/wa-restart?key=${ADMIN_KEY}', { method: 'POST' })
    .then(function(r){ return r.json(); })
    .then(function(d){
      alert(d.message || (d.status ? 'Baileys starting...' : 'Gagal start Baileys.'));
      if (typeof window.refreshWaQr === 'function') window.refreshWaQr();
    })
    .catch(function(err){ alert('Gagal restart Baileys: ' + err.message); });
};
window.generateWaPairingCode = function() {
  var input = document.getElementById('wa-pairing-number');
  var view = document.getElementById('wa-pairing-code-view');
  var renderPairingView = function(code, note) {
    if (!view) return;
    var safeCode = String(code || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var safeNote = String(note || 'Generate kode lalu masukkan di WhatsApp: Perangkat tertaut.').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    view.innerHTML = '<span class="wa-pairing-label">Pairing Code</span><strong>' + safeCode + '</strong><small>' + safeNote + '</small>';
  };
  var num = String((input && input.value) || '').replace(/[^0-9]/g, '');
  if (!num) {
    alert('Isi nomor WA dulu (format 628...).');
    return;
  }
  renderPairingView('...', 'Sedang membuat kode pairing.');
  fetch('/admin/wa-pairing-code?key=${ADMIN_KEY}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ number: num })
  })
    .then(function(r){ return r.json(); })
    .then(function(d){
      if (!d || !d.status) throw new Error((d && d.message) || 'Gagal generate pairing code.');
      if (d.connected) {
        renderPairingView('CONNECTED', 'Akun WhatsApp sudah terhubung.');
        if (typeof window.refreshWaQr === 'function') window.refreshWaQr(false);
        return;
      }
      renderPairingView(String(d.code || '-'), d.updated_at ? ('Update ' + new Date(d.updated_at).toLocaleTimeString() + '. Masukkan kode ini di WhatsApp.') : 'Masukkan kode ini di WhatsApp.');
    })
    .catch(function(err){
      renderPairingView('ERROR', err.message || 'Gagal membuat pairing code.');
      alert('Gagal generate pairing code: ' + err.message);
    });
};
window.logoutWA = function() {
  if (!confirm('Logout sesi Baileys dan hapus session tersimpan?')) return;
  fetch('/admin/wa-logout?key=${ADMIN_KEY}', { method: 'POST' })
    .then(function(r){ return r.json(); })
    .then(function(d){
      alert(d.message || (d.status ? 'Logout berhasil.' : 'Logout gagal.'));
      if (typeof window.refreshWaQr === 'function') window.refreshWaQr();
    })
    .catch(function(err){ alert('Gagal logout Baileys: ' + err.message); });
};
window.resetWA = function() {
  if (typeof window.refreshWaQr === 'function') window.refreshWaQr(true);
};
window.refreshWaQr = function(forceStart) {
  var applyConnectedNumber = function(rawNumber) {
    var n = String(rawNumber || '').replace(/[^0-9]/g, '');
    if (!n) return;
    var input = document.querySelector('input[name="member_register_otp_target_number"]');
    var pairingNumberInput = document.getElementById('wa-pairing-number');
    if (!input) return;
    var current = String(input.value || '').trim();
    var isPlaceholder = /x{3,}/i.test(current);
    if (!current || isPlaceholder) input.value = n;
    if (pairingNumberInput) {
      var pairingVal = String(pairingNumberInput.value || '').trim();
      if (!pairingVal || /x{3,}/i.test(pairingVal)) pairingNumberInput.value = n;
    }
  };
  var statusEl = document.getElementById('wa-qr-status');
  var wrap = document.getElementById('wa-qr-wrap');
  var pairingView = document.getElementById('wa-pairing-code-view');
  var renderPairingStatus = function(code, note) {
    if (!pairingView) return;
    var safeCode = String(code || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var safeNote = String(note || 'Generate kode lalu masukkan di WhatsApp: Perangkat tertaut.').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    pairingView.innerHTML = '<span class="wa-pairing-label">Pairing Code</span><strong>' + safeCode + '</strong><small>' + safeNote + '</small>';
  };
  if (!statusEl || !wrap) return;
  statusEl.textContent = 'Memuat status QR...';
  var startPromise = Promise.resolve();
  if (forceStart) {
    startPromise = fetch('/admin/wa-restart?key=${ADMIN_KEY}', { method: 'POST' })
      .then(function(r){ return r.json(); })
      .catch(function(){ return null; });
  }
  startPromise.finally(function() {
    fetch('/admin/wa-qr?key=${ADMIN_KEY}&t=' + Date.now())
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (!d || d.status !== true) throw new Error('QR response invalid');
        if (d.connected) {
          statusEl.textContent = 'Baileys Connected';
          applyConnectedNumber(d.connected_number);
          renderPairingStatus('CONNECTED', 'Akun WhatsApp sudah terhubung.');
          wrap.innerHTML = '<div style="text-align:center;"><div class="badge badge-green mb-2">Connected</div><div class="text-muted" style="font-size:12px;">QR tidak diperlukan.</div></div>';
          return;
        }
        if (pairingView && d.pairing_code) {
          renderPairingStatus(String(d.pairing_code), d.pairing_updated_at ? ('Update ' + new Date(d.pairing_updated_at).toLocaleTimeString() + '. Masukkan kode ini di WhatsApp.') : 'Masukkan kode ini di WhatsApp.');
        }
        if (d.qr_available && d.qr_base64) {
          statusEl.textContent = 'QR Ready' + (d.qr_updated_at ? (' • ' + new Date(d.qr_updated_at).toLocaleTimeString()) : '');
          wrap.innerHTML = '<img src="' + d.qr_base64 + '" alt="QR Baileys" style="width:220px;height:220px;object-fit:contain;border-radius:8px;background:#fff;padding:8px;">';
        } else {
          statusEl.textContent = 'Menunggu QR...';
          wrap.innerHTML = '<div class="text-muted" style="font-size:12px;">QR belum tersedia. Klik Connect/Restart.</div>';
        }
      })
      .catch(function(err){
        statusEl.textContent = 'Error QR';
        wrap.innerHTML = '<div class="text-danger" style="font-size:12px;">' + (err.message || 'Gagal memuat QR') + '</div>';
      });
  });
};
window.onGameServiceChange = function() {
  var ZONE_SERVICES = ['region-ml','mlbb-bundle','mlcreate','first-topup','first-mcgg'];
  var serviceEl = document.getElementById('tt-gmc-service');
  var zoneWrap = document.getElementById('tt-gmc-zone-wrap');
  if (!serviceEl || !zoneWrap) return;
  var svc = serviceEl.value || '';
  zoneWrap.style.display = ZONE_SERVICES.includes(svc) ? '' : 'none';
};
window.testGames = function() {
  var btn = document.getElementById('btn-games');
  var box = document.getElementById('test-result');
  var serviceEl = document.getElementById('tt-gmc-service');
  var uidEl = document.getElementById('tt-gmc-uid');
  var zoneEl = document.getElementById('tt-gmc-zone');
  if (!btn || !box || !serviceEl || !uidEl || !zoneEl) {
    alert('Form tester game belum siap dimuat.');
    return;
  }
  var service = serviceEl.value || '';
  var uid = uidEl.value.trim();
  var zone = zoneEl.value.trim();
  var ZONE_SERVICES = ['region-ml','mlbb-bundle','mlcreate','first-topup','first-mcgg'];
  if (!uid) { alert('Harap isi User ID!'); return; }
  if (ZONE_SERVICES.includes(service) && !zone) { alert('Zone ID wajib untuk game ini!'); return; }
  var orig = btn.innerHTML; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Menguji...'; btn.disabled = true;
  box.style.display = 'block'; box.textContent = 'Menunggu respon...';
  var t0 = performance.now();
  var url = '/admin/test-server?key=${ADMIN_KEY}&type=games&game_service=' + encodeURIComponent(service) + '&game_user_id=' + encodeURIComponent(uid);
  if (zone) url += '&game_zone_id=' + encodeURIComponent(zone);
  fetch(url).then(function(r) {
    return r.json().then(function(data) {
      var ms = (performance.now() - t0).toFixed(2);
      box.textContent = '// Game: ' + service + ' | Latency: ' + ms + 'ms\\n' + JSON.stringify(data, null, 2);
      box.style.color = data.status ? '#3fb950' : '#f85149';
    });
  }).catch(function(err) {
    box.style.color = '#f85149';
    box.textContent = 'Error:\\n' + err.message;
  }).finally(function() { btn.innerHTML = orig; btn.disabled = false; });
};
window.testAPI = function(type,codeId,numId,srvId){
  var btn=document.getElementById('btn-'+type);
  var box=document.getElementById('test-result');
  if(!btn||!box){alert('UI tester belum siap dimuat.');return;}
  var codeEl=codeId?document.getElementById(codeId):null;
  var numEl=numId?document.getElementById(numId):null;
  var serverEl=srvId?document.getElementById(srvId):null;
  var code=codeEl?codeEl.value.trim():'';
  var number=numEl?numEl.value.trim():'';
  var server=serverEl?(serverEl.value||'auto'):'auto';
  if(!number){alert(type==='ai'?'Harap isi image URL!':'Harap isi nomor yang akan diuji!');return;}
  if(type==='ai' && !code){alert('Harap isi prompt/query AI!');return;}
  if((type==='bank'||type==='ewallet')&&!code){alert('Harap isi kode provider/bank!');return;}
  log('Testing '+type+' ['+server+']: '+(code?code+' ':'')+number);
  var orig=btn.innerHTML; btn.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span>Menguji...'; btn.disabled=true;
  box.style.display='block'; box.textContent='Menunggu respon...';
  var t0=performance.now();
  var url;
  if(server!=='auto'){
    // Admin-specific server test — no billing, no cache
    url='/admin/test-server?key=${ADMIN_KEY}&type='+encodeURIComponent(type)+'&server='+encodeURIComponent(server);
    if(type==='nik')url+='&nik='+encodeURIComponent(number);
    else if(type==='whatsapp')url+='&nomor='+encodeURIComponent(number);
    else if(type==='ai')url+='&image='+encodeURIComponent(number)+'&q='+encodeURIComponent(code);
    else{url+='&code='+encodeURIComponent(code)+'&account_number='+encodeURIComponent(number);}
  } else {
    var apiKeyNode=document.getElementById('tt-api-key');
    var apiKeyInput=apiKeyNode?apiKeyNode.value.trim():'';
    url='/api/v3/validate?type='+type+'&api_key='+encodeURIComponent(apiKeyInput);
    if(type==='nik')url+='&nik='+encodeURIComponent(number);
    else if(type==='whatsapp')url+='&nomor='+encodeURIComponent(number);
    else if(type==='ai')url+='&image='+encodeURIComponent(number)+'&q='+encodeURIComponent(code);
    else url+='&code='+encodeURIComponent(code)+'&account_number='+encodeURIComponent(number);
  }
  fetch(url).then(async function(res){
    var ms=(performance.now()-t0).toFixed(2);
    var rawText = await res.text();
    var data = null;
    try { data = JSON.parse(rawText); } catch (e) { data = null; }

    if (!data) {
      log('Test non-JSON ['+server+']: HTTP '+res.status);
      box.style.color='#f85149';
      box.textContent='// Server: '+server+' | Latency: '+ms+'ms | HTTP: '+res.status+'\\n' +
        'Response bukan JSON. Kemungkinan upstream/proxy error.\\n\\n' + rawText;
      return;
    }

    if (type === 'ewallet' && server === 'server5' && data.state === 'pending' && data.ref_id) {
      log('Qiospay pending ['+data.ref_id+'], polling callback...');
      box.style.color='#d29922';
      box.textContent='// Server: '+server+' | Latency: '+ms+'ms\\n'+JSON.stringify(data,null,2)+'\\n\\nMenunggu callback Qiospay...';
      var refId = data.ref_id;
      var attempts = 0;
      return new Promise(function(resolve) {
        function poll() {
          attempts++;
          fetch('/admin/test-server/qiospay-result?key=${ADMIN_KEY}&ref_id=' + encodeURIComponent(refId))
            .then(async function(r) {
              var txt = await r.text();
              var out = null;
              try { out = JSON.parse(txt); } catch (e) { out = null; }
              var totalMs = (performance.now()-t0).toFixed(2);
              if (!out) {
                box.style.color='#f85149';
                box.textContent='// Server: '+server+' | Latency: '+totalMs+'ms | HTTP: '+r.status+'\\nResponse polling bukan JSON.\\n\\n'+txt;
                resolve();
                return;
              }
              box.style.color=out.status?'#3fb950':(out.state==='waiting'?'#d29922':'#f85149');
              box.textContent='// Server: '+server+' | Latency: '+totalMs+'ms | Poll: '+attempts+'\\n'+JSON.stringify(out,null,2);
              if (out.status || out.state === 'success' || out.state === 'timeout' || out.state === 'callback_received' || out.state === 'not_found') {
                resolve();
                return;
              }
              setTimeout(poll, 1000);
            })
            .catch(function(err) {
              box.style.color='#f85149';
              box.textContent='Error polling callback:\\n'+err.message;
              resolve();
            });
        }
        setTimeout(poll, 1000);
      });
    }

    log('Test OK ['+server+']: '+ms+'ms');
    box.textContent='// Server: '+server+' | Latency: '+ms+'ms\\n'+JSON.stringify(data,null,2);
    box.style.color=data.status?'#3fb950':'#f85149';
  }).catch(function(err){
    box.style.color='#f85149';
    box.textContent='Error:\\n'+err.message;
  }).finally(function(){
    btn.innerHTML = orig;
    btn.disabled = false;
  });
};

window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    }).catch(err => {
        alert('Failed to copy: ' + err);
    });
};
(function(){
  'use strict';
  log('Initializing v3.1 Bootstrap...');
  // Initialize games zone field visibility
  if (typeof onGameServiceChange === 'function') onGameServiceChange();
  setInterval(function(){
    if (document.visibilityState !== 'visible') return;
    fetch('/admin/stats?key=${ADMIN_KEY}').then(function(r){
      if(!r.ok)return; return r.json();
    }).then(function(s){
      if(!s)return;
      var types=['bank','ewallet','nik','whatsapp','games','bpjs','pln','ai'];
      var periods=['today','all'];
      var metrics=['valid','failed','total'];
      var heroTotal=0, heroValid=0;
      for(var ti=0;ti<types.length;ti++){
        var t=types[ti];
        var st = (s && s[t] && s[t].today && s[t].all) ? s[t] : { today: { valid: 0, failed: 0, total: 0 }, all: { valid: 0, failed: 0, total: 0 } };
        heroTotal+=st.today.total;
        heroValid+=st.today.valid;
        var barV=document.getElementById(t+'-bar-v');
        var barF=document.getElementById(t+'-bar-f');
        if(barV&&barF&&st.today.total>0){
          barV.style.width=(st.today.valid/st.today.total*100)+'%';
          barF.style.width=(st.today.failed/st.today.total*100)+'%';
        } else if (barV && barF) {
          barV.style.width='0%';
          barF.style.width='0%';
        }
        for(var pi=0;pi<periods.length;pi++){
          for(var mi=0;mi<metrics.length;mi++){
            var el=document.getElementById(types[ti]+'-'+periods[pi]+'-'+metrics[mi]);
            if(el)el.textContent=Number(st[periods[pi]][metrics[mi]]||0).toLocaleString('id-ID');
          }
        }
      }
      var heroTotalEl = document.getElementById('hero-today-total');
      if (heroTotalEl) heroTotalEl.textContent = heroTotal.toLocaleString();
      var heroRateEl = document.getElementById('hero-valid-rate');
      if (heroRateEl) heroRateEl.textContent = (heroTotal>0?Math.round(heroValid/heroTotal*100):0)+'%';
    }).catch(function(){});

    fetch('/admin/mysql-status?key=${ADMIN_KEY}').then(r=>r.json()).then(d=>{
      var b=document.getElementById('mysql-status-badge');
      if(!b)return;
      if(d.connected){
        b.className='kr-status-pill kr-status-pill--success';
        b.innerHTML='<span class="kr-status-pill__dot"></span><span>MySQL Ready</span>';
      } else {
        b.className='kr-status-pill kr-status-pill--error' ;
        b.style.color='var(--kr-red)';b.style.background='var(--kr-red-soft)';
        b.innerHTML='<span class="kr-status-pill__dot"></span><span>MySQL Error</span>';
      }
    });

    var badge=document.getElementById('wa-conn-status-badge');
    var providerInfo=document.getElementById('wa-provider-info');
    var syncStatusEl = document.getElementById('js-sync-status');
    if (!badge) {
      if (syncStatusEl) syncStatusEl.textContent = 'aktif';
      return;
    }

    fetch('/admin/wa-check-v2?key=${ADMIN_KEY}&t='+Date.now()).then(function(r){return r.json();}).then(function(data){
      badge.textContent = data.status || 'External Not Configured';
      var isReady = !!data.connected;
      badge.className='wa-status-badge ' + (isReady ? 'wa-status-connected' : 'wa-status-disconnected');
      if (providerInfo) {
        var p = data.providers || {};
        var labels = [];
        if (p.checker_fonnte) labels.push('Fonnte');
        if (p.checker_pitucode) labels.push('Pitucode');
        var notif = p.selected_notification_provider ? (' | Notif: ' + p.selected_notification_provider) : '';
        providerInfo.textContent = (labels.length ? ('Validasi: ' + labels.join(', ')) : 'Validasi: none') + notif;
      }
      if (data && data.connected_number) {
        var input = document.querySelector('input[name="member_register_otp_target_number"]');
        if (input) {
          var nowVal = String(input.value || '').trim();
          if (!nowVal || /x{3,}/i.test(nowVal)) input.value = String(data.connected_number);
        }
      }
      if (!data.connected && typeof window.refreshWaQr === 'function') window.refreshWaQr(false);
      if (syncStatusEl) syncStatusEl.textContent='aktif (Synced)';
    }).catch(function(err){
      if (syncStatusEl) syncStatusEl.textContent='error: '+err.message;
    });
  }, 20000);
  
  // MySQL Management Functions
  window.loadMySQLInfo = function() {
    fetch('/api/v3/admin/mysql/info?key=${ADMIN_KEY}')
      .then(r => r.json())
      .then(res => {
        if (res.status) {
          const d = res.data;
          document.getElementById('mysql-host').textContent = d.config.host + ':' + (d.config.port || 3306);
          document.getElementById('mysql-db').textContent = d.config.database;
          document.getElementById('mysql-ver').textContent = d.version ? d.version.split(',')[0] : '-';
          document.getElementById('mysql-status').className = 'badge badge-green';
          document.getElementById('mysql-status').textContent = '● Connected';
          document.getElementById('mysql-config-host').value = d.config.host;
          document.getElementById('mysql-config-port').value = d.config.port || 3306;
          document.getElementById('mysql-config-db').value = d.config.database;
          document.getElementById('mysql-config-user').value = d.user ? d.user.split('@')[0] : '-';
        }
      })
      .catch(err => {
        document.getElementById('mysql-status').className = 'badge badge-red';
        document.getElementById('mysql-status').textContent = '● Disconnected';
        console.error(err);
      });
  };
  
  window.loadMySQLTables = function() {
    fetch('/api/v3/admin/mysql/tables?key=${ADMIN_KEY}')
      .then(r => r.json())
      .then(res => {
        if (res.status) {
          const tbody = document.getElementById('mysql-tables-body');
          tbody.innerHTML = '';
          document.getElementById('mysql-total-size').textContent = res.data.total_size_mb;
          document.getElementById('mysql-table-count').textContent = res.data.tables.length;
          
          res.data.tables.forEach(t => {
            const tr = document.createElement('tr');
            const created = new Date(t.created).toLocaleString('id-ID');
            const safeNameText = escapeHtmlText(t.name || '');
            const safeNameAttr = escapeHtmlAttr(t.name || '');
            tr.innerHTML = \`
              <td class="ps-3"><strong>\${safeNameText}</strong></td>
              <td>\${\(t.rows||0\).toLocaleString\(\)}</td>
              <td>\${\(parseFloat\(t.size_mb\)||0\).toFixed\(2\)}</td>
              <td style="font-size:11px;color:#8b949e;">\${escapeHtmlText(created)}</td>
              <td class="text-end pe-3">
                <button class="btn btn-primary-soft btn-sm" data-table-name="\${safeNameAttr}">
                  <i class="bi bi-eye me-1"></i>Browse
                </button>
              </td>
            \`;
            const browseBtn = tr.querySelector('button[data-table-name]');
            if (browseBtn) {
              browseBtn.addEventListener('click', function() {
                browseTable(String(this.getAttribute('data-table-name') || ''));
              });
            }
            tbody.appendChild(tr);
          });
        } else {
          document.getElementById('mysql-tables-body').innerHTML = '<tr><td colspan="4" class="text-danger ps-3">Error: ' + escapeHtmlText(res.error || res.message || 'Unknown server error') + '</td></tr>';
        }
      })
      .catch(err => {
        document.getElementById('mysql-tables-body').innerHTML = '<tr><td colspan="4" class="text-danger ps-3">Error: ' + escapeHtmlText(err.message || err) + '</td></tr>';
      });
  };
  
  window.loadVPSStatus = function() {
    fetch('/api/v3/vps-status?key=${ADMIN_KEY}')
      .then(r => r.json())
      .then(res => {
        if (!res.status) return;
        const d = res.data;
        document.getElementById('vps-cpu-model').textContent = d.cpu.model.split('@')[0].trim();
        document.getElementById('vps-cpu-model').title = d.cpu.model;
        document.getElementById('vps-cpu-cores').textContent = d.cpu.cores + ' Cores';
        document.getElementById('vps-cpu-load').textContent = 'Load: ' + d.cpu.load_1m.toFixed(2);
        
        document.getElementById('vps-mem-usage').textContent = d.memory.usage_percent + '%';
        document.getElementById('vps-mem-text').textContent = d.memory.used_mb + ' MB / ' + d.memory.total_mb + ' MB';
        document.getElementById('vps-mem-bar').style.width = d.memory.usage_percent + '%';
        
        const up = Math.floor(d.uptime_seconds/3600)+'h '+Math.floor((d.uptime_seconds%3600)/60)+'m';
        document.getElementById('vps-uptime').textContent = up;

        const ipEl = document.getElementById('vps-ip');
        if (ipEl) {
          if (d.ip && d.ip.length) {
            ipEl.innerHTML = d.ip.map(i => '<span title="'+i.iface+'">'+i.address+'</span>').join(' &nbsp;|&nbsp; ');
          } else {
            ipEl.textContent = 'IP tidak tersedia';
          }
        }

        const formatBytes = (bytes) => {
          if (bytes === null || bytes === undefined) return '-';
          const b = Number(bytes);
          if (!Number.isFinite(b)) return '-';
          const units = ['B','KB','MB','GB','TB'];
          let v = b;
          let i = 0;
          while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
          return v.toFixed(i === 0 ? 0 : 2) + ' ' + units[i];
        };

        if (d.disk) {
          const used = d.disk.used_bytes;
          const total = d.disk.total_bytes;
          const pct = d.disk.usage_percent;
          document.getElementById('vps-disk-usage').textContent = (pct !== null && pct !== undefined ? pct : '-') + '%';
          document.getElementById('vps-disk-text').textContent = formatBytes(used) + ' / ' + formatBytes(total) + ' (' + (d.disk.path || '-') + ')';
          document.getElementById('vps-disk-bar').style.width = (pct || 0) + '%';
        } else {
          document.getElementById('vps-disk-usage').textContent = '-';
          document.getElementById('vps-disk-text').textContent = 'Disk data not available';
          document.getElementById('vps-disk-bar').style.width = '0%';
        }

        if (d.network) {
          const rxps = d.network.rx_per_sec;
          const txps = d.network.tx_per_sec;
          document.getElementById('vps-net-text').textContent = 'RX: ' + (rxps === null ? '-' : formatBytes(rxps) + '/s') + ' / TX: ' + (txps === null ? '-' : formatBytes(txps) + '/s');
          document.getElementById('vps-net-rx-total').textContent = formatBytes(d.network.total_rx_bytes);
          document.getElementById('vps-net-tx-total').textContent = formatBytes(d.network.total_tx_bytes);
        } else {
          document.getElementById('vps-net-text').textContent = 'RX: - / TX: -';
          document.getElementById('vps-net-rx-total').textContent = '-';
          document.getElementById('vps-net-tx-total').textContent = '-';
        }

        if (d.wa) {
          const el = document.getElementById('vps-wa-status');
          el.textContent = d.wa.status || '-';
          el.className = 'badge ' + (d.wa.connected ? 'bg-success' : (d.wa.status === 'Waiting/QR' ? 'bg-warning' : 'bg-danger'));
        } else {
          document.getElementById('vps-wa-status').textContent = '-';
        }

        if (d.process) {
          document.getElementById('vps-pid').textContent = d.process.pid || '-';
          const pup = Number(d.process.uptime_seconds || 0);
          const ph = Math.floor(pup/3600);
          const pm = Math.floor((pup%3600)/60);
          document.getElementById('vps-proc-uptime').textContent = ph + 'h ' + pm + 'm';
        } else {
          document.getElementById('vps-pid').textContent = '-';
          document.getElementById('vps-proc-uptime').textContent = '-';
        }

        const tbody = document.getElementById('vps-proc-body');
        if (tbody) {
          const list = Array.isArray(d.top_processes) ? d.top_processes : [];
          if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-3 vps-proc-empty">Belum ada data proses.</td></tr>';
          } else {
            const escProc = function(v) {
              return String(v === undefined || v === null ? '-' : v)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            };
            let html = '';
            list.forEach(p => {
              const cpu = (p.cpu !== undefined && p.cpu !== null) ? p.cpu : '-';
              const mem = (p.mem_percent !== undefined && p.mem_percent !== null) ? (p.mem_percent + '%') : (p.mem_bytes ? formatBytes(p.mem_bytes) : '-');
              html += '<tr class="vps-proc-row">' +
                '<td class="ps-3">' + escProc(p.pid || '-') + '</td>' +
                '<td><span class="vps-proc-name" title="' + escProc(p.name || '-') + '">' + escProc(p.name || '-') + '</span></td>' +
                '<td><span class="vps-proc-chip">' + escProc(cpu) + '</span></td>' +
                '<td><span class="vps-proc-chip">' + escProc(mem) + '</span></td>' +
              '</tr>';
            });
            tbody.innerHTML = html;
          }
        }
      })
      .then(() => fetch('/admin/mysql-status?key=${ADMIN_KEY}').then(r => r.json()).catch(() => null))
      .then(mysqlRes => {
        const el = document.getElementById('vps-mysql-status');
        if (!el) return;
        if (!mysqlRes) { el.textContent = 'Unknown'; return; }
        el.textContent = mysqlRes.connected ? 'Connected' : 'Disconnected';
        el.className = mysqlRes.connected ? 'text-success' : 'text-danger';
      })
      .catch(console.error);
  };

  window.clearAllCaches = function() {
    if (!confirm('Clear semua cache aplikasi?')) return;
    fetch('/api/v3/admin/cache/clear?key=${ADMIN_KEY}', { method: 'POST' })
      .then(r => r.json())
      .then(res => {
        if (res.status) alert(res.message || 'Cache cleared');
        else alert('Error: ' + (res.error || 'Unknown error'));
      })
      .catch(err => alert('Error: ' + err.message));
  };

  let realtimeLogsTimer = null;
  let realtimeLogsType = '';
  let realtimeLogsLast = [];

  window.openRealtimeApiLogs = function(type) {
    realtimeLogsType = (type || '').toLowerCase();
    document.getElementById('realtime-logs-type').textContent = realtimeLogsType || '-';
    document.getElementById('realtime-logs-body').innerHTML = '<tr><td colspan="8" class="text-center text-muted py-3">Loading...</td></tr>';
    document.getElementById('realtime-log-req').textContent = '-';
    document.getElementById('realtime-log-res').textContent = '-';
    document.getElementById('realtime-logs-updated').textContent = '-';

    const modalEl = document.getElementById('realtimeLogsModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    refreshRealtimeLogs();
    if (realtimeLogsTimer) clearInterval(realtimeLogsTimer);
    realtimeLogsTimer = setInterval(refreshRealtimeLogs, 3000);

    modalEl.addEventListener('hidden.bs.modal', function() {
      if (realtimeLogsTimer) clearInterval(realtimeLogsTimer);
      realtimeLogsTimer = null;
    }, { once: true });
  };

  window.refreshRealtimeLogs = function() {
    const tbody = document.getElementById('realtime-logs-body');
    if (!tbody) return;

    const url = '/api/v3/admin/logs/recent?key=${ADMIN_KEY}&limit=20&type=' + encodeURIComponent(realtimeLogsType || '');
    fetch(url)
      .then(r => r.json())
      .then(res => {
        if (!res.status) throw new Error(res.error || 'Gagal load logs');
        const rows = Array.isArray(res.data) ? res.data : [];
        realtimeLogsLast = rows;
        if (!rows.length) {
          tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-3">Tidak ada data.</td></tr>';
          document.getElementById('realtime-logs-updated').textContent = new Date().toLocaleTimeString('id-ID');
          return;
        }

        let html = '';
        rows.forEach((r, idx) => {
          const time = r.created_at ? String(r.created_at).slice(11, 19) : '-';
          const t = r.log_type || '-';
          const ok = String(r.is_success) === '1' || r.is_success === 1;
          const status = (r.status_code !== null && r.status_code !== undefined) ? r.status_code : '-';
          const rt = (r.response_time !== null && r.response_time !== undefined) ? (r.response_time + 'ms') : '-';
          const key = (r.user_name && r.user_id) ? (r.user_name + ' (' + r.user_id + ')') : (r.api_key || '-');
          const ip = r.ip_address || '-';
          const ep = r.endpoint || '-';
          html += '<tr>' +
            '<td class="ps-3" style="font-size:12px;color:#8b949e;">' + time + '</td>' +
            '<td><span class="badge badge-blue">' + t + '</span></td>' +
            '<td><span class="badge ' + (ok ? 'badge-green' : 'badge-red') + '">' + status + '</span></td>' +
            '<td style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size:12px; max-width: 200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + key + '</td>' +
            '<td style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size:12px;">' + ip + '</td>' +
            '<td style="font-size:12px;color:#8b949e;">' + rt + '</td>' +
            '<td style="font-size:12px; max-width: 260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + ep + '</td>' +
            '<td class="text-end pe-3"><button class="btn btn-sm btn-outline-secondary" onclick="showRealtimeLogDetail(' + idx + ')"><i class="bi bi-eye"></i></button></td>' +
          '</tr>';
        });
        tbody.innerHTML = html;
        document.getElementById('realtime-logs-updated').textContent = new Date().toLocaleTimeString('id-ID');
      })
      .catch(err => {
        tbody.innerHTML = '<tr><td colspan="8" class="text-danger ps-3 py-3">Error: ' + (err.message || err) + '</td></tr>';
      });
  };

  window.showRealtimeLogDetail = function(idx) {
    const r = realtimeLogsLast && realtimeLogsLast[idx] ? realtimeLogsLast[idx] : null;
    if (!r) return;
    document.getElementById('realtime-log-req').textContent = r.request_data || '-';
    document.getElementById('realtime-log-res').textContent = r.response_data || '-';
  };
  
  window.createMySQLBackup = function() {
    const btn = event.target;
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Creating...';
    btn.disabled = true;
    
    fetch('/api/v3/admin/mysql/backup?key=${ADMIN_KEY}')
      .then(r => r.json())
      .then(res => {
        btn.innerHTML = orig;
        btn.disabled = false;
        
        if (res.status) {
          alert('Backup SQL berhasil dibuat!\\nFile: ' + res.file + '\\nSize: ' + res.size_kb + ' KB');
          if (res.download_url) window.open(res.download_url, '_blank');
          loadBackupList();
        } else {
          alert('Error: ' + res.error);
        }
      })
      .catch(err => {
        btn.innerHTML = orig;
        btn.disabled = false;
        alert('Error: ' + err.message);
      });
  };
  
  window.loadBackupList = function() {
    fetch('/api/v3/admin/mysql/backups?key=${ADMIN_KEY}')
      .then(r => r.json())
      .then(res => {
        if (res.status) {
          const tbody = document.getElementById('mysql-backups-body');
          tbody.innerHTML = '';
          
          if (res.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">No backups found</td></tr>';
            document.getElementById('backup-count').textContent = '0 backups';
            return;
          }
          
          document.getElementById('backup-count').textContent = res.data.length + ' backups tersedia';
          
          res.data.forEach(b => {
            const tr = document.createElement('tr');
            const created = new Date(b.created).toLocaleString('id-ID');
            const downloadUrl = '/api/v3/admin/mysql/backup/download?key=${ADMIN_KEY}&file=' + encodeURIComponent(b.name);
            tr.innerHTML =
              '<td class="ps-3"><strong>'+b.name+'</strong></td>' +
              '<td>'+b.size_kb+'</td>' +
              '<td style="font-size:11px;color:#8b949e;">'+created+'</td>' +
              '<td class="text-end pe-3">' +
                '<a class="btn btn-sm btn-outline-secondary me-2" href="'+downloadUrl+'" target="_blank"><i class="bi bi-download"></i></a>' +
                '<button class="btn btn-sm btn-outline-warning" onclick="importBackupFile(\\''+b.name+'\\')"><i class="bi bi-upload"></i></button>' +
              '</td>';
            tbody.appendChild(tr);
          });
        }
      })
      .catch(err => {
        document.getElementById('mysql-backups-body').innerHTML = '<tr><td colspan="4" class="text-danger ps-3">Error: ' + err.message + '</td></tr>';
      });
  };

  window.importBackupFile = function(filename) {
    if (!confirm('Import file backup ini ke database?\\n' + filename + '\\n\\nProses ini akan menjalankan SQL ke MySQL.')) return;

    fetch('/api/v3/admin/mysql/import-file?key=${ADMIN_KEY}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: filename, dry_run: true })
    })
    .then(r => r.json())
    .then(res => {
      if (!res.status) throw new Error(res.error || 'Validasi gagal');
      const info = 'Valid. Statements: ' + (res.statements_count || 0) + '\\nTables: ' + ((res.tables || []).join(', ') || '-');
      if (!confirm(info + '\\n\\nLanjut import sekarang?')) return;
      return fetch('/api/v3/admin/mysql/import-file?key=${ADMIN_KEY}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: filename, dry_run: false })
      }).then(r => r.json());
    })
    .then(res => {
      if (!res) return;
      if (res.status) alert('Import berhasil. Executed: ' + (res.executed || 0));
      else alert('Import gagal: ' + (res.error || 'Unknown error'));
    })
    .catch(err => alert('Import gagal: ' + (err.message || err)));
  };
  window.loadLogStats = function() {
    document.getElementById('log-stat-text').textContent = 'Loading...';
    fetch('/api/v3/admin/logs/count?key=${ADMIN_KEY}').then(r=>r.json()).then(res => {
      if(res.status && res.data) {
        const d = res.data;
        document.getElementById('log-total-count').textContent = (d.total_logs || 0).toLocaleString();
        document.getElementById('log-size-mb').textContent = parseFloat(d.size_mb || 0).toFixed(2);
        document.getElementById('log-unique-keys').textContent = d.unique_keys || 0;
        document.getElementById('log-oldest-date').textContent = d.oldest_log ? d.oldest_log.substring(0,10) : '-';
        document.getElementById('log-stat-text').innerHTML = '<span class="text-success">Updated just now</span>';
      }
    });
  };

window.loadRetention = function() {
    fetch('/api/v3/admin/logs/retention?key=${ADMIN_KEY}')
      .then(r => r.json())
      .then(res => {
        if (res.status) {
          document.getElementById('log-retention-val').textContent = res.data.retention_days + ' days';
          const retentionInput = document.getElementById('input-retention-days');
          if (retentionInput) retentionInput.value = res.data.retention_days;
        }
      });
  };
  
  window.showRetentionModal = function() {
    document.getElementById('modal-retention').classList.add('show');
    loadRetention();
  };

  window.saveRetention = function() {
    const input = document.getElementById('input-retention-days');
    if (!input) return;
    const days = parseInt(input.value);
    if (isNaN(days) || days < 0) {
      alert('Masukkan jumlah hari yang valid (>= 0)');
      return;
    }

    const btn = event.target;
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';
    btn.disabled = true;

    fetch('/api/v3/admin/logs/retention?key=${ADMIN_KEY}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ retention_days: days })
    })
    .then(r => r.json())
    .then(res => {
      alert(res.message || 'Retention period updated');
      document.getElementById('modal-retention').classList.remove('show');
      loadRetention();
    })
    .catch(err => alert('Error: ' + err.message))
    .finally(() => {
      btn.innerHTML = orig;
      btn.disabled = false;
    });
  };
  
  window.loadLogsPerKey = function() {
    fetch('/api/v3/admin/logs/per-key?key=${ADMIN_KEY}')
      .then(r => r.json())
      .then(res => {
        if (res.status) {
          const tbody = document.getElementById('logs-per-key-body');
          tbody.innerHTML = '';
          
          if (res.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No logs found</td></tr>';
            return;
          }
          
          res.data.forEach(k => {
            const tr = document.createElement('tr');
            const lastLog = new Date(k.last_log).toLocaleString('id-ID');
            const safeApiKeyText = escapeHtmlText(k.api_key || '');
            const safeApiKeyAttr = escapeHtmlAttr(k.api_key || '');
            tr.innerHTML = '<td class="ps-3"><code style="font-size:10px;">'+ safeApiKeyText +'</code></td><td>'+Number(k.log_count || 0).toLocaleString()+'</td><td>'+escapeHtmlText(k.size_kb || '0')+'</td><td style="font-size:11px;">'+escapeHtmlText(lastLog)+'</td><td><button class="btn btn-danger-soft btn-sm" style="font-size:10px;padding:2px 6px;" data-apikey="'+ safeApiKeyAttr +'">Delete</button></td>';
            const delBtn = tr.querySelector('button[data-apikey]');
            if (delBtn) {
              delBtn.addEventListener('click', function(){
                deleteLogsForKey(String(this.getAttribute('data-apikey') || ''));
              });
            }
            tbody.appendChild(tr);
          });
        }
      })
      .catch(err => {
        document.getElementById('logs-per-key-body').innerHTML = '<tr><td colspan="5" class="text-danger ps-3">Error: ' + escapeHtmlText(err.message || err) + '</td></tr>';
      });
  };
  
  window.deleteLogsForKey = function(apikey) {
    if (!confirm('Delete all logs for API key: '+apikey+'?')) return;
    
    fetch('/api/v3/admin/logs/delete-apikey?key=${ADMIN_KEY}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apikey })
    })
    .then(r => r.json())
    .then(res => {
      alert('Deleted '+res.deleted_count+' logs');
      loadLogStats();
      loadLogsPerKey();
    });
  };
  
  window.deleteLogsPerKey = function() {
    const apikey = prompt('Enter API Key to delete logs:');
    if (apikey) {
      deleteLogsForKey(apikey);
    }
  };
  
  window.deleteAllLogs = function() {
    if (!confirm('WARNING: Delete ALL logs? This cannot be undone!')) return;
    if (!confirm('Are you REALLY sure? Type OK to confirm...')) {
      const sure = prompt('Type "CONFIRM" to delete all logs:');
      if (sure !== 'CONFIRM') {
        alert('Cancelled');
        return;
      }
    }
    
    fetch('/api/v3/admin/logs/delete-all?key=${ADMIN_KEY}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: true })
    })
    .then(r => r.json())
    .then(res => {
      alert('Deleted '+res.deleted_count+' logs');
      loadLogStats();
      loadLogsPerKey();
    });
  };
  
  window.triggerLogCleanup = function() {
    if (!confirm('Cleanup old logs (older than retention period)?')) return;
    
    fetch('/api/v3/admin/logs/cleanup-now?key=${ADMIN_KEY}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(r => r.json())
    .then(res => {
      alert(res.message);
      loadLogStats();
      loadLogsPerKey();
    });
  };

   window.loadPackages = function() {
    fetch('/api/v3/admin/packages?key=${ADMIN_KEY}')
      .then(r => r.json())
      .then(res => {
        const tbody = document.getElementById('package-table-body');
        const select = document.getElementById('user-pkg');
        if (!tbody || !select) return;
        
        tbody.innerHTML = '';
        select.innerHTML = '<option value="">-- Pilih Package --</option>';
        
        if (res.status && res.data) {
          res.data.forEach(pkg => {
            // Add to table
            const tr = document.createElement('tr');
            const features = pkg.features ? pkg.features.split(',').map(f => f.trim()).join(', ') : '-';
            tr.innerHTML = '<td class="ps-3"><strong>'+pkg.package_id+'</strong></td><td>'+pkg.name+'</td><td style="font-size:12px;">'+features+'</td><td>Rp. '+(pkg.price || 0).toLocaleString('id-ID')+'</td><td>' + (pkg.duration_days || 30) + ' hari</td><td><button class="btn btn-sm btn-warning-soft" onclick="editPackage('+pkg.package_id+')"><i class="bi bi-pencil"></i></button> <button class="btn btn-sm btn-danger-soft" onclick="deletePackage('+pkg.package_id+')"><i class="bi bi-trash"></i></button></td>';
            tbody.appendChild(tr);
            
            // Add to dropdown
            const opt = document.createElement('option');
            opt.value = pkg.package_id;
            opt.textContent = pkg.name + ' - ' + features;
            select.appendChild(opt);
          });
        }
      });
  };

  window.showAddPackageModal = function() {
    document.getElementById('pkg-id').value = '';
    document.getElementById('pkg-form-title').textContent = 'Tambah Package';
    document.getElementById('pkg-name').value = '';
    document.getElementById('pkg-price').value = '';
    document.getElementById('pkg-duration-days').value = '30';
    document.querySelectorAll('#package-form input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById('package-form-container').style.display = 'block';
  };

  window.hidePackageForm = function() {
    document.getElementById('package-form-container').style.display = 'none';
  };

  window.editPackage = function(id) {
    fetch('/api/v3/admin/packages/'+id+'?key=${ADMIN_KEY}')
      .then(r => r.json())
      .then(res => {
        if (res.status) {
          const pkg = res.data;
          document.getElementById('pkg-id').value = id;
          document.getElementById('pkg-form-title').textContent = 'Edit Package';
          document.getElementById('pkg-name').value = pkg.name;
          document.getElementById('pkg-price').value = pkg.price || 0;
          document.getElementById('pkg-duration-days').value = pkg.duration_days || 30;
          
          document.querySelectorAll('#package-form input[type="checkbox"]').forEach(cb => cb.checked = false);
          if (pkg.features) {
            pkg.features.split(',').forEach(f => {
              const cbox = document.getElementById('feat-' + f.trim());
              if (cbox) cbox.checked = true;
            });
          }
          
          document.getElementById('package-form-container').style.display = 'block';
          document.getElementById('package-form').scrollIntoView({behavior: 'smooth'});
        }
      });
  };

  window.deletePackage = function(id) {
    if (!confirm('Delete this package?')) return;
    
    fetch('/api/v3/admin/packages/'+id+'/delete?key=${ADMIN_KEY}', { method: 'POST' })
      .then(r => r.json())
      .then(res => {
        if (res.status) {
          alert('Package deleted');
          loadPackages();
        } else {
          alert('Error: ' + res.error);
        }
      });
  };

  window.savePackage = function(e) {
    e.preventDefault();
    const id = document.getElementById('pkg-id').value;
    const features = Array.from(document.querySelectorAll('#package-form input[type="checkbox"]:checked'))
      .map(cb => cb.value)
      .join(',');
    
    const data = {
      name: document.getElementById('pkg-name').value,
      price: parseInt(document.getElementById('pkg-price').value) || 0,
      duration_days: parseInt(document.getElementById('pkg-duration-days').value) || 30,
      features: features
    };
    
    const btn = e.target.querySelector('button[type="submit"]');
    const origText = btn ? btn.innerHTML : 'Simpan';
    if (btn) {
      btn.innerHTML = 'Menyimpan...';
      btn.disabled = true;
    }

    const url = id && id !== 'undefined' ? '/api/v3/admin/packages/'+id+'?key=${ADMIN_KEY}' : '/api/v3/admin/packages?key=${ADMIN_KEY}';
    const method = 'POST';
    
    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(r => r.json())
    .then(res => {
      if (res.status) {
        alert('Package saved');
        hidePackageForm();
        loadPackages();
      } else {
        alert('Error: ' + (res.error || res.message || 'Unknown error'));
      }
    })
    .catch(err => {
      alert('Save failed: ' + err.message);
    })
    .finally(() => {
      if (btn) {
        btn.innerHTML = origText;
        btn.disabled = false;
      }
    });
  };

    window.generateAPIKey = function() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = 'AV-';
    for (let i = 0; i < 8; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('user-key').value = key;
  };

  window.showAddUserModal = function() {
    generateAPIKey();
    document.getElementById('user-id').value = '';
    document.getElementById('user-key-orig').value = '';
    document.getElementById('user-form-title').textContent = 'Tambah User';
    document.getElementById('user-name').value = '';
    document.getElementById('user-balance').value = '0';
    document.getElementById('user-wa').value = '';
    document.getElementById('user-pkg').value = '';
    document.getElementById('user-status').value = '1';
    document.getElementById('user-expiry').value = '30';
    document.getElementById('user-billing').value = 'balance';
    onUserPkgChange();
    document.getElementById('user-form-container').style.display = 'block';
    document.getElementById('user-form-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
    
  };

  window.hideUserForm = function() {
    document.getElementById('user-form-container').style.display = 'none';
  };

  // Package/Balance toggle logic
  window.onUserPkgChange = function() {
    var balInput = document.getElementById('user-balance');
    var billingSelect = document.getElementById('user-billing');
    var hint = document.getElementById('user-balance-hint');
    balInput.readOnly = false;
    balInput.style.backgroundColor = '';
    if (billingSelect) billingSelect.value = 'balance';
    if (hint) hint.textContent = '(saldo-only, wajib > 0)';
  };

  // Toggle password visibility
  window.togglePassword = function(inputId, btn) {
    var input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (btn) btn.innerHTML = '<i class="bi bi-eye-slash"></i>';
    } else {
      input.type = 'password';
      if (btn) btn.innerHTML = '<i class="bi bi-eye"></i>';
    }
  };

  let allUsers = [];
  let allUsersSearch = [];
  let showExpired = false;
  let usersPage = 1;
  const usersLimit = 10;
  let usersTotalPages = 1;
  let usersTotal = 0;
  let usersDropdownLoaded = false;
  let usersAllLoaded = false;
  let usersAllLoadingPromise = null;
  let userSelectMode = false;
  let selectedUserIds = new Set();

  function normalizeUsersList(users) {
    return Array.isArray(users) ? users : [];
  }

  function updateUsersInsightCards(users) {
    var rows = normalizeUsersList(users);
    var totalBalance = 0;
    var totalActive = 0;
    var totalHits = 0;
    rows.forEach(function(u) {
      totalBalance += Number(u && u.balance ? u.balance : 0);
      if (Number(u && u.is_active) === 1) totalActive += 1;
      totalHits += Number(u && u.total_hits ? u.total_hits : 0);
    });
    var elBalance = document.getElementById('users-insight-total-balance');
    var elActive = document.getElementById('users-insight-total-active');
    var elHits = document.getElementById('users-insight-total-hits');
    var topBalanceEl = document.getElementById('users-top-balance-list');
    var topUsageEl = document.getElementById('users-top-usage-list');
    if (elBalance) elBalance.textContent = 'Rp ' + totalBalance.toLocaleString('id-ID');
    if (elActive) elActive.textContent = totalActive.toLocaleString('id-ID') + ' User';
    if (elHits) elHits.textContent = totalHits.toLocaleString('id-ID') + ' Hits';

    var topByBalance = rows
      .slice()
      .sort(function(a, b){ return Number((b && b.balance) || 0) - Number((a && a.balance) || 0); })
      .slice(0, 3);
    var topByUsage = rows
      .slice()
      .sort(function(a, b){ return Number((b && b.total_hits) || 0) - Number((a && a.total_hits) || 0); })
      .slice(0, 3);

    var renderList = function(items, mode) {
      if (!items.length) return '<div class="text-muted">Belum ada data.</div>';
      return items.map(function(u, idx) {
        var name = userEscapeText((u && u.name) || '-');
        var memberCode = userEscapeText((u && u.member_code) ? (' • ' + u.member_code) : '');
        var value = mode === 'balance'
          ? ('Rp ' + Number((u && u.balance) || 0).toLocaleString('id-ID'))
          : (Number((u && u.total_hits) || 0).toLocaleString('id-ID') + ' hits');
        return '<div style="display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-bottom:' + (idx < items.length - 1 ? '1px dashed rgba(148,163,184,.25)' : '0') + ';">' +
          '<span><strong>#' + (idx + 1) + '</strong> ' + name + memberCode + '</span>' +
          '<strong>' + value + '</strong>' +
        '</div>';
      }).join('');
    };

    if (topBalanceEl) topBalanceEl.innerHTML = renderList(topByBalance, 'balance');
    if (topUsageEl) topUsageEl.innerHTML = renderList(topByUsage, 'usage');
  }

  function loadAllUsersForSearch(forceRefresh) {
    if (!forceRefresh && usersAllLoaded && allUsersSearch.length) {
      return Promise.resolve(allUsersSearch);
    }
    if (usersAllLoadingPromise) return usersAllLoadingPromise;
    var url = '/api/v3/admin/users?key=' + encodeURIComponent('${ADMIN_KEY}') +
      '&show_expired=' + (showExpired ? '1' : '0');
    usersAllLoadingPromise = fetch(url)
      .then(function(r){ return r.json(); })
      .then(function(res){
        if (!res || res.status === false || !Array.isArray(res.data)) {
          throw new Error((res && (res.error || res.message)) || 'Gagal memuat seluruh user');
        }
        allUsersSearch = res.data;
        usersAllLoaded = true;
        updateUsersInsightCards(allUsersSearch);
        return allUsersSearch;
      })
      .catch(function(){
        if (!allUsersSearch.length) {
          allUsersSearch = normalizeUsersList(allUsers);
          updateUsersInsightCards(allUsersSearch);
        }
        return allUsersSearch;
      })
      .finally(function(){
        usersAllLoadingPromise = null;
      });
    return usersAllLoadingPromise;
  }

  function renderUserPagination(users, meta) {
    const nav = document.getElementById('user-pagination');
    const info = document.getElementById('user-pagination-info');
    if (!nav || !info) return;
    users = Array.isArray(users) ? users : (allUsers || []);
    meta = meta || { total: usersTotal || users.length || 0 };
    info.textContent = 'Menampilkan ' + (users.length || 0) + ' user | Total ' + (meta.total || 0);

    nav.innerHTML = '';
    if (usersTotalPages <= 1) return;

    const makeBtn = (label, page, disabled, active) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-sm ' + (active ? 'btn-primary' : 'btn-outline-secondary');
      b.style.minWidth = '36px';
      b.textContent = label;
      b.disabled = !!disabled;
      b.onclick = () => loadUsers(page);
      return b;
    };

    nav.appendChild(makeBtn('<<', 1, usersPage === 1));
    nav.appendChild(makeBtn('<', Math.max(1, usersPage - 1), usersPage === 1));

    const maxButtons = 7;
    let start = Math.max(1, usersPage - Math.floor(maxButtons / 2));
    let end = start + maxButtons - 1;
    if (end > usersTotalPages) {
      end = usersTotalPages;
      start = Math.max(1, end - maxButtons + 1);
    }
    for (let p = start; p <= end; p++) {
      nav.appendChild(makeBtn(String(p), p, false, p === usersPage));
    }

    nav.appendChild(makeBtn('>', Math.min(usersTotalPages, usersPage + 1), usersPage === usersTotalPages));
    nav.appendChild(makeBtn('>>', usersTotalPages, usersPage === usersTotalPages));
  }

  function loadUsersDropdownOnce() {
    if (usersDropdownLoaded) return;
    usersDropdownLoaded = true;
    fetch('/api/v3/admin/users?key=${ADMIN_KEY}&dropdown=1')
      .then(r => r.json())
      .then(res => {
        const testerSelect = document.getElementById('tt-user-select');
        if (!testerSelect) return;
        if (!res || res.status === false || !res.data) return;
        testerSelect.innerHTML = '<option value="">-- Pilih User --</option>';
        res.data.forEach(u => {
          const opt = document.createElement('option');
          opt.value = u.api_key;
          opt.textContent = u.name + ' (' + u.api_key.substring(0, 8) + '...)';
          testerSelect.appendChild(opt);
        });
      })
      .catch(() => { });
  }

  window.loadUsers = function(page = 1) {
    usersPage = page;
    const url = '/api/v3/admin/users?key=' + encodeURIComponent('${ADMIN_KEY}') + 
                '&page=' + encodeURIComponent(usersPage) + 
                '&limit=' + encodeURIComponent(usersLimit) + 
                '&show_expired=' + (showExpired ? '1' : '0');
    fetch(url)
      .then(r => r.json())
      .then(res => {
        const tbody = document.getElementById('user-table-body');
        if (!tbody) return;
        
        if (!res || res.status === false) {
          const msg = (res && (res.error || res.message)) ? (res.error || res.message) : 'Gagal mengambil data user';
          tbody.innerHTML = '<tr><td colspan="' + (userSelectMode ? '7' : '6') + '" class="text-center py-5 text-danger">Error: ' + msg + '</td></tr>';
          return;
        }
        if (!res.data) {
          tbody.innerHTML = '<tr><td colspan="' + (userSelectMode ? '7' : '6') + '" class="text-center py-5 text-secondary">Tidak ada data.</td></tr>';
          return;
        }
        
        allUsers = res.data;
        if (!usersAllLoaded || !allUsersSearch.length) {
          allUsersSearch = normalizeUsersList(res.data);
          updateUsersInsightCards(allUsersSearch);
        }
        const meta = res.meta || {};
        usersTotal = meta.total || allUsers.length || 0;
        usersTotalPages = meta.total_pages || 1;
        renderUserCards(res.data);
        renderUserPagination(res.data, meta);
        loadUsersDropdownOnce();
        loadAllUsersForSearch(false);
      });
  };

  window.onTesterUserChange = function() {
    const select = document.getElementById('tt-user-select');
    const input = document.getElementById('tt-api-key');
    if (select && input && select.value) {
      input.value = select.value;
    }
  };

  function userEscapeText(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function userEscapeAttr(value) {
    return userEscapeText(value).replace(/"/g, '&quot;');
  }

  window.renderUserCards = function(users) {
    const tbody = document.getElementById('user-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    const selectHead = document.getElementById('user-select-col-head');
    const selectAll = document.getElementById('users-select-all');
    if (selectHead) selectHead.style.display = userSelectMode ? '' : 'none';
    if (selectAll) selectAll.checked = false;
    
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="' + (userSelectMode ? '7' : '6') + '" class="text-center py-5 text-secondary">Tidak ada user ditemukan.</td></tr>';
      return;
    }

    users.forEach(u => {
      let daysLeft = null;
      const hasExpiry = !!(u.expiry && typeof u.expiry === 'string');
      if (hasExpiry) {
        const expDate = new Date(u.expiry.replace(' ', 'T'));
        const diff = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 3600 * 24));
        daysLeft = diff > 0 ? diff : 0;
      }
      const isActive = Number(u.is_active) === 1;
      const balanceNum = Number(u.balance || 0);
      const isExpired = hasExpiry && daysLeft <= 0;
      const isTrial = String(u.package_name || '').toLowerCase().includes('trial');
      let statusBadge = '<span class="badge badge-blue">Active</span>';
      if (!isActive) statusBadge = '<span class="badge badge-red">Suspended</span>';
      else if (isExpired) statusBadge = '<span class="badge badge-amber">Expired</span>';
      else if (isTrial) statusBadge = '<span class="badge badge-yellow">Trial</span>';
      const expiryBadgeClass = !hasExpiry ? 'badge-blue' : (daysLeft > 7 ? 'badge-blue' : (daysLeft > 0 ? 'badge-yellow' : 'badge-red'));
      const safeName = userEscapeText(u.name || '-');
      const maskedKey = userEscapeText(String(u.api_key || '').substring(0, 8) + '...');
      const memberCodeText = userEscapeText(u.member_code ? ('ID: ' + u.member_code) : 'ID: -');
      const initials = userEscapeText(String(u.name || 'U').trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase() || 'U');
      const expiryText = !hasExpiry ? 'N/A (Saldo)' : (daysLeft > 0 ? (daysLeft + ' Hari') : 'EXPIRED');
      const balanceText = 'Rp ' + balanceNum.toLocaleString('id-ID');
      const usageText = (u.total_hits || 0).toLocaleString('id-ID') + ' hits';
      const statusNote = !hasExpiry ? 'Mode saldo-only' : (isExpired ? 'Masa aktif habis' : ('Sisa ' + daysLeft + ' hari'));
      const rowState = !isActive ? 'is-suspended' : (isExpired ? 'is-expired' : 'is-active');
      const apiKeyAttr = userEscapeAttr(u.api_key || '');
      
      const tr = document.createElement('tr');
      tr.className = 'user-row users-premium-row ' + rowState;
      tr.style.cursor = 'pointer';
      tr.onclick = (e) => {
          if (e.target.closest('input[type=\"checkbox\"]')) return;
          if (e.target.closest('button') || e.target.closest('a')) return;
          showUserDetail(u.id);
      };
      
      tr.innerHTML = \`\${userSelectMode ? '<td class="text-center"><input type="checkbox" class="form-check-input user-row-check" data-user-id="' + u.id + '"' + (selectedUserIds.has(Number(u.id)) ? ' checked' : '') + ' onchange="toggleUserSelection(' + u.id + ', this.checked)" onclick="event.stopPropagation()"></td>' : ''}
          <td class="ps-3 user-identity users-user-cell" data-label="User">
            <div class="users-identity-wrap">
              <div class="users-avatar">\${initials}</div>
              <div class="users-name-stack">
                <div class="users-name-line">\${safeName}</div>
                <div class="users-key-chip"><i class="bi bi-key"></i><span class="font-monospace">\${maskedKey}</span></div>
                <div class="users-member-code">\${memberCodeText}</div>
              </div>
            </div>
          </td>
          <td data-label="Mode"><span class="users-mode-pill"><i class="bi bi-wallet2"></i>Saldo Only</span></td>
          <td data-label="Balance"><div class="users-balance-stack"><strong>\${balanceText}</strong><span>\${usageText}</span></div></td>
          <td data-label="Expiry"><span class="badge \${expiryBadgeClass} users-expiry-badge">\${expiryText}</span></td>
          <td class="text-center" data-label="Status">
            \${statusBadge}
            <div class="users-status-note">\${statusNote}</div>
          </td>
          <td class="text-end pe-3 user-actions" data-label="Aksi">
            <div class="btn-group btn-group-sm user-actions-group users-action-cluster">
                <button class="btn users-action-btn copy" data-api-key="\${apiKeyAttr}" onclick="copyToClipboard(this.dataset.apiKey)" title="Copy API Key"><i class="bi bi-clipboard"></i></button>
                <button class="btn users-action-btn edit" onclick="editUser(\${Number(u.id)})" title="Edit"><i class="bi bi-pencil"></i></button>
                <button class="btn users-action-btn delete" onclick="deleteUser(\${Number(u.id)})" title="Hapus"><i class="bi bi-trash"></i></button>
            </div>
          </td>\`;
      tbody.appendChild(tr);
    });
    
    // Pagination info now handled in renderUserPagination
  };
  
  window.toggleShowExpired = function() {
    showExpired = !showExpired;
    usersAllLoaded = false;
    allUsersSearch = [];
    const btn = document.getElementById('btn-toggle-expired');
    if (showExpired) {
        btn.innerHTML = '<i class="bi bi-eye-slash-fill me-1"></i>Sembunyikan Expired';
        btn.classList.replace('btn-outline-secondary', 'btn-success-soft');
    } else {
        btn.innerHTML = '<i class="bi bi-eye-fill me-1"></i>Tampilkan Expired';
        btn.classList.replace('btn-success-soft', 'btn-outline-secondary');
    }
    loadUsers(1);
  };

  window.filterUsers = function() {
    const inputEl = document.getElementById('searchUserInput');
    const q = String((inputEl && inputEl.value) || '').trim().toLowerCase();
    const nav = document.getElementById('user-pagination');
    const info = document.getElementById('user-pagination-info');
    if (!q) {
      renderUserCards(allUsers || []);
      renderUserPagination(allUsers || [], { total: usersTotal });
      return;
    }
    if (info) info.textContent = 'Mencari seluruh data user...';
    loadAllUsersForSearch(false).then(function(fullRows){
      var rows = normalizeUsersList(fullRows);
      var filtered = rows.filter(function(u){
        var name = String((u && u.name) || '').toLowerCase();
        var apiKey = String((u && u.api_key) || '').toLowerCase();
        var memberCode = String((u && u.member_code) || '').toLowerCase();
        var wa = String((u && u.whatsapp_number) || '').toLowerCase();
        var balance = String((u && u.balance) || '').toLowerCase();
        var hits = String((u && u.total_hits) || '').toLowerCase();
        var status = Number(u && u.is_active) === 1 ? 'active aktif' : 'suspend nonaktif';
        return name.includes(q) || apiKey.includes(q) || memberCode.includes(q) || wa.includes(q) || balance.includes(q) || hits.includes(q) || status.includes(q);
      });
      renderUserCards(filtered);
      if (nav) nav.innerHTML = '';
      if (info) info.textContent = 'Hasil pencarian: ' + (filtered.length || 0) + ' user dari total ' + rows.length;
    }).catch(function(){
      renderUserCards([]);
      if (nav) nav.innerHTML = '';
      if (info) info.textContent = 'Gagal memuat data pencarian.';
    });
  };

  window.showUserDetail = function(id) {
    try {
      const sourceRows = (Array.isArray(allUsersSearch) && allUsersSearch.length) ? allUsersSearch : allUsers;
      const u = sourceRows.find(user => user.id == id);
      if (!u) return alert("Error: User dengan ID " + id + " tidak ditemukan dalam memori JS.");
      const modalEl = document.getElementById('userDetailModal');
      if (!modalEl) return editUser(id);

      const setText = function(elId, val) {
        const el = document.getElementById(elId);
        if (el) el.textContent = val;
      };
      const esc = function(v) {
        return String(v === undefined || v === null ? '' : v)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      };
      setText('det-name', u.name);
      setText('det-key', u.api_key);
      setText('det-member-id', u.member_code || '-');
      setText('det-wa', u.whatsapp_number || '-');
      setText('det-pkg', 'Saldo Only');
      setText('det-balance', 'Rp. ' + (u.balance || 0).toLocaleString('id-ID'));
      setText('det-expiry', u.expiry || '-');
      setText('det-billing', 'balance');
      setText('det-hits', (u.total_hits || 0).toLocaleString('id-ID') + ' Pengecekan');
      
      let createdAt = '-';
      if (u.created_at) {
          const d = new Date(u.created_at);
          createdAt = d.toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
      }
      setText('det-created', createdAt);
      
      const badge = document.getElementById('det-status-badge');
      badge.className = 'badge ' + (u.is_active ? 'badge-green' : 'badge-red');
      badge.textContent = u.is_active ? 'AKTIF' : 'PAUSED';
      const histEl = document.getElementById('det-key-history');
      if (histEl) histEl.innerHTML = '<span class="text-muted">Memuat histori API key...</span>';

      fetch('/api/v3/admin/users/' + id + '?key=${ADMIN_KEY}')
        .then(function(r) { return r.json(); })
        .then(function(res) {
          if (!histEl) return;
          var detail = res && res.status ? (res.data || {}) : {};
          var history = Array.isArray(detail.history_keys) ? detail.history_keys : [];
          if (!history.length) {
            histEl.innerHTML = '<span class="text-muted">Tidak ada histori API key.</span>';
            return;
          }
          var tableRows = history.map(function(row, idx) {
            var isActive = !row.revoked_at;
            var label = isActive ? (idx === 0 ? 'Aktif (primary)' : 'Aktif') : 'Nonaktif';
            var cls = isActive ? 'badge-green' : 'badge-red';
            var keyRaw = String(row.api_key || '-');
            var keyEsc = esc(keyRaw);
            var created = row.created_at
              ? esc(new Date(row.created_at).toLocaleString('id-ID'))
              : '-';
            var revoked = row.revoked_at
              ? esc(new Date(row.revoked_at).toLocaleString('id-ID'))
              : '-';
            return '<tr>' +
              '<td class="text-muted fw-semibold">' + (idx + 1) + '</td>' +
              '<td><code class="user-key-history-code" title="' + keyEsc + '">' + keyEsc + '</code></td>' +
              '<td><span class="badge ' + cls + ' user-key-history-badge">' + label + '</span></td>' +
              '<td class="text-nowrap">' + created + '</td>' +
              '<td class="text-nowrap">' + revoked + '</td>' +
            '</tr>';
          }).join('');
          histEl.innerHTML = ''
            + '<div class="table-responsive user-key-history-table-responsive">'
            + '  <table class="table table-sm align-middle user-key-history-table mb-0">'
            + '    <thead>'
            + '      <tr>'
            + '        <th style="width:52px;">No</th>'
            + '        <th>API Key</th>'
            + '        <th style="width:150px;">Status</th>'
            + '        <th style="width:190px;">Dibuat</th>'
            + '        <th style="width:190px;">Dinonaktifkan</th>'
            + '      </tr>'
            + '    </thead>'
            + '    <tbody>' + tableRows + '</tbody>'
            + '  </table>'
            + '</div>';
        })
        .catch(function() {
          if (histEl) histEl.innerHTML = '<span class="text-danger">Gagal memuat histori key.</span>';
        });

      const resendBtn = document.getElementById('det-resend-wa-btn');
      if (resendBtn) {
        resendBtn.disabled = !u.whatsapp_number;
        resendBtn.onclick = () => {
          if (!u.whatsapp_number) return alert('Nomor WhatsApp user masih kosong.');
          if (!confirm('Kirim ulang detail API ke WhatsApp user ini?\\n\\n' + u.whatsapp_number)) return;
          const orig = resendBtn.innerHTML;
          resendBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Mengirim...';
          resendBtn.disabled = true;
          fetch('/api/v3/admin/users/' + id + '/resend-wa?key=${ADMIN_KEY}', { method: 'POST' })
            .then(r => r.json())
            .then(res => {
              if (res.status) {
                if (res.wa_sent && res.wa_sent.ok === false) alert('Gagal kirim WA: ' + (res.wa_sent.error || 'Unknown error'));
                else alert('Berhasil mengirim ulang detail API ke WhatsApp.');
              } else {
                alert('Error: ' + (res.error || res.message || 'Unknown error'));
              }
            })
            .catch(err => alert('Error: ' + err.message))
            .finally(() => {
              resendBtn.innerHTML = orig;
              resendBtn.disabled = !u.whatsapp_number;
            });
        };
      }
      
      const detEditBtn = document.getElementById('det-edit-btn');
      if (detEditBtn) detEditBtn.onclick = () => {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
        editUser(id);
      };

      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    } catch (e) {
      alert("CRASH: " + e.message + "\\n" + e.stack);
    }
  };

  window.editUser = function(id) {
    fetch('/api/v3/admin/users?key=${ADMIN_KEY}')
      .then(r => r.json())
      .then(res => {
        if (res.status) {
          const u = res.data.find(user => user.id == id);
          if (!u) return alert('User tidak ditemukan');
          document.getElementById('user-id').value = id;
          document.getElementById('user-key-orig').value = u.api_key;
          document.getElementById('user-form-title').textContent = 'Edit User';
          document.getElementById('user-name').value = u.name;
          document.getElementById('user-key').value = u.api_key;
          document.getElementById('user-wa').value = u.whatsapp_number || '';
          document.getElementById('user-balance').value = u.balance || '0';
          document.getElementById('user-pkg').value = '';
          document.getElementById('user-status').value = u.is_active;
          if (document.getElementById('user-billing')) {
            document.getElementById('user-billing').value = 'balance';
          }
          
          let daysLeft = 30;
          if (u.expiry) {
            const expDate = new Date(u.expiry.replace(' ', 'T'));
            const diff = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 3600 * 24));
            daysLeft = diff > 0 ? diff : 0;
          }
          document.getElementById('user-expiry').value = daysLeft;
          
          onUserPkgChange();
          document.getElementById('user-form-container').style.display = 'block';
          document.getElementById('user-form').scrollIntoView({behavior: 'smooth'});
        }
      });
  };

  window.deleteUser = function(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return;

    const userId = Number(id);
    if (!Number.isInteger(userId) || userId <= 0) {
      alert('ID user tidak valid.');
      return;
    }

    fetch('/api/v3/admin/users/' + userId + '/delete?key=${ADMIN_KEY}', {
      method: 'POST'
    })
      .then(async function(r) {
        let data = null;
        try {
          data = await r.json();
        } catch (_) {
          const text = await r.text().catch(() => '');
          throw new Error('Respons server tidak valid. ' + (text ? String(text).slice(0, 120) : ''));
        }
        if (!r.ok) {
          throw new Error((data && (data.error || data.message)) || ('HTTP ' + r.status));
        }
        return data;
      })
      .then(res => {
        if (res.status) {
          alert('User berhasil dihapus');
          loadUsers();
        } else {
          alert('Error: ' + (res.error || res.message || 'Gagal menghapus user'));
        }
      })
      .catch(function(err) {
        alert('Gagal hapus user: ' + (err && err.message ? err.message : 'Unknown error'));
      });
  };

  // --- DATABASE BROWSER LOGIC ---
  let activeTableName = '';
  let activePage = 1;
  let activePK = '';
  let activeCols = [];
  let activeRows = [];
  let dbApiKeyOwnerMap = null;

  async function ensureDbApiKeyOwnerMap() {
    if (dbApiKeyOwnerMap) return dbApiKeyOwnerMap;
    dbApiKeyOwnerMap = {};
    try {
      const r = await fetch('/api/v3/admin/users?key=${ADMIN_KEY}&dropdown=1');
      const res = await r.json();
      if (res && res.status && Array.isArray(res.data)) {
        res.data.forEach(function(u) {
          const key = String((u && u.api_key) || '').trim();
          if (key) dbApiKeyOwnerMap[key] = String((u && u.name) || '-');
        });
      }
    } catch (_) {}
    return dbApiKeyOwnerMap;
  }

  window.browseTable = async function(tableName, page = 1) {
    activeTableName = tableName;
    activePage = page;
    if (String(tableName).toLowerCase() === 'balance_logs') {
      await ensureDbApiKeyOwnerMap();
    }
    const tableNameEl = document.getElementById('db-browser-table-name');
    if (tableNameEl) tableNameEl.textContent = tableName;
    const modalEl = document.getElementById('dbBrowserModal');
    if (!modalEl) {
      alert('Modal browser table belum tersedia. Refresh halaman admin.');
      return;
    }
    let modal = bootstrap.Modal.getInstance(modalEl);
    if (!modal) modal = new bootstrap.Modal(modalEl);
    modal.show();
    
    const url = '/api/v3/admin/mysql/table/' + tableName + '?key=${ADMIN_KEY}&page=' + page;
    fetch(url)
      .then(r => r.json())
      .then(res => {
        if (res.status) {
          activeCols = res.data.columns;
          activePK = res.data.primaryKey;
          activeRows = res.data.rows;
          renderDBRows(res.data);
        } else {
          alert('Error: ' + res.error);
        }
      });
  };

  window.renderDBRows = function(data) {
    const thead = document.getElementById('db-browser-thead');
    const tbody = document.getElementById('db-browser-tbody');
    if (!thead || !tbody) return;
    const esc = function(v) {
      return String(v === undefined || v === null ? '' : v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };
    const fmtDateLocal = function(v) {
      if (!v) return '-';
      const dt = new Date(v);
      if (Number.isNaN(dt.getTime())) return esc(String(v));
      return dt.toLocaleString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };
    thead.innerHTML = '';
    tbody.innerHTML = '';

    // Headers
    data.columns.forEach(col => {
      const th = document.createElement('th');
      const isApiKeyCol = String(col.Field || '').toLowerCase() === 'api_key';
      th.textContent = (String(activeTableName).toLowerCase() === 'balance_logs' && isApiKeyCol) ? 'USER' : col.Field;
      if (col.Field === data.primaryKey) th.classList.add('text-primary');
      thead.appendChild(th);
    });
    // Rows
    data.rows.forEach((row, idx) => {
      const tr = document.createElement('tr');
      data.columns.forEach(col => {
        const td = document.createElement('td');
        const fieldName = String(col.Field || '').toLowerCase();
        let val = row[col.Field];
        if (String(activeTableName).toLowerCase() === 'balance_logs' && String(col.Field || '').toLowerCase() === 'api_key') {
          const keyVal = String(row[col.Field] || '');
          const owner = (dbApiKeyOwnerMap && dbApiKeyOwnerMap[keyVal]) ? dbApiKeyOwnerMap[keyVal] : '-';
          val = esc(owner) + ' <small class="text-muted d-block font-monospace">' + esc(keyVal) + '</small>';
        }
        if (val !== null && val !== undefined) {
          const isDateField = /(^|_)(created_at|updated_at|last_used|expiry|revoked_at|date|time)$/.test(fieldName);
          if (isDateField) {
            val = fmtDateLocal(val);
          }
        }
        if (val === null) val = '<em class="text-muted">NULL</em>';
        else if (typeof val === 'string' && val.length > 50) val = val.substring(0, 50) + '...';
        td.innerHTML = val;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    // Pagination
    const pageNumEl = document.getElementById('db-page-num');
    const totalEl = document.getElementById('db-browser-total');
    const prevBtn = document.getElementById('db-prev-page');
    const nextBtn = document.getElementById('db-next-page');
    if (pageNumEl) pageNumEl.textContent = data.pagination.current + ' / ' + data.pagination.total;
    if (totalEl) totalEl.textContent = data.pagination.totalRows;
    if (prevBtn) prevBtn.disabled = data.pagination.current <= 1;
    if (nextBtn) nextBtn.disabled = data.pagination.current >= data.pagination.total;
  };

  window.changeDBPage = function(delta) {
    activePage += delta;
    browseTable(activeTableName, activePage);
  };

  window.editDBRow = function(idx) {
    const row = activeRows[idx];
    const container = document.getElementById('db-editor-fields');
    const tableNameEl = document.getElementById('db-editor-table-name');
    if (!container) return;
    if (tableNameEl) tableNameEl.textContent = activeTableName;
    container.innerHTML = '';

    activeCols.forEach(col => {
      const div = document.createElement('div');
      div.className = 'mb-3';
      const isPK = col.Field === activePK;
      const val = row[col.Field] === null ? '' : row[col.Field];
      div.innerHTML = \`
        <label class="form-label \${isPK ? 'text-primary' : ''}">\${col.Field} \${isPK ? '(Primary Key)' : ''}</label>
        <input type="text" class="form-control" name="\${col.Field}" value="\${val}" \${isPK ? 'readonly' : ''}>
        <div class="form-text" style="font-size:10px;">Type: \${col.Type}</div>
      \`;
      container.appendChild(div);
    });

    const editorModalEl = document.getElementById('dbEditorModal');
    if (!editorModalEl) return;
    const modal = new bootstrap.Modal(editorModalEl);
    modal.show();
  };

  window.saveDBRow = function(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const updatedData = {};
    fd.forEach((value, key) => {
      if (key !== activePK) updatedData[key] = value;
    });

    const body = {
      key: '${ADMIN_KEY}',
      pk_column: activePK,
      pk_value: e.target.querySelector(\`[name="\${activePK}"]\`).value,
      data: updatedData
    };

    fetch(\`/api/v3/admin/mysql/table/\${activeTableName}/update\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    .then(r => r.json())
    .then(res => {
      if (res.status) {
        alert('Data updated!');
        bootstrap.Modal.getInstance(document.getElementById('dbEditorModal')).hide();
        browseTable(activeTableName, activePage);
      } else alert('Update failed: ' + res.error);
    });
  };

  window.deleteDBRow = function(idx) {
    const row = activeRows[idx];
    const pkValue = row[activePK];
    if (!confirm(\`Hapus baris dengan \${activePK} = \${pkValue}?\`)) return;

    fetch(\`/api/v3/admin/mysql/table/\${activeTableName}/delete\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: '${ADMIN_KEY}', pk_column: activePK, pk_value: pkValue })
    })
    .then(r => r.json())
    .then(res => {
      if (res.status) {
        alert('Data deleted!');
        browseTable(activeTableName, activePage);
      } else alert('Delete failed: ' + res.error);
    });
  };

  window.saveUser = function(e) {
    e.preventDefault();
    const id = document.getElementById('user-id').value;
    const balVal = parseInt(document.getElementById('user-balance').value) || 0;
    const billingType = 'balance';

    if (balVal <= 0) {
      alert('Saldo wajib diisi (> 0) untuk mode saldo-only.');
      return;
    }
    
    const days = parseInt(document.getElementById('user-expiry').value) || 30;
    const d = new Date();
    d.setDate(d.getDate() + days);
    const localISO = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 19).replace('T', ' ');

    const data = {
      id: id,
      name: document.getElementById('user-name').value,
      api_key: document.getElementById('user-key').value,
      whatsapp_number: document.getElementById('user-wa').value,
      balance: balVal,
      package_id: null,
      billing_type: billingType,
      is_active: parseInt(document.getElementById('user-status').value),
      expiry: localISO
    };
    
    const url = id 
      ? '/api/v3/admin/users/' + id + '?key=${ADMIN_KEY}' 
      : '/api/v3/admin/users?key=${ADMIN_KEY}';
    const method = 'POST';
    
    const btn = e.target.querySelector('button[type="submit"]');
    const origText = btn ? btn.innerHTML : 'Simpan';
    if (btn) {
      btn.innerHTML = 'Menyimpan...';
      btn.disabled = true;
    }

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(r => r.json())
    .then(res => {
      if (res.status) {
        if (res.wa_sent && res.wa_sent.ok === false) {
          alert('User berhasil disimpan, tapi kirim WA gagal: ' + (res.wa_sent.error || 'Unknown error'));
        } else if (res.wa_sent && res.wa_sent.ok === true) {
          alert('User berhasil disimpan dan detail API sudah dikirim ke WhatsApp.');
        } else {
          alert('User berhasil disimpan');
        }
        hideUserForm();
        loadUsers();
      } else {
        alert('Error: ' + (res.error || res.message || 'Unknown error'));
      }
    })
    .catch(err => alert('Gagal menyimpan: ' + err.message))
    .finally(() => {
      if (btn) {
        btn.innerHTML = origText;
        btn.disabled = false;
      }
    });
  };

  let trafficChart = null;
  function loadTrafficChart() {
    if (typeof Chart === 'undefined') return;
    const canvas = document.getElementById('trafficChart');
    if (!canvas || typeof canvas.getContext !== 'function') return;
    fetch('/api/v3/admin/stats/history?key=${ADMIN_KEY}')
      .then(r => r.json())
      .then(res => {
        if (!res.status) return;
        const ctx = canvas.getContext('2d');
        if (trafficChart) trafficChart.destroy();
        
        trafficChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: res.data.labels,
            datasets: [
              {
                label: 'Success',
                data: res.data.success,
                borderColor: '#3fb950',
                backgroundColor: 'rgba(63, 185, 80, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: '#3fb950'
              },
              {
                label: 'Failed',
                data: res.data.failed,
                borderColor: '#f85149',
                backgroundColor: 'rgba(248, 81, 73, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 2,
                pointBackgroundColor: '#f85149',
                borderDash: [5, 5]
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: { color: '#8b949e', font: { size: 12, weight: '600' } }
              },
              tooltip: {
                mode: 'index',
                intersect: false,
                padding: 12,
                backgroundColor: '#161b22',
                titleColor: '#fff',
                bodyColor: '#e6edf3',
                borderColor: '#30363d',
                borderWidth: 1
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: 'rgba(48, 54, 61, 0.5)' },
                ticks: { color: '#8b949e', font: { size: 11 } }
              },
              x: {
                grid: { display: false },
                ticks: { color: '#8b949e', font: { size: 11 } }
              }
            }
          }
        });
      });
  };
  window.loadTrafficChart = loadTrafficChart;
  let providerMetricsTimer = null;

  function providerLabel(code) {
const labels = { server1: 'Server 1', server2: 'Server 2', server3: 'Server 3', server4: 'Server 4', server5: 'Server 5', server6: 'Server 6', server7: 'Server 7', server8: 'Server 8', 'cache-memory': 'Cache Memory', 'cache-db': 'Cache DB' };
    return labels[String(code || '').toLowerCase()] || String(code || '-').toUpperCase();
  }

  function updateProviderMetricsStamp(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    el.textContent = hh + ':' + mm + ':' + ss;
  }

  function renderProviderMetrics(serviceType, rows) {
    const container = document.getElementById('provider-' + serviceType + '-summary');
    if (!container) return;
    const esc = function(v) {
      return String(v === undefined || v === null ? '' : v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };
    if (!rows || !rows.length) {
      container.innerHTML = '<div class="provider-runtime-empty">Belum ada metrik runtime untuk layanan ini.</div>';
      return;
    }
    const openRows = rows.filter(function(row) { return !!row.circuit_open; });
    const unhealthyRows = rows.filter(function(row) { return Number(row.failures || 0) > Number(row.successes || 0); });
    let html = '';
    if (openRows.length) {
      html += '<div class="provider-runtime-alert"><i class="bi bi-exclamation-triangle me-1"></i>Circuit OPEN: ' + openRows.map(function(row) { return providerLabel(row.provider_code); }).join(', ') + '</div>';
    } else if (unhealthyRows.length) {
      html += '<div class="provider-runtime-alert"><i class="bi bi-activity me-1"></i>Provider yang perlu diawasi: ' + unhealthyRows.map(function(row) { return providerLabel(row.provider_code); }).join(', ') + '</div>';
    }
    html += '<div class="provider-runtime-grid">';
    html += rows.map(function(row) {
      const openCls = row.circuit_open ? ' is-open' : ' is-healthy';
      const badgeCls = row.circuit_open ? 'provider-runtime-badge is-open' : 'provider-runtime-badge';
      const note = row.circuit_open
        ? ('Open until ' + esc(row.circuit_open_until || '-'))
        : (row.last_error ? ('Last error: ' + esc(row.last_error_type || 'error') + ' | ' + esc(row.last_error)) : 'Status: normal');
      return '<div class="provider-runtime-card' + openCls + '">' +
        '<div class="provider-runtime-head">' +
          '<div class="provider-runtime-name">' + esc(providerLabel(row.provider_code)) + '</div>' +
          '<span class="' + badgeCls + '">' + (row.circuit_open ? 'Open' : 'Closed') + '</span>' +
        '</div>' +
        '<div class="provider-runtime-meta">' +
          '<div class="provider-runtime-kpi"><div class="provider-runtime-kpi-label">Success</div><div class="provider-runtime-kpi-value">' + esc(String(row.success_rate || 0)) + '%</div></div>' +
          '<div class="provider-runtime-kpi"><div class="provider-runtime-kpi-label">Avg Latency</div><div class="provider-runtime-kpi-value">' + esc(String(row.avg_latency_ms || 0)) + 'ms</div></div>' +
          '<div class="provider-runtime-kpi"><div class="provider-runtime-kpi-label">Requests</div><div class="provider-runtime-kpi-value">' + esc(String(row.requests || 0)) + '</div></div>' +
          '<div class="provider-runtime-kpi"><div class="provider-runtime-kpi-label">Timeouts</div><div class="provider-runtime-kpi-value">' + esc(String(row.timeouts || 0)) + '</div></div>' +
        '</div>' +
        '<div class="provider-runtime-note">' + note + '</div>' +
      '</div>';
    }).join('');
    html += '</div>';
    container.innerHTML = html;
  }

  function loadProviderMetrics() {
    const bankEl = document.getElementById('provider-bank-summary');
    const ewalletEl = document.getElementById('provider-ewallet-summary');
    if (!bankEl || !ewalletEl) return;
    fetch('/admin/provider-metrics?key=${ADMIN_KEY}')
      .then(function(r) { return r.json(); })
      .then(function(res) {
        if (!res || !res.status || !Array.isArray(res.data)) throw new Error('Invalid metrics response');
        renderProviderMetrics('bank', res.data.filter(function(row) { return row.service_type === 'bank'; }));
        renderProviderMetrics('ewallet', res.data.filter(function(row) { return row.service_type === 'ewallet'; }));
        updateProviderMetricsStamp('provider-bank-updated');
        updateProviderMetricsStamp('provider-ewallet-updated');
      })
      .catch(function(err) {
        const msg = (err && err.message) ? err.message : String(err || '');
        bankEl.innerHTML = '<div class="provider-runtime-empty">Gagal memuat metrik bank: ' + msg.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
        ewalletEl.innerHTML = '<div class="provider-runtime-empty">Gagal memuat metrik e-wallet: ' + msg.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
      });
  }
  window.loadProviderMetrics = loadProviderMetrics;

  window.resetProviderMetrics = function(serviceType) {
    fetch('/admin/provider-metrics/reset?key=${ADMIN_KEY}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceType ? { service: serviceType } : {})
    })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        if (!res || !res.status) throw new Error((res && res.error) || 'Gagal reset provider metrics');
        loadProviderMetrics();
      })
      .catch(function(err) {
        alert('Reset runtime metrics gagal: ' + (err.message || err));
      });
  };

  window.toggleUserSelectMode = function() {
    userSelectMode = !userSelectMode;
    if (!userSelectMode) selectedUserIds.clear();
    const btnMode = document.getElementById('btn-toggle-select-users');
    const btnDel = document.getElementById('btn-delete-selected-users');
    if (btnMode) {
      btnMode.className = userSelectMode ? 'btn btn-warning btn-sm text-nowrap' : 'btn btn-outline-warning btn-sm text-nowrap';
      btnMode.innerHTML = userSelectMode ? '<i class="bi bi-x-square me-1"></i>Tutup Checklist' : '<i class="bi bi-check2-square me-1"></i>Mode Checklist';
    }
    if (btnDel) {
      btnDel.style.display = userSelectMode ? '' : 'none';
      btnDel.innerHTML = '<i class="bi bi-trash me-1"></i>Hapus Terpilih (0)';
      btnDel.disabled = true;
    }
    renderUserCards(allUsers || []);
  };

  window.toggleUserSelection = function(id, checked) {
    const n = Number(id);
    if (checked) selectedUserIds.add(n);
    else selectedUserIds.delete(n);
    const btnDel = document.getElementById('btn-delete-selected-users');
    if (btnDel) {
      const count = selectedUserIds.size;
      btnDel.innerHTML = '<i class="bi bi-trash me-1"></i>Hapus Terpilih (' + count + ')';
      btnDel.disabled = count < 1;
    }
  };

  window.toggleSelectAllUsers = function(el) {
    const checks = document.querySelectorAll('.user-row-check');
    checks.forEach((c) => {
      c.checked = !!(el && el.checked);
      const id = Number(c.getAttribute('data-user-id'));
      if (el && el.checked) selectedUserIds.add(id);
      else selectedUserIds.delete(id);
    });
    const btnDel = document.getElementById('btn-delete-selected-users');
    if (btnDel) {
      const count = selectedUserIds.size;
      btnDel.innerHTML = '<i class="bi bi-trash me-1"></i>Hapus Terpilih (' + count + ')';
      btnDel.disabled = count < 1;
    }
  };

  window.deleteSelectedUsers = function() {
    const ids = Array.from(selectedUserIds);
    if (!ids.length) return alert('Belum ada user yang dipilih.');
    if (!confirm('Hapus ' + ids.length + ' user terpilih?\\n\\nHistori validasi di api_logs tidak akan ikut terhapus.')) return;
    fetch('/api/v3/admin/users/bulk-delete?key=${ADMIN_KEY}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ids })
    })
      .then(r => r.json())
      .then(res => {
        if (res && res.status) {
          alert('Bulk delete selesai. User terhapus: ' + (res.deleted || 0));
          selectedUserIds.clear();
          loadUsers(usersPage || 1);
        } else {
          alert('Error: ' + ((res && (res.error || res.message)) || 'Unknown error'));
        }
      })
      .catch(err => alert('Error: ' + err.message));
  };

  window.startProviderMetricsMonitor = function() {
    loadProviderMetrics();
    if (providerMetricsTimer) clearInterval(providerMetricsTimer);
    providerMetricsTimer = setInterval(function() {
      const pane = document.getElementById('main-dashboard');
      if (!pane || pane.style.display === 'none') return;
      loadProviderMetrics();
    }, 15000);
  };

  window.stopProviderMetricsMonitor = function() {
    if (!providerMetricsTimer) return;
    clearInterval(providerMetricsTimer);
    providerMetricsTimer = null;
  };

  let liveMonitorTimer = null;
  let livePaused = false;
  let liveSessionValid = 0;
  let liveSessionFailed = 0;
  let liveLastIds = [];
  let liveRowsCache = [];
  let liveRefreshMs = 3000;

  function formatJakartaTime(isoOrDate) {
    try {
      var d;
      if (isoOrDate instanceof Date || typeof isoOrDate === 'object') {
        d = new Date(isoOrDate);
      } else if (typeof isoOrDate === 'string') {
        // MySQL format: "2026-03-16 22:01:27" or ISO: "2026-03-16T22:01:27.000Z"
        d = new Date(isoOrDate.replace(' ', 'T'));
      } else {
        d = new Date(isoOrDate);
      }
      if (isNaN(d.getTime())) return '-';
      // Convert UTC to GMT+7
      var jakartaMs = d.getTime() + (7 * 60 * 60 * 1000);
      var jkt = new Date(jakartaMs);
      var hh = String(jkt.getUTCHours()).padStart(2, '0');
      var mm = String(jkt.getUTCMinutes()).padStart(2, '0');
      var ss = String(jkt.getUTCSeconds()).padStart(2, '0');
      return hh + ':' + mm + ':' + ss;
    } catch (e) {
      return '-';
    }
  }

  function parseLiveRow(r) {
    function truncateText(value, maxLen) {
      var txt = String(value === undefined || value === null ? '' : value);
      var n = Number(maxLen || 0);
      if (!n || txt.length <= n) return txt;
      return txt.slice(0, n) + '...';
    }
    var time = r.created_at ? formatJakartaTime(r.created_at) : '--:--:--';
    var userName = (r.user_name && String(r.user_name).trim()) ? String(r.user_name).trim() : '';
    var userId = (r.user_id !== null && r.user_id !== undefined) ? String(r.user_id) : '';
    var key = r.api_key || 'UNKNOWN';
    var userText = (userName && userId) ? (userName + ' (' + userId + ')') : (key.length > 12 ? key.substring(0, 12) + '..' : key);
    var type = String(r.log_type || '-').toLowerCase();
    var ok = String(r.is_success) === '1' || r.is_success === 1 || r.is_success === true;
    var statusLabel = ok ? 'VALID' : 'FAIL';
    var statusBadge = ok ? 'badge-green' : 'badge-red';
    var code = '-', nomor = '-', serverUsed = '-', accountName = '-';
    var nomorFull = '-';
    var rt = (r.response_time !== null && r.response_time !== undefined) ? (r.response_time + 'ms') : '-';
    var deducted = Number(r.charged_amount || 0);
    try {
      var rd = r.request_data ? (typeof r.request_data === 'string' ? JSON.parse(r.request_data) : r.request_data) : {};
      var rs = r.response_data ? (typeof r.response_data === 'string' ? JSON.parse(r.response_data) : r.response_data) : {};
      nomor = rd.account_number || rd.accountNumber || rd.phone_number || rd.phone_no || rd.nomor || rd.nik || '-';
      nomorFull = String(nomor || '-');
      code = rd.code || rd.bank_code || rd.ewallet_code || '-';
      serverUsed = rs.provider || rs.server_source || '-';
      if (rs && rs.data) accountName = rs.data.account_name || rs.data.customer_name || rs.data.name || '-';
      if (accountName === '-' && rs && rs.message && type === 'ewallet') accountName = rs.message;
      if (code === '-' && type === 'whatsapp') code = 'WA';
      if (code === '-' && type === 'nik') code = 'NIK';
      if (type === 'ai') {
        var qText = rd.q || rd.query || '-';
        nomorFull = String(qText || '-');
        nomor = truncateText(nomorFull, 20); // tampilkan maksimal 20 karakter di tabel
        var imageId = (rs && rs.data && rs.data.code) ? rs.data.code : '-';
        accountName = String(imageId || '-'); // kolom Account Name diisi ID gambar
        if (code === '-') code = 'AI';
      }
      if (!Number.isFinite(deducted) || deducted <= 0) {
        var amountDeducted = rs && rs.user_details ? Number(rs.user_details.amount_deducted || 0) : 0;
        var penaltyAmount = Number((rs && rs.penalty_amount) || 0);
        deducted = ok
          ? Number(amountDeducted.toFixed(2))
          : Number(penaltyAmount.toFixed(2));
      }
    } catch(e) {}
    return {
      time: time,
      userText: userText,
      type: type,
      typeLabel: String(type || '-').toUpperCase(),
      statusLabel: statusLabel,
      statusBadge: statusBadge,
      code: String(code || '-'),
      nomor: String(nomor || '-'),
      nomorFull: String(nomorFull || nomor || '-'),
      serverUsed: String(serverUsed || '-'),
      accountName: String(accountName || '-'),
      rt: rt,
      deducted: deducted,
      request_data: r.request_data || '-',
      response_data: r.response_data || '-'
    };
  }

  function liveEscapeText(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  window.startLiveMonitor = function() {
    if (liveMonitorTimer) clearInterval(liveMonitorTimer);
    livePaused = false;
    var btn = document.getElementById('live-pause-btn');
    if (btn) btn.innerHTML = '<i class="bi bi-pause-fill me-1"></i>Pause';
    fetchLiveHits();
    liveMonitorTimer = setInterval(function() {
      if (!livePaused) fetchLiveHits();
    }, liveRefreshMs);
  };

  window.clearLiveTerminal = function() {
    var tbody = document.getElementById('live-table-body');
    if (tbody) tbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted py-4">Table cleared. Waiting for incoming hits...</td></tr>';
    liveSessionValid = 0;
    liveSessionFailed = 0;
    const v = document.getElementById('live-stat-valid'); if(v) v.textContent = '0';
    const f = document.getElementById('live-stat-failed'); if(f) f.textContent = '0';
    document.getElementById('live-counter').textContent = '0 hits';
    liveLastIds = [];
    liveRowsCache = [];
    var reqBox = document.getElementById('live-detail-req'); if (reqBox) reqBox.textContent = '-';
    var resBox = document.getElementById('live-detail-res'); if (resBox) resBox.textContent = '-';
  };

  window.toggleLivePause = function() {
    livePaused = !livePaused;
    var btn = document.getElementById('live-pause-btn');
    if (btn) {
      btn.innerHTML = livePaused
        ? '<i class="bi bi-play-fill me-1"></i>Resume'
        : '<i class="bi bi-pause-fill me-1"></i>Pause';
    }
  };

  window.setLiveInterval = function(ms) {
    var val = parseInt(ms, 10);
    if (!Number.isFinite(val) || val < 1000) val = 3000;
    liveRefreshMs = val;
    if (liveMonitorTimer) {
      clearInterval(liveMonitorTimer);
      liveMonitorTimer = setInterval(function() { if (!livePaused) fetchLiveHits(); }, liveRefreshMs);
    }
  };

  window.showLiveRowDetail = function(idx) {
    var row = liveRowsCache && liveRowsCache[idx] ? liveRowsCache[idx] : null;
    if (!row) return;
    var reqBox = document.getElementById('live-detail-req');
    var resBox = document.getElementById('live-detail-res');
    if (reqBox) reqBox.textContent = typeof row.request_data === 'string' ? row.request_data : JSON.stringify(row.request_data, null, 2);
    if (resBox) {
      var original = (typeof row.response_data === 'string' ? row.response_data : JSON.stringify(row.response_data, null, 2));
      resBox.textContent = 'Potong saldo: Rp ' + Number(row.deducted || 0).toLocaleString('id-ID') + '\\n\\n' + original;
    }
  };

  function fetchLiveHits() {
    fetch('/api/v3/admin/logs/recent?key=${ADMIN_KEY}&limit=50')
      .then(function(r) { return r.json(); })
      .then(function(res) {
        if (!res.status) return;
        var rows = Array.isArray(res.data) ? res.data : [];
        var tbody = document.getElementById('live-table-body');
        if (!tbody) return;

        // Count valid/failed across all rows
        var validCount = 0;
        var failedCount = 0;
        rows.forEach(function(r) {
          var ok = String(r.is_success) === '1' || r.is_success === 1;
          if (ok) validCount++;
          else failedCount++;
        });

        var v = document.getElementById('live-stat-valid'); if(v) v.textContent = validCount;
        var f = document.getElementById('live-stat-failed'); if(f) f.textContent = failedCount;
        document.getElementById('live-counter').textContent = rows.length + ' hits';

        var parsedRows = rows.map(parseLiveRow);
        var serviceFilter = (document.getElementById('live-filter-service') || {}).value || '';
        var statusFilter = (document.getElementById('live-filter-status') || {}).value || '';
        var serverFilter = ((document.getElementById('live-filter-server') || {}).value || '').toLowerCase().trim();
        var keyword = ((document.getElementById('live-filter-keyword') || {}).value || '').toLowerCase().trim();
        var filtered = parsedRows.filter(function(p) {
          if (serviceFilter && p.type !== serviceFilter) return false;
          if (statusFilter === 'valid' && p.statusLabel !== 'VALID') return false;
          if (statusFilter === 'fail' && p.statusLabel !== 'FAIL') return false;
          if (serverFilter && String(p.serverUsed).toLowerCase().indexOf(serverFilter) === -1) return false;
          if (keyword) {
            var pool = (p.userText + ' ' + (p.nomorFull || p.nomor) + ' ' + p.accountName + ' ' + p.code).toLowerCase();
            if (pool.indexOf(keyword) === -1) return false;
          }
          return true;
        });
        liveRowsCache = filtered;

        if (!filtered.length) {
          tbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted py-4">Tidak ada data sesuai filter.</td></tr>';
        } else {
          tbody.innerHTML = filtered.map(function(p, idx) {
            return '<tr>' +
              '<td>' + p.time + '</td>' +
              '<td>' + liveEscapeText(p.userText) + '</td>' +
              '<td><span class="badge badge-blue">' + liveEscapeText(p.typeLabel) + '</span></td>' +
              '<td>' + liveEscapeText(String(p.serverUsed).toUpperCase()) + '</td>' +
              '<td>' + liveEscapeText(String(p.code).toUpperCase()) + '</td>' +
              '<td>' + liveEscapeText(p.nomor) + '</td>' +
              '<td>' + liveEscapeText(p.accountName) + '</td>' +
              '<td><span class="badge ' + p.statusBadge + '">' + p.statusLabel + '</span></td>' +
              '<td>' + p.rt + '</td>' +
              '<td>Rp ' + Number(p.deducted || 0).toLocaleString('id-ID') + '</td>' +
              '<td><button class="btn btn-sm btn-outline-secondary" onclick="showLiveRowDetail(' + idx + ')"><i class="bi bi-eye"></i></button></td>' +
            '</tr>';
          }).join('');
        }

        // Update timestamp
        var now = new Date();
        var hh = String(now.getHours()).padStart(2, '0');
        var mm = String(now.getMinutes()).padStart(2, '0');
        var ss = String(now.getSeconds()).padStart(2, '0');
        document.getElementById('live-updated').textContent = 'Updated ' + hh + ':' + mm + ':' + ss;
      })
      .catch(function(err) {
        var tbody = document.getElementById('live-table-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="11" class="text-center text-danger py-4">Error: ' + liveEscapeText(err.message || err) + '</td></tr>';
      });
  }

  // Load page-specific section on page load
window.__ADMIN_KEY__ = ${JSON.stringify(ADMIN_KEY)};
window.loadDashboardConsumption = window.loadDashboardConsumption || function() {
  fetch('/api/v3/admin/revenue/summary?key=' + encodeURIComponent(window.__ADMIN_KEY__ || ''))
    .then(function(r) { return r.json(); })
    .then(function(res) {
      if (!res || !res.status || !res.data) return;
      var wallet = res.data.wallet || {};
      var dashToday = document.getElementById('dash-consume-today');
      var dashAll = document.getElementById('dash-consume-all');
      if (dashToday) dashToday.textContent = 'Rp ' + Number(wallet.wallet_debit_today || 0).toLocaleString('id-ID');
      if (dashAll) dashAll.textContent = 'Rp ' + Number(wallet.wallet_debit || 0).toLocaleString('id-ID');
    })
    .catch(function() {});
};
window.addEventListener('resize', function() {
  if (window.innerWidth > 768) {
    const mobileSidebar = document.getElementById('sidebar');
    const mobileOverlay = document.getElementById('sb-overlay');
    if (mobileSidebar) mobileSidebar.classList.remove('show');
    if (mobileOverlay) mobileOverlay.classList.remove('show');
    document.body.classList.remove('sidebar-open');
  }
});
const __bootAdminPage = function() {
    if (typeof window.stripAdminKeyFromUrl === 'function') window.stripAdminKeyFromUrl();
    const rawPage = (window.__ADMIN_PAGE__ || 'dashboard');
    var page = rawPage === 'packages' ? 'services' : rawPage;
    try {
      var pathname = String((window.location && window.location.pathname) || '').toLowerCase();
      var prefix = '/admin/';
      if (pathname.indexOf(prefix) === 0) {
        var routePart = pathname.slice(prefix.length).split('/')[0].trim();
        if (routePart) {
          var routePage = routePart === 'packages' ? 'services' : routePart;
          var allowedRoutePages = {
            dashboard: 1,
            live: 1,
            users: 1,
            members: 1,
            settings: 1,
            tester: 1,
            revenue: 1,
            services: 1,
            'wa-settings': 1,
            mysql: 1,
            'redis-cache': 1,
            vps: 1
          };
          if (allowedRoutePages[routePage]) page = routePage;
        }
      }
    } catch (e) {}
    const pageTitles = {
      dashboard: 'Monitoring Dashboard',
      live: 'Live Monitoring',
      users: 'User Management (API)',
      members: 'Member Management (Portal)',
      settings: 'Konfigurasi Sistem',
      tester: 'API Health Tester',
      revenue: 'Analisa Pendapatan',
      services: 'Setingan Layanan',
      'wa-settings': 'Pengaturan WA',
      mysql: 'MySQL Management',
      'redis-cache': 'Redis Cache Audit',
      vps: 'VPS Status'
    };
    switchMainTab(page, pageTitles[page] || 'Monitoring Dashboard');
    if (page === 'dashboard') loadTrafficChart();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', __bootAdminPage, { once: true });
  } else {
    __bootAdminPage();
  }
})();
${extraScripts}
`;
  }
};

const EXTRA_ADMIN_SCRIPTS = String.raw`
let paymentMethodsState = [];
let membersAdminState = [];
window.__membersAdminFilteredState = [];
window.__currentMemberAdminCtx = { mode: '', member_id: 0, api_key_id: 0 };

window.loadPaymentMethods = function() {
  const tbody = document.getElementById('payment-methods-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Loading...</td></tr>';
  fetch('/api/v3/admin/payment-methods?key=' + encodeURIComponent(window.__ADMIN_KEY__ || ''))
    .then(r => r.json())
    .then(res => {
      paymentMethodsState = Array.isArray(res.data) ? res.data : [];
      if (!paymentMethodsState.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Tidak ada metode.</td></tr>';
        return;
      }
      tbody.innerHTML = paymentMethodsState.map(function(m, idx) {
        const range = (m.min_amount || 0) + ' - ' + (m.max_amount || 0);
        return '<tr>' +
          '<td><strong>' + (m.original_name || m.name || m.code) + '</strong><div class="text-muted" style="font-size:11px;">' + (m.code || '-') + '</div></td>' +
          '<td>' + (m.type || '-') + '</td>' +
          '<td>' + (m.fee_amount || 0) + '</td>' +
          '<td>' + range + '</td>' +
          '<td><div class="form-check form-switch"><input class="form-check-input" type="checkbox" data-pm-idx="' + idx + '" data-pm-field="enabled" ' + (m.enabled ? 'checked' : '') + '></div></td>' +
          '<td><input class="form-control form-control-sm" data-pm-idx="' + idx + '" data-pm-field="label" value="' + escapeHtmlAttr(m.name || '') + '" placeholder="Custom label"></td>' +
          '<td><input class="form-control form-control-sm" data-pm-idx="' + idx + '" data-pm-field="icon_url" value="' + escapeHtmlAttr(m.icon_url || '') + '" placeholder="https://...png"></td>' +
        '</tr>';
      }).join('');
    })
    .catch(err => {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error: ' + (err.message || err) + '</td></tr>';
    });
};

window.savePaymentMethods = function() {
  const inputs = document.querySelectorAll('#payment-methods-body [data-pm-idx]');
  const next = paymentMethodsState.map(function(m) { return Object.assign({}, m); });
  inputs.forEach(function(el) {
    const idx = parseInt(el.getAttribute('data-pm-idx'), 10);
    const field = el.getAttribute('data-pm-field');
    if (!next[idx] || !field) return;
    next[idx][field] = field === 'enabled' ? !!el.checked : el.value;
  });
  fetch('/api/v3/admin/payment-methods?key=' + encodeURIComponent(window.__ADMIN_KEY__ || ''), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ methods: next })
  })
    .then(r => r.json())
    .then(res => {
      if (!res.status) throw new Error(res.error || 'Gagal simpan metode pembayaran');
      alert(res.message || 'Metode pembayaran berhasil disimpan.');
      loadPaymentMethods();
    })
    .catch(err => alert(err.message || err));
};

window.renderMembersAdminTable = function(rows) {
  const tbody = document.getElementById('members-admin-body');
  const meta = document.getElementById('members-admin-search-meta');
  const list = Array.isArray(rows) ? rows : [];
  const total = Array.isArray(membersAdminState) ? membersAdminState.length : 0;
  if (!tbody) return;
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Tidak ada data member sesuai pencarian.</td></tr>';
    if (meta) meta.textContent = 'Menampilkan 0 dari ' + total + ' member';
    return;
  }
  if (meta) meta.textContent = 'Menampilkan ' + list.length + ' dari ' + total + ' member';
  tbody.innerHTML = list.map(function(m) {
    const duplicateWarn = Number(m.duplicate_ip_count || 0) > 1
      ? ' <span title="IP registrasi dipakai ' + Number(m.duplicate_ip_count) + ' akun" style="color:#f59e0b;"><i class="bi bi-exclamation-triangle-fill"></i></span>'
      : '';
    const memberCode = m.member_code ? ('<div class="text-muted" style="font-size:11px;">ID: ' + escapeHtmlText(m.member_code) + '</div>') : '';
    return '<tr>' +
      '<td><button type="button" class="btn btn-link p-0 text-start" onclick="openMemberAdmin(' + Number(m.member_id || m.api_key_id || m.id || 0) + ')"><strong>' + escapeHtmlText(m.name || '-') + '</strong></button>' + duplicateWarn + memberCode + '</td>' +
      '<td>' + escapeHtmlText(m.whatsapp_number || '-') + '</td>' +
      '<td><span class="text-muted" style="font-size:11px;">' + escapeHtmlText(m.registration_ip || '-') + '</span></td>' +
      '<td><span class="badge badge-blue">' + escapeHtmlText(m.mode || m.active_mode || '-') + '</span></td>' +
      '<td>' + escapeHtmlText(String(m.wallet_balance || 0)) + '</td>' +
      '<td><span class="text-muted" style="font-size:11px;">' + escapeHtmlText(m.api_key ? String(m.api_key).slice(0, 14) + '...' : '-') + '</span></td>' +
      '<td>' + (Number(m.is_active) === 1 ? '<span class="badge badge-green">Aktif</span>' : '<span class="badge badge-red">Nonaktif</span>') + '</td>' +
      '<td><button class="btn btn-sm btn-outline-info" onclick="openMemberAdmin(' + Number(m.member_id || m.api_key_id || m.id || 0) + ')"><i class="bi bi-pencil-square"></i></button> <button class="btn btn-sm btn-danger-soft" onclick="' + (String(m.mode || '') === 'api_only' ? "alert('Blokir API-only lakukan dari User Management.')" : ('quickBlockMember(' + Number(m.member_id || m.id || 0) + ')')) + '"><i class="bi bi-slash-circle"></i></button></td>' +
    '</tr>';
  }).join('');
};

window.filterMembersAdmin = function() {
  const input = document.getElementById('members-admin-search');
  const q = String((input && input.value) || '').trim().toLowerCase();
  if (!q) {
    window.__membersAdminFilteredState = membersAdminState.slice();
    return window.renderMembersAdminTable(window.__membersAdminFilteredState);
  }
  const filtered = membersAdminState.filter(function(m) {
    const haystack = [
      m.id,
      m.member_code,
      m.name,
      m.whatsapp_number,
      m.registration_ip,
      m.active_mode,
      m.wallet_balance,
      m.api_key,
      Number(m.is_active) === 1 ? 'aktif active on' : 'nonaktif inactive off'
    ].map(function(v) { return String(v || '').toLowerCase(); }).join(' ');
    return haystack.includes(q);
  });
  window.__membersAdminFilteredState = filtered;
  return window.renderMembersAdminTable(filtered);
};

window.loadMembersAdmin = function() {
  const tbody = document.getElementById('members-admin-body');
  const meta = document.getElementById('members-admin-search-meta');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Loading...</td></tr>';
  if (meta) meta.textContent = 'Memuat data member...';
  fetch('/api/v3/admin/members/unified?key=' + encodeURIComponent(window.__ADMIN_KEY__ || ''))
    .then(r => r.json())
    .then(res => {
      membersAdminState = Array.isArray(res.data) ? res.data : [];
      if (!membersAdminState.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Belum ada member.</td></tr>';
        if (meta) meta.textContent = 'Menampilkan 0 dari 0 member';
        return;
      }
      window.filterMembersAdmin();
    })
    .catch(err => {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error: ' + (err.message || err) + '</td></tr>';
      if (meta) meta.textContent = 'Gagal memuat data member';
    });
};

window.openMemberAdmin = function(id) {
  const member = membersAdminState.find(function(item) {
    return Number(item.member_id || item.id || 0) === Number(id) || Number(item.api_key_id || 0) === Number(id);
  });
  if (!member) return alert('Member tidak ditemukan.');
  const mode = String(member.mode || '').toLowerCase();
  const memberId = Number(member.member_id || member.id || 0);
  const apiKeyId = Number(member.api_key_id || 0);
  window.__currentMemberAdminCtx = { mode: mode, member_id: memberId, api_key_id: apiKeyId };
  document.getElementById('member-admin-id').value = memberId || apiKeyId || 0;
  document.getElementById('member-admin-name').value = member.name || '';
  document.getElementById('member-admin-wa').value = member.whatsapp_number || '';
  document.getElementById('member-admin-wallet').value = member.wallet_balance || 0;
  document.getElementById('member-admin-active').value = Number(member.is_active) === 1 ? '1' : '0';
  document.getElementById('member-admin-regip').value = member.registration_ip || '-';
  document.getElementById('member-admin-pin').value = '';
  const pinBtn = document.querySelector('#member-admin-pin') ? document.querySelector('#member-admin-pin').parentElement.querySelector('button') : null;
  if (pinBtn) pinBtn.disabled = (mode === 'api_only');
  const detailBox = document.getElementById('member-admin-detail');
  if (detailBox) detailBox.innerHTML = '<div class="text-muted">Loading detail transaksi...</div>';
  fetch('/api/v3/admin/members/unified/detail?key=' + encodeURIComponent(window.__ADMIN_KEY__ || '') + '&mode=' + encodeURIComponent(mode) + '&member_id=' + encodeURIComponent(memberId || 0) + '&api_key_id=' + encodeURIComponent(apiKeyId || 0))
    .then(r => r.json())
    .then(res => {
      if (!res.status || !res.data || !detailBox) return;
      const d = res.data;
      const topupCount = Array.isArray(d.topups) ? d.topups.length : 0;
      const walletCount = Array.isArray(d.wallet_transactions) ? d.wallet_transactions.length : 0;
      const invCount = Array.isArray(d.package_invoices) ? d.package_invoices.length : 0;
      const subCount = Array.isArray(d.subscriptions) ? d.subscriptions.length : 0;
      const topupRows = (Array.isArray(d.topups) ? d.topups.slice(0, 4) : []).map(function(row) {
        return '<tr>' +
          '<td>' + escapeHtmlText(row.invoice || '-') + '</td>' +
          '<td><span class="badge ' + statusBadgeClass(row.status) + '">' + escapeHtmlText(String(row.status || '-').toUpperCase()) + '</span></td>' +
          '<td>' + formatCurrency(row.total_amount || row.amount || 0) + '</td>' +
          '<td>' + formatAdminDate(row.created_at) + '</td>' +
        '</tr>';
      }).join('');
      const walletRows = (Array.isArray(d.wallet_transactions) ? d.wallet_transactions.slice(0, 4) : []).map(function(row) {
        return '<tr>' +
          '<td>' + escapeHtmlText(String(row.type || '-').toUpperCase()) + '</td>' +
          '<td>' + formatCurrency(row.amount || 0) + '</td>' +
          '<td>' + escapeHtmlText(row.description || '-') + '</td>' +
          '<td>' + formatAdminDate(row.created_at) + '</td>' +
        '</tr>';
      }).join('');
      const invoiceRows = (Array.isArray(d.package_invoices) ? d.package_invoices.slice(0, 4) : []).map(function(row) {
        return '<tr>' +
          '<td>' + escapeHtmlText(row.invoice_no || '-') + '</td>' +
          '<td>' + escapeHtmlText(row.package_name || '-') + '</td>' +
          '<td><span class="badge ' + statusBadgeClass(row.status) + '">' + escapeHtmlText(String(row.status || '-').toUpperCase()) + '</span></td>' +
          '<td>' + formatCurrency(row.amount || 0) + '</td>' +
        '</tr>';
      }).join('');
      const subRows = (Array.isArray(d.subscriptions) ? d.subscriptions.slice(0, 4) : []).map(function(row) {
        return '<tr>' +
          '<td>' + escapeHtmlText(row.package_name || '-') + '</td>' +
          '<td><span class="badge ' + statusBadgeClass(row.status) + '">' + escapeHtmlText(String(row.status || '-').toUpperCase()) + '</span></td>' +
          '<td>' + formatAdminDate(row.started_at) + '</td>' +
          '<td>' + formatAdminDate(row.ended_at) + '</td>' +
        '</tr>';
      }).join('');
      detailBox.innerHTML =
        '<div class="row g-2 mb-3">' +
          '<div class="col-md-3"><div class="p-2 border rounded settings-member-kpi"><div class="text-muted" style="font-size:11px;">Topup</div><div style="font-weight:700;">' + topupCount + '</div></div></div>' +
          '<div class="col-md-3"><div class="p-2 border rounded settings-member-kpi"><div class="text-muted" style="font-size:11px;">Wallet Tx</div><div style="font-weight:700;">' + walletCount + '</div></div></div>' +
          '<div class="col-md-3"><div class="p-2 border rounded settings-member-kpi"><div class="text-muted" style="font-size:11px;">Invoice Package</div><div style="font-weight:700;">' + invCount + '</div></div></div>' +
          '<div class="col-md-3"><div class="p-2 border rounded settings-member-kpi"><div class="text-muted" style="font-size:11px;">Subscription</div><div style="font-weight:700;">' + subCount + '</div></div></div>' +
        '</div>' +
        '<div class="row g-2">' +
          '<div class="col-md-6"><div class="border rounded p-2"><div class="text-muted mb-1" style="font-size:11px;">Topup Terbaru</div><div class="table-responsive"><table class="table table-sm mb-0"><thead><tr><th>Invoice</th><th>Status</th><th>Total</th><th>Tanggal</th></tr></thead><tbody>' + (topupRows || '<tr><td colspan="4" class="text-muted">Belum ada topup.</td></tr>') + '</tbody></table></div></div></div>' +
          '<div class="col-md-6"><div class="border rounded p-2"><div class="text-muted mb-1" style="font-size:11px;">Wallet Transaksi</div><div class="table-responsive"><table class="table table-sm mb-0"><thead><tr><th>Type</th><th>Amount</th><th>Deskripsi</th><th>Tanggal</th></tr></thead><tbody>' + (walletRows || '<tr><td colspan="4" class="text-muted">Belum ada mutasi.</td></tr>') + '</tbody></table></div></div></div>' +
          '<div class="col-md-6"><div class="border rounded p-2"><div class="text-muted mb-1" style="font-size:11px;">Invoice Package</div><div class="table-responsive"><table class="table table-sm mb-0"><thead><tr><th>Invoice</th><th>Package</th><th>Status</th><th>Total</th></tr></thead><tbody>' + (invoiceRows || '<tr><td colspan="4" class="text-muted">Belum ada invoice.</td></tr>') + '</tbody></table></div></div></div>' +
          '<div class="col-md-6"><div class="border rounded p-2"><div class="text-muted mb-1" style="font-size:11px;">Subscription</div><div class="table-responsive"><table class="table table-sm mb-0"><thead><tr><th>Package</th><th>Status</th><th>Mulai</th><th>Berakhir</th></tr></thead><tbody>' + (subRows || '<tr><td colspan="4" class="text-muted">Belum ada riwayat package.</td></tr>') + '</tbody></table></div></div></div>' +
        '</div>';
    })
    .catch(() => {
      if (detailBox) detailBox.innerHTML = '<div class="text-danger">Gagal memuat detail member.</div>';
    });
  new bootstrap.Modal(document.getElementById('memberAdminModal')).show();
};

window.loadRevenueAnalytics = function() {
  const topupBody = document.getElementById('revenue-topups-body');
  fetch('/api/v3/admin/revenue/summary?key=' + encodeURIComponent(window.__ADMIN_KEY__ || ''))
    .then(r => r.json())
    .then(res => {
      if (!res.status || !res.data) throw new Error(res.error || 'Gagal memuat summary');
      const topups = res.data.topups || {};
      const packages = res.data.packages || {};
      const wallet = res.data.wallet || {};
      document.getElementById('rv-topup-success').textContent = Number(topups.total_topup_success || 0).toLocaleString('id-ID');
      document.getElementById('rv-topup-pending').textContent = Number(topups.total_topup_pending || 0).toLocaleString('id-ID');
      document.getElementById('rv-package-paid').textContent = Number(packages.total_package_paid || 0).toLocaleString('id-ID');
      document.getElementById('rv-wallet-debit').textContent = Number(wallet.wallet_debit || 0).toLocaleString('id-ID');
      const dashToday = document.getElementById('dash-consume-today');
      const dashAll = document.getElementById('dash-consume-all');
      if (dashToday) dashToday.textContent = 'Rp ' + Number(wallet.wallet_debit_today || 0).toLocaleString('id-ID');
      if (dashAll) dashAll.textContent = 'Rp ' + Number(wallet.wallet_debit || 0).toLocaleString('id-ID');
    })
    .catch(err => {
      alert(err.message || err);
    });

  if (!topupBody) return;
  topupBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Loading...</td></tr>';
  fetch('/api/v3/admin/revenue/topups?key=' + encodeURIComponent(window.__ADMIN_KEY__ || '') + '&limit=100')
    .then(r => r.json())
    .then(res => {
      const rows = Array.isArray(res.data) ? res.data : [];
      if (!rows.length) {
        topupBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Belum ada data topup.</td></tr>';
        return;
      }
      topupBody.innerHTML = rows.map(function(row) {
        const status = String(row.status || '-').toUpperCase();
        return '<tr>' +
          '<td class="ps-3"><strong>' + escapeHtmlText(row.invoice || '-') + '</strong></td>' +
          '<td>' + escapeHtmlText((row.member_name || '-') + ' (' + (row.whatsapp_number || '-') + ')') + '</td>' +
          '<td>' + escapeHtmlText(row.method_name || '-') + '</td>' +
          '<td>' + Number(row.total_amount || 0).toLocaleString('id-ID') + '</td>' +
          '<td><span class="badge ' + (status === 'SUCCESS' ? 'badge-green' : (status === 'PENDING' ? 'badge-amber' : 'badge-red')) + '">' + status + '</span></td>' +
          '<td>' + escapeHtmlText(row.expired_at || '-') + '</td>' +
          '<td>' + escapeHtmlText(row.created_at || '-') + '</td>' +
        '</tr>';
      }).join('');
    })
    .catch(err => {
      topupBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error: ' + escapeHtmlText(err.message || err) + '</td></tr>';
    });
};

window.loadDashboardConsumption = function() {
  fetch('/api/v3/admin/revenue/summary?key=' + encodeURIComponent(window.__ADMIN_KEY__ || ''))
    .then(r => r.json())
    .then(res => {
      if (!res.status || !res.data) return;
      const wallet = res.data.wallet || {};
      const dashToday = document.getElementById('dash-consume-today');
      const dashAll = document.getElementById('dash-consume-all');
      if (dashToday) dashToday.textContent = 'Rp ' + Number(wallet.wallet_debit_today || 0).toLocaleString('id-ID');
      if (dashAll) dashAll.textContent = 'Rp ' + Number(wallet.wallet_debit || 0).toLocaleString('id-ID');
    })
    .catch(() => {});
};

window.loadRedisAudit = function() {
  window.__REDIS_AUDIT_PAGE__ = window.__REDIS_AUDIT_PAGE__ || 1;
  const body = document.getElementById('redis-audit-body');
  const statusEl = document.getElementById('redis-audit-status');
  const service = (document.getElementById('redis-audit-service') || {}).value || '';
  const q = (document.getElementById('redis-audit-q') || {}).value || '';
  const limit = Number((document.getElementById('redis-audit-limit') || {}).value || 50);
  const page = Math.max(1, Number(window.__REDIS_AUDIT_PAGE__ || 1));
  const pageInfoEl = document.getElementById('redis-audit-page-info');
  const prevBtn = document.getElementById('redis-audit-prev');
  const nextBtn = document.getElementById('redis-audit-next');
  if (body) body.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Loading...</td></tr>';
  if (statusEl) statusEl.textContent = 'Loading status...';
  if (pageInfoEl) pageInfoEl.textContent = 'Loading page...';
  if (prevBtn) prevBtn.disabled = true;
  if (nextBtn) nextBtn.disabled = true;

  fetch('/api/v3/redis-audit/status?key=' + encodeURIComponent(window.__ADMIN_KEY__ || ''))
    .then(r => r.json())
    .then(res => {
      if (!statusEl) return;
      if (!res.status || !res.data) {
        statusEl.innerHTML = '<span class="text-danger">Gagal baca status Redis.</span>';
        return;
      }
      const d = res.data;
      statusEl.innerHTML =
        '<span class="badge ' + (d.connected ? 'badge-green' : 'badge-red') + '">' + (d.connected ? 'Connected' : 'Disconnected') + '</span> ' +
        '<span class="ms-2">Enabled: <strong>' + (d.enabled ? 'ON' : 'OFF') + '</strong></span> ' +
        '<span class="ms-2">Prefix: <strong>' + escapeHtmlText(d.prefix || '-') + '</strong></span> ' +
        '<span class="ms-2">Keys: <strong>' + Number(d.key_count || 0).toLocaleString('id-ID') + '</strong></span> ' +
        '<span class="ms-2">Memory: <strong>' + escapeHtmlText(d.used_memory_human || '-') + '</strong></span>' +
        (d.error ? ('<div class="text-danger mt-1" style="font-size:12px;">' + escapeHtmlText(d.error) + '</div>') : '');
    })
    .catch(err => {
      if (statusEl) statusEl.innerHTML = '<span class="text-danger">Error: ' + escapeHtmlText(err.message || err) + '</span>';
    });

  fetch('/api/v3/redis-audit/keys?key=' + encodeURIComponent(window.__ADMIN_KEY__ || '') + '&service=' + encodeURIComponent(service) + '&q=' + encodeURIComponent(q) + '&limit=' + encodeURIComponent(limit) + '&page=' + encodeURIComponent(page))
    .then(r => r.json())
    .then(res => {
      if (!body) return;
      const rows = Array.isArray(res.data) ? res.data : [];
      const pg = res.pagination || {};
      const currentPage = Number(pg.page || page);
      const hasMore = !!pg.has_more;
      if (pageInfoEl) {
        pageInfoEl.textContent = 'Page ' + currentPage + ' • ' + rows.length + ' item';
      }
      if (prevBtn) prevBtn.disabled = currentPage <= 1;
      if (nextBtn) nextBtn.disabled = !hasMore;
      if (!rows.length) {
        body.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Tidak ada key cache.</td></tr>';
        return;
      }
      body.innerHTML = rows.map(function(row) {
        return '<tr>' +
          '<td class="ps-3"><span style="font-family:monospace;font-size:12px;">' + escapeHtmlText(row.key || '-') + '</span></td>' +
          '<td>' + escapeHtmlText(row.type || '-') + '</td>' +
          '<td>' + escapeHtmlText(row.code || '-') + '</td>' +
          '<td>' + escapeHtmlText(row.target || '-') + '</td>' +
          '<td>' + escapeHtmlText(String(row.ttl)) + '</td>' +
          '<td>' + Number(row.size_bytes || 0).toLocaleString('id-ID') + ' B</td>' +
          '<td><button class="btn btn-sm btn-outline-info me-1" data-key="' + escapeHtmlAttr(row.key || '') + '" onclick="viewRedisKeyDetail(this.dataset.key)"><i class="bi bi-eye"></i></button>' +
          '<button class="btn btn-sm btn-danger-soft" data-key="' + escapeHtmlAttr(row.key || '') + '" onclick="deleteRedisAuditKey(this.dataset.key)"><i class="bi bi-trash"></i></button></td>' +
        '</tr>';
      }).join('');
    })
    .catch(err => {
      if (body) body.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error: ' + escapeHtmlText(err.message || err) + '</td></tr>';
      if (pageInfoEl) pageInfoEl.textContent = 'Error load page';
      if (prevBtn) prevBtn.disabled = false;
      if (nextBtn) nextBtn.disabled = false;
    });
};

window.setRedisAuditPage = function(nextPage) {
  const page = Math.max(1, Number(nextPage || 1));
  window.__REDIS_AUDIT_PAGE__ = page;
  loadRedisAudit();
};

window.viewRedisKeyDetail = function(key) {
  fetch('/api/v3/redis-audit/keys?key=' + encodeURIComponent(window.__ADMIN_KEY__ || '') + '&q=' + encodeURIComponent(key) + '&limit=1')
    .then(r => r.json())
    .then(res => {
      const row = Array.isArray(res.data) && res.data[0] ? res.data[0] : null;
      if (!row) return alert('Key tidak ditemukan.');
      alert('Key: ' + row.key + '\nTTL: ' + row.ttl + '\nSize: ' + row.size_bytes + ' bytes\nService: ' + row.type + '\nCode: ' + row.code + '\nTarget: ' + row.target);
    })
    .catch(err => alert('Gagal baca key: ' + (err.message || err)));
};

window.deleteRedisAuditKey = function(key) {
  if (!confirm('Hapus key cache ini?')) return;
  fetch('/api/v3/redis-audit/key?key=' + encodeURIComponent(window.__ADMIN_KEY__ || '') + '&target_key=' + encodeURIComponent(key), { method: 'DELETE' })
    .then(r => r.json())
    .then(res => {
      if (!res.status) throw new Error(res.error || 'Gagal hapus key');
      loadRedisAudit();
    })
    .catch(err => alert(err.message || err));
};

window.flushRedisAuditPrefix = function() {
  if (!confirm('Hapus semua key cache Redis milik aplikasi ini?')) return;
  fetch('/api/v3/redis-audit/flush-prefix?key=' + encodeURIComponent(window.__ADMIN_KEY__ || ''), { method: 'POST' })
    .then(r => r.json())
    .then(res => {
      if (!res.status) throw new Error(res.error || 'Gagal flush prefix');
      alert((res.message || 'Sukses') + ' Deleted: ' + Number(res.deleted || 0));
      loadRedisAudit();
    })
    .catch(err => alert(err.message || err));
};

window.saveMemberAdmin = function() {
  const ctx = window.__currentMemberAdminCtx || {};
  fetch('/api/v3/admin/members/unified/save?key=' + encodeURIComponent(window.__ADMIN_KEY__ || ''), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: ctx.mode || '',
      member_id: Number(ctx.member_id || 0),
      api_key_id: Number(ctx.api_key_id || 0),
      name: document.getElementById('member-admin-name').value,
      whatsapp_number: document.getElementById('member-admin-wa').value,
      wallet_balance: document.getElementById('member-admin-wallet').value,
      is_active: document.getElementById('member-admin-active').value
    })
  })
    .then(r => r.json())
    .then(res => {
      if (!res.status) throw new Error(res.error || 'Gagal update member');
      alert(res.message || 'Member berhasil diperbarui.');
      loadMembersAdmin();
    })
    .catch(err => alert(err.message || err));
};

window.resetMemberPin = function() {
  const ctx = window.__currentMemberAdminCtx || {};
  const pin = document.getElementById('member-admin-pin').value;
  if (!pin) return alert('Masukkan PIN baru 6 digit.');
  if (String(ctx.mode || '') === 'api_only') return alert('Akun API-only tidak memiliki PIN portal.');
  fetch('/api/v3/admin/members/unified/reset-pin?key=' + encodeURIComponent(window.__ADMIN_KEY__ || ''), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: ctx.mode || '',
      member_id: Number(ctx.member_id || 0),
      pin: pin
    })
  })
    .then(r => r.json())
    .then(res => {
      if (!res.status) throw new Error(res.error || 'Gagal reset PIN');
      alert(res.message || 'PIN berhasil direset.');
      document.getElementById('member-admin-pin').value = '';
    })
    .catch(err => alert(err.message || err));
};

window.regenerateMemberApiKey = function() {
  const ctx = window.__currentMemberAdminCtx || {};
  const id = Number(ctx.member_id || 0);
  if (!id) return alert('Generate API key hanya tersedia untuk akun portal/link.');
  fetch('/api/v3/admin/members/' + id + '/regenerate-apikey?key=' + encodeURIComponent(window.__ADMIN_KEY__ || ''), { method: 'POST' })
    .then(r => r.json())
    .then(res => {
      if (!res.status) throw new Error(res.error || 'Gagal generate ulang API key');
      alert((res.message || 'API key baru berhasil dibuat') + '\\n\\n' + (res.data && res.data.api_key ? res.data.api_key : ''));
      loadMembersAdmin();
    })
    .catch(err => alert(err.message || err));
};

window.blockMemberAdmin = function() {
  const ctx = window.__currentMemberAdminCtx || {};
  const id = Number(ctx.member_id || 0);
  if (!id) return alert('Blokir dari halaman ini hanya untuk akun portal/link.');
  quickBlockMember(id);
};

window.resendMemberApiToWa = function() {
  const ctx = window.__currentMemberAdminCtx || {};
  fetch('/api/v3/admin/members/unified/resend-wa?key=' + encodeURIComponent(window.__ADMIN_KEY__ || ''), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: ctx.mode || '',
      member_id: Number(ctx.member_id || 0),
      api_key_id: Number(ctx.api_key_id || 0)
    })
  })
    .then(r => r.json())
    .then(res => {
      if (!res.status) throw new Error(res.error || 'Gagal kirim detail API ke WA');
      alert(res.message || 'Detail API berhasil dikirim ulang ke WA.');
    })
    .catch(err => alert(err.message || err));
};

window.quickBlockMember = function(id) {
  if (!confirm('Blokir member ini secara manual?')) return;
  fetch('/api/v3/admin/members/' + id + '/block?key=' + encodeURIComponent(window.__ADMIN_KEY__ || ''), { method: 'POST' })
    .then(r => r.json())
    .then(res => {
      if (!res.status) throw new Error(res.error || 'Gagal blokir member');
      alert(res.message || 'Member berhasil diblokir.');
      loadMembersAdmin();
      const modalEl = document.getElementById('memberAdminModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    })
    .catch(err => alert(err.message || err));
};

function escapeHtmlText(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlAttr(value) {
  return escapeHtmlText(value).replace(/"/g, '&quot;');
}

function formatCurrency(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return '0';
  return num.toLocaleString('id-ID');
}

function formatAdminDate(value) {
  if (!value) return '-';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return escapeHtmlText(String(value));
  return dt.toLocaleString('id-ID', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function statusBadgeClass(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'success' || s === 'paid' || s === 'active') return 'badge-green';
  if (s === 'pending') return 'badge-amber';
  return 'badge-red';
}
`;
