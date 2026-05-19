function renderApiKeySection() {
  return `
    <section id="view-apikey" class="member-view view-stack">
      <section class="card">
        <div class="card-body">
          <div class="section-title">
            <div>
              <h2>API Key Center</h2>
              <p>Salin, revoke, dan generate ulang API key utama Anda.</p>
            </div>
          </div>
          <div id="apikey-panel" class="panel-list">
            <div class="empty-state">Memuat API key...</div>
          </div>
        </div>
      </section>
    </section>
  `;
}

module.exports = { renderApiKeySection };
