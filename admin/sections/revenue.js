module.exports = function renderRevenueSection() {
  return `
  <div id="main-revenue" class="main-tab-pane revenue-pane" style="display:none;">
    <div class="revenue-hero">
      <div class="revenue-hero-content">
        <span class="revenue-kicker"><i class="bi bi-bar-chart-line-fill"></i> Finance Monitor</span>
        <h2>Analisa Pendapatan</h2>
        <p>Ringkasan topup, pemasukan, dan histori transaksi member dengan tampilan operasional yang lebih fokus.</p>
      </div>
      <button class="btn btn-sm revenue-refresh-btn" onclick="loadRevenueAnalytics()"><i class="bi bi-arrow-repeat me-1"></i>Refresh Data</button>
    </div>

    <div class="row g-3 mb-3">
      <div class="col-12 col-md-6 col-xl-3">
        <div class="card revenue-stat-card revenue-glow success">
          <div class="card-body">
            <div class="revenue-stat-label">Topup Sukses</div>
            <div id="rv-topup-success" class="revenue-stat-value">0</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-6 col-xl-3">
        <div class="card revenue-stat-card revenue-glow pending">
          <div class="card-body">
            <div class="revenue-stat-label">Topup Pending</div>
            <div id="rv-topup-pending" class="revenue-stat-value">0</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-6 col-xl-3">
        <div class="card revenue-stat-card revenue-glow package">
          <div class="card-body">
            <div class="revenue-stat-label">Invoice Package Paid</div>
            <div id="rv-package-paid" class="revenue-stat-value">0</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-6 col-xl-3">
        <div class="card revenue-stat-card revenue-glow debit">
          <div class="card-body">
            <div class="revenue-stat-label">Total Debit Wallet</div>
            <div id="rv-wallet-debit" class="revenue-stat-value">0</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-3 revenue-table-card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <div>
          <span class="fw-600" style="font-weight:600;">Riwayat Topup Member</span>
          <div class="text-muted" style="font-size:12px;">Gunakan data ini untuk validasi status pembayaran dan audit invoice member.</div>
        </div>
        <button class="btn btn-sm btn-outline-info" onclick="loadRevenueAnalytics()"><i class="bi bi-arrow-repeat me-1"></i>Refresh</button>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0 revenue-premium-table">
            <thead>
              <tr>
                <th class="ps-3">Invoice</th>
                <th>Member</th>
                <th>Metode</th>
                <th>Total</th>
                <th>Status</th>
                <th>Expired</th>
                <th>Dibuat</th>
              </tr>
            </thead>
            <tbody id="revenue-topups-body">
              <tr><td colspan="7" class="text-center text-muted">Loading...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  `;
};
