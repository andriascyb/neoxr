module.exports = function renderAdminStyles() {
  return `
  :root {
    --sidebar-width: 250px;
    --bs-body-font-family: 'Source Sans 3', 'Source Sans Pro', system-ui, sans-serif;
    --bs-body-bg: #f4f6f9;
    --bs-body-color: #212529;
    --bs-border-color: #dee2e6;
    --bs-secondary-bg: #ffffff;
    --bs-tertiary-bg: #f8f9fa;
    --bs-card-bg: #ffffff;
    --bs-card-border-color: #dee2e6;
  }
  body { background: var(--bs-body-bg); font-family: var(--bs-body-font-family); overflow-x: hidden; color: #212529; }

  /* -- AdminLTE-like Layout -- */
  #sidebar {
    width: var(--sidebar-width);
  }
  .main-sidebar { background: #343a40; }
  .brand-link { border-bottom: 1px solid rgba(255,255,255,.08); }
  .brand-text { color: #fff !important; font-weight: 600 !important; }
  .sidebar-nav .nav-link {
    padding: .45rem .75rem; font-size: 14px; font-weight: 400;
    color: rgba(255,255,255,.85);
    border-radius: .25rem;
    display: flex; align-items: center;
    transition: all .15s;
    margin: 0 .5rem;
  }
  .sidebar-nav .nav-link p { margin: 0; }
  .sidebar-nav .nav-header {
    color: rgba(255,255,255,.45);
    font-size: 12px;
    font-weight: 600;
    padding: .85rem 1rem .35rem;
  }
  .sidebar-nav .nav-link:hover { color: #fff; background: rgba(255,255,255,.08); }
  .sidebar-nav .nav-link.active { color: #fff; background: #007bff; }
  .sidebar-footer {
    margin-top: auto; padding: 12px 14px;
    border-top: 1px solid rgba(255,255,255,.12);
  }
  .live-pill { display: flex; align-items: center; gap: 7px; font-size: 12px; color: #3fb950; font-weight: 600; }
  .live-dot {
    width: 7px; height: 7px; background: #3fb950; border-radius: 50%;
    animation: pulse 1.5s ease-in-out infinite;
  }
  @keyframes pulse {
    0%,100% { opacity:1; box-shadow: 0 0 0 0 rgba(63,185,80,.4); }
    50% { opacity:.7; box-shadow: 0 0 0 5px rgba(63,185,80,0); }
  }
  .log-console {
    font-family: monospace; font-size: 10px; color: rgba(255,255,255,.7);
    background: rgba(0,0,0,.25); border-radius: 6px;
    padding: 5px 8px; margin-top: 8px; max-height: 70px;
    overflow: hidden;
  }

  #main-content {
    min-height: calc(100vh - 57px);
  }
  .topbar-title { font-size: 1.625rem; font-weight: 400; display: flex; align-items: center; gap: 9px; color:#343a40; }
  .page-body { padding: 0 0 1rem; }

  /* Cards */
  .card { background: #fff; border-color: #dee2e6; color:#212529; }
  .card-header { background: #fff; border-color: #dee2e6; padding: .65rem 1rem; }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ Stat Cards Ã¢â€â‚¬Ã¢â€â‚¬ */
  .stat-card { transition: transform .2s, box-shadow .2s; }
  .stat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,.4)!important; border-color: rgba(88,166,255,.3)!important; }
  .stat-icon {
    width: 46px; height: 46px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; flex-shrink: 0;
  }
  .stat-num { font-size: 26px; font-weight: 800; line-height: 1; }
  .stat-sub { font-size: 11px; color: #6c757d; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
  .provider-runtime-summary { display: grid; gap: 12px; }
  .provider-runtime-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(155px, 1fr)); gap: 10px; }
  .provider-runtime-card {
    background: #fff;
    border: 1px solid #dee2e6;
    border-radius: 12px;
    padding: 12px;
  }
  .provider-runtime-card.is-open { border-color: rgba(220,53,69,.45); background: rgba(220,53,69,.06); }
  .provider-runtime-card.is-healthy { border-color: rgba(40,167,69,.25); }
  .provider-runtime-head { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px; }
  .provider-runtime-name { font-size: 13px; font-weight: 700; color:#212529; }
  .provider-runtime-badge {
    font-size: 10px; font-weight: 800; text-transform: uppercase;
    padding: 2px 8px; border-radius: 999px;
    border: 1px solid rgba(88,166,255,.3); color:#58a6ff; background: rgba(88,166,255,.12);
  }
  .provider-runtime-badge.is-open { color:#f85149; border-color: rgba(248,81,73,.3); background: rgba(248,81,73,.12); }
  .provider-runtime-meta { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:8px; }
  .provider-runtime-kpi { background: #f8f9fa; border-radius: 10px; padding: 8px; }
  .provider-runtime-kpi-label { font-size: 10px; color:#6c757d; text-transform: uppercase; letter-spacing: .4px; }
  .provider-runtime-kpi-value { font-size: 16px; font-weight: 800; color:#212529; }
  .provider-runtime-note { font-size: 11px; color:#6c757d; margin-top:8px; line-height:1.45; }
  .provider-runtime-empty { font-size: 12px; color:#6c757d; }
  .provider-runtime-alert {
    border: 1px dashed rgba(227,179,65,.3);
    background: rgba(227,179,65,.08);
    color:#e3b341;
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 12px;
    font-weight: 600;
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ Progress bar Ã¢â€â‚¬Ã¢â€â‚¬ */
  .progress { background: #e9ecef; height: 6px; border-radius: 10px; overflow: hidden; }
  .progress-bar-valid { background: linear-gradient(90deg,#2ea043,#3fb950); }
  .progress-bar-failed { background: linear-gradient(90deg,#da3633,#f85149); }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ Table Ã¢â€â‚¬Ã¢â€â‚¬ */
  .table { --bs-table-bg: transparent; --bs-table-color: #212529; --bs-table-border-color: #dee2e6; }
  .table thead th { font-size: 14px; text-transform: none; letter-spacing: 0; color: #495057; border-bottom: 1px solid #dee2e6; font-weight: 600; }
  .table-hover tbody tr:hover { background: rgba(0,0,0,.025); }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ Forms Ã¢â€â‚¬Ã¢â€â‚¬ */
  .form-control, .form-select {
    background: #fff; border-color: #ced4da; color: #212529;
    font-family: inherit!important; font-size: 14px;
  }
  .form-control:focus, .form-select:focus {
    background: #fff; border-color: #80bdff; color: #212529;
    box-shadow: 0 0 0 .2rem rgba(0,123,255,.15);
  }
  .form-control::placeholder { color: #6c757d; }
  .form-label { font-size: 13px; font-weight: 600; text-transform: none; letter-spacing: 0; color: #495057; margin-bottom: 6px; }
  .form-select option { background: #fff; }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ Buttons Ã¢â€â‚¬Ã¢â€â‚¬ */
  .btn { font-family: inherit; font-weight: 600; font-size: 14px; }
  .btn-success-soft { background: rgba(63,185,80,.12); color: #3fb950; border: 1px solid rgba(63,185,80,.3); }
  .btn-success-soft:hover { background: rgba(63,185,80,.2); color: #3fb950; }
  .btn-danger-soft { background: rgba(248,81,73,.12); color: #f85149; border: 1px solid rgba(248,81,73,.3); }
  .btn-danger-soft:hover { background: rgba(248,81,73,.2); color: #f85149; }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ Badges Ã¢â€â‚¬Ã¢â€â‚¬ */
  .badge-green { background: rgba(63,185,80,.12); color: #3fb950; border: 1px solid rgba(63,185,80,.3); }
  .badge-red { background: rgba(248,81,73,.12); color: #f85149; border: 1px solid rgba(248,81,73,.3); }
  .badge-blue { background: rgba(88,166,255,.12); color: #58a6ff; border: 1px solid rgba(88,166,255,.3); }
  .badge-amber { background: rgba(227,179,65,.12); color: #e3b341; border: 1px solid rgba(227,179,65,.3); }
  .badge-yellow { background: rgba(227,179,65,.12); color: #e3b341; border: 1px solid rgba(227,179,65,.3); }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ WA Status Ã¢â€â‚¬Ã¢â€â‚¬ */
  .wa-status-badge { font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 800; text-transform: uppercase; }
  .wa-status-connected { background: rgba(63,185,80,.12); color: #3fb950; border: 1px solid rgba(63,185,80,.3); }
  .wa-status-disconnected { background: rgba(248,81,73,.12); color: #f85149; border: 1px solid rgba(248,81,73,.3); }
  .wa-status-waiting { background: rgba(227,179,65,.12); color: #e3b341; border: 1px solid rgba(227,179,65,.3); }
  .qr-box { background: #fff; padding: 10px; border-radius: 8px; display: inline-block; margin-top: 12px; }
  .qr-box img { display: block; width: 200px; height: 200px; }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ Test result pre Ã¢â€â‚¬Ã¢â€â‚¬ */
  pre#test-result {
    background: #f8f9fa; border: 1px solid #dee2e6; color: #212529;
    padding: 14px; border-radius: 8px; font-size: 12px;
    line-height: 1.6; white-space: pre-wrap; display: none; margin-top: 14px;
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ Scrollbar Ã¢â€â‚¬Ã¢â€â‚¬ */
  ::-webkit-scrollbar { width: 7px; height: 7px; }
  ::-webkit-scrollbar-track { background: #f1f3f5; }
  ::-webkit-scrollbar-thumb { background: #c1c7cd; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #adb5bd; }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ Mobile Ã¢â€â‚¬Ã¢â€â‚¬ */
  .sidebar-overlay {
    display: none; position: fixed; inset: 0;
    background: rgba(0,0,0,.7); z-index: 1030;
    backdrop-filter: blur(4px);
  }
  .sidebar-overlay.show { display: block; }
  body.sidebar-open { overflow: hidden; }
  @media (max-width: 768px) {
    #sidebar {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: min(84vw, 300px);
      z-index: 1035;
      transform: translateX(-100%);
      transition: transform .2s ease;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
    #sidebar.show { transform: translateX(0); }
    #main-content {
      margin-left: 0 !important;
      width: 100%;
    }
    .main-header {
      position: sticky;
      top: 0;
      z-index: 1020;
    }
    .sidebar .sidebar-footer {
      position: sticky;
      bottom: 0;
      background: #343a40;
      padding-bottom: max(12px, env(safe-area-inset-bottom));
    }
    .page-body { padding: 0 0 1rem; }
  }

  /* section title */
  .section-title {
    font-size: 1rem; font-weight: 600; text-transform: none;
    letter-spacing: 0; color: #343a40;
    display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
  }
  .section-title::after { content:''; flex:1; height:1px; background:#dee2e6; }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ User Cards Ã¢â€â‚¬Ã¢â€â‚¬ */
  .user-card {
    background: #fff;
    border: 1px solid #dee2e6;
    border-radius: 12px;
    padding: 20px;
    height: 100%;
    transition: all 0.2s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  .user-card:hover {
    border-color: #58a6ff;
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  }
  .user-card .user-name {
    font-size: 16px;
    font-weight: 700;
    color: #212529;
    margin-bottom: 4px;
    display: block;
  }
  .user-card .user-key-hint {
    font-size: 11px;
    color: #6c757d;
    font-family: monospace;
  }
  .user-table .text-muted {
    color: #6b7280 !important;
  }
  .user-table td.user-identity .font-monospace {
    color: #4b5563 !important;
    font-weight: 600;
  }
  .user-table td.user-identity > div:last-child {
    color: #475569 !important;
    font-weight: 600;
  }

  /* Server7 Pool Analyze premium */
  .server7-analyze-card {
    border: 1px solid #365274;
    background:
      radial-gradient(110% 120% at 0% 0%, rgba(56, 189, 248, .15) 0%, rgba(56, 189, 248, 0) 55%),
      linear-gradient(160deg, #0f172a 0%, #172338 60%, #1e2f46 100%);
    box-shadow: 0 14px 30px rgba(8, 18, 36, .35);
  }
  .server7-analyze-head strong {
    color: #eaf4ff;
    letter-spacing: .02em;
    font-weight: 800;
  }
  .server7-analyze-btn {
    color: #d6edff;
    border: 1px solid rgba(103, 191, 255, .65);
    background: linear-gradient(180deg, rgba(57, 136, 199, .35), rgba(57, 136, 199, .18));
    font-weight: 700;
    border-radius: 10px;
  }
  .server7-analyze-btn:hover {
    color: #ffffff;
    border-color: rgba(137, 210, 255, .95);
    background: linear-gradient(180deg, rgba(66, 153, 225, .5), rgba(66, 153, 225, .28));
    box-shadow: 0 8px 20px rgba(44, 131, 214, .28);
  }
  .server7-analyze-table {
    --bs-table-bg: transparent;
    --bs-table-color: #d6e5f6;
    --bs-table-border-color: rgba(120, 160, 205, .25);
    border-radius: 12px;
    overflow: hidden;
  }
  .server7-analyze-table thead th {
    background: rgba(12, 27, 48, .88);
    color: #9dc9f4;
    border-bottom: 1px solid rgba(120, 160, 205, .35);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .08em;
    font-weight: 800;
  }
  .server7-analyze-table tbody td {
    color: #dbeaff;
    font-weight: 600;
    border-top: 1px solid rgba(120, 160, 205, .2);
    background: rgba(13, 23, 38, .58);
  }
  .server7-analyze-table tbody tr:hover td {
    background: rgba(22, 40, 65, .75);
    color: #f3f9ff;
  }
  .server7-analyze-table .text-muted {
    color: #8db0d2 !important;
    font-weight: 600;
  }
  .user-table td[data-label="Balance"] .text-muted,
  .user-table td[data-label="Status"] .text-muted {
    color: #64748b !important;
    font-weight: 500;
  }
  .user-table .badge {
    font-weight: 700;
  }
  .user-card .user-meta {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #dee2e6;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .user-card .expiry-badge {
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 20px;
    font-weight: 600;
  }
  .user-card .pkg-tag {
    font-size: 10px;
    text-transform: uppercase;
    font-weight: 800;
    color: #58a6ff;
    background: rgba(56,139,253,0.1);
    padding: 2px 6px;
    border-radius: 4px;
  }
  .users-mobile-sticky-actions { display: none; }
  @media (max-width: 768px) {
    .user-table thead { display: none; }
    .user-table tbody tr.user-row {
      display: block;
      margin: 10px;
      border: 1px solid #dee2e6;
      border-radius: 12px;
      background: #fff;
      padding: 10px;
    }
    .user-table tbody tr.user-row td {
      display: block;
      width: 100% !important;
      border: 0;
      padding: 6px 4px !important;
      text-align: left !important;
    }
    .user-table tbody tr.user-row td[data-label]::before {
      content: attr(data-label);
      display: block;
      color: #6c757d;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .4px;
      margin-bottom: 2px;
    }
    .user-table tbody tr.user-row td.user-actions {
      border-top: 1px solid #dee2e6;
      margin-top: 6px;
      padding-top: 10px !important;
    }
    .user-actions-group {
      width: 100%;
      display: grid !important;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }
    .user-actions-group .btn {
      width: 100%;
    }
    .users-mobile-sticky-actions {
      position: sticky;
      bottom: 8px;
      z-index: 20;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-top: 10px;
      padding: 8px;
      background: rgba(255,255,255,.96);
      border: 1px solid #dee2e6;
      border-radius: 12px;
      backdrop-filter: blur(6px);
    }
  }

  /* Premium User Management */
  .users-premium-shell {
    --users-ink: #122033;
    --users-muted: #607089;
    --users-soft: #eef5ff;
    --users-line: #d8e2ef;
    --users-blue: #2563eb;
    --users-cyan: #0891b2;
    --users-teal: #0f766e;
    --users-gold: #b7791f;
    --users-danger: #dc2626;
    color: var(--users-ink);
  }
  .users-hero-panel {
    position: relative;
    overflow: hidden;
    min-height: 190px;
    border-radius: 26px;
    padding: 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 22px;
    background:
      radial-gradient(circle at 12% 20%, rgba(34, 211, 238, .34), transparent 26%),
      radial-gradient(circle at 88% 12%, rgba(251, 191, 36, .24), transparent 30%),
      linear-gradient(135deg, #071527 0%, #102846 48%, #0f4c5c 100%);
    box-shadow: 0 24px 60px rgba(15, 32, 53, .22);
    border: 1px solid rgba(255, 255, 255, .18);
  }
  .users-hero-panel::after {
    content: '';
    position: absolute;
    inset: 1px;
    border-radius: 25px;
    background: linear-gradient(120deg, rgba(255,255,255,.16), transparent 36%, rgba(255,255,255,.08));
    pointer-events: none;
  }
  .users-hero-glow {
    position: absolute;
    width: 190px;
    height: 190px;
    border-radius: 999px;
    filter: blur(8px);
    opacity: .48;
  }
  .users-hero-glow-a { right: 22%; top: -80px; background: rgba(20, 184, 166, .38); }
  .users-hero-glow-b { right: -50px; bottom: -80px; background: rgba(245, 158, 11, .28); }
  .users-hero-copy, .users-hero-actions { position: relative; z-index: 1; }
  .users-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: #8deaff;
    text-transform: uppercase;
    letter-spacing: .14em;
    font-size: 11px;
    font-weight: 800;
    margin-bottom: 9px;
  }
  .users-hero-copy h2 {
    margin: 0;
    color: #fff;
    font-size: clamp(32px, 4vw, 54px);
    line-height: .95;
    font-weight: 800;
    letter-spacing: -.04em;
  }
  .users-hero-copy p {
    max-width: 680px;
    margin: 13px 0 0;
    color: rgba(236, 248, 255, .84);
    font-size: 15px;
    line-height: 1.65;
  }
  .users-hero-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
    margin-top: 18px;
  }
  .users-hero-tags span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 11px;
    border-radius: 999px;
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.18);
    color: #eef9ff;
    font-size: 12px;
    font-weight: 700;
    backdrop-filter: blur(10px);
  }
  .users-hero-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 190px;
  }
  .users-primary-action,
  .users-secondary-action {
    min-height: 42px;
    border-radius: 14px;
    padding: 10px 16px;
    font-weight: 800;
  }
  .users-primary-action {
    color: #061424 !important;
    background: linear-gradient(135deg, #fef08a, #38bdf8);
    border: 0;
    box-shadow: 0 14px 30px rgba(56, 189, 248, .28);
  }
  .users-primary-action:hover { filter: brightness(.98); transform: translateY(-1px); }
  .users-secondary-action {
    color: #dff7ff !important;
    background: rgba(255,255,255,.11);
    border: 1px solid rgba(255,255,255,.24);
  }
  .users-insight-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin: 18px 0;
  }
  .users-insight-card {
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 16px;
    border-radius: 20px;
    background: linear-gradient(180deg, #ffffff, #f7fbff);
    border: 1px solid var(--users-line);
    box-shadow: 0 10px 30px rgba(18, 32, 51, .07);
  }
  .users-insight-icon {
    width: 42px;
    height: 42px;
    border-radius: 15px;
    display: grid;
    place-items: center;
    color: #fff;
    background: linear-gradient(135deg, #2563eb, #06b6d4);
    box-shadow: 0 10px 22px rgba(37, 99, 235, .22);
  }
  .users-insight-icon.success { background: linear-gradient(135deg, #0f766e, #22c55e); }
  .users-insight-icon.warn { background: linear-gradient(135deg, #b7791f, #f59e0b); }
  .users-insight-card span {
    display: block;
    color: var(--users-muted);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .users-insight-card strong {
    display: block;
    color: var(--users-ink);
    font-size: 17px;
    letter-spacing: -.01em;
  }
  .users-form-card,
  .users-table-card {
    border: 1px solid var(--users-line);
    border-radius: 22px;
    overflow: hidden;
    box-shadow: 0 16px 40px rgba(18, 32, 51, .08);
  }
  .users-form-card { margin-bottom: 18px; }
  .users-card-header,
  .users-table-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 18px 20px;
    background: linear-gradient(180deg, #ffffff, #f8fbff);
    border-bottom: 1px solid var(--users-line);
  }
  .users-card-title {
    color: var(--users-ink);
    font-size: 18px;
    font-weight: 850;
    letter-spacing: -.02em;
  }
  .users-card-subtitle {
    color: var(--users-muted);
    font-size: 12px;
    margin-top: 3px;
  }
  .users-icon-btn {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    border: 1px solid var(--users-line);
    color: var(--users-muted);
    background: #fff;
  }
  .users-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }
  .users-field-card {
    padding: 14px;
    border: 1px solid #e1e9f4;
    border-radius: 16px;
    background: #fbfdff;
  }
  .users-field-wide { grid-column: span 1; }
  .users-form-card .form-control,
  .users-form-card .form-select,
  .users-toolbar-panel .form-control {
    min-height: 44px;
    border-radius: 12px;
    border-color: #cfd9e8;
    color: var(--users-ink);
  }
  .users-form-card .input-group-text,
  .users-form-card .input-group .btn {
    border-color: #cfd9e8;
  }
  .users-form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 16px;
  }
  .users-table-card { margin-top: 0; }
  .users-table-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 12px;
    border-radius: 999px;
    background: #ecfeff;
    color: #0e7490;
    border: 1px solid #bae6fd;
    font-size: 12px;
    font-weight: 800;
  }
  .users-toolbar-panel {
    display: grid;
    grid-template-columns: minmax(280px, 1fr) auto;
    gap: 12px;
    padding: 16px 20px;
    background: #fff;
    border-bottom: 1px solid var(--users-line);
  }
  .users-search-wrap {
    position: relative;
  }
  .users-search-wrap i {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #7890ad;
    z-index: 2;
  }
  .users-search-wrap .form-control {
    padding-left: 42px;
    font-weight: 650;
  }
  .users-toolbar-actions {
    display: flex;
    gap: 9px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .users-toolbar-btn {
    min-height: 42px;
    border-radius: 12px !important;
    padding-left: 13px;
    padding-right: 13px;
  }
  .users-add-btn {
    background: linear-gradient(135deg, #2563eb, #0891b2);
    border: 0;
    box-shadow: 0 10px 22px rgba(37, 99, 235, .22);
  }
  .users-table-responsive { background: linear-gradient(180deg, #fff, #fbfdff); }
  .users-premium-table thead th {
    padding-top: 14px;
    padding-bottom: 14px;
    color: #41526a;
    background: #f3f8ff;
    border-color: #dce7f4;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: .08em;
  }
  .users-premium-row td {
    padding-top: 14px;
    padding-bottom: 14px;
    border-color: #e4ebf4;
    color: var(--users-ink);
  }
  .users-premium-row:hover {
    background: linear-gradient(90deg, rgba(37, 99, 235, .055), rgba(8, 145, 178, .035)) !important;
  }
  .users-identity-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 220px;
  }
  .users-avatar {
    width: 44px;
    height: 44px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    color: #fff;
    font-size: 14px;
    font-weight: 900;
    background: linear-gradient(135deg, #0f172a, #2563eb 58%, #06b6d4);
    box-shadow: 0 10px 22px rgba(37, 99, 235, .2);
    flex: 0 0 auto;
  }
  .users-premium-row.is-suspended .users-avatar { background: linear-gradient(135deg, #3f1d1d, #dc2626); }
  .users-premium-row.is-expired .users-avatar { background: linear-gradient(135deg, #422006, #f59e0b); }
  .users-name-line {
    color: #111827;
    font-weight: 850;
    font-size: 15px;
    line-height: 1.25;
  }
  .users-key-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 4px;
    padding: 3px 8px;
    border-radius: 999px;
    color: #36506f;
    background: #eef6ff;
    border: 1px solid #d7e8fb;
    font-size: 11px;
    font-weight: 750;
  }
  .users-member-code {
    margin-top: 4px;
    color: #64748b;
    font-size: 11px;
    font-weight: 750;
  }
  .users-mode-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    border-radius: 999px;
    background: #0f172a;
    color: #eaf6ff;
    font-size: 11px;
    font-weight: 850;
    box-shadow: 0 8px 16px rgba(15, 23, 42, .14);
  }
  .users-balance-stack strong {
    display: block;
    color: #102033;
    font-size: 16px;
    font-weight: 850;
  }
  .users-balance-stack span,
  .users-status-note {
    display: block;
    color: #718096;
    font-size: 11px;
    font-weight: 650;
    margin-top: 2px;
  }
  .users-expiry-badge {
    border-radius: 999px;
    padding: 6px 10px;
  }
  .users-action-cluster {
    gap: 6px;
  }
  .users-action-btn {
    width: 36px;
    height: 36px;
    display: inline-grid;
    place-items: center;
    border-radius: 12px !important;
    border: 1px solid #d7e4f2;
    background: #fff;
  }
  .users-action-btn.copy { color: #2563eb; background: #eff6ff; }
  .users-action-btn.edit { color: #b7791f; background: #fffbeb; }
  .users-action-btn.delete { color: #dc2626; background: #fff1f2; }
  .users-action-btn:hover { transform: translateY(-1px); filter: brightness(.98); }
  .users-pagination-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 14px 20px;
    color: var(--users-muted);
    font-size: 12px;
    border-top: 1px solid var(--users-line);
    background: #fff;
  }
  .users-pagination {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;
  }
  .user-detail-premium-modal .modal-content {
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid #d8e2ef;
  }
  .user-detail-premium-modal .modal-header {
    background:
      radial-gradient(circle at 20% 0%, rgba(34, 211, 238, .22), transparent 34%),
      linear-gradient(135deg, #071527, #123456);
    color: #fff;
    padding: 22px 24px;
  }
  .user-detail-premium-modal .modal-header .users-eyebrow { margin-bottom: 5px; }
  .users-detail-hero {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    border-radius: 18px;
    background: linear-gradient(135deg, #f0f7ff, #ecfeff);
    border: 1px solid #d8e8f7;
    margin-bottom: 16px;
  }
  .users-detail-avatar {
    width: 58px;
    height: 58px;
    border-radius: 20px;
    display: grid;
    place-items: center;
    color: #fff;
    background: linear-gradient(135deg, #2563eb, #0891b2);
    font-size: 26px;
  }
  .users-detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .users-detail-grid .detail-row {
    border: 1px solid #e0e8f2;
    border-radius: 14px;
    padding: 12px;
    background: #fbfdff;
    min-width: 0;
  }
  .users-detail-grid .detail-value {
    max-width: 100%;
    word-break: break-word;
  }
  .user-detail-premium-modal .detail-label {
    color: #5a6b82;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .02em;
  }
  .user-detail-premium-modal .detail-value {
    color: #1b2b40;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.4;
  }
  .user-detail-premium-modal #det-key {
    font-size: 14px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    color: #2457c5 !important;
    word-break: break-all;
  }
  .user-key-history-list {
    display: grid;
    gap: 8px;
    color: #4a5f78;
    font-size: 12px;
  }
  .user-key-history-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border: 1px solid #d7e5f2;
    border-radius: 12px;
    padding: 10px 12px;
    background: #f8fcff;
    transition: all .16s ease;
  }
  .user-key-history-item:hover {
    border-color: #90b4db;
    background: #eef6ff;
    box-shadow: 0 6px 14px rgba(28, 78, 141, .09);
  }
  .user-key-history-main {
    min-width: 0;
  }
  .user-key-history-key {
    display: block;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12px;
    color: #12345d;
    font-weight: 700;
    word-break: break-all;
  }
  .user-key-history-meta {
    display: block;
    margin-top: 2px;
    font-size: 10px;
    color: #5f7896;
    font-weight: 600;
  }
  .user-key-history-state {
    flex-shrink: 0;
    font-weight: 700;
    letter-spacing: .01em;
  }
  .user-key-history-table-wrap {
    border: 1px solid #d7e5f2;
    border-radius: 14px;
    background: #f8fbff;
    overflow: hidden;
    padding: 0;
    color: #4a5f78;
    font-size: 13px;
  }
  .user-key-history-table-responsive {
    margin: 0;
  }
  .user-key-history-table thead th {
    background: #eef4fb;
    color: #49627f;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .05em;
    border-bottom: 1px solid #d4e2f0;
    white-space: nowrap;
  }
  .user-key-history-table tbody td {
    color: #22354f;
    font-size: 13px;
    border-color: #e2ebf5;
    vertical-align: middle;
  }
  .user-key-history-table tbody tr:hover {
    background: #f0f7ff;
  }
  .user-key-history-code {
    display: inline-block;
    max-width: 360px;
    font-size: 12px;
    font-weight: 700;
    color: #123c78;
    background: #edf3ff;
    border: 1px solid #d5e3f6;
    border-radius: 8px;
    padding: 4px 8px;
    word-break: break-all;
  }
  .user-key-history-badge {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .01em;
  }
  #main-members .settings-card {
    border: 1px solid #d8e5f4;
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 12px 26px rgba(15, 29, 50, .08);
  }
  #main-members .users-hero-copy p {
    color: #d8e8ff;
  }
  #main-members .users-card-subtitle {
    color: #5d6f87 !important;
    font-weight: 600;
  }
  #main-members .settings-members-toolbar .text-muted,
  #main-members .settings-member-detail .text-muted {
    color: #5f738f !important;
    opacity: 1 !important;
  }
  #main-members .settings-members-table thead th {
    background: #f5f9ff;
    border-color: #dce7f4;
    color: #31465f;
    text-transform: uppercase;
    letter-spacing: .07em;
    font-size: 11px;
    font-weight: 800;
  }
  #main-members .settings-members-table td {
    border-color: #e3ebf4;
    color: #1e2f45;
    font-weight: 600;
    background: #ffffff;
  }
  #main-members .settings-members-table tbody tr:hover td {
    background: #f2f8ff;
    color: #13253d;
  }
  #main-members .settings-members-table .btn-link {
    color: #133a73 !important;
    text-decoration: none;
    font-weight: 800;
  }
  #main-members .settings-members-table .btn-link:hover {
    color: #0f4ea5 !important;
    text-decoration: underline;
  }
  #main-members .settings-member-modal .modal-content {
    border: 1px solid #c9dbf1;
    border-radius: 18px;
    overflow: hidden;
    background: linear-gradient(180deg, #f7fbff 0%, #f2f8ff 100%);
    box-shadow: 0 24px 50px rgba(10, 25, 45, .24);
  }
  #main-members .settings-member-modal .modal-header {
    background: linear-gradient(120deg, #0f2a49, #1f4d7f);
    border-bottom: 1px solid rgba(255, 255, 255, .2);
    color: #f4f9ff;
  }
  #main-members .settings-member-modal .modal-title {
    color: #f4f9ff;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: .01em;
  }
  #main-members .settings-member-modal .btn-close {
    filter: invert(1) brightness(1.4);
    opacity: .92;
  }
  #main-members .settings-member-modal .modal-body {
    background: radial-gradient(120% 120% at 50% 0%, #ffffff 0%, #f5f9ff 100%);
  }
  #main-members .settings-member-modal .form-label {
    color: #2f4a67;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: .05em;
    text-transform: uppercase;
  }
  #main-members .settings-member-modal .form-control,
  #main-members .settings-member-modal .form-select {
    min-height: 42px;
    color: #142b47;
    border: 1px solid #c7d8ed;
    border-radius: 10px;
    background: #ffffff;
    font-weight: 700;
    box-shadow: inset 0 1px 1px rgba(255,255,255,.75);
  }
  #main-members .settings-member-modal .form-control:focus,
  #main-members .settings-member-modal .form-select:focus {
    border-color: #4a8fe5;
    box-shadow: 0 0 0 .2rem rgba(74, 143, 229, .2);
  }
  #main-members .settings-member-detail {
    background: linear-gradient(180deg, #f8fbff 0%, #f1f7ff 100%);
    border: 1px solid #cfe0f4 !important;
    border-radius: 12px;
    color: #22354f;
    line-height: 1.62;
  }
  #main-members #member-admin-detail,
  #main-members #member-admin-detail * {
    color: #19334f;
  }
  #main-members #member-admin-detail .text-muted {
    color: #4f6885 !important;
    opacity: 1 !important;
    font-weight: 700;
  }
  #main-members #member-admin-detail table thead th {
    color: #2b4868;
    background: #e8f1fd;
    border-color: #cadcf1;
    font-size: 11px;
    font-weight: 800;
  }
  #main-members #member-admin-detail table tbody td {
    color: #1c3550;
    border-color: #d9e6f3;
    font-size: 12px;
    font-weight: 700;
  }
  #main-members #member-admin-detail .settings-member-kpi {
    background: linear-gradient(180deg, #ffffff 0%, #edf5ff 100%);
    border-color: #c7daef !important;
    border-radius: 10px;
    box-shadow: 0 6px 14px rgba(23, 54, 92, .08);
  }
  #main-members #member-admin-detail .settings-member-kpi > div:last-child {
    color: #103763;
    font-size: 16px;
    font-weight: 800 !important;
  }
  #main-members .settings-member-modal .form-control::placeholder {
    color: #7893b2;
    opacity: 1;
  }
  #main-members .settings-member-actions .btn {
    border-radius: 10px;
    font-weight: 700;
    letter-spacing: .01em;
    min-height: 40px;
  }
  #main-members .settings-member-actions .btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 16px rgba(16, 55, 99, .14);
  }
  @media (max-width: 991px) {
    .users-hero-panel {
      align-items: flex-start;
      flex-direction: column;
    }
    .users-hero-actions {
      flex-direction: row;
      width: 100%;
      min-width: 0;
    }
    .users-hero-actions .btn { flex: 1; }
    .users-toolbar-panel {
      grid-template-columns: 1fr;
    }
    .users-toolbar-actions {
      justify-content: stretch;
    }
    .users-toolbar-actions .btn {
      flex: 1 1 180px;
    }
  }
  @media (max-width: 768px) {
    .users-hero-panel {
      border-radius: 20px;
      padding: 22px;
      min-height: 0;
    }
    .users-hero-copy h2 {
      font-size: 36px;
    }
    .users-insight-grid,
    .users-form-grid,
    .users-detail-grid {
      grid-template-columns: 1fr;
    }
    .user-key-history-code {
      max-width: 220px;
      font-size: 11px;
    }
    .users-card-header,
    .users-table-head,
    .users-toolbar-panel,
    .users-pagination-bar {
      padding-left: 14px;
      padding-right: 14px;
    }
    .users-premium-table tbody tr.user-row {
      box-shadow: 0 12px 30px rgba(18, 32, 51, .08);
      border-radius: 18px;
      padding: 14px;
    }
    .users-premium-table tbody tr.user-row td {
      padding: 8px 2px !important;
    }
    .users-premium-table tbody tr.user-row td[data-label]::before {
      color: #64748b;
    }
    .users-identity-wrap {
      min-width: 0;
    }
    .users-toolbar-actions .btn,
    .users-form-actions .btn {
      width: 100%;
      flex: 1 1 100%;
    }
    .users-form-actions {
      flex-direction: column;
    }
    .users-pagination-bar {
      align-items: flex-start;
      flex-direction: column;
    }
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ Modals Ã¢â€â‚¬Ã¢â€â‚¬ */
  .modal-content {
    background: #fff;
    border: 1px solid #dee2e6;
    color: #212529;
  }
  .modal-header { border-bottom: 1px solid #dee2e6; }
  .modal-footer { border-top: 1px solid #dee2e6; }
  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #dee2e6;
  }
  .detail-label { color: #6c757d; font-size: 13px; }
  .detail-value { font-weight: 600; font-size: 13px; }
  .bg-darker { background: #fff !important; }

  /* Settings service tabs */
  .svc-tab-shell {
    border-bottom: 1px solid #dee2e6;
    padding: 12px 16px 0;
    display: flex;
    gap: 8px;
    overflow-x: auto;
    flex-wrap: nowrap;
    scrollbar-width: thin;
  }
  .svc-tab-shell::-webkit-scrollbar { height: 6px; }
  .svc-tab-btn {
    appearance: none;
    padding: 11px 14px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .03em;
    text-transform: uppercase;
    color: #6c757d;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-bottom: none;
    border-radius: 12px 12px 0 0;
    white-space: nowrap;
    cursor: pointer;
    transition: color .15s ease, background .15s ease, border-color .15s ease, transform .15s ease;
  }
  .svc-tab-btn:hover {
    color: #343a40;
    background: #e9f2ff;
    border-color: rgba(0,123,255,.35);
  }
  .svc-tab-btn.active {
    color: #007bff;
    background: #fff;
    border-color: rgba(0,123,255,.35);
    box-shadow: inset 0 -2px 0 #007bff;
  }
  .svc-tab-pane { padding: 22px 20px; }
  .settings-container {
    max-width: 1320px;
  }
  .settings-form .settings-card {
    border-radius: 14px;
    overflow: hidden;
  }
  .settings-premium-pane {
    --st-ink: #13233a;
    --st-muted: #61748f;
    --st-line: #d7e4f2;
    --st-soft: #f5f9ff;
  }
  .settings-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    border-radius: 22px;
    border: 1px solid #cfe0f1;
    padding: 18px 20px;
    margin-bottom: 14px;
    background:
      radial-gradient(circle at 14% 10%, rgba(56, 189, 248, .16), transparent 30%),
      linear-gradient(135deg, #f9fcff, #eef6ff);
    box-shadow: 0 14px 34px rgba(14, 30, 50, .08);
  }
  .settings-hero-kicker {
    color: #3b82f6;
    text-transform: uppercase;
    letter-spacing: .1em;
    font-size: 11px;
    font-weight: 800;
  }
  .settings-hero h2 {
    margin: 6px 0 5px;
    color: var(--st-ink);
    font-size: clamp(28px, 3.5vw, 40px);
    font-weight: 850;
    letter-spacing: -.02em;
  }
  .settings-hero p {
    margin: 0;
    color: var(--st-muted);
    max-width: 760px;
    font-size: 13px;
  }
  .settings-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 13px;
    border-radius: 999px;
    border: 1px solid #bfe0f2;
    background: #e9fbff;
    color: #0e7490;
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
  }
  .wa-premium-pane .wa-premium-card {
    border: 1px solid #cfe0f1;
    border-radius: 16px;
    box-shadow: 0 12px 28px rgba(15, 30, 49, .07);
    overflow: hidden;
  }
  .wa-control-panel,
  .wa-login-panel {
    border: 1px solid #d7e4f2;
    border-radius: 14px;
    background: linear-gradient(180deg, #ffffff, #f7fbff);
    padding: 18px;
  }
  .wa-control-title,
  .wa-login-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #13233a;
    font-weight: 850;
    font-size: 16px;
  }
  .wa-control-copy,
  .wa-login-subtitle {
    color: #61748f;
    font-size: 12px;
    margin-top: 4px;
    line-height: 1.45;
  }
  .wa-status-chip {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 5px 10px;
    border-radius: 999px;
    background: #f1f6ff;
    border: 1px solid #d4e2f2;
    color: #58708d;
    font-size: 11px;
    font-weight: 800;
  }
  .wa-pairing-code-box {
    display: grid;
    gap: 3px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px dashed #b9d4ef;
    background: #f5faff;
  }
  .wa-pairing-code-box .wa-pairing-label {
    color: #61748f;
    font-size: 10px;
    font-weight: 850;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .wa-pairing-code-box strong {
    color: #0f172a;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: clamp(24px, 4vw, 38px);
    letter-spacing: .12em;
    line-height: 1.1;
  }
  .wa-pairing-code-box small {
    color: #61748f;
    font-size: 11px;
  }
  .wa-qr-wrap {
    min-height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8fbff;
    border: 1px dashed #c7d9ee;
    border-radius: 12px;
  }
  .wa-template-editor {
    min-height: 168px;
    font-size: 12px !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace !important;
    line-height: 1.65;
    background: #fbfdff !important;
  }
  .premium-settings-form .settings-card {
    border: 1px solid var(--st-line);
    border-radius: 18px;
    box-shadow: 0 10px 26px rgba(15, 30, 49, .07);
  }
  .premium-settings-form .settings-card .card-header {
    padding: 12px 14px;
    border-bottom: 1px solid var(--st-line);
    background: linear-gradient(180deg, #ffffff, #f7fbff);
  }
  .premium-settings-form .settings-card .card-header span,
  .premium-settings-form .settings-card .card-header,
  .premium-settings-form .settings-card .card-header i {
    color: var(--st-ink);
  }
  .premium-settings-form .settings-card .card-body {
    background: #fff;
  }
  .premium-settings-form .form-label {
    color: #435973;
    font-size: 12px;
    font-weight: 750;
    letter-spacing: .04em;
    text-transform: uppercase;
  }
  .premium-settings-form .form-control,
  .premium-settings-form .form-select,
  .premium-settings-form .input-group-text {
    border-color: #ccdbec !important;
    border-radius: 11px;
  }
  .premium-settings-form .input-group .form-control {
    border-radius: 11px 0 0 11px;
  }
  .premium-settings-form .input-group .btn,
  .premium-settings-form .input-group .input-group-text:last-child {
    border-radius: 0 11px 11px 0;
  }
  .premium-settings-form .text-secondary,
  .premium-settings-form .text-muted {
    color: var(--st-muted) !important;
  }
  .premium-settings-form .svc-server-card,
  .premium-settings-form .svc-tab-pane > .p-3.rounded {
    background: linear-gradient(145deg, #ffffff, #f8fbff) !important;
    border: 1px solid #d5e3f2 !important;
    border-radius: 16px !important;
    padding: 16px !important;
    box-shadow: 0 8px 18px rgba(16, 35, 58, .05);
  }
  .premium-settings-form .svc-server-head {
    padding-bottom: 10px;
    border-bottom: 1px dashed #dce8f6;
    margin-bottom: 12px;
  }
  .premium-settings-form .svc-server-head .badge {
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 10px !important;
    letter-spacing: .08em;
  }
  .premium-settings-form .svc-help-box {
    background: linear-gradient(145deg, #eef6ff, #f6fbff);
    border: 1px dashed #b9d4ef;
  }
  .premium-settings-form .settings-members-table thead th {
    background: #f3f8ff;
    border-color: #dce7f4;
    color: #41526a;
    text-transform: uppercase;
    letter-spacing: .07em;
    font-size: 11px;
  }
  .premium-settings-form .table td {
    border-color: #e3ebf4;
  }
  .premium-settings-form .settings-actionbar {
    border-top: 1px solid #dce8f4;
    padding-top: 14px;
  }
  .premium-settings-form .settings-actionbar .btn-primary {
    background: linear-gradient(135deg, #2563eb, #0891b2);
    border: 0;
    border-radius: 12px;
    box-shadow: 0 10px 20px rgba(37, 99, 235, .2);
  }
  .premium-settings-form .svc-tab-shell {
    border-bottom: 1px solid #dce7f4;
    background: linear-gradient(180deg, #fcfdff, #f7faff);
  }
  .premium-settings-form .svc-tab-btn {
    background: #f1f6ff;
    border-color: #d4e2f2;
    color: #58708d;
    border-radius: 12px 12px 0 0;
  }
  .premium-settings-form .svc-tab-btn.active {
    color: #1e40af;
    background: #fff;
    border-color: #c7d9ee;
    box-shadow: inset 0 -2px 0 #2563eb;
  }
  .settings-form .settings-card .card-header {
    padding: .8rem 1rem;
    background: linear-gradient(180deg, #ffffff, #f8f9fb);
  }
  .settings-form .settings-card .card-body {
    padding: 1rem 1rem 1.05rem;
  }
  .settings-form .section-title {
    font-size: .94rem;
    margin-bottom: 10px !important;
  }
  .settings-card-services .card-body {
    padding: 0 !important;
  }
  .svc-tab-shell {
    position: sticky;
    top: 56px;
    z-index: 5;
    background: #fff;
  }
  .svc-server-card {
    border: 1px solid #dee2e6;
    border-radius: 16px;
    padding: 18px;
    margin-bottom: 16px;
  }
  .svc-tab-pane > .p-3.rounded {
    border-radius: 16px !important;
    padding: 18px !important;
    margin-bottom: 16px !important;
  }
  .settings-actionbar {
    padding: 10px 0 0;
  }
  .settings-actionbar .btn {
    min-height: 40px;
  }
  .settings-members-toolbar {
    gap: 10px;
    flex-wrap: wrap;
  }
  .settings-members-table thead th {
    font-size: 12px;
    color: #495057;
    white-space: nowrap;
  }
  .settings-member-modal .modal-header {
    background: linear-gradient(180deg, #ffffff, #f8f9fb);
  }
  .settings-member-actions {
    flex-wrap: wrap;
  }
  .settings-member-actions .btn {
    min-height: 38px;
  }
  .settings-member-detail {
    background: #f8f9fa;
    border-color: #dee2e6 !important;
    color: #495057;
    line-height: 1.5;
  }
  .svc-server-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }
  .svc-server-status {
    margin-left: auto;
    width: 108px;
    min-width: 108px;
  }
  .svc-help-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
    padding: 16px;
    border-radius: 16px;
    background: rgba(0,123,255,.05);
    border: 1px dashed #dee2e6;
  }
  .svc-help-box .btn { flex-shrink: 0; }

  @media (max-width: 768px) {
    .settings-hero {
      flex-direction: column;
      align-items: flex-start;
      padding: 14px;
      border-radius: 16px;
    }
    .settings-hero h2 {
      font-size: 30px;
    }
    .settings-hero-badge {
      width: 100%;
      justify-content: center;
    }
    .settings-form .settings-card .card-body {
      padding: .9rem .85rem 1rem;
    }
    .settings-members-toolbar .btn {
      width: 100%;
    }
    .settings-member-actions {
      flex-direction: column;
      align-items: stretch;
    }
    .settings-member-actions .btn {
      width: 100%;
    }
    .svc-tab-shell {
      margin: 0 -14px;
      padding: 10px 14px 0;
      top: 52px;
    }
    .svc-tab-btn {
      font-size: 11px;
      padding: 10px 12px;
    }
    .svc-tab-pane {
      padding: 18px 14px;
    }
    .svc-tab-pane > .p-3.rounded {
      padding: 14px !important;
      border-radius: 14px !important;
    }
    .svc-server-card {
      padding: 15px;
      border-radius: 14px;
    }
    .svc-server-head {
      align-items: stretch;
    }
    .svc-server-status {
      margin-left: 0;
      width: 100%;
      min-width: 0;
    }
    .svc-server-status .form-select {
      width: 100% !important;
    }
    .svc-help-box {
      align-items: flex-start;
    }
    .svc-help-box .btn {
      width: 100%;
    }
    .settings-actionbar {
      position: sticky;
      bottom: 8px;
      z-index: 10;
      margin-top: 14px !important;
      padding: 8px;
      border: 1px solid #dee2e6;
      border-radius: 12px;
      background: rgba(255,255,255,.96);
      backdrop-filter: blur(6px);
      flex-direction: column;
      align-items: stretch;
    }
    .settings-actionbar .btn {
      width: 100%;
    }
  }

  /* --- VPS UI Enhancements --- */
  .icon-box {
    width: 42px; height: 42px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .card-vps {
    transition: transform 0.2s ease, border-color 0.2s ease;
  }
  .card-vps:hover {
    transform: translateY(-2px);
    border-color: rgba(88,166,255,0.4);
  }
  .text-truncate-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .vps-stat-label { font-size: 10px; color: #6c757d; text-transform: uppercase; font-weight: 700; letter-spacing: 0.8px; }
  .vps-stat-value { font-size: 16px; font-weight: 700; color: #212529; }
  .vps-proc-head th {
    background: #1f2937 !important;
    color: #dbe7f6 !important;
    border-color: #2f3b4d !important;
    text-transform: uppercase;
    letter-spacing: .06em;
    font-size: 11px;
    font-weight: 800;
    padding-top: 12px;
    padding-bottom: 12px;
  }
  .vps-proc-table tbody td {
    color: #19324f;
    border-color: #e2ebf5;
    font-weight: 600;
    background: #fbfdff;
    vertical-align: middle;
  }
  .vps-proc-table tbody tr:nth-child(even) td {
    background: #f4f9ff;
  }
  .vps-proc-table tbody tr.vps-proc-row:hover td {
    background: #e8f2ff !important;
    color: #102946;
  }
  .vps-proc-name {
    color: #0f3159;
    font-weight: 750;
  }
  .vps-proc-chip {
    display: inline-block;
    min-width: 72px;
    text-align: center;
    padding: 4px 8px;
    border-radius: 999px;
    border: 1px solid #bfdaff;
    background: #edf5ff;
    color: #205290;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .02em;
  }
  .vps-proc-empty {
    color: #6b7f96 !important;
    font-weight: 600;
    background: #f8fbff !important;
  }
  .mapper-panel-scroll { max-height: 580px; overflow: auto; }
  .mapper-meta-box { background: rgba(0,123,255,.05); border: 1px solid #dee2e6; border-radius: 8px; padding: 10px 12px; font-size: 12px; }
  .mapper-preview-pre { background:#f8f9fa; border:1px solid #dee2e6; color:#212529; padding:14px; border-radius:8px; font-size:12px; line-height:1.6; white-space:pre-wrap; min-height:360px; margin:0; }
  .mapper-source-node { border: 1px solid #dee2e6; border-radius: 8px; padding: 8px 10px; margin-bottom: 8px; background: #fff; }
  .mapper-source-node details { margin-left: 10px; margin-top: 8px; }
  .mapper-source-head { display:flex; gap:8px; align-items:center; justify-content:space-between; flex-wrap:wrap; }
  .mapper-source-path { font-family: monospace; font-size: 11px; color:#007bff; word-break:break-all; }
  .mapper-source-value { font-size:11px; color:#6c757d; word-break:break-all; }
  .mapper-field-item { border:1px solid #dee2e6; border-radius:10px; padding:10px; background:#fff; margin-bottom:10px; cursor:grab; }
  .mapper-field-item.dragging { opacity:.4; }
  .mapper-field-grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:10px; margin-top:10px; }
  .mapper-field-title { display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .mapper-handle { color:#6c757d; cursor:grab; }
  @media (max-width: 991px) { .mapper-field-grid { grid-template-columns: 1fr; } }

  /* Revenue readability fix */
  .revenue-pane .section-title {
    color: #1f2d3d;
  }
  .revenue-stat-card {
    border: 1px solid #d7dce3;
    border-radius: 10px;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
  }
  .revenue-stat-label {
    font-size: 12px;
    font-weight: 600;
    color: #5f6b7a;
    margin-bottom: 6px;
  }
  .revenue-stat-value {
    font-size: 40px;
    line-height: 1.15;
    font-weight: 700;
    color: #1f2d3d;
    letter-spacing: 0.2px;
  }
  .revenue-table-card .card-header {
    background: #ffffff;
    color: #1f2d3d;
  }
  .revenue-pane .table thead th {
    color: #374151;
    font-weight: 700;
  }
  .revenue-pane .table tbody td {
    color: #1f2937;
    font-weight: 500;
    vertical-align: top;
  }
  .revenue-pane .table .text-muted,
  .revenue-pane .text-muted {
    color: #6b7280 !important;
    opacity: 1 !important;
  }
  .revenue-pane .badge-green,
  .revenue-pane .badge-red,
  .revenue-pane .badge-amber,
  .revenue-pane .badge-blue {
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .dashboard-premium-pane {
    --dash-ink: #0f1d32;
    --dash-muted: #61738f;
    --dash-line: #d6e1ef;
  }
  .dash-hero {
    position: relative;
    overflow: hidden;
    border-radius: 24px;
    border: 1px solid #cfdcf0;
    padding: 24px;
    margin-bottom: 16px;
    background:
      radial-gradient(circle at 9% 10%, rgba(56, 189, 248, .2), transparent 26%),
      radial-gradient(circle at 92% 15%, rgba(250, 204, 21, .18), transparent 28%),
      linear-gradient(135deg, #0a1a2f 0%, #143462 52%, #155e75 100%);
    box-shadow: 0 20px 46px rgba(20, 44, 76, .18);
    display: grid;
    grid-template-columns: 1.35fr 1fr;
    gap: 18px;
    color: #eef7ff;
  }
  .dash-hero-kicker {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    text-transform: uppercase;
    letter-spacing: .12em;
    font-size: 11px;
    font-weight: 800;
    color: #93e8ff;
  }
  .dash-hero h2 {
    margin: 8px 0 6px;
    font-size: clamp(30px, 3.4vw, 46px);
    font-weight: 850;
    letter-spacing: -.03em;
    color: #fff;
  }
  .dash-hero p { margin: 0; color: rgba(226, 241, 255, .86); max-width: 580px; }
  .dash-hero-metrics { display: grid; gap: 10px; }
  .dash-hero-metric {
    border: 1px solid rgba(255,255,255,.2);
    border-radius: 16px;
    padding: 12px 14px;
    background: rgba(255,255,255,.09);
    backdrop-filter: blur(8px);
  }
  .dash-hero-metric span { display:block; font-size:11px; text-transform:uppercase; letter-spacing:.1em; color:#caecff; font-weight:700; }
  .dash-hero-metric strong { display:block; font-size:26px; margin-top:4px; color:#fff; letter-spacing:-.02em; }
  .dash-consume-card {
    border: 1px solid #d8e5f4;
    border-radius: 18px;
    background: linear-gradient(145deg, #ffffff, #f4f9ff);
    box-shadow: 0 12px 26px rgba(15, 29, 50, .08);
  }
  .dash-consume-card-alt {
    background: linear-gradient(145deg, #f6fffd, #effbff);
    border-color: #cae7ea;
  }
  .dash-consume-label { color:#4f6483; font-size:12px; text-transform:uppercase; letter-spacing:.08em; font-weight:800; }
  .dash-consume-value { margin-top:8px; color:#0f1d32; font-weight:850; font-size:34px; letter-spacing:-.02em; }
  .dash-consume-note { margin-top:5px; color:#6b7f98; font-size:12px; }
  .dash-chart-card {
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid #d8e5f4;
    box-shadow: 0 12px 26px rgba(15, 29, 50, .06);
  }

  .service-setting-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 14px;
  }
  .service-setting-card {
    border: 1px solid #dee2e6;
    border-radius: 14px;
    background: linear-gradient(180deg, #ffffff, #f9fbff);
    padding: 14px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
  }
  .service-setting-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 8px;
  }
  .service-setting-title {
    font-size: 16px;
    font-weight: 700;
    color: #1f2937;
  }
  .service-setting-sub {
    font-size: 12px;
    color: #6b7280;
  }
  .service-setting-toggle .form-check-input {
    width: 2.6rem;
    height: 1.3rem;
    cursor: pointer;
  }
  .service-setting-toggle .service-status-label {
    margin-left: 8px;
    font-size: 12px;
    font-weight: 700;
    color: #4b5563;
    min-width: 28px;
    display: inline-block;
  }
  .revenue-hero {
    border-radius: 22px;
    border: 1px solid #cfe0f0;
    padding: 20px;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background:
      radial-gradient(circle at 12% 10%, rgba(59,130,246,.18), transparent 26%),
      linear-gradient(135deg, #f9fcff, #eef6ff);
  }
  .revenue-kicker { color:#3b82f6; font-size:11px; text-transform:uppercase; letter-spacing:.12em; font-weight:800; }
  .revenue-hero h2 { margin:6px 0 4px; color:#1f2d3d; font-size:36px; font-weight:850; letter-spacing:-.02em; }
  .revenue-hero p { margin:0; color:#5f6b7a; }
  .revenue-refresh-btn {
    border-radius: 12px;
    min-height: 40px;
    background: linear-gradient(135deg, #2563eb, #0891b2);
    color: #fff;
    border: 0;
    padding: 8px 14px;
    font-weight: 700;
    box-shadow: 0 10px 20px rgba(37, 99, 235, .2);
  }
  .revenue-glow.success { border-top: 3px solid #16a34a; }
  .revenue-glow.pending { border-top: 3px solid #ca8a04; }
  .revenue-glow.package { border-top: 3px solid #2563eb; }
  .revenue-glow.debit { border-top: 3px solid #0f766e; }
  .revenue-premium-table thead th {
    background: #f5f9ff;
    border-color: #dbe6f3;
    color: #41526a;
    text-transform: uppercase;
    letter-spacing: .07em;
    font-size: 12px;
  }
  @media (max-width: 768px) {
    .dash-hero {
      grid-template-columns: 1fr;
      padding: 18px;
      border-radius: 18px;
    }
    .dash-hero h2 { font-size: 30px; }
    .dash-consume-value { font-size: 28px; }
    .revenue-hero {
      align-items: flex-start;
      flex-direction: column;
      padding: 16px;
      border-radius: 16px;
    }
    .revenue-hero h2 { font-size: 28px; }
    .revenue-refresh-btn { width: 100%; }
    .revenue-stat-value {
      font-size: 30px;
    }
  }

  .mysql-premium-pane .card {
    border: 1px solid #d7e4f2;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 26px rgba(15, 29, 50, .06);
  }
  .mysql-premium-pane .card-header {
    background: linear-gradient(180deg, #ffffff, #f7fbff);
    border-bottom: 1px solid #dce8f4;
    color: #1f2d3d;
    font-weight: 700;
  }
  .mysql-premium-pane .table thead th {
    background: #f4f8ff;
    color: #41526a;
    text-transform: uppercase;
    letter-spacing: .06em;
    font-size: 11px;
    border-bottom: 1px solid #dce8f4;
  }
  .mysql-premium-pane .table tbody td {
    vertical-align: middle;
  }
  .mysql-premium-pane .btn-primary {
    background: linear-gradient(135deg, #2563eb, #0891b2);
    border: 0;
    box-shadow: 0 10px 20px rgba(37, 99, 235, .18);
  }
  .mysql-premium-pane .btn-primary:hover {
    filter: brightness(.98);
  }
  .mysql-premium-pane .modal-content {
    border: 1px solid #d7e4f2;
    border-radius: 14px;
    box-shadow: 0 18px 46px rgba(15, 29, 50, .2);
  }
  .mysql-premium-pane #dbBrowserModal .table-hover tbody tr:hover {
    background: #edf4ff !important;
    color: #14233b !important;
  }
  .mysql-premium-pane #dbBrowserModal .table-hover tbody tr:hover td {
    color: #14233b !important;
  }
  .mysql-premium-pane #dbBrowserModal .table-hover tbody tr:hover .text-muted {
    color: #4f637d !important;
  }

  .live-premium-pane {
    --live-ink: #10243d;
    --live-muted: #607895;
    --live-line: #d6e4f4;
  }
  .live-hero {
    border-radius: 22px;
    border: 1px solid #cfe0f0;
    padding: 22px;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background:
      radial-gradient(circle at 10% 8%, rgba(59,130,246,.2), transparent 28%),
      radial-gradient(circle at 88% 14%, rgba(20,184,166,.15), transparent 32%),
      linear-gradient(135deg, #f9fcff, #eef5ff);
  }
  .live-kicker {
    color: #2f6ecd;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .12em;
    font-weight: 800;
  }
  .live-hero h2 {
    margin: 8px 0 6px;
    color: #14263f;
    font-size: clamp(30px, 3vw, 42px);
    font-weight: 850;
    letter-spacing: -.02em;
  }
  .live-hero p { margin: 0; color: #5d6f87; max-width: 720px; }
  .live-hero-badges { display: grid; gap: 8px; min-width: 210px; }
  .live-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 999px;
    border: 1px solid #c8daf0;
    background: rgba(255,255,255,.86);
    color: #385578;
    padding: 8px 12px;
    font-size: 11px;
    font-weight: 700;
    justify-content: center;
  }
  .live-kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 14px;
  }
  .live-kpi-card {
    border: 1px solid var(--live-line);
    border-radius: 16px;
    padding: 14px;
    background: linear-gradient(145deg, #fff, #f7fbff);
    box-shadow: 0 8px 20px rgba(15, 29, 50, .06);
  }
  .live-kpi-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: var(--live-muted);
    font-weight: 800;
  }
  .live-kpi-value {
    margin-top: 7px;
    font-size: 28px;
    font-weight: 850;
    color: var(--live-ink);
    letter-spacing: -.02em;
  }
  .live-kpi-value.ok { color: #0f766e; }
  .live-kpi-value.bad { color: #b91c1c; }
  .live-kpi-value.sm { font-size: 16px; color: #3f5878; font-weight: 700; }
  .live-surface-card {
    border: 1px solid #d7e4f2;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 26px rgba(15, 29, 50, .06);
    background: linear-gradient(145deg, #ffffff, #f7fbff);
  }
  .live-surface-head {
    background: linear-gradient(180deg, #ffffff, #f7fbff);
    border-bottom: 1px solid #dce8f4;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .live-surface-title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #1f2d3d;
    font-weight: 800;
  }
  .live-filter-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1fr 1.8fr 1fr auto;
    gap: 10px;
    align-items: end;
  }
  .live-filter-label {
    display: block;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .07em;
    text-transform: uppercase;
    color: #536a86;
    margin-bottom: 5px;
  }
  .live-refresh-col .btn {
    min-width: 110px;
    min-height: 35px;
  }
  .live-table-wrap { max-height: 560px; border-radius: 12px; border: 1px solid #dce8f4; }
  .live-table thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: #f4f8ff;
    color: #42556f;
    text-transform: uppercase;
    letter-spacing: .06em;
    font-size: 11px;
    border-bottom: 1px solid #dce8f4;
    white-space: nowrap;
  }
  .live-table tbody td { font-size: 12px; color: #1d3553; vertical-align: middle; }
  .live-table tbody tr:nth-child(even) td { background: #fbfdff; }
  .live-table tbody tr:hover td { background: #edf4ff !important; }
  .live-detail-card {
    border: 1px solid #dce8f4;
    border-radius: 12px;
    background: linear-gradient(145deg, #fff, #f8fbff);
    padding: 10px;
  }
  .live-detail-head {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .08em;
    font-weight: 800;
    color: #536a86;
    margin-bottom: 8px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .live-detail-pre {
    margin: 0;
    font-size: 12px;
    line-height: 1.55;
    max-height: 180px;
    overflow: auto;
    background: #0f172a;
    color: #e2e8f0;
    border-radius: 10px;
    padding: 10px;
    border: 1px solid rgba(148,163,184,.25);
  }
  .live-surface-foot {
    border-top: 1px solid #dce8f4;
    background: #f9fcff;
  }
  .live-foot-note { color: #5b6f89; font-size: 12px; font-weight: 700; }
  @media (max-width: 992px) {
    .live-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .live-filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .live-refresh-col { grid-column: span 2; }
    .live-refresh-col .btn { width: 100%; }
  }
  @media (max-width: 768px) {
    .live-hero {
      flex-direction: column;
      align-items: flex-start;
      padding: 16px;
      border-radius: 16px;
    }
    .live-hero h2 { font-size: 28px; }
    .live-hero-badges { width: 100%; min-width: 0; }
    .live-chip { width: 100%; justify-content: center; }
    .live-kpi-grid { grid-template-columns: 1fr; }
    .live-filter-grid { grid-template-columns: 1fr; }
    .live-refresh-col { grid-column: auto; }
  }

  .vps-premium-pane {
    --vps-line: #d4e1f0;
  }
  .vps-hero {
    border-radius: 22px;
    border: 1px solid #cfe0f0;
    padding: 20px;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background:
      radial-gradient(circle at 12% 10%, rgba(59,130,246,.18), transparent 28%),
      radial-gradient(circle at 88% 14%, rgba(20,184,166,.15), transparent 30%),
      linear-gradient(135deg, #f9fcff, #eef5ff);
  }
  .vps-hero-kicker {
    color: #2f6ecd;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .12em;
    font-weight: 800;
  }
  .vps-hero h2 {
    margin: 7px 0 5px;
    color: #14263f;
    font-size: clamp(30px, 3vw, 42px);
    font-weight: 850;
    letter-spacing: -.02em;
  }
  .vps-hero p { margin: 0; color: #5d6f87; max-width: 700px; }
  .vps-hero-badge {
    flex-shrink: 0;
    border-radius: 999px;
    border: 1px solid #c7d9ef;
    background: rgba(255,255,255,.85);
    color: #4f6582 !important;
    font-size: 11px !important;
    font-weight: 700;
    padding: 8px 12px;
    box-shadow: 0 8px 18px rgba(15, 29, 50, .08);
  }
  .vps-metric-card,
  .vps-surface-card {
    border: 1px solid var(--vps-line);
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 10px 24px rgba(15, 29, 50, .06);
    background: linear-gradient(145deg, #ffffff, #f6faff);
  }
  .vps-metric-card .card-body { padding: 18px; }
  .vps-surface-card .card-header {
    background: linear-gradient(180deg, #ffffff, #f7fbff);
    border-bottom: 1px solid #dce8f4;
    color: #1f2d3d;
    font-weight: 700;
  }
  .vps-premium-pane .badge.bg-secondary {
    background: #e8f1ff !important;
    color: #28598f !important;
    border: 1px solid #c5daf4;
  }

  .mysql-hero {
    border-radius: 22px;
    border: 1px solid #cfe0f0;
    padding: 20px;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background:
      radial-gradient(circle at 10% 12%, rgba(59,130,246,.15), transparent 28%),
      radial-gradient(circle at 88% 18%, rgba(14,165,233,.12), transparent 30%),
      linear-gradient(135deg, #fbfdff, #eef6ff);
  }
  .mysql-hero-kicker {
    color: #2f6ecd;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .12em;
    font-weight: 800;
  }
  .mysql-hero h2 {
    margin: 7px 0 5px;
    color: #14263f;
    font-size: clamp(30px, 3vw, 40px);
    font-weight: 850;
    letter-spacing: -.02em;
  }
  .mysql-hero p { margin: 0; color: #5d6f87; max-width: 700px; }
  .mysql-hero-btn {
    flex-shrink: 0;
    min-height: 42px;
    border-radius: 12px;
    padding: 8px 14px;
  }
  .mysql-surface-card {
    background: linear-gradient(145deg, #ffffff, #f7fbff);
    border: 1px solid #d7e4f2;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 26px rgba(15, 29, 50, .06);
  }
  .mysql-danger-card {
    background: linear-gradient(145deg, #fff9f9, #fff2f2);
  }
  @media (max-width: 768px) {
    .vps-hero,
    .mysql-hero {
      align-items: flex-start;
      flex-direction: column;
      padding: 16px;
      border-radius: 16px;
    }
    .vps-hero-badge,
    .mysql-hero-btn {
      width: 100%;
      justify-content: center;
      text-align: center;
    }
    .vps-hero h2,
    .mysql-hero h2 {
      font-size: 28px;
    }
  }
</style>
`;
};
