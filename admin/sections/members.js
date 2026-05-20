/**
 * admin/sections/members.js
 * Member Management — pakai renderHero + renderCard dari admin/components/.
 * Semua ID DOM & class yang dipakai scripts.js dipertahankan persis:
 *   - #members-admin-search, #members-admin-search-meta, #members-admin-body
 *   - #memberAdminModal, #member-admin-id, #member-admin-name, #member-admin-wa
 *   - #member-admin-wallet, #member-admin-active, #member-admin-regip
 *   - #member-admin-pin, #member-admin-detail
 *   - .settings-members-table, .settings-member-modal, .settings-member-actions
 *   - onclick: loadMembersAdmin, filterMembersAdmin, resetMemberPin,
 *              saveMemberAdmin, blockMemberAdmin, regenerateMemberApiKey, resendMemberApiToWa
 */
const { renderHero, renderCard } = require('../components');

module.exports = function renderMembersSection() {

  // ── Hero ─────────────────────────────────────────────────────────────────
  const hero = renderHero({
    kicker:     'Portal Member',
    kickerIcon: 'bi-person-badge-fill',
    title:      'Member Management',
    desc:       'Kelola akun member portal: profil, wallet, status login, reset PIN, dan regenerate API key.',
    variant:    'indigo',
    badges: [
      { icon: 'bi-person-check',  text: 'Akun Portal' },
      { icon: 'bi-shield-lock',   text: 'PIN Security' },
      { icon: 'bi-wallet2',       text: 'Wallet Control' }
    ],
    actions: `
      <div class="d-flex flex-column gap-2">
        <button type="button" class="btn users-primary-action"
          onclick="loadMembersAdmin()">
          <i class="bi bi-arrow-repeat me-1"></i>Refresh Member
        </button>
      </div>`
  });

  // ── Table Card ────────────────────────────────────────────────────────────
  const tableCard = renderCard({
    icon:      'bi-people-fill',
    title:     'Daftar Member Portal',
    subtitle:  'Klik nama untuk edit detail, reset PIN, dan generate API key baru.',
    toolbar:   `<button type="button" class="btn btn-outline-secondary btn-sm"
                  onclick="loadMembersAdmin()">
                  <i class="bi bi-arrow-repeat me-1"></i>Refresh
                </button>`,
    bodyClass: 'p-0',
    body: `
      <!-- Search bar -->
      <div class="p-3 border-bottom">
        <div class="row g-2 align-items-center">
          <div class="col-12 col-md-8">
            <div class="input-group">
              <span class="input-group-text bg-transparent border-end-0">
                <i class="bi bi-search text-muted"></i>
              </span>
              <input type="text"
                id="members-admin-search"
                class="form-control border-start-0"
                placeholder="Cari nama, WA, member ID, API key, IP registrasi, mode, status..."
                oninput="filterMembersAdmin()">
            </div>
          </div>
          <div class="col-12 col-md-4 text-md-end">
            <small id="members-admin-search-meta" class="text-muted">
              Menampilkan 0 dari 0 member
            </small>
          </div>
        </div>
        <div class="mt-2" style="font-size:11px;color:var(--kr-muted);">
          Data khusus tabel <code>member_accounts</code>. User API tanpa akun portal hanya tampil di User Management.
        </div>
      </div>
      <!-- Table -->
      <div class="table-responsive">
        <table class="table table-hover align-middle settings-members-table mb-0">
          <thead>
            <tr>
              <th>Nama</th>
              <th>WA</th>
              <th>IP Daftar</th>
              <th>Mode</th>
              <th>Wallet</th>
              <th>API Key</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody id="members-admin-body">
            <tr>
              <td colspan="8" class="text-center py-4">
                <div class="kr-skeleton-row">
                  <span class="spinner-border spinner-border-sm text-secondary me-2"></span>
                  <span class="text-muted">Memuat data member...</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>`
  });

  // ── Edit Member Modal (ID & class wajib dipertahankan) ───────────────────
  const modal = `
  <div class="modal fade" id="memberAdminModal" tabindex="-1" aria-labelledby="memberAdminModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content settings-member-modal">
        <div class="modal-header">
          <h5 class="modal-title" id="memberAdminModalLabel">
            <i class="bi bi-person-lines-fill me-2"></i>Edit Member
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Tutup"></button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="member-admin-id">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Nama</label>
              <input type="text" class="form-control" id="member-admin-name" placeholder="Nama lengkap">
            </div>
            <div class="col-md-6">
              <label class="form-label">Nomor WA</label>
              <input type="text" class="form-control" id="member-admin-wa" placeholder="628xxx">
            </div>
            <div class="col-md-6">
              <label class="form-label">Wallet Balance (Rp)</label>
              <input type="number" class="form-control" id="member-admin-wallet" min="0" step="1">
            </div>
            <div class="col-md-6">
              <label class="form-label">Status Akun</label>
              <select class="form-select" id="member-admin-active">
                <option value="1">Aktif</option>
                <option value="0">Nonaktif</option>
              </select>
            </div>
            <div class="col-md-12">
              <label class="form-label">IP Registrasi</label>
              <input type="text" class="form-control" id="member-admin-regip" readonly>
              <div class="form-text">
                Jika satu IP dipakai beberapa akun, daftar member akan menampilkan ikon peringatan.
              </div>
            </div>
            <div class="col-md-12">
              <label class="form-label">Reset PIN Baru <span class="text-muted fw-normal">(opsional)</span></label>
              <div class="input-group">
                <input type="text" class="form-control" id="member-admin-pin"
                  placeholder="6 digit angka" maxlength="6" pattern="[0-9]{6}">
                <button type="button" class="btn btn-outline-warning" onclick="resetMemberPin()">
                  <i class="bi bi-shield-lock me-1"></i>Reset PIN
                </button>
              </div>
            </div>
            <div class="col-md-12">
              <div class="d-flex flex-wrap gap-2 settings-member-actions">
                <button type="button" class="btn btn-success-soft" onclick="saveMemberAdmin()">
                  <i class="bi bi-save me-1"></i>Simpan
                </button>
                <button type="button" class="btn btn-danger-soft" onclick="blockMemberAdmin()">
                  <i class="bi bi-slash-circle me-1"></i>Blokir
                </button>
                <button type="button" class="btn btn-outline-info" onclick="regenerateMemberApiKey()">
                  <i class="bi bi-arrow-repeat me-1"></i>Generate API Key Baru
                </button>
                <button type="button" class="btn btn-outline-primary" onclick="resendMemberApiToWa()">
                  <i class="bi bi-send me-1"></i>Kirim ke WA
                </button>
              </div>
            </div>
            <div class="col-12">
              <div id="member-admin-detail"
                class="rounded border p-3 small settings-member-detail"
                style="min-height:60px;">
                Memuat detail member...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  return `<!-- ============================= MEMBERS TAB ============================= -->
  <div id="main-members" class="main-tab-pane users-premium-shell" style="display:none;">

    ${hero}

    <div class="mt-4">${tableCard}</div>

  </div>

  ${modal}`;
};
