const mysql = require("mysql2");
const config = require("../config/config.json");

var pool = mysql.createPool(config.db);

// Database asynchronous operation, encapsulated in a Promise
let query = function (sql, values) {
  return new Promise((resolve, reject) => {
    pool.getConnection(function (err, connection) {
      if (err) {
        reject(err);
      } else {
        connection.query(sql, values, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
          connection.release();
        });
      }
    });
  });
};

module.exports = { query };
