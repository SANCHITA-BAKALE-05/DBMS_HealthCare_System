// ============================================================
// db.js
//
// PURPOSE:
//   Creates and exports a single shared MySQL connection pool
//   that every controller in the backend uses to run queries.
//
// WHAT IS A CONNECTION POOL?
//   A connection pool is a set of pre-opened database connections
//   that are reused across requests. Instead of opening a brand
//   new connection for every HTTP request (which is slow), the
//   backend borrows one from the pool, uses it, and returns it.
//
//   connectionLimit: 10 means at most 10 simultaneous database
//   connections. This is more than enough for a college project.
//
// WHY .promise()?
//   The standard mysql2 library uses old-style callbacks like:
//     pool.query('SELECT...', function(err, rows) { ... })
//
//   .promise() wraps the pool so we can use modern async/await:
//     const [rows] = await pool.query('SELECT...')
//
//   This makes the code much cleaner and easier to read.
//
// ENVIRONMENT VARIABLES (set in backend/.env):
//   DB_HOST     — database server address (e.g. localhost or Aiven host)
//   DB_PORT     — port number (default MySQL port is 3306)
//   DB_USER     — MySQL username
//   DB_PASSWORD — MySQL password
//   DB_NAME     — database name (healthcare_system)
// ============================================================

const mysql = require('mysql2');

// Create the connection pool using credentials from .env
// process.env reads the values set in the .env file via dotenv
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT || 3306,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Maximum number of open connections at the same time
  connectionLimit: 10,

  // If all 10 connections are busy, new requests wait in a queue
  waitForConnections: true,
  queueLimit: 0   // 0 = unlimited queue size
});

// Convert to promise-based interface so controllers can use async/await
const promisePool = pool.promise();

module.exports = promisePool;
