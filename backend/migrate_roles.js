import mysql from 'mysql2/promise';

const db = await mysql.createConnection({ host:'localhost', user:'root', password:'', database:'pos_app' });

const [r1] = await db.query("UPDATE users SET role='Manager' WHERE role='Admin' OR role='Manajer'");
console.log('Updated', r1.affectedRows, 'users to Manager role');

const [rows] = await db.query('SELECT id, name, email, role FROM users');
console.log('\nCurrent users:');
rows.forEach(u => console.log(' -', u.role.padEnd(12), u.email));

await db.end();
