const { renderMemberPage } = require('../render');
const { renderDashboardShell } = require('../layout/shell');
const renderDashboardScript = require('../assets/dashboard');

function renderDashboardPage(view = 'dashboard') {
  const initialScript = `window.__MEMBER_VIEW__ = ${JSON.stringify(view)};`;
  return renderMemberPage('Dashboard Member', renderDashboardShell(view), `${initialScript}\n${renderDashboardScript()}`);
}

module.exports = { renderDashboardPage };
