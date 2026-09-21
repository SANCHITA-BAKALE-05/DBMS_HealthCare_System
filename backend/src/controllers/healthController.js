// ============================================================
// healthController.js
// Handles the /api/health endpoint.
// Checks that:
//   1. The Express server is running
//   2. The MySQL database connection is working
// ============================================================

const db = require('../config/db');

// GET /api/health
// Returns server status and database connection status.
const getHealth = async (req, res) => {
  // Start building the response object
  const response = {
    status: 'OK',
    server: 'running',
    timestamp: new Date().toISOString(),
    database: 'unknown'
  };

  try {
    // Run a simple query to verify the DB connection is alive.
    // We query the existing healthcare_system tables to confirm
    // we are connected to the correct database.
    const [rows] = await db.query(
      'SELECT COUNT(*) AS table_count FROM information_schema.tables WHERE table_schema = ?',
      [process.env.DB_NAME]
    );

    response.database = 'connected';
    response.database_name = process.env.DB_NAME;
    response.table_count = rows[0].table_count;

    return res.status(200).json(response);

  } catch (error) {
    // DB connection failed — still return 200 for the server
    // but clearly report the DB as disconnected
    response.status = 'DEGRADED';
    response.database = 'disconnected';
    response.database_error = error.message;

    return res.status(200).json(response);
  }
};

module.exports = { getHealth };
