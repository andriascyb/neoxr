const renderMemberStyles = require('./assets/styles');

function renderAuthChrome() {
  return `
  <header class="auth-topbar">
    <div class="auth-topbar__inner">
      <a class="auth-brand" href="/">
        <span class="auth-brand__logo">A3</span>
        <span class="auth-brand__text">
          <strong>API Checker v3.1</strong>
          <small>Member Access</small>
        </span>
      </a>
      <nav class="auth-topbar__nav" aria-label="Navigasi cepat">
        <a href="/">Public</a>
        <a href="/docs">Docs</a>
        <a href="/member/register">Register</a>
        <a href="/member/login">Login</a>
      </nav>
    </div>
  </header>
  `;
}

function renderAuthFooter() {
  const year = new Date().getFullYear();
  return `
  <footer class="auth-footer-shell">
    <div class="auth-footer-shell__inner">
      <p>&copy; ${year} API Checker v3.1. Member panel dengan alur aman dan ringan.</p>
      <div class="auth-footer-shell__links">
        <a href="/">Halaman Public</a>
        <a href="/docs">Dokumentasi</a>
      </div>
    </div>
  </footer>
  `;
}

function renderMemberPage(title, body, script = '', options = {}) {
  const useAuthChrome = !!options.authChrome;
  const pageClass = useAuthChrome ? 'is-auth-page' : '';
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700;800&family=Inter:wght@500;600;700&display=swap" rel="stylesheet">
  <style>${renderMemberStyles()}</style>
</head>
<body class="${pageClass}">
  ${useAuthChrome ? renderAuthChrome() : ''}
  <div class="page-shell">${body}</div>
  ${useAuthChrome ? renderAuthFooter() : ''}
  <script>${script}</script>
</body>
</html>`;
}

module.exports = { renderMemberPage };
