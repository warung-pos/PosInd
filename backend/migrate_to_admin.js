import mysql from 'mysql2/promise';

const db = await mysql.createConnection({ host: '127.0.0.1', user: 'root', password: '', database: 'pos_app' });

console.log('Migrating existing Manager accounts to Admin and seeding default roles...');

try {
  // 1. Ambil semua Manager (Owner) yang admin_id-nya NULL
  const [managers] = await db.query("SELECT id, email, name FROM users WHERE role = 'Manager' AND admin_id IS NULL");
  console.log(`Found ${managers.length} manager(s) to migrate.`);

  for (const mgr of managers) {
    console.log(`Migrating Manager: ${mgr.email} (ID: ${mgr.id})`);

    // Cek apakah default roles sudah ada untuk admin ini
    const [roles] = await db.query("SELECT id FROM roles WHERE admin_id = ?", [mgr.id]);
    
    if (roles.length === 0) {
      const defaultRoles = [
        { name: 'Admin',    permissions: '["dashboard","produk","transaksi","pesanan","riwayat","laporan","staf","role","paket"]', is_default: 1 },
        { name: 'Kasir',    permissions: '["dashboard","transaksi","riwayat"]', is_default: 1 },
        { name: 'Operator', permissions: '["dashboard","produk"]', is_default: 1 }
      ];

      for (const dr of defaultRoles) {
        await db.query(
          'INSERT INTO roles (admin_id, name, permissions, is_default) VALUES (?, ?, ?, ?)',
          [mgr.id, dr.name, dr.permissions, dr.is_default]
        );
      }
      console.log(`  Seeded default roles (Admin, Kasir, Operator) for admin_id ${mgr.id}`);
    } else {
      console.log(`  Roles already exist for admin_id ${mgr.id}, skipping seed.`);
    }

    // Update role di tabel users dari Manager ke Admin
    await db.query("UPDATE users SET role = 'Admin' WHERE id = ?", [mgr.id]);
    console.log(`  Updated role to 'Admin' for user ${mgr.email}`);
  }

  // 2. Update staff lain yang mungkin memiliki role 'Manager' (jika ada, ubah ke Admin)
  const [resStaff] = await db.query("UPDATE users SET role = 'Admin' WHERE role = 'Manager'");
  console.log(`Updated ${resStaff.affectedRows} staff users from Manager to Admin.`);

  console.log('✅ Migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error);
} finally {
  await db.end();
}
