function renderTopbar() {
  return `
    <header class="member-topbar">
      <div class="member-topbar__left">
        <button class="member-topbar__menu" type="button" onclick="toggleMemberSidebar()">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div>
          <div class="eyebrow">Member Dashboard</div>
          <h1 id="member-view-title" class="member-topbar__title">Dashboard</h1>
          <p id="member-view-subtitle" class="member-topbar__subtitle">Ringkasan akun saldo, topup, dan aktivitas terbaru.</p>
        </div>
      </div>
      <div id="topbar-actions" class="button-row">
        <button class="btn btn-secondary" type="button" onclick="reloadDashboard()">Muat Ulang</button>
      </div>
    </header>
  `;
}

module.exports = { renderTopbar };
