// ============================================================
// authController.js
// Handles registration, login, and profile retrieval.
//
// Database tables used (from existing schema):
//   User_Account  — authentication credentials + role
//   Patient       — patient profile (created on registration)
//
// Existing schema notes:
//   User_Account.user_id     VARCHAR(10) PK  e.g. 'U010'
//   User_Account.username    VARCHAR(50) UNIQUE
//   User_Account.password_hash VARCHAR(255)
//   User_Account.role        ENUM('PATIENT','DOCTOR','ADMIN')
//   User_Account.account_status ENUM('ACTIVE','INACTIVE','BLOCKED')
//   Patient.patient_id       VARCHAR(10) PK  e.g. 'P006'
//   Patient.user_id          VARCHAR(10) FK → User_Account
// ============================================================

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');
const { generateNextId } = require('../utils/idGenerator');

// ============================================================
// POST /api/auth/register
// Registers a new PATIENT account.
// Creates both a User_Account row and a Patient profile row.
// ============================================================
const register = async (req, res) => {
  const {
    username,
    password,
    first_name,
    last_name,
    date_of_birth,
    gender,
    phone,
    email,
    address,
    blood_group
  } = req.body;

  // --- Basic validation ---
  if (!username || !password || !first_name || !last_name ||
      !date_of_birth || !gender || !phone || !email) {
    return res.status(400).json({
      status: 'error',
      message: 'Required fields: username, password, first_name, last_name, date_of_birth, gender, phone, email.'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      status: 'error',
      message: 'Password must be at least 6 characters.'
    });
  }

  // Get a connection from the pool so we can run a transaction
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // Check if username already exists
    const [existingUser] = await conn.query(
      'SELECT user_id FROM User_Account WHERE username = ?',
      [username]
    );
    if (existingUser.length > 0) {
      await conn.rollback();
      conn.release();
      return res.status(409).json({
        status: 'error',
        message: 'Username already taken.'
      });
    }

    // Check if email already exists in Patient table
    const [existingEmail] = await conn.query(
      'SELECT patient_id FROM Patient WHERE email = ?',
      [email]
    );
    if (existingEmail.length > 0) {
      await conn.rollback();
      conn.release();
      return res.status(409).json({
        status: 'error',
        message: 'Email already registered.'
      });
    }

    // Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Generate new IDs
    const user_id    = await generateNextId('User_Account', 'user_id', 'U', 3);
    const patient_id = await generateNextId('Patient', 'patient_id', 'P', 3);

    // Insert into User_Account
    await conn.query(
      `INSERT INTO User_Account
       (user_id, username, password_hash, role, account_status)
       VALUES (?, ?, ?, 'PATIENT', 'ACTIVE')`,
      [user_id, username, password_hash]
    );

    // Insert into Patient
    await conn.query(
      `INSERT INTO Patient
       (patient_id, user_id, first_name, last_name, date_of_birth,
        gender, phone, email, address, blood_group)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, user_id, first_name, last_name, date_of_birth,
       gender, phone, email, address || null, blood_group || null]
    );

    await conn.commit();
    conn.release();

    return res.status(201).json({
      status: 'success',
      message: 'Registration successful. You can now log in.',
      data: { user_id, patient_id, username }
    });

  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error('Registration error:', error.message);

    // Handle MySQL duplicate entry errors gracefully
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        status: 'error',
        message: 'Username, phone, or email already exists.'
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Registration failed. Please try again.'
    });
  }
};

// ============================================================
// POST /api/auth/login
// Validates credentials for PATIENT, DOCTOR, or ADMIN.
// Returns a JWT token on success.
// ============================================================
const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Username and password are required.'
    });
  }

  try {
    // Fetch user account
    const [users] = await db.query(
      'SELECT * FROM User_Account WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password.'
      });
    }

    const user = users[0];

    // Check account status
    if (user.account_status !== 'ACTIVE') {
      return res.status(403).json({
        status: 'error',
        message: 'Your account is not active. Please contact admin.'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password.'
      });
    }

    // Fetch role-specific profile to include in token payload
    let profile = null;

    if (user.role === 'PATIENT') {
      const [rows] = await db.query(
        'SELECT patient_id, first_name, last_name, email FROM Patient WHERE user_id = ?',
        [user.user_id]
      );
      profile = rows[0] || null;
    } else if (user.role === 'DOCTOR') {
      const [rows] = await db.query(
        'SELECT doctor_id, first_name, last_name, email, specialization, department_id FROM Doctor WHERE user_id = ?',
        [user.user_id]
      );
      profile = rows[0] || null;
    } else if (user.role === 'ADMIN') {
      const [rows] = await db.query(
        'SELECT admin_id, first_name, last_name, email FROM Admin WHERE user_id = ?',
        [user.user_id]
      );
      profile = rows[0] || null;
    }

    // Build JWT payload
    const tokenPayload = {
      user_id:  user.user_id,
      username: user.username,
      role:     user.role
    };

    // Include the role-specific ID in the token for convenience
    if (profile) {
      if (user.role === 'PATIENT')  tokenPayload.patient_id  = profile.patient_id;
      if (user.role === 'DOCTOR')   tokenPayload.doctor_id   = profile.doctor_id;
      if (user.role === 'ADMIN')    tokenPayload.admin_id    = profile.admin_id;
    }

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    // Update last_login timestamp
    await db.query(
      'UPDATE User_Account SET last_login = NOW() WHERE user_id = ?',
      [user.user_id]
    );

    return res.status(200).json({
      status:  'success',
      message: 'Login successful.',
      token,
      user: {
        user_id:  user.user_id,
        username: user.username,
        role:     user.role,
        profile
      }
    });

  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Login failed. Please try again.'
    });
  }
};

// ============================================================
// GET /api/auth/me
// Returns the currently logged-in user's profile.
// Requires authenticate middleware.
// ============================================================
const getMe = async (req, res) => {
  try {
    const { user_id, role } = req.user;

    const [users] = await db.query(
      'SELECT user_id, username, role, account_status, created_at, last_login FROM User_Account WHERE user_id = ?',
      [user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    let profile = null;

    if (role === 'PATIENT') {
      const [rows] = await db.query(
        `SELECT p.*, d.department_name
         FROM Patient p
         LEFT JOIN User_Account u ON p.user_id = u.user_id
         WHERE p.user_id = ?`,
        [user_id]
      );
      profile = rows[0] || null;
    } else if (role === 'DOCTOR') {
      const [rows] = await db.query(
        `SELECT d.*, dep.department_name
         FROM Doctor d
         LEFT JOIN Department dep ON d.department_id = dep.department_id
         WHERE d.user_id = ?`,
        [user_id]
      );
      profile = rows[0] || null;
    } else if (role === 'ADMIN') {
      const [rows] = await db.query(
        'SELECT * FROM Admin WHERE user_id = ?',
        [user_id]
      );
      profile = rows[0] || null;
    }

    return res.status(200).json({
      status: 'success',
      data: { ...users[0], profile }
    });

  } catch (error) {
    console.error('getMe error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch profile.' });
  }
};

module.exports = { register, login, getMe };
