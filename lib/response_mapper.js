const NodeCache = require('node-cache');
const cfg = require('./config');

const mapperCache = new NodeCache({ stdTTL: 300 });

const RESPONSE_MAPPER_CATALOG = [
  { service_type: 'bank', provider_code: 'server1', service_label: 'Bank', provider_label: 'Server 1 (Utama)' },
  { service_type: 'bank', provider_code: 'server2', service_label: 'Bank', provider_label: 'Server 2 (AasardConnect)' },
  { service_type: 'bank', provider_code: 'server3', service_label: 'Bank', provider_label: 'Server 3 (RrtravelNbx)' },
  { service_type: 'bank', provider_code: 'server4', service_label: 'Bank', provider_label: 'Server 4 (Cutiezy)' },
  { service_type: 'bank', provider_code: 'server5', service_label: 'Bank', provider_label: 'Server 5 (Custom HTTP)' },
  { service_type: 'bank', provider_code: 'server6', service_label: 'Bank', provider_label: 'Server 6 (Laburagame)' },
  { service_type: 'bank', provider_code: 'server7', service_label: 'Bank', provider_label: 'Server 7 (Rikipilkonokos)' },
  { service_type: 'ewallet', provider_code: 'server1', service_label: 'E-Wallet', provider_label: 'Server 1 (Utama)' },
  { service_type: 'ewallet', provider_code: 'server2', service_label: 'E-Wallet', provider_label: 'Server 2 (AasardConnect)' },
  { service_type: 'ewallet', provider_code: 'server3', service_label: 'E-Wallet', provider_label: 'Server 3 (Cutiezy)' },
  { service_type: 'ewallet', provider_code: 'server5', service_label: 'E-Wallet', provider_label: 'Server 4 (Custom HTTP)' },
  { service_type: 'ewallet', provider_code: 'server6', service_label: 'E-Wallet', provider_label: 'Server 5 (Laburagame)' },
  { service_type: 'nik', provider_code: 'server1', service_label: 'NIK', provider_label: 'Server 1 (Utama)' },
  { service_type: 'whatsapp', provider_code: 'server1', service_label: 'WhatsApp', provider_label: 'Server 1 (Fonnte)' },
  { service_type: 'whatsapp', provider_code: 'server2', service_label: 'WhatsApp', provider_label: 'Server 2 (Pitucode)' },
  { service_type: 'games', provider_code: 'server3', service_label: 'Games', provider_label: 'Server 1 (Cutiezy)' }
];

function getCatalogEntry(serviceType, providerCode) {
  return RESPONSE_MAPPER_CATALOG.find((item) => item.service_type === serviceType && item.provider_code === providerCode) || null;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value === undefined ? null : value));
}

