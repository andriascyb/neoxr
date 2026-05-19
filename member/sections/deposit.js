function renderDepositSection() {
  return `
    <section id="view-deposit" class="member-view view-stack">
      <section class="card">
        <div class="card-body">
          <div class="section-title">
            <div>
              <h2>Buat Deposit Baru</h2>
              <p>Pilih nominal dan metode pembayaran H2H yang aktif.</p>
            </div>
          </div>
          <div class="form-grid">
            <div class="field-row">
              <div class="field">
                <label for="topup-amount">Nominal topup</label>
                <input id="topup-amount" class="input" type="number" min="10000" placeholder="Minimal 10000">
              </div>
              <div class="field">
                <label for="topup-method">Metode pembayaran</label>
                <select id="topup-method" class="input method-select"></select>
              </div>
            </div>
            <div class="button-row">
              <button id="topup-submit" class="btn btn-primary" type="button" onclick="createTopup()">Buat Deposit</button>
              <button class="btn btn-secondary" type="button" onclick="reloadDashboard()">Refresh Data</button>
            </div>
            <div id="topup-lock-note" class="footer-hint"></div>
            <div id="topup-result" class="panel-list">
              <div class="empty-state">Belum ada deposit baru pada sesi ini.</div>
            </div>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-body">
          <div class="section-title">
            <div>
              <h2>Metode Pembayaran Aktif</h2>
              <p>Metode diambil dari H2H lalu disaring sesuai pengaturan admin.</p>
            </div>
          </div>
          <div id="deposit-methods-pane" class="panel-list">
            <div class="empty-state">Memuat metode pembayaran...</div>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-body">
          <div class="section-title">
            <div>
              <h2>Riwayat Deposit</h2>
              <p>Status pending, sukses, dan invoice terakhir Anda.</p>
            </div>
          </div>
          <div id="deposit-history-pane" class="panel-list">
            <div class="empty-state">Memuat riwayat deposit...</div>
          </div>
        </div>
      </section>
    </section>
  `;
}

module.exports = { renderDepositSection };
