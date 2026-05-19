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
  item_id INT NOT NULL,
  qty INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

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
    
    // Double check if image column exists, in case products was created manually earlier without it
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
      console.log('All migrations executed successfully.');
      db.end();
    });
  } catch (err) {
    console.error('Migration failed:', err);
    db.end();
    process.exit(1);
  }
}

migrate();
