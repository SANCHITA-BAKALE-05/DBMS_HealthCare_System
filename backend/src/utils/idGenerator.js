// ============================================================
// idGenerator.js
//
// PURPOSE:
//   Generates the next sequential ID for database tables
//   that use custom VARCHAR primary keys instead of
//   MySQL's AUTO_INCREMENT integer IDs.
//
// WHY CUSTOM IDs INSTEAD OF AUTO_INCREMENT?
//   The existing schema uses human-readable IDs like:
//     P001, P002, P003 ... for patients
//     D001, D002        ... for doctors
//     AP001, AP002      ... for appointments
//   These are easier to read, reference in reports,
//   and demonstrate in college project presentations.
//
// HOW IT WORKS:
//   1. Query the MAX value of the ID column in the table.
//      e.g. SELECT MAX(patient_id) → 'P005'
//   2. Extract just the number part: 'P005' → 5
//      (SUBSTRING removes the prefix, CAST converts to integer)
//   3. Add 1:  5 + 1 = 6
//   4. Pad with leading zeros: 6 → '006'
//   5. Add the prefix back: 'P' + '006' = 'P006'
//
// IMPORTANT NOTE FOR PRODUCTION:
//   This approach is not safe under high-concurrency production
//   loads (two simultaneous requests could generate the same ID).
//   For a college project this is perfectly fine. For production
//   you would use UUID or a dedicated sequence table instead.
// ============================================================

const db = require('../config/db');

/**
 * generateNextId
 *
 * @param {string} table      - The MySQL table name, e.g. 'Patient'
 * @param {string} column     - The primary key column, e.g. 'patient_id'
 * @param {string} prefix     - The ID prefix, e.g. 'P'  → produces 'P001'
 * @param {number} padLength  - How many digits after the prefix, e.g. 3 → 'P001'
 * @returns {Promise<string>} - The next available ID string
 *
 * Example:
 *   generateNextId('Patient', 'patient_id', 'P', 3)
 *   If P005 is the current max → returns 'P006'
 */
const generateNextId = async (table, column, prefix, padLength = 3) => {
  const [rows] = await db.query(
    // SUBSTRING(column, prefix.length + 1) removes the prefix characters
    // e.g. SUBSTRING('P005', 2) → '005'
    // CAST(... AS UNSIGNED) converts the string '005' to the integer 5
    // MAX(...) returns the highest number found
    `SELECT MAX(CAST(SUBSTRING(${column}, ?) AS UNSIGNED)) AS max_num FROM \`${table}\``,
    [prefix.length + 1]
  );

  // If the table is empty, max_num will be NULL — default to 0
  const maxNum  = rows[0].max_num || 0;
  const nextNum = maxNum + 1;

  // padStart adds leading zeros: String(6).padStart(3, '0') → '006'
  return prefix + String(nextNum).padStart(padLength, '0');
};

module.exports = { generateNextId };
