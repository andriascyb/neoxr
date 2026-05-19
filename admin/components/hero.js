/**
 * admin/components/hero.js
 * Komponen hero panel reusable untuk header section admin.
 * Tujuannya menggantikan markup hero yang tersebar (dash-hero, users-hero-panel,
 * settings-hero, live-hero, dll) dengan satu kelas .kr-hero + variant.
 *
 * Penggunaan minimal:
 *   renderHero({ kicker: 'Monitoring', title: 'Dashboard', desc: '...' });
 *
 * Penggunaan lengkap:
 *   renderHero({
 *     kicker: 'Service Billing',
 *     kickerIcon: 'bi-sliders2-vertical',
 *     title: 'Setingan Layanan',
 *     desc: 'Atur status, harga, dan cooldown.',
 *     variant: 'indigo',          // brand|indigo|emerald|amber|slate
 *     badges: [{ icon: 'bi-stars', text: 'Premium Control' }],
 *     actions: '<button class="btn btn-primary btn-sm">Refresh</button>'
 *   });
 *
 * Markup yang dihasilkan tidak menyentuh selector eksisting (dash-hero, dll).
 * Section lama tetap aman; helper ini disediakan agar refactor section
 * baru / migrasi berikutnya bisa konsisten.
 */

const VARIANT_CLASS = {
  brand: 'kr-hero--brand',
  indigo: 'kr-hero--indigo',
  emerald: 'kr-hero--emerald',
  amber: 'kr-hero--amber',
  slate: 'kr-hero--slate'
};

function renderHero(opts = {}) {
  const variant = VARIANT_CLASS[opts.variant] || VARIANT_CLASS.brand;
  const kicker = opts.kicker
    ? `<div class="kr-hero__kicker">${opts.kickerIcon ? `<i class="bi ${opts.kickerIcon}"></i>` : ''}<span>${opts.kicker}</span></div>`
    : '';
  const title = opts.title ? `<h2 class="kr-hero__title">${opts.title}</h2>` : '';
  const desc = opts.desc ? `<p class="kr-hero__desc">${opts.desc}</p>` : '';
  const badges = Array.isArray(opts.badges) && opts.badges.length
    ? `<div class="kr-hero__badges">${opts.badges.map((b) => `<span class="kr-hero__badge">${b.icon ? `<i class="bi ${b.icon}"></i>` : ''}${b.text || ''}</span>`).join('')}</div>`
    : '';
  const actions = opts.actions ? `<div class="kr-hero__actions">${opts.actions}</div>` : '';

  return `
  <section class="kr-hero ${variant}">
    <div class="kr-hero__orb kr-hero__orb--a"></div>
    <div class="kr-hero__orb kr-hero__orb--b"></div>
    <div class="kr-hero__content">
      ${kicker}
      ${title}
      ${desc}
      ${badges}
    </div>
    ${actions}
  </section>`;
}

module.exports = { renderHero };
