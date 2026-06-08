import db from '../backend/config/db.js';

db.query('SHOW TABLES', (err, tables) => {
  if (err) {
    console.error(err);
    db.end();
    return;
  }
  console.log('Tables:', tables);

  db.query('DESCRIBE users', (err, columns) => {
    if (err) {
      console.error(err);
    } else {
      console.log('Users columns:', columns);
    }
    db.end();
  });
});
