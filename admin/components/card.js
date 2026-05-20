/**
 * admin/components/card.js
 * Reusable card helper. Mempertahankan kelas Bootstrap `.card / .card-header /
 * .card-body / .card-footer` agar style eksisting (yang sudah override di
 * admin/assets/styles.js) tetap berlaku.
 *
 * Pemakaian:
 *   renderCard({
 *     title: 'Daftar Member Portal',
 *     icon: 'bi-people-fill',
 *     toolbar: '<button class="btn btn-sm btn-outline-info">Refresh</button>',
 *     body: '<table>...</table>',
 *     bodyClass: 'p-0',
 *     footer: '<small class="text-muted">Data dari member_accounts</small>'
 *   });
 */

function renderCard(opts = {}) {
  const titleHtml = opts.title
    ? `<span class="kr-card__title">${opts.icon ? `<i class="bi ${opts.icon}"></i>` : ''}<span>${opts.title}</span></span>`
    : '';
  const subtitleHtml = opts.subtitle ? `<small class="kr-card__subtitle">${opts.subtitle}</small>` : '';
  const toolbarHtml = opts.toolbar ? `<div class="kr-card__toolbar">${opts.toolbar}</div>` : '';
  const headerHtml = (titleHtml || subtitleHtml || toolbarHtml)
    ? `<div class="card-header kr-card__header">
         <div class="kr-card__heading">${titleHtml}${subtitleHtml}</div>
         ${toolbarHtml}
       </div>`
    : '';
  const footerHtml = opts.footer ? `<div class="card-footer kr-card__footer">${opts.footer}</div>` : '';
  const bodyClass = opts.bodyClass ? ` ${opts.bodyClass}` : '';
  const idAttr = opts.id ? ` id="${opts.id}"` : '';
  const extraClass = opts.className ? ` ${opts.className}` : '';

  return `
  <div class="card kr-card${extraClass}"${idAttr}>
    ${headerHtml}
    <div class="card-body kr-card__body${bodyClass}">${opts.body || ''}</div>
    ${footerHtml}
  </div>`;
}

module.exports = { renderCard };
