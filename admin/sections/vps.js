module.exports = function renderVpsSection(ctx = {}) {
  with (ctx) {
    return `<!-- ============================= VPS STATUS TAB ============================= -->
  <div id="main-vps" class="main-tab-pane vps-premium-pane" style="display:none;">
    <div class="vps-hero">
      <div>
        <div class="vps-hero-kicker"><i class="bi bi-hdd-stack-fill"></i> Infrastructure Monitor</div>
        <h2>VPS Status & Resource Monitoring</h2>
        <p>Pantau resource server, proses aktif, dan status layanan inti dalam satu panel operasional premium.</p>
      </div>
      <div class="vps-hero-badge" id="vps-last-update">Last update: -</div>
    </div>
    
    <!-- Primary Resource Row -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-md-4">
        <div class="card card-vps vps-metric-card h-100">
          <div class="card-body d-flex flex-column justify-content-center">
            <div class="d-flex align-items-center mb-2">
              <div class="icon-box" style="background:rgba(88,166,255,.1);color:#58a6ff;">
                <i class="bi bi-cpu fs-5"></i>
              </div>
              <div class="ms-3 overflow-hidden">
                <div class="vps-stat-label">Processor</div>
                <div class="vps-stat-value text-truncate" id="vps-cpu-model" title="CPU Model">Loading...</div>
              </div>
            </div>
            <div class="mt-2 pt-2 border-top" style="border-color:rgba(255,255,255,0.05)!important;">
              <div class="d-flex justify-content-between align-items-center">
                <span class="text-secondary" style="font-size:12px;" id="vps-cpu-cores">-</span>
                <span class="badge badge-blue" id="vps-cpu-load" style="font-size:11px;">Load: -</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-12 col-md-4">
        <div class="card card-vps vps-metric-card h-100">
          <div class="card-body">
            <div class="d-flex align-items-center mb-3">
              <div class="icon-box" style="background:rgba(63,185,80,.1);color:#3fb950;">
                <i class="bi bi-memory fs-5"></i>
              </div>
              <div class="ms-3">
                <div class="vps-stat-label">Memory Mapping</div>
                <div class="vps-stat-value" id="vps-mem-usage">-</div>
              </div>
            </div>
            <div id="vps-mem-text" style="font-size:11px; color:#8b949e; margin-bottom: 6px;">- / - MB</div>
            <div class="progress" style="height:6px;background:#0d1117;border-radius:10px;border:1px solid #30363d;">
              <div id="vps-mem-bar" class="progress-bar bg-success" style="width:0%"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-12 col-md-4">
        <div class="card card-vps vps-metric-card h-100">
          <div class="card-body d-flex flex-column justify-content-center text-center">
            <div class="vps-stat-label mb-1">System Uptime</div>
            <div class="vps-stat-value" id="vps-uptime" style="font-size:24px; letter-spacing:-0.5px;">-</div>
            <div class="text-secondary" style="font-size:10px;"><i class="bi bi-check-circle-fill text-success me-1"></i>Server active</div>
            <div class="mt-2 pt-2 border-top" style="border-color:rgba(255,255,255,0.05)!important;">
              <div style="font-size:12px; color:#8b949e;"><i class="bi bi-hdd-network me-1 text-info"></i><span id="vps-ip">-</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Secondary Resource Row -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-md-4">
        <div class="card card-vps vps-metric-card h-100">
          <div class="card-body">
            <div class="d-flex align-items-center mb-3">
              <div class="icon-box" style="background:rgba(249,115,22,.1);color:#fb923c;">
                <i class="bi bi-device-hdd fs-5"></i>
              </div>
              <div class="ms-3">
                <div class="vps-stat-label">Disk Storage</div>
                <div class="vps-stat-value" id="vps-disk-usage">-</div>
              </div>
            </div>
            <div id="vps-disk-text" style="font-size:11px; color:#8b949e; margin-bottom: 6px;">-</div>
            <div class="progress" style="height:6px;background:#0d1117;border-radius:10px;border:1px solid #30363d;">
              <div id="vps-disk-bar" class="progress-bar bg-warning" style="width:0%"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="card card-vps vps-metric-card h-100">
          <div class="card-body">
            <div class="d-flex align-items-center mb-3">
              <div class="icon-box" style="background:rgba(56,189,248,.1);color:#38bdf8;">
                <i class="bi bi-activity fs-5"></i>
              </div>
              <div class="ms-3">
                <div class="vps-stat-label">Network Traffic</div>
                <div class="vps-stat-value" id="vps-net-text" style="font-size:14px;">RX: - / TX: -</div>
              </div>
            </div>
            <div class="d-flex justify-content-between p-2 rounded" style="font-size:11px;color:#8b949e;background:rgba(0,0,0,0.2);">
              <span><i class="bi bi-cloud-download me-1"></i><span id="vps-net-rx-total">-</span></span>
              <span><i class="bi bi-cloud-upload me-1"></i><span id="vps-net-tx-total">-</span></span>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="card card-vps vps-metric-card h-100">
          <div class="card-body">
            <div class="d-flex align-items-center mb-2">
              <div class="icon-box" style="background:rgba(34,197,94,.1);color:#22c55e;">
                <i class="bi bi-shield-check fs-5"></i>
              </div>
              <div class="ms-3">
                <div class="vps-stat-label">Software Services</div>
                <div style="font-size:13px;font-weight:700;">
                  MySQL: <span id="vps-mysql-status" class="badge bg-secondary">-</span>
                  <span class="mx-1 text-muted">|</span>
                  WA: <span id="vps-wa-status" class="badge bg-secondary">-</span>
                </div>
              </div>
            </div>
            <div style="font-size:11px;color:#8b949e;margin-top:10px;">
              <span class="me-2">PID: <strong class="text-light" id="vps-pid">-</strong></span>
              <span>Uptime: <strong class="text-light" id="vps-proc-uptime">-</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-12 col-lg-6">
        <div class="card vps-surface-card h-100">
          <div class="card-header d-flex align-items-center justify-content-between">
            <span style="font-weight:600;"><i class="bi bi-list-task me-1"></i>Top Processes</span>
            <button class="btn btn-sm btn-outline-secondary" onclick="loadVPSStatus()"><i class="bi bi-arrow-repeat"></i></button>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive" style="max-height: 340px;">
              <table class="table vps-proc-table table-hover mb-0" style="font-size:13px;">
                <thead class="sticky-top vps-proc-head">
                  <tr>
                    <th class="ps-3">PID</th>
                    <th>Process</th>
                    <th>CPU</th>
                    <th>MEM</th>
                  </tr>
                </thead>
                <tbody id="vps-proc-body">
                  <tr><td colspan="4" class="text-center text-muted py-3">Loading...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-6">
        <div class="card vps-surface-card h-100">
          <div class="card-header"><span style="font-weight:600;"><i class="bi bi-lightning-charge-fill me-1"></i>Quick Actions</span></div>
          <div class="card-body">
            <div class="d-grid gap-2">
              <button class="btn btn-warning-soft" onclick="alert('WhatsApp internal (Baileys) sudah dihapus. Provider eksternal diatur dari menu Pengaturan.')"><i class="bi bi-whatsapp me-1"></i>Status WhatsApp Provider</button>
              <button class="btn btn-primary" onclick="syncDB()"><i class="bi bi-arrow-repeat me-1"></i>Sync DB Cache</button>
              <button class="btn btn-danger-soft" onclick="clearAllCaches()"><i class="bi bi-trash3-fill me-1"></i>Clear All Caches</button>
            </div>
            <div class="text-muted mt-3" style="font-size:12px;">Tidak ada tombol restart MySQL.</div>
          </div>
        </div>
      </div>
    </div>
  </div> <!-- /#main-vps -->

  <div class="modal fade" id="userDetailModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content shadow-lg">
        <div class="modal-header border-0">
          <h5 class="modal-title fw-bold">Detail Profil User</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-4">
          <div class="text-center mb-4">
            <div class="d-inline-flex align-items-center justify-content-center bg-primary rounded-circle mb-3" style="width:64px; height:64px; background: linear-gradient(135deg,#1f6feb,#388bfd) !important;">
              <i class="bi bi-person-fill fs-2 text-white"></i>
            </div>
            <h4 id="det-name" class="mb-1 fw-bold">-</h4>
            <div id="det-status-badge">-</div>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">API Key</span>
            <span class="detail-value text-primary font-monospace" id="det-key">-</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">WhatsApp</span>
            <span class="detail-value" id="det-wa">-</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Paket Langganan</span>
            <span class="detail-value" id="det-pkg">-</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Saldo Saat Ini</span>
            <span class="detail-value text-success" id="det-balance">-</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Masa Berlaku</span>
            <span class="detail-value" id="det-expiry">-</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Total Penggunaan</span>
            <span class="detail-value" id="det-hits">-</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Terdaftar Sejak</span>
            <span class="detail-value" id="det-created">-</span>
          </div>
          <div class="detail-row border-0">
            <span class="detail-label">Tipe Billing</span>
            <span class="detail-value text-uppercase" id="det-billing">-</span>
          </div>
        </div>
        <div class="modal-footer border-0">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Tutup</button>
          <button type="button" class="btn btn-primary btn-sm" id="det-resend-wa-btn"><i class="bi bi-send-fill me-1"></i>Kirim ulang detail API ke WA</button>
          <button type="button" class="btn btn-warning-soft btn-sm" id="det-edit-btn">Edit User</button>
        </div>
      </div>
    </div>
  </div><!-- /#userDetailModal -->

   <div class="modal fade" id="dbBrowserModal" tabindex="-1">
    <div class="modal-dialog modal-xl modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title fw-bold"><i class="bi bi-database me-2"></i>Browse Table: <span id="db-browser-table-name">-</span></h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-0">
          <div class="table-responsive" style="max-height: 70vh; min-height: 300px;">
            <table class="table table-dark table-hover mb-0" style="font-size: 13px;">
              <thead class="sticky-top bg-dark">
                <tr id="db-browser-thead">
                  <!-- Header columns dynamic -->
                </tr>
              </thead>
              <tbody id="db-browser-tbody">
                <!-- Rows dynamic -->
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer justify-content-between">
          <div class="text-muted" style="font-size: 12px;">Total: <span id="db-browser-total">-</span> rows</div>
          <div class="d-flex gap-2 align-items-center">
            <button class="btn btn-sm btn-outline-secondary" id="db-prev-page" onclick="changeDBPage(-1)"><i class="bi bi-chevron-left"></i></button>
            <span id="db-page-num" class="fw-bold">1</span>
            <button class="btn btn-sm btn-outline-secondary" id="db-next-page" onclick="changeDBPage(1)"><i class="bi bi-chevron-right"></i></button>
            <button type="button" class="btn btn-secondary btn-sm ms-2" data-bs-dismiss="modal">Tutup</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="dbEditorModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <form id="db-editor-form" onsubmit="saveDBRow(event)">
          <div class="modal-header">
            <h5 class="modal-title fw-bold"><i class="bi bi-pencil-square me-2"></i>Edit Row: <span id="db-editor-table-name">-</span></h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4" id="db-editor-fields">
            <!-- Fields dynamic -->
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Batal</button>
            <button type="submit" class="btn btn-primary btn-sm"><i class="bi bi-check-lg me-1"></i>Simpan Perubahan</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <div class="modal fade" id="bankRoutingModal" tabindex="-1">
    <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title fw-bold"><i class="bi bi-diagram-3-fill me-2"></i>Routing Bank per Server</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="row g-2 align-items-center mb-3">
            <div class="col-12 col-md-6">
              <input type="text" class="form-control" id="bank-routing-search" placeholder="Cari bank atau codeid...">
            </div>
            <div class="col-12 col-md-6 text-md-end">
              <span class="text-muted" style="font-size:12px;">Default: ON (jika tidak diubah)</span>
            </div>
          </div>
          <div class="table-responsive" style="max-height: 60vh;">
            <table class="table table-dark table-hover align-middle" style="font-size:13px;">
              <thead class="sticky-top bg-dark">
                <tr>
                  <th class="ps-3">Bank</th>
                  <th>CodeID</th>
                  <th class="text-center">Server 1</th>
                  <th class="text-center">Server 2</th>
                  <th class="text-center">Server 3</th>
                  <th class="text-center">Server 4</th>
                  <th class="text-center">Server 5</th>
                  <th class="text-center">Server 6</th>
                  <th class="text-center">Server 7</th>
                </tr>
              </thead>
              <tbody id="bank-routing-tbody">
                <tr><td colspan="9" class="text-center text-muted">Loading...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Tutup</button>
          <button type="button" class="btn btn-primary btn-sm" id="bank-routing-save-btn" onclick="saveBankRouting()">
            <i class="bi bi-floppy-fill me-1"></i>Simpan Routing
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="realtimeLogsModal" tabindex="-1">
    <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title fw-bold"><i class="bi bi-activity me-2"></i>API Logs Realtime: <span id="realtime-logs-type">-</span></h5>
          <div class="d-flex gap-2 align-items-center">
            <button type="button" class="btn btn-sm btn-outline-secondary" onclick="refreshRealtimeLogs()"><i class="bi bi-arrow-repeat"></i></button>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
        </div>
        <div class="modal-body">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <div class="text-muted" style="font-size:12px;">Menampilkan maksimal 20 data terbaru</div>
            <div class="text-muted" style="font-size:12px;">Update: <span id="realtime-logs-updated">-</span></div>
          </div>
          <div class="table-responsive" style="max-height: 60vh;">
            <table class="table table-dark table-hover align-middle mb-0" style="font-size:13px;">
              <thead class="sticky-top bg-dark">
                <tr>
                  <th class="ps-3">Time</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>API Key</th>
                  <th>IP</th>
                  <th>RT</th>
                  <th>Endpoint</th>
                  <th class="text-end pe-3">Detail</th>
                </tr>
              </thead>
              <tbody id="realtime-logs-body">
                <tr><td colspan="8" class="text-center text-muted py-3">Loading...</td></tr>
              </tbody>
            </table>
          </div>
          <div class="mt-3">
            <div class="text-muted" style="font-size:12px; margin-bottom:8px;">Detail</div>
            <div class="row g-3">
              <div class="col-12 col-lg-6">
                <div class="card bg-darker">
                  <div class="card-header" style="font-size:12px;">Request</div>
                  <div class="card-body">
                    <pre id="realtime-log-req" style="white-space:pre-wrap; word-break:break-word; font-size:12px; margin:0;">-</pre>
                  </div>
                </div>
              </div>
              <div class="col-12 col-lg-6">
                <div class="card bg-darker">
                  <div class="card-header" style="font-size:12px;">Response</div>
                  <div class="card-body">
                    <pre id="realtime-log-res" style="white-space:pre-wrap; word-break:break-word; font-size:12px; margin:0;">-</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <div class="text-muted" style="font-size:12px;">Auto refresh tiap 3 detik saat modal terbuka</div>
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Tutup</button>
        </div>
      </div>
    </div>
  </div>
  `;
  }
};
