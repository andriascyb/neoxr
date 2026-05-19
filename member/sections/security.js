function renderSecuritySection() {
  return `
    <section id="view-security" class="member-view view-stack">
      <section class="card">
        <div class="card-body">
          <div class="section-title">
            <div>
              <h2>Keamanan Akun</h2>
              <p>Status akun, aturan PIN, dan kontrol keamanan API key.</p>
            </div>
          </div>
          <div id="security-pane" class="security-grid">
            <div class="empty-state">Memuat data keamanan akun...</div>
          </div>
        </div>
      </section>
    </section>
  `;
}

module.exports = { renderSecuritySection };
