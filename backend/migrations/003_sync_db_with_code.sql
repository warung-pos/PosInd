-- Migration: Sync DB with code (add branch and admin_id)
-- Date: 2026-06-08
-- Description: Menambahkan kolom-kolom yang digunakan di backend terbaru

ALTER TABLE users 
  ADD COLUMN admin_id INT DEFAULT NULL AFTER plan;

ALTER TABLE products 
  ADD COLUMN branch VARCHAR(100) DEFAULT 'Cabang Utama' AFTER image;

ALTER TABLE transactions 
  ADD COLUMN branch VARCHAR(100) DEFAULT 'Cabang Utama' AFTER change_due;
