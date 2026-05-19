#!/usr/bin/env node
'use strict';

/**
 * Tester E-Wallet Server 7 (KlikMBC style) - Interactive Version
 *
 * Usage (CLI arguments):
 * node test-ewallet-server7.js --number 0813956187001 --code dana
 *
 * Usage (Interactive Manual Input):
 * node test-ewallet-server7.js
 * * * Optional:
 * --timeout 7000
 * --debug
 */

const readline = require('readline');
const fs = require('fs');

const DEFAULT_TIMEOUT_MS = 7000;
const SUPPORTED_CODES = new Set(['dana', 'gopay', 'linkaja', 'ovo', 'shopeepay']);
const MERCHANT_MAP = {
  dana: 'DANA',
  gopay: 'GOPAY',
  linkaja: 'LINKAJA',
  ovo: 'OVO',
  shopeepay: 'SHOPEEPAY'
};

// Fungsi untuk membaca input dari terminal
function promptInput(questionText) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(questionText, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      out[key] = true;
      continue;
    }
    out[key] = next;
    i += 1;
  }
  return out;
}

function printHelp() {
  console.log([
    'E-Wallet Server7 Tester',
    '',
    'Required (bisa diisi via prompt jika tidak disertakan):',
    '  --number    Nomor tujuan ewallet (contoh: 0813956187001)',
    '  --code      dana|gopay|linkaja|ovo|shopeepay',
    '',
    'Optional:',
    `  --timeout   Default: ${DEFAULT_TIMEOUT_MS} (ms)`,
    '  --debug     Tampilkan cuplikan HTML response',
    '',
    'Example:',
    '  node test-ewallet-server7.js --number 0813956187001 --code dana'
  ].join('\n'));
}

function normalizeCode(input) {
  return String(input || '').toLowerCase().replace(/^wallet_/, '').trim();
}

function extractRecipientName(html) {
  const match = String(html || '').match(
    /<span class="label-text-grayscale">Nama Penerima<\/span>[\s\S]*?<b>(.*?)<\/b>/i
  );
  return match && match[1] ? String(match[1]).trim().split('/')[0].trim() : '';
}

