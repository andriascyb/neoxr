/**
 * Bank Account, E-Wallet, NIK & WhatsApp Checker API - APIV3 Ultra Optimized
 * High Performance, In-Memory Caching (node-cache)
 * + Admin Dashboard & Detailed JSON Stats Tracking (Valid/Failed/Total)
 *
 * server.js — Entry point / bootstrap
 * Refactored into modular files:
 *   lib/logger.js     — File logging
 *   lib/config.js     — Config, MySQL pool, DB init
 *   lib/whatsapp.js   — WhatsApp provider eksternal & WA jobs
 *   lib/stats.js      — Stats, cache, logging
 *   lib/auth.js       — Auth middleware, billing
 *   routes/admin.js   — Admin dashboard & settings
 *   routes/users.js   — User management
 *   routes/packages.js — Package management
 *   routes/mysql_manager.js — MySQL browser/backup
 *   routes/logs.js    — Log management
 *   routes/api_checker.js  — Main checker API
 *   routes/public_api.js   — Public endpoints
 */

console.log(`[STARTUP] Server.js starting... Build: 2026-03-17_19:25`);

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL-GUARD] unhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[FATAL-GUARD] uncaughtException:', err);
});

// === 1. LOGGING SYSTEM (must be first) ===
require('./lib/logger');

// === 2. CONFIG & DATABASE ===
const cfg = require('./lib/config');

// === 3. WHATSAPP (starts WA jobs) ===
const wa = require('./lib/whatsapp');
wa.initWaJobs();
const poolCookieRefresher = require('./lib/pool_cookie_refresher');
poolCookieRefresher.initPoolCookieRefresher();
const serverWindowScheduler = require('./lib/server_window_scheduler');
serverWindowScheduler.initServerWindowScheduler();
const aiStorage = require('./lib/ai_storage');
try { aiStorage.cleanupExpired(); } catch (_) { }
setInterval(() => { try { aiStorage.cleanupExpired(); } catch (_) { } }, 15 * 60 * 1000).unref?.();

// === 4. DEPENDENCIES ===
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const adminSession = require('./lib/admin_session');

const app = express();
const trustProxyHopsRaw = process.env.TRUST_PROXY_HOPS;
const trustProxyHops = Number.isFinite(Number(trustProxyHopsRaw))
  ? Math.max(1, parseInt(trustProxyHopsRaw, 10))
  : 2; // default: Cloudflare -> Nginx -> Node
app.set('trust proxy', trustProxyHops);
const port = process.env.PORT || 3000;

// === READINESS GATE ===
let isSystemReady = false;

app.use((req, res, next) => {
  if (!isSystemReady && !req.path.startsWith('/api/v3/status') && !req.path.startsWith('/admin')) {
    // If it's a browser request (HTML), send a better message instead of JSON
    const accept = req.headers['accept'] || '';
    if (accept.includes('text/html')) {
      return res.status(503).send(`
        <div style="font-family:sans-serif; text-align:center; padding:50px;">
          <h2 style="color:#3b82f6;">Sistem Sedang Inisialisasi</h2>
          <p>Server sedang menyiapkan database dan komponen sistem. Mohon tunggu sekitar 10-20 detik lalu refresh halaman ini.</p>
          <div style="margin-top:20px; color:#64748b; font-size:12px;">Status: STARTING_UP</div>
          <script>setTimeout(() => window.location.reload(), 5000);</script>
        </div>
      `);
    }
    return res.status(503).json({
      status: false,
      error: 'Service Temporarily Unavailable',
      message: 'Server is still initializing. Please wait a few seconds and refresh.',
      code: 'STARTING_UP'
    });
  }
  next();
});

// === RATE LIMITING (Basic Anti-DDoS) ===
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // Limit each IP to 200 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: false,
    message: "Terlalu banyak permintaan dari IP ini, silakan coba lagi dalam satu menit.",
    code: "TOO_MANY_REQUESTS"
  }
});

