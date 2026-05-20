/**
 * admin/sections/live.js
 * Live Monitoring — pakai renderHero + renderCard.
 *
 * Semua DOM ID dipertahankan persis untuk scripts.js:
 *   - #main-live
 *   - #live-counter, #live-stat-valid, #live-stat-failed, #live-updated
 *   - #live-filter-service, #live-filter-status, #live-filter-server
 *   - #live-filter-keyword, #live-interval
 *   - #live-pause-btn, #live-table-body
 *   - #live-detail-req, #live-detail-res
 *   - onclick: clearLiveTerminal, toggleLivePause, setLiveInterval, fetchLiveHits
 */
const { renderHero, renderCard } = require('../components');

module.exports = function renderLiveSection() {

  // ── Hero ─────────────────────────────────────────────────────────────────
  const hero = renderHero({
    kicker:     'Real-Time Command Center',
    kickerIcon: 'bi-broadcast-pin',
    title:      'Live Monitoring',
    desc:       'Pantau hit validasi secara real-time, filter cepat, dan audit request/response dari satu workspace yang lebih bersih.',
    variant:    'indigo',
    badges: [
      { icon: 'bi-lightning-charge-fill', text: 'Streaming Active' },
      { icon: 'bi-shield-check',          text: 'Safe Logs View' }
    ]
  });

  // ── KPI row ───────────────────────────────────────────────────────────────
  const kpiRow = `
  <div class="live-kpi-grid">
    <div class="live-kpi-card">
      <div class="live-kpi-label">Total Activity</div>
      <div id="live-counter" class="live-kpi-value">0 hits</div>
    </div>
    <div class="live-kpi-card">
      <div class="live-kpi-label">Valid</div>
      <div id="live-stat-valid" class="live-kpi-value ok">0</div>
    </div>
    <div class="live-kpi-card">
      <div class="live-kpi-label">Failed</div>
      <div id="live-stat-failed" class="live-kpi-value bad">0</div>
    </div>
    <div class="live-kpi-card">
      <div class="live-kpi-label">Last Update</div>
      <div id="live-updated" class="live-kpi-value sm">-</div>
    </div>
  </div>`;

  // ── Stream card ───────────────────────────────────────────────────────────
  const streamCard = renderCard({
    className: 'live-surface-card',
    icon:      'bi-activity',
    title:     'Live Activity Stream',
    toolbar: `
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-sm btn-outline-secondary" onclick="clearLiveTerminal()"
          title="Hapus semua baris">
          <i class="bi bi-trash3 me-1"></i>Clear
        </button>
        <button class="btn btn-sm btn-outline-secondary" id="live-pause-btn"
          onclick="toggleLivePause()" title="Pause/resume auto-refresh">
          <i class="bi bi-pause-fill me-1"></i>Pause
        </button>
      </div>`,
    body: `
      <!-- Filter bar -->
      <div class="live-filter-grid mb-3">
        <div>
          <label class="live-filter-label">Layanan</label>
          <select id="live-filter-service" class="form-select form-select-sm">
            <option value="">Semua Layanan</option>
            <option value="bank">Bank</option>
            <option value="ewallet">E-Wallet</option>
            <option value="nik">NIK</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="bpjs">BPJS</option>
            <option value="pln">PLN</option>
            <option value="ai">AI</option>
          </select>
        </div>
        <div>
          <label class="live-filter-label">Status</label>
          <select id="live-filter-status" class="form-select form-select-sm">
            <option value="">Semua Status</option>
            <option value="valid">Valid</option>
            <option value="fail">Fail</option>
          </select>
        </div>
        <div>
          <label class="live-filter-label">Server</label>
          <input id="live-filter-server" type="text"
            class="form-control form-control-sm" placeholder="server7a">
        </div>
        <div>
          <label class="live-filter-label">Pencarian</label>
          <input id="live-filter-keyword" type="text"
            class="form-control form-control-sm"
            placeholder="Cari user / nomor / account_name">
        </div>
        <div>
          <label class="live-filter-label">Interval</label>
          <select id="live-interval" class="form-select form-select-sm"
            onchange="setLiveInterval(this.value)">
            <option value="3000">3 detik</option>
            <option value="5000">5 detik</option>
            <option value="10000">10 detik</option>
          </select>
        </div>
        <div class="live-refresh-col">
          <button class="btn btn-sm btn-primary w-100" onclick="fetchLiveHits()">
            <i class="bi bi-arrow-repeat me-1"></i>Refresh
          </button>
        </div>
      </div>

      <!-- Activity table -->
      <div class="table-responsive live-table-wrap">
        <table class="table table-sm table-hover align-middle mb-0 live-table">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>User (ID)</th>
              <th>Layanan</th>
              <th>Server</th>
              <th>Kode</th>
              <th>Nomor</th>
              <th>Account Name</th>
              <th>Status</th>
              <th>RT</th>
              <th>Potong Saldo</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody id="live-table-body">
            <tr>
              <td colspan="11" class="text-center text-muted py-4">
                <span class="kr-skeleton-row">
                  <span class="spinner-border spinner-border-sm me-2"></span>
                  Menunggu data streaming...
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Request / Response split-view -->
      <div class="mt-3 row g-3">
        <div class="col-lg-6">
          <div class="live-detail-card">
            <div class="live-detail-head">
              <i class="bi bi-send"></i> Request
            </div>
            <pre id="live-detail-req" class="live-detail-pre">-</pre>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="live-detail-card">
            <div class="live-detail-head">
              <i class="bi bi-reply"></i> Response
            </div>
            <pre id="live-detail-res" class="live-detail-pre">-</pre>
          </div>
        </div>
      </div>`,
    footer: `
      <div class="d-flex justify-content-end align-items-center gap-3 live-foot-note">
        <span><span style="color:#16a34a;">&#9679;</span> valid activity</span>
        <span><span style="color:#dc2626;">&#9679;</span> failed activity</span>
      </div>`
  });

  return `<!-- ============================= LIVE TAB ============================= -->
  <div id="main-live" class="main-tab-pane live-premium-pane" style="display:none;">

    ${hero}

    ${kpiRow}

    <div class="mt-3">${streamCard}</div>

  </div>`;
};
