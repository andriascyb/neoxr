const express = require('express');
const cfg = require('../lib/config');
const { fetchProviderSample } = require('../lib/provider_sample_fetcher');
const {
  RESPONSE_MAPPER_CATALOG,
  getCatalogEntry,
  saveSampleSnapshot,
  saveDraftMapping,
  publishDraftMapping,
  resetDraftToBaseline,
  rollbackToVersion,
  listMappingVersions,
  getAdminMappingPayload,
  previewDraftMapping
} = require('../lib/response_mapper');

const router = express.Router();

function clearCheckerCaches() {
  try {
    const checker = require('./api_checker');
    if (checker.cache && typeof checker.cache.flushAll === 'function') checker.cache.flushAll();
    if (checker.mappingCache && typeof checker.mappingCache.flushAll === 'function') checker.mappingCache.flushAll();
  } catch (err) { }
}

function ensureAdmin(req, res) {
  if (req.query.key !== cfg.ADMIN_KEY) {
    res.status(401).json({ status: false, error: 'Unauthorized' });
    return false;
  }
  return true;
}

router.get('/catalog', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  res.json({ status: true, data: RESPONSE_MAPPER_CATALOG });
});

router.get('/', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const serviceType = String(req.query.service_type || '').trim();
    const providerCode = String(req.query.provider_code || '').trim();
    if (!getCatalogEntry(serviceType, providerCode)) {
      return res.status(400).json({ status: false, message: 'Layanan atau server tidak valid.' });
    }
    const payload = await getAdminMappingPayload(serviceType, providerCode);
    const versions = await listMappingVersions(serviceType, providerCode);
    res.json({ status: true, data: { ...payload, versions } });
  } catch (err) {
    res.status(400).json({ status: false, message: err.message });
  }
});

router.post('/sample', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const serviceType = String(req.body.service_type || '').trim();
    const providerCode = String(req.body.provider_code || '').trim();
    if (!getCatalogEntry(serviceType, providerCode)) {
      return res.status(400).json({ status: false, message: 'Layanan atau server tidak valid.' });
    }
    const sample = await fetchProviderSample(serviceType, providerCode, req.body || {});
    await saveSampleSnapshot(serviceType, providerCode, sample.request, sample.sourceData, sample.rawResponse);
    const payload = await getAdminMappingPayload(serviceType, providerCode);
    const versions = await listMappingVersions(serviceType, providerCode);
    const preview = previewDraftMapping(payload.draft_mapping, payload.sample_source, serviceType, providerCode);
    res.json({
      status: true,
      message: 'Contoh respon berhasil diambil.',
      data: { ...payload, versions, preview }
    });
  } catch (err) {
    res.status(400).json({ status: false, message: err.message });
  }
});

router.post('/preview', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const serviceType = String(req.body.service_type || '').trim();
    const providerCode = String(req.body.provider_code || '').trim();
    const payload = await getAdminMappingPayload(serviceType, providerCode);
    if (!payload.sample_source) {
      return res.status(400).json({ status: false, message: 'Silakan ambil contoh respon terlebih dahulu.' });
    }
    const mapping = req.body.mapping_json || payload.draft_mapping;
    const preview = previewDraftMapping(mapping, payload.sample_source, serviceType, providerCode);
    res.json({ status: true, data: preview });
  } catch (err) {
    res.status(400).json({ status: false, message: err.message });
  }
});

router.post('/draft', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const serviceType = String(req.body.service_type || '').trim();
    const providerCode = String(req.body.provider_code || '').trim();
    await saveDraftMapping(serviceType, providerCode, req.body.mapping_json || {});
    const payload = await getAdminMappingPayload(serviceType, providerCode);
    const versions = await listMappingVersions(serviceType, providerCode);
    const preview = payload.sample_source ? previewDraftMapping(payload.draft_mapping, payload.sample_source, serviceType, providerCode) : null;
    res.json({ status: true, message: 'Draf mapping berhasil disimpan.', data: { ...payload, versions, preview } });
  } catch (err) {
    res.status(400).json({ status: false, message: err.message });
  }
});

router.post('/publish', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const serviceType = String(req.body.service_type || '').trim();
    const providerCode = String(req.body.provider_code || '').trim();
    await publishDraftMapping(serviceType, providerCode);
    clearCheckerCaches();
    const payload = await getAdminMappingPayload(serviceType, providerCode);
    const versions = await listMappingVersions(serviceType, providerCode);
    const preview = payload.sample_source ? previewDraftMapping(payload.active_mapping, payload.sample_source, serviceType, providerCode) : null;
    res.json({ status: true, message: 'Mapping aktif berhasil diperbarui.', data: { ...payload, versions, preview } });
  } catch (err) {
    res.status(400).json({ status: false, message: err.message });
  }
});

router.post('/reset', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const serviceType = String(req.body.service_type || '').trim();
    const providerCode = String(req.body.provider_code || '').trim();
    await resetDraftToBaseline(serviceType, providerCode);
    const payload = await getAdminMappingPayload(serviceType, providerCode);
    const versions = await listMappingVersions(serviceType, providerCode);
    const preview = payload.sample_source ? previewDraftMapping(payload.draft_mapping, payload.sample_source, serviceType, providerCode) : null;
    res.json({ status: true, message: 'Draf berhasil dikembalikan ke pengaturan awal.', data: { ...payload, versions, preview } });
  } catch (err) {
    res.status(400).json({ status: false, message: err.message });
  }
});

router.post('/rollback', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const serviceType = String(req.body.service_type || '').trim();
    const providerCode = String(req.body.provider_code || '').trim();
    const versionId = Number(req.body.version_id || 0);
    if (!versionId) {
      return res.status(400).json({ status: false, message: 'Versi rollback wajib dipilih.' });
    }
    await rollbackToVersion(serviceType, providerCode, versionId);
    clearCheckerCaches();
    const payload = await getAdminMappingPayload(serviceType, providerCode);
    const versions = await listMappingVersions(serviceType, providerCode);
    const preview = payload.sample_source ? previewDraftMapping(payload.active_mapping, payload.sample_source, serviceType, providerCode) : null;
    res.json({ status: true, message: 'Mapping berhasil dikembalikan ke versi sebelumnya.', data: { ...payload, versions, preview } });
  } catch (err) {
    res.status(400).json({ status: false, message: err.message });
  }
});

module.exports = router;