async function main() {
  const args = parseArgs(process.argv);
  
  if (args.help || args.h || args['?']) {
    printHelp();
    process.exit(0);
  }

  // Ambil argumen CLI (jika ada)
  let number = String(args.number || '').trim();
  let rawCode = String(args.code || '').trim();

  // Prompt secara manual jika argumen tidak ditemukan
  if (!number) {
    number = await promptInput('Masukkan Nomor Tujuan (contoh: 0813956187001): ');
    number = number.trim();
  }
  
  if (!rawCode) {
    rawCode = await promptInput(`Masukkan Kode E-Wallet (${Array.from(SUPPORTED_CODES).join('|')}): `);
    rawCode = rawCode.trim();
  }
  
  // Baca file data.json untuk Endpoint dan Cookie
  let serverList = [];
  try {
    const rawData = fs.readFileSync('data.json', 'utf-8');
    // Coba parsing sebagai array JSON, jika gagal anggap sebagai teks biasa yang dipisahkan enter
    try {
      let parsed = JSON.parse(rawData);
      if (Array.isArray(parsed)) serverList = parsed;
      else serverList = rawData.split('\n');
    } catch (e) {
      serverList = rawData.split('\n');
    }
  } catch (err) {
    console.error('\nError: Gagal membaca file data.json. Pastikan file tersedia di folder yang sama.');
    process.exit(1);
  }

  const validServers = serverList
    .map(s => String(s).trim())
    .filter(s => s.includes('|'));

  if (validServers.length === 0) {
    console.error('\nError: Tidak ada data valid di data.json dengan format URLENDPOINT|SESSION');
    process.exit(1);
  }

  console.log('\nDaftar Endpoint dari data.json:');
  console.log('[0] Cek Semua Server');
  validServers.forEach((server, index) => {
    const [ep] = server.split('|');
    console.log(`[${index + 1}] ${ep.trim()}`);
  });

  let selectedIndex = -1;
  let checkAll = false;
  
  while (!checkAll && (selectedIndex < 0 || selectedIndex >= validServers.length)) {
    const choice = await promptInput(`Pilih nomor endpoint (0-${validServers.length}): `);
    const parsedChoice = parseInt(choice, 10);
    
    if (!isNaN(parsedChoice) && parsedChoice >= 0 && parsedChoice <= validServers.length) {
      if (parsedChoice === 0) {
        checkAll = true;
      } else {
        selectedIndex = parsedChoice - 1;
      }
    } else {
      console.log("Pilihan tidak valid. Silakan masukkan nomor yang benar.");
    }
  }

  const code = normalizeCode(rawCode);
  const timeoutMs = Math.max(1000, parseInt(args.timeout, 10) || DEFAULT_TIMEOUT_MS);
  const debug = !!args.debug;

  if (!number || !code) {
    console.error('\nError: Nomor dan Kode E-Wallet tidak boleh kosong.');
    process.exit(1);
  }

  if (!SUPPORTED_CODES.has(code)) {
    console.error(`Error: code "${code}" tidak didukung. Gunakan: ${Array.from(SUPPORTED_CODES).join(', ')}`);
    process.exit(1);
  }

  const merchant = MERCHANT_MAP[code];
  const bodyData = new URLSearchParams({
    merchant,
    nomorpelanggan: number,
    nominal: '10.000'
  });

  // Tentukan server mana saja yang akan dicek
  const serversToProcess = checkAll ? validServers : [validServers[selectedIndex]];
  let anySuccess = false;

  for (let i = 0; i < serversToProcess.length; i++) {
    const [selectedEndpoint, selectedCookie] = serversToProcess[i].split('|');
    const endpoint = selectedEndpoint.trim();
    const cookie = selectedCookie.trim();

    if (checkAll) {
      console.log(`\n--- [Server ${i + 1}/${serversToProcess.length}] ${endpoint} ---`);
    } else {
      console.log('\n-----------------------------------');
      console.log(`Endpoint: ${endpoint}`);
      console.log(`Menjalankan request...`);
      console.log('-----------------------------------\n');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const startedAt = Date.now();

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0',
          'Cookie': cookie
        },
        body: bodyData.toString(),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const html = await resp.text();
      const name = extractRecipientName(html);
      const elapsed = Date.now() - startedAt;
      const isOk = !!(resp.ok && name);

      if (isOk) anySuccess = true;

      if (debug) {
        const debugResult = {
          ok: isOk,
          http_status: resp.status,
          endpoint,
          code,
          merchant,
          number,
          recipient_name: name || null,
          latency_ms: elapsed,
          html_snippet: String(html || '').slice(0, 1200)
        };
        console.log('--- DEBUG INFO ---');
        console.log(JSON.stringify(debugResult, null, 2));
        console.log('------------------\n');
      }

      // Format output rapi: number|recipient_name|latency_ms|ok
      console.log(`${number}|${name || ''}|${elapsed}|${isOk}`);
      
    } catch (err) {
      clearTimeout(timeoutId);
      const isTimeout = err && (err.name === 'AbortError' || /timeout|aborted/i.test(String(err.message || '')));
      
      if (debug) {
        console.error('--- DEBUG ERROR ---');
        console.error(JSON.stringify({
          ok: false,
          error: isTimeout ? 'timeout' : 'request_error',
          message: err && err.message ? err.message : 'Unknown error',
          endpoint,
          code,
          number
        }, null, 2));
        console.error('-------------------\n');
      }

      // Format output rapi untuk error: recipient_name dikosongkan, latency 0, ok false
      console.log(`${number}||0|false`);
    }
  }

  // Jika ada setidaknya 1 yang sukses, exit dengan status 0
  process.exit(anySuccess ? 0 : 2);
}

main();