const { buildAdminRenderContext } = require('./helpers');
const renderDocumentStart = require('./partials/document-start');
const renderDocumentEnd = require('./partials/document-end');
const renderBodyShell = require('./partials/body-shell');
const renderAdminFooter = require('./partials/footer');
const renderAdminStyles = require('./assets/styles');
const renderAdminScripts = require('./assets/scripts');
const renderDashboardSection = require('./sections/dashboard');
const renderLiveSection = require('./sections/live');
const renderUsersSection = require('./sections/users');
const renderMembersSection = require('./sections/members');
const renderPackagesSection = require('./sections/packages');
const renderServicesSection = require('./sections/services');
const renderTesterSection = require('./sections/tester');
const renderMySqlSection = require('./sections/mysql');
const renderSettingsSection = require('./sections/settings');
const renderVpsSection = require('./sections/vps');
const renderRevenueSection = require('./sections/revenue');
const renderRedisCacheSection = require('./sections/redis_cache');
const renderWaSettingsSection = require('./sections/wa_settings');

const SECTION_RENDERERS = {
  dashboard: renderDashboardSection,
  live: renderLiveSection,
  users: renderUsersSection,
  members: renderMembersSection,
  packages: renderServicesSection,
  services: renderServicesSection,
  tester: renderTesterSection,
  mysql: renderMySqlSection,
  revenue: renderRevenueSection,
  'redis-cache': renderRedisCacheSection,
  'wa-settings': renderWaSettingsSection,
  settings: renderSettingsSection,
  vps: renderVpsSection
};

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
  const sectionHtml = sectionRenderer === renderSettingsSection || sectionRenderer === renderDashboardSection || sectionRenderer === renderServicesSection || sectionRenderer === renderWaSettingsSection
    ? sectionRenderer(ctx)
    : sectionRenderer();

  return [
    renderDocumentStart(),
    renderAdminStyles(),
    renderBodyShell(ctx),
    sectionHtml,
    renderAdminFooter({ ...ctx, activePage: resolvedPage }),
    '<script>',
    `window.__ADMIN_PAGE__=${JSON.stringify(resolvedPage)};\n` + renderAdminScripts({ ...ctx, activePage: resolvedPage }),
    '</script>',
    renderDocumentEnd()
  ].join('');
}

module.exports = { getAdminHTML };
