/**
 * admin/sections/dashboard.js
 * Dashboard Operasional — pakai renderHero + renderCard dari admin/components/.
 * Semua ID DOM dipertahankan persis agar scripts.js tidak break.
 */
const { renderHero, renderCard } = require('../components');

module.exports = function renderDashboardSection(ctx = {}) {
  // eslint-disable-next-line no-unused-vars
  with (ctx) {

    // ── Stat cards: semua ID dipertahankan ──────────────────────────────────
    const SERVICES = [
      { key: 'bank',     title: 'Bank',       sub: 'Validasi rekening bank',      icon: 'bi-bank2',              iconBg: 'rgba(37,99,235,.10)',   iconColor: '#2563eb' },
      { key: 'ewallet',  title: 'E-Wallet',   sub: 'Validasi dompet digital',     icon: 'bi-wallet2',            iconBg: 'rgba(8,145,178,.10)',   iconColor: '#0891b2' },
      { key: 'whatsapp', title: 'WhatsApp',   sub: 'Pengecekan nomor WA',         icon: 'bi-whatsapp',           iconBg: 'rgba(22,163,74,.10)',   iconColor: '#16a34a' },
      { key: 'nik',      title: 'NIK / KTP',  sub: 'Validasi nomor KTP',          icon: 'bi-person-vcard-fill',  iconBg: 'rgba(217,119,6,.10)',   iconColor: '#d97706' },
      { key: 'games',    title: 'Games',      sub: 'Validasi user ID game',       icon: 'bi-controller',         iconBg: 'rgba(124,58,237,.10)',  iconColor: '#7c3aed' },
      { key: 'bpjs',     title: 'BPJS',       sub: 'Cek tagihan BPJS',            icon: 'bi-hospital',           iconBg: 'rgba(20,184,166,.10)',  iconColor: '#0d9488' },
      { key: 'pln',      title: 'PLN',        sub: 'Cek tagihan listrik',         icon: 'bi-lightning-charge-fill', iconBg: 'rgba(245,158,11,.10)', iconColor: '#f59e0b' },
      { key: 'ai',       title: 'AI',         sub: 'AI text / image request',     icon: 'bi-stars',              iconBg: 'rgba(244,63,94,.10)',   iconColor: '#f43f5e' }
    ];

    const statCards = SERVICES.map(function(svc) {
      const st = (appStats && appStats[svc.key]) || { today: { valid: 0, failed: 0, total: 0 }, all: { valid: 0, failed: 0, total: 0 } };
      const todayValid   = Number(st.today && st.today.valid   || 0);
      const todayFailed  = Number(st.today && st.today.failed  || 0);
      const todayTotal2  = Number(st.today && st.today.total   || 0);
      const allValid     = Number(st.all   && st.all.valid     || 0);
      const allTotal     = Number(st.all   && st.all.total     || 0);

      const cardHeader = `
        <div class="kr-stat-header" style="display:flex;align-items:center;gap:12px;">
          <div class="stat-icon" style="background:${svc.iconBg};color:${svc.iconColor};flex-shrink:0;">
            <i class="bi ${svc.icon}"></i>
          </div>
          <div>
            <div style="font-size:14px;font-weight:700;color:var(--kr-text);">${svc.title}</div>
            <div class="stat-sub mb-0">${svc.sub}</div>
          </div>
        </div>`;

      const cardBody = `
        <div class="stat-sub mt-2 mb-1">Hari Ini (Real-time)</div>
        <div class="row g-2 mb-2">
          <div class="col-4 text-center">
            <div class="stat-sub">Valid</div>
            <div class="stat-num" style="color:#16a34a;font-size:22px;" id="${svc.key}-today-valid">${todayValid}</div>
          </div>
          <div class="col-4 text-center">
            <div class="stat-sub">Gagal</div>
            <div class="stat-num" style="color:#dc2626;font-size:22px;" id="${svc.key}-today-failed">${todayFailed}</div>
          </div>
          <div class="col-4 text-center">
            <div class="stat-sub">Total</div>
            <div class="stat-num" style="font-size:22px;" id="${svc.key}-today-total">${todayTotal2}</div>
          </div>
        </div>
        <div class="progress mb-3">
          <div class="progress-bar progress-bar-valid"  id="${svc.key}-bar-v" style="width:0%"></div>
          <div class="progress-bar progress-bar-failed" id="${svc.key}-bar-f" style="width:0%"></div>
        </div>
        <div class="stat-sub mb-1">All-Time</div>
        <div class="row g-2">
          <div class="col-6 text-center">
            <div class="stat-sub">Valid</div>
            <div style="font-size:16px;font-weight:700;" id="${svc.key}-all-valid">${Number(allValid).toLocaleString()}</div>
          </div>
          <div class="col-6 text-center">
            <div class="stat-sub">Total</div>
            <div style="font-size:16px;font-weight:700;" id="${svc.key}-all-total">${Number(allTotal).toLocaleString()}</div>
          </div>
        </div>`;

      return `
      <div class="col-12 col-lg-6">
        <div class="card kr-card stat-card h-100" onclick="openRealtimeApiLogs('${svc.key}')" style="cursor:pointer;">
          <div class="card-header kr-card__header">${cardHeader}</div>
          <div class="card-body kr-card__body">${cardBody}</div>
        </div>
      </div>`;
    }).join('');

    // ── Hero: KPI metrics (ID dipertahankan) ────────────────────────────────
    const heroMetrics = `
      <div class="kr-dash-metrics">
        <div class="kr-dash-metric">
          <span>Trafik Hari Ini</span>
          <strong id="hero-today-total">${(todayTotal || 0).toLocaleString()}</strong>
        </div>
        <div class="kr-dash-metric">
          <span>Valid Rate</span>
          <strong id="hero-valid-rate">0%</strong>
        </div>
        <div class="kr-dash-metric">
          <span>Uptime</span>
          <strong>99.9%</strong>
        </div>
      </div>`;

    const hero = renderHero({
      kicker:      'Monitoring Real-Time',
      kickerIcon:  'bi-activity',
      title:       'Dashboard Operasional',
      desc:        'Pantau trafik validasi, kualitas hasil, dan konsumsi saldo member secara cepat dari satu panel.',
      variant:     'brand',
      actions:     heroMetrics
    });

    // ── Consumption Cards ────────────────────────────────────────────────────
    const consumeCards = `
    <div class="row g-3 mb-4">
      <div class="col-12 col-md-6">
        <div class="card kr-card dash-consume-card h-100">
          <div class="card-body kr-card__body">
            <div class="dash-consume-label"><i class="bi bi-cash-stack me-1"></i> Konsumsi Saldo Hari Ini</div>
            <div class="dash-consume-value" id="dash-consume-today">Rp 0</div>
            <div class="dash-consume-note">Akumulasi potong saldo validasi dalam 1 hari berjalan.</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-6">
        <div class="card kr-card dash-consume-card dash-consume-card-alt h-100">
          <div class="card-body kr-card__body">
            <div class="dash-consume-label"><i class="bi bi-wallet2 me-1"></i> Konsumsi Saldo All-Day</div>
            <div class="dash-consume-value" id="dash-consume-all">Rp 0</div>
            <div class="dash-consume-note">Total historis potong saldo dari seluruh transaksi debit.</div>
          </div>
        </div>
      </div>
    </div>`;

    // ── Traffic Chart Card ───────────────────────────────────────────────────
    const chartCard = renderCard({
      icon:    'bi-graph-up-arrow',
      title:   'Trafik 7 Hari Terakhir',
      toolbar: `<button class="btn btn-sm btn-outline-secondary" onclick="loadTrafficChart()" title="Refresh chart"><i class="bi bi-arrow-repeat"></i></button>`,
      body:    `<div style="height:300px;width:100%;"><canvas id="trafficChart"></canvas></div>`
    });

    // ── Provider Runtime Cards ───────────────────────────────────────────────
    const bankCard = renderCard({
      icon:    'bi-bank2',
      title:   'Bank Providers',
      toolbar: `
        <div class="d-flex align-items-center gap-2">
          <button type="button" class="btn btn-sm btn-outline-warning py-0 px-2"
            onclick="resetProviderMetrics()" title="Reset runtime metrics">
            <i class="bi bi-arrow-counterclockwise"></i>
          </button>
          <span class="badge badge-blue" id="provider-bank-updated">Loading...</span>
        </div>`,
      body: `<div id="provider-bank-summary" class="provider-runtime-summary">
               <div class="provider-runtime-empty">Memuat metrik provider bank...</div>
             </div>`
    });

    const ewalletCard = renderCard({
      icon:    'bi-wallet2',
      title:   'E-Wallet Providers',
      toolbar: `<span class="badge badge-blue" id="provider-ewallet-updated">Loading...</span>`,
      body:    `<div id="provider-ewallet-summary" class="provider-runtime-summary">
                  <div class="provider-runtime-empty">Memuat metrik provider e-wallet...</div>
                </div>`
    });

    // ── WA Provider Card ─────────────────────────────────────────────────────
    const waCard = renderCard({
      icon:    'bi-whatsapp',
      title:   'Status Provider WhatsApp',
      toolbar: `<span id="wa-conn-status-badge" class="wa-status-badge wa-status-disconnected">External Not Configured</span>`,
      body: `
        <div class="p-3 rounded mb-0 kr-info-box">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <div style="font-weight:600;font-size:13px;">Validasi WA: Eksternal | OTP/Notif: Bisa Internal Baileys</div>
              <div class="text-secondary" style="font-size:12px;">Kontrol Baileys dan QR login dipindahkan ke menu <strong>Pengaturan WA</strong>.</div>
            </div>
            <span id="wa-provider-info" class="badge badge-blue">Mengecek...</span>
          </div>
        </div>`
    });

    return `<!-- ============================= DASHBOARD TAB ============================= -->
  <div id="main-dashboard" class="main-tab-pane dashboard-premium-pane">

    ${hero}

    ${consumeCards}

    <div class="row g-3 mb-4">
      <div class="col-12">${chartCard}</div>
    </div>

    <div class="section-title"><i class="bi bi-shield-check me-1"></i> Provider Runtime</div>
    <div class="row g-3 mb-4">
      <div class="col-12 col-xl-6">${bankCard}</div>
      <div class="col-12 col-xl-6">${ewalletCard}</div>
    </div>

    <div class="section-title">Statistik Penggunaan</div>
    <div class="row g-3 mb-4">${statCards}</div>

    <div id="wa-internal-sec">
      <div class="section-title"><i class="bi bi-whatsapp text-success me-1"></i> WhatsApp Provider</div>
      ${waCard}
    </div>

  </div>`;
  }
};
