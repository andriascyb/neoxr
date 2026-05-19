function renderDashboardHomeSection() {
  return `
    <section id="view-dashboard" class="member-view active view-stack">
      <div id="msg" class="notice"></div>

      <section class="card">
        <div class="card-body">
          <div class="section-title">
            <div>
              <h2>Aksi Cepat</h2>
              <p>Gunakan aksi utama tanpa perlu pindah halaman terlalu jauh.</p>
            </div>
          </div>
          <div id="quick-actions" class="quick-actions">
            <button class="btn btn-soft" type="button" disabled>Memuat aksi...</button>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-body">
          <div class="section-title">
            <div>
              <h2>Ringkasan Aktivitas</h2>
              <p>Gambaran singkat akun, topup pending, dan aktivitas terakhir.</p>
            </div>
          </div>
          <div id="dashboard-summary-pane" class="panel-list">
            <div class="empty-state">Memuat ringkasan dashboard...</div>
          </div>
        </div>
      </section>
    </section>
  `;
}

module.exports = { renderDashboardHomeSection };
