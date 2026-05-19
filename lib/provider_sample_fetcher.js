const fs = require('fs');
const cfg = require('./config');
const wa = require('./whatsapp');
const { buildMapperSource } = require('./response_mapper');
const SERVER5_EWALLET_CODES = new Set(['dana', 'gopay', 'ovo', 'shopeepay']);

function getBankMapping() {
  try {
    if (fs.existsSync('./bank_codes.json')) {
      const data = JSON.parse(fs.readFileSync('./bank_codes.json', 'utf8'));
      return data.daftar_bank ? data.daftar_bank : data;
    }
  } catch (err) { }
  return [];
}

function extractJson(text) {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(text.substring(start, end + 1));
    }
  } catch (err) { }
  return null;
}

function createTimeout(ms) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    clear() {
      clearTimeout(id);
    }
  };
}

function normalizeTo62(number) {
  const raw = String(number || '').replace(/[^0-9]/g, '');
  if (!raw) return '';
  if (raw.startsWith('62')) return raw;
  if (raw.startsWith('0')) return `62${raw.slice(1)}`;
  return `62${raw}`;
}

function normalizeTo08(number) {
  const raw = String(number || '').replace(/[^0-9]/g, '');
  if (!raw) return '';
  if (raw.startsWith('0')) return raw;
  if (raw.startsWith('62')) return `0${raw.slice(2)}`;
  return raw;
}

function resolveBankContext(codeInput) {
  const input = String(codeInput || '').trim().toLowerCase();
  const bankMapping = getBankMapping();
  for (const bank of bankMapping) {
    const c1 = (bank.kode_s1 || bank.code || '').toLowerCase();
    const c2 = (bank.kode_s2 || '').toLowerCase();
    if (c1 === input || c2 === input || (bank.codeid && String(bank.codeid) === input) || (bank.code && String(bank.code).toLowerCase() === input)) {
      return {
        input_code: input,
        kode_s1: bank.kode_s1 || bank.code || input,
        kode_s2: bank.kode_s2 || bank.kode_s1 || bank.code || input,
        kode_s4: bank.codeid ? String(bank.codeid).trim() : input,
        display_name: bank.nama_bank || bank.name || ''
      };
    }
  }
  return {
    input_code: input,
    kode_s1: input,
    kode_s2: input,
    kode_s4: input,
    display_name: ''
  };
}

function sanitizeName(type, rawName) {
  let value = String(rawName || '').trim();
  if (type === 'ewallet') {
    value = value.replace(/^(DANA\s+TOP\s+UP|TOP\s+UP\s+DANA|GOPAY\s+TOP\s+UP|DANA\/)\s*/i, '').trim();
  }
  return value;
}

