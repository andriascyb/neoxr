module.exports = function renderMySqlSection(ctx = {}) {
  with (ctx) {
    return `<div id="main-mysql" class="main-tab-pane mysql-premium-pane" style="display:none;">
    <div class="mysql-hero">
      <div>
        <div class="mysql-hero-kicker"><i class="bi bi-database-fill"></i> Database Control Center</div>
        <h2>MySQL Database Management</h2>
        <p>Kelola status koneksi, tabel, backup, dan audit log API dari satu dashboard yang lebih modern dan terstruktur.</p>
      </div>
      <button class="btn btn-primary mysql-hero-btn" onclick="loadMySQLInfo(); loadMySQLTables();"><i class="bi bi-arrow-repeat me-1"></i>Refresh Data</button>
    </div>
    
    <!-- Connection Status -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-md-6">
        <div class="card mysql-surface-card">
          <div class="card-header">Connection Status</div>
          <div class="card-body">
            <div id="mysql-conn-info" style="font-size:13px; line-height:1.8;">
              <div><strong>Status:</strong> <span id="mysql-status" class="badge badge-red">Checking...</span></div>
              <div><strong>Host:</strong> <span id="mysql-host">-</span></div>
              <div><strong>Database:</strong> <span id="mysql-db">-</span></div>
              <div><strong>Version:</strong> <span id="mysql-ver">-</span></div>
            </div>
            <button class="btn btn-primary btn-sm mt-3 w-100" onclick="loadMySQLInfo()">
              <i class="bi bi-arrow-repeat me-1"></i>Refresh Status
            </button>
          </div>
        </div>
      </div>
      
      <div class="col-12 col-md-6">
        <div class="card mysql-surface-card">
          <div class="card-header">Database Size</div>
          <div class="card-body">
            <div id="mysql-size-info" style="font-size:13px; line-height:1.8;">
              <div><strong>Total Size:</strong> <span id="mysql-total-size">-</span> MB</div>
              <div><strong>Tables:</strong> <span id="mysql-table-count">0</span></div>
            </div>
            <button class="btn btn-primary btn-sm mt-3 w-100" onclick="loadMySQLTables()">
              <i class="bi bi-list-check me-1"></i>View Tables
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tables Info -->
    <div class="section-title">Tables Information</div>
    <div class="card mysql-surface-card">
      <div class="card-header">Database Tables</div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th class="ps-3">Table Name</th>
                <th>Rows</th>
                <th>Size (MB)</th>
                <th>Created</th>
                <th class="text-end pe-3">Action</th>
              </tr>
            </thead>
            <tbody id="mysql-tables-body">
	              <tr><td colspan="5" class="text-center text-muted py-3">Loading...</td></tr>
	            </tbody>
	          </table>
	        </div>
	      </div>
	    </div>

    <!-- Backup Management -->
    <div class="section-title mt-4">Backup Management</div>
	    <div class="row g-3 mb-4">
	      <div class="col-12 col-md-6">
        <div class="card mysql-surface-card">
          <div class="card-body">
            <div style="font-size:13px; margin-bottom:12px;">
              <strong>Create Database Backup</strong><br/>
              <span class="text-muted">Backup terbaru disimpan sebagai file .sql di folder ./backups/</span>
            </div>
            <button class="btn btn-success-soft btn-sm w-100" onclick="createMySQLBackup()">
              <i class="bi bi-cloud-download me-1"></i>Create Backup Now
            </button>
          </div>
        </div>
      </div>
      
      <div class="col-12 col-md-6">
        <div class="card mysql-surface-card">
          <div class="card-body">
            <div style="font-size:13px; margin-bottom:12px;">
              <strong>View Backups</strong><br/>
              <span class="text-muted" id="backup-count">Loading...</span>
            </div>
            <button class="btn btn-primary btn-sm w-100" onclick="loadBackupList()">
              <i class="bi bi-list me-1"></i>View All Backups
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Backups List -->
    <div class="card mysql-surface-card">
      <div class="card-header">Available Backups</div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th class="ps-3">Filename</th>
                <th>Size (KB)</th>
                <th>Created</th>
                <th class="text-end pe-3">Action</th>
              </tr>
            </thead>
            <tbody id="mysql-backups-body">
              <tr><td colspan="4" class="text-center text-muted py-3">Click "View All Backups" to load</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Log Management -->
    <div class="section-title mt-4"><i class="bi bi-trash-fill me-1" style="color:#f85149;"></i>API Log Management</div>
    
    <div class="row g-3 mb-4">
      <div class="col-12 col-md-6">
        <div class="card mysql-surface-card">
          <div class="card-body">
            <div style="font-size:13px; margin-bottom:12px;">
              <strong>Log Statistics</strong><br/>
              <span class="text-muted" id="log-stat-text">Loading...</span>
            </div>
            <button class="btn btn-primary btn-sm w-100" onclick="loadLogStats()">
              <i class="bi bi-arrow-repeat me-1"></i>Refresh Stats
            </button>
          </div>
        </div>
      </div>
      
      <div class="col-12 col-md-4">
        <div class="card mysql-surface-card">
          <div class="card-body">
            <div style="font-size:13px; margin-bottom:12px;">
              <strong>Retention Period</strong><br/>
              <span class="text-muted">Currently: <strong id="log-retention-val">30 days</strong></span>
            </div>
	            <button class="btn btn-primary btn-sm w-100" onclick="showRetentionModal()">
	              <i class="bi bi-sliders me-1"></i>Set Retention
	            </button>
	          </div>
	        </div>
	      </div>
	    </div>

	  <!-- Log Stats Detail -->
    <div class="card mysql-surface-card mb-4">
      <div class="card-header">Log Statistics Detail</div>
      <div class="card-body">
        <div class="row g-3">
          <div class="col-6 col-md-3">
            <div style="font-size:12px; color:#8b949e; margin-bottom:4px;">Total Logs</div>
            <div style="font-size:22px; font-weight:700;" id="log-total-count">-</div>
          </div>
          <div class="col-6 col-md-3">
            <div style="font-size:12px; color:#8b949e; margin-bottom:4px;">API Keys</div>
            <div style="font-size:22px; font-weight:700;" id="log-unique-keys">-</div>
          </div>
          <div class="col-6 col-md-3">
            <div style="font-size:12px; color:#8b949e; margin-bottom:4px;">Size (MB)</div>
            <div style="font-size:22px; font-weight:700;" id="log-size-mb">-</div>
          </div>
          <div class="col-6 col-md-3">
            <div style="font-size:12px; color:#8b949e; margin-bottom:4px;">Oldest Log</div>
            <div style="font-size:11px; font-weight:600;" id="log-oldest-date">-</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Retention Modal -->
    <div class="modal-overlay" id="modal-retention">
      <div class="modal-box">
        <h5>Set API Log Retention</h5>
        <p class="text-muted" style="font-size:13px;">Berapa lama log API disimpan sebelum dihapus otomatis? (0 = tidak dihapus)</p>
        <div class="mb-3">
          <label class="form-label">Hari (Days)</label>
          <input type="number" id="input-retention-days" class="form-control" min="0" value="30">
        </div>
        <div class="d-flex justify-content-end gap-2 mt-4">
          <button class="btn btn-secondary" onclick="document.getElementById('modal-retention').classList.remove('show')">Batal</button>
          <button class="btn btn-primary" onclick="saveRetention()">Simpan</button>
        </div>
      </div>
    </div>


    <div class="section-title">Logs per API Key</div>
    <div class="card mysql-surface-card">
      <div class="card-header d-flex align-items-center justify-content-between">
        <span style="font-weight:600;">API Key Log Count</span>
        <button class="btn btn-primary btn-sm" onclick="loadLogsPerKey()"><i class="bi bi-arrow-repeat me-1"></i>Refresh</button>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th class="ps-3">API Key</th>
                <th>Log Count</th>
                <th>Size (KB)</th>
                <th>Last Log</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="logs-per-key-body">
              <tr><td colspan="5" class="text-center text-muted py-3">Loading...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="section-title mt-4" style="color:#f85149;">Danger Zone</div>
    <div class="card mysql-surface-card mysql-danger-card" style="border-color:rgba(248,81,73,.3);">
      <div class="card-body">
        <div class="row g-2">
          <div class="col-12">
            <button class="btn btn-danger-soft w-100 mb-2" onclick="triggerLogCleanup()">
              <i class="bi bi-lightning-fill me-1"></i>Cleanup Old Logs Now
            </button>
            <small class="text-muted">Delete logs older than retention period immediately</small>
          </div>
          <div class="col-12 col-md-6">
            <button class="btn btn-danger-soft w-100" onclick="deleteLogsPerKey()">
              <i class="bi bi-trash me-1"></i>Delete Specific API Key Logs
            </button>
          </div>
          <div class="col-12 col-md-6">
            <button class="btn btn-danger-soft w-100" onclick="deleteAllLogs()">
              <i class="bi bi-trash-fill me-1"></i>Delete ALL Logs
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MySQL Credentials -->
    <div class="section-title mt-4">MySQL Configuration</div>
	    <div class="card mysql-surface-card">
	      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Host</label>
            <input type="text" class="form-control" id="mysql-config-host" readonly>
          </div>
          <div class="col-md-6">
            <label class="form-label">Port</label>
            <input type="text" class="form-control" id="mysql-config-port" readonly>
          </div>
          <div class="col-md-6">
            <label class="form-label">Database</label>
            <input type="text" class="form-control" id="mysql-config-db" readonly>
          </div>
          <div class="col-md-6">
            <label class="form-label">User</label>
            <input type="text" class="form-control" id="mysql-config-user" readonly>
	        </div>
	      </div>
	    </div>

	    <!-- Database Browser Modal -->
	    <div class="modal fade" id="dbBrowserModal" tabindex="-1" aria-hidden="true">
	      <div class="modal-dialog modal-xl modal-dialog-scrollable">
	        <div class="modal-content">
	          <div class="modal-header">
	            <h5 class="modal-title">
	              <i class="bi bi-table me-2"></i>Browse Table: <span id="db-browser-table-name">-</span>
	            </h5>
	            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
	          </div>
	          <div class="modal-body p-0">
	            <div class="table-responsive">
	              <table class="table table-hover mb-0">
	                <thead>
	                  <tr id="db-browser-thead"></tr>
	                </thead>
	                <tbody id="db-browser-tbody">
	                  <tr><td class="text-center text-muted py-3">Loading...</td></tr>
	                </tbody>
	              </table>
	            </div>
	          </div>
	          <div class="modal-footer d-flex justify-content-between align-items-center">
	            <div class="small text-muted">Total rows: <span id="db-browser-total">0</span></div>
	            <div class="d-flex align-items-center gap-2">
	              <button type="button" class="btn btn-outline-secondary btn-sm" id="db-prev-page" onclick="changeDBPage(-1)">Prev</button>
	              <span class="small fw-semibold" id="db-page-num">1 / 1</span>
	              <button type="button" class="btn btn-outline-secondary btn-sm" id="db-next-page" onclick="changeDBPage(1)">Next</button>
	            </div>
	          </div>
	        </div>
	      </div>
	    </div>

	    <!-- Database Editor Modal -->
	    <div class="modal fade" id="dbEditorModal" tabindex="-1" aria-hidden="true">
	      <div class="modal-dialog modal-lg modal-dialog-scrollable">
	        <div class="modal-content">
	          <div class="modal-header">
	            <h5 class="modal-title">
	              <i class="bi bi-pencil-square me-2"></i>Edit Row: <span id="db-editor-table-name">-</span>
	            </h5>
	            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
	          </div>
	          <form onsubmit="saveDBRow(event)">
	            <div class="modal-body">
	              <div id="db-editor-fields"></div>
	            </div>
	            <div class="modal-footer">
	              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
	              <button type="submit" class="btn btn-primary">Save Changes</button>
	            </div>
	          </form>
	        </div>
	      </div>
	    </div>
	  </div>
	  </div>
  </div>

  `;
  }
};