function getDefaultMapping(serviceType, providerCode) {
  const entry = getCatalogEntry(serviceType, providerCode);
  const mappingName = entry ? `${entry.service_label} - ${entry.provider_label}` : `${serviceType} - ${providerCode}`;
  const base = {
    versi: 1,
    nama_mapping: mappingName,
    field_output: []
  };

  if (serviceType === 'bank') {
    base.field_output = [
      { id: 'bank_code', jenis: 'field', label: 'Kode Bank', kunci_output: 'bank_code', sumber_data: 'permintaan.kode_input', tampilkan: true, formatter: 'string', fallback: '' },
      { id: 'bank_name', jenis: 'field', label: 'Nama Bank', kunci_output: 'bank_name', sumber_data: 'turunan.nama_bank_tampil', tampilkan: true, formatter: 'string', fallback: '' },
      { id: 'account_number', jenis: 'field', label: 'Nomor Rekening', kunci_output: 'account_number', sumber_data: 'permintaan.nomor_tujuan', tampilkan: true, formatter: 'string', fallback: '' },
      { id: 'account_name', jenis: 'field', label: 'Nama Pemilik', kunci_output: 'account_name', sumber_data: 'turunan.nama_akun_bersih', tampilkan: true, formatter: 'string', fallback: '' }
    ];
    return base;
  }

  if (serviceType === 'ewallet') {
    base.field_output = [
      { id: 'ewallet_code', jenis: 'field', label: 'Kode E-Wallet', kunci_output: 'ewallet_code', sumber_data: 'turunan.kode_output', tampilkan: true, formatter: 'string', fallback: '' },
      { id: 'ewallet_name', jenis: 'field', label: 'Nama E-Wallet', kunci_output: 'ewallet_name', sumber_data: 'turunan.nama_ewallet_tampil', tampilkan: true, formatter: 'string', fallback: '' },
      { id: 'phone_number', jenis: 'field', label: 'Nomor Tujuan', kunci_output: 'phone_number', sumber_data: 'permintaan.nomor_tujuan', tampilkan: true, formatter: 'string', fallback: '' },
      { id: 'account_name', jenis: 'field', label: 'Nama Pemilik', kunci_output: 'account_name', sumber_data: 'turunan.nama_akun_bersih', tampilkan: true, formatter: 'string', fallback: '' }
    ];
    return base;
  }

  if (serviceType === 'nik') {
    base.field_output = [
      { id: 'nik_merge', jenis: 'merge_object', label: 'Gabungkan Data Utama', kunci_output: '', sumber_data: 'turunan.data_utama', tampilkan: true, formatter: 'none', fallback: '' }
    ];
    return base;
  }

  if (serviceType === 'whatsapp') {
    base.field_output = [
      { id: 'wa_merge', jenis: 'merge_object', label: 'Gabungkan Data Utama', kunci_output: '', sumber_data: 'turunan.data_utama', tampilkan: true, formatter: 'none', fallback: '' }
    ];
    return base;
  }

  if (serviceType === 'games') {
    base.field_output = [
      { id: 'games_merge', jenis: 'merge_object', label: 'Gabungkan Data Utama', kunci_output: '', sumber_data: 'turunan.data_utama', tampilkan: true, formatter: 'none', fallback: '' }
    ];
    return base;
  }

  return base;
}

function getValueByPath(source, path) {
  if (!path) return undefined;
  const parts = String(path).split('.').filter(Boolean);
  let current = source;
  for (const rawPart of parts) {
    if (current === undefined || current === null) return undefined;
    const part = /^\d+$/.test(rawPart) ? Number(rawPart) : rawPart;
    current = current[part];
  }
  return current;
}

function applyFormatter(value, formatter) {
  if (value === undefined || value === null) return value;
  const format = String(formatter || 'string');
  if (format === 'none') return value;
  if (format === 'string') return String(value);
  if (format === 'number') return Number(value);
  if (format === 'trim') return String(value).trim();
  if (format === 'uppercase') return String(value).toUpperCase();
  if (format === 'lowercase') return String(value).toLowerCase();
  if (format === 'boolean') return !!value;
  if (format === 'mask_phone') {
    const text = String(value);
    if (text.length <= 4) return text;
    return `${text.slice(0, 4)}${'*'.repeat(Math.max(0, text.length - 6))}${text.slice(-2)}`;
  }
  if (format === 'mask_account') {
    const text = String(value);
    if (text.length <= 4) return text;
    return `${text.slice(0, 2)}${'*'.repeat(Math.max(0, text.length - 4))}${text.slice(-2)}`;
  }
  return value;
}

function normalizeFieldItem(item, index) {
  const jenis = item && item.jenis === 'merge_object' ? 'merge_object' : 'field';
  return {
    id: String((item && item.id) || `item_${index + 1}`),
    jenis,
    label: String((item && item.label) || `Field ${index + 1}`),
    kunci_output: jenis === 'merge_object' ? '' : String((item && item.kunci_output) || ''),
    sumber_data: String((item && item.sumber_data) || ''),
    tampilkan: item && item.tampilkan === false ? false : true,
    formatter: String((item && item.formatter) || (jenis === 'merge_object' ? 'none' : 'string')),
    fallback: item && item.fallback !== undefined && item.fallback !== null ? item.fallback : '',
    nilai_tetap: item && item.nilai_tetap !== undefined ? item.nilai_tetap : null,
    gunakan_nilai_tetap: item && item.gunakan_nilai_tetap === true
  };
}

