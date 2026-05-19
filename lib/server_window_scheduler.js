const fs = require('fs');
const cfg = require('./config');

let timer = null;
let lastMode = '';
let inFlight = false;

function getWibHHmm() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  }).formatToParts(now);
  const hh = Number(parts.find((p) => p.type === 'hour')?.value || '0');
  const mm = Number(parts.find((p) => p.type === 'minute')?.value || '0');
  return (hh * 60) + mm;
}

function isOffWindowWib(minutes) {
  const start = (23 * 60) + 25; // 23:25
  const end = (1 * 60) + 0;     // 01:00
  return minutes >= start || minutes <= end;
}

async function persistIfChanged(nextS3, nextS7) {
  const changed = (cfg.appConfig.bank_server3_status !== nextS3) || (cfg.appConfig.ewallet_server7_status !== nextS7);
  if (!changed) return false;
  cfg.appConfig.bank_server3_status = nextS3;
  cfg.appConfig.ewallet_server7_status = nextS7;
  fs.writeFileSync(cfg.CONFIG_FILE_PATH, JSON.stringify(cfg.appConfig, null, 2));
  await cfg.syncSettingsToDB();
  return true;
}

async function tick() {
  if (inFlight) return;
  inFlight = true;
  try {
    const s3Enabled = String(cfg.appConfig.bank_server3_auto_window_enabled || 'on') === 'on';
    const s7Enabled = String(cfg.appConfig.ewallet_server7_auto_window_enabled || 'on') === 'on';
    if (!s3Enabled && !s7Enabled) {
      lastMode = 'disabled';
      return;
    }
    const minutes = getWibHHmm();
    const offMode = isOffWindowWib(minutes);
    const mode = offMode ? 'off-window' : 'on-window';
    if (mode === lastMode) return;

    const nextS3 = s3Enabled ? (offMode ? 'off' : 'on') : cfg.appConfig.bank_server3_status;
    const nextS7 = s7Enabled ? (offMode ? 'off' : 'on') : cfg.appConfig.ewallet_server7_status;
    await persistIfChanged(nextS3, nextS7);
    lastMode = mode;
  } catch (err) {
    console.error('[WINDOW-SCHEDULER] tick error:', err.message);
  } finally {
    inFlight = false;
  }
}

function initServerWindowScheduler() {
  if (timer) clearInterval(timer);
  timer = setInterval(() => { tick(); }, 30 * 1000);
  if (typeof timer.unref === 'function') timer.unref();
  tick();
}

module.exports = { initServerWindowScheduler };

