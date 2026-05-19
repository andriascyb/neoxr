module.exports = function renderSettingsSection(ctx = {}) {
  with (ctx) {
    return `<!-- ============================= SETTINGS TAB ============================= -->
  <div id="main-settings" class="main-tab-pane settings-premium-pane" style="display:none;">
    <div class="settings-hero">
      <div>
        <div class="settings-hero-kicker"><i class="bi bi-sliders2-vertical"></i> System Control Center</div>
        <h2>Konfigurasi Sistem</h2>
        <p>Atur server, billing, keamanan, cache, dan member portal dari satu halaman yang lebih rapi dan cepat.</p>
      </div>
      <div class="settings-hero-badge">
        <i class="bi bi-shield-check"></i>
        <span>Safe Config Mode</span>
      </div>
    </div>
    ${savedMsg}
    <div id="settings-container" class="settings-container">
  <form id="settings-form" class="settings-form premium-settings-form" action="/admin/save" method="POST" onsubmit="saveSettings(event)">

        <!-- ACCESS KEYS CARD -->
        <div class="card mb-4 settings-card">
          <div class="card-header d-flex align-items-center"><i class="bi bi-key-fill me-2"></i><span style="font-weight:600;">Connectivity &amp; Access Keys</span></div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Admin Access Key (Password)</label>
                <div class="input-group">
                  <input type="password" class="form-control" name="admin_key" id="settings-admin-key" value="" placeholder="Kosongkan jika tidak ingin mengganti admin key" autocomplete="new-password">
                  <button class="btn btn-outline-secondary" type="button" onclick="togglePassword('settings-admin-key', this)"><i class="bi bi-eye"></i></button>
                </div>
                <div class="text-muted mt-1" style="font-size:11px;">Untuk keamanan, nilai key saat ini disembunyikan.</div>
              </div>
              <div class="col-12">
                <label class="form-label">Public Base URL</label>
                <input type="text" class="form-control" name="public_base_url" value="${esc((req && req.appConfig && req.appConfig.public_base_url) || '')}" placeholder="https://domainanda.com">
              </div>
            </div>
          </div>
        </div>

        <div class="card mb-4 settings-card">
          <div class="card-header d-flex align-items-center"><i class="bi bi-shield-check me-2"></i><span style="font-weight:600;">Invalid Hit Policy (24 Jam)</span></div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Batas Hit Invalid per 24 Jam</label>
                <input type="number" class="form-control" name="invalid_quota_24h" value="${(req && req.appConfig && req.appConfig.invalid_quota_24h) || 500}">
                <div class="text-muted mt-1" style="font-size:11px;">Jika gagal validasi melebihi batas ini, mulai dikenakan penalti.</div>
              </div>
              <div class="col-md-6">
                <label class="form-label">Penalti per Invalid Setelah Batas (%)</label>
                <div class="input-group">
                  <input type="number" class="form-control" name="invalid_penalty_percent" value="${(req && req.appConfig && req.appConfig.invalid_penalty_percent) || 50}">
                  <span class="input-group-text bg-transparent border-secondary text-secondary">%</span>
                </div>
                <div class="text-muted mt-1" style="font-size:11px;">Contoh 50% dari harga layanan aktif (bank/ewallet/whatsapp/nik/bpjs/pln).</div>
              </div>
            </div>
          </div>
        </div>

        <!-- SERVICE TABS CARD -->
        <div class="card mb-4 settings-card settings-card-services">
          <div class="card-header d-flex align-items-center gap-2">
            <i class="bi bi-sliders me-1"></i><span style="font-weight:600;">Konfigurasi Per Layanan</span>
          </div>
          <div class="card-body p-0">
            <div class="svc-tab-shell">
              <button type="button" class="svc-tab-btn active" onclick="switchSvcTab('svc-bank',this)"><i class="bi bi-bank2 me-1"></i>BANK</button>
              <button type="button" class="svc-tab-btn" onclick="switchSvcTab('svc-ewallet',this)"><i class="bi bi-wallet2 me-1"></i>EWALLET</button>
              <button type="button" class="svc-tab-btn" onclick="switchSvcTab('svc-wa',this)"><i class="bi bi-whatsapp me-1"></i>WHATSAPP</button>
              <button type="button" class="svc-tab-btn" onclick="switchSvcTab('svc-nik',this)"><i class="bi bi-person-vcard-fill me-1"></i>NIK</button>
              <button type="button" class="svc-tab-btn" onclick="switchSvcTab('svc-bpjs',this)"><i class="bi bi-heart-pulse me-1"></i>BPJS</button>
              <button type="button" class="svc-tab-btn" onclick="switchSvcTab('svc-pln',this)"><i class="bi bi-lightning-charge-fill me-1"></i>PLN</button>
              <button type="button" class="svc-tab-btn" onclick="switchSvcTab('svc-games',this)"><i class="bi bi-controller me-1"></i>GAMES</button>
              <button type="button" class="svc-tab-btn" onclick="switchSvcTab('svc-ai',this)"><i class="bi bi-stars me-1"></i>Foto Editor</button>
              <button type="button" class="svc-tab-btn" onclick="switchSvcTab('svc-other',this)"><i class="bi bi-gear me-1"></i>OTHER</button>
            </div>

            <!-- TAB: BANK -->
            <div id="svc-bank" class="svc-tab-pane">
              <p class="text-secondary mb-3" style="font-size:12px;"><i class="bi bi-info-circle me-1"></i>Konfigurasi server, harga, dan cooldown untuk <strong>Cek Rekening Bank</strong>.</p>

              <!-- Server 1 -->
              <div class="svc-server-card" style="background:rgba(88,166,255,.04);">
                <div class="svc-server-head">
                  <span class="badge" style="background:rgba(88,166,255,.15); color:#58a6ff; font-size:11px; font-weight:700;">SERVER 1</span>
                  <span style="font-size:12px; color:#8b949e;">RFPDev Default</span>
                  <span class="svc-server-status">
                    <select class="form-select form-select-sm" name="bank_server1_status" style="font-size:12px;">
                      <option value="on" ${(req && req.appConfig && req.appConfig.bank_server1_status === 'on') ? 'selected' : ''}>ON</option>
                      <option value="off" ${(req && req.appConfig && req.appConfig.bank_server1_status === 'off') ? 'selected' : ''}>OFF</option>
                    </select>
                  </span>
                </div>
                <div class="mt-2">
                  <label class="form-label">API Key (RFPDev)</label>
                  <input type="text" class="form-control" name="api_key" value="${esc((req && req.appConfig && req.appConfig.api_key) || '')}" placeholder="rfp-...">
                </div>
              </div>

              <!-- Server 2 -->
              <div class="svc-server-card" style="background:rgba(164,120,255,.04);">
                <div class="svc-server-head">
                  <span class="badge" style="background:rgba(188,140,255,.15); color:#bc8cff; font-size:11px; font-weight:700;">SERVER 2</span>
                  <span style="font-size:12px; color:#8b949e;">AasardConnect</span>
                  <span class="svc-server-status">
                    <select class="form-select form-select-sm" name="bank_server2_status" style="font-size:12px;">
                      <option value="on" ${(req && req.appConfig && req.appConfig.bank_server2_status === 'on') ? 'selected' : ''}>ON</option>
                      <option value="off" ${(req && req.appConfig && req.appConfig.bank_server2_status === 'off') ? 'selected' : ''}>OFF</option>
                    </select>
                  </span>
                </div>
                <div>
                  <label class="form-label">API Key (AasardConnect)</label>
                  <input type="text" class="form-control" name="bank_server2_apikey" value="${esc((req && req.appConfig && req.appConfig.bank_server2_apikey) || '')}" placeholder="ASRD-...">
                </div>
              </div>

              <!-- Server 3 -->
              <div class="svc-server-card" style="background:rgba(39,206,154,.06);">
                <div class="svc-server-head">
                  <span class="badge" style="background:rgba(39,206,154,.18); color:#27ce9a; font-size:11px; font-weight:700;">SERVER 3</span>
                  <span style="font-size:12px; color:#8b949e;">RrtravelNbx (merchant by nama bank mapping)</span>
                  <span class="svc-server-status">
                    <select class="form-select form-select-sm" name="bank_server3_status" style="font-size:12px;">
                      <option value="on" ${(req && req.appConfig && req.appConfig.bank_server3_status === 'on') ? 'selected' : ''}>ON</option>
                      <option value="off" ${(req && req.appConfig && req.appConfig.bank_server3_status === 'off') ? 'selected' : ''}>OFF</option>
                    </select>
                  </span>
                </div>
                <div class="row g-2">
                  <div class="col-md-12" style="display:none;">
                    <label class="form-label">Mode Multi Endpoint Server 3</label>
                    <select class="form-select form-select-sm" name="bank_server3_pool_enabled" style="max-width:180px;">
                      <option value="off" ${(req && req.appConfig && req.appConfig.bank_server3_pool_enabled === 'on') ? '' : 'selected'}>OFF</option>
                      <option value="on" ${(req && req.appConfig && req.appConfig.bank_server3_pool_enabled === 'on') ? 'selected' : ''}>ON</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Base URL Server 3</label>
                    <input type="text" class="form-control" name="bank_server3_base_url" value="${esc((req && req.appConfig && req.appConfig.bank_server3_base_url) || 'https://rrtravelnbx.com/v2/topup_merchant_result_ajax-pin')}" placeholder="https://rrtravelnbx.com/v2/topup_merchant_result_ajax-pin">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Cookie Server 3</label>
                    <input type="text" class="form-control" name="bank_server3_cookie" value="${esc((req && req.appConfig && req.appConfig.bank_server3_cookie) || '')}" placeholder="SITE-SESSIONID=...">
                  </div>
                  <div class="col-md-12" style="display:none;">
                    <label class="form-label">Pool Server 3 (Format: ENDPOINT|COOKIE per baris)</label>
                    <textarea class="form-control" name="bank_server3_pool_text" rows="4" placeholder="https://domain-a.com/v2/topup_merchant_result_ajax-pin|SITE-SESSIONID=...&#10;https://domain-b.com/v2/topup_merchant_result_ajax-pin|SITE-SESSIONID=...">${esc((((req && req.appConfig && Array.isArray(req.appConfig.bank_server3_pool)) ? req.appConfig.bank_server3_pool : []) || []).map((row) => `${row.endpoint || ''}|${row.cookie || ''}`).join('\n'))}</textarea>
                    <div class="text-muted mt-1" style="font-size:11px;">Alias otomatis: baris 1 = <code>server3a</code>, baris 2 = <code>server3b</code>, dst. Endpoint asli tidak diekspos ke user API.</div>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Auto Refresh Cookie</label>
                    <select class="form-select form-select-sm" name="bank_server3_cookie_auto_refresh">
                      <option value="off" ${(req && req.appConfig && req.appConfig.bank_server3_cookie_auto_refresh === 'on') ? '' : 'selected'}>OFF</option>
                      <option value="on" ${(req && req.appConfig && req.appConfig.bank_server3_cookie_auto_refresh === 'on') ? 'selected' : ''}>ON</option>
                    </select>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Interval Refresh (jam)</label>
                    <input type="number" class="form-control" name="bank_server3_cookie_refresh_hours" value="${(req && req.appConfig && req.appConfig.bank_server3_cookie_refresh_hours) || 24}" min="1" max="168">
                  </div>
                  <div class="col-md-4 d-flex align-items-end">
                    <button type="button" class="btn btn-outline-warning w-100" onclick="refreshPoolCookies('bank_server3')"><i class="bi bi-arrow-repeat me-1"></i>Refresh Cookie Server3</button>
                  </div>
                </div>
                <div class="text-muted mt-1" style="font-size:10px;"><i class="bi bi-info-circle me-1"></i>Nama bank dikirim otomatis dari <code>bank_code_server3.json</code> berdasarkan <strong>codeid</strong>.</div>
                <div class="mt-2 p-2 rounded" style="display:none;border:1px solid #2d3a4f; background:rgba(15,23,42,.35);">
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <strong style="font-size:12px;">Analisa Server3 Pool</strong>
                    <button type="button" class="btn btn-sm btn-outline-info" onclick="analyzeServer3Pool()"><i class="bi bi-activity me-1"></i>Cek Session/Endpoint</button>
                  </div>
                  <div class="table-responsive">
                    <table class="table table-sm table-dark align-middle mb-0">
                      <thead><tr><th>Alias</th><th>Status</th><th>Session</th><th>Latency</th><th>Keterangan</th></tr></thead>
                      <tbody id="server3-pool-analyze-body"><tr><td colspan="5" class="text-muted">Belum dianalisa.</td></tr></tbody>
                    </table>
                  </div>
                </div>
              </div>

              <!-- Server 4 -->
              <div class="svc-server-card" style="background:rgba(210,168,255,.04);">
                <div class="svc-server-head">
                  <span class="badge" style="background:rgba(210,168,255,.15); color:#d2a8ff; font-size:11px; font-weight:700;">SERVER 4</span>
                  <span style="font-size:12px; color:#8b949e;">Cutiezy</span>
                  <span class="svc-server-status">
                    <select class="form-select form-select-sm" name="bank_server4_status" style="font-size:12px;">
                      <option value="on" ${(req && req.appConfig && req.appConfig.bank_server4_status === 'on') ? 'selected' : ''}>ON</option>
                      <option value="off" ${(req && req.appConfig && req.appConfig.bank_server4_status === 'off') ? 'selected' : ''}>OFF</option>
                    </select>
                  </span>
                </div>
                <div>
                  <label class="form-label">API Key (Cutiezy)</label>
                  <input type="text" class="form-control" name="bank_server4_apikey" value="${esc((req && req.appConfig && req.appConfig.bank_server4_apikey) || '')}" placeholder="czw_...">
                </div>
              </div>

              <div class="svc-server-card" style="background:rgba(255,166,87,.05);">
                <div class="svc-server-head">
                  <span class="badge" style="background:rgba(255,166,87,.16); color:#ffa657; font-size:11px; font-weight:700;">SERVER 5</span>
                  <span style="font-size:12px; color:#8b949e;">Custom HTTP (codeid)</span>
                  <span class="svc-server-status">
                    <select class="form-select form-select-sm" name="bank_server5_status" style="font-size:12px;">
                      <option value="on" ${(req && req.appConfig && req.appConfig.bank_server5_status === 'on') ? 'selected' : ''}>ON</option>
                      <option value="off" ${(req && req.appConfig && req.appConfig.bank_server5_status === 'off') ? 'selected' : ''}>OFF</option>
                    </select>
                  </span>
                </div>
                <div>
                  <label class="form-label">Base URL Server 5</label>
                  <input type="text" class="form-control" name="server5_base_url" value="${esc((req && req.appConfig && req.appConfig.server5_base_url) || 'http://43.156.205.106/api.php')}" placeholder="http://43.156.205.106/api.php">
                  <div class="text-muted mt-1" style="font-size:10px;"><i class="bi bi-link-45deg me-1"></i>Format bank: <code>?bank=codeid&amp;accountNumber=nomor_rekening</code></div>
                </div>
              </div>

              <div class="svc-server-card" style="background:rgba(63,185,80,.06);">
                <div class="svc-server-head">
                  <span class="badge" style="background:rgba(63,185,80,.16); color:#3fb950; font-size:11px; font-weight:700;">SERVER 6</span>
                  <span style="font-size:12px; color:#8b949e;">Laburagame (codeid)</span>
                  <span class="svc-server-status">
                    <select class="form-select form-select-sm" name="bank_server6_status" style="font-size:12px;">
                      <option value="on" ${(req && req.appConfig && req.appConfig.bank_server6_status === 'on') ? 'selected' : ''}>ON</option>
                      <option value="off" ${(req && req.appConfig && req.appConfig.bank_server6_status === 'off') ? 'selected' : ''}>OFF</option>
                    </select>
                  </span>
                </div>
                <div class="row g-2">
                  <div class="col-md-6">
                    <label class="form-label">Base URL Server 6</label>
                    <input type="text" class="form-control" name="bank_server6_base_url" value="${esc((req && req.appConfig && req.appConfig.bank_server6_base_url) || 'https://laburagame.com/api/bank')}" placeholder="https://laburagame.com/api/bank">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">API Key (Laburagame)</label>
                    <input type="text" class="form-control" name="bank_server6_apikey" value="${esc((req && req.appConfig && req.appConfig.bank_server6_apikey) || '')}" placeholder="api_key...">
                  </div>
                </div>
                <div class="text-muted mt-1" style="font-size:10px;"><i class="bi bi-link-45deg me-1"></i>Format bank: <code>?kode=codeid&amp;nomor=nomor_rekening&amp;api_key=...</code> (hanya <strong>codeid</strong>).</div>
              </div>

              <div class="svc-server-card" style="background:rgba(20,184,166,.07);">
                <div class="svc-server-head">
                  <span class="badge" style="background:rgba(20,184,166,.18); color:#14b8a6; font-size:11px; font-weight:700;">SERVER 7</span>
                  <span style="font-size:12px; color:#8b949e;">Rikipilkonokos Bank API (codeid)</span>
                  <span class="svc-server-status">
                    <select class="form-select form-select-sm" name="bank_server7_status" style="font-size:12px;">
                      <option value="on" ${(req && req.appConfig && req.appConfig.bank_server7_status === 'on') ? 'selected' : ''}>ON</option>
                      <option value="off" ${(req && req.appConfig && req.appConfig.bank_server7_status === 'off') ? 'selected' : ''}>OFF</option>
                    </select>
                  </span>
                </div>
                <div class="row g-2">
                  <div class="col-md-6">
                    <label class="form-label">Base URL Server 7</label>
                    <input type="text" class="form-control" name="bank_server7_base_url" value="${esc((req && req.appConfig && req.appConfig.bank_server7_base_url) || 'https://rikipilkonokos.xyz/api/bank')}" placeholder="https://rikipilkonokos.xyz/api/bank">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">API Key Server 7</label>
                    <input type="text" class="form-control" name="bank_server7_apikey" value="${esc((req && req.appConfig && req.appConfig.bank_server7_apikey) || '')}" placeholder="YOUR_KEY">
                  </div>
                </div>
                <div class="text-muted mt-1" style="font-size:10px;"><i class="bi bi-link-45deg me-1"></i>Format bank: <code>?rekening=nomor_rekening&amp;bank=codeid&amp;key=...</code>. Response sukses memakai field <code>name</code>.</div>
              </div>

              <!-- Harga & Cooldown -->
              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <label class="form-label">Harga per Hit (Rp)</label>
                  <div class="input-group">
                    <span class="input-group-text bg-transparent border-secondary text-secondary">Rp</span>
                    <input type="number" class="form-control" name="cost_bank" value="${(req && req.appConfig && req.appConfig.cost_bank) || 150}">
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Cooldown (detik)</label>
                  <div class="input-group">
                    <input type="number" class="form-control" name="cooldown_bank" value="${(req && req.appConfig && req.appConfig.cooldown_bank) || 0}">
                    <span class="input-group-text bg-transparent border-secondary text-secondary">s</span>
                  </div>
                </div>
              </div>

              <!-- Bank Routing -->
              <div class="svc-help-box">
                <div>
                  <div style="font-size:13px; font-weight:700; color:#58a6ff;">Atur Bank Routing</div>
                  <div class="text-secondary" style="font-size:11px;">Tentukan server per kode bank (BCA &rarr; S1, BRI &rarr; S2, dst.)</div>
                </div>
                <button type="button" class="btn btn-outline-info btn-sm" onclick="openBankRoutingModal()"><i class="bi bi-sliders me-1"></i>Buka Routing Modal</button>
              </div>
            </div>


            <!-- TAB: EWALLET -->
            <div id="svc-ewallet" class="svc-tab-pane" style="display:none;">
              <p class="text-secondary mb-3" style="font-size:12px;"><i class="bi bi-info-circle me-1"></i>Konfigurasi server, harga, dan cooldown untuk <strong>Cek E-Wallet</strong>. Server dipilih secara acak (load balance).</p>

              <!-- Server 1 -->
              <div class="p-3 rounded mb-3" style="border:1px solid #30363d; background:rgba(88,166,255,.04);">
                <div class="d-flex align-items-center gap-2 mb-2">
                  <span class="badge" style="background:rgba(88,166,255,.15); color:#58a6ff; font-size:11px; font-weight:700;">SERVER 1</span>
                  <span style="font-size:12px; color:#8b949e;">RFPDev rfpdev.me/api/check-ewallet</span>
                  <span class="ms-auto">
                    <select class="form-select form-select-sm" name="ewallet_server1_status" style="width:90px; font-size:12px;">
                      <option value="on" ${(req && req.appConfig && req.appConfig.ewallet_server1_status === 'on') ? 'selected' : ''}>ON</option>
                      <option value="off" ${(req && req.appConfig && req.appConfig.ewallet_server1_status === 'off') ? 'selected' : ''}>OFF</option>
                    </select>
                  </span>
                </div>
                <div class="text-muted" style="font-size:11px;"><i class="bi bi-key me-1"></i>API Key dikonfigurasi di kartu <em>Connectivity &amp; Access Keys</em></div>
              </div>

              <!-- Server 2 -->
              <div class="p-3 rounded mb-3" style="border:1px solid #30363d; background:rgba(164,120,255,.04);">
                <div class="d-flex align-items-center gap-2 mb-2">
                  <span class="badge" style="background:rgba(188,140,255,.15); color:#bc8cff; font-size:11px; font-weight:700;">SERVER 2</span>
                  <span style="font-size:12px; color:#8b949e;">BillPaketData cekid ewallet</span>
                  <span class="ms-auto">
                    <select class="form-select form-select-sm" name="ewallet_server2_status" style="width:90px; font-size:12px;">
                      <option value="on" ${(req && req.appConfig && req.appConfig.ewallet_server2_status === 'on') ? 'selected' : ''}>ON</option>
                      <option value="off" ${(req && req.appConfig && req.appConfig.ewallet_server2_status === 'off') ? 'selected' : ''}>OFF</option>
                    </select>
                  </span>
                </div>
                <div>
                  <label class="form-label">Base URL Server 2 (E-Wallet)</label>
                  <input type="text" class="form-control" name="ewallet_server2_base_url" value="${esc((req && req.appConfig && req.appConfig.ewallet_server2_base_url) || 'https://billpaketdata.com/cekid/ewallet/check_packages')}" placeholder="https://billpaketdata.com/cekid/ewallet/check_packages">
                </div>
                <div class="text-muted mt-1" style="font-size:11px;"><i class="bi bi-link-45deg me-1"></i>Format: <code>{base_url}/{nomor}/{kode}</code> contoh <code>/087841903677/dana</code>. Response sukses: <code>{"success":true,"cust_name":"..."}</code>.</div>
              </div>

              <!-- Server 3 (Cutiezy) -->
              <div class="p-3 rounded mb-4" style="border:1px solid #30363d; background:rgba(20,184,166,.04);">
                <div class="d-flex align-items-center gap-2 mb-3">
                  <span class="badge" style="background:rgba(20,184,166,.15); color:#14b8a6; font-size:11px; font-weight:700;">SERVER 3</span>
                  <span style="font-size:12px; color:#8b949e;">Cutiezy api.cutiezy.id</span>
                  <span class="ms-auto">
                    <select class="form-select form-select-sm" name="ewallet_server3_status" style="width:90px; font-size:12px;">
                      <option value="on" ${(req && req.appConfig && req.appConfig.ewallet_server3_status === 'on') ? 'selected' : ''}>ON</option>
                      <option value="off" ${(req && req.appConfig && req.appConfig.ewallet_server3_status === 'off') ? 'selected' : ''}>OFF</option>
                    </select>
                  </span>
                </div>
                <div>
                  <label class="form-label">X-API-Key (Cutiezy)</label>
                  <input type="text" class="form-control" name="ewallet_server3_apikey" value="${esc((req && req.appConfig && req.appConfig.ewallet_server3_apikey) || '')}" placeholder="cutiezy-apikey...">
                  <div class="text-muted mt-1" style="font-size:10px;"><i class="bi bi-link-45deg me-1"></i>Endpoint: GET /api/check/ewallet?service=CODE&amp;user_id=NOMOR &nbsp;|&nbsp; Header: X-API-Key</div>
                </div>
              </div>

              <div class="p-3 rounded mb-4" style="border:1px solid #30363d; background:rgba(255,166,87,.05);">
                <div class="d-flex align-items-center gap-2 mb-3">
                  <span class="badge" style="background:rgba(255,166,87,.16); color:#ffa657; font-size:11px; font-weight:700;">SERVER 4</span>
                  <span style="font-size:12px; color:#8b949e;">Qiospay (SN callback)</span>
                  <span class="ms-auto">
                    <select class="form-select form-select-sm" name="ewallet_server5_status" style="width:90px; font-size:12px;">
                      <option value="on" ${(req && req.appConfig && req.appConfig.ewallet_server5_status === 'on') ? 'selected' : ''}>ON</option>
                      <option value="off" ${(req && req.appConfig && req.appConfig.ewallet_server5_status === 'off') ? 'selected' : ''}>OFF</option>
                    </select>
                  </span>
                </div>
                <div class="row g-2">
                  <div class="col-md-6">
                    <label class="form-label">Member ID</label>
                    <input type="text" class="form-control" name="qiospay_member_id" value="${esc((req && req.appConfig && req.appConfig.qiospay_member_id) || '')}" placeholder="andriascyb">
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">PIN</label>
                    <input type="text" class="form-control" name="qiospay_pin" value="${esc((req && req.appConfig && req.appConfig.qiospay_pin) || '')}" placeholder="0000">
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Password</label>
                    <input type="text" class="form-control" name="qiospay_password" value="${esc((req && req.appConfig && req.appConfig.qiospay_password) || '')}" placeholder="password">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Callback Key</label>
                    <input type="text" class="form-control" name="qiospay_callback_key" value="${esc((req && req.appConfig && req.appConfig.qiospay_callback_key) || '112233')}" placeholder="112233">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Wait Timeout (ms)</label>
                    <input type="number" class="form-control" name="qiospay_wait_timeout_ms" value="${(req && req.appConfig && req.appConfig.qiospay_wait_timeout_ms) || 10000}" placeholder="10000">
                  </div>
                  <div class="col-md-12">
                    <label class="form-label">Qiospay Endpoint</label>
                    <input type="text" class="form-control" value="https://qiospay.id/api/h2h/trx" readonly>
                  </div>
                </div>
                <div class="text-muted mt-2" style="font-size:11px;">
                  <i class="bi bi-link-45deg me-1"></i>Callback URL: <code>${esc((((((req && req.appConfig && req.appConfig.public_base_url) || '').replace(/\/+$/, '')) || 'https://domain-anda.com') + '/callback_qiospay?key=' + (((req && req.appConfig && req.appConfig.qiospay_callback_key) || '112233'))))}</code>.
                  Dukungan kode: <strong>dana</strong>, <strong>ovo</strong>, <strong>linkaja</strong>, <strong>shopeepay</strong>.
                </div>
              </div>

              <div class="p-3 rounded mb-4" style="border:1px solid #30363d; background:rgba(63,185,80,.06);">
                <div class="d-flex align-items-center gap-2 mb-3">
                  <span class="badge" style="background:rgba(63,185,80,.16); color:#3fb950; font-size:11px; font-weight:700;">SERVER 5</span>
                  <span style="font-size:12px; color:#8b949e;">Laburagame laburagame.com</span>
                  <span class="ms-auto">
                    <select class="form-select form-select-sm" name="ewallet_server6_status" style="width:90px; font-size:12px;">
                      <option value="on" ${(req && req.appConfig && req.appConfig.ewallet_server6_status === 'on') ? 'selected' : ''}>ON</option>
                      <option value="off" ${(req && req.appConfig && req.appConfig.ewallet_server6_status === 'off') ? 'selected' : ''}>OFF</option>
                    </select>
                  </span>
                </div>
                <div class="row g-2">
                  <div class="col-md-6">
                    <label class="form-label">Base URL (Laburagame)</label>
                    <input type="text" class="form-control" name="ewallet_server6_base_url" value="${esc((req && req.appConfig && req.appConfig.ewallet_server6_base_url) || 'https://laburagame.com/api/ewallet')}" placeholder="https://laburagame.com/api/ewallet">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">API Key (Laburagame)</label>
                    <input type="text" class="form-control" name="ewallet_server6_apikey" value="${esc((req && req.appConfig && req.appConfig.ewallet_server6_apikey) || '')}" placeholder="api_key...">
                  </div>
                </div>
                <div class="text-muted mt-2" style="font-size:11px;"><i class="bi bi-link-45deg me-1"></i>Dukungan kode: <strong>gopay</strong>, <strong>dana</strong>, <strong>shopeepay</strong>, <strong>ovo</strong>, <strong>linkaja</strong>. Format endpoint: <code>{base_url}/{kode-ewallet}/?nomor=...&amp;api_key=...</code>.</div>
              </div>

              <div class="p-3 rounded mb-4" style="border:1px solid #30363d; background:rgba(56,189,248,.08);">
                <div class="d-flex align-items-center gap-2 mb-3">
                  <span class="badge" style="background:rgba(56,189,248,.18); color:#38bdf8; font-size:11px; font-weight:700;">SERVER 7</span>
                  <span style="font-size:12px; color:#8b949e;">CekAPI v1 cekewallet</span>
                  <span class="ms-auto">
                    <select class="form-select form-select-sm" name="ewallet_server7_status" style="width:90px; font-size:12px;">
                      <option value="on" ${(req && req.appConfig && req.appConfig.ewallet_server7_status === 'on') ? 'selected' : ''}>ON</option>
                      <option value="off" ${(req && req.appConfig && req.appConfig.ewallet_server7_status === 'off') ? 'selected' : ''}>OFF</option>
                    </select>
                  </span>
                </div>
                <div class="mb-2" style="display:none;">
                  <label class="form-label">Mode Multi Endpoint Server 7</label>
                  <select class="form-select form-select-sm" name="ewallet_server7_pool_enabled" style="max-width:180px;">
                    <option value="off" ${(req && req.appConfig && req.appConfig.ewallet_server7_pool_enabled === 'on') ? '' : 'selected'}>OFF</option>
                    <option value="on" ${(req && req.appConfig && req.appConfig.ewallet_server7_pool_enabled === 'on') ? 'selected' : ''}>ON</option>
                  </select>
                </div>
                <div class="row g-2">
                  <div class="col-md-12">
                    <label class="form-label">Endpoint CekAPI Server 7</label>
                    <input type="text" class="form-control" name="ewallet_server7_base_url" value="${esc((req && req.appConfig && req.appConfig.ewallet_server7_base_url) || 'https://v1.cekapi.com/cekewallet')}" placeholder="https://v1.cekapi.com/cekewallet">
                  </div>
                  <div class="col-md-12">
                    <label class="form-label">API Key CekAPI Server 7</label>
                    <input type="text" class="form-control" name="ewallet_server7_apikey" value="${esc((req && req.appConfig && req.appConfig.ewallet_server7_apikey) || '68a561-32cf0d-7f267b-484a96-90eb34')}" placeholder="68a561-32cf0d-7f267b-484a96-90eb34">
                  </div>
                  <div class="col-md-12" style="display:none;">
                    <label class="form-label">Pool Server 7 (Format: ENDPOINT|COOKIE per baris)</label>
                    <textarea class="form-control" name="ewallet_server7_pool_text" rows="4" placeholder="https://domain-a.com/v2/topup_merchant_result_ajax-pin|SITE-SESSIONID=...&#10;https://domain-b.com/v2/topup_merchant_result_ajax-pin|SITE-SESSIONID=...">${esc((((req && req.appConfig && Array.isArray(req.appConfig.ewallet_server7_pool)) ? req.appConfig.ewallet_server7_pool : []) || []).map((row) => `${row.endpoint || ''}|${row.cookie || ''}`).join('\n'))}</textarea>
                    <div class="text-muted mt-1" style="font-size:11px;">Alias otomatis: baris 1 = <code>server7a</code>, baris 2 = <code>server7b</code>, dst. Endpoint asli tidak diekspos ke user API.</div>
                  </div>
                  <div class="col-md-4" style="display:none;">
                    <label class="form-label">Auto Refresh Cookie</label>
                    <select class="form-select form-select-sm" name="ewallet_server7_cookie_auto_refresh">
                      <option value="off" ${(req && req.appConfig && req.appConfig.ewallet_server7_cookie_auto_refresh === 'on') ? '' : 'selected'}>OFF</option>
                      <option value="on" ${(req && req.appConfig && req.appConfig.ewallet_server7_cookie_auto_refresh === 'on') ? 'selected' : ''}>ON</option>
                    </select>
                  </div>
                  <div class="col-md-4" style="display:none;">
                    <label class="form-label">Interval Refresh (jam)</label>
                    <input type="number" class="form-control" name="ewallet_server7_cookie_refresh_hours" value="${(req && req.appConfig && req.appConfig.ewallet_server7_cookie_refresh_hours) || 24}" min="1" max="168">
                  </div>
                  <div class="col-md-4 d-flex align-items-end" style="display:none !important;">
                    <button type="button" class="btn btn-outline-warning w-100" onclick="refreshPoolCookies('ewallet_server7')"><i class="bi bi-arrow-repeat me-1"></i>Refresh Cookie Server7</button>
                  </div>
                  <div class="col-md-6" style="display:none;">
                    <label class="form-label">Scheduler Check (menit)</label>
                    <input type="number" class="form-control" name="pool_cookie_refresh_check_minutes" value="${(req && req.appConfig && req.appConfig.pool_cookie_refresh_check_minutes) || 10}" min="1" max="120">
                  </div>
                  <div class="col-md-6" style="display:none;">
                    <label class="form-label">Timeout Refresh (ms)</label>
                    <input type="number" class="form-control" name="pool_cookie_refresh_timeout_ms" value="${(req && req.appConfig && req.appConfig.pool_cookie_refresh_timeout_ms) || 8000}" min="2000" max="60000">
                  </div>
                </div>
                <div class="text-muted mt-2" style="font-size:11px;">
                  <i class="bi bi-link-45deg me-1"></i>Format request: <code>?customer_no=NOMOR&amp;ewallet=KODE&amp;apikey=KEY</code>. Mapping kode: <strong>ovo=ovo</strong>, <strong>spay=shopeepay</strong>, <strong>dana=dana</strong>, <strong>gopay=gopay</strong>.
                </div>
                <div class="mt-3 p-3 rounded server7-analyze-card" style="display:none;">
                  <div class="d-flex align-items-center justify-content-between mb-2 server7-analyze-head">
                    <strong style="font-size:13px;"><i class="bi bi-shield-check me-1"></i>Analisa Server7 Pool</strong>
                    <button type="button" class="btn btn-sm server7-analyze-btn" onclick="analyzeServer7Pool()"><i class="bi bi-activity me-1"></i>Cek Session/Endpoint</button>
                  </div>
                  <div id="server7-pool-analyze-wrap" class="table-responsive">
                    <table class="table table-sm align-middle mb-0 server7-analyze-table">
                      <thead><tr><th>Alias</th><th>Status</th><th>Session</th><th>Latency</th><th>Keterangan</th></tr></thead>
                      <tbody id="server7-pool-analyze-body"><tr><td colspan="5" class="text-muted">Belum dianalisa.</td></tr></tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div class="p-3 rounded mb-4" style="border:1px solid #30363d; background:rgba(20,184,166,.08);">
                <div class="d-flex align-items-center gap-2 mb-3">
                  <span class="badge" style="background:rgba(20,184,166,.18); color:#14b8a6; font-size:11px; font-weight:700;">SERVER 8</span>
                  <span style="font-size:12px; color:#8b949e;">Rikipilkonokos ewallet API</span>
                  <span class="ms-auto">
                    <select class="form-select form-select-sm" name="ewallet_server8_status" style="width:90px; font-size:12px;">
                      <option value="on" ${(req && req.appConfig && req.appConfig.ewallet_server8_status === 'on') ? 'selected' : ''}>ON</option>
                      <option value="off" ${(req && req.appConfig && req.appConfig.ewallet_server8_status === 'off') ? 'selected' : ''}>OFF</option>
                    </select>
                  </span>
                </div>
                <div class="row g-2">
                  <div class="col-md-8">
                    <label class="form-label">Base URL Server 8</label>
                    <input type="text" class="form-control" name="ewallet_server8_base_url" value="${esc((req && req.appConfig && req.appConfig.ewallet_server8_base_url) || 'https://rikipilkonokos.xyz/api/ewallet')}" placeholder="https://rikipilkonokos.xyz/api/ewallet">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">API Key Server 8</label>
                    <input type="text" class="form-control" name="ewallet_server8_apikey" value="${esc((req && req.appConfig && req.appConfig.ewallet_server8_apikey) || '')}" placeholder="YOUR_KEY">
                  </div>
                </div>
                <div class="text-muted mt-2" style="font-size:11px;"><i class="bi bi-link-45deg me-1"></i>Format request: <code>{base_url}/{kode}/?hp=NOMOR&amp;key=KEY</code>. Kode: <strong>dana</strong>, <strong>gopay</strong>, <strong>ovo</strong>, <strong>shopeepay</strong>, <strong>linkaja</strong>, <strong>isaku</strong>, <strong>grab</strong>, <strong>gopay-driver</strong>.</div>
              </div>

              <!-- Harga & Cooldown -->
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Harga per Hit (Rp)</label>
                  <div class="input-group">
                    <span class="input-group-text bg-transparent border-secondary text-secondary">Rp</span>
                    <input type="number" class="form-control" name="cost_ewallet" value="${(req && req.appConfig && req.appConfig.cost_ewallet) || 150}">
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Cooldown (detik)</label>
                  <div class="input-group">
                    <input type="number" class="form-control" name="cooldown_ewallet" value="${(req && req.appConfig && req.appConfig.cooldown_ewallet) || 0}">
                    <span class="input-group-text bg-transparent border-secondary text-secondary">s</span>
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Limit Gagal Provider</label>
                  <div class="input-group">
                    <input type="number" class="form-control" name="provider_circuit_fail_threshold" value="${(req && req.appConfig && req.appConfig.provider_circuit_fail_threshold !== undefined) ? req.appConfig.provider_circuit_fail_threshold : 3}" min="0">
                    <span class="input-group-text bg-transparent border-secondary text-secondary">x</span>
                  </div>
                  <div class="text-muted mt-1" style="font-size:11px;">Isi 0 untuk nonaktifkan circuit breaker provider.</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Durasi Cooldown Provider</label>
                  <div class="input-group">
                    <input type="number" class="form-control" name="provider_circuit_cooldown_ms" value="${(req && req.appConfig && req.appConfig.provider_circuit_cooldown_ms !== undefined) ? req.appConfig.provider_circuit_cooldown_ms : 60000}" min="0">
                    <span class="input-group-text bg-transparent border-secondary text-secondary">ms</span>
                  </div>
                </div>
              </div>
            </div>


            <!-- TAB: WHATSAPP -->
            <div id="svc-wa" class="svc-tab-pane" style="display:none;">
              <p class="text-secondary mb-3" style="font-size:12px;"><i class="bi bi-info-circle me-1"></i>Provider dan pricing untuk <strong>Cek WhatsApp</strong>. Template WA dipindah ke menu khusus <strong>Pengaturan WA</strong>.</p>
              <div class="section-title mt-0" style="margin-bottom:12px;">Provider &amp; API Keys</div>
              <div class="row g-3 mb-4">
                <div class="col-md-4">
                  <label class="form-label">Status Layanan WhatsApp</label>
                  <select class="form-select" name="whatsapp_status">
                    <option value="on" ${(req && req.appConfig && String(req.appConfig.whatsapp_status || 'on') === 'on') ? 'selected' : ''}>ON</option>
                    <option value="off" ${(req && req.appConfig && String(req.appConfig.whatsapp_status || 'on') === 'off') ? 'selected' : ''}>OFF</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Provider Validasi WA <span class="text-muted" style="font-size:10px;text-transform:none;letter-spacing:0;">(urutan: 1=Fonnte, 2=Pitucode)</span></label>
                  <input type="text" class="form-control" name="wa_validation_priority" value="${esc((req && req.appConfig && (req.appConfig.wa_validation_priority || req.appConfig.wa_priority)) || '1,2')}" placeholder="1,2">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Fonnte Token</label>
                  <input type="text" class="form-control" name="fonnte_token" value="${esc((req && req.appConfig && req.appConfig.fonnte_token) || '')}">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Pitucode API Key</label>
                  <input type="text" class="form-control" name="pitucode_apikey" value="${esc((req && req.appConfig && req.appConfig.pitucode_apikey) || '')}">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Provider OTP & Notifikasi</label>
                  <select class="form-select" name="wa_notification_provider">
                    <option value="fonnte" ${(req && req.appConfig && String(req.appConfig.wa_notification_provider || 'fonnte') === 'fonnte') ? 'selected' : ''}>Fonnte (Ready)</option>
                    <option value="pitucode" ${(req && req.appConfig && String(req.appConfig.wa_notification_provider || '') === 'pitucode') ? 'selected' : ''}>Pitucode (Belum support kirim pesan)</option>
                    <option value="internal_baileys" ${(req && req.appConfig && String(req.appConfig.wa_notification_provider || '') === 'internal_baileys') ? 'selected' : ''}>Internal Baileys (Belum aktif, perlu scan QR backend)</option>
                  </select>
                </div>
              </div>
              <div class="p-3 rounded mb-3" style="background:rgba(227,179,65,.08); border:1px solid rgba(227,179,65,.26); font-size:12px;">
                <i class="bi bi-info-circle me-1"></i>
                Saat ini backend <strong>internal_baileys</strong> belum tersedia (fitur scan QR/login WA belum dibuat), jadi pilihannya disimpan untuk persiapan tetapi belum bisa dipakai kirim OTP/notifikasi.
              </div>
              <div style="height:1px; background:#30363d; margin-bottom:16px;"></div>
              <div class="section-title mt-0" style="margin-bottom:12px;">Pricing &amp; Cooldown</div>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Harga per Hit (Rp)</label>
                  <div class="input-group">
                    <span class="input-group-text bg-transparent border-secondary text-secondary">Rp</span>
                    <input type="number" class="form-control" name="cost_whatsapp" value="${(req && req.appConfig && req.appConfig.cost_whatsapp) || 50}">
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Cooldown (detik)</label>
                  <div class="input-group">
                    <input type="number" class="form-control" name="cooldown_whatsapp" value="${(req && req.appConfig && req.appConfig.cooldown_whatsapp) || 0}">
                    <span class="input-group-text bg-transparent border-secondary text-secondary">s</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB: NIK -->
            <div id="svc-nik" class="svc-tab-pane" style="display:none;">
              <p class="text-secondary mb-3" style="font-size:12px;"><i class="bi bi-info-circle me-1"></i>Konfigurasi harga dan cooldown untuk <strong>Cek NIK / KTP</strong>.</p>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Status Layanan NIK</label>
                  <select class="form-select" name="nik_status">
                    <option value="on" ${(req && req.appConfig && String(req.appConfig.nik_status || 'on') === 'on') ? 'selected' : ''}>ON</option>
                    <option value="off" ${(req && req.appConfig && String(req.appConfig.nik_status || 'on') === 'off') ? 'selected' : ''}>OFF</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Harga per Hit (Rp)</label>
                  <div class="input-group">
                    <span class="input-group-text bg-transparent border-secondary text-secondary">Rp</span>
                    <input type="number" class="form-control" name="cost_nik" value="${(req && req.appConfig && req.appConfig.cost_nik) || 250}">
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Cooldown (detik)</label>
                  <div class="input-group">
                    <input type="number" class="form-control" name="cooldown_nik" value="${(req && req.appConfig && req.appConfig.cooldown_nik) || 0}">
                    <span class="input-group-text bg-transparent border-secondary text-secondary">s</span>
                  </div>
                </div>
              </div>
              <div class="p-3 rounded" style="background:rgba(227,179,65,.06); border:1px solid rgba(227,179,65,.2);">
                <div style="font-size:12px; color:#e3b341;"><i class="bi bi-info-circle-fill me-1"></i>NIK menggunakan Server 1 (RFP). Global timeout dikontrol dari tab <strong>OTHER</strong>.</div>
              </div>
            </div>

            <!-- TAB: BPJS -->
            <div id="svc-bpjs" class="svc-tab-pane" style="display:none;">
              <p class="text-secondary mb-3" style="font-size:12px;"><i class="bi bi-info-circle me-1"></i>Validasi tagihan BPJS memakai server KlikMBC PPOB (Server 7).</p>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Status Layanan BPJS</label>
                  <select class="form-select" name="bpjs_status">
                    <option value="on" ${(req && req.appConfig && String(req.appConfig.bpjs_status || 'off') === 'on') ? 'selected' : ''}>ON</option>
                    <option value="off" ${(req && req.appConfig && String(req.appConfig.bpjs_status || 'off') === 'off') ? 'selected' : ''}>OFF</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Harga per Hit (Rp)</label>
                  <div class="input-group">
                    <span class="input-group-text bg-transparent border-secondary text-secondary">Rp</span>
                    <input type="number" class="form-control" name="cost_bpjs" value="${(req && req.appConfig && req.appConfig.cost_bpjs) || 100}">
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Cooldown (detik)</label>
                  <div class="input-group">
                    <input type="number" class="form-control" name="cooldown_bpjs" value="${(req && req.appConfig && req.appConfig.cooldown_bpjs) || 0}">
                    <span class="input-group-text bg-transparent border-secondary text-secondary">s</span>
                  </div>
                </div>
              </div>
              <div class="p-3 rounded" style="background:rgba(56,189,248,.08); border:1px solid rgba(56,189,248,.28); font-size:12px;">
                Gunakan endpoint PPOB dan cookie khusus di bawah ini agar sama dengan flow script BPJS/PLN.
              </div>
              <div class="row g-3 mt-2">
                <div class="col-md-6">
                  <label class="form-label">KlikMBC PPOB Endpoint</label>
                  <input type="text" class="form-control" name="klikmbc_ppob_base_url" value="${esc((req && req.appConfig && req.appConfig.klikmbc_ppob_base_url) || 'https://klikmbc.biz/v2/ppob_result_ajax-pin')}">
                </div>
                <div class="col-md-6">
                  <label class="form-label">KlikMBC PPOB Cookie</label>
                  <input type="text" class="form-control" name="klikmbc_ppob_cookie" value="${esc((req && req.appConfig && req.appConfig.klikmbc_ppob_cookie) || '')}" placeholder="SITE-SESSIONID=...">
                </div>
              </div>
            </div>

            <!-- TAB: PLN -->
            <div id="svc-pln" class="svc-tab-pane" style="display:none;">
              <p class="text-secondary mb-3" style="font-size:12px;"><i class="bi bi-info-circle me-1"></i>Validasi tagihan PLN memakai server KlikMBC PPOB (Server 7).</p>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Status Layanan PLN</label>
                  <select class="form-select" name="pln_status">
                    <option value="on" ${(req && req.appConfig && String(req.appConfig.pln_status || 'off') === 'on') ? 'selected' : ''}>ON</option>
                    <option value="off" ${(req && req.appConfig && String(req.appConfig.pln_status || 'off') === 'off') ? 'selected' : ''}>OFF</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Harga per Hit (Rp)</label>
                  <div class="input-group">
                    <span class="input-group-text bg-transparent border-secondary text-secondary">Rp</span>
                    <input type="number" class="form-control" name="cost_pln" value="${(req && req.appConfig && req.appConfig.cost_pln) || 100}">
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Cooldown (detik)</label>
                  <div class="input-group">
                    <input type="number" class="form-control" name="cooldown_pln" value="${(req && req.appConfig && req.appConfig.cooldown_pln) || 0}">
                    <span class="input-group-text bg-transparent border-secondary text-secondary">s</span>
                  </div>
                </div>
              </div>
              <div class="p-3 rounded" style="background:rgba(56,189,248,.08); border:1px solid rgba(56,189,248,.28); font-size:12px;">
                Menggunakan endpoint/cookie KlikMBC PPOB yang sama seperti BPJS.
              </div>
            </div>

            <!-- TAB: GAMES -->
            <div id="svc-games" class="svc-tab-pane" style="display:none;">
              <p class="text-secondary mb-3" style="font-size:12px;"><i class="bi bi-info-circle me-1"></i>Validasi ID akun game: Mobile Legends, Free Fire, PUBG, Valorant, Genshin Impact, dll. via Cutiezy API.</p>
              <div class="p-3 rounded mb-3" style="border:1px solid #30363d; background:rgba(88,166,255,.04);">
                <div class="d-flex align-items-center gap-2 mb-3">
                  <span class="badge" style="background:rgba(88,166,255,.15); color:#58a6ff; font-size:11px; font-weight:700;">CUTIEZY</span>
                  <span style="font-size:12px; color:#8b949e;">api.cutiezy.id/api/check/games</span>
                  <span class="ms-auto">
                    <select class="form-select form-select-sm" name="games_status" style="width:90px; font-size:12px;">
                      <option value="on" ${(req && req.appConfig && req.appConfig.games_status === 'on') ? 'selected' : ''}>ON</option>
                      <option value="off" ${(req && req.appConfig && req.appConfig.games_status === 'off') ? 'selected' : ''}>OFF</option>
                    </select>
                  </span>
                </div>
                <div style="font-size:11px; color:#8b949e; margin-top:4px;"><i class="bi bi-link-45deg me-1"></i>API Key diambil dari konfigurasi <strong style="color:#58a6ff;">E-Wallet Server 3</strong>.</div>
              </div>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Harga per Hit (Rp)</label>
                  <div class="input-group">
                    <span class="input-group-text bg-transparent border-secondary text-secondary">Rp</span>
                    <input type="number" class="form-control" name="cost_games" value="${(req && req.appConfig && req.appConfig.cost_games) || 100}">
                  </div>
                </div>
              </div>
              <div class="p-3 rounded mt-3" style="background:rgba(88,166,255,.06); border:1px solid rgba(88,166,255,.2);">
                <div style="font-size:12px; color:#58a6ff;"><i class="bi bi-info-circle-fill me-1"></i>Layanan games didukung: Mobile Legends (region/bundle/create), Free Fire, PUBG, CODM, Valorant, Genshin, Honkai: Star Rail, Zenless Zone Zero, Honor of Kings, Blood Strike, Roblox, Undawn.</div>
              </div>
            </div>

            <!-- TAB: AI -->
            <div id="svc-ai" class="svc-tab-pane" style="display:none;">
              <p class="text-secondary mb-3" style="font-size:12px;"><i class="bi bi-info-circle me-1"></i>Konfigurasi layanan <strong>Foto Editor</strong> (Neoxr).</p>
              <div class="row g-3 mb-3">
                <div class="col-md-8">
                  <label class="form-label">Foto Editor Base URL</label>
                  <input type="text" class="form-control" name="ai_endpoint" value="${esc((req && req.appConfig && req.appConfig.ai_endpoint) || 'https://api.neoxr.eu/api/photo-editor')}" placeholder="https://api.neoxr.eu/api/photo-editor">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Foto Editor API Key</label>
                  <input type="text" class="form-control" name="ai_apikey" value="${esc((req && req.appConfig && req.appConfig.ai_apikey) || '9ViEsr')}" placeholder="9ViEsr">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Timeout Khusus Foto Editor (ms)</label>
                  <input type="number" class="form-control" name="ai_timeout_ms" value="${(req && req.appConfig && req.appConfig.ai_timeout_ms) || 15000}">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Masa simpan hasil (jam)</label>
                  <input type="number" class="form-control" name="ai_file_ttl_hours" value="${(req && req.appConfig && req.appConfig.ai_file_ttl_hours) || 12}">
                </div>
                <div class="col-md-8">
                  <div class="p-3 rounded" style="background:rgba(88,166,255,.06); border:1px solid rgba(88,166,255,.2); margin-top:24px;">
                    <div style="font-size:12px; color:#58a6ff;"><i class="bi bi-lightbulb me-1"></i>Parameter runtime: <code>image</code> (URL), <code>q</code> (max 100 karakter). Sistem mengambil output: <code>downloadUrl</code>, <code>bytes</code>, <code>expired_at</code>, <code>code</code>.</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB: OTHER -->
            <div id="svc-other" class="svc-tab-pane" style="display:none;">
              <p class="text-secondary mb-3" style="font-size:12px;"><i class="bi bi-info-circle me-1"></i>Pengaturan global: performance, caching, dan sistem umum.</p>
              <div class="section-title mt-0" style="margin-bottom:12px;">Performance &amp; Caching</div>
              <div class="row g-3 mb-4">
                <div class="col-md-4">
                  <label class="form-label">Memory Cache (Ultra Fast)</label>
                  <select class="form-select" name="cache_enabled">
                    <option value="1" ${(req && req.appConfig && parseInt(req.appConfig.cache_enabled) === 1) ? 'selected' : ''}>Enabled (ON)</option>
                    <option value="0" ${(req && req.appConfig && parseInt(req.appConfig.cache_enabled) === 0) ? 'selected' : ''}>Disabled (OFF)</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Persistent DB Cache</label>
                  <select class="form-select" name="db_cache_enabled" style="border:1px solid #58a6ff;">
                    <option value="1" ${(req && req.appConfig && parseInt(req.appConfig.db_cache_enabled) === 1) ? 'selected' : ''}>Enabled (ON)</option>
                    <option value="0" ${(req && req.appConfig && parseInt(req.appConfig.db_cache_enabled) === 0) ? 'selected' : ''}>Disabled (OFF)</option>
                  </select>
                  <div style="font-size:10px; color:#58a6ff; margin-top:5px;"><i class="bi bi-info-circle me-1"></i>Cek data sukses di DB sebelum hit API.</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Cache Duration (detik)</label>
                  <input type="number" class="form-control" name="cache_time" value="${(req && req.appConfig && req.appConfig.cache_time) || 300}">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Redis Cache</label>
                  <select class="form-select" name="redis_cache_enabled">
                    <option value="1" ${(req && req.appConfig && parseInt(req.appConfig.redis_cache_enabled) === 1) ? 'selected' : ''}>Enabled (ON)</option>
                    <option value="0" ${(req && req.appConfig && parseInt(req.appConfig.redis_cache_enabled) !== 1) ? 'selected' : ''}>Disabled (OFF)</option>
                  </select>
                </div>
                <div class="col-md-8">
                  <label class="form-label">Redis URL</label>
                  <input type="text" class="form-control" name="redis_url" value="${esc((req && req.appConfig && req.appConfig.redis_url) || 'redis://127.0.0.1:6379')}" placeholder="redis://:password@127.0.0.1:6379/0">
                </div>
                <div class="col-md-2">
                  <label class="form-label">Redis Prefix</label>
                  <input type="text" class="form-control" name="redis_prefix" value="${esc((req && req.appConfig && req.appConfig.redis_prefix) || 'apiv3')}" placeholder="apiv3">
                </div>
                <div class="col-md-2">
                  <label class="form-label">Redis TTL (s)</label>
                  <input type="number" class="form-control" name="redis_ttl_seconds" value="${(req && req.appConfig && req.appConfig.redis_ttl_seconds) || 300}">
                </div>
              </div>
              <div style="height:1px; background:#30363d; margin-bottom:16px;"></div>
              <div class="section-title mt-0" style="margin-bottom:12px;">Sistem Umum</div>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Global Timeout (ms)</label>
                  <input type="number" class="form-control" name="timeout_ms" value="${(req && req.appConfig && req.appConfig.timeout_ms) || 8000}">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Tampilkan Packages ke Publik</label>
                  <select class="form-select" name="show_packages">
                    <option value="1" ${(req && req.appConfig && parseInt(req.appConfig.show_packages) === 1) ? 'selected' : ''}>Show (ON)</option>
                    <option value="0" ${(req && req.appConfig && parseInt(req.appConfig.show_packages) === 0) ? 'selected' : ''}>Hide (OFF)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card mb-4 settings-card">
          <div class="card-header d-flex align-items-center gap-2">
            <i class="bi bi-person-badge-fill"></i><span style="font-weight:600;">Member Portal &amp; H2H Deposit</span>
          </div>
          <div class="card-body">
            <div class="row g-3 mb-4">
              <div class="col-md-4">
                <label class="form-label">Bonus Registrasi Member</label>
                <input type="number" class="form-control" name="member_register_bonus" value="${(req && req.appConfig && req.appConfig.member_register_bonus) || 50}">
              </div>
              <div class="col-md-4">
                <label class="form-label">Pendaftaran Member</label>
                <select class="form-select" name="member_register_enabled">
                  <option value="1" ${(req && req.appConfig && Number(req.appConfig.member_register_enabled || 0) === 1) ? 'selected' : ''}>ON (Buka)</option>
                  <option value="0" ${(req && req.appConfig && Number(req.appConfig.member_register_enabled || 0) !== 1) ? 'selected' : ''}>OFF (Tutup)</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label">Tutup Selama (jam)</label>
                <input type="number" min="0" class="form-control" name="member_register_pause_hours" value="0" placeholder="Contoh: 12">
                <div class="text-muted mt-1" style="font-size:11px;">Jika nilai > 0, sistem otomatis menutup pendaftaran, menyembunyikan form daftar, dan menampilkan notice countdown.</div>
              </div>
              <div class="col-12">
                <div class="text-muted" style="font-size:12px;">
                  Jadwal buka kembali saat ini:
                  <strong>${esc((req && req.appConfig && req.appConfig.member_register_reopen_at) || '-')}</strong>
                </div>
              </div>
              <div class="col-md-4">
                <label class="form-label">Batas Salah PIN</label>
                <input type="number" class="form-control" name="member_pin_max_attempts" value="${(req && req.appConfig && req.appConfig.member_pin_max_attempts) || 5}">
              </div>
              <div class="col-md-4">
                <label class="form-label">Durasi Lock PIN (menit)</label>
                <input type="number" class="form-control" name="member_pin_lock_minutes" value="${(req && req.appConfig && req.appConfig.member_pin_lock_minutes) || 15}">
              </div>
            </div>

            <div class="section-title mt-0" style="margin-bottom:12px;">H2H Deposit Credentials</div>
            <div class="row g-3 mb-4">
              <div class="col-md-4">
                <label class="form-label">H2H Member ID</label>
                <input type="text" class="form-control" name="h2h_member_id" value="${esc((req && req.appConfig && req.appConfig.h2h_member_id) || '')}" placeholder="username_h2h">
              </div>
              <div class="col-md-4">
                <label class="form-label">H2H PIN</label>
                <div class="input-group">
                  <input type="password" class="form-control" name="h2h_pin" id="settings-h2h-pin" value="${esc((req && req.appConfig && req.appConfig.h2h_pin) || '')}" placeholder="123456">
                  <button class="btn btn-outline-secondary" type="button" onclick="togglePassword('settings-h2h-pin', this)"><i class="bi bi-eye"></i></button>
                </div>
              </div>
              <div class="col-md-4">
                <label class="form-label">H2H Password</label>
                <div class="input-group">
                  <input type="password" class="form-control" name="h2h_password" id="settings-h2h-password" value="${esc((req && req.appConfig && req.appConfig.h2h_password) || '')}" placeholder="password_h2h">
                  <button class="btn btn-outline-secondary" type="button" onclick="togglePassword('settings-h2h-password', this)"><i class="bi bi-eye"></i></button>
                </div>
              </div>
              <div class="col-12">
                <label class="form-label">H2H Base URL</label>
                <input type="text" class="form-control" name="h2h_base_url" value="${esc((req && req.appConfig && req.appConfig.h2h_base_url) || 'https://api.h2h.id/api/trx')}" placeholder="https://api.h2h.id/api/trx">
              </div>
            </div>

            <div class="section-title mt-0" style="margin-bottom:12px;">Metode Pembayaran Deposit</div>
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div class="text-muted" style="font-size:12px;">Ambil daftar metode dari H2H, lalu admin bisa custom ON/OFF dan icon per metode.</div>
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-outline-info btn-sm" onclick="loadPaymentMethods()"><i class="bi bi-arrow-repeat me-1"></i>Load dari H2H</button>
                <button type="button" class="btn btn-success-soft btn-sm" onclick="savePaymentMethods()"><i class="bi bi-save me-1"></i>Simpan Method</button>
              </div>
            </div>
            <div class="table-responsive">
              <table class="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Type</th>
                    <th>Fee</th>
                    <th>Range</th>
                    <th>Enabled</th>
                    <th>Custom Label</th>
                    <th>Icon URL</th>
                  </tr>
                </thead>
                <tbody id="payment-methods-body">
                  <tr><td colspan="7" class="text-center text-muted">Belum dimuat.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="d-flex gap-2 mt-4 settings-actionbar">
          <button type="submit" class="btn btn-primary d-flex align-items-center gap-2 px-4 py-2">
            <i class="bi bi-floppy-fill"></i><span>Simpan Semua Perubahan</span>
          </button>
          <button type="button" class="btn btn-danger-soft" onclick="if(confirm('Reset semua statistik hari ini?')) { document.getElementById('reset-stats-form').submit(); }">
            <i class="bi bi-trash-fill me-1"></i>Reset Statistik
          </button>
        </div>
      </form>
<form id="reset-stats-form" action="/admin/reset" method="POST" style="display:none;"></form>
    </div>
  </div>

  `;
  }
};


