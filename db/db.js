const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
  user: 'root',
  password: 'Pramod@311202',
  database: 'food_buddies'
})

db.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL database:', err);
      return;
    }
    console.log('Connected to MySQL database');
  });


  module.exports = db;