async function fetchBankSample(providerCode, payload) {
  const request = {
    kode_input: String(payload.code || '').trim().toLowerCase(),
    nomor_tujuan: String(payload.account_number || '').replace(/[^0-9]/g, '')
  };
  if (!request.kode_input || !request.nomor_tujuan) {
    throw new Error('Kode bank dan nomor rekening wajib diisi.');
  }
  const bank = resolveBankContext(request.kode_input);
  const ms = Number(cfg.appConfig.timeout_ms) || 7000;
  let rawResponse = null;
  let accountName = '';

  if (providerCode === 'server1') {
    const timeout = createTimeout(ms);
    const form = new URLSearchParams();
    form.append('api_key', cfg.appConfig.api_key);
    form.append('bank_code', bank.kode_s1);
    form.append('account_number', request.nomor_tujuan);
    const response = await fetch(cfg.appConfig.bank_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      signal: timeout.signal
    });
    timeout.clear();
    rawResponse = await response.json();
    accountName = rawResponse && rawResponse.data && rawResponse.data.customer_name ? rawResponse.data.customer_name : '';
  } else if (providerCode === 'server2') {
    const timeout = createTimeout(ms);
    const url = `https://aasardconnect.biz.id/connection/bank/?norek=${encodeURIComponent(request.nomor_tujuan)}&kode=${encodeURIComponent(bank.kode_s2)}&key=${encodeURIComponent(cfg.appConfig.bank_server2_apikey)}`;
    const response = await fetch(url, { signal: timeout.signal });
    timeout.clear();
    rawResponse = extractJson(await response.text());
    accountName = rawResponse && (rawResponse.nickname || (rawResponse.data && rawResponse.data.username)) ? (rawResponse.nickname || rawResponse.data.username) : '';
  } else if (providerCode === 'server4') {
    const timeout = createTimeout(ms);
    const url = `https://api.cutiezy.id/api/check/bank?service=cek_bank&code=${encodeURIComponent(bank.kode_s4)}&user_id=${encodeURIComponent(request.nomor_tujuan)}&apikey=${encodeURIComponent(cfg.appConfig.bank_server4_apikey)}`;
    const response = await fetch(url, { signal: timeout.signal });
    timeout.clear();
    rawResponse = await response.json();
    accountName = rawResponse && rawResponse.data && rawResponse.data.accountname ? rawResponse.data.accountname : '';
  } else if (providerCode === 'server5') {
    const timeout = createTimeout(ms);
    const url = `${cfg.appConfig.server5_base_url}?bank=${encodeURIComponent(bank.kode_s4)}&accountNumber=${encodeURIComponent(request.nomor_tujuan)}`;
    const response = await fetch(url, { signal: timeout.signal });
    timeout.clear();
    rawResponse = await response.json();
    accountName = rawResponse && rawResponse.data && rawResponse.data.accountName ? rawResponse.data.accountName : '';
    if (rawResponse && rawResponse.data && rawResponse.data.bankName) {
      bank.display_name = rawResponse.data.bankName;
    }
  } else if (providerCode === 'server6') {
    if (!bank.kode_s4) {
      throw new Error('Server6 hanya mendukung codeid bank yang valid.');
    }
    const timeout = createTimeout(ms);
    const baseUrl = String(cfg.appConfig.bank_server6_base_url || '').replace(/\/+$/, '');
    const url = `${baseUrl}/?kode=${encodeURIComponent(bank.kode_s4)}&nomor=${encodeURIComponent(request.nomor_tujuan)}&api_key=${encodeURIComponent(cfg.appConfig.bank_server6_apikey || '')}`;
    const response = await fetch(url, { signal: timeout.signal });
    timeout.clear();
    rawResponse = await response.json();
    const statusCode = rawResponse && rawResponse.result ? String(rawResponse.result.status || '') : '';
    accountName = statusCode === '200' && rawResponse && rawResponse.nickname ? rawResponse.nickname : '';
  } else {
    throw new Error('Server bank tidak didukung.');
  }

  if (!accountName) {
    throw new Error('Contoh respon tidak menghasilkan nama akun.');
  }

  const derived = {
    data_utama: {
      bank_code: request.kode_input,
      bank_name: bank.display_name || '',
      account_number: request.nomor_tujuan,
      account_name: sanitizeName('bank', accountName)
    },
    nama_bank_tampil: bank.display_name || '',
    nama_akun_asli: accountName,
    nama_akun_bersih: sanitizeName('bank', accountName),
    kode_output: request.kode_input
  };

  return {
    request,
    rawResponse,
    sourceData: buildMapperSource('bank', providerCode, request, rawResponse, derived)
  };
}

