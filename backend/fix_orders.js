import mysql from 'mysql2/promise';

const fixOrders = async () => {
  const db = await mysql.createConnection({host:'localhost',user:'root',password:'',database:'pos_app'});
  await db.query("UPDATE transactions SET status = 'Pending' WHERE method = 'Konsumen (Mandiri)' AND status = 'Selesai'");
  console.log('Fixed early completed orders to Pending!');
  await db.end();
};

fixOrders();