// === MIDDLEWARES ===
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "cdn.jsdelivr.net", "static.cloudflareinsights.com", "cdn.tailwindcss.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com", "fonts.googleapis.com", "cdn.tailwindcss.com"],
      imgSrc: ["'self'", "data:", "cdn.jsdelivr.net"],
      fontSrc: ["'self'", "fonts.gstatic.com", "cdn.jsdelivr.net", "cdnjs.cloudflare.com", "data:"],
      connectSrc: ["'self'", "cdn.jsdelivr.net", "static.cloudflareinsights.com"],
    },
  },
}));
app.use(hpp()); // Protect against HTTP Parameter Pollution
app.use(globalLimiter); // Apply the rate limiting to all requests
app.use('/api/v3/upload-image-temp', express.json({ limit: '6mb' }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

const readCookieValue = (cookieHeader, name) => adminSession.readCookieValue(cookieHeader, name);

const verifyAdminSessionToken = (token) => adminSession.verifyAdminSessionToken(token);

// Backward-compatible admin auth helper:
// allows x-admin-key header while preserving legacy query key flow.
app.use((req, res, next) => {
  const sessionToken = readCookieValue(req.headers.cookie, 'admin_session');
  if (sessionToken && verifyAdminSessionToken(sessionToken)) {
    req.query.key = cfg.ADMIN_KEY;
    return next();
  }
  const cookieAdminKey = readCookieValue(req.headers.cookie, 'admin_key');
  if (cookieAdminKey) {
    // Cookie wins to avoid stale/wrong key in query from cached links/pages.
    req.query.key = cookieAdminKey;
  }
  if (!req.query.key) {
    const adminHeaderKey = req.headers['x-admin-key'];
    if (typeof adminHeaderKey === 'string' && adminHeaderKey.trim()) {
      req.query.key = adminHeaderKey.trim();
    }
  }
  next();
});

app.use((req, res, next) => {
  const origin = String(req.headers.origin || '').trim();
  const host = String(req.headers.host || '').trim();
  const isAdminSurface =
    req.path.startsWith('/admin') ||
    req.path.startsWith('/api/v3/admin') ||
    req.path.startsWith('/api/v3/redis-audit');

  if (!isAdminSurface) {
    res.header('Access-Control-Allow-Origin', '*');
    return next();
  }

  if (!origin) return next();
  try {
    const parsed = new URL(origin);
    if (parsed.host === host) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Vary', 'Origin');
    }
  } catch (e) { }
  next();
});

// === ROUTES ===

// Public API (status, bank-codes, packages, check-apikey, admin API extras)
const publicApiRouter = require('./routes/public_api');
app.use('/api/v3', publicApiRouter);

// Public docs page
const publicDocsRouter = require('./routes/public_docs');
app.use('/', publicDocsRouter);

// Admin panel & WA management (also handles /admin/wa-*, /admin/stats, /admin/save, etc.)
const adminRouter = require('./routes/admin');
app.use('/admin', adminRouter);
// VPS Status API — handled inside admin router, exposed here with correct prefix
app.use('/api/v3', adminRouter);

// User management
const usersRouter = require('./routes/users');
app.use('/api/v3/admin/users', usersRouter);

// Package management
const packagesRouter = require('./routes/packages');
app.use('/api/v3/admin/packages', packagesRouter);

// Member portal pages
const memberPagesRouter = require('./routes/member_pages');
app.use('/member', memberPagesRouter);

// Member API
const memberApiRouter = require('./routes/member_api');
app.use('/api/v3/member', memberApiRouter);

// Admin member management
const adminMembersRouter = require('./routes/admin_members');
app.use('/api/v3/admin/members', adminMembersRouter);

// Admin revenue analytics
const adminRevenueRouter = require('./routes/admin_revenue');
app.use('/api/v3/admin/revenue', adminRevenueRouter);

// MySQL manager
const mysqlManagerRouter = require('./routes/mysql_manager');
app.use('/api/v3/admin/mysql', mysqlManagerRouter);

// Log management
const { router: logsRouter } = require('./routes/logs');
app.use('/api/v3/admin/logs', logsRouter);

// Main API checker (GET / and /api/v3/validate)
const { router: apiCheckerRouter } = require('./routes/api_checker');
app.use('/', apiCheckerRouter);

// Error handler (Catch-all for JSON errors instead of HTML)
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    status: false,
    message: 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR'
  });
});

// ===== STARTUP =====
async function main() {
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`[STARTUP] Server listening on port ${port}. Initializing system components...`);
  });

  try {
    console.log('[STARTUP] Starting database initialization...');
    await cfg.initDatabase();
    console.log('[STARTUP] DB initialization phase finished.');
    isSystemReady = true;
    console.log(`[STARTUP] API READY. Listening on port ${port}`);
    console.log(`[STARTUP] ADMIN PANEL: http://localhost:${port}/admin`);
    if (process.send) {
      console.log('[STARTUP] Notifying PM2 of readiness.');
      process.send('ready');
    }
  } catch (err) {
    console.error('[STARTUP] Fatal error during initialization:', err);
  }
}

main().catch(err => console.error('[STARTUP] Fatal error in main loop:', err));
