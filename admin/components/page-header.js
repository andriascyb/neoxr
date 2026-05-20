/**
 * admin/components/page-header.js
 * Komponen PageHeader sederhana — Claude-like.
 * Dipakai di halaman non-utama (settings, mysql, vps, redis, revenue)
 * sebagai pengganti hero section yang terlalu besar.
 *
 * Layout:
 *   [icon]  Title                           [actions]
 *           Subtitle / description
 *
 * @param {object} opts
 * @param {string} opts.icon       - Bootstrap Icon class, e.g. 'bi-gear-fill'
 * @param {string} opts.title      - Page title
 * @param {string} [opts.subtitle] - Short description
 * @param {string} [opts.actions]  - HTML for right-side action buttons
 */
function renderPageHeader(opts = {}) {
  const iconHtml = opts.icon
    ? `<span class="kr-ph__icon"><i class="bi ${opts.icon}"></i></span>`
    : '';
  const subtitleHtml = opts.subtitle
    ? `<p class="kr-ph__subtitle">${opts.subtitle}</p>`
    : '';
  const actionsHtml = opts.actions
    ? `<div class="kr-ph__actions">${opts.actions}</div>`
    : '';

  return `
  <div class="kr-page-header">
    <div class="kr-ph__left">
      ${iconHtml}
      <div class="kr-ph__copy">
        <h2 class="kr-ph__title">${opts.title || ''}</h2>
        ${subtitleHtml}
      </div>
    </div>
    ${actionsHtml}
  </div>`;
}

module.exports = { renderPageHeader };
