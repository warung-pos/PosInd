import mysql from 'mysql2';

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Laragon default kosong
  database: 'pos_app'
});

db.connect((err) => {
  if (err) {
    console.error('Database error:', err);
  } else {
    console.log('MySQL Connected ✅');
  }
});

export default db;