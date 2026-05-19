module.exports = function renderDashboardScript() {
  return `
    let dashboardData = null;
    let depositMethods = [];
    let activeMemberView = (window.__MEMBER_VIEW__ || 'dashboard');
    const seenPolicyNoticeKeys = new Set();
    let activePolicyNoticeKey = '';

    const MEMBER_VIEWS = {
      dashboard: {
        title: 'Dashboard',
        subtitle: 'Ringkasan akun, mode aktif, balance API, dan aktivitas terbaru.'
      },
      deposit: {
        title: 'Topup & Deposit',
        subtitle: 'Buat deposit baru, cek metode pembayaran aktif, dan pantau invoice pending.'
      },
      apikey: {
        title: 'API Key',
        subtitle: 'Kelola API key utama untuk penggunaan harian Anda.'
      },
      security: {
        title: 'Keamanan',
        subtitle: 'Cek status akun, aturan PIN, dan kontrol keamanan API key.'
      }
    };

    const MEMBER_VIEW_ROUTES = {
      dashboard: '/member/dashboard',
      deposit: '/member/deposit',
      apikey: '/member/apikey',
      security: '/member/security'
    };

    function escapeHtml(value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function formatNumber(value) {
      const numeric = Number(value || 0);
      return Number.isFinite(numeric) ? numeric.toLocaleString('id-ID') : '0';
    }

    function formatDateTime(value) {
      if (!value) return '-';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return date.toLocaleString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    function formatDateOnly(value) {
      if (!value) return '-';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: '2-digit'
      });
    }

    function getPendingTopups(topups) {
      return (Array.isArray(topups) ? topups : []).filter(function(item) {
        return normalizeTopupStatus(item) === 'pending';
      });
    }

    function normalizeTopupStatus(item) {
      const raw = String((item && item.status) || '').toLowerCase();
      const status = raw || 'pending';
      if (status !== 'pending') return status;
      if (!item || !item.expired_at) return status;
      const expiredAt = new Date(item.expired_at);
      if (Number.isNaN(expiredAt.getTime())) return status;
      return expiredAt.getTime() <= Date.now() ? 'expired' : 'pending';
    }

    function hasActivePendingTopup() {
      return getPendingTopups(currentTopups()).length > 0;
    }

    function renderQrisBlock(qrString, invoice) {
      if (!invoice) return '';
      const label = invoice ? ('QRIS ' + invoice) : 'QRIS';
      const qrUrl = '/api/v3/member/deposit/' + encodeURIComponent(String(invoice)) + '/qr';
      return '<div class="qris-box">' +
        '<div class="qris-box__title">Scan QRIS</div>' +
        '<img class="qris-box__image" src="' + qrUrl + '" alt="' + escapeHtml(label) + '">' +
      '</div>';
    }

    function navigateMemberView(view) {
      const target = MEMBER_VIEW_ROUTES[view];
      if (!target) return;
      if (window.location.pathname !== target) {
        window.location.href = target;
      }
    }

    window.navigateMemberView = navigateMemberView;

    function showMessage(text, ok) {
      const el = document.getElementById('msg');
      if (!el) return;
      el.textContent = text;
      el.className = 'notice ' + (ok ? 'is-success' : 'is-error');
      el.style.display = 'block';
    }

    function showEmpty(message) {
      return '<div class="empty-state">' + escapeHtml(message) + '</div>';
    }

    function currentMember() {
      return (dashboardData && dashboardData.member) || {};
    }

    function currentApiKey() {
      return (dashboardData && dashboardData.api_key) || {};
    }

    function currentTopups() {
      return (dashboardData && dashboardData.topups) || [];
    }

    function currentHitStats() {
      return (dashboardData && dashboardData.hit_stats) || {
        today: { total: 0, success: 0, failed: 0 },
        last7d: { total: 0, success: 0, failed: 0 },
        last30d: { total: 0, success: 0, failed: 0 },
        alltime: { total: 0, success: 0, failed: 0 }
      };
    }

    function currentBalanceConsumption() {
      return (dashboardData && dashboardData.balance_consumption) || { today: 0, last7d: 0, last30d: 0, alltime: 0 };
    }

    function currentPricing() {
      return (dashboardData && dashboardData.pricing) || { bank: 0, ewallet: 0 };
    }

    function currentPricingServices() {
      if (dashboardData && Array.isArray(dashboardData.pricing_services) && dashboardData.pricing_services.length) {
        return dashboardData.pricing_services;
      }
      const pricing = currentPricing();
      return [
        { key: 'bank', label: 'Bank', price: Number(pricing.bank || 0), unit: 'per hit sukses', active: true },
        { key: 'ewallet', label: 'E-Wallet', price: Number(pricing.ewallet || 0), unit: 'per hit sukses', active: true }
      ];
    }

    function currentInvalidPolicy() {
      return (dashboardData && dashboardData.invalid_policy) || {
        enabled: true,
        invalid_quota_24h: 500,
        invalid_penalty_percent: 50
      };
    }

    function closePolicyNoticeModal() {
      const modal = document.getElementById('invalid-policy-modal');
      if (modal) modal.classList.remove('show');
      if (activePolicyNoticeKey) {
        seenPolicyNoticeKeys.add(activePolicyNoticeKey);
        try { localStorage.setItem(activePolicyNoticeKey, '1'); } catch (e) { }
        try { sessionStorage.setItem(activePolicyNoticeKey, '1'); } catch (e) { }
      }
    }

    function ensurePolicyNoticeModal() {
      let modal = document.getElementById('invalid-policy-modal');
      if (modal) return modal;
      modal = document.createElement('div');
      modal.id = 'invalid-policy-modal';
      modal.className = 'member-modal';
      modal.innerHTML = '' +
        '<div class="member-modal__backdrop" onclick="closePolicyNoticeModal()"></div>' +
        '<div class="member-modal__dialog">' +
          '<div class="member-modal__header"><strong>Kebijakan Hit Tidak Valid</strong><button class="btn btn-soft" type="button" onclick="closePolicyNoticeModal()">Tutup</button></div>' +
          '<div class="member-modal__body" id="invalid-policy-modal-body"></div>' +
          '<div class="member-modal__footer"><button class="btn btn-primary" type="button" onclick="closePolicyNoticeModal()">Saya Mengerti</button></div>' +
        '</div>';
      document.body.appendChild(modal);
      return modal;
    }

    function showInvalidPolicyNotice() {
      const policy = currentInvalidPolicy();
      if (!policy || policy.enabled === false) return;
      const quota = Number(policy.invalid_quota_24h || 500);
      const percent = Number(policy.invalid_penalty_percent || 50);
      const policyKey = 'member_invalid_policy_notice_v1_' + quota + '_' + percent;
      activePolicyNoticeKey = policyKey;
      if (seenPolicyNoticeKeys.has(policyKey)) return;
      let alreadySeen = false;
      try { alreadySeen = localStorage.getItem(policyKey) === '1'; } catch (e) { alreadySeen = false; }
      if (!alreadySeen) {
        try { alreadySeen = sessionStorage.getItem(policyKey) === '1'; } catch (e) { alreadySeen = false; }
      }
      if (alreadySeen) {
        seenPolicyNoticeKeys.add(policyKey);
        return;
      }
      const modal = ensurePolicyNoticeModal();
      const body = document.getElementById('invalid-policy-modal-body');
      if (body) {
        body.innerHTML = '' +
          '<div class="history-meta" style="margin-bottom:10px;">Sistem mencatat hit gagal validasi per API key dalam periode 24 jam.</div>' +
          '<div class="panel-item">' +
            '<strong>Batas Invalid 24 Jam</strong>' +
            '<div class="history-meta">' + escapeHtml(formatNumber(quota)) + ' hit gagal per layanan.</div>' +
          '</div>' +
          '<div class="panel-item">' +
            '<strong>Setelah Lewat Batas</strong>' +
            '<div class="history-meta">Setiap hit gagal berikutnya dikenakan penalti <strong>' + escapeHtml(String(percent)) + '%</strong> dari harga layanan.</div>' +
          '</div>' +
          '<div class="warning-note">Hit sukses tetap mengikuti biaya normal layanan. Detail penalti akan muncul pada response JSON saat hit gagal.</div>';
      }
      modal.classList.add('show');
    }
    window.closePolicyNoticeModal = closePolicyNoticeModal;

    function closeMemberSidebar() {
      const sidebar = document.getElementById('member-sidebar');
      const overlay = document.getElementById('member-sidebar-overlay');
      if (sidebar) sidebar.classList.remove('show');
      if (overlay) overlay.classList.remove('show');
    }

    function toggleMemberSidebar(forceOpen) {
      const sidebar = document.getElementById('member-sidebar');
      const overlay = document.getElementById('member-sidebar-overlay');
      if (!sidebar || !overlay) return;
      const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !sidebar.classList.contains('show');
      sidebar.classList.toggle('show', shouldOpen);
      overlay.classList.toggle('show', shouldOpen);
    }

    window.toggleMemberSidebar = toggleMemberSidebar;

    function renderTopbarActions(view) {
      const actions = {
        dashboard: [
          '<button class="btn btn-secondary" type="button" onclick="reloadDashboard()">Muat Ulang</button>',
          '<button class="btn btn-primary" type="button" onclick="navigateMemberView(\\'deposit\\')">Topup Saldo</button>'
        ],
        deposit: [
          '<button class="btn btn-primary" type="button" onclick="createTopup()">Buat Deposit</button>',
          '<button class="btn btn-secondary" type="button" onclick="reloadDashboard()">Refresh</button>'
        ],
        apikey: [
          '<button class="btn btn-primary" type="button" onclick="copyApiKey()">Salin API Key</button>',
          '<button class="btn btn-secondary" type="button" onclick="regenerateApiKey()">Generate Baru</button>'
        ],
        security: [
          '<button class="btn btn-secondary" type="button" onclick="regenerateApiKey()">Amankan API Key</button>'
        ]
      };
      const el = document.getElementById('topbar-actions');
      if (!el) return;
      el.innerHTML = (actions[view] || actions.dashboard).join('');
    }

    function updateViewHeading(view) {
      const config = MEMBER_VIEWS[view] || MEMBER_VIEWS.dashboard;
      const title = document.getElementById('member-view-title');
      const subtitle = document.getElementById('member-view-subtitle');
      if (title) title.textContent = config.title;
      if (subtitle) subtitle.textContent = config.subtitle;
      renderTopbarActions(view);
    }

    function switchMemberView(view) {
      const nextView = MEMBER_VIEWS[view] ? view : 'dashboard';
      if (nextView === activeMemberView) return;
      navigateMemberView(nextView);
    }

    window.switchMemberView = switchMemberView;

    function renderSidebarProfile() {
      const member = currentMember();
      const initial = String(member.name || 'M').trim().charAt(0).toUpperCase() || 'M';
      const avatar = document.getElementById('sidebar-avatar');
      const name = document.getElementById('sidebar-member-name');
      const wa = document.getElementById('sidebar-member-wa');
      const modeBadge = document.getElementById('sidebar-member-mode');
      const api = currentApiKey();
      const balanceBadge = document.getElementById('sidebar-member-balance');
      const footerTitle = document.getElementById('sidebar-footer-title');
      const footerCopy = document.getElementById('sidebar-footer-copy');
      if (avatar) avatar.textContent = initial;
      if (name) name.textContent = member.name || 'Member';
      if (wa) wa.textContent = member.whatsapp_number || '-';
      if (modeBadge) {
        modeBadge.textContent = 'BALANCE';
        modeBadge.className = 'badge success';
      }
      if (balanceBadge) balanceBadge.textContent = 'Balance ' + formatNumber(api.balance || 0);
      if (footerTitle) footerTitle.textContent = 'Siap dipakai';
      if (footerCopy) {
        footerCopy.textContent = 'Portal berjalan dalam mode saldo-only. Topup akan langsung menambah balance API.';
      }
    }

    function renderHero() {
      const member = currentMember();
      const api = currentApiKey();
      const pendingTopups = getPendingTopups(currentTopups());
      const hits = currentHitStats();
      const usageCost = currentBalanceConsumption();
      const apiStatus = api.api_key ? (Number(api.is_active) === 1 ? 'Aktif' : 'Nonaktif') : 'Belum ada';

      const heroGreeting = document.getElementById('hero-greeting');
      const heroSubtitle = document.getElementById('hero-subtitle');
      if (heroGreeting) heroGreeting.textContent = 'Halo, ' + (member.name || 'Member');
      if (heroSubtitle) heroSubtitle.textContent = 'Akun Anda berjalan dalam mode saldo-only. Pemakaian per hit memotong balance API.';

      const metrics = document.getElementById('hero-metrics');
      if (metrics) {
        metrics.innerHTML = [
          { label: 'Balance API', value: formatNumber(api.balance || 0), desc: 'Saldo aktif yang dipotong untuk pemakaian validasi.' },
          { label: 'Konsumsi Hari Ini', value: formatNumber(usageCost.today || 0), desc: 'Total saldo terpakai pada tanggal berjalan.' },
          { label: 'Mode Aktif', value: 'BALANCE', desc: 'Mode saldo memotong pemakaian dari balance API.' },
          { label: 'API Key', value: api.api_key ? api.api_key.slice(0, 16) + '...' : 'Belum ada', desc: 'Status sekarang: ' + apiStatus + '.' },
          { label: 'Hit Hari Ini', value: formatNumber((hits.today && hits.today.total) || 0), desc: 'Total request validasi pada tanggal berjalan.' },
          { label: 'Topup Pending', value: String(pendingTopups.length), desc: pendingTopups.length ? 'Segera cek status pembayaran terakhir Anda.' : 'Tidak ada deposit yang menunggu pembayaran.' }
        ].map(function(item) {
          return '<div class="metric-card">' +
            '<small>' + escapeHtml(item.label) + '</small>' +
            '<strong>' + escapeHtml(item.value) + '</strong>' +
            '<span>' + escapeHtml(item.desc) + '</span>' +
          '</div>';
        }).join('');
      }

      const side = document.getElementById('hero-side');
      if (!side) return;
      const sideHtml = [];
      sideHtml.push('<div class="mode-banner balance">' +
        '<strong>Mode Saldo Aktif</strong>' +
        '<p>Topup Anda akan langsung menambah balance API agar siap dipakai untuk validasi.</p>' +
      '</div>');
      sideHtml.push('<div class="warning-note">Fitur package sudah dinonaktifkan. Semua transaksi menggunakan saldo langsung.</div>');
      side.innerHTML = sideHtml.join('');
    }

    function renderQuickActions() {
      const el = document.getElementById('quick-actions');
      if (!el) return;
      el.innerHTML = [
        '<button class="btn btn-primary" type="button" onclick="navigateMemberView(\\'deposit\\')">Topup Saldo</button>',
        '<button class="btn btn-soft" type="button" onclick="copyApiKey()">Salin API Key</button>',
        '<button class="btn btn-soft" type="button" onclick="navigateMemberView(\\'security\\')">Info Keamanan</button>'
      ].join('');
    }

    function renderDashboardSummary() {
      const member = currentMember();
      const api = currentApiKey();
      const topups = currentTopups();
      const hits = currentHitStats();
      const usageCost = currentBalanceConsumption();
      const pricingServices = currentPricingServices();
      const pending = getPendingTopups(topups);
      const target = document.getElementById('dashboard-summary-pane');
      if (!target) return;
      const html = [];
      html.push('<div class="kv-grid">' +
        '<div class="kv-item"><small>Nama</small><strong>' + escapeHtml(member.name || '-') + '</strong></div>' +
        '<div class="kv-item"><small>WhatsApp</small><strong>' + escapeHtml(member.whatsapp_number || '-') + '</strong></div>' +
        '<div class="kv-item"><small>Balance API</small><strong>' + escapeHtml(formatNumber(api.balance || 0)) + '</strong></div>' +
        '<div class="kv-item"><small>Topup Tercatat</small><strong>' + escapeHtml(String(topups.length || 0)) + '</strong></div>' +
      '</div>');
      if (pending.length) {
        html.push('<div class="history-item"><div class="history-head"><strong>Pembayaran Menunggu</strong><span class="badge warn">' + pending.length + ' pending</span></div>' +
          pending.slice(0, 2).map(function(item) {
            const methodName = item.method_name || item.payment_method_name || item.method_code || '-';
            const expiryText = item.expired_at ? (' · berlaku s.d. ' + formatDateTime(item.expired_at)) : '';
            return '<div class="history-meta">' + escapeHtml(item.invoice || '-') + ' · ' + escapeHtml(methodName) + ' · total ' + escapeHtml(formatNumber(item.total_amount || 0)) + escapeHtml(expiryText) + '</div>';
          }).join('') +
        '</div>');
      }
      html.push('<div class="history-item"><div class="history-head"><strong>Aktivitas Terakhir</strong><span class="badge success">Ringkas</span></div>' +
        '<div class="history-meta">Login terakhir: ' + escapeHtml(formatDateTime(member.last_login_at)) + '</div>' +
        '<div class="history-meta">API key aktif: ' + escapeHtml(api.api_key ? api.api_key.slice(0, 14) + '...' : 'Belum ada') + '</div>' +
        '<div class="history-meta">Mode akun: SALDO ONLY</div>' +
        '<div class="history-meta">Topup terakhir: ' + escapeHtml(topups[0] ? (topups[0].invoice || '-') : 'Belum ada transaksi') + '</div>' +
      '</div>');
      html.push('<div class="period-stats">' +
        '<div class="period-stats__head">' +
          '<strong>Ringkasan Periode</strong>' +
          '<span class="badge success">Hit & Konsumsi</span>' +
        '</div>' +
        '<div class="period-stats__grid">' +
          '<div class="period-stats__row period-stats__row--head"><span>Periode</span><span>Total</span><span>Sukses</span><span>Gagal</span><span>Konsumsi</span></div>' +
          '<div class="period-stats__row"><span>Hari ini</span><span>' + escapeHtml(formatNumber((hits.today && hits.today.total) || 0)) + '</span><span>' + escapeHtml(formatNumber((hits.today && hits.today.success) || 0)) + '</span><span>' + escapeHtml(formatNumber((hits.today && hits.today.failed) || 0)) + '</span><span>' + escapeHtml(formatNumber(usageCost.today || 0)) + '</span></div>' +
          '<div class="period-stats__row"><span>7 hari</span><span>' + escapeHtml(formatNumber((hits.last7d && hits.last7d.total) || 0)) + '</span><span>' + escapeHtml(formatNumber((hits.last7d && hits.last7d.success) || 0)) + '</span><span>' + escapeHtml(formatNumber((hits.last7d && hits.last7d.failed) || 0)) + '</span><span>' + escapeHtml(formatNumber(usageCost.last7d || 0)) + '</span></div>' +
          '<div class="period-stats__row"><span>30 hari</span><span>' + escapeHtml(formatNumber((hits.last30d && hits.last30d.total) || 0)) + '</span><span>' + escapeHtml(formatNumber((hits.last30d && hits.last30d.success) || 0)) + '</span><span>' + escapeHtml(formatNumber((hits.last30d && hits.last30d.failed) || 0)) + '</span><span>' + escapeHtml(formatNumber(usageCost.last30d || 0)) + '</span></div>' +
          '<div class="period-stats__row"><span>All-time</span><span>' + escapeHtml(formatNumber((hits.alltime && hits.alltime.total) || 0)) + '</span><span>' + escapeHtml(formatNumber((hits.alltime && hits.alltime.success) || 0)) + '</span><span>' + escapeHtml(formatNumber((hits.alltime && hits.alltime.failed) || 0)) + '</span><span>' + escapeHtml(formatNumber(usageCost.alltime || 0)) + '</span></div>' +
        '</div>' +
      '</div>');
      html.push('<div class="period-stats">' +
        '<div class="period-stats__head">' +
          '<strong>Daftar Harga Layanan</strong>' +
          '<span class="badge">Per Hit</span>' +
        '</div>' +
        '<div class="history-meta">Biaya dipotong hanya saat validasi <strong>berhasil (hit sukses)</strong>.</div>' +
        '<div class="period-stats__grid">' +
          '<div class="period-stats__row period-stats__row--head period-stats__row--price"><span>Layanan</span><span>Harga</span><span>Satuan</span><span>Status</span></div>' +
          pricingServices.map(function(service) {
            const active = !!service.active;
            const statusText = active ? 'Aktif' : 'Tidak Aktif';
            const statusClass = active ? 'success' : 'danger';
            return '<div class="period-stats__row period-stats__row--price">' +
              '<span>' + escapeHtml(service.label || '-') + '</span>' +
              '<span>' + escapeHtml(formatNumber(service.price || 0)) + '</span>' +
              '<span>' + escapeHtml(service.unit || 'per hit sukses') + '</span>' +
              '<span><span class="badge ' + statusClass + '">' + escapeHtml(statusText) + '</span></span>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>');
      target.innerHTML = html.join('');
    }

    function renderDepositView() {
      const methods = Array.isArray(depositMethods) ? depositMethods : [];
      const select = document.getElementById('topup-method');
      const topupButton = document.getElementById('topup-submit');
      const lockNote = document.getElementById('topup-lock-note');
      const pendingTopups = getPendingTopups(currentTopups());
      const hasPending = pendingTopups.length > 0;
      if (select) {
        if (!methods.length) {
          select.innerHTML = '<option value="">Metode tidak tersedia</option>';
        } else {
          select.innerHTML = methods.map(function(item) {
            const range = Number(item.min_amount || 0) + ' - ' + Number(item.max_amount || 0);
            const providerCode = item.provider_code || item.code || '';
            return '<option value="' + escapeHtml(providerCode) + '">' +
              escapeHtml((item.name || item.code || '-') + ' · fee ' + formatNumber(item.fee_amount || 0) + ' · ' + range) +
            '</option>';
          }).join('');
        }
        select.disabled = hasPending;
      }

      if (topupButton) {
        topupButton.disabled = hasPending;
      }
      if (lockNote) {
        if (hasPending) {
          const pending = pendingTopups[0];
          const pendingUntil = pending.expired_at ? formatDateTime(pending.expired_at) : '-';
          lockNote.innerHTML = 'Topup baru dikunci karena masih ada deposit <strong>pending</strong> (' + escapeHtml(pending.invoice || '-') + ') hingga ' + escapeHtml(pendingUntil) + '.';
        } else {
          lockNote.textContent = 'Tidak ada pending aktif. Anda bisa membuat topup baru.';
        }
      }

      const methodsPane = document.getElementById('deposit-methods-pane');
      if (methodsPane) {
        methodsPane.innerHTML = methods.length
          ? methods.map(function(item) {
              return '<div class="panel-item"><strong>' + escapeHtml(item.name || item.code || '-') + '</strong><div class="history-meta">Kode: ' + escapeHtml(item.code || '-') + ' · Fee: ' + escapeHtml(formatNumber(item.fee_amount || 0)) + ' · Range: ' + escapeHtml(formatNumber(item.min_amount || 0)) + ' - ' + escapeHtml(formatNumber(item.max_amount || 0)) + '</div></div>';
            }).join('')
          : showEmpty('Metode pembayaran belum tersedia. Pastikan konfigurasi H2H sudah benar.');
      }

      const topups = currentTopups();
      const historyPane = document.getElementById('deposit-history-pane');
      if (!historyPane) return;
      if (!topups.length) {
        historyPane.innerHTML = showEmpty('Belum ada riwayat topup. Gunakan form deposit di atas untuk membuat transaksi baru.');
        return;
      }
      historyPane.innerHTML = '<div class="history-list">' + topups.map(function(item) {
        const status = normalizeTopupStatus(item);
        const statusClass = status === 'success' ? 'success' : (status === 'pending' ? 'warn' : 'danger');
        const methodName = item.method_name || item.payment_method_name || item.method_code || '-';
        const checkButton = status === 'pending'
          ? ('<div class="button-row"><button class="btn btn-secondary" type="button" onclick="checkTopup(\\'' + escapeHtml(item.invoice || '') + '\\')">Cek Status</button></div>')
          : '';
        return '<div class="history-item">' +
          '<div class="history-head"><strong>' + escapeHtml(item.invoice || '-') + '</strong><span class="badge ' +
            statusClass +
          '">' + escapeHtml(String(status || '-').toUpperCase()) + '</span></div>' +
          '<div class="history-meta">Metode: ' + escapeHtml(methodName) + '</div>' +
          '<div class="history-meta">Nominal: ' + escapeHtml(formatNumber(item.amount || 0)) + ' · Fee: ' + escapeHtml(formatNumber(item.fee || 0)) + ' · Total: ' + escapeHtml(formatNumber(item.total_amount || 0)) + '</div>' +
          '<div class="history-meta">Masa aktif pembayaran: ' + escapeHtml(item.expired_at ? formatDateTime(item.expired_at) : '-') + '</div>' +
          '<div class="history-meta">Dibuat: ' + escapeHtml(formatDateTime(item.created_at)) + '</div>' +
          checkButton +
        '</div>';
      }).join('') + '</div>';
    }

    function renderApiKeyView() {
      const api = currentApiKey();
      const member = currentMember();
      const html = [];
      if (!api.api_key) {
        html.push(showEmpty('Belum ada API key aktif. Anda bisa generate ulang dari panel ini.'));
      } else {
        html.push('<div class="panel-item apikey-card">' +
          '<strong>API Key Utama</strong>' +
          '<div class="mono apikey-secret">' + escapeHtml(api.api_key) + '</div>' +
          '<div class="kv-grid">' +
            '<div class="kv-item"><small>Status</small><strong>' + (Number(api.is_active) === 1 ? 'Aktif' : 'Nonaktif') + '</strong></div>' +
            '<div class="kv-item"><small>Billing</small><strong>' + escapeHtml(api.billing_type || '-') + '</strong></div>' +
            '<div class="kv-item"><small>Balance API</small><strong>' + escapeHtml(formatNumber(api.balance)) + '</strong></div>' +
            '<div class="kv-item"><small>Mode</small><strong>SALDO ONLY</strong></div>' +
          '</div>' +
        '</div>');
      }
      html.push('<div class="button-row apikey-actions">' +
        '<button class="btn btn-primary" type="button" onclick="copyApiKey()">Salin API Key</button>' +
        '<button class="btn btn-secondary" type="button" onclick="regenerateApiKey()">Generate Baru</button>' +
        '<button class="btn btn-danger" type="button" onclick="revokeApiKey()">Revoke</button>' +
      '</div>');
      html.push('<div class="panel-item apikey-identity"><strong>Identitas Akun</strong><div class="history-meta">' +
        escapeHtml(member.whatsapp_number || '-') + ' · dibuat pada ' + escapeHtml(formatDateOnly(member.created_at)) +
      '</div></div>');
      const pane = document.getElementById('apikey-panel');
      if (pane) pane.innerHTML = html.join('');
    }

    function renderSecurityView() {
      const member = currentMember();
      const api = currentApiKey();
      const pane = document.getElementById('security-pane');
      if (!pane) return;
      pane.innerHTML = [
        '<div class="panel-item"><strong>Status Akun</strong><div class="history-meta">Akun ' + (Number(member.is_active) === 1 ? 'aktif' : 'nonaktif') + '. Login terakhir pada ' + escapeHtml(formatDateTime(member.last_login_at)) + '.</div></div>',
        '<div class="panel-item"><strong>Aturan PIN</strong><div class="history-meta">PIN harus 6 digit angka. Salah 5 kali berturut-turut akan mengunci akun sementara sesuai kebijakan sistem.</div></div>',
        '<div class="panel-item"><strong>Keamanan API Key</strong><div class="history-meta">API key saat ini ' + (api.api_key ? 'tersedia dan bisa disalin atau diganti.' : 'belum tersedia.') + ' Jika Anda generate ulang, key lama akan dinonaktifkan.</div><div class="button-row" style="margin-top:12px;"><button class="btn btn-secondary" type="button" onclick="regenerateApiKey()">Generate Baru</button><button class="btn btn-danger" type="button" onclick="revokeApiKey()">Revoke</button></div></div>',
        '<div class="warning-note">Reset PIN saat ini masih dikelola admin. Jika Anda butuh bantuan keamanan akun, hubungi admin dan pastikan nomor WhatsApp Anda aktif.</div>'
      ].join('');
    }

    function renderTopupWidget() {
      const pending = getPendingTopups(currentTopups());
      const box = document.getElementById('topup-result');
      if (!box) return;
      if (!pending.length) {
        box.innerHTML = '<div class="empty-state">Belum ada deposit baru pada sesi ini.</div>';
        return;
      }
      const latest = pending[0];
      const latestStatus = normalizeTopupStatus(latest);
      const latestMethodName = latest.method_name || latest.payment_method_name || latest.method_code || '-';
      const qrisPreview = /qris/i.test(String(latestMethodName)) ? renderQrisBlock(latest.qr_string, latest.invoice) : '';
      box.innerHTML = '<div class="history-item">' +
        '<div class="history-head"><strong>Deposit Pending Terbaru</strong><span class="badge warn">' + escapeHtml(String(latestStatus || 'pending').toUpperCase()) + '</span></div>' +
        '<div class="history-meta">Invoice: ' + escapeHtml(latest.invoice || '-') + '</div>' +
        '<div class="history-meta">Metode: ' + escapeHtml(latestMethodName) + '</div>' +
        '<div class="history-meta">Total bayar: ' + escapeHtml(formatNumber(latest.total_amount || 0)) + '</div>' +
        '<div class="history-meta">Masa aktif pembayaran: ' + escapeHtml(latest.expired_at ? formatDateTime(latest.expired_at) : '-') + '</div>' +
        qrisPreview +
        '<div class="button-row"><button class="btn btn-secondary" type="button" onclick="checkTopup(\\'' + escapeHtml(latest.invoice || '') + '\\')">Cek Status</button></div>' +
      '</div>';
    }

    function renderAllViews() {
      renderSidebarProfile();
      renderHero();
      renderQuickActions();
      renderDashboardSummary();
      renderDepositView();
      renderApiKeyView();
      renderSecurityView();
      renderTopupWidget();
      updateViewHeading(activeMemberView);
      if (activeMemberView === 'dashboard') showInvalidPolicyNotice();
    }

    async function loadMethods() {
      const r = await fetch('/api/v3/member/deposit/methods');
      const j = await r.json();
      depositMethods = j.status && Array.isArray(j.data) ? j.data : [];
    }

    async function loadDashboard() {
      const r = await fetch('/api/v3/member/me');
      const j = await r.json();
      if (!j.status) {
        location.href = '/member/login';
        return;
      }
      dashboardData = j.data || {};
    }

    async function reloadDashboard(options) {
      const settings = options || {};
      try {
        await Promise.all([loadMethods(), loadDashboard()]);
        renderAllViews();
        if (!settings.silent) showMessage('Dashboard berhasil diperbarui.', true);
      } catch (error) {
        showMessage('Gagal memuat ulang dashboard. Coba lagi.', false);
      }
    }

    window.reloadDashboard = reloadDashboard;


    async function logoutMember() {
      await fetch('/api/v3/member/logout', { method: 'POST' });
      location.href = '/member/login';
    }

    window.logoutMember = logoutMember;

    async function copyApiKey() {
      const api = currentApiKey();
      if (!api.api_key) {
        showMessage('API key aktif belum tersedia.', false);
        return;
      }
      try {
        await navigator.clipboard.writeText(api.api_key);
        showMessage('API key berhasil disalin.', true);
      } catch (error) {
        showMessage('Gagal menyalin API key.', false);
      }
    }

    window.copyApiKey = copyApiKey;

    async function revokeApiKey() {
      const r = await fetch('/api/v3/member/apikey/revoke', { method: 'POST' });
      const j = await r.json();
      showMessage(j.message || 'Selesai', !!j.status);
      if (j.status) await reloadDashboard({ silent: true });
    }

    window.revokeApiKey = revokeApiKey;

    async function regenerateApiKey() {
      const r = await fetch('/api/v3/member/apikey/regenerate', { method: 'POST' });
      const j = await r.json();
      showMessage(j.message || 'Selesai', !!j.status);
      if (j.status) await reloadDashboard({ silent: true });
    }

    window.regenerateApiKey = regenerateApiKey;

    async function createTopup() {
      const button = document.getElementById('topup-submit');
      const amountEl = document.getElementById('topup-amount');
      const methodEl = document.getElementById('topup-method');
      const amount = amountEl ? amountEl.value : '';
      const method_code = methodEl ? methodEl.value : '';
      if (hasActivePendingTopup()) {
        showMessage('Masih ada topup pending. Selesaikan atau tunggu expired sebelum membuat topup baru.', false);
        return;
      }
      if (!amount || Number(amount) <= 0 || !method_code) {
        showMessage('Pilih metode pembayaran dan isi nominal topup yang valid.', false);
        return;
      }
      const original = button.textContent;
      button.disabled = true;
      button.textContent = 'Membuat deposit...';
      try {
        const r = await fetch('/api/v3/member/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: amount, method_code: method_code })
        });
        const j = await r.json();
        const box = document.getElementById('topup-result');
        if (!j.status) {
          if (box) {
            box.innerHTML = '<div class="history-item"><div class="history-head"><strong>Gagal membuat deposit</strong><span class="badge danger">Gagal</span></div><div class="history-meta">' + escapeHtml(j.message || 'Terjadi kesalahan') + '</div></div>';
          }
          showMessage(j.message || 'Gagal membuat deposit.', false);
          return;
        }
        const d = j.data || {};
        let details = '<div class="history-item"><div class="history-head"><strong>Deposit berhasil dibuat</strong><span class="badge success">Baru</span></div>' +
          '<div class="history-meta">Invoice: ' + escapeHtml(d.invoice || '-') + '</div>' +
          '<div class="history-meta">Metode: ' + escapeHtml(d.payment_method_name || d.method_name || d.payment_method || '-') + '</div>' +
          '<div class="history-meta">Total bayar: ' + escapeHtml(formatNumber(d.total_amount || 0)) + '</div>';
        if (d.expired_at) details += '<div class="history-meta">Masa aktif pembayaran: ' + escapeHtml(formatDateTime(d.expired_at)) + '</div>';
        if (d.va_number) details += '<div class="history-meta">Virtual Account: <span class="mono">' + escapeHtml(d.va_number) + '</span></div>';
        if (d.qr_string) details += renderQrisBlock(d.qr_string, d.invoice);
        if (d.bank_account) {
          details += '<div class="history-meta">' + escapeHtml(d.bank_account.bank_name || '-') + ' · ' + escapeHtml(d.bank_account.account_number || '-') + ' a/n ' + escapeHtml(d.bank_account.account_name || '-') + '</div>';
        }
        details += '<div class="button-row" style="margin-top:12px;"><button class="btn btn-secondary" type="button" onclick="checkTopup(\\'' + escapeHtml(d.invoice || '') + '\\')">Cek Status</button><button class="btn btn-soft" type="button" onclick="navigateMemberView(\\'deposit\\')">Lihat Riwayat</button></div></div>';
        if (box) box.innerHTML = details;
        showMessage('Deposit berhasil dibuat. Lanjutkan pembayaran sesuai instruksi.', true);
        await reloadDashboard({ silent: true });
      } finally {
        button.disabled = false;
        button.textContent = original;
      }
    }

    window.createTopup = createTopup;

    async function checkTopup(invoice) {
      if (!invoice) return;
      const r = await fetch('/api/v3/member/deposit/' + invoice + '/check', { method: 'POST' });
      const j = await r.json();
      showMessage(j.status ? 'Status topup diperbarui.' : (j.message || 'Gagal cek status'), !!j.status);
      await reloadDashboard({ silent: true });
    }

    window.checkTopup = checkTopup;

    window.addEventListener('resize', function() {
      if (window.innerWidth > 980) closeMemberSidebar();
    });

    reloadDashboard({ silent: true });
  `;
};
