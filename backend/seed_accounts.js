import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

async function seed() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'pos_app'
  });

  const users = [
    { name: 'Manager POS', email: 'manager@warungpos.com', password: 'manager123', role: 'Manager', plan: 'Enterprise' },
    { name: 'Operator POS', email: 'operator@warungpos.com', password: 'operator123', role: 'Operator', plan: 'Enterprise' },
    { name: 'Kasir POS', email: 'kasir@warungpos.com', password: 'kasir123', role: 'Kasir', plan: 'Enterprise' },
    { name: 'Konsumen POS', email: 'konsumen@warungpos.com', password: 'onsumen123', role: 'Konsumen', plan: 'basic' }
  ];

  console.log('Mengecek dan membuat akun...');
  
  let managerId = null;

  for (const u of users) {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [u.email]);
    
    if (existing.length === 0) {
      const hashed = await bcrypt.hash(u.password, 10);
      
      // Jika user bukan Manager dan bukan Konsumen, kita assign admin_id ke Manager
      let admin_id = null;
      if (u.role === 'Operator' || u.role === 'Kasir') {
         admin_id = managerId;
      }

      const [result] = await db.query(
        'INSERT INTO users (name, email, password, role, plan, admin_id) VALUES (?, ?, ?, ?, ?, ?)', 
        [u.name, u.email, hashed, u.role, u.plan, admin_id]
      );
      console.log(`✅ Berhasil membuat akun: ${u.email} (Role: ${u.role})`);
      
      if (u.role === 'Manager') {
        managerId = result.insertId;
      }
    } else {
      console.log(`ℹ️ Akun sudah ada: ${u.email}`);
      if (u.role === 'Manager') {
        managerId = existing[0].id;
      }
    }
  }

  await db.end();
  console.log('Selesai!');
}

seed().catch(err => {
  console.error('Terjadi kesalahan:', err);
  process.exit(1);
});
