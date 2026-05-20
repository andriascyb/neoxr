/**
 * admin/sections/revenue.js
 * Analisa Pendapatan — PageHeader Claude-like menggantikan revenue-hero.
 * Semua DOM ID dipertahankan: rv-topup-success/pending, rv-package-paid,
 * rv-wallet-debit, revenue-topups-body, dll.
 */
const { renderPageHeader } = require('../components');

module.exports = function renderRevenueSection() {
  const pageHeader = renderPageHeader({
    icon:     'bi-bar-chart-line-fill',
    title:    'Analisa Pendapatan',
    subtitle: 'Ringkasan topup, pemasukan, dan histori transaksi member.',
    actions:  `<button class="btn btn-sm btn-outline-secondary" onclick="loadRevenueAnalytics()">
                 <i class="bi bi-arrow-repeat me-1"></i>Refresh Data
               </button>`
  });

  return `
  <div id="main-revenue" class="main-tab-pane revenue-pane" style="display:none;">

    ${pageHeader}

    <div class="row g-3 mb-3 mt-3">
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
          <span style="font-weight:600;">Riwayat Topup Member</span>
          <div class="text-muted" style="font-size:12px;">Validasi status pembayaran dan audit invoice member.</div>
        </div>
        <button class="btn btn-sm btn-outline-secondary" onclick="loadRevenueAnalytics()">
          <i class="bi bi-arrow-repeat me-1"></i>Refresh
        </button>
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
              <tr>
                <td colspan="7" class="text-center py-4">
                  <span class="kr-skeleton-row">
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Memuat data pendapatan...
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  `;
};
