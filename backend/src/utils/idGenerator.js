// ============================================================
// idGenerator.js
// Generates the next sequential ID for tables that use
// manual VARCHAR IDs (e.g. P001, D001, AP001).
//
// Strategy: query MAX(id) from the table, parse the number,
// increment by 1, and zero-pad to the original width.
// This is safe for the low-concurrency loads of a college
// project. For production a dedicated sequence table or
// UUID approach would be preferred.
// ============================================================

const db = require('../config/db');

/**
 * generateNextId
 * @param {string} table      - Table name, e.g. 'Patient'
 * @param {string} column     - Primary key column, e.g. 'patient_id'
 * @param {string} prefix     - ID prefix, e.g. 'P'
 * @param {number} padLength  - Total numeric digits, e.g. 3 → 'P001'
 * @returns {Promise<string>} - Next ID string
 */
const generateNextId = async (table, column, prefix, padLength = 3) => {
  const [rows] = await db.query(
    `SELECT MAX(CAST(SUBSTRING(${column}, ?) AS UNSIGNED)) AS max_num FROM \`${table}\``,
    [prefix.length + 1]
  );

  const maxNum = rows[0].max_num || 0;
  const nextNum = maxNum + 1;
  return prefix + String(nextNum).padStart(padLength, '0');
};

module.exports = { generateNextId };
