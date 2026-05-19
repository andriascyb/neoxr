module.exports = function renderWaSettingsSection(ctx = {}) {
  with (ctx) {
    const esc = (v) => String(v === undefined || v === null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return `
  <div id="main-wa-settings" class="main-tab-pane settings-premium-pane premium-settings-form wa-premium-pane" style="display:none;">
    <div class="settings-hero">
      <div>
        <div class="settings-hero-kicker"><i class="bi bi-whatsapp"></i> WhatsApp Center</div>
        <h2>Pengaturan WA</h2>
        <p>Kelola template welcome user dan peringatan saldo rendah WhatsApp dalam satu halaman khusus.</p>
      </div>
      <div class="settings-hero-badge"><i class="bi bi-chat-dots"></i><span>WA Reminder</span></div>
    </div>

    <div class="card settings-card mb-3">
      <div class="card-body py-2">
        <div class="d-flex flex-wrap gap-2">
          <button type="button" class="btn btn-primary btn-sm wa-center-tab-btn" id="wa-center-tab-btn-settings" onclick="switchWaCenterTab('settings')">
            <i class="bi bi-sliders2-vertical me-1"></i>Setting WA
          </button>
          <button type="button" class="btn btn-outline-secondary btn-sm wa-center-tab-btn" id="wa-center-tab-btn-logs" onclick="switchWaCenterTab('logs')">
            <i class="bi bi-journal-text me-1"></i>Log OTP & Pesan WA
          </button>
          <button type="button" class="btn btn-outline-secondary btn-sm wa-center-tab-btn" id="wa-center-tab-btn-inbound" onclick="switchWaCenterTab('inbound')">
            <i class="bi bi-inbox me-1"></i>Log Pesan Masuk OTP
          </button>
        </div>
      </div>
    </div>

    <div id="wa-center-pane-settings" class="wa-center-pane">
    <div class="card settings-card wa-premium-card mb-3">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <div class="wa-control-panel h-100">
              <div class="wa-control-title"><i class="bi bi-shield-check"></i> Kontrol Internal Baileys</div>
              <div class="wa-control-copy">Dipakai untuk OTP masuk dan notifikasi, bukan jalur validasi utama.</div>
              <div class="d-grid gap-2 mt-3">
                <button class="btn btn-success-soft btn-sm" onclick="restartWA()"><i class="bi bi-play-fill me-1"></i>Connect / Restart</button>
                <button class="btn btn-danger-soft btn-sm" onclick="logoutWA()"><i class="bi bi-box-arrow-right me-1"></i>Logout & Reset Session</button>
                <button class="btn btn-outline-secondary btn-sm" onclick="resetWA()"><i class="bi bi-arrow-clockwise me-1"></i>Refresh QR</button>
              </div>
            </div>
          </div>
          <div class="col-md-8">
            <div class="wa-login-panel h-100">
              <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <div>
                  <div class="wa-login-title">Login Baileys</div>
                  <div class="wa-login-subtitle">Pilih QR scan atau pairing code nomor WhatsApp.</div>
                </div>
                <span id="wa-qr-status" class="wa-status-chip">Menunggu status...</span>
              </div>
              <div class="row g-2 mb-3">
                <div class="col-md-8">
                  <input id="wa-pairing-number" type="text" class="form-control form-control-sm" placeholder="Nomor untuk Pairing Code (628...)" value="${esc((req && req.appConfig && req.appConfig.member_register_otp_target_number) || '')}">
                </div>
                <div class="col-md-4 d-grid">
                  <button type="button" class="btn btn-outline-primary btn-sm" onclick="generateWaPairingCode()"><i class="bi bi-key me-1"></i>Generate Kode</button>
                </div>
              </div>
              <div id="wa-pairing-code-view" class="wa-pairing-code-box mb-3">
                <span class="wa-pairing-label">Pairing Code</span>
                <strong>-</strong>
                <small>Generate kode lalu masukkan di WhatsApp: Perangkat tertaut.</small>
              </div>
              <div id="wa-qr-wrap" class="wa-qr-wrap">
                <div class="text-muted" style="font-size:12px;">QR belum tersedia</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="card settings-card wa-premium-card">
      <div class="card-body">
        <form id="wa-settings-form" action="/admin/save" method="POST" onsubmit="saveSettings(event)">
          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label">Aktifkan Notifikasi via WA</label>
              <select class="form-select" name="wa_notify_enabled">
                <option value="1" ${(req && req.appConfig && parseInt(req.appConfig.wa_notify_enabled, 10) === 1) ? 'selected' : ''}>Enabled</option>
                <option value="0" ${(req && req.appConfig && parseInt(req.appConfig.wa_notify_enabled, 10) === 0) ? 'selected' : ''}>Disabled</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Interval Cek Notifikasi (opsional)</label>
              <input type="number" class="form-control" name="wa_notify_days_before" value="${(req && req.appConfig && req.appConfig.wa_notify_days_before) || 2}">
            </div>
            <div class="col-md-6">
              <label class="form-label">Registrasi Wajib OTP via WA</label>
              <select class="form-select" name="member_register_require_otp">
                <option value="1" ${(req && req.appConfig && Number(req.appConfig.member_register_require_otp || 0) === 1) ? 'selected' : ''}>Enabled</option>
                <option value="0" ${(req && req.appConfig && Number(req.appConfig.member_register_require_otp || 0) !== 1) ? 'selected' : ''}>Disabled</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Nomor WA Admin (Tujuan Kirim OTP User)</label>
              <input type="text" class="form-control" name="member_register_otp_target_number" value="${esc((req && req.appConfig && req.appConfig.member_register_otp_target_number) || '')}" placeholder="62812xxxxxxx">
            </div>
            <div class="col-md-3">
              <label class="form-label">OTP Expiry (menit)</label>
              <input type="number" class="form-control" name="wa_otp_expiry_minutes" value="${(req && req.appConfig && req.appConfig.wa_otp_expiry_minutes) || 5}">
            </div>
            <div class="col-md-3">
              <label class="form-label">Maks. Salah OTP</label>
              <input type="number" class="form-control" name="wa_otp_max_attempts" value="${(req && req.appConfig && req.appConfig.wa_otp_max_attempts) || 5}">
            </div>
          </div>

          <div class="row g-3 mb-3">
            <div class="col-md-12">
              <label class="form-label">Template Premium: Welcome User</label>
              <textarea class="form-control wa-template-editor" name="wa_template_new_user" rows="7">${esc((req && req.appConfig && req.appConfig.wa_template_new_user) || '')}</textarea>
              <div class="text-muted mt-1" style="font-size:11px;">Variable: {name} {api_key} {balance} {base_url}</div>
            </div>
          </div>

          <div class="row g-3">
            <div class="col-md-12">
              <label class="form-label">Template Premium: Peringatan Saldo Rendah</label>
              <textarea class="form-control wa-template-editor" name="wa_template_expiry_2d" rows="8">${esc((req && req.appConfig && req.appConfig.wa_template_expiry_2d) || '')}</textarea>
              <div class="text-muted mt-1" style="font-size:11px;">Variable: {name} {balance} {threshold} {base_url}</div>
              <div class="text-muted mt-1" style="font-size:11px;">Trigger otomatis saat saldo turun melewati: 5.000, 4.000, 3.000, 2.000, 1.000.</div>
            </div>
          </div>

          <div class="d-flex gap-2 mt-4 settings-actionbar">
            <button type="submit" class="btn btn-primary"><i class="bi bi-floppy me-1"></i>Simpan Pengaturan WA</button>
            <button type="button" class="btn btn-outline-secondary" onclick="window.location.reload()"><i class="bi bi-arrow-counterclockwise me-1"></i>Refresh</button>
          </div>
        </form>
      </div>
    </div>
    </div>

    <div id="wa-center-pane-logs" class="wa-center-pane" style="display:none;">
    <div class="card settings-card mt-3">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div>
            <h5 class="mb-1">Log OTP & Pesan WA</h5>
            <div class="text-muted" style="font-size:12px;">Pantau pesan masuk user (OTP) dan pesan keluar (notif/OTP instruction).</div>
          </div>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="clearWaOtpLogs()"><i class="bi bi-trash me-1"></i>Bersihkan</button>
            <button type="button" class="btn btn-outline-secondary btn-sm" onclick="loadWaOtpLogs(1)"><i class="bi bi-arrow-repeat me-1"></i>Refresh Log</button>
          </div>
        </div>
        <div class="row g-2 mb-3">
          <div class="col-md-3">
            <select id="wa-log-direction" class="form-select form-select-sm">
              <option value="">Semua Arah</option>
              <option value="inbound">Masuk</option>
              <option value="outbound">Keluar</option>
            </select>
          </div>
          <div class="col-md-3">
            <input id="wa-log-number" class="form-control form-control-sm" placeholder="Filter nomor (628...)">
          </div>
          <div class="col-md-3">
            <input id="wa-log-status" class="form-control form-control-sm" placeholder="Filter status (verified/sent/failed)">
          </div>
          <div class="col-md-3">
            <button type="button" class="btn btn-primary btn-sm w-100" onclick="loadWaOtpLogs(1)">Terapkan Filter</button>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Arah</th>
                <th>Nomor</th>
                <th>Tipe</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Pesan</th>
              </tr>
            </thead>
            <tbody id="wa-otp-logs-body">
              <tr><td colspan="7" class="text-center text-muted">Belum dimuat.</td></tr>
            </tbody>
          </table>
        </div>
        <div id="wa-otp-logs-pagination" class="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-2">
          <small id="wa-otp-logs-meta" class="text-muted">Belum ada data.</small>
          <div id="wa-otp-logs-pages" class="btn-group btn-group-sm" role="group" aria-label="Pagination Log OTP"></div>
        </div>
      </div>
    </div>
    </div>

    <div id="wa-center-pane-inbound" class="wa-center-pane" style="display:none;">
    <div class="card settings-card mt-3">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div>
            <h5 class="mb-1">Log Pesan Masuk OTP</h5>
            <div class="text-muted" style="font-size:12px;">Audit khusus pesan OTP masuk: format valid, cocok OTP, mismatch, atau tanpa sesi pending.</div>
          </div>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="clearWaInboundOtpLogs()"><i class="bi bi-trash me-1"></i>Bersihkan</button>
            <button type="button" class="btn btn-outline-secondary btn-sm" onclick="loadWaInboundOtpLogs(1)"><i class="bi bi-arrow-repeat me-1"></i>Refresh</button>
          </div>
        </div>
        <div class="row g-2 mb-3">
          <div class="col-md-4">
            <input id="wa-inbound-log-number" class="form-control form-control-sm" placeholder="Filter nomor (628...)">
          </div>
          <div class="col-md-4">
            <input id="wa-inbound-log-reason" class="form-control form-control-sm" placeholder="Filter reason (otp_verified/mismatch/no_pending_session)">
          </div>
          <div class="col-md-4">
            <button type="button" class="btn btn-primary btn-sm w-100" onclick="loadWaInboundOtpLogs(1)">Terapkan Filter</button>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Nomor</th>
                <th>Status Deteksi</th>
                <th>Reason</th>
                <th>Pesan Masuk</th>
              </tr>
            </thead>
            <tbody id="wa-inbound-otp-logs-body">
              <tr><td colspan="5" class="text-center text-muted">Belum dimuat.</td></tr>
            </tbody>
          </table>
        </div>
        <div id="wa-inbound-otp-logs-pagination" class="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-2">
          <small id="wa-inbound-otp-logs-meta" class="text-muted">Belum ada data.</small>
          <div id="wa-inbound-otp-logs-pages" class="btn-group btn-group-sm" role="group" aria-label="Pagination Log OTP Masuk"></div>
        </div>
      </div>
    </div>
    </div>
  </div>`;
  }
};
