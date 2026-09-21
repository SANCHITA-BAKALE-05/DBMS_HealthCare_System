// ============================================================
// db.js
// MySQL connection pool using mysql2
// This file creates a reusable connection pool that the
// entire backend will use to query the healthcare_system DB.
// ============================================================

const mysql = require('mysql2');

// Create a connection pool.
// A pool manages multiple connections so the backend can
// handle multiple requests at the same time efficiently.
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT || 3306,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Maximum number of connections in the pool
  connectionLimit: 10,

  // Return a promise-based interface so we can use async/await
  // instead of callbacks
  waitForConnections: true,
  queueLimit: 0
});

// .promise() gives us the promise-based version of the pool,
// which lets us write: const [rows] = await pool.query(...)
const promisePool = pool.promise();

module.exports = promisePool;
