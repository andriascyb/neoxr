-- =========================================================
-- Skema Database API Checker v3.1 (Teroptimasi)
-- =========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------
-- Tabel: packages
-- Menyimpan data paket premium/berlangganan
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS packages (
  package_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL DEFAULT '',
  price INT DEFAULT 0 COMMENT 'Harga per bulan dalam IDR',
  duration_days INT DEFAULT 30 COMMENT 'Durasi paket dalam hari',
  features TEXT COMMENT 'Fitur dipisah koma: bank,ewallet,nik,whatsapp',
  description TEXT,
  max_requests_per_day INT DEFAULT 10000,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Tabel: api_keys
-- Tabel utama untuk manajemen akses dan saldo pengguna
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  api_key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100),
  balance DECIMAL(12,2) DEFAULT 0,
  billing_type ENUM('balance', 'package') DEFAULT 'balance',
  package_id INT DEFAULT NULL,
  total_hits INT DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  whatsapp_number VARCHAR(25) DEFAULT NULL,
  wa_expiry_warned_at DATETIME NULL DEFAULT NULL,
  wa_expiry_warned_for DATETIME NULL DEFAULT NULL,
  last_used TIMESTAMP NULL DEFAULT NULL,
  expires_at DATETIME DEFAULT '2030-12-31 23:59:59',
  expiry DATETIME DEFAULT '2030-12-31 23:59:59',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indeks untuk optimasi query
  INDEX idx_api_key (api_key),
  INDEX idx_billing (billing_type),
  INDEX idx_active_status (is_active),
  
  -- Relasi ke tabel packages
  CONSTRAINT fk_api_package FOREIGN KEY (package_id) 
    REFERENCES packages(package_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Tabel: api_logs
-- Mencatat setiap aktivitas request API
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  api_key VARCHAR(100),
  ip_address VARCHAR(45),
  endpoint VARCHAR(255),
  request_data TEXT,
  response_data TEXT,
  status_code INT,
  response_time INT COMMENT 'Dalam milidetik',
  log_type VARCHAR(20),
  is_success TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_key_logs (api_key),
  INDEX idx_log_date (created_at),
  INDEX idx_status (is_success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Tabel: balance_logs
-- Audit trail untuk setiap perubahan saldo (Top-up/Deduction)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS balance_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  api_key VARCHAR(100),
  amount DECIMAL(12, 2),
  description TEXT,
  current_balance DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_key_balance (api_key),
  INDEX idx_balance_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Tabel: api_settings
-- Pengaturan global biaya API dan status server
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(100) DEFAULT 'system'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Data Default (Initial Seeding)
-- ---------------------------------------------------------

-- Paket Default
INSERT IGNORE INTO packages (package_id, name, price, features, description, max_requests_per_day) VALUES
(1, 'Starter', 0, 'bank,whatsapp', 'Fitur Dasar - Cek Bank & WhatsApp', 1000),
(2, 'Pro', 50000, 'bank,ewallet,nik,whatsapp', 'Fitur Lengkap - Bank, E-Wallet, NIK & WhatsApp', 100000);

-- Pengaturan Biaya & Status Server
INSERT IGNORE INTO api_settings (setting_key, setting_value, description) VALUES
('cost_bank', '200', 'Biaya per cek bank'),
('cost_ewallet', '200', 'Biaya per cek e-wallet'),
('cost_nik', '300', 'Biaya per cek NIK'),
('cost_whatsapp', '100', 'Biaya per cek WhatsApp'),
('api_log_retention_days', '30', 'Jumlah hari penyimpanan log API'),
('bank_server1_status', 'on', 'Status server RFPDev'),
('bank_server2_status', 'on', 'Status server AasardConnect'),
('ewallet_server1_status', 'on', 'Status server E-wallet 1'),
('ewallet_server2_status', 'on', 'Status server E-wallet 2');

-- ---------------------------------------------------------
-- Tabel: member_accounts
-- Akun portal user yang login dengan nomor WhatsApp + PIN
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  whatsapp_number VARCHAR(25) NOT NULL UNIQUE,
  registration_ip VARCHAR(45) DEFAULT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  active_mode ENUM('balance', 'package') DEFAULT 'balance',
  wallet_balance DECIMAL(12,2) DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  failed_pin_attempts INT DEFAULT 0,
  pin_locked_until DATETIME NULL DEFAULT NULL,
  last_login_at DATETIME NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_member_whatsapp (whatsapp_number),
  INDEX idx_member_registration_ip (registration_ip),
  INDEX idx_member_active_mode (active_mode),
  INDEX idx_member_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Tabel: member_sessions
-- Sesi login portal user
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  session_token VARCHAR(128) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_member_session_token (session_token),
  INDEX idx_member_session_exp (expires_at),
  CONSTRAINT fk_member_sessions_member FOREIGN KEY (member_id)
    REFERENCES member_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Tabel: member_api_keys
-- Mapping akun portal ke api_keys
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_api_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  api_key_id INT NOT NULL,
  is_primary TINYINT DEFAULT 1,
  revoked_at DATETIME NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_member_api_member (member_id),
  INDEX idx_member_api_primary (member_id, is_primary, revoked_at),
  CONSTRAINT fk_member_api_keys_member FOREIGN KEY (member_id)
    REFERENCES member_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_member_api_keys_api FOREIGN KEY (api_key_id)
    REFERENCES api_keys(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Tabel: member_wallet_transactions
-- Ledger saldo portal user
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_wallet_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  type ENUM('bonus', 'credit', 'debit', 'adjustment', 'forfeit', 'refund') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  balance_before DECIMAL(12,2) DEFAULT 0,
  balance_after DECIMAL(12,2) DEFAULT 0,
  description TEXT,
  reference_type VARCHAR(50) DEFAULT NULL,
  reference_id VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_member_wallet_member (member_id),
  INDEX idx_member_wallet_created (created_at),
  CONSTRAINT fk_member_wallet_member FOREIGN KEY (member_id)
    REFERENCES member_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Tabel: member_package_subscriptions
-- Riwayat langganan package user
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_package_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  package_id INT NOT NULL,
  status ENUM('active', 'expired', 'forfeited') DEFAULT 'active',
  started_at DATETIME NOT NULL,
  ended_at DATETIME NULL DEFAULT NULL,
  price DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_member_sub_member (member_id),
  INDEX idx_member_sub_status (status),
  CONSTRAINT fk_member_sub_member FOREIGN KEY (member_id)
    REFERENCES member_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_member_sub_package FOREIGN KEY (package_id)
    REFERENCES packages(package_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Tabel: member_package_invoices
-- Invoice checkout pembelian/perpanjang package member
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_package_invoices (
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
  INDEX idx_member_pkg_invoice_status (status),
  CONSTRAINT fk_member_pkg_invoice_member FOREIGN KEY (member_id)
    REFERENCES member_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_member_pkg_invoice_package FOREIGN KEY (package_id)
    REFERENCES packages(package_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Tabel: member_topups
-- Request topup via H2H deposit
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_topups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  invoice VARCHAR(100) NOT NULL UNIQUE,
  amount DECIMAL(12,2) NOT NULL,
  fee DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  method_code VARCHAR(50) NOT NULL,
  method_name VARCHAR(100) DEFAULT NULL,
  payment_type VARCHAR(50) DEFAULT NULL,
  status VARCHAR(30) DEFAULT 'pending',
  expired_at DATETIME NULL DEFAULT NULL,
  provider_response LONGTEXT,
  credited_at DATETIME NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_member_topup_member (member_id),
  INDEX idx_member_topup_status (status),
  CONSTRAINT fk_member_topup_member FOREIGN KEY (member_id)
    REFERENCES member_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Tabel: member_mode_changes
-- Audit perpindahan mode package / balance
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_mode_changes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  from_mode VARCHAR(20) DEFAULT NULL,
  to_mode VARCHAR(20) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_member_mode_member (member_id),
  CONSTRAINT fk_member_mode_member FOREIGN KEY (member_id)
    REFERENCES member_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Tabel: member_pin_reset_logs
-- Audit reset PIN oleh admin
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_pin_reset_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  reset_by VARCHAR(100) DEFAULT 'admin',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_member_pin_reset_member (member_id),
  CONSTRAINT fk_member_pin_reset_member FOREIGN KEY (member_id)
    REFERENCES member_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Tabel: response_mappings
-- Pemetaan response JSON per layanan dan server
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS response_mappings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_type VARCHAR(30) NOT NULL,
  provider_code VARCHAR(30) NOT NULL,
  mapping_name VARCHAR(120) NOT NULL,
  baseline_mapping_json LONGTEXT NOT NULL,
  draft_mapping_json LONGTEXT NOT NULL,
  active_mapping_json LONGTEXT NOT NULL,
  sample_request_json LONGTEXT NULL,
  sample_source_json LONGTEXT NULL,
  sample_response_json LONGTEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_response_mapping (service_type, provider_code),
  INDEX idx_response_mapping_service (service_type, provider_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Tabel: response_mapping_versions
-- Riwayat publish mapping response
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS response_mapping_versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mapping_id INT NOT NULL,
  version_no INT NOT NULL,
  version_label VARCHAR(50) NOT NULL,
  mapping_json LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_response_mapping_versions (mapping_id, version_no),
  CONSTRAINT fk_response_mapping_versions_mapping FOREIGN KEY (mapping_id)
    REFERENCES response_mappings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