function normalizeMappingInput(mappingInput, serviceType, providerCode) {
  const fallback = getDefaultMapping(serviceType, providerCode);
  const mapping = mappingInput && typeof mappingInput === 'object' ? mappingInput : fallback;
  const fieldOutput = Array.isArray(mapping.field_output) ? mapping.field_output : fallback.field_output;
  return {
    versi: Number(mapping.versi || 1),
    nama_mapping: String(mapping.nama_mapping || fallback.nama_mapping),
    field_output: fieldOutput.map(normalizeFieldItem)
  };
}

function validateMappingInput(mappingInput, sampleSource, serviceType, providerCode) {
  const mapping = normalizeMappingInput(mappingInput, serviceType, providerCode);
  const seenKeys = new Set();
  const errors = [];

  mapping.field_output.forEach((item, index) => {
    if (!item.sumber_data && !item.gunakan_nilai_tetap) {
      errors.push(`Baris ${index + 1}: sumber data wajib diisi.`);
    }
    if (item.jenis === 'field') {
      if (!item.kunci_output) {
        errors.push(`Baris ${index + 1}: kunci output wajib diisi.`);
      } else if (seenKeys.has(item.kunci_output)) {
        errors.push(`Baris ${index + 1}: kunci output "${item.kunci_output}" duplikat.`);
      } else {
        seenKeys.add(item.kunci_output);
      }
    }
    if (!['field', 'merge_object'].includes(item.jenis)) {
      errors.push(`Baris ${index + 1}: jenis mapping tidak valid.`);
    }
    if (!['none', 'string', 'number', 'trim', 'uppercase', 'lowercase', 'boolean', 'mask_phone', 'mask_account'].includes(item.formatter)) {
      errors.push(`Baris ${index + 1}: formatter "${item.formatter}" tidak didukung.`);
    }
    if (sampleSource && item.sumber_data && !item.gunakan_nilai_tetap) {
      const testValue = getValueByPath(sampleSource, item.sumber_data);
      if (testValue === undefined) {
        errors.push(`Baris ${index + 1}: path "${item.sumber_data}" tidak ditemukan pada contoh respon.`);
      }
      if (item.jenis === 'merge_object' && testValue !== undefined && (typeof testValue !== 'object' || Array.isArray(testValue) || testValue === null)) {
        errors.push(`Baris ${index + 1}: path "${item.sumber_data}" harus berupa objek untuk jenis gabungkan objek.`);
      }
    }
  });

  return { valid: errors.length === 0, errors, mapping };
}

function renderMappedData(sourceData, mappingInput) {
  const mapping = normalizeMappingInput(mappingInput);
  const output = {};

  mapping.field_output.forEach((item) => {
    if (!item.tampilkan) return;
    let value = item.gunakan_nilai_tetap ? item.nilai_tetap : getValueByPath(sourceData, item.sumber_data);
    if ((value === undefined || value === null || value === '') && item.fallback !== '') {
      value = item.fallback;
    }
    value = applyFormatter(value, item.formatter);
    if (item.jenis === 'merge_object') {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(output, cloneJson(value));
      }
      return;
    }
    output[item.kunci_output] = value;
  });

  return output;
}

function buildMapperSource(serviceType, providerCode, requestPayload, rawResponse, derivedData) {
  return {
    metadata: {
      layanan: serviceType,
      server: providerCode
    },
    permintaan: cloneJson(requestPayload || {}),
    respon_server: cloneJson(rawResponse || {}),
    turunan: cloneJson(derivedData || {})
  };
}

function getCacheKey(serviceType, providerCode) {
  return `${serviceType}::${providerCode}`;
}

