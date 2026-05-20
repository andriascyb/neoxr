/**
 * admin/sections/redis_cache.js
 * Redis Cache Audit — PageHeader Claude-like menggantikan section-title lama.
 * Semua DOM ID dipertahankan: redis-audit-service, redis-audit-q,
 * redis-audit-status, redis-audit-body, redis-audit-page-info, dll.
 */
const { renderPageHeader } = require('../components');

module.exports = function renderRedisCacheSection() {
  const pageHeader = renderPageHeader({
    icon:     'bi-memory',
    title:    'Redis Cache Audit',
    subtitle: 'Pantau, cari, dan bersihkan cache key aplikasi secara langsung.',
    actions: `
      <button class="btn btn-sm btn-outline-secondary" onclick="setRedisAuditPage(1)">
        <i class="bi bi-arrow-repeat me-1"></i>Refresh
      </button>
      <button class="btn btn-sm btn-danger-soft" onclick="flushRedisAuditPrefix()">
        <i class="bi bi-trash me-1"></i>Flush Prefix App
      </button>`
  });

  return `
  <div id="main-redis-cache" class="main-tab-pane" style="display:none;">

    ${pageHeader}

    <div class="card mb-3 mt-3">
      <div class="card-body">
        <div class="row g-2 align-items-end">
          <div class="col-md-2">
            <label class="form-label">Service</label>
            <select id="redis-audit-service" class="form-select" onchange="setRedisAuditPage(1)">
              <option value="">Semua</option>
              <option value="bank">Bank</option>
              <option value="ewallet">E-Wallet</option>
              <option value="nik">NIK</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Cari Key</label>
            <div class="input-group">
              <span class="input-group-text bg-transparent"><i class="bi bi-search text-muted"></i></span>
              <input id="redis-audit-q" type="text" class="form-control border-start-0"
                placeholder="contoh: 0812 atau bca" oninput="setRedisAuditPage(1)">
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-header d-flex align-items-center gap-2">
        <i class="bi bi-circle-fill" style="font-size:8px;color:var(--kr-green,#16a34a);"></i>
        <strong>Status Redis</strong>
      </div>
      <div class="card-body">
        <div id="redis-audit-status" class="text-muted">Loading status...</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><strong>Daftar Key Cache</strong></div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th class="ps-3">Key</th>
                <th>Service</th>
                <th>Code</th>
                <th>Target</th>
                <th>TTL</th>
                <th>Size</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody id="redis-audit-body">
              <tr>
                <td colspan="7" class="text-center py-4">
                  <span class="kr-skeleton-row">
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Memuat cache keys...
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 p-3 border-top">
          <div class="d-flex align-items-center gap-2">
            <label for="redis-audit-limit" class="mb-0 text-muted" style="font-size:12px;">Per Page</label>
            <select id="redis-audit-limit" class="form-select form-select-sm" style="width:90px;" onchange="setRedisAuditPage(1)">
              <option value="25">25</option>
              <option value="50" selected>50</option>
              <option value="100">100</option>
            </select>
          </div>
          <div id="redis-audit-page-info" class="text-muted" style="font-size:12px;">Page 1</div>
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-outline-secondary btn-sm" type="button" id="redis-audit-prev"
              onclick="setRedisAuditPage((window.__REDIS_AUDIT_PAGE__||1)-1)">Prev</button>
            <button class="btn btn-outline-secondary btn-sm" type="button" id="redis-audit-next"
              onclick="setRedisAuditPage((window.__REDIS_AUDIT_PAGE__||1)+1)">Next</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;
};

