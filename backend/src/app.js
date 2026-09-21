// ============================================================
// app.js
// Express application setup.
// Configures middleware and registers all route groups.
// ============================================================

const express = require('express');
const cors    = require('cors');

const app = express();

// ============================================================
// Middleware
// ============================================================

// CORS — allows the React frontend (on a different port) to
// call this backend during development
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded bodies (form submissions)
app.use(express.urlencoded({ extended: true }));

// ============================================================
// Routes
// ============================================================

// Health / status check (no auth required)
app.use('/api/health',         require('./routes/healthRoutes'));

// Authentication (register, login, me)
app.use('/api/auth',           require('./routes/authRoutes'));

// Patient routes
app.use('/api/patients',       require('./routes/patientRoutes'));

// Doctor routes
app.use('/api/doctors',        require('./routes/doctorRoutes'));

// Department routes
app.use('/api/departments',    require('./routes/departmentRoutes'));

// Appointment routes
app.use('/api/appointments',   require('./routes/appointmentRoutes'));

// Medical record routes
app.use('/api/medical-records',require('./routes/medicalRecordRoutes'));

// Prescription routes
app.use('/api/prescriptions',  require('./routes/prescriptionRoutes'));

// Payment routes
app.use('/api/payments',       require('./routes/paymentRoutes'));

// Feedback routes
app.use('/api/feedback',       require('./routes/feedbackRoutes'));

// Admin routes
app.use('/api/admin',          require('./routes/adminRoutes'));

// Analytics routes
app.use('/api/analytics',      require('./routes/analyticsRoutes'));

// ML proxy routes (Node calls Python ML service)
app.use('/api/ml',             require('./routes/mlRoutes'));

// ============================================================
// 404 Handler
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// ============================================================
// Global Error Handler
// ============================================================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

module.exports = app;
