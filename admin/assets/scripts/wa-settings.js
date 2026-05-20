/**
 * admin/assets/scripts/wa-settings.js
 * JS khusus halaman wa-settings.
 * Fungsi: loadWaOtpLogs, loadWaInboundOtpLogs, clearWaOtpLogs,
 *          clearWaInboundOtpLogs, switchWaCenterTab,
 *          restartWA, generateWaPairingCode, logoutWA, resetWA, refreshWaQr,
 *          renderWaLogPagination, escapeWaLogText
 *
 * Di-inject hanya jika activePage === 'wa-settings'.
 * Fungsi-fungsi ini tidak dipakai di section lain.
 */
module.exports = function renderWaSettingsScripts() {
  return `
/* ============================================================
   WA SETTINGS MODULE
   ============================================================ */
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
  var metaWrap  = document.getElementById(cfg.metaId);
  if (!pagesWrap || !metaWrap) return;
  var p          = cfg.pagination || {};
  var total      = Number(p.total || 0);
  var page       = Math.max(1, Number(p.page || 1));
  var pageSize   = Math.max(1, Number(p.page_size || window.__waLogPageSize || 25));
  var totalPages = Math.max(1, Number(p.total_pages || 1));
  if (total <= 0) { metaWrap.textContent = 'Belum ada data.'; pagesWrap.innerHTML = ''; return; }
  var start = ((page - 1) * pageSize) + 1;
  var end   = Math.min(total, page * pageSize);
  metaWrap.textContent = 'Menampilkan ' + start + '-' + end + ' dari ' + total + ' data';
  var minPage = Math.max(1, page - 2);
  var maxPage = Math.min(totalPages, page + 2);
  var html = '';
  html += '<button type="button" class="btn btn-sm btn-outline-secondary ' + (page <= 1 ? 'disabled' : '') + '" ' + (page <= 1 ? '' : ('onclick="' + cfg.loader + '(' + (page - 1) + ')"')) + '>Prev</button>';
  for (var i = minPage; i <= maxPage; i += 1) {
    html += '<button type="button" class="btn btn-sm ' + (i === page ? 'btn-primary' : 'btn-outline-secondary') + '" onclick="' + cfg.loader + '(' + i + ')">' + i + '</button>';
  }
  html += '<button type="button" class="btn btn-sm btn-outline-secondary ' + (page >= totalPages ? 'disabled' : '') + '" ' + (page >= totalPages ? '' : ('onclick="' + cfg.loader + '(' + (page + 1) + ')"')) + '>Next</button>';
  pagesWrap.innerHTML = html;
};

window.loadWaOtpLogs = function(page) {
  var body = document.getElementById('wa-otp-logs-body');
  if (!body) return;
  if (Number.isFinite(page)) window.__waOtpLogPage = Math.max(1, parseInt(page, 10) || 1);
  var direction = (document.getElementById('wa-log-direction') || {}).value || '';
  var number    = (document.getElementById('wa-log-number') || {}).value || '';
  var status    = (document.getElementById('wa-log-status') || {}).value || '';
  body.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-3"><span class="kr-skeleton-row"><span class="spinner-border spinner-border-sm me-2"></span>Memuat log...</span></td></tr>';
  var qs = new URLSearchParams({ key: window.__ADMIN_KEY__ || '', page: String(window.__waOtpLogPage || 1), page_size: String(window.__waLogPageSize || 25) });
  if (direction) qs.set('direction', direction);
  if (number)    qs.set('number', number);
  if (status)    qs.set('status', status);
  fetch('/admin/wa-otp/logs?' + qs.toString())
    .then(function(r){ return r.json(); })
    .then(function(res){
      if (!res || !res.status) throw new Error((res && (res.error || res.message)) || 'Gagal memuat log.');
      var rows = Array.isArray(res.data) ? res.data : [];
      var pagination = res.pagination || { page: 1, page_size: 25, total: rows.length, total_pages: 1 };
      body.innerHTML = rows.length ? rows.map(function(item){
        var dt = item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-';
        var msgRaw   = String(item.message_text || '');
        var msgShort = msgRaw.length > 100 ? (msgRaw.slice(0, 100) + '...') : msgRaw;
        return '<tr>'
          + '<td style="white-space:nowrap;">' + dt + '</td>'
          + '<td><span class="badge ' + (item.direction === 'inbound' ? 'badge-blue' : 'badge-green') + '">' + (item.direction || '-') + '</span></td>'
          + '<td>' + window.escapeWaLogText(item.whatsapp_number || '-') + '</td>'
          + '<td>' + window.escapeWaLogText(item.message_type || '-') + '</td>'
          + '<td>' + window.escapeWaLogText(item.status || '-') + '</td>'
          + '<td>' + window.escapeWaLogText(item.reason || '-') + '</td>'
          + '<td title="' + window.escapeWaLogText(msgRaw) + '">' + window.escapeWaLogText(msgShort) + '</td>'
          + '</tr>';
      }).join('') : '<tr><td colspan="7" class="text-center text-muted">Log kosong.</td></tr>';
      window.renderWaLogPagination({ pagesId: 'wa-otp-logs-pages', metaId: 'wa-otp-logs-meta', pagination: pagination, loader: 'loadWaOtpLogs' });
    })
    .catch(function(err){
      body.innerHTML = '<tr><td colspan="7" class="text-center text-danger">' + window.escapeWaLogText(err.message || 'Gagal memuat log') + '</td></tr>';
      window.renderWaLogPagination({ pagesId: 'wa-otp-logs-pages', metaId: 'wa-otp-logs-meta', pagination: { total: 0 }, loader: 'loadWaOtpLogs' });
    });
};

window.loadWaInboundOtpLogs = function(page) {
  var body = document.getElementById('wa-inbound-otp-logs-body');
  if (!body) return;
  if (Number.isFinite(page)) window.__waInboundOtpLogPage = Math.max(1, parseInt(page, 10) || 1);
  var number = (document.getElementById('wa-inbound-log-number') || {}).value || '';
  var reason = (document.getElementById('wa-inbound-log-reason') || {}).value || '';
  body.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3"><span class="kr-skeleton-row"><span class="spinner-border spinner-border-sm me-2"></span>Memuat...</span></td></tr>';
  var qs = new URLSearchParams({ key: window.__ADMIN_KEY__ || '', direction: 'inbound', message_type: 'otp', page: String(window.__waInboundOtpLogPage || 1), page_size: String(window.__waLogPageSize || 25) });
  if (number) qs.set('number', number);
  if (reason) qs.set('reason', reason);
  fetch('/admin/wa-otp/logs?' + qs.toString())
    .then(function(r){ return r.json(); })
    .then(function(res){
      if (!res || !res.status) throw new Error((res && (res.error || res.message)) || 'Gagal memuat log inbound OTP.');
      var rows = Array.isArray(res.data) ? res.data : [];
      var pagination = res.pagination || { page: 1, page_size: 25, total: rows.length, total_pages: 1 };
      var badgeClass = function(s) {
        s = String(s || '').toLowerCase();
        if (s === 'verified') return 'badge-green';
        if (s === 'invalid' || s === 'failed') return 'badge-red';
        if (s === 'ignored' || s === 'expired') return 'badge-amber';
        return 'badge-blue';
      };
      body.innerHTML = rows.length ? rows.map(function(item){
        var dt      = item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-';
        var msgRaw  = String(item.message_text || '');
        var msgShort = msgRaw.length > 160 ? (msgRaw.slice(0, 160) + '...') : msgRaw;
        return '<tr>'
          + '<td style="white-space:nowrap;">' + dt + '</td>'
          + '<td>' + window.escapeWaLogText(item.whatsapp_number || '-') + '</td>'
          + '<td><span class="badge ' + badgeClass(item.status) + '">' + window.escapeWaLogText(item.status || '-') + '</span></td>'
          + '<td>' + window.escapeWaLogText(item.reason || '-') + '</td>'
          + '<td title="' + window.escapeWaLogText(msgRaw) + '">' + window.escapeWaLogText(msgShort) + '</td>'
          + '</tr>';
      }).join('') : '<tr><td colspan="5" class="text-center text-muted">Belum ada log pesan masuk OTP.</td></tr>';
      window.renderWaLogPagination({ pagesId: 'wa-inbound-otp-logs-pages', metaId: 'wa-inbound-otp-logs-meta', pagination: pagination, loader: 'loadWaInboundOtpLogs' });
    })
    .catch(function(err){
      body.innerHTML = '<tr><td colspan="5" class="text-center text-danger">' + window.escapeWaLogText(err.message || 'Gagal memuat log') + '</td></tr>';
      window.renderWaLogPagination({ pagesId: 'wa-inbound-otp-logs-pages', metaId: 'wa-inbound-otp-logs-meta', pagination: { total: 0 }, loader: 'loadWaInboundOtpLogs' });
    });
};

window.clearWaOtpLogs = function() {
  var direction = (document.getElementById('wa-log-direction') || {}).value || '';
  var number    = (document.getElementById('wa-log-number') || {}).value || '';
  var status    = (document.getElementById('wa-log-status') || {}).value || '';
  var hasFilter = !!(direction || number || status);
  if (!window.confirm(hasFilter ? 'Hapus log sesuai filter saat ini?' : 'Filter kosong. Hapus SEMUA log OTP & pesan WA?')) return;
  var payload = { direction: direction, number: number, status: status };
  if (!hasFilter) payload.mode = 'all';
  fetch('/admin/wa-otp/logs/clear?key=' + encodeURIComponent(window.__ADMIN_KEY__ || ''), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    .then(function(r){ return r.json(); })
    .then(function(res){
      if (!res || !res.status) throw new Error((res && (res.error || res.message)) || 'Gagal bersihkan log.');
      window.__waOtpLogPage = 1;
      if (typeof window.loadWaOtpLogs === 'function') window.loadWaOtpLogs(1);
      if (window.kNotify) { kNotify.success(res.message || 'Log berhasil dibersihkan.'); } else { alert(res.message || 'Log berhasil dibersihkan.'); }
    })
    .catch(function(err){ if (window.kNotify) { kNotify.error(err.message || 'Gagal bersihkan log.'); } else { alert(err.message || 'Gagal bersihkan log.'); } });
};

window.clearWaInboundOtpLogs = function() {
  var number = (document.getElementById('wa-inbound-log-number') || {}).value || '';
  var reason = (document.getElementById('wa-inbound-log-reason') || {}).value || '';
  if (!window.confirm('Hapus log pesan masuk OTP sesuai filter saat ini?')) return;
  fetch('/admin/wa-otp/logs/clear?key=' + encodeURIComponent(window.__ADMIN_KEY__ || ''), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ direction: 'inbound', message_type: 'otp', number: number, reason: reason })
  })
    .then(function(r){ return r.json(); })
    .then(function(res){
      if (!res || !res.status) throw new Error((res && (res.error || res.message)) || 'Gagal bersihkan log inbound OTP.');
      window.__waInboundOtpLogPage = 1;
      if (typeof window.loadWaInboundOtpLogs === 'function') window.loadWaInboundOtpLogs(1);
      if (window.kNotify) { kNotify.success(res.message || 'Log inbound OTP dibersihkan.'); } else { alert(res.message || 'Log inbound OTP berhasil dibersihkan.'); }
    })
    .catch(function(err){ if (window.kNotify) { kNotify.error(err.message || 'Gagal bersihkan log.'); } else { alert(err.message || err); } });
};

window.switchWaCenterTab = function(tab) {
  var paneSettings = document.getElementById('wa-center-pane-settings');
  var paneLogs     = document.getElementById('wa-center-pane-logs');
  var paneInbound  = document.getElementById('wa-center-pane-inbound');
  var btnSettings  = document.getElementById('wa-center-tab-btn-settings');
  var btnLogs      = document.getElementById('wa-center-tab-btn-logs');
  var btnInbound   = document.getElementById('wa-center-tab-btn-inbound');
  if (!paneSettings || !paneLogs || !paneInbound || !btnSettings || !btnLogs || !btnInbound) return;
  var tabKey   = String(tab || '').toLowerCase();
  var isLogs   = tabKey === 'logs';
  var isInbound = tabKey === 'inbound';
  paneSettings.style.display = (!isLogs && !isInbound) ? '' : 'none';
  paneLogs.style.display     = isLogs ? '' : 'none';
  paneInbound.style.display  = isInbound ? '' : 'none';
  var base = 'btn btn-sm wa-center-tab-btn';
  if (isLogs) {
    btnSettings.className = base + ' btn-outline-secondary';
    btnLogs.className     = base + ' btn-primary';
    btnInbound.className  = base + ' btn-outline-secondary';
    if (typeof window.loadWaOtpLogs === 'function') window.loadWaOtpLogs();
  } else if (isInbound) {
    btnSettings.className = base + ' btn-outline-secondary';
    btnLogs.className     = base + ' btn-outline-secondary';
    btnInbound.className  = base + ' btn-primary';
    if (typeof window.loadWaInboundOtpLogs === 'function') window.loadWaInboundOtpLogs();
  } else {
    btnSettings.className = base + ' btn-primary';
    btnLogs.className     = base + ' btn-outline-secondary';
    btnInbound.className  = base + ' btn-outline-secondary';
  }
};

window.restartWA = function() {
  fetch('/admin/wa-restart?key=' + encodeURIComponent(window.__ADMIN_KEY__ || ''), { method: 'POST' })
    .then(function(r){ return r.json(); })
    .then(function(d){
      var msg = d.message || (d.status ? 'Baileys starting...' : 'Gagal start Baileys.');
      if (window.kNotify) { kNotify[d.status ? 'success' : 'error'](msg); } else { alert(msg); }
      if (typeof window.refreshWaQr === 'function') window.refreshWaQr();
    })
    .catch(function(err){
      var m = 'Gagal restart Baileys: ' + (err && err.message || err);
      if (window.kNotify) { kNotify.error(m); } else { alert(m); }
    });
};

window.generateWaPairingCode = function() {
  var input = document.getElementById('wa-pairing-number');
  var view  = document.getElementById('wa-pairing-code-view');
  var renderPairingView = function(code, note) {
    if (!view) return;
    var safeCode = String(code || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var safeNote = String(note || 'Generate kode lalu masukkan di WhatsApp: Perangkat tertaut.').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    view.innerHTML = '<span class="wa-pairing-label">Pairing Code</span><strong>' + safeCode + '</strong><small>' + safeNote + '</small>';
  };
  var num = String((input && input.value) || '').replace(/[^0-9]/g, '');
  if (!num) {
    var msg = 'Isi nomor WA dulu (format 628...).';
    if (window.kNotify) { kNotify.warn(msg); } else { alert(msg); } return;
  }
  renderPairingView('...', 'Sedang membuat kode pairing.');
  fetch('/admin/wa-pairing-code?key=' + encodeURIComponent(window.__ADMIN_KEY__ || ''), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ number: num }) })
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
      if (window.kNotify) { kNotify.error('Gagal generate pairing code: ' + (err.message || err)); } else { alert('Gagal generate pairing code: ' + err.message); }
    });
};

window.logoutWA = function() {
  if (!confirm('Logout sesi Baileys dan hapus session tersimpan?')) return;
  fetch('/admin/wa-logout?key=' + encodeURIComponent(window.__ADMIN_KEY__ || ''), { method: 'POST' })
    .then(function(r){ return r.json(); })
    .then(function(d){
      var msg = d.message || (d.status ? 'Logout berhasil.' : 'Logout gagal.');
      if (window.kNotify) { kNotify[d.status ? 'success' : 'error'](msg); } else { alert(msg); }
      if (typeof window.refreshWaQr === 'function') window.refreshWaQr();
    })
    .catch(function(err){
      var m = 'Gagal logout Baileys: ' + (err && err.message || err);
      if (window.kNotify) { kNotify.error(m); } else { alert(m); }
    });
};

window.resetWA = function() { if (typeof window.refreshWaQr === 'function') window.refreshWaQr(true); };

window.refreshWaQr = function(forceStart) {
  var applyConnectedNumber = function(rawNumber) {
    var n = String(rawNumber || '').replace(/[^0-9]/g, '');
    if (!n) return;
    var input         = document.querySelector('input[name="member_register_otp_target_number"]');
    var pairingInput  = document.getElementById('wa-pairing-number');
    if (input && (!String(input.value || '').trim() || /x{3,}/i.test(String(input.value || '')))) input.value = n;
    if (pairingInput && (!String(pairingInput.value || '').trim() || /x{3,}/i.test(String(pairingInput.value || '')))) pairingInput.value = n;
  };
  var statusEl     = document.getElementById('wa-qr-status');
  var wrap         = document.getElementById('wa-qr-wrap');
  var pairingView  = document.getElementById('wa-pairing-code-view');
  var renderPairing = function(code, note) {
    if (!pairingView) return;
    var safeCode = String(code || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var safeNote = String(note || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    pairingView.innerHTML = '<span class="wa-pairing-label">Pairing Code</span><strong>' + safeCode + '</strong><small>' + safeNote + '</small>';
  };
  if (!statusEl || !wrap) return;
  statusEl.textContent = 'Memuat status QR...';
  var startPromise = Promise.resolve();
  if (forceStart) {
    startPromise = fetch('/admin/wa-restart?key=' + encodeURIComponent(window.__ADMIN_KEY__ || ''), { method: 'POST' })
      .then(function(r){ return r.json(); }).catch(function(){ return null; });
  }
  startPromise.finally(function() {
    fetch('/admin/wa-qr?key=' + encodeURIComponent(window.__ADMIN_KEY__ || '') + '&t=' + Date.now())
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (!d || d.status !== true) throw new Error('QR response invalid');
        if (d.connected) {
          statusEl.textContent = 'Baileys Connected';
          applyConnectedNumber(d.connected_number);
          renderPairing('CONNECTED', 'Akun WhatsApp sudah terhubung.');
          wrap.innerHTML = '<div style="text-align:center;"><div class="badge badge-green mb-2">Connected</div><div class="text-muted" style="font-size:12px;">QR tidak diperlukan.</div></div>';
          return;
        }
        if (pairingView && d.pairing_code) renderPairing(String(d.pairing_code), d.pairing_updated_at ? ('Update ' + new Date(d.pairing_updated_at).toLocaleTimeString() + '. Masukkan kode ini di WhatsApp.') : 'Masukkan kode ini di WhatsApp.');
        if (d.qr_available && d.qr_base64) {
          statusEl.textContent = 'QR Ready' + (d.qr_updated_at ? (' \u2022 ' + new Date(d.qr_updated_at).toLocaleTimeString()) : '');
          wrap.innerHTML = '<img src="' + d.qr_base64 + '" alt="QR Baileys" style="width:220px;height:220px;object-fit:contain;border-radius:8px;background:#fff;padding:8px;">';
        } else {
          statusEl.textContent = 'Menunggu QR...';
          wrap.innerHTML = '<div class="text-muted" style="font-size:12px;">QR belum tersedia. Klik Connect/Restart.</div>';
        }
      })
      .catch(function(err){
        statusEl.textContent = 'Error QR';
        wrap.innerHTML = '<div class="text-danger" style="font-size:12px;">' + (err && err.message ? err.message : 'Gagal memuat QR') + '</div>';
      });
  });
};
`;
};
