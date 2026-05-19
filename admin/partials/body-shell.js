module.exports = function renderBodyShell(ctx = {}) {
  with (ctx) {
    return `
</head>
<body class="hold-transition sidebar-mini layout-fixed layout-navbar-fixed">
<div class="wrapper">

<!-- Sidebar Overlay (mobile) -->
<div class="sidebar-overlay" id="sb-overlay" onclick="toggleSidebar()"></div>

<!-- Navbar -->
<nav class="main-header navbar navbar-expand navbar-dark" style="background:#343a40;">
  <ul class="navbar-nav">
    <li class="nav-item d-md-none">
      <a class="nav-link" href="#" onclick="toggleSidebar(); return false;"><i class="bi bi-list fs-5"></i></a>
    </li>
  </ul>
  <ul class="navbar-nav ms-auto">
    <li class="nav-item me-2">
      <span id="mysql-status-badge" class="badge badge-red" style="font-size:11px;">
        <i class="bi bi-circle-fill me-1" style="font-size:7px;"></i>MySQL: ...
      </span>
    </li>
    <li class="nav-item">
      <span class="badge badge-green" style="font-size:11px;">
        <i class="bi bi-circle-fill me-1" style="font-size:7px;animation:pulse 1.5s infinite;"></i>Live
      </span>
    </li>
    <li class="nav-item ms-2">
      <form method="post" action="/admin/logout" class="d-inline m-0 p-0">
        <button type="submit" class="btn btn-danger-soft btn-sm" style="font-size:11px;">
          <i class="bi bi-box-arrow-right me-1"></i>Logout
        </button>
      </form>
    </li>
  </ul>
</nav>

<!-- Sidebar -->
<aside id="sidebar" class="main-sidebar sidebar-dark-primary elevation-4">
  <a href="#" class="brand-link text-decoration-none">
    <span class="brand-image img-circle elevation-2 d-flex align-items-center justify-content-center" style="width:33px;height:33px;background:linear-gradient(135deg,#58a6ff,#bc8cff);opacity:1;">V3</span>
    <span class="brand-text font-weight-light">API Checker v3.1</span>
  </a>
  <div class="sidebar">
  <nav class="mt-2">
  <ul class="sidebar-nav nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
    <li class="nav-header">MONITORING</li>
    <li class="nav-item">
      <a class="nav-link active" href="/admin/dashboard?key=${ADMIN_KEY}" onclick="switchMainTab('dashboard','Monitoring Dashboard'); return false;" id="nav-dashboard">
        <i class="nav-icon bi bi-grid-1x2-fill"></i><p>Dashboard</p>
      </a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="/admin/live?key=${ADMIN_KEY}" onclick="switchMainTab('live','Live Monitoring'); return false;" id="nav-live">
        <i class="nav-icon bi bi-terminal-fill"></i><p>Live Monitor</p>
      </a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="/admin/users?key=${ADMIN_KEY}" onclick="switchMainTab('users','User Management (API)'); return false;" id="nav-users">
        <i class="nav-icon bi bi-people-fill"></i><p>User Management</p>
      </a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="/admin/members?key=${ADMIN_KEY}" onclick="switchMainTab('members','Member Management (Portal)'); return false;" id="nav-members">
        <i class="nav-icon bi bi-person-badge-fill"></i><p>Member Management</p>
      </a>
    </li>
    <li class="nav-header">SISTEM</li>
    <li class="nav-item">
      <a class="nav-link" href="/admin/settings?key=${ADMIN_KEY}" onclick="switchMainTab('settings','Konfigurasi Sistem'); return false;" id="nav-settings">
        <i class="nav-icon bi bi-gear-fill"></i><p>Pengaturan</p>
      </a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="/admin/tester?key=${ADMIN_KEY}" onclick="switchMainTab('tester','API Health Tester'); return false;" id="nav-tester">
        <i class="nav-icon bi bi-activity"></i><p>API Tester</p>
      </a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="/admin/revenue?key=${ADMIN_KEY}" onclick="switchMainTab('revenue','Analisa Pendapatan'); return false;" id="nav-revenue">
        <i class="nav-icon bi bi-cash-stack"></i><p>Pendapatan</p>
      </a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="/admin/services?key=${ADMIN_KEY}" onclick="switchMainTab('services','Setingan Layanan'); return false;" id="nav-services">
        <i class="nav-icon bi bi-sliders2-vertical"></i><p>Setingan Layanan</p>
      </a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="/admin/wa-settings?key=${ADMIN_KEY}" onclick="switchMainTab('wa-settings','Pengaturan WA'); return false;" id="nav-wa-settings">
        <i class="nav-icon bi bi-bell-fill"></i><p>Pengaturan WA</p>
      </a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="/admin/mysql?key=${ADMIN_KEY}" onclick="switchMainTab('mysql','MySQL Management'); return false;" id="nav-mysql">
        <i class="nav-icon bi bi-database-fill"></i><p>Database</p>
      </a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="/admin/redis-cache?key=${ADMIN_KEY}" onclick="switchMainTab('redis-cache','Redis Cache Audit'); return false;" id="nav-redis-cache">
        <i class="nav-icon bi bi-memory"></i><p>Redis Cache</p>
      </a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="/admin/vps?key=${ADMIN_KEY}" onclick="switchMainTab('vps','VPS Status'); return false;" id="nav-vps">
        <i class="nav-icon bi bi-hdd-stack-fill"></i><p>VPS Status</p>
      </a>
    </li>
  </ul>
  </nav>
  <div class="sidebar-footer">
    <button onclick="syncDB()" class="btn btn-success-soft btn-sm w-100 mb-2" style="font-size:11px;">
      <i class="bi bi-arrow-repeat me-1"></i>Sync Database
    </button>
    <div class="live-pill"><div class="live-dot"></div> Live Sync <span id="js-sync-status">aktif</span></div>
    <div class="log-console" id="browser-logs">Console siap...</div>
  </div>
</div>
</aside>

<!-- Main Content -->
<div id="main-content" class="content-wrapper">
  <section class="content-header pb-0">
    <div class="container-fluid">
      <div class="row mb-2">
        <div class="col-sm-12">
          <h1 class="m-0 topbar-title" id="topbar-title">
            <i class="bi bi-grid-1x2-fill"></i> Dashboard
            <span class="badge badge-blue ms-1" style="font-size:11px;">${appStats.date}</span>
          </h1>
        </div>
      </div>
    </div>
  </section>
  <section class="content page-body">
  <div class="container-fluid">

  `;
  }
};
