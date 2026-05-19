module.exports = function renderServicesSection(ctx = {}) {
  const req = ctx.req || {};
  const appConfig = (req && req.appConfig) || {};
  const ADMIN_KEY = ctx.ADMIN_KEY || 'admin123';
  const current = (k, d) => appConfig[k] !== undefined ? appConfig[k] : d;
  const isOn = (k, d = 'on') => String(current(k, d)).toLowerCase() === 'on';
  const serviceCard = (opt) => `
    <div class="service-setting-card">
      <div class="service-setting-head">
        <div>
          <div class="service-setting-title">${opt.title}</div>
          <div class="service-setting-sub">${opt.sub}</div>
        </div>
        <div class="service-setting-toggle">
          <input type="hidden" name="${opt.statusName}" id="${opt.statusName}" value="${isOn(opt.statusName, opt.defaultStatus) ? 'on' : 'off'}">
          <div class="form-check form-switch m-0">
            <input class="form-check-input service-status-switch" type="checkbox" id="${opt.statusName}_switch" data-target="${opt.statusName}" ${isOn(opt.statusName, opt.defaultStatus) ? 'checked' : ''}>
            <label class="form-check-label service-status-label" for="${opt.statusName}_switch">${isOn(opt.statusName, opt.defaultStatus) ? 'ON' : 'OFF'}</label>
          </div>
        </div>
      </div>
      <div class="row g-3 mt-1">
        <div class="col-md-6">
          <label class="form-label">Harga per Hit (Rp)</label>
          <input type="number" class="form-control" name="${opt.costName}" value="${current(opt.costName, 0)}">
        </div>
        <div class="col-md-6">
          <label class="form-label">Cooldown (detik)</label>
          ${opt.cooldownName
            ? `<input type="number" class="form-control" name="${opt.cooldownName}" value="${current(opt.cooldownName, 0)}">`
            : `<input type="text" class="form-control" value="Tidak digunakan" disabled>`}
        </div>
        ${opt.timeoutName
          ? `<div class="col-md-6">
               <label class="form-label">Timeout (ms)</label>
               <input type="number" class="form-control" name="${opt.timeoutName}" value="${current(opt.timeoutName, 15000)}">
             </div>`
          : ``}
        ${opt.ttlHoursName
          ? `<div class="col-md-6">
               <label class="form-label">Masa simpan file (jam)</label>
               <input type="number" class="form-control" name="${opt.ttlHoursName}" value="${current(opt.ttlHoursName, 12)}">
             </div>`
          : ``}
      </div>
    </div>`;

  return `
  <div id="main-services" class="main-tab-pane" style="display:none;">
    <div class="settings-hero">
      <div>
        <div class="settings-hero-kicker"><i class="bi bi-sliders2-vertical"></i> Service Billing Control</div>
        <h2>Setingan Layanan</h2>
        <p>Atur status layanan, harga per hit, dan cooldown tanpa menyentuh konfigurasi teknis provider.</p>
      </div>
      <div class="settings-hero-badge"><i class="bi bi-stars"></i><span>Premium Control</span></div>
    </div>

    <div class="card settings-card">
      <div class="card-body">
  <form id="services-form" action="/admin/save" method="POST" onsubmit="saveSettings(event)">
          <div class="service-setting-grid">
            ${serviceCard({ title: 'Bank', sub: 'Validasi rekening bank', statusName: 'bank_status', defaultStatus: 'on', costName: 'cost_bank', cooldownName: 'cooldown_bank' })}
            ${serviceCard({ title: 'E-Wallet', sub: 'Validasi akun ewallet', statusName: 'ewallet_status', defaultStatus: 'on', costName: 'cost_ewallet', cooldownName: 'cooldown_ewallet' })}
            ${serviceCard({ title: 'WhatsApp', sub: 'Cek status nomor WhatsApp', statusName: 'whatsapp_status', defaultStatus: 'on', costName: 'cost_whatsapp', cooldownName: 'cooldown_whatsapp' })}
            ${serviceCard({ title: 'NIK', sub: 'Validasi identitas NIK', statusName: 'nik_status', defaultStatus: 'on', costName: 'cost_nik', cooldownName: 'cooldown_nik' })}
            ${serviceCard({ title: 'Games', sub: 'Validasi ID game', statusName: 'games_status', defaultStatus: 'off', costName: 'cost_games', cooldownName: null })}
            ${serviceCard({ title: 'BPJS', sub: 'Cek tagihan BPJS', statusName: 'bpjs_status', defaultStatus: 'off', costName: 'cost_bpjs', cooldownName: 'cooldown_bpjs' })}
            ${serviceCard({ title: 'PLN', sub: 'Cek tagihan PLN', statusName: 'pln_status', defaultStatus: 'off', costName: 'cost_pln', cooldownName: 'cooldown_pln' })}
            ${serviceCard({ title: 'Foto Editor', sub: 'Foto editor URL/upload via provider (Neoxr)', statusName: 'ai_status', defaultStatus: 'off', costName: 'cost_ai', cooldownName: 'cooldown_ai', timeoutName: 'ai_timeout_ms', ttlHoursName: 'ai_file_ttl_hours' })}
          </div>
          <div class="d-flex gap-2 mt-4 settings-actionbar">
            <button type="submit" class="btn btn-primary"><i class="bi bi-floppy me-1"></i>Simpan Setingan Layanan</button>
            <button type="button" class="btn btn-outline-secondary" onclick="window.location.reload()"><i class="bi bi-arrow-counterclockwise me-1"></i>Refresh</button>
          </div>
        </form>
      </div>
    </div>
  </div>`;
};
