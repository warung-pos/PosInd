-- Migration: Create transaction_items table
-- Date: 2026-06-06
-- Description: Menyimpan detail item per transaksi sebagai bukti permanen.
--   - product_name disimpan sebagai snapshot agar tidak hilang bila produk dihapus
--   - subtotal disimpan agar tidak perlu hitung ulang

CREATE TABLE IF NOT EXISTS transaction_items (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    item_id     INT DEFAULT NULL,              -- bisa NULL jika produk sudah dihapus
    product_name VARCHAR(255) NOT NULL,        -- snapshot nama produk saat transaksi
    qty         INT NOT NULL DEFAULT 1,
    price       DECIMAL(15,2) NOT NULL,        -- harga satuan saat transaksi
    subtotal    DECIMAL(15,2) NOT NULL,        -- qty * price
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ti_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_ti_transaction_id ON transaction_items(transaction_id);
