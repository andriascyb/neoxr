/**
 * admin/assets/scripts/tester.js
 * JS khusus halaman tester.
 * Fungsi: onGameServiceChange, testGames, testAPI, copyToClipboard
 * Di-inject hanya jika activePage === 'tester'.
 */
module.exports = function renderTesterScripts() {
  return `
/* ============================================================
   TESTER MODULE
   ============================================================ */
window.onGameServiceChange = function() {
  var ZONE_SERVICES = ['region-ml','mlbb-bundle','mlcreate','first-topup','first-mcgg'];
  var serviceEl = document.getElementById('tt-gmc-service');
  var zoneWrap  = document.getElementById('tt-gmc-zone-wrap');
  if (!serviceEl || !zoneWrap) return;
  zoneWrap.style.display = ZONE_SERVICES.includes(serviceEl.value || '') ? '' : 'none';
};

window.testGames = function() {
  var btn       = document.getElementById('btn-games');
  var box       = document.getElementById('test-result');
  var serviceEl = document.getElementById('tt-gmc-service');
  var uidEl     = document.getElementById('tt-gmc-uid');
  var zoneEl    = document.getElementById('tt-gmc-zone');
  if (!btn || !box || !serviceEl || !uidEl || !zoneEl) {
    if (window.kNotify) { kNotify.warn('Form tester game belum siap dimuat.'); } else { alert('Form tester game belum siap dimuat.'); } return;
  }
  var ZONE_SERVICES = ['region-ml','mlbb-bundle','mlcreate','first-topup','first-mcgg'];
  var service = serviceEl.value || '';
  var uid     = uidEl.value.trim();
  var zone    = zoneEl.value.trim();
  if (!uid) { if (window.kNotify) { kNotify.warn('Harap isi User ID!'); } else { alert('Harap isi User ID!'); } return; }
  if (ZONE_SERVICES.includes(service) && !zone) { if (window.kNotify) { kNotify.warn('Zone ID wajib untuk game ini!'); } else { alert('Zone ID wajib untuk game ini!'); } return; }
  var orig = btn.innerHTML; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Menguji...'; btn.disabled = true;
  box.style.display = 'block'; box.textContent = 'Menunggu respon...';
  var t0  = performance.now();
  var url = '/admin/test-server?key=' + encodeURIComponent(window.__ADMIN_KEY__ || '') + '&type=games&game_service=' + encodeURIComponent(service) + '&game_user_id=' + encodeURIComponent(uid);
  if (zone) url += '&game_zone_id=' + encodeURIComponent(zone);
  fetch(url).then(function(r){ return r.json().then(function(data) {
    box.textContent = '// Game: ' + service + ' | Latency: ' + (performance.now()-t0).toFixed(2) + 'ms\\n' + JSON.stringify(data, null, 2);
    box.style.color = data.status ? '#16a34a' : '#dc2626';
  }); }).catch(function(err){ box.style.color = '#dc2626'; box.textContent = 'Error:\\n' + err.message; }).finally(function(){ btn.innerHTML = orig; btn.disabled = false; });
};

window.testAPI = function(type, codeId, numId, srvId) {
  var btn      = document.getElementById('btn-' + type);
  var box      = document.getElementById('test-result');
  if (!btn || !box) { if (window.kNotify) { kNotify.warn('UI tester belum siap dimuat.'); } else { alert('UI tester belum siap dimuat.'); } return; }
  var codeEl   = codeId ? document.getElementById(codeId) : null;
  var numEl    = numId  ? document.getElementById(numId)  : null;
  var serverEl = srvId  ? document.getElementById(srvId)  : null;
  var code     = codeEl   ? codeEl.value.trim()   : '';
  var number   = numEl    ? numEl.value.trim()    : '';
  var server   = serverEl ? (serverEl.value || 'auto') : 'auto';
  if (!number) { if (window.kNotify) { kNotify.warn(type === 'ai' ? 'Harap isi image URL!' : 'Harap isi nomor yang akan diuji!'); } else { alert(type === 'ai' ? 'Harap isi image URL!' : 'Harap isi nomor yang akan diuji!'); } return; }
  if (type === 'ai' && !code) { if (window.kNotify) { kNotify.warn('Harap isi prompt/query AI!'); } else { alert('Harap isi prompt/query AI!'); } return; }
  if ((type === 'bank' || type === 'ewallet') && !code) { if (window.kNotify) { kNotify.warn('Harap isi kode provider/bank!'); } else { alert('Harap isi kode provider/bank!'); } return; }
  if (typeof window.log === 'function') log('Testing ' + type + ' [' + server + ']: ' + (code ? code + ' ' : '') + number);
  var orig = btn.innerHTML; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Menguji...'; btn.disabled = true;
  box.style.display = 'block'; box.textContent = 'Menunggu respon...';
  var t0  = performance.now();
  var url;
  if (server !== 'auto') {
    url = '/admin/test-server?key=' + encodeURIComponent(window.__ADMIN_KEY__ || '') + '&type=' + encodeURIComponent(type) + '&server=' + encodeURIComponent(server);
    if (type === 'nik')      url += '&nik='                + encodeURIComponent(number);
    else if (type === 'whatsapp') url += '&nomor='          + encodeURIComponent(number);
    else if (type === 'ai')  url += '&image=' + encodeURIComponent(number) + '&q=' + encodeURIComponent(code);
    else                     url += '&code='  + encodeURIComponent(code)   + '&account_number=' + encodeURIComponent(number);
  } else {
    var apiKeyEl = document.getElementById('tt-api-key');
    url = '/api/v3/validate?type=' + type + '&api_key=' + encodeURIComponent(apiKeyEl ? apiKeyEl.value.trim() : '');
    if (type === 'nik')       url += '&nik='               + encodeURIComponent(number);
    else if (type === 'whatsapp') url += '&nomor='          + encodeURIComponent(number);
    else if (type === 'ai')   url += '&image=' + encodeURIComponent(number) + '&q=' + encodeURIComponent(code);
    else                      url += '&code='  + encodeURIComponent(code)   + '&account_number=' + encodeURIComponent(number);
  }
  fetch(url).then(async function(res) {
    var ms      = (performance.now() - t0).toFixed(2);
    var rawText = await res.text();
    var data = null;
    try { data = JSON.parse(rawText); } catch (e) { data = null; }
    if (!data) {
      box.style.color = '#dc2626';
      box.textContent = '// Server: ' + server + ' | Latency: ' + ms + 'ms | HTTP: ' + res.status + '\\nResponse bukan JSON.\\n\\n' + rawText;
      return;
    }
    if (type === 'ewallet' && server === 'server5' && data.state === 'pending' && data.ref_id) {
      box.style.color = '#d97706';
      box.textContent = '// Server: ' + server + ' | Latency: ' + ms + 'ms\\n' + JSON.stringify(data, null, 2) + '\\n\\nMenunggu callback Qiospay...';
      var refId = data.ref_id, attempts = 0;
      return new Promise(function(resolve) {
        (function poll() {
          attempts++;
          fetch('/admin/test-server/qiospay-result?key=' + encodeURIComponent(window.__ADMIN_KEY__ || '') + '&ref_id=' + encodeURIComponent(refId))
            .then(async function(r2) {
              var txt = await r2.text(), out = null;
              try { out = JSON.parse(txt); } catch (e) {}
              var totalMs = (performance.now()-t0).toFixed(2);
              if (!out) { box.style.color='#dc2626'; box.textContent='// Server: '+server+' | Latency: '+totalMs+'ms | HTTP: '+r2.status+'\\nResponse polling bukan JSON.\\n\\n'+txt; resolve(); return; }
              box.style.color = out.status ? '#16a34a' : (out.state==='waiting'?'#d97706':'#dc2626');
              box.textContent = '// Server: '+server+' | Latency: '+totalMs+'ms | Poll: '+attempts+'\\n'+JSON.stringify(out,null,2);
              if (out.status || out.state==='success'||out.state==='timeout'||out.state==='callback_received'||out.state==='not_found') { resolve(); return; }
              setTimeout(poll, 1000);
            }).catch(function(err){ box.style.color='#dc2626'; box.textContent='Error polling callback:\\n'+err.message; resolve(); });
        })();
      });
    }
    if (typeof window.log === 'function') log('Test OK [' + server + ']: ' + ms + 'ms');
    box.textContent = '// Server: ' + server + ' | Latency: ' + ms + 'ms\\n' + JSON.stringify(data, null, 2);
    box.style.color = data.status ? '#16a34a' : '#dc2626';
  }).catch(function(err){ box.style.color='#dc2626'; box.textContent='Error:\\n'+err.message; })
    .finally(function(){ btn.innerHTML = orig; btn.disabled = false; });
};

window.copyToClipboard = function(text) {
  navigator.clipboard.writeText(text).then(function() {
    if (window.kNotify) { kNotify.success('Disalin ke clipboard!'); } else { alert('Copied to clipboard!'); }
  }).catch(function(err) {
    if (window.kNotify) { kNotify.error('Gagal menyalin: ' + err); } else { alert('Failed to copy: ' + err); }
  });
};
`;
};
