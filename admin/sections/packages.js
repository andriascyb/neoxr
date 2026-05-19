module.exports = function renderPackagesSection(ctx = {}) {
  with (ctx) {
    return `<!-- ============================= PACKAGES TAB ============================= -->
  <div id="main-packages" class="main-tab-pane" style="display:none;">
    <div class="section-title"><i class="bi bi-box-seam-fill me-1"></i> Package Management</div>
    
    <!-- Add Package Button -->
    <div class="mb-3">
      <button class="btn btn-primary" onclick="showAddPackageModal()">
        <i class="bi bi-plus-lg me-1"></i>Tambah Package
      </button>
    </div>

    <!-- Packages List -->
    <div class="card">
      <div class="card-header">
        <span class="fw-600" style="font-weight:600;">Daftar Packages</span>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th class="ps-3">ID</th>
                <th>Nama</th>
                <th>Features</th>
                <th>Harga</th>
                <th>Durasi</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody id="package-table-body"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Package Form -->
    <div id="package-form-container" class="card mt-3" style="display:none;">
      <div class="card-header"><span id="pkg-form-title" class="fw-600" style="font-weight:600;">Tambah Package</span></div>
      <div class="card-body">
        <form onsubmit="savePackage(event)" id="package-form">
          <input type="hidden" id="pkg-id">
          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label">Nama Package</label>
              <input type="text" class="form-control" id="pkg-name" required placeholder="e.g., Basic, Pro, Premium">
            </div>
            <div class="col-md-6">
              <label class="form-label">Harga</label>
              <input type="number" class="form-control" id="pkg-price" required min="0" placeholder="0 = Free">
            </div>
            <div class="col-md-6">
              <label class="form-label">Durasi (Hari)</label>
              <input type="number" class="form-control" id="pkg-duration-days" required min="1" value="30">
            </div>
          </div>
          <div class="row g-3 mb-3">
            <div class="col-md-12">
              <label class="form-label">Features (Pilih yang tersedia)</label>
              <div class="row g-2">
                <div class="col-md-6">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="feat-bank" value="bank">
                    <label class="form-check-label" for="feat-bank">
                      Bank Account Check
                    </label>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="feat-ewallet" value="ewallet">
                    <label class="form-check-label" for="feat-ewallet">
                      E-Wallet Check
                    </label>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="feat-nik" value="nik">
                    <label class="form-check-label" for="feat-nik">
                      NIK Check
                    </label>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="feat-whatsapp" value="whatsapp">
                    <label class="form-check-label" for="feat-whatsapp">
                      WhatsApp Check
                    </label>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="feat-games" value="games">
                    <label class="form-check-label" for="feat-games">
                      <i class="bi bi-controller me-1 text-primary"></i>Games ID Check
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary"><i class="bi bi-check-lg me-1"></i>Simpan</button>
            <button type="button" class="btn btn-success-soft" onclick="hidePackageForm()"><i class="bi bi-x-lg me-1"></i>Batal</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  `;
  }
};
