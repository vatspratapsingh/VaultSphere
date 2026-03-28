const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authLimiter, passwordResetLimiter } = require('../middleware/security');
const { verifyMFAToken } = require('../middleware/mfa');
const { logAuthEvent, logSecurityEvent } = require('../config/logger');
const { getJWTSecret } = require('../config/secrets');

const router = express.Router();

// Apply rate limiting to auth routes
router.use('/login', authLimiter);
router.use('/signup', authLimiter);
router.use('/forgot-password', passwordResetLimiter);

// Register new user
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, tenant_id } = req.body;

    // Check if user already exists
    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (Supabase schema uses password_hash and company)
    const newUser = await db.query(
      'INSERT INTO users (email, password_hash, name, role, company) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role, company',
      [email, hashedPassword, name, 'user', 'Default Company']
    );

    // Log successful registration
    logAuthEvent('USER_REGISTERED', newUser.rows[0].id, {
      email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      message: 'User created successfully',
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error('Signup error:', error);
    logSecurityEvent('SIGNUP_FAILED', {
      email: req.body.email,
      error: error.message,
      ip: req.ip
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced login with MFA support
router.post('/login', async (req, res) => {
  try {
    const { email, password, mfaToken } = req.body;
    const clientIP = req.ip;
    const userAgent = req.get('User-Agent');

    // Check for account lockout
    const lockoutCheck = await db.query(
      'SELECT failed_login_attempts, account_locked_until FROM users WHERE email = $1',
      [email]
    );

    if (lockoutCheck.rows.length > 0) {
      const { failed_login_attempts, account_locked_until } = lockoutCheck.rows[0];
      
      if (account_locked_until && new Date() < new Date(account_locked_until)) {
        logSecurityEvent('LOGIN_BLOCKED_ACCOUNT_LOCKED', {
          email,
          ip: clientIP,
          userAgent
        });
        return res.status(423).json({ 
          error: 'Account temporarily locked due to multiple failed attempts',
          lockedUntil: account_locked_until
        });
      }
    }

    // Find user
    const user = await db.query(
      'SELECT id, email, name, role, company, password_hash, mfa_enabled, mfa_secret, failed_login_attempts FROM users WHERE email = $1', 
      [email]
    );
    
    if (user.rows.length === 0) {
      await recordFailedLogin(email, clientIP);
      logSecurityEvent('LOGIN_FAILED_USER_NOT_FOUND', { email, ip: clientIP });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userData = user.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, userData.password_hash);
    if (!isValidPassword) {
      await recordFailedLogin(email, clientIP);
      await incrementFailedAttempts(userData.id);
      logSecurityEvent('LOGIN_FAILED_INVALID_PASSWORD', { 
        userId: userData.id, 
        email, 
        ip: clientIP 
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check MFA if enabled
    if (userData.mfa_enabled) {
      if (!mfaToken) {
        return res.status(200).json({ 
          message: 'MFA token required',
          mfaRequired: true,
          tempToken: generateTempToken(userData.id) // Short-lived token for MFA verification
        });
      }

      // Verify MFA token
      const speakeasy = require('speakeasy');
      const verified = speakeasy.totp.verify({
        secret: userData.mfa_secret,
        encoding: 'base32',
        token: mfaToken,
        window: 2
      });

      if (!verified) {
        await recordFailedLogin(email, clientIP);
        logSecurityEvent('LOGIN_FAILED_INVALID_MFA', { 
          userId: userData.id, 
          email, 
          ip: clientIP 
        });
        return res.status(401).json({ error: 'Invalid MFA token' });
      }
    }

    // Reset failed attempts on successful login
    await db.query(
      'UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL, last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [userData.id]
    );

    // Generate JWT token
    const jwtSecret = await getJWTSecret();
    const token = jwt.sign(
      {
        userId: userData.id,
        email: userData.email,
        role: userData.role,
        tenantId: userData.tenant_id || null
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // Log successful login
    logAuthEvent('LOGIN_SUCCESS', userData.id, {
      email,
      ip: clientIP,
      userAgent,
      mfaUsed: userData.mfa_enabled
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        company: userData.company || null,
        mfaEnabled: userData.mfa_enabled
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    logSecurityEvent('LOGIN_ERROR', {
      email: req.body.email,
      error: error.message,
      ip: req.ip
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions
async function recordFailedLogin(email, ip) {
  try {
    await db.query(`
      INSERT INTO login_attempts (ip_address, email, attempts, last_attempt)
      VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
      ON CONFLICT (ip_address, email) 
      DO UPDATE SET 
        attempts = login_attempts.attempts + 1,
        last_attempt = CURRENT_TIMESTAMP
    `, [ip, email]);
  } catch (error) {
    console.error('Error recording failed login:', error);
  }
}

async function incrementFailedAttempts(userId) {
  try {
    const result = await db.query(`
      UPDATE users 
      SET failed_login_attempts = failed_login_attempts + 1,
          account_locked_until = CASE 
            WHEN failed_login_attempts >= 4 THEN CURRENT_TIMESTAMP + INTERVAL '30 minutes'
            ELSE account_locked_until
          END
      WHERE id = $1
      RETURNING failed_login_attempts
    `, [userId]);
    
    if (result.rows[0].failed_login_attempts >= 5) {
      logSecurityEvent('ACCOUNT_LOCKED', { userId });
    }
  } catch (error) {
    console.error('Error incrementing failed attempts:', error);
  }
}

function generateTempToken(userId) {
  return jwt.sign(
    { userId, temp: true },
    process.env.JWT_SECRET,
    { expiresIn: '5m' } // 5 minutes for MFA verification
  );
}

module.exports = router;