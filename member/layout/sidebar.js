const MENU_ITEMS = [
  { view: 'dashboard', label: 'Dashboard', desc: 'Ringkasan akun', href: '/member/dashboard' },
  { view: 'deposit', label: 'Topup & Deposit', desc: 'Metode, invoice, pending', href: '/member/deposit' },
  { view: 'apikey', label: 'API Key', desc: 'Salin, revoke, generate', href: '/member/apikey' },
  { view: 'security', label: 'Keamanan', desc: 'Status akun dan bantuan', href: '/member/security' }
];

function renderSidebar(currentView = 'dashboard') {
  const navHtml = MENU_ITEMS.map((item) => {
    const activeClass = item.view === currentView ? ' active' : '';
    return `
      <a class="member-nav${activeClass}" href="${item.href}">
        <span><i class="member-nav__dot"></i>${item.label}</span>
        <small>${item.desc}</small>
      </a>
    `;
  }).join('');

  return `
    <aside id="member-sidebar" class="member-sidebar">
      <div class="member-sidebar__brand">
        <div class="member-sidebar__logo">MP</div>
        <div>
          <div class="member-sidebar__title">Member Portal</div>
          <div class="member-sidebar__subtitle">API Checker</div>
        </div>
      </div>

      <div class="member-sidebar__profile">
        <div class="member-sidebar__avatar" id="sidebar-avatar">M</div>
        <div class="member-sidebar__profile-text">
          <strong id="sidebar-member-name">Memuat member...</strong>
          <span id="sidebar-member-wa">-</span>
        </div>
        <div class="member-sidebar__badges">
          <span class="badge" id="sidebar-member-mode">MODE</span>
          <span class="badge success" id="sidebar-member-balance">Balance 0</span>
        </div>
      </div>

      <div class="member-sidebar__heading">Navigasi Utama</div>
      <nav class="member-sidebar__nav">
        ${navHtml}
      </nav>

      <div class="member-sidebar__footer">
        <div class="member-sidebar__footer-box">
          <strong id="sidebar-footer-title">Siap dipakai</strong>
          <span id="sidebar-footer-copy">Dashboard akan menampilkan status akun dan aksi penting Anda.</span>
        </div>
        <button class="btn btn-secondary btn-block" type="button" onclick="logoutMember()">Logout</button>
      </div>
    </aside>
  `;
}

module.exports = { renderSidebar };
