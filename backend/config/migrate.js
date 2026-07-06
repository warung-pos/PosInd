import db from './db.js';

console.log('Running database migrations...');

const createProductsTable = `
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL,
  category VARCHAR(100) DEFAULT 'Minuman',
  image VARCHAR(255) DEFAULT NULL,
  sales INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const createTransactionsTable = `
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice VARCHAR(100) NOT NULL UNIQUE,
  user_id INT DEFAULT NULL,
  total DECIMAL(10, 2) NOT NULL,
  fee_pos DECIMAL(10, 2) NOT NULL,
  method VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const createTransactionItemsTable = `
CREATE TABLE IF NOT EXISTS transaction_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id INT NOT NULL,
  item_id INT DEFAULT NULL,
  product_name VARCHAR(255) NOT NULL DEFAULT '',
  qty INT NOT NULL DEFAULT 1,
  price DECIMAL(15, 2) NOT NULL,
  subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const createRolesTable = `
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  permissions TEXT NOT NULL,
  is_default TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_admin_role (admin_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

// Helper: cek apakah kolom ada, jika tidak tambahkan
const addColumnIfMissing = (table, column, definition) => {
  return new Promise((resolve) => {
    db.query(`SHOW COLUMNS FROM ${table} LIKE '${column}'`, async (err, results) => {
      if (err || results.length > 0) {
        console.log(`Column '${column}' already exists or check failed, skipping.`);
        return resolve();
      }
      db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (alterErr) => {
        if (alterErr) console.error(`Failed to add ${column}:`, alterErr.message);
        else console.log(`Success: Added '${column}' to ${table}`);
        resolve();
      });
    });
  });
};

const executeQuery = (query, desc) => {
  return new Promise((resolve, reject) => {
    db.query(query, (err, results) => {
      if (err) {
        console.error(`Error executing: ${desc}`, err);
        reject(err);
      } else {
        console.log(`Success: ${desc}`);
        resolve(results);
      }
    });
  });
};

async function migrate() {
  try {
    await executeQuery(createProductsTable, 'Create products table');
    await executeQuery(createTransactionsTable, 'Create transactions table');
    await executeQuery(createTransactionItemsTable, 'Create transaction_items table');
    await executeQuery(createRolesTable, 'Create roles table');

    // Tambah kolom cash_paid & change_due ke transactions jika belum ada
    await addColumnIfMissing('transactions', 'cash_paid', 'DECIMAL(15,2) DEFAULT NULL');
    await addColumnIfMissing('transactions', 'change_due', 'DECIMAL(15,2) DEFAULT NULL');

    // Tambah kolom snapshot ke transaction_items jika belum ada
    await addColumnIfMissing('transaction_items', 'product_name', "VARCHAR(255) NOT NULL DEFAULT ''");
    await addColumnIfMissing('transaction_items', 'subtotal', 'DECIMAL(15,2) NOT NULL DEFAULT 0');
    await addColumnIfMissing('transaction_items', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    // Tambah kolom admin_id ke users untuk manajemen staf kasir
    await addColumnIfMissing('users', 'admin_id', 'INT DEFAULT NULL');

    // Tambah kolom company_name ke users untuk manajemen nama usaha
    await addColumnIfMissing('users', 'company_name', 'VARCHAR(255) DEFAULT NULL');

    // Tambah kolom branch ke products & transactions untuk fitur multi cabang
    await addColumnIfMissing('products', 'branch', "VARCHAR(100) DEFAULT 'Cabang Utama'");
    await addColumnIfMissing('transactions', 'branch', "VARCHAR(100) DEFAULT 'Cabang Utama'");

    // Ubah item_id agar bisa NULL (produk yang dihapus tidak merusak data)
    try {
      await executeQuery('ALTER TABLE transaction_items MODIFY COLUMN item_id INT DEFAULT NULL', 'Modify item_id to nullable');
    } catch (e) {
      console.log('item_id may already be nullable, skipping...');
    }

    // Double check if image column exists in products
    db.query("SHOW COLUMNS FROM products LIKE 'image'", async (err, results) => {
      if (err) {
        console.error('Error checking products table for image column:', err);
        process.exit(1);
      }
      if (results.length === 0) {
        try {
          await executeQuery("ALTER TABLE products ADD COLUMN image VARCHAR(255) DEFAULT NULL", 'Add image column to products');
        } catch (alterErr) {
          process.exit(1);
        }
      } else {
        console.log('image column already exists in products table.');
      }
      console.log('✅ All migrations executed successfully.');
      db.end();
    });
  } catch (err) {
    console.error('Migration failed:', err);
    db.end();
    process.exit(1);
  }
}

migrate();
