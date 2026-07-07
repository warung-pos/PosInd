import mysql from 'mysql2/promise';

async function fix() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'pos_app'
  });

  console.log('Fixing Admin permissions in roles table...');
  try {
    const [result] = await db.query(
      "UPDATE roles SET permissions = ? WHERE name = ?",
      [
        JSON.stringify(["dashboard", "produk", "transaksi", "pesanan", "riwayat", "laporan", "staf", "role", "paket"]),
        "Admin"
      ]
    );
    console.log(`Successfully updated ${result.affectedRows} row(s).`);
  } catch (err) {
    console.error('Error updating roles table:', err.message);
  }

  await db.end();
}

fix();
