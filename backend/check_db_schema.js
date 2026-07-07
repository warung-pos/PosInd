import mysql from 'mysql2';

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'pos_app'
});

db.connect((err) => {
  if (err) throw err;
  db.query("DESCRIBE transaction_items", (err, results) => {
    if (err) throw err;
    console.log(results);
    db.end();
  });
});
