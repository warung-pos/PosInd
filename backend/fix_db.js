import mysql from 'mysql2/promise';

async function fix() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'pos_app'
  });

  console.log('Altering transaction_items table...');
  try {
    await db.query(`
      ALTER TABLE transaction_items
      ADD COLUMN product_name VARCHAR(255) NULL AFTER item_id,
      ADD COLUMN subtotal DECIMAL(15,2) NULL AFTER price,
      ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('Columns added successfully.');
  } catch (err) {
    console.error('Error adding columns:', err.message);
  }

  await db.end();
}

fix();
