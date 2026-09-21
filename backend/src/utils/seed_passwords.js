// ============================================================
// seed_passwords.js
// Replaces the placeholder passwords in the existing sample
// data with real bcrypt hashes so you can actually log in.
//
// Run ONCE after setting up the database:
//   cd backend
//   node src/utils/seed_passwords.js
//
// Default test passwords (change as needed):
//   Patients:  password123
//   Doctors:   doctor123
//   Admin:     admin123
// ============================================================

require('dotenv').config()
const bcrypt = require('bcryptjs')
const db     = require('../config/db')

const seed = async () => {
  const saltRounds = 10

  const accounts = [
    // Patients
    { user_id: 'U001', password: 'password123' },
    { user_id: 'U002', password: 'password123' },
    { user_id: 'U003', password: 'password123' },
    { user_id: 'U004', password: 'password123' },
    { user_id: 'U005', password: 'password123' },
    // Doctors
    { user_id: 'U006', password: 'doctor123' },
    { user_id: 'U007', password: 'doctor123' },
    { user_id: 'U008', password: 'doctor123' },
    // Admin
    { user_id: 'U009', password: 'admin123' },
  ]

  console.log('Updating sample data passwords...')

  for (const account of accounts) {
    const hash = await bcrypt.hash(account.password, saltRounds)
    await db.query(
      'UPDATE User_Account SET password_hash = ? WHERE user_id = ?',
      [hash, account.user_id]
    )
    console.log(`  Updated: ${account.user_id}`)
  }

  console.log('\nDone! Sample login credentials:')
  console.log('  Patients  — username: rahul_p / priya_s / amit_k / neha_j / rohan_m  | password: password123')
  console.log('  Doctors   — username: dr_sharma / dr_patil / dr_mehta                | password: doctor123')
  console.log('  Admin     — username: admin01                                         | password: admin123')

  process.exit(0)
}

seed().catch(err => {
  console.error('Seed error:', err.message)
  process.exit(1)
})