async function fetchEwalletSample(providerCode, payload) {
  const request = {
    kode_input: String(payload.code || '').trim().toLowerCase(),
    nomor_tujuan: String(payload.account_number || '').replace(/[^0-9]/g, '')
  };
  if (!request.kode_input || !request.nomor_tujuan) {
    throw new Error('Kode e-wallet dan nomor tujuan wajib diisi.');
  }
  const ms = Number(cfg.appConfig.timeout_ms) || 7000;
  let rawResponse = null;
  let accountName = '';
  let displayName = request.kode_input.toUpperCase();
  let outputCode = request.kode_input;

  if (providerCode === 'server1') {
    const timeout = createTimeout(ms);
    const form = new URLSearchParams();
    form.append('api_key', cfg.appConfig.api_key);
    form.append('ewallet_code', request.kode_input);
    form.append('phone_number', request.nomor_tujuan);
    const response = await fetch(cfg.appConfig.ewallet_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      signal: timeout.signal
    });
    timeout.clear();
    rawResponse = await response.json();
    accountName = rawResponse && rawResponse.data && rawResponse.data.customer_name ? rawResponse.data.customer_name : '';
    outputCode = rawResponse && rawResponse.data && rawResponse.data.ewallet_code ? rawResponse.data.ewallet_code : request.kode_input;
  } else if (providerCode === 'server2') {
    const timeout = createTimeout(ms);
    const providerCodeValue = request.kode_input.replace('wallet_', '');
    const url = `https://aasardconnect.biz.id/connection/ewallet/?hp=${encodeURIComponent(request.nomor_tujuan)}&code=${encodeURIComponent(providerCodeValue)}&key=${encodeURIComponent(cfg.appConfig.bank_server2_apikey)}`;
    const response = await fetch(url, { signal: timeout.signal });
    timeout.clear();
    rawResponse = extractJson(await response.text());
    accountName = rawResponse && (rawResponse.nickname || (rawResponse.data && rawResponse.data.username)) ? (rawResponse.nickname || rawResponse.data.username) : '';
  } else if (providerCode === 'server3') {
    const timeout = createTimeout(ms);
    const providerCodeValue = request.kode_input.replace('wallet_', '');
    const url = `https://api.cutiezy.id/api/check/ewallet?service=${encodeURIComponent(providerCodeValue)}&user_id=${encodeURIComponent(request.nomor_tujuan)}&apikey=${encodeURIComponent(cfg.appConfig.ewallet_server3_apikey)}`;
    const response = await fetch(url, { signal: timeout.signal });
    timeout.clear();
    rawResponse = await response.json();
    accountName = rawResponse && rawResponse.data && rawResponse.data.nickname ? rawResponse.data.nickname : '';
    displayName = rawResponse && rawResponse.data && rawResponse.data.brand ? rawResponse.data.brand : displayName;
  } else if (providerCode === 'server5') {
    const providerCodeValue = request.kode_input.replace('wallet_', '');
    if (!SERVER5_EWALLET_CODES.has(providerCodeValue)) {
      throw new Error('Server5 hanya mendukung dana, gopay, ovo, dan shopeepay.');
    }
    const timeout = createTimeout(ms);
    const url = `${cfg.appConfig.server5_base_url}?bank=${encodeURIComponent(providerCodeValue)}&accountNumber=${encodeURIComponent(request.nomor_tujuan)}`;
    const response = await fetch(url, { signal: timeout.signal });
    timeout.clear();
    rawResponse = await response.json();
    accountName = rawResponse && rawResponse.data && rawResponse.data.accountName ? rawResponse.data.accountName : '';
    displayName = rawResponse && rawResponse.data && rawResponse.data.bankName ? rawResponse.data.bankName : displayName;
  } else {
    throw new Error('Server e-wallet tidak didukung.');
  }

  if (!accountName) throw new Error('Contoh respon tidak menghasilkan nama akun.');

  const derived = {
    data_utama: {
      ewallet_code: outputCode,
      ewallet_name: displayName,
      phone_number: request.nomor_tujuan,
      account_name: sanitizeName('ewallet', accountName)
    },
    nama_ewallet_tampil: displayName,
    nama_akun_asli: accountName,
    nama_akun_bersih: sanitizeName('ewallet', accountName),
    kode_output: outputCode
  };

  return {
    request,
    rawResponse,
    sourceData: buildMapperSource('ewallet', providerCode, request, rawResponse, derived)
  };
}

async function fetchNikSample(providerCode, payload) {
  if (providerCode !== 'server1') throw new Error('Server NIK tidak didukung.');
  const request = {
    nik: String(payload.nik || '').replace(/[^0-9]/g, '')
  };
  if (!request.nik || request.nik.length < 15) throw new Error('NIK wajib diisi dengan benar.');

  const timeout = createTimeout(Number(cfg.appConfig.timeout_ms) || 7000);
  const form = new URLSearchParams();
  form.append('api_key', cfg.appConfig.api_key);
  form.append('nik', request.nik);
  const response = await fetch(cfg.appConfig.nik_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
    signal: timeout.signal
  });
  timeout.clear();
  const rawResponse = await response.json();
  if (!rawResponse || !rawResponse.data || !rawResponse.data.name) {
    throw new Error('Contoh respon tidak menghasilkan data NIK.');
  }
  const derived = {
    data_utama: rawResponse.data
  };
  return {
    request,
    rawResponse,
    sourceData: buildMapperSource('nik', providerCode, request, rawResponse, derived)
  };
}

