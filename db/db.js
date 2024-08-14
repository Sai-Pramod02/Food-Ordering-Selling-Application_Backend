const mysql = require('mysql2');

const db = mysql.createConnection({
    host: '34.127.63.114',
  user: 'root',
password:'letzgoo',
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
