module.exports = function renderUsersSection(ctx = {}) {
  with (ctx) {
    return `<div id="main-users" class="main-tab-pane users-premium-shell" style="display:none;">
    <div class="users-hero-panel">
      <div class="users-hero-glow users-hero-glow-a"></div>
      <div class="users-hero-glow users-hero-glow-b"></div>
      <div class="users-hero-copy">
        <div class="users-eyebrow"><i class="bi bi-shield-lock-fill"></i> API Operations</div>
        <h2>User Management (API)</h2>
        <p>Kontrol API key, saldo, status akses, ID member, dan pengiriman detail WhatsApp dalam satu panel yang rapi.</p>
        <div class="users-hero-tags">
          <span><i class="bi bi-person-badge"></i> ID member tetap</span>
          <span><i class="bi bi-wallet2"></i> Saldo only</span>
          <span><i class="bi bi-lightning-charge"></i> Quick actions</span>
        </div>
      </div>
      <div class="users-hero-actions">
        <button class="btn users-primary-action" onclick="showAddUserModal()"><i class="bi bi-plus-lg me-1"></i>Tambah User</button>
        <button class="btn users-secondary-action" onclick="toggleShowExpired()"><i class="bi bi-eye-fill me-1"></i>Expired</button>
      </div>
    </div>

    <div class="users-insight-grid">
      <div class="users-insight-card">
        <div class="users-insight-icon"><i class="bi bi-key-fill"></i></div>
        <div><span>Total Saldo User</span><strong id="users-insight-total-balance">Rp 0</strong></div>
      </div>
      <div class="users-insight-card">
        <div class="users-insight-icon success"><i class="bi bi-cash-stack"></i></div>
        <div><span>Total User Active</span><strong id="users-insight-total-active">0 User</strong></div>
      </div>
      <div class="users-insight-card">
        <div class="users-insight-icon warn"><i class="bi bi-broadcast-pin"></i></div>
        <div><span>Total Hits</span><strong id="users-insight-total-hits">0 Hits</strong></div>
      </div>
    </div>

    <div class="users-insight-grid" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr));">
      <div class="users-insight-card">
        <div class="users-insight-icon" style="background:rgba(59,130,246,.18); color:#3b82f6;"><i class="bi bi-trophy-fill"></i></div>
        <div style="width:100%;">
          <span>Top 3 Saldo Terbanyak</span>
          <div id="users-top-balance-list" class="text-muted" style="font-size:12px; margin-top:8px;">Belum ada data.</div>
        </div>
      </div>
      <div class="users-insight-card">
        <div class="users-insight-icon" style="background:rgba(244,114,182,.18); color:#f472b6;"><i class="bi bi-graph-up-arrow"></i></div>
        <div style="width:100%;">
          <span>Top 3 Konsumsi Saldo (Total Hits)</span>
          <div id="users-top-usage-list" class="text-muted" style="font-size:12px; margin-top:8px;">Belum ada data.</div>
        </div>
      </div>
    </div>

    <div id="user-form-container" class="card users-form-card" style="display:none;">
      <div class="card-header users-card-header">
        <div>
          <span id="user-form-title" class="users-card-title">Tambah User</span>
          <div class="users-card-subtitle">Data ini akan dipakai untuk login API, saldo, dan monitoring admin.</div>
        </div>
        <button type="button" class="btn users-icon-btn" onclick="hideUserForm()" title="Tutup form"><i class="bi bi-x-lg"></i></button>
      </div>
      <div class="card-body">
        <form onsubmit="saveUser(event)" id="user-form">
          <input type="hidden" id="user-id"><input type="hidden" id="user-key-orig">
          <div class="users-form-grid">
            <div class="users-field-card users-field-wide">
              <label class="form-label">Nama User</label>
              <input type="text" class="form-control" id="user-name" required placeholder="Nama lengkap member">
            </div>
            <div class="users-field-card">
              <label class="form-label">Saldo <span id="user-balance-hint" class="text-muted" style="font-size:10px;">(wajib isi jika tanpa package)</span></label>
              <div class="input-group">
                <span class="input-group-text">Rp</span>
                <input type="number" class="form-control" id="user-balance" value="0" min="0">
              </div>
            </div>
            <div class="users-field-card users-field-wide">
              <label class="form-label">API Key</label>
              <div class="input-group">
                <input type="text" class="form-control" id="user-key" required placeholder="AUTO GENERATE">
                <button type="button" class="btn btn-outline-secondary" onclick="generateAPIKey()" title="Generate Random API Key">
                  <i class="bi bi-arrow-repeat"></i> Generate
                </button>
              </div>
            </div>
            <div class="users-field-card">
              <label class="form-label">Nomor WhatsApp</label>
              <input type="text" class="form-control" id="user-wa" placeholder="08xxxx / 62xxxx">
            </div>
            <div class="users-field-card">
              <label class="form-label">Mode Billing</label>
              <input type="text" class="form-control" value="Balance (Saldo Only)" readonly>
              <input type="hidden" id="user-pkg" value="">
            </div>
            <div class="users-field-card">
              <label class="form-label">Tipe Billing</label>
              <input type="text" class="form-control" value="balance" readonly>
              <input type="hidden" id="user-billing" value="balance">
            </div>
            <div class="users-field-card">
              <label class="form-label">Status</label>
              <select class="form-select" id="user-status">
                <option value="1">Aktif</option>
                <option value="0">Off</option>
              </select>
            </div>
            <div class="users-field-card">
              <label class="form-label">Masa Aktif (Hari)</label>
              <input type="number" class="form-control" id="user-expiry" value="30" min="1" required>
            </div>
          </div>
          <div class="users-form-actions">
            <button type="submit" class="btn users-primary-action"><i class="bi bi-check-lg me-1"></i>Simpan User</button>
            <button type="button" class="btn users-secondary-action" onclick="hideUserForm()"><i class="bi bi-x-lg me-1"></i>Batal</button>
          </div>
        </form>
      </div>
    </div>

    <div class="card users-table-card user-management-card">
      <div class="users-table-head">
        <div>
          <div class="users-card-title">Daftar API Key</div>
          <div class="users-card-subtitle">Klik nama user untuk melihat detail. Gunakan checklist untuk hapus massal secara terkontrol.</div>
        </div>
        <div class="users-table-badge"><i class="bi bi-stars"></i> Premium View</div>
      </div>
      <div class="users-toolbar-panel">
        <div class="users-search-wrap">
          <i class="bi bi-search"></i>
          <input type="text" class="form-control" id="searchUserInput" placeholder="Cari nama, ID member, atau API key..." onkeyup="filterUsers()">
        </div>
        <div class="users-toolbar-actions">
          <button id="btn-toggle-expired" class="btn btn-outline-secondary btn-sm text-nowrap users-toolbar-btn" onclick="toggleShowExpired()">
            <i class="bi bi-eye-fill me-1"></i>Tampilkan Expired
          </button>
          <button id="btn-toggle-select-users" class="btn btn-outline-warning btn-sm text-nowrap users-toolbar-btn" onclick="toggleUserSelectMode()">
            <i class="bi bi-check2-square me-1"></i>Mode Checklist
          </button>
          <button id="btn-delete-selected-users" class="btn btn-danger btn-sm text-nowrap users-toolbar-btn" onclick="deleteSelectedUsers()" style="display:none;">
            <i class="bi bi-trash me-1"></i>Hapus Terpilih
          </button>
          <button class="btn btn-primary btn-sm text-nowrap users-toolbar-btn users-add-btn" onclick="showAddUserModal()">
            <i class="bi bi-plus-lg me-1"></i>Tambah User
          </button>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive users-table-responsive">
          <table class="table table-hover align-middle mb-0 user-table users-premium-table">
            <thead>
              <tr>
                <th id="user-select-col-head" class="text-center" style="width: 5%; display:none;">
                  <input type="checkbox" class="form-check-input" id="users-select-all" onchange="toggleSelectAllUsers(this)">
                </th>
                <th class="ps-3" style="width: 28%;">User / API Key</th>
                <th style="width: 13%;">Mode</th>
                <th style="width: 14%;">Balance</th>
                <th style="width: 14%;">Expiry</th>
                <th class="text-center" style="width: 12%;">Status</th>
                <th class="text-end pe-3" style="width: 19%;">Aksi</th>
              </tr>
            </thead>
            <tbody id="user-table-body">
              <!-- User rows will be injected here -->
            </tbody>
          </table>
        </div>
        <div class="users-pagination-bar">
          <div id="user-pagination-info">Menampilkan 0 user</div>
          <nav class="users-pagination" id="user-pagination"></nav>
        </div>
      </div>
    </div>

    <div class="users-mobile-sticky-actions">
      <button class="btn btn-outline-secondary btn-sm" onclick="toggleShowExpired()"><i class="bi bi-eye-fill me-1"></i>Expired</button>
      <button class="btn btn-outline-warning btn-sm" onclick="toggleUserSelectMode()"><i class="bi bi-check2-square me-1"></i>Checklist</button>
      <button class="btn btn-primary btn-sm" onclick="showAddUserModal()"><i class="bi bi-plus-lg me-1"></i>Tambah</button>
    </div>
  </div>
  <div class="modal fade user-detail-premium-modal" id="userDetailModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content shadow-lg">
        <div class="modal-header border-0">
          <div>
            <div class="users-eyebrow"><i class="bi bi-person-lines-fill"></i> User Profile</div>
            <h5 class="modal-title fw-bold mb-0">Detail Profil User</h5>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-4">
          <div class="users-detail-hero">
            <div class="users-detail-avatar"><i class="bi bi-person-fill"></i></div>
            <div>
              <h4 id="det-name" class="mb-1 fw-bold">-</h4>
              <div id="det-status-badge">-</div>
            </div>
          </div>
          <div class="users-detail-grid">
            <div class="detail-row"><span class="detail-label">API Key</span><span class="detail-value text-primary font-monospace" id="det-key">-</span></div>
            <div class="detail-row"><span class="detail-label">ID Member</span><span class="detail-value" id="det-member-id">-</span></div>
            <div class="detail-row"><span class="detail-label">WhatsApp</span><span class="detail-value" id="det-wa">-</span></div>
            <div class="detail-row"><span class="detail-label">Paket Langganan</span><span class="detail-value" id="det-pkg">-</span></div>
            <div class="detail-row"><span class="detail-label">Saldo Saat Ini</span><span class="detail-value text-success" id="det-balance">-</span></div>
            <div class="detail-row"><span class="detail-label">Masa Berlaku</span><span class="detail-value" id="det-expiry">-</span></div>
            <div class="detail-row"><span class="detail-label">Total Penggunaan</span><span class="detail-value" id="det-hits">-</span></div>
            <div class="detail-row"><span class="detail-label">Terdaftar Sejak</span><span class="detail-value" id="det-created">-</span></div>
            <div class="detail-row"><span class="detail-label">Tipe Billing</span><span class="detail-value text-uppercase" id="det-billing">-</span></div>
          </div>
          <div class="mt-3">
            <div class="detail-label mb-2">Histori API Key</div>
            <div id="det-key-history" class="user-key-history-table-wrap">Belum ada histori.</div>
          </div>
        </div>
        <div class="modal-footer border-0">
          <button type="button" class="btn users-secondary-action btn-sm" data-bs-dismiss="modal">Tutup</button>
          <button type="button" class="btn users-primary-action btn-sm" id="det-resend-wa-btn"><i class="bi bi-send-fill me-1"></i>Kirim ulang detail API ke WA</button>
          <button type="button" class="btn btn-warning-soft btn-sm" id="det-edit-btn">Edit User</button>
        </div>
      </div>
    </div>
  </div>

  `;
  }
};
