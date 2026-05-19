const { renderMemberPage } = require('../render');
const cfg = require('../../lib/config');

function renderLoginPage() {
  const quota = Number((cfg.appConfig && cfg.appConfig.invalid_quota_24h) || 500);
  const percent = Number((cfg.appConfig && cfg.appConfig.invalid_penalty_percent) || 50);
  const inactivityDays = 28;
  return renderMemberPage('Login Member', `
    <style>
      .login-premium-wrap { position: relative; min-height: calc(100vh - 96px); overflow: hidden; border-radius: 24px; }
      .login-premium-bg {
        position: absolute; inset: 0; z-index: 0;
        background: linear-gradient(145deg, #c8e6ff 0%, #daeeff 26%, #ebf5ff 55%, #cfe6ff 100%);
      }
      .login-premium-bg::before, .login-premium-bg::after {
        content: ''; position: absolute; border-radius: 999px; filter: blur(82px); opacity: .55;
      }
      .login-premium-bg::before { width: 520px; height: 520px; top: -120px; left: -100px; background: radial-gradient(circle, #95c9f7 0%, transparent 72%); }
      .login-premium-bg::after { width: 460px; height: 460px; bottom: -120px; right: -90px; background: radial-gradient(circle, #a7d5ff 0%, transparent 72%); }
      .login-premium-grid {
        position: relative; z-index: 1; min-height: calc(100vh - 96px);
        display: grid; grid-template-columns: 1.05fr .95fr; gap: 22px; padding: clamp(18px, 3vw, 34px);
      }
      .login-premium-left {
        border-radius: 22px; padding: clamp(22px, 3vw, 36px);
        background: rgba(255, 255, 255, .42);
        border: 1px solid rgba(26, 111, 212, .15);
        backdrop-filter: blur(14px);
      }
      .login-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
      .login-brand__mark {
        width: 40px; height: 40px; border-radius: 10px; display: grid; place-items: center;
        background: linear-gradient(140deg, #2478d4, #0f56b3); color: #fff; font-weight: 800;
      }
      .login-brand__name { font-size: 1.08rem; font-weight: 800; color: #0d2952; letter-spacing: -.01em; }
      .login-brand__badge {
        margin-left: auto; padding: 4px 10px; border-radius: 999px;
        border: 1px solid rgba(26, 111, 212, .22); color: #2478d4;
        background: rgba(26, 111, 212, .1); font-size: .68rem; font-weight: 700;
      }
      .login-headline {
        margin: 0; line-height: 1.08; letter-spacing: -.02em;
        font-size: clamp(2.1rem, 4vw, 3.2rem); color: #0d2952;
      }
      .login-headline em { font-style: normal; color: #1a6fd4; }
      .login-sub { margin: 12px 0 0; max-width: 46ch; color: #365b8a; line-height: 1.65; }
      .login-feature-list { display: grid; gap: 10px; margin-top: 22px; }
      .login-feature {
        border-radius: 14px; border: 1px solid rgba(26,111,212,.16);
        background: rgba(255,255,255,.62); padding: 13px 14px;
      }
      .login-feature strong { display: block; color: #0d2952; margin-bottom: 4px; font-size: .93rem; }
      .login-feature span { color: #5a78a1; font-size: .84rem; line-height: 1.55; }

      .login-premium-right { display: grid; align-items: center; }
      .login-card {
        max-width: 440px; width: 100%; margin-left: auto;
        border-radius: 24px; padding: clamp(20px, 3vw, 30px);
        background: rgba(255,255,255,.84);
        border: 1px solid rgba(255,255,255,.96);
        box-shadow: 0 24px 64px rgba(14,66,160,.12), 0 4px 16px rgba(14,66,160,.08);
        backdrop-filter: blur(20px);
      }
      .login-card h2 { margin: 0 0 6px; color: #0d2952; font-size: 1.65rem; letter-spacing: -.02em; }
      .login-card p { margin: 0 0 16px; color: #5a78a1; }
      .login-policy {
        display: block !important; margin: 0 0 14px !important;
        background: #fff4ec !important; border: 1px solid #fdcba4 !important; color: #a06040 !important;
      }
      .login-policy strong { color: #c05c10; }
      .login-form .field label {
        display: block; font-size: .72rem; letter-spacing: .08em; text-transform: uppercase;
        color: #3a5a8c; margin-bottom: 7px; font-weight: 700;
      }
      .login-form .input {
        min-height: 50px; border-radius: 12px; border: 1.5px solid rgba(26,111,212,.18);
        background: rgba(255,255,255,.92);
      }
      .login-form .btn-primary {
        min-height: 52px;
        background: linear-gradient(135deg, #2478d4 0%, #4f9ef5 100%);
        border-color: #1a6fd4; box-shadow: 0 10px 28px rgba(26,111,212,.32);
      }
      .login-form .btn-primary:hover { box-shadow: 0 12px 34px rgba(26,111,212,.38); }
      .login-card .auth-footer { margin-top: 14px; }
      .login-card .badge { background: rgba(26,111,212,.08); border: 1px solid rgba(26,111,212,.18); color: #1a6fd4; }
      @media (max-width: 980px) {
        .login-premium-grid { grid-template-columns: 1fr; }
        .login-card { margin: 0 auto; }
      }
    </style>
    <div class="login-premium-wrap">
      <div class="login-premium-bg"></div>
      <div class="login-premium-grid">
        <aside class="login-premium-left">
          <div class="login-brand">
            <div class="login-brand__mark">M</div>
            <div class="login-brand__name">MemberPortal</div>
            <div class="login-brand__badge">Live</div>
          </div>
          <h1 class="login-headline">Masuk dengan <em>sederhana</em> dan tetap aman.</h1>
          <p class="login-sub">Gunakan nomor WhatsApp dan PIN 6 digit untuk masuk ke dashboard member. Sistem membatasi percobaan login agar akun tetap terlindungi.</p>
          <div class="login-feature-list">
            <div class="login-feature">
              <strong>Batas percobaan</strong>
              <span>Salah PIN 5 kali berturut-turut akan mengunci akun sementara.</span>
            </div>
            <div class="login-feature">
              <strong>Format login ringkas</strong>
              <span>Hanya perlu nomor WhatsApp dan PIN 6 digit untuk masuk.</span>
            </div>
            <div class="login-feature">
              <strong>Sesi langsung aktif</strong>
              <span>Setelah berhasil, sesi login langsung dipakai di browser ini.</span>
            </div>
          </div>
        </aside>
        <section class="login-premium-right">
          <div class="login-card">
            <h2>Login member</h2>
            <p>Masukkan data yang sama seperti saat registrasi.</p>
            <div class="notice login-policy">
              <strong style="display:block; margin-bottom:6px;">Kebijakan Hit Tidak Valid</strong>
              <div style="line-height:1.55;">
                Batas gagal validasi per API key adalah <strong>${quota.toLocaleString('id-ID')}</strong> hit per layanan dalam 24 jam.<br>
                Setelah melewati batas, tiap hit gagal berikutnya dikenakan biaya <strong>${percent}%</strong> dari harga layanan aktif.
              </div>
            </div>
            <div class="notice login-policy">
              <strong style="display:block; margin-bottom:6px;">Kebijakan Akun Tidak Aktif</strong>
              <div style="line-height:1.55;">
                Akun saldo/API key tanpa aktivitas selama <strong>${inactivityDays} hari</strong> akan dinonaktifkan otomatis oleh sistem. Gunakan API secara berkala agar akun tetap aktif.
              </div>
            </div>
            <div id="msg" class="notice"></div>
            <form id="login-form" class="auth-form login-form" novalidate>
              <div class="field">
                <label for="login-whatsapp">Nomor WhatsApp</label>
                <input id="login-whatsapp" class="input" name="whatsapp_number" placeholder="08xxxxxxxxxx" inputmode="tel" autocomplete="username" required>
              </div>
              <div class="field">
                <label for="login-pin">PIN 6 digit</label>
                <input id="login-pin" class="input" name="pin" type="password" placeholder="Masukkan PIN" maxlength="6" inputmode="numeric" autocomplete="current-password" pattern="[0-9]{6}" required>
              </div>
              <label style="display:flex; gap:10px; align-items:flex-start; color:#365b8a; font-size:.82rem; line-height:1.45; margin:4px 0 12px;">
                <input id="login-policy-ok" type="checkbox" required style="margin-top:3px;">
                <span>Saya sudah membaca kebijakan akun tidak aktif dan hit tidak valid.</span>
              </label>
              <button id="login-submit" class="btn btn-primary btn-block" type="submit">Login</button>
            </form>
            <div class="auth-footer">
              <p class="footer-hint" style="margin:0;">Belum punya akun? <a href="/member/register">Daftar sekarang</a></p>
              <span class="badge">Aman dan ringan</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  `, `
    const msg = document.getElementById('msg');
    const form = document.getElementById('login-form');
    const submit = document.getElementById('login-submit');
    const pinInput = document.getElementById('login-pin');
    const phoneInput = document.getElementById('login-whatsapp');
    const policyOk = document.getElementById('login-policy-ok');

    function setNotice(text, isSuccess) {
      msg.textContent = text;
      msg.className = 'notice ' + (isSuccess ? 'is-success' : 'is-error');
      msg.style.display = 'block';
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
      payload.whatsapp_number = String(payload.whatsapp_number || '').trim();
      payload.pin = String(payload.pin || '').trim();

      if (!payload.whatsapp_number || !/^\\d{6}$/.test(payload.pin) || !policyOk.checked) {
        setNotice('Masukkan nomor WhatsApp yang benar, PIN 6 digit, dan centang persetujuan kebijakan.', false);
        return;
      }

      submit.disabled = true;
      submit.textContent = 'Memeriksa...';
      try {
        const r = await fetch('/api/v3/member/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const j = await r.json();
        setNotice(j.message || (j.status ? 'Login berhasil.' : 'Login gagal.'), !!j.status);
        if (j.status) setTimeout(function() { location.href = '/member/dashboard'; }, 300);
      } catch (error) {
        setNotice('Tidak dapat menghubungi server. Coba beberapa saat lagi.', false);
      } finally {
        submit.disabled = false;
        submit.textContent = 'Login';
      }
    });
  `, { authChrome: true });
}

module.exports = { renderLoginPage };
