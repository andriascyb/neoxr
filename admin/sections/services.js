/**
 * admin/sections/services.js
 * Service Billing Control — pakai renderHero + renderCard dari admin/components/.
 * Semua ID / name / class yang dipakai scripts.js dipertahankan persis:
 *   - #main-services, #services-form
 *   - name/id dari setiap input (statusName, costName, cooldownName, timeoutName, ttlHoursName)
 *   - .service-status-switch[data-target], .service-status-label
 *   - onclick: saveSettings(event), window.location.reload(), initServiceStatusSwitches()
 */
const { renderHero, renderCard } = require('../components');

module.exports = function renderServicesSection(ctx = {}) {
  const req       = ctx.req || {};
  const appConfig = (req && req.appConfig) || {};

  // ── Helpers ───────────────────────────────────────────────────────────────
  const current = (k, d) => (appConfig[k] !== undefined ? appConfig[k] : d);
  const isOn    = (k, d = 'on') => String(current(k, d)).toLowerCase() === 'on';

  /**
   * Render satu service card.
   * Layout: title + sub-label di kiri, toggle ON/OFF di kanan.
   * Fields: Harga per Hit, Cooldown, + opsional Timeout/TTL.
   */
  const serviceCard = (opt) => {
    const on      = isOn(opt.statusName, opt.defaultStatus);
    const onLabel = on ? 'ON' : 'OFF';

    const extraFields = [
      opt.timeoutName ? `
        <div class="col-md-6">
          <label class="form-label">Timeout (ms)</label>
          <input type="number" class="form-control" name="${opt.timeoutName}"
            value="${current(opt.timeoutName, 15000)}">
        </div>` : '',
      opt.ttlHoursName ? `
        <div class="col-md-6">
          <label class="form-label">Masa simpan file (jam)</label>
          <input type="number" class="form-control" name="${opt.ttlHoursName}"
            value="${current(opt.ttlHoursName, 12)}">
        </div>` : ''
    ].join('');

    return `
    <div class="service-setting-card">
      <div class="service-setting-head">
        <div>
          <div class="service-setting-title">${opt.title}</div>
          <div class="service-setting-sub">${opt.sub}</div>
        </div>
        <div class="service-setting-toggle">
          <input type="hidden" name="${opt.statusName}" id="${opt.statusName}"
            value="${on ? 'on' : 'off'}">
          <div class="form-check form-switch m-0">
            <input class="form-check-input service-status-switch" type="checkbox"
              id="${opt.statusName}_switch"
              data-target="${opt.statusName}"
              ${on ? 'checked' : ''}>
            <label class="form-check-label service-status-label"
              for="${opt.statusName}_switch">${onLabel}</label>
          </div>
        </div>
      </div>
      <div class="row g-3 mt-1">
        <div class="col-md-6">
          <label class="form-label">Harga per Hit (Rp)</label>
          <input type="number" class="form-control" name="${opt.costName}"
            value="${current(opt.costName, 0)}" min="0">
        </div>
        <div class="col-md-6">
          <label class="form-label">Cooldown (detik)</label>
          ${opt.cooldownName
            ? `<input type="number" class="form-control" name="${opt.cooldownName}"
                 value="${current(opt.cooldownName, 0)}" min="0">`
            : `<input type="text" class="form-control" value="Tidak digunakan" disabled>`}
        </div>
        ${extraFields}
      </div>
    </div>`;
  };

  // ── Hero ─────────────────────────────────────────────────────────────────
  const hero = renderHero({
    kicker:     'Service Billing Control',
    kickerIcon: 'bi-sliders2-vertical',
    title:      'Setingan Layanan',
    desc:       'Atur status layanan, harga per hit, dan cooldown tanpa menyentuh konfigurasi teknis provider.',
    variant:    'emerald',
    badges: [
      { icon: 'bi-stars',       text: 'Premium Control' },
      { icon: 'bi-shield-check', text: 'Zero-Downtime' }
    ]
  });

  // ── Service grid ─────────────────────────────────────────────────────────
  const serviceGrid = [
    { title: 'Bank',        sub: 'Validasi rekening bank',                   statusName: 'bank_status',     defaultStatus: 'on',  costName: 'cost_bank',     cooldownName: 'cooldown_bank' },
    { title: 'E-Wallet',    sub: 'Validasi akun ewallet',                    statusName: 'ewallet_status',  defaultStatus: 'on',  costName: 'cost_ewallet',  cooldownName: 'cooldown_ewallet' },
    { title: 'WhatsApp',    sub: 'Cek status nomor WhatsApp',                statusName: 'whatsapp_status', defaultStatus: 'on',  costName: 'cost_whatsapp', cooldownName: 'cooldown_whatsapp' },
    { title: 'NIK',         sub: 'Validasi identitas NIK',                   statusName: 'nik_status',      defaultStatus: 'on',  costName: 'cost_nik',      cooldownName: 'cooldown_nik' },
    { title: 'Games',       sub: 'Validasi ID game',                         statusName: 'games_status',    defaultStatus: 'off', costName: 'cost_games',    cooldownName: null },
    { title: 'BPJS',        sub: 'Cek tagihan BPJS',                         statusName: 'bpjs_status',     defaultStatus: 'off', costName: 'cost_bpjs',     cooldownName: 'cooldown_bpjs' },
    { title: 'PLN',         sub: 'Cek tagihan PLN',                          statusName: 'pln_status',      defaultStatus: 'off', costName: 'cost_pln',      cooldownName: 'cooldown_pln' },
    { title: 'Foto Editor', sub: 'Foto editor URL/upload via provider (Neoxr)', statusName: 'ai_status',   defaultStatus: 'off', costName: 'cost_ai',       cooldownName: 'cooldown_ai', timeoutName: 'ai_timeout_ms', ttlHoursName: 'ai_file_ttl_hours' }
  ].map(serviceCard).join('');

  // ── Wrapped in renderCard ────────────────────────────────────────────────
  const formCard = renderCard({
    icon:  'bi-sliders',
    title: 'Konfigurasi Per Layanan',
    body: `
      <form id="services-form" action="/admin/save" method="POST"
        onsubmit="saveSettings(event)">
        <div class="service-setting-grid">
          ${serviceGrid}
        </div>
        <div class="d-flex flex-wrap gap-2 mt-4 settings-actionbar">
          <button type="submit" class="btn btn-primary">
            <i class="bi bi-floppy me-1"></i>Simpan Setingan Layanan
          </button>
          <button type="button" class="btn btn-outline-secondary"
            onclick="window.location.reload()">
            <i class="bi bi-arrow-counterclockwise me-1"></i>Refresh
          </button>
        </div>
      </form>`
  });

  return `<!-- ============================= SERVICES TAB ============================= -->
  <div id="main-services" class="main-tab-pane" style="display:none;">

    ${hero}

    <div class="mt-4">${formCard}</div>

  </div>`;
};
