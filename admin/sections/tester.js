module.exports = function renderTesterSection(ctx = {}) {
  with (ctx) {
    return `<div id="main-tester" class="main-tab-pane" style="display:none;">
    <div class="section-title"><i class="bi bi-activity me-1"></i> API Health Tester</div>
    <div class="card">
      <div class="card-body">
        <div class="row g-3 mb-3">
          <div class="col-md-6">
            <label class="form-label">Pilih User (Cepat)</label>
            <select class="form-select" id="tt-user-select" onchange="onTesterUserChange()">
              <option value="">-- Pilih User --</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">API Key Pengirim <span class="text-muted" style="font-size:11px;">(digunakan jika server = Auto)</span></label>
            <input type="text" class="form-control" id="tt-api-key" placeholder="Masukkan API Key manual atau pilih user">
          </div>
        </div>
        <!-- Tab Nav -->
        <ul class="nav nav-pills mb-3" id="tester-tabs">
          <li class="nav-item"><button class="nav-link active" onclick="switchTab('wa', this); return false;">WhatsApp</button></li>
          <li class="nav-item"><button class="nav-link" onclick="switchTab('bnk', this); return false;">Bank</button></li>
          <li class="nav-item"><button class="nav-link" onclick="switchTab('ewl', this); return false;">E-Wallet</button></li>
          <li class="nav-item"><button class="nav-link" onclick="switchTab('bpjs', this); return false;">BPJS</button></li>
          <li class="nav-item"><button class="nav-link" onclick="switchTab('pln', this); return false;">PLN</button></li>
          <li class="nav-item"><button class="nav-link" onclick="switchTab('nik', this); return false;">NIK</button></li>
          <li class="nav-item"><button class="nav-link" onclick="switchTab('gmc', this); return false;"><i class="bi bi-controller me-1"></i>Games</button></li>
          <li class="nav-item"><button class="nav-link" onclick="switchTab('ai', this); return false;"><i class="bi bi-stars me-1"></i>Foto Editor</button></li>
        </ul>
        <!-- Tab Panes -->
        <div id="tab-wa" class="tab-pane">
          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label">Nomor WA</label>
              <input type="text" class="form-control" id="tt-wa-num" placeholder="08xxxx...">
            </div>
            <div class="col-md-6">
              <label class="form-label"><i class="bi bi-server me-1 text-info"></i>Pilih Server</label>
              <select class="form-select" id="tt-srv-wa">
                <option value="auto">Auto (sesuai priority config)</option>
                <option value="server1">Server 1 (Fonnte)</option>
                <option value="server2">Server 2 (Pitucode)</option>
              </select>
            </div>
          </div>
          <button class="btn btn-success-soft" id="btn-whatsapp" onclick="testAPI('whatsapp', null, 'tt-wa-num', 'tt-srv-wa')">
            <i class="bi bi-play-fill me-1"></i>Test WhatsApp
          </button>
        </div>
        <div id="tab-bnk" class="tab-pane" style="display:none;">
          <div class="row g-3 mb-3">
            <div class="col-md-4">
              <label class="form-label">Bank Code</label>
              <input type="text" class="form-control" id="tt-cd-bnk" placeholder="002">
            </div>
            <div class="col-md-4">
              <label class="form-label">Rekening</label>
              <input type="text" class="form-control" id="tt-num-bnk" placeholder="No rekening">
            </div>
            <div class="col-md-4">
              <label class="form-label"><i class="bi bi-server me-1 text-info"></i>Pilih Server</label>
              <select class="form-select" id="tt-srv-bnk">
                <option value="auto">Auto (load balanced)</option>
                <option value="server1">Server 1 (Main)</option>
                <option value="server2">Server 2 (AasardConnect)</option>
                <option value="server3">Server 3 (RrtravelNbx)</option>
                <option value="server4">Server 4 (Cutiezy)</option>
                <option value="server5">Server 5 (Custom HTTP / codeid)</option>
                <option value="server6">Server 6 (Laburagame / codeid)</option>
                <option value="server7">Server 7 (Rikipilkonokos / codeid)</option>
              </select>
            </div>
          </div>
          <button class="btn btn-success-soft" id="btn-bank" onclick="testAPI('bank', 'tt-cd-bnk', 'tt-num-bnk', 'tt-srv-bnk')">
            <i class="bi bi-play-fill me-1"></i>Test Bank
          </button>
        </div>
        <div id="tab-ewl" class="tab-pane" style="display:none;">
          <div class="row g-3 mb-3">
            <div class="col-md-4">
              <label class="form-label">E-Wallet</label>
              <input type="text" class="form-control" id="tt-cd-ewl" placeholder="dana / ovo / linkaja / shopeepay">
            </div>
            <div class="col-md-4">
              <label class="form-label">No HP</label>
              <input type="text" class="form-control" id="tt-num-ewl" placeholder="08xxxx...">
            </div>
            <div class="col-md-4">
              <label class="form-label"><i class="bi bi-server me-1 text-info"></i>Pilih Server</label>
              <select class="form-select" id="tt-srv-ewl">
                <option value="auto">Auto (load balanced)</option>
                <option value="server1">Server 1 (Main)</option>
                <option value="server2">Server 2 (BillPaketData)</option>
                <option value="server3">Server 3 (Cutiezy)</option>
                <option value="server5">Server 5 (Qiospay Callback)</option>
                <option value="server6">Server 6 (Laburagame)</option>
                <option value="server7">Server 7 (CekAPI)</option>
                <option value="server8">Server 8 (Rikipilkonokos)</option>
              </select>
            </div>
          </div>
          <button class="btn btn-success-soft" id="btn-ewallet" onclick="testAPI('ewallet', 'tt-cd-ewl', 'tt-num-ewl', 'tt-srv-ewl')">
            <i class="bi bi-play-fill me-1"></i>Test E-Wallet
          </button>
        </div>
        <div id="tab-bpjs" class="tab-pane" style="display:none;">
          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label">No Pelanggan BPJS</label>
              <input type="text" class="form-control" id="tt-num-bpjs" placeholder="Nomor pelanggan BPJS">
            </div>
            <div class="col-md-6">
              <label class="form-label"><i class="bi bi-server me-1 text-info"></i>Pilih Server</label>
              <select class="form-select" id="tt-srv-bpjs">
                <option value="server7">Server 7 (KlikMBC PPOB)</option>
              </select>
            </div>
          </div>
          <button class="btn btn-success-soft" id="btn-bpjs" onclick="testAPI('bpjs', null, 'tt-num-bpjs', 'tt-srv-bpjs')">
            <i class="bi bi-play-fill me-1"></i>Test BPJS
          </button>
        </div>
        <div id="tab-pln" class="tab-pane" style="display:none;">
          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label">No Pelanggan PLN</label>
              <input type="text" class="form-control" id="tt-num-pln" placeholder="Nomor pelanggan PLN">
            </div>
            <div class="col-md-6">
              <label class="form-label"><i class="bi bi-server me-1 text-info"></i>Pilih Server</label>
              <select class="form-select" id="tt-srv-pln">
                <option value="server7">Server 7 (KlikMBC PPOB)</option>
              </select>
            </div>
          </div>
          <button class="btn btn-success-soft" id="btn-pln" onclick="testAPI('pln', null, 'tt-num-pln', 'tt-srv-pln')">
            <i class="bi bi-play-fill me-1"></i>Test PLN
          </button>
        </div>
        <div id="tab-nik" class="tab-pane" style="display:none;">
          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label">No NIK</label>
              <input type="text" class="form-control" id="tt-num-nik" placeholder="16 digit NIK">
            </div>
            <div class="col-md-6">
              <label class="form-label"><i class="bi bi-server me-1 text-info"></i>Pilih Server</label>
              <select class="form-select" id="tt-srv-nik">
                <option value="auto">Auto / Server 1 (Main)</option>
              </select>
            </div>
          </div>
          <button class="btn btn-success-soft" id="btn-nik" onclick="testAPI('nik', null, 'tt-num-nik', 'tt-srv-nik')">
            <i class="bi bi-play-fill me-1"></i>Test NIK
          </button>
        </div>
        <div id="tab-gmc" class="tab-pane" style="display:none;">
          <div class="row g-3 mb-3">
            <div class="col-md-4">
              <label class="form-label"><i class="bi bi-controller me-1"></i>Game</label>
              <select class="form-select" id="tt-gmc-service" onchange="onGameServiceChange()">
                <optgroup label="Mobile Legends">
                  <option value="region-ml">Mobile Legends – Region (+ Zone ID)</option>
                  <option value="mlbb-bundle">Mobile Legends – Bundle (+ Zone ID)</option>
                  <option value="mlcreate">Mobile Legends – Create Date (+ Zone ID)</option>
                  <option value="first-topup">Mobile Legends – First Topup (+ Zone ID)</option>
                  <option value="first-mcgg">Magic Chess Go Go – First Topup (+ Zone ID)</option>
                </optgroup>
                <optgroup label="Garena">
                  <option value="free-fire">Free Fire</option>
                  <option value="undawn">Garena Undawn</option>
                </optgroup>
                <optgroup label="Tencent / Activision">
                  <option value="pubg">PUBG Mobile</option>
                  <option value="codm">Call of Duty Mobile</option>
                </optgroup>
                <optgroup label="HoYoverse">
                  <option value="genshin">Genshin Impact</option>
                  <option value="hsr">Honkai: Star Rail</option>
                  <option value="zenless">Zenless Zone Zero</option>
                </optgroup>
                <optgroup label="Lainnya">
                  <option value="hok">Honor of Kings</option>
                  <option value="blood-strike">Blood Strike</option>
                  <option value="valorant">Valorant (format: name#tag)</option>
                  <option value="roblox">Roblox (username)</option>
                </optgroup>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">User ID / Username</label>
              <input type="text" class="form-control" id="tt-gmc-uid" placeholder="ID akun / username">
            </div>
            <div class="col-md-4" id="tt-gmc-zone-wrap">
              <label class="form-label">Zone ID <span class="badge" style="background:rgba(248,81,73,.15);color:#f85149;font-size:10px;">Wajib ML</span></label>
              <input type="text" class="form-control" id="tt-gmc-zone" placeholder="cth: 15661">
            </div>
          </div>
          <button class="btn btn-success-soft" id="btn-games" onclick="testGames()">
            <i class="bi bi-play-fill me-1"></i>Test Games
          </button>
        </div>
        <div id="tab-ai" class="tab-pane" style="display:none;">
          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label">URL Gambar</label>
              <input type="text" class="form-control" id="tt-ai-image" placeholder="https://example.com/image.jpg">
            </div>
            <div class="col-md-6">
              <label class="form-label">Prompt Foto Editor (max 100)</label>
              <input type="text" class="form-control" id="tt-ai-q" maxlength="100" placeholder="cartoon style, clean background">
            </div>
          </div>
          <button class="btn btn-success-soft" id="btn-ai" onclick="testAPI('ai', 'tt-ai-q', 'tt-ai-image', 'tt-srv-ai')">
            <i class="bi bi-play-fill me-1"></i>Test Foto Editor
          </button>
          <select class="form-select mt-2" id="tt-srv-ai" style="max-width:220px; display:none;">
            <option value="server_neoxr">Neoxr</option>
          </select>
        </div>
        <pre id="test-result"></pre>
      </div>
    </div>
  </div>

  <!-- Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â MYSQL MANAGEMENT TAB Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ -->
  `;
  }
};
