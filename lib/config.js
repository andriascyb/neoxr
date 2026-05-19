/**
 * lib/config.js
 * Application configuration, MySQL pool, settings sync & DB initialization
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const TERMINAL_DEBUG = false;
function debugLog(...args) { if (TERMINAL_DEBUG) console.log(...args); }

const CONFIG_FILE_PATH = path.join(__dirname, '../config.json');
const BANK_CODES_PATH = path.join(__dirname, '../bank_codes.json');
const env = process.env;

// ===== APP CONFIG DEFAULTS =====
let appConfig = {
  server_name: "APIV3",
  cache_time: 300,
  cache_enabled: 1,
  db_cache_enabled: 1,
  redis_cache_enabled: 0,
  redis_url: 'redis://127.0.0.1:6379',
  redis_prefix: 'apiv3',
  redis_ttl_seconds: 300,
  public_base_url: "",
  wa_notify_enabled: 1,
  wa_notify_days_before: 2,
  wa_template_new_user: "Halo {name}, akun API Anda sudah aktif.\n\nAPI Key: {api_key}\nSaldo awal: Rp {balance}\nMode: Saldo (tanpa expiry paket)\n\nDocs: {base_url}/\nContoh:\n{base_url}/api/v3/validate?api_key={api_key}&type=bank&code=014&accountNumber=1234567890",
  wa_template_expiry_2d: "Halo {name}, saldo API Anda saat ini Rp {balance}.\nBatas peringatan saldo rendah tercapai (<= Rp {threshold}).\nSegera topup agar layanan tetap lancar.\n\nInfo: {base_url}/",
  api_key: env.API_KEY || "65ad46d0-4fbe-4d61-acfa-1dc4951a5562",
  timeout_ms: 8000,
  pool_attempt_timeout_ms: 10000,
  bank_server1_status: "on",
  bank_status: 'on',
  bank_server2_status: "on",
  ewallet_server1_status: "on",
  ewallet_status: 'on',
  ewallet_server2_status: "off",
  ewallet_server2_base_url: 'https://billpaketdata.com/cekid/ewallet/check_packages',
  bank_server2_apikey: env.BANK_SERVER2_APIKEY || "ASRD-OPENAPI1H3HK7DSJ7BLPTTQVEIHRJ69GE72GTS5",
  bank_server3_status: 'off',
  bank_server3_auto_window_enabled: 'on',
  bank_server3_base_url: 'https://rrtravelnbx.com/v2/topup_merchant_result_ajax-pin',
  bank_server3_cookie: '',
  bank_server3_pool_enabled: 'off',
  bank_server3_pool: [],
  bank_server3_cookie_auto_refresh: 'off',
  bank_server3_cookie_refresh_hours: 24,
  bank_endpoint: "https://rfpdev.me/api/check-rekening",
  ewallet_endpoint: "https://rfpdev.me/api/check-ewallet",
  nik_endpoint: "https://rfpdev.me/api/check-nik",
  fonnte_token: env.FONNTE_TOKEN || "F2u384MXYn2gny4PvUmj",
  pitucode_apikey: env.PITUCODE_APIKEY || "dadd4f27220b",
  wa_priority: "0,2,1",
  wa_validation_priority: "1,2",
  wa_notification_provider: "fonnte",
  admin_key: env.ADMIN_KEY || "admin123",
  show_packages: 1,
  cooldown_bank: 0,
  cooldown_ewallet: 0,
  cooldown_whatsapp: 0,
  cooldown_nik: 0,
  cooldown_bpjs: 0,
  cooldown_pln: 0,
  cooldown_ai: 0,
  cost_bank: 150,
  cost_ewallet: 150,
  cost_nik: 250,
  cost_whatsapp: 50,
  cost_bpjs: 100,
  cost_pln: 100,
  cost_ai: 0,
  invalid_quota_24h: 500,
  invalid_penalty_percent: 50,
  nik_status: 'on',
  whatsapp_status: 'on',
  bank_server4_status: 'off',
  bank_server4_apikey: '',
  ewallet_server3_status: 'off',
  ewallet_server3_apikey: '',
  bank_server5_status: 'off',
  ewallet_server5_status: 'off',
  server5_base_url: 'http://43.156.205.106/api.php',
  qiospay_member_id: env.QIOSPAY_MEMBER_ID || '',
  qiospay_pin: env.QIOSPAY_PIN || '',
  qiospay_password: env.QIOSPAY_PASSWORD || '',
  qiospay_callback_key: env.QIOSPAY_CALLBACK_KEY || '112233',
  qiospay_wait_timeout_ms: 10000,
  bank_server6_status: 'off',
  bank_server6_apikey: env.BANK_SERVER6_APIKEY || '69c40bca8755e',
  bank_server6_base_url: 'https://laburagame.com/api/bank',
  bank_server7_status: 'off',
  bank_server7_base_url: 'https://rikipilkonokos.xyz/api/bank',
  bank_server7_apikey: '',
  ewallet_server6_status: 'off',
  ewallet_server6_apikey: '',
  ewallet_server6_base_url: 'https://laburagame.com/api/ewallet',
  ewallet_server7_status: 'off',
  ewallet_server7_auto_window_enabled: 'on',
  ewallet_server7_base_url: 'https://v1.cekapi.com/cekewallet',
  ewallet_server7_apikey: '68a561-32cf0d-7f267b-484a96-90eb34',
  ewallet_server7_cookie: '',
  ewallet_server7_pool_enabled: 'off',
  ewallet_server7_pool: [],
  ewallet_server7_cookie_auto_refresh: 'off',
  ewallet_server7_cookie_refresh_hours: 24,
  ewallet_server8_status: 'off',
  ewallet_server8_base_url: 'https://rikipilkonokos.xyz/api/ewallet',
  ewallet_server8_apikey: '',
  pool_cookie_refresh_timeout_ms: 8000,
  pool_cookie_refresh_check_minutes: 10,
  klikmbc_ppob_base_url: 'https://klikmbc.biz/v2/ppob_result_ajax-pin',
  klikmbc_ppob_cookie: '',
  provider_circuit_fail_threshold: 3,
  provider_circuit_cooldown_ms: 60000,
  games_status: 'off',
  bpjs_status: 'off',
  pln_status: 'off',
  ai_status: 'off',
  ai_endpoint: 'https://api.neoxr.eu/api/photo-editor',
  ai_apikey: '9ViEsr',
  ai_timeout_ms: 15000,
  ai_file_ttl_hours: 12,
  cost_games: 100,
  bank_code_server_toggles: {},
  h2h_member_id: env.H2H_MEMBER_ID || '',
  h2h_pin: env.H2H_PIN || '',
  h2h_password: env.H2H_PASSWORD || '',
  h2h_base_url: 'https://api.h2h.id/api/trx',
  member_register_bonus: 50,
  member_register_enabled: 1,
  member_register_reopen_at: '',
  member_register_require_otp: 0,
  member_register_otp_target_number: '',
  wa_otp_expiry_minutes: 5,
  wa_otp_max_attempts: 5,
  member_pin_max_attempts: 5,
  member_pin_lock_minutes: 15,
  payment_method_overrides: {}
};

let mysqlConfig = {
  host: env.MYSQL_HOST || 'localhost',
  user: env.MYSQL_USER || 'bapivalidasi_db',
  password: env.MYSQL_PASSWORD || 'bapivalidasi_db',
  database: env.MYSQL_DATABASE || 'bapivalidasi_db',
  port: Number(env.MYSQL_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: Number(env.MYSQL_CONNECTION_LIMIT) || 10,
  queueLimit: 0
};

let logRetentionDays = 30;

// ===== LOAD FROM config.json =====
try {
  if (fs.existsSync(CONFIG_FILE_PATH)) {
    const configData = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf8'));

    if (configData.mysql_host) mysqlConfig.host = configData.mysql_host;
    if (configData.mysql_user) mysqlConfig.user = configData.mysql_user;
    if (configData.mysql_password) mysqlConfig.password = configData.mysql_password;
    if (configData.mysql_database) mysqlConfig.database = configData.mysql_database;
    if (configData.mysql_port) mysqlConfig.port = configData.mysql_port;

    Object.keys(appConfig).forEach(key => {
      if (configData[key] !== undefined) {
        appConfig[key] = configData[key];
      }
    });

    if (configData.api_log_retention_days) {
      logRetentionDays = parseInt(configData.api_log_retention_days) || 30;
    }

    console.log('[CONFIG] Successfully loaded config.json');
  } else {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(appConfig, null, 2));
    console.log('[CONFIG] Created default config.json');
  }
} catch (e) {
  console.log('[CONFIG] Error loading config.json:', e.message);
}

let ADMIN_KEY = appConfig.admin_key || "admin123";

console.log(`[MYSQL] Connecting to ${mysqlConfig.host}:${mysqlConfig.port} as ${mysqlConfig.user} on DB ${mysqlConfig.database}`);
const multipleStatements = String(env.MYSQL_MULTIPLE_STATEMENTS || 'true').toLowerCase() === 'true';
const dbPool = mysql.createPool({ ...mysqlConfig, timezone: '+07:00', multipleStatements });

if (typeof dbPool.on === 'function') {
  dbPool.on('connection', (connection) => {
    try { connection.query("SET time_zone = '+07:00'"); } catch (e) { }
  });
}

// ===== SETTINGS SYNC =====
async function loadSettingsFromDB() {
  try {
    const [rows] = await dbPool.query('SELECT setting_key, setting_value FROM api_settings');
    if (rows.length === 0) {
      console.log('[CONFIG] No settings found in DB, performing initial sync...');
      await syncSettingsToDB();
      return;
    }

    rows.forEach(row => {
      const key = row.setting_key;
      let val = row.setting_value;

      const numericKeys = [
        'cache_time', 'cache_enabled', 'db_cache_enabled', 'wa_notify_enabled',
        'wa_notify_days_before', 'timeout_ms', 'pool_attempt_timeout_ms',
        'redis_cache_enabled', 'redis_ttl_seconds',
        'show_packages', 'api_log_retention_days',
        'cooldown_bank', 'cooldown_ewallet', 'cooldown_whatsapp', 'cooldown_nik',
        'cooldown_bpjs', 'cooldown_pln', 'cooldown_ai',
        'cost_bank', 'cost_ewallet', 'cost_nik', 'cost_whatsapp', 'cost_games', 'cost_bpjs', 'cost_pln', 'cost_ai',
        'ai_timeout_ms', 'ai_file_ttl_hours',
        'invalid_quota_24h', 'invalid_penalty_percent',
        'member_register_bonus', 'member_register_enabled', 'member_pin_max_attempts', 'member_pin_lock_minutes',
        'qiospay_wait_timeout_ms', 'member_register_require_otp', 'wa_otp_expiry_minutes', 'wa_otp_max_attempts'
        , 'bank_server3_cookie_refresh_hours', 'ewallet_server7_cookie_refresh_hours'
        , 'pool_cookie_refresh_timeout_ms', 'pool_cookie_refresh_check_minutes'
      ];
      if (numericKeys.includes(key)) {
        val = parseInt(val);
      }

      if (key === 'api_log_retention_days') {
        logRetentionDays = val || 30;
      } else if (key === 'bank_code_server_toggles' || key === 'payment_method_overrides' || key === 'ewallet_server7_pool' || key === 'bank_server3_pool') {
        try { appConfig[key] = typeof val === 'string' ? JSON.parse(val) : val; } catch (e) { }
      } else if (appConfig[key] !== undefined) {
        appConfig[key] = val;
      }
    });

    if (appConfig.admin_key) {
      ADMIN_KEY = appConfig.admin_key;
    }

    console.log('[CONFIG] Settings successfully loaded from MySQL');
  } catch (err) {
    console.error('[CONFIG] Warning: Could not load settings from MySQL:', err.message);
  }
}

async function syncSettingsToDB() {
  try {
    const settingsToSync = { ...appConfig, api_log_retention_days: logRetentionDays };

    for (const [key, value] of Object.entries(settingsToSync)) {
      let valToStore = value;
      if (typeof valToStore === 'object' && valToStore !== null) {
        valToStore = JSON.stringify(valToStore);
      }

      await dbPool.query(
        'INSERT INTO api_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, String(valToStore), String(valToStore)]
      );
    }
    console.log('[CONFIG] Settings synced to MySQL api_settings');
  } catch (err) {
    console.error('[CONFIG] Failed to sync settings to MySQL:', err.message);
  }
}

// ===== DATABASE INIT =====
async function initDatabase() {
  try {
    await dbPool.query("SET time_zone = '+07:00'");
  } catch (e) {
    console.error('[MYSQL] Warning: Failed to set timezone to +07:00:', e.message);
  }

  await loadSettingsFromDB();

  try {
    // FIX: Alter api_settings setting_value to TEXT to avoid "Data too long" error
    try {
      await dbPool.query("ALTER TABLE api_settings MODIFY COLUMN setting_value TEXT");
      console.log('[MYSQL-INIT] api_settings.setting_value converted to TEXT');
    } catch (e) { /* ignore if already TEXT or other errors */ }

    if (fs.existsSync('./database_schema.sql')) {
      try {
        await dbPool.query(`CREATE TABLE IF NOT EXISTS api_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          api_key VARCHAR(100),
          ip_address VARCHAR(45),
          endpoint VARCHAR(255),
          request_data TEXT,
          response_data TEXT,
          status_code INT,
          response_time INT,
          log_type VARCHAR(20),
          is_success TINYINT DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
      } catch (e) {
        console.error('[MYSQL-INIT] Failed to ensure api_logs table:', e.message);
      }

      const criticalColumns = [
        `ALTER TABLE api_logs ADD COLUMN log_type VARCHAR(20)`,
        `ALTER TABLE api_logs ADD COLUMN is_success TINYINT DEFAULT 1`,
        `ALTER TABLE api_logs ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE api_logs ADD COLUMN response_time INT`,
        `ALTER TABLE api_logs ADD COLUMN status_code INT`,
        `ALTER TABLE api_logs ADD COLUMN charged_amount DECIMAL(18,2) DEFAULT 0`
      ];
      for (const col of criticalColumns) {
        try { await dbPool.query(col); } catch (e) { /* ignore ER_DUP_FIELDNAME */ }
      }

      const apiKeyColumns = [
        `ALTER TABLE api_keys ADD COLUMN whatsapp_number VARCHAR(25) DEFAULT NULL`,
        `ALTER TABLE api_keys ADD COLUMN wa_expiry_warned_at DATETIME NULL DEFAULT NULL`,
        `ALTER TABLE api_keys ADD COLUMN wa_expiry_warned_for DATETIME NULL DEFAULT NULL`,
        `ALTER TABLE api_keys ADD COLUMN wa_low_balance_warn_step INT DEFAULT 0`,
        `ALTER TABLE api_keys ADD COLUMN legacy_package_id INT NULL DEFAULT NULL`,
        `ALTER TABLE api_keys ADD COLUMN legacy_billing_type VARCHAR(20) NULL DEFAULT NULL`,
        `ALTER TABLE api_keys ADD COLUMN legacy_expiry DATETIME NULL DEFAULT NULL`,
        `ALTER TABLE api_keys ADD COLUMN saldo_migration_at DATETIME NULL DEFAULT NULL`
      ];
      for (const col of apiKeyColumns) {
        try { await dbPool.query(col); } catch (e) { /* ignore duplicate column */ }
      }

      const memberColumns = [
        `ALTER TABLE member_accounts ADD COLUMN registration_ip VARCHAR(45) DEFAULT NULL`,
        `ALTER TABLE member_accounts ADD COLUMN member_code VARCHAR(32) DEFAULT NULL`
      ];
      for (const col of memberColumns) {
        try { await dbPool.query(col); } catch (e) { /* ignore duplicate column */ }
      }
      try {
        await dbPool.query(`UPDATE member_accounts SET member_code = CONCAT('MBR', LPAD(id, 6, '0')) WHERE member_code IS NULL OR member_code = ''`);
      } catch (e) {
        console.error('[MYSQL-INIT] Failed to backfill member_code:', e.message);
      }
      try {
        await dbPool.query(`ALTER TABLE member_accounts ADD UNIQUE KEY uniq_member_code (member_code)`);
      } catch (e) { /* ignore duplicate index */ }

      const packageColumns = [
        `ALTER TABLE packages ADD COLUMN duration_days INT DEFAULT 30`
      ];
      for (const col of packageColumns) {
        try { await dbPool.query(col); } catch (e) { /* ignore duplicate column */ }
      }

      // Ensure table used by member package checkout / revenue analytics exists on older installs
      try {
        await dbPool.query(`CREATE TABLE IF NOT EXISTS member_package_invoices (
          id INT AUTO_INCREMENT PRIMARY KEY,
          invoice_no VARCHAR(60) NOT NULL UNIQUE,
          member_id INT NOT NULL,
          package_id INT NOT NULL,
          package_name VARCHAR(100) DEFAULT NULL,
          amount DECIMAL(12,2) NOT NULL,
          duration_days INT NOT NULL DEFAULT 30,
          payment_method VARCHAR(30) NOT NULL DEFAULT 'wallet',
          status ENUM('pending', 'paid', 'failed', 'cancelled') DEFAULT 'pending',
          details_json LONGTEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          confirmed_at DATETIME NULL DEFAULT NULL,
          INDEX idx_member_pkg_invoice_member (member_id),
          INDEX idx_member_pkg_invoice_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
      } catch (e) {
        console.error('[MYSQL-INIT] Failed to ensure member_package_invoices table:', e.message);
      }

      try {
        await dbPool.query(`CREATE TABLE IF NOT EXISTS payment_method_settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          method_code VARCHAR(64) NOT NULL,
          enabled TINYINT(1) NOT NULL DEFAULT 1,
          label VARCHAR(120) DEFAULT NULL,
          icon_url VARCHAR(255) DEFAULT NULL,
          sort_order INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uniq_method_code (method_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
      } catch (e) {
        console.error('[MYSQL-INIT] Failed to ensure payment_method_settings table:', e.message);
      }

      try {
        await dbPool.query(`CREATE TABLE IF NOT EXISTS wa_otp_sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          whatsapp_number VARCHAR(25) NOT NULL,
          otp_code_hash VARCHAR(128) NOT NULL,
          otp_code_masked VARCHAR(32) DEFAULT NULL,
          purpose VARCHAR(30) NOT NULL DEFAULT 'register',
          status ENUM('pending','verified','expired','failed','cancelled') DEFAULT 'pending',
          expires_at DATETIME NOT NULL,
          attempts INT NOT NULL DEFAULT 0,
          max_attempts INT NOT NULL DEFAULT 5,
          verified_at DATETIME NULL DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_wa_otp_number_status (whatsapp_number, status),
          INDEX idx_wa_otp_expires (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
      } catch (e) {
        console.error('[MYSQL-INIT] Failed to ensure wa_otp_sessions table:', e.message);
      }

      try {
        await dbPool.query(`CREATE TABLE IF NOT EXISTS member_registration_drafts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          whatsapp_number VARCHAR(25) NOT NULL,
          pin_hash VARCHAR(255) NOT NULL,
          registration_ip VARCHAR(45) DEFAULT NULL,
          otp_session_id INT NOT NULL,
          member_id INT NULL DEFAULT NULL,
          status ENUM('pending','verified','failed','cancelled','expired') DEFAULT 'pending',
          failure_reason VARCHAR(120) DEFAULT NULL,
          verified_at DATETIME NULL DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_member_reg_drafts_wa_status (whatsapp_number, status),
          INDEX idx_member_reg_drafts_otp (otp_session_id),
          CONSTRAINT fk_member_reg_draft_otp FOREIGN KEY (otp_session_id)
            REFERENCES wa_otp_sessions(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
      } catch (e) {
        console.error('[MYSQL-INIT] Failed to ensure member_registration_drafts table:', e.message);
      }

      try {
        await dbPool.query(`CREATE TABLE IF NOT EXISTS wa_message_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          direction ENUM('inbound','outbound') NOT NULL,
          provider VARCHAR(40) DEFAULT NULL,
          whatsapp_number VARCHAR(25) NOT NULL,
          message_text TEXT,
          message_type VARCHAR(30) DEFAULT 'otp',
          related_otp_id INT NULL DEFAULT NULL,
          status VARCHAR(30) DEFAULT 'received',
          reason VARCHAR(255) DEFAULT NULL,
          payload_json LONGTEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_wa_msg_direction_created (direction, created_at),
          INDEX idx_wa_msg_number_created (whatsapp_number, created_at),
          INDEX idx_wa_msg_status_created (status, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
      } catch (e) {
        console.error('[MYSQL-INIT] Failed to ensure wa_message_logs table:', e.message);
      }

      const sql = fs.readFileSync('./database_schema.sql', 'utf8');
      const sanitizedSql = sql
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n');
      const statements = sanitizedSql.split(';').map(s => s.trim()).filter(s => s.length > 0);

      let successCount = 0;
      for (const stmt of statements) {
        try {
          await dbPool.query(stmt);
          successCount++;
        } catch (e) {
          const ignoredCodes = [
            'ER_DUP_FIELDNAME', 'ER_DUP_KEYNAME', 'ER_TABLE_EXISTS_ERROR',
            'ER_DUP_ENTRY', '1050', '1060', '1061', '1062'
          ];
          const isIgnored = ignoredCodes.includes(e.code) ||
            ignoredCodes.includes(String(e.errno)) ||
            e.message.toLowerCase().includes('duplicate');

          if (!isIgnored) {
            if (stmt.toUpperCase().includes('CREATE INDEX') && e.message.includes('Syntax error')) {
              debugLog('[MYSQL-INIT] Index creation failed, skipping index.');
            } else {
              console.error('[MYSQL-INIT] Error on statement:', stmt.substring(0, 50) + '...', e.message);
            }
          }
        }
      }
      debugLog(`[MYSQL] Database schema auto-initialized. Executed ${successCount}/${statements.length} statements successfully.`);

      try {
        await dbPool.query("INSERT IGNORE INTO api_keys (api_key, name, is_active, billing_type) VALUES ('PUBLIC_TRIAL', 'Public Trial User', 0, 'trial')");
        debugLog('[MYSQL-INIT] Ensured PUBLIC_TRIAL user exists.');
      } catch (e) {
        console.error('[MYSQL-INIT] Failed to create PUBLIC_TRIAL user:', e.message);
      }

      // Safe saldo-only migration:
      // 1) backup package/billing/expiry lama
      // 2) force semua user non-trial ke mode balance
      try {
        await dbPool.query(`
          UPDATE api_keys
          SET
            legacy_package_id = CASE WHEN legacy_package_id IS NULL THEN package_id ELSE legacy_package_id END,
            legacy_billing_type = CASE WHEN legacy_billing_type IS NULL THEN billing_type ELSE legacy_billing_type END,
            legacy_expiry = CASE WHEN legacy_expiry IS NULL THEN expiry ELSE legacy_expiry END,
            billing_type = 'balance',
            package_id = NULL,
            expiry = NULL,
            saldo_migration_at = COALESCE(saldo_migration_at, NOW())
          WHERE api_key <> 'PUBLIC_TRIAL'
        `);
      } catch (e) {
        console.error('[MYSQL-INIT] Saldo-only migration failed:', e.message);
      }

      try {
        await dbPool.query(
          `INSERT IGNORE INTO packages (package_id, name, price, duration_days, features, description, max_requests_per_day, is_active)
           VALUES
           (1, 'Starter', 0, 30, 'bank,whatsapp', 'Fitur Dasar - Cek Bank & WhatsApp', 1000, 1),
           (2, 'Pro', 50000, 30, 'bank,ewallet,nik,whatsapp', 'Fitur Lengkap - Bank, E-Wallet, NIK & WhatsApp', 100000, 1)`
        );
      } catch (e) {
        console.error('[MYSQL-INIT] Failed to seed default packages:', e.message);
      }
    }
  } catch (err) {
    console.error('[MYSQL] Error reading database schema:', err.message);
  }
}

module.exports = {
  appConfig,
  mysqlConfig,
  dbPool,
  get logRetentionDays() { return logRetentionDays; },
  set logRetentionDays(v) { logRetentionDays = v; },
  get ADMIN_KEY() { return ADMIN_KEY; },
  set ADMIN_KEY(v) { ADMIN_KEY = v; },
  loadSettingsFromDB,
  syncSettingsToDB,
  initDatabase,
  debugLog,
  TERMINAL_DEBUG,
  CONFIG_FILE_PATH,
  BANK_CODES_PATH
};