async function ensureMappingRecord(serviceType, providerCode) {
  const entry = getCatalogEntry(serviceType, providerCode);
  if (!entry) throw new Error('Layanan atau server tidak didukung.');

  const [rows] = await cfg.dbPool.query(
    'SELECT * FROM response_mappings WHERE service_type = ? AND provider_code = ? LIMIT 1',
    [serviceType, providerCode]
  );
  if (rows && rows[0]) return rows[0];

  const defaultMapping = getDefaultMapping(serviceType, providerCode);
  const baselineJson = JSON.stringify(defaultMapping);
  const [result] = await cfg.dbPool.query(
    `INSERT INTO response_mappings
    (service_type, provider_code, mapping_name, baseline_mapping_json, draft_mapping_json, active_mapping_json, sample_request_json, sample_source_json, sample_response_json)
    VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL)`,
    [serviceType, providerCode, defaultMapping.nama_mapping, baselineJson, baselineJson, baselineJson]
  );
  const [createdRows] = await cfg.dbPool.query('SELECT * FROM response_mappings WHERE id = ? LIMIT 1', [result.insertId]);
  return createdRows[0];
}

async function getMappingRecord(serviceType, providerCode) {
  return ensureMappingRecord(serviceType, providerCode);
}

async function saveSampleSnapshot(serviceType, providerCode, sampleRequest, sampleSource, sampleResponse) {
  const record = await ensureMappingRecord(serviceType, providerCode);
  await cfg.dbPool.query(
    `UPDATE response_mappings
     SET sample_request_json = ?, sample_source_json = ?, sample_response_json = ?, updated_at = NOW()
     WHERE id = ?`,
    [JSON.stringify(sampleRequest || null), JSON.stringify(sampleSource || null), JSON.stringify(sampleResponse || null), record.id]
  );
  return getMappingRecord(serviceType, providerCode);
}

async function saveDraftMapping(serviceType, providerCode, mappingInput) {
  const record = await ensureMappingRecord(serviceType, providerCode);
  const sampleSource = record.sample_source_json ? JSON.parse(record.sample_source_json) : null;
  const validation = validateMappingInput(mappingInput, sampleSource, serviceType, providerCode);
  if (!validation.valid) {
    throw new Error(validation.errors.join(' '));
  }
  await cfg.dbPool.query(
    'UPDATE response_mappings SET draft_mapping_json = ?, updated_at = NOW() WHERE id = ?',
    [JSON.stringify(validation.mapping), record.id]
  );
  return getMappingRecord(serviceType, providerCode);
}

async function publishDraftMapping(serviceType, providerCode) {
  const record = await ensureMappingRecord(serviceType, providerCode);
  const draft = record.draft_mapping_json ? JSON.parse(record.draft_mapping_json) : getDefaultMapping(serviceType, providerCode);
  const sampleSource = record.sample_source_json ? JSON.parse(record.sample_source_json) : null;
  const validation = validateMappingInput(draft, sampleSource, serviceType, providerCode);
  if (!validation.valid) throw new Error(validation.errors.join(' '));

  const [versionRows] = await cfg.dbPool.query(
    'SELECT COALESCE(MAX(version_no), 0) AS max_version FROM response_mapping_versions WHERE mapping_id = ?',
    [record.id]
  );
  const versionNo = Number((versionRows[0] && versionRows[0].max_version) || 0) + 1;

  await cfg.dbPool.query(
    'INSERT INTO response_mapping_versions (mapping_id, version_no, version_label, mapping_json) VALUES (?, ?, ?, ?)',
    [record.id, versionNo, `Versi ${versionNo}`, JSON.stringify(validation.mapping)]
  );
  await cfg.dbPool.query(
    'UPDATE response_mappings SET active_mapping_json = ?, draft_mapping_json = ?, updated_at = NOW() WHERE id = ?',
    [JSON.stringify(validation.mapping), JSON.stringify(validation.mapping), record.id]
  );
  flushResponseMapperCache(serviceType, providerCode);
  return getMappingRecord(serviceType, providerCode);
}

async function resetDraftToBaseline(serviceType, providerCode) {
  const record = await ensureMappingRecord(serviceType, providerCode);
  await cfg.dbPool.query(
    'UPDATE response_mappings SET draft_mapping_json = baseline_mapping_json, updated_at = NOW() WHERE id = ?',
    [record.id]
  );
  return getMappingRecord(serviceType, providerCode);
}

