const { ADMIN_MENU_GROUPS, findAdminMenuItem } = require('../layout/menu');

function renderNavItem(item, ADMIN_KEY, activePage) {
  const isActive = item.id === activePage;
  const hint = item.hint
    ? `<small class="nav-hint">${item.hint}</small>`
    : '';
  return `
    <li class="nav-item">
      <a class="nav-link${isActive ? ' active' : ''}"
         href="/admin/${item.id}?key=${ADMIN_KEY}"
         onclick="switchMainTab('${item.id}', '${(item.title || item.label || '').replace(/'/g, "\\'")}'); return false;"
         id="nav-${item.id}">
        <i class="nav-icon bi ${item.icon || 'bi-circle'}"></i>
        <p>
          <span class="nav-label">${item.label}</span>
          ${hint}
        </p>
      </a>
    </li>`;
}

function renderNavGroups(ADMIN_KEY, activePage) {
  return ADMIN_MENU_GROUPS.map((group) => {
    const items = (group.items || []).map((item) => renderNavItem(item, ADMIN_KEY, activePage)).join('');
    return `
    <li class="nav-header">${(group.title || '').toUpperCase()}</li>
    ${items}`;
  }).join('');
}

module.exports = function renderBodyShell(ctx = {}) {
  const ADMIN_KEY = ctx.ADMIN_KEY || '';
  const appStats = ctx.appStats || { date: '' };
  const req = ctx.req || {};
  const activePage = (() => {
    try {
      const pathValue = String((req && (req.path || (req.originalUrl || '').split('?')[0])) || '').toLowerCase();
      const m = pathValue.match(/^\/admin\/([a-z0-9-]+)$/);
      if (m && m[1]) {
        return m[1] === 'packages' ? 'services' : m[1];
      }
    } catch (e) { }
    return 'dashboard';
  })();
  const activeItem = findAdminMenuItem(activePage) || findAdminMenuItem('dashboard');
  const topbarTitle = activeItem ? activeItem.title : 'Dashboard';
  const topbarIcon = activeItem ? activeItem.icon : 'bi-grid-1x2-fill';

  return `
</head>
<body class="hold-transition sidebar-mini layout-fixed layout-navbar-fixed">
<div class="wrapper">

<!-- Sidebar Overlay (mobile) -->
<div class="sidebar-overlay" id="sb-overlay" onclick="toggleSidebar()"></div>

<!-- Navbar -->
<nav class="main-header navbar navbar-expand kr-topbar">
  <ul class="navbar-nav">
    <li class="nav-item d-md-none">
      <a class="nav-link kr-topbar__menu" href="#" onclick="toggleSidebar(); return false;" aria-label="Buka menu">
        <i class="bi bi-list"></i>
      </a>
    </li>
    <li class="nav-item d-none d-md-flex align-items-center">
      <div class="kr-topbar__breadcrumb">
        <span class="kr-topbar__breadcrumb-root">Admin</span>
        <i class="bi bi-chevron-right kr-topbar__breadcrumb-sep"></i>
        <span class="kr-topbar__breadcrumb-current">${activeItem ? activeItem.label : 'Dashboard'}</span>
      </div>
    </li>
  </ul>
  <ul class="navbar-nav ms-auto kr-topbar__right">
    <li class="nav-item kr-topbar__pill">
      <span id="mysql-status-badge" class="kr-status-pill kr-status-pill--muted" title="Status koneksi MySQL">
        <span class="kr-status-pill__dot"></span>
        <span>MySQL</span>
      </span>
    </li>
    <li class="nav-item kr-topbar__pill">
      <span class="kr-status-pill kr-status-pill--success" title="Streaming aktif">
        <span class="kr-status-pill__dot kr-status-pill__dot--pulse"></span>
        <span>Live</span>
      </span>
    </li>
    <li class="nav-item kr-topbar__pill">
      <span class="kr-topbar__date">${appStats.date || ''}</span>
    </li>
    <li class="nav-item ms-1">
      <form method="post" action="/admin/logout" class="d-inline m-0 p-0">
        <button type="submit" class="btn kr-topbar__logout">
          <i class="bi bi-box-arrow-right"></i><span class="d-none d-sm-inline ms-1">Logout</span>
        </button>
      </form>
    </li>
  </ul>
</nav>

<!-- Sidebar -->
<aside id="sidebar" class="main-sidebar sidebar-dark-primary elevation-4 kr-sidebar">
  <a href="/admin/dashboard?key=${ADMIN_KEY}" class="brand-link kr-sidebar__brand text-decoration-none">
    <span class="brand-image kr-sidebar__logo">v3</span>
    <span class="brand-text kr-sidebar__brand-text">
      <strong>API Checker</strong>
      <small>Admin Panel</small>
    </span>
  </a>
  <div class="sidebar kr-sidebar__inner">
    <nav class="mt-2">
      <ul class="sidebar-nav nav nav-pills nav-sidebar flex-column kr-sidebar__nav" data-widget="treeview" role="menu" data-accordion="false">
        ${renderNavGroups(ADMIN_KEY, activePage)}
      </ul>
    </nav>
    <div class="sidebar-footer kr-sidebar__footer">
      <button type="button" onclick="syncDB()" class="btn kr-sidebar__sync w-100">
        <i class="bi bi-arrow-repeat"></i><span>Sync Database</span>
      </button>
      <div class="live-pill kr-sidebar__live">
        <span class="live-dot"></span>
        <span>Live Sync <span id="js-sync-status">aktif</span></span>
      </div>
      <div class="log-console kr-sidebar__console" id="browser-logs">Console siap...</div>
    </div>
  </div>
</aside>

<!-- Main Content -->
<div id="main-content" class="content-wrapper kr-main">
  <section class="content-header pb-0 kr-pageheader">
    <div class="container-fluid">
      <div class="kr-pageheader__row">
        <h1 class="m-0 topbar-title kr-pageheader__title" id="topbar-title">
          <span class="kr-pageheader__icon"><i class="bi ${topbarIcon}"></i></span>
          <span class="kr-pageheader__text">${topbarTitle}</span>
          <span class="badge badge-blue kr-pageheader__date">${appStats.date || ''}</span>
        </h1>
      </div>
    </div>
  </section>
  <section class="content page-body">
    <div class="container-fluid">

  `;
};
