import mysql from 'mysql2/promise';

const updateRendang = async () => {
  const db = await mysql.createConnection({host:'localhost',user:'root',password:'',database:'pos_app'});
  await db.query('UPDATE products SET category = ? WHERE name LIKE ?', ['Makanan', '%Rendang%']);
  console.log('Fixed Rendang category!');
  await db.end();
};

updateRendang();
