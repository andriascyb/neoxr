module.exports = function renderMemberStyles() {
  return `
    :root {
      --bg: #f4f6f9;
      --bg-soft: #eef1f5;
      --panel: #ffffff;
      --panel-strong: #ffffff;
      --panel-muted: #f7f9fc;
      --line: #d8dee6;
      --line-strong: #c5ced8;
      --text: #1f2d3d;
      --muted: #6c757d;
      --accent: #0d6efd;
      --accent-soft: rgba(13, 110, 253, 0.12);
      --green: #198754;
      --green-soft: rgba(25, 135, 84, 0.12);
      --amber: #f59f00;
      --amber-soft: rgba(245, 159, 0, 0.12);
      --red: #dc3545;
      --red-soft: rgba(220, 53, 69, 0.12);
      --shadow: 0 8px 24px rgba(28, 39, 51, 0.08);
      --radius: 12px;
    }
    * { box-sizing: border-box; }
    html { color-scheme: light; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--text);
      font-family: "Source Sans 3", Inter, "Segoe UI", system-ui, sans-serif;
      background: linear-gradient(180deg, #f6f8fb, #f4f6f9 46%, #eef2f7);
      font-size: 16px;
      line-height: 1.45;
    }
    a { color: #0d6efd; text-decoration: none; }
    a:hover { color: #0a58ca; }
    button, input, select {
      font: inherit;
    }
    button, input, select, textarea {
      transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease, background .18s ease, opacity .18s ease;
    }
    button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
      outline: none;
      border-color: #53b4ff;
      box-shadow: 0 0 0 4px rgba(21,149,231,.14);
    }
    .page-shell {
      width: min(1400px, calc(100% - 28px));
      margin: 0 auto;
      padding: 14px 0 20px;
    }
    body.is-auth-page .page-shell {
      width: min(1440px, calc(100% - 24px));
      padding-top: 10px;
      padding-bottom: 24px;
    }
    .auth-topbar {
      position: sticky;
      top: 0;
      z-index: 40;
      border-bottom: 1px solid rgba(41, 91, 159, 0.18);
      background: linear-gradient(130deg, rgba(255,255,255,.93) 0%, rgba(241,248,255,.9) 70%, rgba(233,244,255,.9) 100%);
      backdrop-filter: blur(14px);
    }
    .auth-topbar__inner,
    .auth-footer-shell__inner {
      width: min(1440px, calc(100% - 24px));
      margin: 0 auto;
    }
    .auth-topbar__inner {
      min-height: 68px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .auth-brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: #173a6a;
      text-decoration: none;
    }
    .auth-brand__logo {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      font-weight: 800;
      color: #ffffff;
      background: linear-gradient(140deg, #2478d4, #0f56b3);
      box-shadow: 0 8px 18px rgba(22, 88, 174, 0.28);
    }
    .auth-brand__text {
      display: grid;
      gap: 2px;
      line-height: 1.1;
    }
    .auth-brand__text strong {
      font-size: .98rem;
      letter-spacing: .01em;
      color: #173a6a;
    }
    .auth-brand__text small {
      color: #5b7da8;
      font-size: .74rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .09em;
    }
    .auth-topbar__nav {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .auth-topbar__nav a {
      color: #2d5d9a;
      border: 1px solid rgba(32, 95, 186, 0.16);
      background: rgba(255,255,255,.66);
      border-radius: 999px;
      padding: 7px 12px;
      font-size: .8rem;
      font-weight: 700;
      text-decoration: none;
    }
    .auth-topbar__nav a:hover {
      color: #124f9f;
      border-color: rgba(32,95,186,.32);
      background: rgba(244,250,255,.95);
    }
    .auth-footer-shell {
      margin-top: 8px;
      padding: 6px 0 18px;
    }
    .auth-footer-shell__inner {
      border: 1px solid rgba(26, 111, 212, .14);
      background: rgba(255,255,255,.66);
      border-radius: 14px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      color: #4b6f9d;
      font-size: .8rem;
    }
    .auth-footer-shell__inner p {
      margin: 0;
      line-height: 1.5;
    }
    .auth-footer-shell__links {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .auth-footer-shell__links a {
      color: #1d5eb0;
      font-weight: 700;
      text-decoration: none;
    }
    .auth-footer-shell__links a:hover {
      color: #0e4b97;
      text-decoration: underline;
    }
    .member-app {
      display: grid;
      grid-template-columns: 260px minmax(0, 1fr);
      gap: 14px;
      align-items: start;
      min-height: calc(100vh - 28px);
    }
    .member-sidebar {
      position: sticky;
      top: 14px;
      display: grid;
      gap: 16px;
      padding: 14px 12px 12px;
      border-radius: 14px;
      background: linear-gradient(180deg, #343a40, #2f3640);
      border: 1px solid #3d4550;
      box-shadow: var(--shadow);
      min-height: calc(100vh - 28px);
    }
    .member-sidebar__brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .member-sidebar__logo {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      font-weight: 800;
      color: #fff;
      background: linear-gradient(135deg, #17a2b8, #0d6efd);
    }
    .member-sidebar__title {
      font-size: .98rem;
      font-weight: 800;
      line-height: 1.1;
      color: #ffffff;
    }
    .member-sidebar__subtitle {
      color: #adb5bd;
      font-size: .8rem;
      margin-top: 4px;
    }
    .member-sidebar__profile {
      display: grid;
      gap: 10px;
      padding: 14px;
      border-radius: 10px;
      background: rgba(0, 0, 0, 0.14);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .member-sidebar__avatar {
      width: 46px;
      height: 46px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      background: rgba(13, 110, 253, 0.2);
      color: #ffffff;
      font-size: 1.05rem;
      font-weight: 800;
    }
    .member-sidebar__profile-text {
      display: grid;
      gap: 4px;
    }
    .member-sidebar__profile-text strong {
      line-height: 1.2;
    }
    .member-sidebar__profile-text span {
      color: #c7d1db;
      font-size: .84rem;
      word-break: break-word;
    }
    .member-sidebar__badges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .member-sidebar__heading {
      padding: 0 10px;
      color: #93a1b1;
      font-size: .72rem;
      text-transform: uppercase;
      letter-spacing: .08em;
      font-weight: 700;
    }
    .member-sidebar__nav {
      display: grid;
      gap: 6px;
    }
    .member-nav {
      display: grid;
      gap: 4px;
      width: 100%;
      text-align: left;
      padding: 12px 14px;
      border-radius: 8px;
      border: 1px solid transparent;
      background: transparent;
      color: #b9c3ce;
      cursor: pointer;
      text-decoration: none;
    }
    .member-nav span {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      color: #d5dde6;
      font-size: .95rem;
    }
    .member-nav__dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.28);
      flex-shrink: 0;
    }
    .member-nav small {
      color: #9dabbb;
      font-size: .76rem;
      line-height: 1.45;
    }
    .member-nav:hover {
      background: rgba(255,255,255,.08);
      border-color: rgba(255,255,255,.1);
    }
    .member-nav.active {
      background: rgba(13,110,253,.18);
      border-color: rgba(13,110,253,.44);
      box-shadow: inset 3px 0 0 #0d6efd;
    }
    .member-nav.active .member-nav__dot {
      background: #8ec5ff;
    }
    .member-sidebar__footer {
      margin-top: auto;
      display: grid;
      gap: 12px;
    }
    .member-sidebar__footer-box {
      display: grid;
      gap: 6px;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(0, 0, 0, 0.14);
    }
    .member-sidebar__footer-box strong {
      line-height: 1.2;
    }
    .member-sidebar__footer-box span {
      color: #c7d1db;
      font-size: .84rem;
      line-height: 1.55;
    }
    .member-main {
      min-width: 0;
      display: grid;
      gap: 18px;
    }
    .member-topbar {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      padding: 14px 16px;
      background: #ffffff;
      border: 1px solid var(--line);
      border-radius: 12px;
      box-shadow: var(--shadow);
    }
    .member-topbar__left {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      min-width: 0;
    }
    .member-topbar__title {
      margin: 0;
      font-size: clamp(1.45rem, 2.2vw, 2.1rem);
      line-height: 1;
      letter-spacing: -.01em;
      color: #1f2d3d;
    }
    .member-topbar__subtitle {
      margin: 8px 0 0;
      color: var(--muted);
      max-width: 58ch;
      line-height: 1.45;
      font-size: .9rem;
    }
    .member-topbar__menu {
      display: none;
      width: 46px;
      height: 46px;
      padding: 0;
      border-radius: 8px;
      border: 1px solid var(--line);
      background: #ffffff;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 4px;
      cursor: pointer;
      flex-shrink: 0;
    }
    .member-topbar__menu span {
      display: block;
      width: 18px;
      height: 2px;
      background: #495057;
      border-radius: 999px;
    }
    .member-view {
      display: block;
    }
    .member-view.active {
      display: block;
    }
    .member-sidebar-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(23, 27, 33, 0.45);
      z-index: 15;
    }
    .member-sidebar-overlay.show {
      display: block;
    }
    .page-grid {
      display: grid;
      gap: 14px;
    }
    .view-stack {
      display: grid;
      gap: 14px;
    }
    .card {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      backdrop-filter: blur(12px);
    }
    .card-body {
      padding: 16px;
    }
    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
    }
    .section-title--tight {
      margin-bottom: 6px;
    }
    .section-title h2,
    .section-title h3 {
      margin: 0;
      line-height: 1.1;
      font-size: 1.3rem;
    }
    .section-title p {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: .89rem;
    }
    .topbar {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 22px;
    }
    .topbar h1 {
      margin: 0;
      font-size: clamp(2rem, 4vw, 3.4rem);
      line-height: .95;
      letter-spacing: -.04em;
    }
    .topbar p {
      margin: 12px 0 0;
      color: var(--muted);
      max-width: 56ch;
      line-height: 1.6;
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 10px;
      border-radius: 6px;
      font-size: .72rem;
      font-weight: 700;
      letter-spacing: .07em;
      text-transform: uppercase;
      background: #e9f2ff;
      border: 1px solid #c8ddff;
      color: #0d6efd;
      margin-bottom: 8px;
    }
    .button-row,
    .quick-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .btn {
      min-height: 38px;
      border-radius: 8px;
      border: 1px solid transparent;
      padding: 0 14px;
      font-weight: 600;
      cursor: pointer;
      color: #fff;
      font-size: .9rem;
    }
    .btn:hover { transform: translateY(-1px); box-shadow: 0 5px 14px rgba(31, 45, 61, 0.14); }
    .btn:disabled { opacity: .72; cursor: wait; transform: none; }
    .btn-primary {
      background: #0d6efd;
      border-color: #0b5ed7;
      box-shadow: none;
    }
    .btn-secondary {
      background: #6c757d;
      border-color: #6c757d;
    }
    .btn-soft {
      background: #ffffff;
      border-color: #ced4da;
      color: #495057;
    }
    .btn-danger {
      background: #dc3545;
      border-color: #bb2d3b;
      color: #fff;
    }
    .btn-block {
      width: 100%;
    }
    .hero-card {
      overflow: hidden;
      position: relative;
    }
    .hero-card::before {
      content: '';
      position: absolute;
      width: 300px;
      height: 300px;
      top: -130px;
      right: -110px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(13,110,253,.14), transparent 72%);
      pointer-events: none;
    }
    .hero-card .card-body {
      position: relative;
      z-index: 1;
    }
    .hero-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(280px, .8fr);
      gap: 18px;
      align-items: center;
    }
    .hero-metrics {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-top: 12px;
    }
    .metric-card {
      padding: 14px;
      border-radius: 10px;
      border: 1px solid var(--line);
      background: #f8faff;
      min-height: 92px;
    }
    .metric-card small {
      display: block;
      color: var(--muted);
      font-size: .72rem;
      text-transform: uppercase;
      letter-spacing: .06em;
      margin-bottom: 8px;
    }
    .metric-card strong {
      display: block;
      font-size: 1.26rem;
      line-height: 1.1;
      margin-bottom: 4px;
    }
    .metric-card span {
      color: var(--muted);
      font-size: .84rem;
      line-height: 1.4;
    }
    .hero-side {
      display: grid;
      gap: 10px;
    }
    .mode-banner {
      padding: 16px;
      border-radius: 10px;
      border: 1px solid var(--line);
      background: linear-gradient(180deg, #eaf3ff, #f6f9ff);
    }
    .mode-banner.package { background: linear-gradient(180deg, #fff5df, #fffaf0); }
    .mode-banner.balance { background: linear-gradient(180deg, #e9f8f1, #f4fcf8); }
    .mode-banner strong {
      display: block;
      font-size: 1.02rem;
      margin-bottom: 6px;
    }
    .mode-banner p {
      margin: 0;
      color: var(--muted);
      line-height: 1.45;
      font-size: .88rem;
    }
    .warning-note {
      padding: 13px 14px;
      border-radius: 10px;
      border: 1px solid #ffd08a;
      background: #fff8eb;
      color: #8a5b00;
      font-size: .86rem;
      line-height: 1.45;
    }
    .dashboard-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.15fr) minmax(320px, .85fr);
      gap: 18px;
      margin-top: 18px;
    }
    .stack {
      display: grid;
      gap: 18px;
    }
    .panel-list {
      display: grid;
      gap: 10px;
    }
    .panel-item {
      border: 1px solid var(--line);
      background: var(--panel-muted);
      border-radius: 10px;
      padding: 14px;
    }
    .panel-item strong {
      display: block;
      margin-bottom: 6px;
      line-height: 1.3;
    }
    .panel-item p,
    .panel-item div {
      color: var(--muted);
      line-height: 1.55;
      font-size: .88rem;
    }
    .apikey-card {
      border-color: #c9d9ea;
      background: linear-gradient(180deg, #ffffff, #f6faff);
      box-shadow: 0 10px 22px rgba(15, 23, 42, .06);
    }
    .apikey-secret {
      margin: 10px 0 12px;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid #bcd7f5;
      background: #edf5ff;
      color: #0b3b73;
      font-weight: 700;
      letter-spacing: .01em;
      word-break: break-all;
    }
    .apikey-actions {
      padding: 4px 2px 2px;
    }
    .apikey-actions .btn {
      min-height: 40px;
      border-radius: 10px;
      font-weight: 700;
    }
    .apikey-identity {
      border-color: #d6e2ef;
      background: #fbfdff;
    }
    .muted {
      color: var(--muted);
    }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      word-break: break-all;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 11px;
      border-radius: 999px;
      font-size: .72rem;
      font-weight: 700;
      letter-spacing: .04em;
      background: #e9f2ff;
      border: 1px solid #b9d4ff;
      color: #0d6efd;
    }
    .badge.success {
      color: #146c43;
      border-color: #a6e0c5;
      background: #e8f7ee;
    }
    .badge.warn {
      color: #8a5b00;
      border-color: #ffd58b;
      background: #fff4df;
    }
    .badge.danger {
      color: #842029;
      border-color: #f3b9bf;
      background: #fdebec;
    }
    .notice {
      display: none;
      margin-bottom: 16px;
      padding: 13px 14px;
      border-radius: 10px;
      border: 1px solid #9ec5fe;
      background: #e7f1ff;
      color: #084298;
    }
    .notice.is-success {
      border-color: #a3cfbb;
      background: #eaf8ef;
      color: #146c43;
    }
    .notice.is-error {
      border-color: #f1aeb5;
      background: #fbeaec;
      color: #842029;
    }
    .tab-nav {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 14px;
    }
    .tab-btn {
      min-height: 38px;
      border-radius: 8px;
      border: 1px solid var(--line);
      background: #ffffff;
      color: var(--muted);
      padding: 0 12px;
      font-weight: 700;
      cursor: pointer;
      font-size: .9rem;
    }
    .tab-btn.active {
      color: #0d6efd;
      border-color: #9ec5fe;
      background: #eaf2ff;
      box-shadow: inset 0 0 0 1px #cfe2ff;
    }
    .tab-pane { display: none; }
    .tab-pane.active { display: block; }
    .kv-grid {
      display: grid;
      gap: 10px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .kv-item {
      padding: 13px 14px;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: #ffffff;
    }
    .kv-item small {
      display: block;
      font-size: 12px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: .05em;
      margin-bottom: 6px;
    }
    .kv-item strong {
      display: block;
      font-size: .95rem;
      line-height: 1.35;
      word-break: break-word;
    }
    .form-grid {
      display: grid;
      gap: 12px;
    }
    .field {
      display: grid;
      gap: 7px;
    }
    .field label {
      font-size: .84rem;
      font-weight: 700;
      color: #334155;
    }
    .field small {
      color: var(--muted);
      font-size: .82rem;
    }
    .input,
    .select {
      width: 100%;
      min-height: 48px;
      border-radius: 8px;
      border: 1px solid var(--line);
      background: #ffffff;
      color: var(--text);
      padding: 0 14px;
    }
    .input::placeholder {
      color: #9aa8b5;
    }
    .field-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .history-list {
      display: grid;
      gap: 10px;
    }
    .history-item {
      display: grid;
      gap: 8px;
      padding: 14px;
      border-radius: 10px;
      border: 1px solid var(--line);
      background: #ffffff;
    }
    .history-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }
    .history-meta {
      font-size: .86rem;
      color: var(--muted);
      line-height: 1.55;
    }
    .period-stats {
      display: grid;
      gap: 10px;
      padding: 14px;
      border-radius: 10px;
      border: 1px solid var(--line);
      background: #ffffff;
    }
    .period-stats__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }
    .period-stats__head strong {
      font-size: .95rem;
      line-height: 1.2;
    }
    .period-stats__grid {
      display: grid;
      gap: 6px;
    }
    .period-stats__row {
      display: grid;
      grid-template-columns: 1.1fr .75fr .75fr .75fr .9fr;
      gap: 10px;
      align-items: center;
      padding: 8px 10px;
      border-radius: 8px;
      background: #f8faff;
      border: 1px solid #e3ecf7;
      font-size: .86rem;
    }
    .period-stats__row span:nth-child(2),
    .period-stats__row span:nth-child(3) {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .period-stats__row--head {
      background: #eef4ff;
      border-color: #d6e5ff;
      font-weight: 700;
      color: #355070;
      text-transform: uppercase;
      letter-spacing: .03em;
      font-size: .73rem;
    }
    .period-stats__row--price {
      grid-template-columns: minmax(140px, 1.2fr) minmax(90px, .7fr) minmax(130px, .95fr) minmax(110px, .75fr);
      gap: 12px;
    }
    .period-stats__row--price span:nth-child(2) {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-weight: 700;
      color: #1f2d3d;
    }
    .period-stats__row--price span:nth-child(3) {
      color: #495057;
      text-align: left;
    }
    .period-stats__row--price span:nth-child(4) {
      display: inline-flex;
      justify-content: flex-start;
    }
    .empty-state {
      padding: 18px;
      border-radius: 10px;
      border: 1px dashed var(--line-strong);
      background: #fafbfc;
      color: var(--muted);
      text-align: center;
      line-height: 1.6;
    }
    .security-grid {
      display: grid;
      gap: 12px;
    }
    .usage-bar {
      height: 8px;
      border-radius: 999px;
      background: #e9ecef;
      overflow: hidden;
      border: 1px solid var(--line);
    }
    .usage-bar > span {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, var(--green), var(--accent));
    }
    .method-select option {
      background: #ffffff;
      color: #1f2d3d;
    }
    .footer-hint {
      color: var(--muted);
      font-size: .84rem;
      line-height: 1.55;
    }
    .member-modal {
      position: fixed;
      inset: 0;
      z-index: 60;
      display: none;
    }
    .member-modal.show {
      display: block;
    }
    .member-modal__backdrop {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
    }
    .member-modal__dialog {
      position: relative;
      margin: 8vh auto 0;
      width: min(560px, calc(100% - 24px));
      border: 1px solid var(--line);
      border-radius: 10px;
      background: #fff;
      box-shadow: 0 24px 50px rgba(15, 23, 42, 0.22);
      overflow: hidden;
    }
    .member-modal__header,
    .member-modal__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
      background: #f8faff;
    }
    .member-modal__footer {
      border-top: 1px solid var(--line);
      border-bottom: none;
      justify-content: flex-end;
      background: #fff;
    }
    .member-modal__body {
      padding: 14px;
      display: grid;
      gap: 10px;
    }
    .qris-box {
      margin-top: 10px;
      padding: 12px;
      border: 1px solid #cfe2ff;
      border-radius: 10px;
      background: #f8fbff;
      display: inline-grid;
      gap: 8px;
      justify-items: center;
    }
    .qris-box__title {
      font-size: .82rem;
      font-weight: 700;
      color: #0d6efd;
    }
    .qris-box__image {
      width: 220px;
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      border: 1px solid #d5dbe3;
      background: #fff;
    }
    .auth-shell {
      min-height: calc(100vh - 96px);
      display: grid;
      align-items: center;
      position: relative;
      isolation: isolate;
    }
    .auth-shell::before {
      content: '';
      position: absolute;
      inset: -20px;
      z-index: -1;
      background:
        radial-gradient(500px 220px at 8% 8%, rgba(12, 74, 110, 0.15), transparent 68%),
        radial-gradient(420px 220px at 95% 95%, rgba(14, 116, 144, 0.1), transparent 72%),
        linear-gradient(180deg, #f8fafc, #eef2f7);
    }
    .auth-shell--login::before {
      background:
        radial-gradient(620px 280px at 0% 0%, rgba(2, 132, 199, .22), transparent 68%),
        radial-gradient(520px 260px at 100% 100%, rgba(14, 165, 233, .16), transparent 72%),
        linear-gradient(180deg, #f1f5f9, #e2e8f0);
    }
    .auth-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.08fr) minmax(320px, .92fr);
      gap: 18px;
      align-items: stretch;
    }
    .auth-copy {
      position: relative;
      overflow: hidden;
      border-color: #0f2f46;
      background: linear-gradient(155deg, #0b2236 0%, #123451 58%, #1b4a6f 100%);
      color: #e8f2fb;
    }
    .auth-shell--login .auth-copy {
      border-color: #0f3a52;
      background: linear-gradient(152deg, #081b2d 0%, #0d2d44 50%, #114562 100%);
      box-shadow: 0 20px 46px rgba(8, 27, 45, .28);
    }
    .auth-copy::before {
      content: '';
      position: absolute;
      top: -70px;
      right: -60px;
      width: 220px;
      height: 220px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(186, 230, 253, .3), transparent 72%);
      pointer-events: none;
    }
    .auth-copy::after {
      content: '';
      position: absolute;
      bottom: -90px;
      left: -80px;
      width: 240px;
      height: 240px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(14, 165, 233, .18), transparent 72%);
      pointer-events: none;
    }
    .auth-copy > * {
      position: relative;
      z-index: 1;
    }
    .auth-copy .card-body {
      padding: 26px;
    }
    .auth-copy h1 {
      margin: 0 0 12px;
      font-size: clamp(1.85rem, 3.5vw, 2.8rem);
      letter-spacing: -.02em;
      line-height: 1.02;
      color: #f8fbff;
    }
    .auth-copy p {
      color: #c8d9e8;
      line-height: 1.65;
      max-width: 42ch;
    }
    .auth-copy .eyebrow {
      background: rgba(147, 197, 253, 0.16);
      border-color: rgba(147, 197, 253, 0.35);
      color: #dbeafe;
    }
    .auth-copy .metric-card {
      background: rgba(248, 250, 252, 0.08);
      border-color: rgba(148, 163, 184, 0.32);
      color: #f8fafc;
    }
    .auth-copy .metric-card small,
    .auth-copy .metric-card span {
      color: #c7d8e8;
    }
    .auth-metrics {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-top: 8px;
    }
    .auth-panel {
      display: grid;
      gap: 18px;
      align-content: start;
      background: #ffffff;
      border-color: #d7e0ea;
    }
    .auth-shell--login .auth-panel {
      border-color: #cfe0f1;
      box-shadow: 0 16px 36px rgba(15, 23, 42, .1);
    }
    .auth-panel .card-body {
      padding: 24px;
    }
    .auth-panel h2 {
      color: #0f172a;
      letter-spacing: -.01em;
    }
    .auth-panel p {
      color: #64748b;
    }
    .auth-form {
      display: grid;
      gap: 14px;
    }
    .auth-form .input {
      min-height: 46px;
      border-color: #cbd5e1;
      background: #f8fafc;
    }
    .auth-form .input:focus {
      background: #ffffff;
      border-color: #38bdf8;
      box-shadow: 0 0 0 4px rgba(56, 189, 248, .14);
    }
    .auth-shell--login .btn-primary {
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      border-color: #0369a1;
      box-shadow: 0 10px 20px rgba(2, 132, 199, .24);
    }
    .auth-shell--login .btn-primary:hover {
      box-shadow: 0 14px 24px rgba(2, 132, 199, .32);
    }
    .auth-footer {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .auth-note {
      padding: 14px 16px;
      border-radius: 12px;
      border: 1px solid rgba(125, 211, 252, .28);
      background: rgba(15, 52, 79, .55);
    }
    .auth-note strong {
      display: block;
      margin-bottom: 6px;
      color: #eaf4ff;
    }
    .auth-shell--login .auth-note {
      border-color: rgba(125, 211, 252, .34);
      background: rgba(10, 38, 59, .62);
    }
    .auth-shell--login .auth-note strong {
      color: #f0f9ff;
    }
    .auth-shell--login .auth-note .panel-item {
      background: rgba(248, 250, 252, .08);
      border-color: rgba(148, 163, 184, .36);
    }
    .auth-shell--login .auth-note .panel-item strong {
      color: #e2f3ff;
    }
    .auth-shell--login .auth-note .panel-item div {
      color: #c7dced;
    }
    @media (max-width: 1080px) {
      .auth-topbar__inner {
        min-height: 62px;
      }
      .auth-topbar__nav {
        gap: 6px;
      }
      .auth-topbar__nav a {
        font-size: .76rem;
        padding: 6px 10px;
      }
      .auth-footer-shell__inner {
        flex-direction: column;
        align-items: flex-start;
      }
      .hero-grid,
      .dashboard-grid,
      .auth-grid {
        grid-template-columns: 1fr;
      }
      .hero-metrics {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .member-app {
        grid-template-columns: 1fr;
      }
      .member-sidebar {
        position: fixed;
        top: 16px;
        left: 16px;
        bottom: 16px;
        width: min(304px, calc(100vw - 32px));
        min-height: 0;
        z-index: 20;
        transform: translateX(calc(-100% - 24px));
        transition: transform .2s ease;
      }
      .member-sidebar.show {
        transform: translateX(0);
      }
      .member-topbar__menu {
        display: inline-flex;
      }
    }
    @media (max-width: 760px) {
      .auth-brand__text strong {
        font-size: .9rem;
      }
      .auth-topbar__inner,
      .auth-footer-shell__inner,
      body.is-auth-page .page-shell {
        width: calc(100% - 16px);
      }
      .page-shell {
        width: min(100% - 20px, 100%);
        padding: 16px 0 32px;
      }
      .button-row,
      .quick-actions,
      .auth-footer {
        flex-direction: column;
        align-items: stretch;
      }
      .hero-metrics,
      .field-row,
      .kv-grid,
      .auth-metrics {
        grid-template-columns: 1fr;
      }
      .period-stats__grid {
        gap: 10px;
      }
      .period-stats__row--head {
        display: none;
      }
      .period-stats__row {
        grid-template-columns: 1fr;
        gap: 8px;
        padding: 12px;
        border-radius: 10px;
      }
      .period-stats__row span {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        text-align: left !important;
      }
      .period-stats__row span::before {
        color: #64748b;
        font-size: .74rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .04em;
      }
      .period-stats__row span:first-child {
        font-weight: 700;
        color: #1f2d3d;
      }
      .period-stats__row span:first-child::before {
        content: 'Periode';
      }
      .period-stats__row span:nth-child(2)::before {
        content: 'Total';
      }
      .period-stats__row span:nth-child(3)::before {
        content: 'Sukses';
      }
      .period-stats__row span:nth-child(4)::before {
        content: 'Gagal';
      }
      .period-stats__row span:nth-child(5)::before {
        content: 'Konsumsi';
      }
      .period-stats__row--price span:first-child::before {
        content: 'Layanan';
      }
      .period-stats__row--price span:nth-child(2)::before {
        content: 'Harga';
      }
      .period-stats__row--price span:nth-child(3)::before {
        content: 'Satuan';
      }
      .period-stats__row--price span:nth-child(4)::before {
        content: 'Status';
      }
      .card-body {
        padding: 20px;
      }
      .metric-card {
        min-height: 0;
      }
      .member-topbar {
        flex-direction: column;
      }
      .member-topbar__left {
        width: 100%;
      }
    }
  `;
};