async function fetchWhatsappSample(providerCode, payload) {
  const request = {
    nomor: String(payload.number || payload.nomor || '').replace(/[^0-9]/g, '')
  };
  if (!request.nomor) throw new Error('Nomor WhatsApp wajib diisi.');
  const target62 = normalizeTo62(request.nomor);
  let rawResponse = null;
  let dataUtama = null;
  if (providerCode === 'internal') {
    throw new Error('WhatsApp internal (Baileys) sudah dihapus.');
  } else if (providerCode === 'server1') {
    const timeout = createTimeout(Number(cfg.appConfig.timeout_ms) || 7000);
    const form = new URLSearchParams();
    form.append('target', normalizeTo08(target62));
    form.append('countryCode', '62');
    const response = await fetch('https://api.fonnte.com/validate', {
      method: 'POST',
      headers: {
        Authorization: cfg.appConfig.fonnte_token,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form.toString(),
      signal: timeout.signal
    });
    timeout.clear();
    rawResponse = await response.json();
    if (!(rawResponse && rawResponse.status === true && rawResponse.data && rawResponse.data[0] && rawResponse.data[0].valid)) {
      throw new Error('Nomor tidak ditemukan pada server Fonnte.');
    }
    dataUtama = {
      pesan: 'Nomor terdaftar di WhatsApp.',
      phone_number: normalizeTo08(rawResponse.data[0].phone || target62),
      is_valid: true,
      is_whatsapp: true
    };
  } else if (providerCode === 'server2') {
    const timeout = createTimeout(Number(cfg.appConfig.timeout_ms) || 7000);
    const url = `https://api.pitucode.com/whatsapp-checker-stalker?apikey=${encodeURIComponent(cfg.appConfig.pitucode_apikey)}&number=${encodeURIComponent(target62)}`;
    const response = await fetch(url, { signal: timeout.signal });
    timeout.clear();
    rawResponse = await response.json();
    if (!(rawResponse && rawResponse.success === true)) {
      throw new Error('Nomor tidak ditemukan pada server Pitucode.');
    }
    dataUtama = {
      pesan: 'Nomor terdaftar di WhatsApp.',
      phone_number: normalizeTo08((rawResponse.result && rawResponse.result.number) ? rawResponse.result.number : target62),
      is_valid: true,
      is_whatsapp: true
    };
  } else {
    throw new Error('Server WhatsApp tidak didukung.');
  }
  return {
    request,
    rawResponse,
    sourceData: buildMapperSource('whatsapp', providerCode, request, rawResponse, { data_utama: dataUtama })
  };
}

async function fetchGamesSample(providerCode, payload) {
  if (providerCode !== 'server3') throw new Error('Server games tidak didukung.');
  const request = {
    game_service: String(payload.game_service || '').trim().toLowerCase(),
    game_user_id: String(payload.game_user_id || '').trim(),
    game_zone_id: String(payload.game_zone_id || '').trim()
  };
  if (!request.game_service || !request.game_user_id) {
    throw new Error('Game service dan user ID wajib diisi.');
  }
  const timeout = createTimeout(Number(cfg.appConfig.timeout_ms) || 8000);
  let url = `https://api.cutiezy.id/api/check/games?service=${encodeURIComponent(request.game_service)}&user_id=${encodeURIComponent(request.game_user_id)}&apikey=${encodeURIComponent(cfg.appConfig.ewallet_server3_apikey)}`;
  if (request.game_zone_id) {
    url += `&zone_id=${encodeURIComponent(request.game_zone_id)}`;
  }
  const response = await fetch(url, {
    headers: { 'X-API-Key': cfg.appConfig.ewallet_server3_apikey },
    signal: timeout.signal
  });
  timeout.clear();
  const rawResponse = await response.json();
  if (!(rawResponse && (rawResponse.ok === true || rawResponse.success === true) && rawResponse.data)) {
    throw new Error('Contoh respon games tidak menghasilkan data.');
  }
  return {
    request,
    rawResponse,
    sourceData: buildMapperSource('games', providerCode, request, rawResponse, { data_utama: rawResponse.data })
  };
}

async function fetchProviderSample(serviceType, providerCode, payload) {
  if (serviceType === 'bank') return fetchBankSample(providerCode, payload);
  if (serviceType === 'ewallet') return fetchEwalletSample(providerCode, payload);
  if (serviceType === 'nik') return fetchNikSample(providerCode, payload);
  if (serviceType === 'whatsapp') return fetchWhatsappSample(providerCode, payload);
  if (serviceType === 'games') return fetchGamesSample(providerCode, payload);
  throw new Error('Layanan tidak didukung.');
}

module.exports = {
  fetchProviderSample
};
