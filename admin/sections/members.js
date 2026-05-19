module.exports = function renderMembersSection() {
  return `
  <div id="main-members" class="main-tab-pane users-premium-shell" style="display:none;">
    <div class="users-hero-panel">
      <div class="users-hero-glow users-hero-glow-a"></div>
      <div class="users-hero-glow users-hero-glow-b"></div>
      <div class="users-hero-copy">
        <div class="users-eyebrow"><i class="bi bi-person-badge-fill"></i> Portal Member</div>
        <h2>Member Management</h2>
        <p>Kelola akun member portal: profil, wallet, status login, reset PIN, dan regenerate API key member.</p>
        <div class="users-hero-tags">
          <span><i class="bi bi-person-check"></i>Akun Portal</span>
          <span><i class="bi bi-shield-lock"></i>PIN Security</span>
          <span><i class="bi bi-wallet2"></i>Wallet Control</span>
        </div>
      </div>
      <div class="users-hero-actions">
        <button type="button" class="btn users-primary-action" onclick="loadMembersAdmin()"><i class="bi bi-arrow-repeat me-1"></i>Refresh Member</button>
      </div>
    </div>

    <div class="card mt-3 settings-card">
      <div class="card-header d-flex justify-content-between align-items-center settings-members-toolbar">
        <div>
          <span style="font-weight:700;">Daftar Member Portal</span>
          <div class="text-muted" style="font-size:12px;">Klik nama member untuk edit detail, reset PIN, dan generate API key baru.</div>
          <div class="text-muted mt-1" style="font-size:11px;">Catatan: data di sini khusus tabel <code>member_accounts</code> (akun portal). User API tanpa akun portal hanya tampil di User Management.</div>
        </div>
        <button type="button" class="btn btn-outline-info btn-sm" onclick="loadMembersAdmin()"><i class="bi bi-arrow-repeat me-1"></i>Refresh</button>
      </div>
      <div class="card-body border-bottom">
        <div class="row g-2 align-items-center">
          <div class="col-12 col-md-8">
            <input type="text" id="members-admin-search" class="form-control" placeholder="Cari nama, WA, member ID, API key, IP registrasi, mode, status..." oninput="filterMembersAdmin()">
          </div>
          <div class="col-12 col-md-4 text-md-end">
            <small id="members-admin-search-meta" class="text-muted">Menampilkan 0 dari 0 member</small>
          </div>
        </div>
      </div>
      <div class="card-body p-0">
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
              <tr><td colspan="8" class="text-center text-muted">Loading...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="memberAdminModal" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content settings-member-modal">
        <div class="modal-header">
          <h5 class="modal-title"><i class="bi bi-person-lines-fill me-2"></i>Edit Member</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="member-admin-id">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Nama</label>
              <input type="text" class="form-control" id="member-admin-name">
            </div>
            <div class="col-md-6">
              <label class="form-label">Nomor WA</label>
              <input type="text" class="form-control" id="member-admin-wa">
            </div>
            <div class="col-md-6">
              <label class="form-label">Wallet Balance</label>
              <input type="number" class="form-control" id="member-admin-wallet">
            </div>
            <div class="col-md-6">
              <label class="form-label">Status</label>
              <select class="form-select" id="member-admin-active">
                <option value="1">Aktif</option>
                <option value="0">Nonaktif</option>
              </select>
            </div>
            <div class="col-md-12">
              <label class="form-label">IP Registrasi</label>
              <input type="text" class="form-control" id="member-admin-regip" readonly>
              <div class="text-muted mt-1" style="font-size:11px;">Jika satu IP dipakai beberapa akun, daftar member akan menampilkan ikon peringatan.</div>
            </div>
            <div class="col-md-12">
              <label class="form-label">Reset PIN Baru (opsional)</label>
              <div class="input-group">
                <input type="text" class="form-control" id="member-admin-pin" placeholder="6 digit angka">
                <button type="button" class="btn btn-outline-warning" onclick="resetMemberPin()"><i class="bi bi-shield-lock me-1"></i>Reset PIN</button>
              </div>
            </div>
            <div class="col-md-12">
          <div class="d-flex gap-2 settings-member-actions">
                <button type="button" class="btn btn-success-soft" onclick="saveMemberAdmin()"><i class="bi bi-save me-1"></i>Simpan Member</button>
                <button type="button" class="btn btn-danger-soft" onclick="blockMemberAdmin()"><i class="bi bi-slash-circle me-1"></i>Blokir Member</button>
                <button type="button" class="btn btn-outline-info" onclick="regenerateMemberApiKey()"><i class="bi bi-arrow-repeat me-1"></i>Generate API Key Baru</button>
                <button type="button" class="btn btn-outline-primary" onclick="resendMemberApiToWa()"><i class="bi bi-send me-1"></i>Kirim Detail API ke WA</button>
              </div>
            </div>
            <div class="col-12">
              <div id="member-admin-detail" class="rounded border p-3 small settings-member-detail">
                Memuat detail member...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;
};
