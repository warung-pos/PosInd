import mysql from 'mysql2';

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'pos_app'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting:', err);
    process.exit(1);
  }
  
  db.query('SELECT id, name, email, role, admin_id, plan FROM users', (err, results) => {
    if (err) {
      console.error('Error querying:', err);
    } else {
      console.log('--- Users in database ---');
      console.log(JSON.stringify(results, null, 2));
    }
    db.end();
  });
});
