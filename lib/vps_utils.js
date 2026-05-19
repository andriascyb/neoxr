const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function execCmd(command, timeoutMs) {
  return new Promise((resolve, reject) => {
    exec(command, { timeout: timeoutMs || 1500, windowsHide: true, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(String(stdout || stderr || ''));
    });
  });
}

function getDiskInfo() {
  try {
    if (typeof fs.statfsSync !== 'function') return null;
    const p = process.platform === 'win32' ? process.cwd().split(path.sep)[0] + path.sep : '/';
    const s = fs.statfsSync(p);
    const total = Number(s.blocks) * Number(s.bsize);
    const free = Number(s.bfree) * Number(s.bsize);
    const used = Math.max(0, total - free);
    const usage = total > 0 ? (used / total) * 100 : 0;
    return { path: p, total_bytes: total, used_bytes: used, free_bytes: free, usage_percent: Number(usage.toFixed(2)) };
  } catch (e) { return null; }
}

let netPrev = null;
function getNetworkInfo() {
  try {
    if (process.platform !== 'linux') return null;
    const p = '/proc/net/dev';
    if (!fs.existsSync(p)) return null;
    const lines = fs.readFileSync(p, 'utf8').split('\n').slice(2).filter(Boolean);
    let rx = 0; let tx = 0;
    lines.forEach(line => {
      const parts = line.replace(/:/g, ' ').trim().split(/\s+/);
      if (parts.length < 10) return;
      const iface = parts[0];
      if (iface === 'lo') return;
      rx += parseInt(parts[1] || '0', 10);
      tx += parseInt(parts[9] || '0', 10);
    });
    const now = Date.now();
    let rxPerSec = null; let txPerSec = null;
    if (netPrev && netPrev.ts && now > netPrev.ts) {
      const dt = (now - netPrev.ts) / 1000;
      if (dt > 0) {
        rxPerSec = (rx - netPrev.rx) / dt;
        txPerSec = (tx - netPrev.tx) / dt;
      }
    }
    netPrev = { ts: now, rx, tx };
    return { total_rx_bytes: rx, total_tx_bytes: tx, rx_per_sec: rxPerSec !== null ? Math.max(0, rxPerSec) : null, tx_per_sec: txPerSec !== null ? Math.max(0, txPerSec) : null };
  } catch (e) { return null; }
}

async function getTopProcesses() {
  const now = Date.now();
  if (topProcCache.data && (now - topProcCache.ts) < TOP_PROC_TTL_MS) {
    return topProcCache.data;
  }
  if (topProcInFlight) {
    try { return await topProcInFlight; } catch (e) { return topProcCache.data || []; }
  }

  topProcInFlight = (async () => {
    try {
      let result = [];
      if (process.platform === 'win32') {
        const cmd = 'powershell -NoProfile -Command "Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 Id,ProcessName,CPU,WS | ConvertTo-Json -Compress"';
        const out = await execCmd(cmd, 2000);
        const parsed = JSON.parse(out.trim());
        const arr = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
        result = arr.map(p => ({ pid: p.Id, cpu: p.CPU, mem_bytes: p.WS, name: p.ProcessName }));
      } else {
        const out = await execCmd('ps -eo pid,pcpu,pmem,comm --sort=-pcpu | head -n 6', 1500);
        const lines = out.split('\n').map(l => l.trim()).filter(Boolean);
        result = lines.slice(1).map(l => {
          const parts = l.split(/\s+/);
          return { pid: parseInt(parts[0] || '0', 10), cpu: parseFloat(parts[1] || '0'), mem_percent: parseFloat(parts[2] || '0'), name: parts.slice(3).join(' ') };
        }).filter(p => p.pid);
      }
      topProcCache = { ts: Date.now(), data: result };
      return result;
    } catch (e) {
      return topProcCache.data || [];
    } finally {
      topProcInFlight = null;
    }
  })();

  return await topProcInFlight;
}

const TOP_PROC_TTL_MS = 15000;
let topProcCache = { ts: 0, data: [] };
let topProcInFlight = null;

module.exports = {
  getDiskInfo,
  getNetworkInfo,
  getTopProcesses
};
