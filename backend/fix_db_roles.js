import mysql from 'mysql2/promise';

const db = await mysql.createConnection({ host: '127.0.0.1', user: 'root', password: '', database: 'pos_app' });

try {
  await db.query(`UPDATE roles SET permissions = '["dashboard","produk","transaksi","riwayat","laporan","staf","role","paket"]' WHERE name = 'Admin'`);
  console.log('Successfully updated existing Admin roles in DB with the "role" permission.');
} catch (e) {
  console.error('Failed to update roles:', e);
} finally {
  await db.end();
}
