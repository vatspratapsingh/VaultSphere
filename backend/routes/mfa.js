const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');
const {
  generateMFASecret,
  verifyAndEnableMFA,
  disableMFA,
  getMFAStatus
} = require('../middleware/mfa');

const router = express.Router();

// Apply rate limiting to all MFA routes
router.use(authLimiter);

// Get MFA status
router.get('/status', authenticateToken, getMFAStatus);

// Generate MFA secret and QR code
router.post('/setup', authenticateToken, generateMFASecret);

// Verify MFA token and enable MFA
router.post('/enable', authenticateToken, verifyAndEnableMFA);

// Disable MFA
router.post('/disable', authenticateToken, disableMFA);

module.exports = router;