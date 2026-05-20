/**
 * admin/layout/menu.js
 * Sumber data tunggal untuk sidebar admin.
 *
 * Setiap item harus mempertahankan `id` sesuai konvensi `nav-<page>` agar
 * compatible dengan window.switchMainTab() di admin/assets/scripts.js
 * (yang melakukan activateNav('nav-<page>') saat berpindah tab).
 *
 * Tiap entry juga membuat <a href="/admin/<page>?key=<ADMIN_KEY>"> sehingga
 * navigasi tetap bekerja walau JS dimatikan / pane belum di-render.
 *
 * Field:
 *   - id      : tab key (juga path segment di /admin/<id>)
 *   - label   : teks utama di sidebar
 *   - hint    : sub-label kecil (opsional, ditampilkan di bawah label)
 *   - icon    : kelas Bootstrap Icon (bi-...)
 *   - title   : judul yang ditampilkan di topbar saat tab aktif
 *
 * Untuk reorder/menambah/menyembunyikan menu cukup edit array ini.
 */

const ADMIN_MENU_GROUPS = [
  {
    title: 'Monitoring',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        hint: 'Ringkasan trafik harian',
        icon: 'bi-grid-1x2-fill',
        title: 'Monitoring Dashboard'
      },
      {
        id: 'live',
        label: 'Live Monitor',
        hint: 'Aktivitas real-time',
        icon: 'bi-broadcast-pin',
        title: 'Live Monitoring'
      },
      {
        id: 'users',
        label: 'User Management',
        hint: 'API Key & saldo user',
        icon: 'bi-people-fill',
        title: 'User Management (API)'
      },
      {
        id: 'members',
        label: 'Member Management',
        hint: 'Akun member portal',
        icon: 'bi-person-badge-fill',
        title: 'Member Management (Portal)'
      }
    ]
  },
  {
    title: 'Sistem',
    items: [
      {
        id: 'settings',
        label: 'Pengaturan',
        hint: 'Konfigurasi server & billing',
        icon: 'bi-gear-fill',
        title: 'Konfigurasi Sistem'
      },
      {
        id: 'tester',
        label: 'API Tester',
        hint: 'Health check provider',
        icon: 'bi-activity',
        title: 'API Health Tester'
      },
      {
        id: 'revenue',
        label: 'Pendapatan',
        hint: 'Analisa revenue',
        icon: 'bi-cash-stack',
        title: 'Analisa Pendapatan'
      },
      {
        id: 'services',
        label: 'Setingan Layanan',
        hint: 'Status & harga per service',
        icon: 'bi-sliders2-vertical',
        title: 'Setingan Layanan'
      },
      {
        id: 'wa-settings',
        label: 'Pengaturan WA',
        hint: 'Baileys, OTP, expiry notif',
        icon: 'bi-whatsapp',
        title: 'Pengaturan WA'
      },
      {
        id: 'mysql',
        label: 'Database',
        hint: 'Browser tabel & backup',
        icon: 'bi-database-fill',
        title: 'MySQL Management'
      },
      {
        id: 'redis-cache',
        label: 'Redis Cache',
        hint: 'Audit cache key',
        icon: 'bi-memory',
        title: 'Redis Cache Audit'
      },
      {
        id: 'vps',
        label: 'VPS Status',
        hint: 'CPU, memori, uptime',
        icon: 'bi-hdd-stack-fill',
        title: 'VPS Status'
      }
    ]
  }
];

function flattenAdminMenu() {
  const out = [];
  ADMIN_MENU_GROUPS.forEach((group) => {
    (group.items || []).forEach((item) => out.push(item));
  });
  return out;
}

function findAdminMenuItem(id) {
  return flattenAdminMenu().find((item) => item.id === id) || null;
}

module.exports = {
  ADMIN_MENU_GROUPS,
  flattenAdminMenu,
  findAdminMenuItem
};
