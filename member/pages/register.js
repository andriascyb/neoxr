const { renderMemberPage } = require('../render');
const cfg = require('../../lib/config');

function renderRegisterPage() {
  const quota = Number((cfg.appConfig && cfg.appConfig.invalid_quota_24h) || 500);
  const percent = Number((cfg.appConfig && cfg.appConfig.invalid_penalty_percent) || 50);
  const inactivityDays = 28;
  return renderMemberPage('Register Member', `
    <style>
      .register-premium-wrap { position: relative; min-height: calc(100vh - 96px); overflow: hidden; border-radius: 24px; }
      .register-premium-bg {
        position: absolute; inset: 0; z-index: 0;
        background: linear-gradient(145deg, #c8e6ff 0%, #daeeff 26%, #ebf5ff 55%, #cfe6ff 100%);
      }
      .register-premium-bg::before, .register-premium-bg::after {
        content: ''; position: absolute; border-radius: 999px; filter: blur(82px); opacity: .55;
      }
      .register-premium-bg::before { width: 520px; height: 520px; top: -120px; left: -100px; background: radial-gradient(circle, #95c9f7 0%, transparent 72%); }
      .register-premium-bg::after { width: 460px; height: 460px; bottom: -120px; right: -90px; background: radial-gradient(circle, #a7d5ff 0%, transparent 72%); }
      .register-premium-grid {
        position: relative; z-index: 1; min-height: calc(100vh - 96px);
        display: grid; grid-template-columns: 1.05fr .95fr; gap: 22px; padding: clamp(18px, 3vw, 34px);
      }
      .register-premium-left {
        border-radius: 22px; padding: clamp(22px, 3vw, 36px);
        background: rgba(255, 255, 255, .42);
        border: 1px solid rgba(26, 111, 212, .15);
        backdrop-filter: blur(14px);
      }
      .register-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
      .register-brand__mark { width: 40px; height: 40px; border-radius: 10px; display: grid; place-items: center; background: linear-gradient(140deg, #2478d4, #0f56b3); color: #fff; font-weight: 800; }
      .register-brand__name { font-size: 1.08rem; font-weight: 800; color: #0d2952; letter-spacing: -.01em; }
      .register-brand__badge { margin-left: auto; padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(26, 111, 212, .22); color: #2478d4; background: rgba(26, 111, 212, .1); font-size: .68rem; font-weight: 700; }
      .register-headline { margin: 0; line-height: 1.08; letter-spacing: -.02em; font-size: clamp(2.1rem, 4vw, 3.2rem); color: #0d2952; }
      .register-headline em { font-style: normal; color: #1a6fd4; }
      .register-sub { margin: 12px 0 0; max-width: 46ch; color: #365b8a; line-height: 1.65; }
      .register-feature-list { display: grid; gap: 10px; margin-top: 22px; }
      .register-feature { border-radius: 14px; border: 1px solid rgba(26,111,212,.16); background: rgba(255,255,255,.62); padding: 13px 14px; }
      .register-feature strong { display: block; color: #0d2952; margin-bottom: 4px; font-size: .93rem; }
      .register-feature span { color: #5a78a1; font-size: .84rem; line-height: 1.55; }
      .register-premium-right { display: grid; align-items: center; }
      .register-card {
        max-width: 440px; width: 100%; margin-left: auto;
        border-radius: 24px; padding: clamp(20px, 3vw, 30px);
        background: rgba(255,255,255,.84);
        border: 1px solid rgba(255,255,255,.96);
        box-shadow: 0 24px 64px rgba(14,66,160,.12), 0 4px 16px rgba(14,66,160,.08);
        backdrop-filter: blur(20px);
      }
      .register-card h2 { margin: 0 0 6px; color: #0d2952; font-size: 1.65rem; letter-spacing: -.02em; }
      .register-card p { margin: 0 0 16px; color: #5a78a1; }
      .register-policy {
        display: block !important; margin: 0 0 14px !important;
        background: #fff4ec !important; border: 1px solid #fdcba4 !important; color: #a06040 !important;
      }
      .register-policy strong { color: #c05c10; }
      .register-form .field label {
        display: block; font-size: .72rem; letter-spacing: .08em; text-transform: uppercase;
        color: #3a5a8c; margin-bottom: 7px; font-weight: 700;
      }
      .register-form .input { min-height: 50px; border-radius: 12px; border: 1.5px solid rgba(26,111,212,.18); background: rgba(255,255,255,.92); }
      .register-form .btn-primary { min-height: 52px; background: linear-gradient(135deg, #2478d4 0%, #4f9ef5 100%); border-color: #1a6fd4; box-shadow: 0 10px 28px rgba(26,111,212,.32); }
      .register-form .btn-primary:hover { box-shadow: 0 12px 34px rgba(26,111,212,.38); }
      .register-card .auth-footer { margin-top: 14px; }
      .register-card .badge { background: rgba(26,111,212,.08); border: 1px solid rgba(26,111,212,.18); color: #1a6fd4; }
      .otp-premium-box {
        display: none; margin-bottom: 14px; border-radius: 16px;
        border: 1px solid rgba(32, 95, 186, .24);
        background: linear-gradient(160deg, rgba(244, 250, 255, .98) 0%, rgba(233, 244, 255, .96) 100%);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.95), 0 12px 32px rgba(20,86,176,.12);
        padding: 14px 14px 12px;
      }
      .otp-premium-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
      .otp-premium-head strong { color: #12396f; font-size: .98rem; }
      .otp-premium-badge {
        font-size: .7rem; font-weight: 700; color: #1f66c7; border: 1px solid rgba(31,102,199,.28);
        background: rgba(31,102,199,.1); padding: 3px 8px; border-radius: 999px;
      }
      .otp-premium-meta { color: #2e5486; font-size: .86rem; line-height: 1.55; margin-bottom: 10px; }
      .otp-premium-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
      .otp-kv { border: 1px solid rgba(26,111,212,.18); background: rgba(255,255,255,.88); border-radius: 12px; padding: 9px 10px; }
      .otp-kv .k { display:block; color:#4f6d98; font-size:.67rem; letter-spacing:.08em; text-transform:uppercase; margin-bottom:4px; font-weight:700; }
      .otp-kv .v { display:block; color:#12396f; font-weight:800; font-size:1rem; word-break:break-all; }
      .otp-code-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
      .otp-code-chip {
        min-height: 42px; display:flex; align-items:center; justify-content:center;
        padding: 0 14px; border-radius: 12px; border: 1px dashed rgba(26,111,212,.35);
        background: rgba(255,255,255,.9); color:#114184; letter-spacing:.18em; font-size:1.1rem; font-weight:900;
      }
      .otp-code-row .btn { min-height: 42px; }
      .otp-btn-copy {
        background: linear-gradient(135deg, #1a6fd4 0%, #4f9ef5 100%); border: 1px solid #1a6fd4;
        color: #fff; font-weight: 700;
      }
      .otp-btn-copy:hover { color: #fff; filter: brightness(1.02); }
      .otp-btn-check {
        border: 1px solid rgba(26,111,212,.34); color: #1a63c2; background: rgba(255,255,255,.94); font-weight: 700;
      }
      .otp-btn-check:hover { color: #124f9f; background: #eef6ff; }
      .otp-check-note {
        margin-top: 8px; color: #3b5d8e; font-size: .78rem;
      }
      .otp-premium-hint {
        margin-top: 10px; color: #184780; background: rgba(255,255,255,.72);
        border: 1px solid rgba(26,111,212,.15); border-radius: 10px; padding: 8px 10px; font-size: .82rem;
      }
      @media (max-width: 560px) { .otp-premium-grid { grid-template-columns: 1fr; } }
      @media (max-width: 980px) { .register-premium-grid { grid-template-columns: 1fr; } .register-card { margin: 0 auto; } }
    </style>
    <div class="register-premium-wrap">
      <div class="register-premium-bg"></div>
      <div class="register-premium-grid">
        <aside class="register-premium-left">
          <div class="register-brand">
            <div class="register-brand__mark">M</div>
            <div class="register-brand__name">MemberPortal</div>
            <div class="register-brand__badge">Live</div>
          </div>
          <h1 class="register-headline">Daftar lebih cepat, <em>langsung siap</em> dipakai.</h1>
          <p class="register-sub">Buat akun dengan nama, nomor WhatsApp, dan PIN 6 digit. Setelah berhasil, sistem langsung menyiapkan bonus saldo dan API key utama Anda.</p>
          <div class="register-feature-list">
            <div class="register-feature"><strong>Bonus awal</strong><span>Langsung menjadi balance API setelah registrasi sukses.</span></div>
            <div class="register-feature"><strong>API key otomatis</strong><span>Satu API key aktif langsung siap dipakai dari dashboard member.</span></div>
            <div class="register-feature"><strong>Mode saldo only</strong><span>Seluruh penggunaan layanan diproses dari saldo akun Anda.</span></div>
          </div>
        </aside>
        <section class="register-premium-right">
          <div class="register-card">
            <h2>Buat akun baru</h2>
            <p>Isi data dengan benar. Nomor WhatsApp akan menjadi identitas login utama.</p>
            <div class="notice register-policy">
              <strong style="display:block; margin-bottom:6px;">Kebijakan Hit Tidak Valid</strong>
              <div style="line-height:1.55;">
                Batas gagal validasi per API key adalah <strong>${quota.toLocaleString('id-ID')}</strong> hit per layanan dalam 24 jam.<br>
                Setelah melewati batas, tiap hit gagal berikutnya dikenakan biaya <strong>${percent}%</strong> dari harga layanan aktif.
              </div>
            </div>
            <div class="notice register-policy">
              <strong style="display:block; margin-bottom:6px;">Kebijakan Akun Tidak Aktif</strong>
              <div style="line-height:1.55;">
                Akun saldo/API key tanpa aktivitas selama <strong>${inactivityDays} hari</strong> akan dinonaktifkan otomatis oleh sistem. Gunakan API secara berkala agar akun tetap aktif.
              </div>
            </div>
            <div id="register-closed-box" class="notice is-error" style="display:none;"></div>
            <div id="msg" class="notice"></div>
            <div id="otp-inbound-box" class="otp-premium-box">
              <div class="otp-premium-head">
                <strong>Verifikasi OTP via WhatsApp</strong>
                <span class="otp-premium-badge">OTP Active</span>
              </div>
              <div id="otp-inbound-text" class="otp-premium-meta">Setelah submit, sistem menampilkan OTP untuk Anda kirim ke nomor admin.</div>
              <div class="otp-premium-grid">
                <div class="otp-kv">
                  <span class="k">Nomor Admin Tujuan</span>
                  <span id="otp-admin-number" class="v">-</span>
                </div>
                <div class="otp-kv">
                  <span class="k">Masa Berlaku</span>
                  <span id="otp-expiry-min" class="v">-</span>
                </div>
              </div>
                <div class="otp-kv" style="margin-bottom:10px;">
                <span class="k">Kode OTP (kirim manual)</span>
                <div class="otp-code-row">
                  <span id="otp-code-value" class="otp-code-chip">------</span>
                  <button id="otp-copy-code" type="button" class="btn btn-sm otp-btn-copy">Salin OTP</button>
                </div>
              </div>
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <a id="otp-wa-link" href="#" target="_blank" rel="noopener" class="btn btn-primary btn-sm" style="display:none; text-decoration:none;">Buka WA & Kirim OTP</a>
                <button id="otp-refresh-status" type="button" class="btn btn-sm otp-btn-check">Cek Status OTP Masuk</button>
              </div>
              <div id="otp-check-note" class="otp-check-note">Status belum dicek.</div>
              <div class="otp-premium-hint">Kirim <strong>hanya angka OTP</strong> (contoh: <code>123456</code>) tanpa huruf, simbol, atau tambahan teks.</div>
            </div>
            <form id="register-form" class="auth-form register-form" novalidate>
              <div class="field">
                <label for="register-name">Nama lengkap</label>
                <input id="register-name" class="input" name="name" placeholder="Contoh: Budi Santoso" autocomplete="name" required>
              </div>
              <div class="field">
                <label for="register-whatsapp">Nomor WhatsApp</label>
                <input id="register-whatsapp" class="input" name="whatsapp_number" placeholder="08xxxxxxxxxx" inputmode="tel" autocomplete="tel" required>
                <small>Gunakan nomor aktif agar mudah dikenali saat dibantu admin.</small>
              </div>
              <div class="field">
                <label for="register-pin">PIN 6 digit</label>
                <input id="register-pin" class="input" name="pin" type="password" placeholder="6 digit angka" maxlength="6" inputmode="numeric" autocomplete="new-password" pattern="[0-9]{6}" required>
                <small>PIN hanya angka dan tepat 6 digit.</small>
              </div>
              <label style="display:flex; gap:10px; align-items:flex-start; color:#365b8a; font-size:.82rem; line-height:1.45; margin:4px 0 12px;">
                <input id="register-policy-ok" type="checkbox" required style="margin-top:3px;">
                <span>Saya sudah membaca kebijakan akun tidak aktif dan hit tidak valid.</span>
              </label>
              <button id="register-submit" class="btn btn-primary btn-block" type="submit">Daftar Sekarang</button>
            </form>
            <div class="auth-footer">
              <p class="footer-hint" style="margin:0;">Sudah punya akun? <a href="/member/login">Masuk di sini</a></p>
              <span class="badge">Registrasi cepat</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  `, `
    const msg = document.getElementById('msg');
    const form = document.getElementById('register-form');
    const submit = document.getElementById('register-submit');
    const closedBox = document.getElementById('register-closed-box');
    const pinInput = document.getElementById('register-pin');
    const phoneInput = document.getElementById('register-whatsapp');
    const policyOk = document.getElementById('register-policy-ok');
    const otpBox = document.getElementById('otp-inbound-box');
    const otpText = document.getElementById('otp-inbound-text');
    const otpWaLink = document.getElementById('otp-wa-link');
    const otpRefresh = document.getElementById('otp-refresh-status');
    const otpAdminNumber = document.getElementById('otp-admin-number');
    const otpExpiryMin = document.getElementById('otp-expiry-min');
    const otpCodeValue = document.getElementById('otp-code-value');
    const otpCopyCode = document.getElementById('otp-copy-code');
    const otpCheckNote = document.getElementById('otp-check-note');
    var otpDraftId = 0;
    var otpStatusToken = '';
    var otpPollTimer = null;

    function setNotice(text, isSuccess) {
      msg.textContent = text;
      msg.className = 'notice ' + (isSuccess ? 'is-success' : 'is-error');
      msg.style.display = 'block';
    }

    function stopOtpPolling() {
      if (otpPollTimer) {
        clearInterval(otpPollTimer);
        otpPollTimer = null;
      }
    }

    function setOtpCheckNote(text) {
      if (!otpCheckNote) return;
      otpCheckNote.textContent = text;
    }

    async function pollOtpStatus(manual) {
      if (!otpDraftId || !otpStatusToken) return;
      try {
        if (manual) setOtpCheckNote('Memeriksa status OTP...');
        const r = await fetch(
          '/api/v3/member/register/otp-status?draft_id=' + encodeURIComponent(String(otpDraftId)) +
          '&token=' + encodeURIComponent(String(otpStatusToken))
        );
        const j = await r.json();
        if (!j || !j.status || !j.data) return;
        const st = String(j.data.status || '').toLowerCase();
        if (st === 'verified') {
          stopOtpPolling();
          setOtpCheckNote('OTP sudah diverifikasi.');
          setNotice('OTP terverifikasi. Akun sudah aktif, mengarahkan ke halaman login...', true);
          setTimeout(function(){ location.href = '/member/login'; }, 800);
          return;
        }
        if (st === 'failed' || st === 'expired' || st === 'cancelled') {
          stopOtpPolling();
          setOtpCheckNote('Sesi OTP berakhir: ' + st + '.');
          setNotice('Sesi OTP berakhir (' + st + '). Silakan daftar ulang.', false);
          if (form) form.style.display = '';
          if (otpBox) otpBox.style.display = 'none';
          return;
        }
        setOtpCheckNote('Menunggu OTP masuk dari user. Cek otomatis aktif.');
      } catch (e) {
        setOtpCheckNote('Gagal cek status OTP. Coba lagi sebentar.');
      }
    }

    function startOtpFlow(data) {
      otpDraftId = Number(data && data.draft_id || 0);
      otpStatusToken = String(data && data.otp_status_token || '');
      if (!otpDraftId) {
        setNotice('Draft OTP tidak valid. Silakan ulangi registrasi.', false);
        return;
      }
      if (!otpStatusToken) {
        setNotice('Token OTP tidak valid. Silakan ulangi registrasi.', false);
        return;
      }
      if (form) form.style.display = 'none';
      if (otpBox) otpBox.style.display = 'block';
      const adminNumber = data && data.admin_target_number ? String(data.admin_target_number) : '-';
      const expMin = Number(data && data.otp_expires_minutes || 5);
      const otpCode = String((data && data.otp_code) || '').replace(/\\D/g, '').slice(0, 8);
      if (otpAdminNumber) otpAdminNumber.textContent = adminNumber || '-';
      if (otpExpiryMin) otpExpiryMin.textContent = String(expMin) + ' menit';
      if (otpCodeValue) otpCodeValue.textContent = otpCode || '------';
      if (otpCopyCode) otpCopyCode.disabled = !otpCode;
      if (otpRefresh) otpRefresh.disabled = false;
      setOtpCheckNote('Belum ada OTP masuk. Sistem cek otomatis setiap 3 detik.');
      if (otpText) {
        otpText.innerHTML = 'Kirim kode OTP di bawah ini ke nomor admin. Sistem akan memeriksa pesan masuk otomatis setiap beberapa detik.';
      }
      if (otpWaLink) {
        if (data && data.send_wa_link) {
          otpWaLink.href = String(data.send_wa_link);
          otpWaLink.style.display = '';
        } else {
          otpWaLink.style.display = 'none';
        }
      }
      stopOtpPolling();
      pollOtpStatus();
      otpPollTimer = setInterval(pollOtpStatus, 3000);
    }

    if (otpRefresh) {
      otpRefresh.addEventListener('click', function() { pollOtpStatus(true); });
    }
    if (otpCopyCode) {
      otpCopyCode.addEventListener('click', async function() {
        const code = String((otpCodeValue && otpCodeValue.textContent) || '').replace(/\\D/g, '');
        if (!code) return;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(code);
            setNotice('OTP tersalin. Kirim angka OTP saja ke nomor admin.', true);
            return;
          }
        } catch (e) {}
        const ta = document.createElement('textarea');
        ta.value = code;
        ta.setAttribute('readonly', 'readonly');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
        setNotice('OTP tersalin. Kirim angka OTP saja ke nomor admin.', true);
      });
    }

    function formatCountdown(totalSec) {
      var sec = Math.max(0, parseInt(totalSec || 0, 10));
      var h = Math.floor(sec / 3600);
      var m = Math.floor((sec % 3600) / 60);
      var s = sec % 60;
      return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    async function syncRegisterStatus() {
      try {
        const r = await fetch('/api/v3/member/register-status');
        const j = await r.json();
        const data = (j && j.data) || {};
        const isClosed = !!data.closed;
        if (!isClosed) {
          if (closedBox) closedBox.style.display = 'none';
          if (form) form.style.display = '';
          if (submit) submit.disabled = false;
          return;
        }
        if (form) form.style.display = 'none';
        if (submit) submit.disabled = true;
        if (closedBox) {
          const countdown = data.seconds_left > 0 ? ('Buka kembali dalam ' + formatCountdown(data.seconds_left) + '.') : 'Belum ada jadwal buka kembali.';
          closedBox.innerHTML = '<strong>Pendaftaran sementara ditutup.</strong><br>' + countdown;
          closedBox.style.display = 'block';
        }
      } catch (e) {}
    }

    pinInput.addEventListener('input', function() {
      pinInput.value = pinInput.value.replace(/\\D/g, '').slice(0, 6);
    });

    phoneInput.addEventListener('input', function() {
      phoneInput.value = phoneInput.value.replace(/[^0-9+]/g, '');
    });

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      msg.style.display = 'none';
      msg.className = 'notice';
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.name = String(payload.name || '').trim();
      payload.whatsapp_number = String(payload.whatsapp_number || '').trim();
      payload.pin = String(payload.pin || '').trim();

      if (!payload.name || !payload.whatsapp_number || !/^\\d{6}$/.test(payload.pin) || !policyOk.checked) {
        setNotice('Pastikan nama terisi, nomor WhatsApp valid, PIN tepat 6 digit, dan persetujuan kebijakan dicentang.', false);
        return;
      }

      submit.disabled = true;
      submit.textContent = 'Memproses...';
      try {
        const r = await fetch('/api/v3/member/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const j = await r.json();
        var noticeText = j.message || (j.status ? 'Registrasi berhasil.' : 'Registrasi gagal.');
        if (!j.status && j.detail) {
          noticeText += ' Akun terdeteksi: ' + String(j.detail);
        }
        setNotice(noticeText, !!j.status);
        if (j.status && j.data && j.data.otp_required) {
          startOtpFlow(j.data);
        } else if (j.status) {
          setTimeout(function() { location.href = '/member/dashboard'; }, 600);
        }
      } catch (error) {
        setNotice('Tidak dapat menghubungi server. Coba beberapa saat lagi.', false);
      } finally {
        submit.disabled = false;
        submit.textContent = 'Daftar Sekarang';
      }
    });

    syncRegisterStatus();
    setInterval(syncRegisterStatus, 1000);
  `, { authChrome: true });
}

module.exports = { renderRegisterPage };
