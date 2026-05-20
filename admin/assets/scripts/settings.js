/**
 * admin/assets/scripts/settings.js
 * JS khusus halaman settings.
 * Fungsi: initServiceStatusSwitches, simplifySettingsTechnicalView,
 *          analyzeServer7Pool, analyzeServer3Pool,
 *          initSettingsCollapsible, switchSvcTab,
 *          openBankRoutingModal, saveBankRouting,
 *          initResponseMapper & semua responseMapper*,
 *          loadPaymentMethods, savePaymentMethods (settings juga butuh ini)
 *
 * Di-inject hanya jika activePage === 'settings'.
 */
module.exports = function renderSettingsScripts() {
  return `
/* ============================================================
   SETTINGS MODULE
   ============================================================ */
window.initServiceStatusSwitches = function() {
  var root = document.getElementById('main-services');
  if (!root) return;
  root.querySelectorAll('.service-status-switch').forEach(function(sw) {
    if (sw.dataset.bound === '1') return;
    var targetId = sw.getAttribute('data-target');
    var hidden   = targetId ? document.getElementById(targetId) : null;
    var label    = sw.closest('.form-check') ? sw.closest('.form-check').querySelector('.service-status-label') : null;
    var apply    = function() {
      var on = !!sw.checked;
      if (hidden) hidden.value = on ? 'on' : 'off';
      if (label)  label.textContent = on ? 'ON' : 'OFF';
    };
    apply();
    sw.addEventListener('change', apply);
    sw.dataset.bound = '1';
  });
};

window.simplifySettingsTechnicalView = function() {
  var root = document.getElementById('main-settings');
  if (!root || root.dataset.technicalOnlyReady === '1') return;
  var namesToHide = ['bank_status','ewallet_status','whatsapp_status','nik_status','bpjs_status','pln_status','games_status','cost_bank','cost_ewallet','cost_whatsapp','cost_nik','cost_bpjs','cost_pln','cost_games','cooldown_bank','cooldown_ewallet','cooldown_whatsapp','cooldown_nik','cooldown_bpjs','cooldown_pln'];
  namesToHide.forEach(function(name) {
    root.querySelectorAll('[name="' + name + '"]').forEach(function(el) {
      var block = el.closest('.col-md-6, .col-md-4, .col-md-3, .col-12, .row, .p-3.rounded.mb-3, .svc-server-card');
      if (block) block.style.display = 'none';
    });
  });
  var shell = root.querySelector('.settings-hero, .kr-hero');
  if (shell && !root.querySelector('#settings-tech-note')) {
    var note = document.createElement('div');
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
  body.innerHTML = '<tr><td colspan="5" class="text-muted kr-skeleton-row"><span class="spinner-border spinner-border-sm me-2"></span>Memeriksa endpoint/session...</td></tr>';
  var number = window.prompt('Nomor uji untuk analisa server7 pool (contoh 081234567890):', '081234567890');
  if (!number) { body.innerHTML = '<tr><td colspan="5" class="text-muted">Dibatalkan.</td></tr>'; return; }
  fetch('/admin/server7-pool-analyze?key=' + encodeURIComponent(window.__ADMIN_KEY__ || '') + '&code=dana&account_number=' + encodeURIComponent(String(number || '').replace(/[^0-9]/g, '')))
    .then(function(r){ return r.json(); })
    .then(function(res){
      if (!res || !res.status) throw new Error((res && (res.error || res.message)) || 'Gagal analisa server7 pool.');
      var rows = Array.isArray(res.data) ? res.data : [];
      if (!rows.length) { body.innerHTML = '<tr><td colspan="5" class="text-muted">Tidak ada kandidat server7 aktif.</td></tr>'; return; }
      body.innerHTML = rows.map(function(row){
        var ok = !!row.ok;
        return '<tr><td><strong>' + _sEsc(row.alias || '-') + '</strong></td>'
          + '<td>' + (ok ? '<span class="badge badge-green">ACTIVE</span>' : '<span class="badge badge-red">ISSUE</span>') + '</td>'
          + '<td>' + (ok ? '<span class="badge badge-blue">Session Hidup</span>' : '<span class="badge badge-amber">Session Bermasalah</span>') + '</td>'
          + '<td><strong>' + _sEsc(String(row.latency_ms || 0)) + ' ms</strong></td>'
          + '<td class="text-muted">' + _sEsc((row.host || '-') + ' - ' + (row.reason || '-')) + '</td></tr>';
      }).join('');
    })
    .catch(function(err){ body.innerHTML = '<tr><td colspan="5" class="text-danger">' + _sEsc(err.message || 'Gagal analisa') + '</td></tr>'; });
};

window.analyzeServer3Pool = function() {
  var body = document.getElementById('server3-pool-analyze-body');
  if (!body) return;
  body.innerHTML = '<tr><td colspan="5" class="text-muted kr-skeleton-row"><span class="spinner-border spinner-border-sm me-2"></span>Memeriksa endpoint/session...</td></tr>';
  var number = window.prompt('Nomor rekening uji (contoh 1234567890):', '1234567890');
  if (!number) { body.innerHTML = '<tr><td colspan="5" class="text-muted">Dibatalkan.</td></tr>'; return; }
  var bankCode = window.prompt('Kode bank (codeid) untuk uji server3 pool (contoh 014 untuk BCA):', '014');
  if (!bankCode) { body.innerHTML = '<tr><td colspan="5" class="text-muted">Dibatalkan.</td></tr>'; return; }
  fetch('/admin/server3-pool-analyze?key=' + encodeURIComponent(window.__ADMIN_KEY__ || '') + '&bank_code=' + encodeURIComponent(String(bankCode || '').trim()) + '&account_number=' + encodeURIComponent(String(number || '').replace(/[^0-9]/g, '')))
    .then(function(r){ return r.json(); })
    .then(function(res){
      if (!res || !res.status) throw new Error((res && (res.error || res.message)) || 'Gagal analisa server3 pool.');
      var rows = Array.isArray(res.data) ? res.data : [];
      if (!rows.length) { body.innerHTML = '<tr><td colspan="5" class="text-muted">Tidak ada kandidat server3 aktif.</td></tr>'; return; }
      body.innerHTML = rows.map(function(row){
        var ok = !!row.ok;
        return '<tr><td><strong>' + _sEsc(row.alias || '-') + '</strong></td>'
          + '<td>' + (ok ? '<span class="badge badge-green">ACTIVE</span>' : '<span class="badge badge-red">ISSUE</span>') + '</td>'
          + '<td>' + (ok ? '<span class="badge badge-blue">Session Hidup</span>' : '<span class="badge badge-amber">Session Bermasalah</span>') + '</td>'
          + '<td><strong>' + _sEsc(String(row.latency_ms || 0)) + ' ms</strong></td>'
          + '<td class="text-muted">' + _sEsc((row.host || '-') + ' - ' + (row.reason || '-')) + '</td></tr>';
      }).join('');
    })
    .catch(function(err){ body.innerHTML = '<tr><td colspan="5" class="text-danger">' + _sEsc(err.message || 'Gagal analisa') + '</td></tr>'; });
};

window.initSettingsCollapsible = function() {
  var root = document.getElementById('main-settings');
  if (!root || root.dataset.collapseReady === '1') return;
  var cards = Array.from(root.querySelectorAll('.settings-card'));
  cards.forEach(function(card, idx) {
    var header = card.querySelector('.card-header');
    var body   = card.querySelector('.card-body');
    if (!header || !body) return;
    var title      = (header.textContent || ('card-' + idx)).trim().toLowerCase().replace(/\\s+/g, '-');
    var storageKey = 'settings-collapse:' + title + ':' + idx;
    var defaultOpen = idx < 2 ? '1' : '0';
    var saved   = localStorage.getItem(storageKey);
    var isOpen  = (saved === null ? defaultOpen : saved) === '1';
    header.style.cursor = 'pointer';
    header.style.userSelect = 'none';
    header.classList.add('d-flex', 'justify-content-between', 'align-items-center');
    if (!header.querySelector('.settings-collapse-toggle')) {
      var iconWrap = document.createElement('span');
      iconWrap.className = 'settings-collapse-toggle ms-2';
      iconWrap.innerHTML = '<i class="bi bi-chevron-down"></i>';
      header.appendChild(iconWrap);
    }
    var icon = header.querySelector('.settings-collapse-toggle i');
    var applyState = function(open) {
      body.style.display = open ? '' : 'none';
      if (icon) { icon.style.transition = 'transform .2s ease'; icon.style.transform = open ? 'rotate(0deg)' : 'rotate(-90deg)'; }
      localStorage.setItem(storageKey, open ? '1' : '0');
    };
    applyState(isOpen);
    header.addEventListener('click', function(e) {
      if (e.target && e.target.closest('button, input, select, textarea, a')) return;
      applyState(body.style.display === 'none');
    });
  });
  root.dataset.collapseReady = '1';
};

window.switchSvcTab = function(tabId, btn) {
  document.querySelectorAll('.svc-tab-pane').forEach(function(el) { el.style.display = 'none'; });
  document.querySelectorAll('.svc-tab-btn').forEach(function(el) { el.classList.remove('active'); });
  var pane = document.getElementById(tabId);
  if (pane) pane.style.display = 'block';
  if (btn) btn.classList.add('active');
};

/* ── Payment Methods (settings page) ──────────────────────────── */
var _pmState = [];
window.loadPaymentMethods = function() {
  var tbody = document.getElementById('payment-methods-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-3"><span class="kr-skeleton-row"><span class="spinner-border spinner-border-sm me-2"></span>Memuat...</span></td></tr>';
  fetch('/api/v3/admin/payment-methods?key=' + encodeURIComponent(window.__ADMIN_KEY__ || ''))
    .then(function(r){ return r.json(); })
    .then(function(res){
      _pmState = Array.isArray(res.data) ? res.data : [];
      if (!_pmState.length) { tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Tidak ada metode.</td></tr>'; return; }
      tbody.innerHTML = _pmState.map(function(m, idx) {
        return '<tr>'
          + '<td><strong>' + _sEsc(m.original_name || m.name || m.code) + '</strong><div class="text-muted" style="font-size:11px;">' + _sEsc(m.code || '-') + '</div></td>'
          + '<td>' + _sEsc(m.type || '-') + '</td>'
          + '<td>' + (m.fee_amount || 0) + '</td>'
          + '<td>' + (m.min_amount || 0) + ' - ' + (m.max_amount || 0) + '</td>'
          + '<td><div class="form-check form-switch"><input class="form-check-input" type="checkbox" data-pm-idx="' + idx + '" data-pm-field="enabled" ' + (m.enabled ? 'checked' : '') + '></div></td>'
          + '<td><input class="form-control form-control-sm" data-pm-idx="' + idx + '" data-pm-field="label" value="' + _sAttr(m.name || '') + '" placeholder="Custom label"></td>'
          + '<td><input class="form-control form-control-sm" data-pm-idx="' + idx + '" data-pm-field="icon_url" value="' + _sAttr(m.icon_url || '') + '" placeholder="https://...png"></td>'
          + '</tr>';
      }).join('');
    })
    .catch(function(err){ tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">' + _sEsc(err.message || err) + '</td></tr>'; });
};

window.savePaymentMethods = function() {
  var inputs = document.querySelectorAll('#payment-methods-body [data-pm-idx]');
  var next   = _pmState.map(function(m){ return Object.assign({}, m); });
  inputs.forEach(function(el) {
    var idx   = parseInt(el.getAttribute('data-pm-idx'), 10);
    var field = el.getAttribute('data-pm-field');
    if (!next[idx] || !field) return;
    next[idx][field] = field === 'enabled' ? !!el.checked : el.value;
  });
  fetch('/api/v3/admin/payment-methods?key=' + encodeURIComponent(window.__ADMIN_KEY__ || ''), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ methods: next }) })
    .then(function(r){ return r.json(); })
    .then(function(res){
      if (!res.status) throw new Error(res.error || 'Gagal simpan metode');
      if (window.kNotify) { kNotify.success(res.message || 'Metode pembayaran disimpan.'); } else { alert(res.message || 'Metode pembayaran berhasil disimpan.'); }
      window.loadPaymentMethods();
    })
    .catch(function(err){ if (window.kNotify) { kNotify.error(err.message || err); } else { alert(err.message || err); } });
};

/* ── Bank Routing Modal ──────────────────────────────────────── */
var _bankRoutingState = { banks: [], toggles: {} };
window.openBankRoutingModal = function() {
  var tbody = document.getElementById('bank-routing-tbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted kr-skeleton-row"><span class="spinner-border spinner-border-sm me-2"></span>Loading...</td></tr>';
  fetch('/api/v3/admin/bank-routing?key=' + encodeURIComponent(window.__ADMIN_KEY__ || ''))
    .then(function(r){ return r.json(); })
    .then(function(res){
      if (!res.status) throw new Error(res.error || 'Gagal load data');
      _bankRoutingState = res.data || { banks: [], toggles: {} };
      _renderBankRoutingTable('');
      var search = document.getElementById('bank-routing-search');
      if (search) { search.value = ''; search.oninput = function(){ _renderBankRoutingTable(search.value); }; }
      new bootstrap.Modal(document.getElementById('bankRoutingModal')).show();
    })
    .catch(function(err){ if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">' + _sEsc(err.message || err) + '</td></tr>'; });
};
function _renderBankRoutingTable(query) {
  var tbody = document.getElementById('bank-routing-tbody');
  if (!tbody) return;
  var q       = (query || '').toLowerCase().trim();
  var banks   = Array.isArray(_bankRoutingState.banks) ? _bankRoutingState.banks : [];
  var toggles = _bankRoutingState.toggles || {};
  var filtered = q ? banks.filter(function(b){ return String(b.name||'').toLowerCase().includes(q) || String(b.codeid||'').toLowerCase().includes(q); }) : banks;
  if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">Tidak ada data.</td></tr>'; return; }
  tbody.innerHTML = filtered.map(function(b) {
    var codeid = String(b.codeid || '').trim();
    var t = toggles[codeid] || {};
    var chk = function(k){ return !(t[k] === 0 || t[k] === '0' || t[k] === false); };
    var sw = function(server){ return '<td class="text-center"><div class="form-check form-switch m-0 d-flex justify-content-center"><input class="form-check-input" type="checkbox" data-br-codeid="' + codeid + '" data-br-server="' + server + '" ' + (chk(server) ? 'checked' : '') + '></div></td>'; };
    return '<tr><td class="ps-3"><div style="font-weight:600;">' + _sEsc(b.name||'-') + '</div></td><td><span class="badge badge-blue">' + codeid + '</span></td>' + ['s1','s2','s3','s4','s5','s6','s7'].map(sw).join('') + '</tr>';
  }).join('');
}
window.saveBankRouting = function() {
  var btn  = document.getElementById('bank-routing-save-btn');
  var orig = btn ? btn.innerHTML : '';
  if (btn) { btn.innerHTML = 'Menyimpan...'; btn.disabled = true; }
  var inputs = document.querySelectorAll('#bankRoutingModal input[data-br-codeid]');
  var temp   = {};
  inputs.forEach(function(inp) {
    var codeid = inp.getAttribute('data-br-codeid');
    var server = inp.getAttribute('data-br-server');
    if (!codeid || !server) return;
    if (!temp[codeid]) temp[codeid] = { s1:1, s2:1, s3:1, s4:1, s5:1, s6:1, s7:1 };
    temp[codeid][server] = inp.checked ? 1 : 0;
  });
  var toggles = {};
  Object.keys(temp).forEach(function(codeid) {
    var row = temp[codeid];
    if (!(row.s1===1 && row.s2===1 && row.s3===1 && row.s4===1 && row.s5===1 && row.s6===1 && row.s7===1)) toggles[codeid] = row;
  });
  fetch('/api/v3/admin/bank-routing?key=' + encodeURIComponent(window.__ADMIN_KEY__ || ''), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toggles: toggles }) })
    .then(function(r){ return r.json(); })
    .then(function(res){
      if (!res.status) throw new Error(res.error || 'Gagal menyimpan');
      if (window.kNotify) { kNotify.success('Routing bank tersimpan.'); } else { alert('Routing bank tersimpan.'); }
      bootstrap.Modal.getInstance(document.getElementById('bankRoutingModal')).hide();
    })
    .catch(function(err){ if (window.kNotify) { kNotify.error('Gagal menyimpan: ' + (err.message||err)); } else { alert('Gagal menyimpan: ' + (err.message||err)); } })
    .finally(function(){ if (btn) { btn.innerHTML = orig; btn.disabled = false; } });
};

/* ── Escape helpers (local to settings module) ─────────────────── */
function _sEsc(v) { return String(v===undefined||v===null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function _sAttr(v) { return _sEsc(v).replace(/"/g,'&quot;'); }
`;
};
