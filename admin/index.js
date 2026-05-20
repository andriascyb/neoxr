const { buildAdminRenderContext } = require('./helpers');
const renderDocumentStart   = require('./partials/document-start');
const renderDocumentEnd     = require('./partials/document-end');
const renderBodyShell       = require('./partials/body-shell');
const renderAdminFooter     = require('./partials/footer');
const renderAdminStyles     = require('./assets/styles');
const renderAdminScripts    = require('./assets/scripts');     // core + EXTRA bundle
const { renderNotifyScript } = require('./components/notify');

// ── Per-page script modules ───────────────────────────────────────────────
// Setiap modul hanya di-inject pada activePage yang sesuai.
// Core scripts.js tetap dipakai untuk semua halaman.
const renderWaSettingsScripts = require('./assets/scripts/wa-settings');
const renderSettingsScripts   = require('./assets/scripts/settings');
const renderTesterScripts     = require('./assets/scripts/tester');

// ── Section renderers ─────────────────────────────────────────────────────
const renderDashboardSection  = require('./sections/dashboard');
const renderLiveSection       = require('./sections/live');
const renderUsersSection      = require('./sections/users');
const renderMembersSection    = require('./sections/members');
const renderPackagesSection   = require('./sections/packages');
const renderServicesSection   = require('./sections/services');
const renderTesterSection     = require('./sections/tester');
const renderMySqlSection      = require('./sections/mysql');
const renderSettingsSection   = require('./sections/settings');
const renderVpsSection        = require('./sections/vps');
const renderRevenueSection    = require('./sections/revenue');
const renderRedisCacheSection = require('./sections/redis_cache');
const renderWaSettingsSection = require('./sections/wa_settings');

const SECTION_RENDERERS = {
  dashboard:    renderDashboardSection,
  live:         renderLiveSection,
  users:        renderUsersSection,
  members:      renderMembersSection,
  packages:     renderServicesSection,
  services:     renderServicesSection,
  tester:       renderTesterSection,
  mysql:        renderMySqlSection,
  revenue:      renderRevenueSection,
  'redis-cache': renderRedisCacheSection,
  'wa-settings': renderWaSettingsSection,
  settings:     renderSettingsSection,
  vps:          renderVpsSection
};

/**
 * Pilih script module tambahan berdasarkan halaman aktif.
 * Dengan cara ini setiap kunjungan halaman hanya membawa JS
 * yang relevan, bukan satu bundle 4.000+ baris.
 *
 * Mapping:
 *  wa-settings → renderWaSettingsScripts   (~250 baris)
 *  settings    → renderSettingsScripts     (~280 baris)
 *  tester      → renderTesterScripts       (~130 baris)
 *  lainnya     → '' (sudah cukup dengan core)
 */
function getPageScriptModule(page) {
  switch (page) {
    case 'wa-settings': return renderWaSettingsScripts();
    case 'settings':    return renderSettingsScripts();
    case 'tester':      return renderTesterScripts();
    default:            return '';
  }
}

function getAdminHTML(ADMIN_KEY, appStats, req, activePage = 'dashboard') {
  const ctx = buildAdminRenderContext(ADMIN_KEY, appStats, req);
  let resolvedPage = SECTION_RENDERERS[activePage] ? activePage : 'dashboard';
  try {
    const pathValue = String((req && (req.path || (req.originalUrl || '').split('?')[0])) || '').toLowerCase();
    const fromPath = pathValue.match(/^\/admin\/([a-z0-9-]+)$/);
    if (fromPath && fromPath[1]) {
      const routePage = fromPath[1] === 'packages' ? 'services' : fromPath[1];
      if (SECTION_RENDERERS[routePage]) resolvedPage = routePage;
    }
  } catch (e) {}

  const sectionRenderer = SECTION_RENDERERS[resolvedPage];
  const sectionHtml = (
    sectionRenderer === renderSettingsSection ||
    sectionRenderer === renderDashboardSection ||
    sectionRenderer === renderServicesSection ||
    sectionRenderer === renderWaSettingsSection
  ) ? sectionRenderer(ctx) : sectionRenderer();

  // Per-page JS module (empty string for pages that don't need extras)
  const pageModule = getPageScriptModule(resolvedPage);

  return [
    renderDocumentStart(),
    renderAdminStyles(),
    renderBodyShell(ctx),
    sectionHtml,
    renderAdminFooter({ ...ctx, activePage: resolvedPage }),
    '<script>',
    // 1. kNotify toast system (tiny, ~60 lines)
    renderNotifyScript(),
    // 2. Per-page JS module (wa-settings / settings / tester — 0 for others)
    pageModule ? '\n/* ── per-page module ── */\n' + pageModule : '',
    // 3. Core admin scripts (switchMainTab, polling loop, users, live, etc.)
    `\nwindow.__ADMIN_PAGE__=${JSON.stringify(resolvedPage)};\n`,
    renderAdminScripts({ ...ctx, activePage: resolvedPage }),
    '</script>',
    renderDocumentEnd()
  ].join('');
}

module.exports = { getAdminHTML };
