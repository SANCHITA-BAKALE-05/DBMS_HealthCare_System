// ============================================================
// server.js
// Entry point for the backend.
// Loads environment variables, then starts the Express server.
// ============================================================

// Load .env variables FIRST — before importing anything else
// so that db.js and app.js can read process.env values
require('dotenv').config();

const app  = require('./app');
const db   = require('./config/db');

const PORT = process.env.PORT || 5000;

// ============================================================
// Test the database connection before starting the server
// ============================================================
const startServer = async () => {
  try {
    // Run a minimal query to confirm the pool can reach MySQL
    await db.query('SELECT 1');

    console.log('-----------------------------------------------');
    console.log(' Healthcare System Backend');
    console.log('-----------------------------------------------');
    console.log(` Database  : ${process.env.DB_NAME} @ ${process.env.DB_HOST}`);
    console.log(` DB Status : Connected successfully`);

    // Start the HTTP server only after confirming DB is reachable
    app.listen(PORT, () => {
      console.log(` Server    : http://localhost:${PORT}`);
      console.log(` Health    : http://localhost:${PORT}/api/health`);
      console.log('-----------------------------------------------');
    });

  } catch (error) {
    console.error('-----------------------------------------------');
    console.error(' FAILED TO CONNECT TO DATABASE');
    console.error('-----------------------------------------------');
    console.error(' Error   :', error.message);
    console.error(' Check   : DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in .env');
    console.error('-----------------------------------------------');

    // Exit the process so the error is clearly visible
    process.exit(1);
  }
};

startServer();
