const { renderSidebar } = require('./sidebar');
const { renderTopbar } = require('./topbar');
const { renderDashboardHomeSection } = require('../sections/dashboard-home');
const { renderDepositSection } = require('../sections/deposit');
const { renderApiKeySection } = require('../sections/apikey');
const { renderSecuritySection } = require('../sections/security');

const VIEW_SECTIONS = {
  dashboard: renderDashboardHomeSection,
  deposit: renderDepositSection,
  apikey: renderApiKeySection,
  security: renderSecuritySection
};

function renderDashboardShell(currentView = 'dashboard') {
  const view = VIEW_SECTIONS[currentView] ? currentView : 'dashboard';
  const renderSection = VIEW_SECTIONS[view];
  return `
    <div class="member-app">
      <div id="member-sidebar-overlay" class="member-sidebar-overlay" onclick="toggleMemberSidebar(false)"></div>
      ${renderSidebar(view)}
      <main class="member-main">
        ${renderTopbar()}
        ${renderSection()}
      </main>
    </div>
  `;
}

module.exports = { renderDashboardShell };
