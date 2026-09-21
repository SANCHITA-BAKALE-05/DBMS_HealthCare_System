// ============================================================
// authMiddleware.js
// JWT authentication + role-based authorization middleware.
//
// Usage in routes:
//   authenticate              → any logged-in user
//   authorize('ADMIN')        → admin only
//   authorize('DOCTOR','ADMIN') → doctor or admin
// ============================================================

const jwt = require('jsonwebtoken');

/**
 * authenticate
 * Reads the Authorization header, verifies the JWT,
 * and attaches the decoded payload to req.user.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied. No token provided.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { user_id, username, role }
    next();
  } catch (err) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token. Please log in again.'
    });
  }
};

/**
 * authorize(...roles)
 * Returns middleware that allows access only if the
 * authenticated user's role is in the provided list.
 *
 * Example: authorize('ADMIN', 'DOCTOR')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authenticated.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Access denied. Required role: ${roles.join(' or ')}.`
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
