import db from './config/db.js';
db.query('SELECT SUM(total) as total_sum, SUM(fee_pos) as fee_sum FROM transactions', (err, results) => {
  if (err) console.error(err);
  else console.log('Transaction Sums:', results);
  db.end();
});