async function rollbackToVersion(serviceType, providerCode, versionId) {
  const record = await ensureMappingRecord(serviceType, providerCode);
  const [rows] = await cfg.dbPool.query(
    'SELECT * FROM response_mapping_versions WHERE id = ? AND mapping_id = ? LIMIT 1',
    [versionId, record.id]
  );
  if (!rows || !rows[0]) throw new Error('Versi mapping tidak ditemukan.');
  await cfg.dbPool.query(
    'UPDATE response_mappings SET draft_mapping_json = ?, active_mapping_json = ?, updated_at = NOW() WHERE id = ?',
    [rows[0].mapping_json, rows[0].mapping_json, record.id]
  );
  flushResponseMapperCache(serviceType, providerCode);
  return getMappingRecord(serviceType, providerCode);
}

async function listMappingVersions(serviceType, providerCode) {
  const record = await ensureMappingRecord(serviceType, providerCode);
  const [rows] = await cfg.dbPool.query(
    'SELECT id, version_no, version_label, created_at FROM response_mapping_versions WHERE mapping_id = ? ORDER BY version_no DESC LIMIT 20',
    [record.id]
  );
  return rows || [];
}

function parseMappingJson(jsonValue, fallbackValue) {
  try {
    return jsonValue ? JSON.parse(jsonValue) : fallbackValue;
  } catch (err) {
    return fallbackValue;
  }
}

async function getAdminMappingPayload(serviceType, providerCode) {
  const record = await ensureMappingRecord(serviceType, providerCode);
  return {
    id: record.id,
    service_type: record.service_type,
    provider_code: record.provider_code,
    mapping_name: record.mapping_name,
    baseline_mapping: parseMappingJson(record.baseline_mapping_json, getDefaultMapping(serviceType, providerCode)),
    draft_mapping: parseMappingJson(record.draft_mapping_json, getDefaultMapping(serviceType, providerCode)),
    active_mapping: parseMappingJson(record.active_mapping_json, getDefaultMapping(serviceType, providerCode)),
    sample_request: parseMappingJson(record.sample_request_json, null),
    sample_source: parseMappingJson(record.sample_source_json, null),
    sample_response: parseMappingJson(record.sample_response_json, null),
    updated_at: record.updated_at
  };
}

async function getActiveMapping(serviceType, providerCode) {
  const cacheKey = getCacheKey(serviceType, providerCode);
  const cached = mapperCache.get(cacheKey);
  if (cached) return cached;
  const record = await ensureMappingRecord(serviceType, providerCode);
  const mapping = parseMappingJson(record.active_mapping_json, getDefaultMapping(serviceType, providerCode));
  mapperCache.set(cacheKey, mapping);
  return mapping;
}

function flushResponseMapperCache(serviceType, providerCode) {
  if (serviceType && providerCode) {
    mapperCache.del(getCacheKey(serviceType, providerCode));
    return;
  }
  mapperCache.flushAll();
}

async function mapResponseData(serviceType, providerCode, sourceData, fallbackData) {
  try {
    const mapping = await getActiveMapping(serviceType, providerCode);
    const rendered = renderMappedData(sourceData, mapping);
    if (!rendered || (typeof rendered === 'object' && !Array.isArray(rendered) && Object.keys(rendered).length === 0)) {
      return fallbackData;
    }
    return rendered;
  } catch (err) {
    return fallbackData;
  }
}

function previewDraftMapping(mappingInput, sourceData, serviceType, providerCode) {
  const validation = validateMappingInput(mappingInput, sourceData || null, serviceType, providerCode);
  if (!validation.valid) {
    throw new Error(validation.errors.join(' '));
  }
  return renderMappedData(sourceData || {}, validation.mapping);
}

module.exports = {
  RESPONSE_MAPPER_CATALOG,
  getCatalogEntry,
  getDefaultMapping,
  getValueByPath,
  applyFormatter,
  normalizeMappingInput,
  validateMappingInput,
  renderMappedData,
  buildMapperSource,
  ensureMappingRecord,
  getMappingRecord,
  saveSampleSnapshot,
  saveDraftMapping,
  publishDraftMapping,
  resetDraftToBaseline,
  rollbackToVersion,
  listMappingVersions,
  getAdminMappingPayload,
  getActiveMapping,
  flushResponseMapperCache,
  mapResponseData,
  previewDraftMapping
};
