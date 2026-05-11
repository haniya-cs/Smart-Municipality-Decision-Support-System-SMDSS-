const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "sql7.freesqldatabase.com",
  user: "sql7826211",
  password: "yrqcCGC3RC",
  database: "sql7826211",
  port: 3306,
});

db.connect((err) => {
  if (err) {
    console.error("DB connection failed:", err);
  } else {
    console.log("Connected to database");
  }
});

module.exports = db;
