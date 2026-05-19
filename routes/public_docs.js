const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const cfg = require('../lib/config');
const { getPublicDocs } = require('../public');
const aiStorage = require('../lib/ai_storage');

const projectRoot = path.resolve(__dirname, '..');

function formatDateForSitemap(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function resolveLastmodByFiles(relativePaths) {
  let latestMtimeMs = 0;
  for (const relPath of relativePaths) {
    try {
      const fullPath = path.join(projectRoot, relPath);
      const stat = fs.statSync(fullPath);
      if (stat && stat.mtimeMs > latestMtimeMs) latestMtimeMs = stat.mtimeMs;
    } catch (_) {
      // Ignore missing/unreadable file and continue with available references.
    }
  }
  const date = latestMtimeMs > 0 ? new Date(latestMtimeMs) : new Date();
  return formatDateForSitemap(date);
}

function resolvePublicBaseUrl(req) {
  const configured = String((cfg.appConfig && cfg.appConfig.public_base_url) || '').trim().replace(/\/+$/, '');
  if (configured) return configured;
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
  return `${proto}://${req.get('host')}`.replace(/\/+$/, '');
}

function renderDocs(req, res) {
  const html = getPublicDocs(cfg.appConfig || {}, { baseUrl: resolvePublicBaseUrl(req) });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
}

function readAiCodeFromRequest(req) {
  const codeFromQuery = String(req.query.code || '').trim();
  if (codeFromQuery) return codeFromQuery;
  const original = String(req.originalUrl || '');
  const marker = '?=';
  const idx = original.indexOf(marker);
  if (idx !== -1) return original.slice(idx + marker.length).split('&')[0].trim();
  return '';
}

router.get('/', async (req, res, next) => {
  const isDocsRequest = !req.query.type && !req.query.accountNumber && !req.query.nik && !req.query.nomor && !req.query.check_status;
  if (!isDocsRequest) return next();
  try {
    return renderDocs(req, res);
  } catch (error) {
    console.error('[Error rendering public docs /]', error);
    return res
      .status(500)
      .send('<h2 style="color:red;font-family:sans-serif;">Error 500: Internal Server Error</h2><p>Terjadi kesalahan render dokumentasi publik.</p>');
  }
});

router.get('/docs', async (req, res) => {
  try {
    return renderDocs(req, res);
  } catch (error) {
    console.error('[Error rendering public docs]', error);
    return res
      .status(500)
      .send('<h2 style="color:red;font-family:sans-serif;">Error 500: Internal Server Error</h2><p>Terjadi kesalahan render dokumentasi publik.</p>');
  }
});

router.get('/get/ai', (req, res) => {
  try {
    const code = readAiCodeFromRequest(req);
    if (!code) return res.status(400).send('code required');
    const row = aiStorage.getByCode(code);
    if (!row) return res.status(404).send('AI file not found or expired');
    res.setHeader('Content-Type', row.mime || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.sendFile(row.filePath);
  } catch (err) {
    return res.status(500).send('failed to load ai file');
  }
});

router.get('/robots.txt', (req, res) => {
  const baseUrl = resolvePublicBaseUrl(req);
  res.type('text/plain');
  return res.send([
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/',
    `Sitemap: ${baseUrl}/sitemap.xml`
  ].join('\n'));
});

router.get('/sitemap.xml', (req, res) => {
  const baseUrl = resolvePublicBaseUrl(req);
  const lastmodHome = resolveLastmodByFiles(['public.js', 'routes/public_docs.js']);
  const lastmodDocs = resolveLastmodByFiles(['public.js', 'routes/public_docs.js']);
  const lastmodRegister = resolveLastmodByFiles(['routes/member_pages.js']);
  res.type('application/xml');
  return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc><lastmod>${lastmodHome}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${baseUrl}/docs</loc><lastmod>${lastmodDocs}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/member/register</loc><lastmod>${lastmodRegister}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>
</urlset>`);
});

module.exports = router;
