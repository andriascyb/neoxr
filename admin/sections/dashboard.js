module.exports = function renderDashboardSection(ctx = {}) {
  with (ctx) {
    return `<!-- ============================= DASHBOARD TAB ============================= -->
  <div id="main-dashboard" class="main-tab-pane dashboard-premium-pane">
    <div class="dash-hero">
      <div class="dash-hero-orb orb-a"></div>
      <div class="dash-hero-orb orb-b"></div>
      <div class="dash-hero-content">
        <span class="dash-hero-kicker"><i class="bi bi-activity"></i> Monitoring Real-Time</span>
        <h2>Dashboard Operasional</h2>
        <p>Pantau trafik validasi, kualitas hasil, dan konsumsi saldo member secara cepat dari satu panel.</p>
      </div>
      <div class="dash-hero-metrics">
        <div class="dash-hero-metric">
          <span>Total Trafik Hari Ini</span>
          <strong id="hero-today-total">${todayTotal.toLocaleString()}</strong>
        </div>
        <div class="dash-hero-metric">
          <span>Valid Rate (Today)</span>
          <strong id="hero-valid-rate">0%</strong>
        </div>
        <div class="dash-hero-metric">
          <span>Sistem Uptime</span>
          <strong>99.9%</strong>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-12 col-md-6">
        <div class="card dash-consume-card h-100">
          <div class="card-body">
            <div class="dash-consume-label"><i class="bi bi-cash-stack"></i> Konsumsi Saldo Hari Ini</div>
            <div class="dash-consume-value" id="dash-consume-today">Rp 0</div>
            <div class="dash-consume-note">Akumulasi potong saldo validasi dalam 1 hari berjalan.</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-6">
        <div class="card dash-consume-card dash-consume-card-alt h-100">
          <div class="card-body">
            <div class="dash-consume-label"><i class="bi bi-wallet2"></i> Konsumsi Saldo All-Day</div>
            <div class="dash-consume-value" id="dash-consume-all">Rp 0</div>
            <div class="dash-consume-note">Total historis potong saldo dari seluruh transaksi debit.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-12">
        <div class="card dash-chart-card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span><i class="bi bi-graph-up-arrow me-2"></i>Trafik 7 Hari Terakhir</span>
            <button class="btn btn-sm btn-primary-soft p-1 px-2" onclick="loadTrafficChart()"><i class="bi bi-arrow-repeat"></i></button>
          </div>
          <div class="card-body">
            <div style="height: 300px; width: 100%;">
              <canvas id="trafficChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section-title"><i class="bi bi-shield-check me-1"></i> Provider Runtime</div>
    <div class="row g-3 mb-4">
      <div class="col-12 col-xl-6">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span><i class="bi bi-bank2 me-2"></i>Bank Providers</span>
            <div class="d-flex align-items-center gap-2">
              <button type="button" class="btn btn-sm btn-outline-warning py-0 px-2" onclick="resetProviderMetrics()" title="Reset runtime metrics">
                <i class="bi bi-arrow-counterclockwise"></i>
              </button>
              <span class="badge badge-blue" id="provider-bank-updated">Loading...</span>
            </div>
          </div>
          <div class="card-body">
            <div id="provider-bank-summary" class="provider-runtime-summary">
              <div class="provider-runtime-empty">Memuat metrik provider bank...</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 col-xl-6">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span><i class="bi bi-wallet2 me-2"></i>E-Wallet Providers</span>
            <span class="badge badge-blue" id="provider-ewallet-updated">Loading...</span>
          </div>
          <div class="card-body">
            <div id="provider-ewallet-summary" class="provider-runtime-summary">
              <div class="provider-runtime-empty">Memuat metrik provider e-wallet...</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section-title">Statistik Penggunaan</div>

    <div class="row g-3 mb-4">
      ${[
        { key: 'bank', title: 'Bank', sub: 'Validasi rekening bank', icon: 'bi-bank2', iconBg: 'rgba(88,166,255,.12)', iconColor: '#58a6ff' },
        { key: 'ewallet', title: 'E-Wallet', sub: 'Validasi dompet digital', icon: 'bi-wallet2', iconBg: 'rgba(37,99,235,.12)', iconColor: '#2563eb' },
        { key: 'whatsapp', title: 'WhatsApp', sub: 'Pengecekan nomor WA', icon: 'bi-whatsapp', iconBg: 'rgba(63,185,80,.12)', iconColor: '#3fb950' },
        { key: 'nik', title: 'NIK / KTP', sub: 'Validasi nomor KTP', icon: 'bi-person-vcard-fill', iconBg: 'rgba(227,179,65,.12)', iconColor: '#e3b341' },
        { key: 'games', title: 'Games', sub: 'Validasi user ID game', icon: 'bi-controller', iconBg: 'rgba(168,85,247,.14)', iconColor: '#a855f7' },
        { key: 'bpjs', title: 'BPJS', sub: 'Cek tagihan BPJS', icon: 'bi-hospital', iconBg: 'rgba(20,184,166,.14)', iconColor: '#14b8a6' },
        { key: 'pln', title: 'PLN', sub: 'Cek tagihan listrik', icon: 'bi-lightning-charge-fill', iconBg: 'rgba(245,158,11,.14)', iconColor: '#f59e0b' },
        { key: 'ai', title: 'AI', sub: 'AI text / image request', icon: 'bi-stars', iconBg: 'rgba(244,63,94,.14)', iconColor: '#f43f5e' }
      ].map(function(svc){
        const st = appStats[svc.key] || { today: { valid: 0, failed: 0, total: 0 }, all: { valid: 0, failed: 0, total: 0 } };
        return `
      <div class="col-12 col-lg-6">
        <div class="card stat-card h-100" onclick="openRealtimeApiLogs('${svc.key}')" style="cursor:pointer;">
          <div class="card-header d-flex align-items-center gap-3">
            <div class="stat-icon" style="background:${svc.iconBg};color:${svc.iconColor};"><i class="bi ${svc.icon}"></i></div>
            <div>
              <div class="fw-700" style="font-size:15px;font-weight:700;">${svc.title}</div>
              <div class="stat-sub mb-0">${svc.sub}</div>
            </div>
          </div>
          <div class="card-body">
            <div class="stat-sub">Hari Ini (Real-time)</div>
            <div class="row g-2 mb-2">
              <div class="col-4 text-center"><div class="stat-sub">Valid</div><div class="stat-num" style="color:#3fb950;font-size:22px;" id="${svc.key}-today-valid">${st.today.valid}</div></div>
              <div class="col-4 text-center"><div class="stat-sub">Gagal</div><div class="stat-num" style="color:#f85149;font-size:22px;" id="${svc.key}-today-failed">${st.today.failed}</div></div>
              <div class="col-4 text-center"><div class="stat-sub">Total</div><div class="stat-num" style="font-size:22px;" id="${svc.key}-today-total">${st.today.total}</div></div>
            </div>
            <div class="progress mb-3">
              <div class="progress-bar progress-bar-valid" id="${svc.key}-bar-v" style="width:0%"></div>
              <div class="progress-bar progress-bar-failed" id="${svc.key}-bar-f" style="width:0%"></div>
            </div>
            <div class="stat-sub">All-Time</div>
            <div class="row g-2">
              <div class="col-6 text-center"><div class="stat-sub">Valid</div><div style="font-size:16px;font-weight:700;" id="${svc.key}-all-valid">${Number(st.all.valid || 0).toLocaleString()}</div></div>
              <div class="col-6 text-center"><div class="stat-sub">Total</div><div style="font-size:16px;font-weight:700;" id="${svc.key}-all-total">${Number(st.all.total || 0).toLocaleString()}</div></div>
            </div>
          </div>
        </div>
      </div>`;
      }).join('')}
    </div>

    <div id="wa-internal-sec">
      <div class="section-title"><i class="bi bi-whatsapp text-success me-1"></i> WhatsApp Provider</div>
      <div class="card">
        <div class="card-header d-flex align-items-center justify-content-between">
          <span class="fw-600" style="font-weight:600;">Status Provider WhatsApp</span>
          <span id="wa-conn-status-badge" class="wa-status-badge wa-status-disconnected">External Not Configured</span>
        </div>
        <div class="card-body">
          <div class="p-3 rounded mb-3" style="background:rgba(56,139,253,.08); border:1px solid rgba(56,139,253,.25);">
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div>
                <div style="font-weight:600;">Validasi WA: Eksternal | OTP/Notif: Bisa Internal Baileys</div>
                <div class="text-secondary" style="font-size:12px;">Kontrol Baileys dan QR login dipindahkan ke menu <strong>Pengaturan WA</strong>.</div>
              </div>
              <span id="wa-provider-info" class="badge badge-blue">Mengecek...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  `;
  }
};
