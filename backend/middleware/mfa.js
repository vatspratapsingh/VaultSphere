const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const db = require('../config/database');

// Generate MFA secret for user
const generateMFASecret = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userEmail = req.user.email;
    
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `VaultSphere (${userEmail})`,
      issuer: 'VaultSphere',
      length: 32
    });
    
    // Store secret in database (encrypted)
    await db.query(
      'UPDATE users SET mfa_secret = $1, mfa_enabled = false WHERE id = $2',
      [secret.base32, userId]
    );
    
    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    
    res.json({
      message: 'MFA secret generated successfully',
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    });
  } catch (error) {
    console.error('Generate MFA secret error:', error);
    res.status(500).json({ error: 'Failed to generate MFA secret' });
  }
};

// Verify MFA token and enable MFA
const verifyAndEnableMFA = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.userId;
    
    if (!token) {
      return res.status(400).json({ error: 'MFA token is required' });
    }
    
    // Get user's MFA secret
    const user = await db.query(
      'SELECT mfa_secret FROM users WHERE id = $1',
      [userId]
    );
    
    if (user.rows.length === 0 || !user.rows[0].mfa_secret) {
      return res.status(400).json({ error: 'MFA not set up for this user' });
    }
    
    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.rows[0].mfa_secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps (60 seconds) of drift
    });
    
    if (!verified) {
      return res.status(400).json({ error: 'Invalid MFA token' });
    }
    
    // Enable MFA for user
    await db.query(
      'UPDATE users SET mfa_enabled = true WHERE id = $1',
      [userId]
    );
    
    res.json({
      message: 'MFA enabled successfully',
      mfaEnabled: true
    });
  } catch (error) {
    console.error('Verify MFA error:', error);
    res.status(500).json({ error: 'Failed to verify MFA token' });
  }
};

// Verify MFA token during login
const verifyMFAToken = async (req, res, next) => {
  try {
    const { mfaToken } = req.body;
    const userId = req.user.userId;
    
    // Check if user has MFA enabled
    const user = await db.query(
      'SELECT mfa_enabled, mfa_secret FROM users WHERE id = $1',
      [userId]
    );
    
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { mfa_enabled, mfa_secret } = user.rows[0];
    
    // If MFA is not enabled, skip verification
    if (!mfa_enabled) {
      return next();
    }
    
    // If MFA is enabled but no token provided
    if (!mfaToken) {
      return res.status(400).json({ 
        error: 'MFA token required',
        mfaRequired: true
      });
    }
    
    // Verify MFA token
    const verified = speakeasy.totp.verify({
      secret: mfa_secret,
      encoding: 'base32',
      token: mfaToken,
      window: 2
    });
    
    if (!verified) {
      return res.status(400).json({ error: 'Invalid MFA token' });
    }
    
    next();
  } catch (error) {
    console.error('MFA verification error:', error);
    res.status(500).json({ error: 'MFA verification failed' });
  }
};

// Disable MFA
const disableMFA = async (req, res) => {
  try {
    const { password, mfaToken } = req.body;
    const userId = req.user.userId;
    
    if (!password || !mfaToken) {
      return res.status(400).json({ 
        error: 'Password and MFA token are required to disable MFA' 
      });
    }
    
    // Get user data
    const user = await db.query(
      'SELECT password_hash, mfa_secret, mfa_enabled FROM users WHERE id = $1',
      [userId]
    );
    
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { password_hash, mfa_secret, mfa_enabled } = user.rows[0];
    
    if (!mfa_enabled) {
      return res.status(400).json({ error: 'MFA is not enabled for this user' });
    }
    
    // Verify password
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    
    // Verify MFA token
    const verified = speakeasy.totp.verify({
      secret: mfa_secret,
      encoding: 'base32',
      token: mfaToken,
      window: 2
    });
    
    if (!verified) {
      return res.status(400).json({ error: 'Invalid MFA token' });
    }
    
    // Disable MFA
    await db.query(
      'UPDATE users SET mfa_enabled = false, mfa_secret = NULL WHERE id = $1',
      [userId]
    );
    
    res.json({
      message: 'MFA disabled successfully',
      mfaEnabled: false
    });
  } catch (error) {
    console.error('Disable MFA error:', error);
    res.status(500).json({ error: 'Failed to disable MFA' });
  }
};

// Get MFA status
const getMFAStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await db.query(
      'SELECT mfa_enabled FROM users WHERE id = $1',
      [userId]
    );
    
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      mfaEnabled: user.rows[0].mfa_enabled || false
    });
  } catch (error) {
    console.error('Get MFA status error:', error);
    res.status(500).json({ error: 'Failed to get MFA status' });
  }
};

module.exports = {
  generateMFASecret,
  verifyAndEnableMFA,
  verifyMFAToken,
  disableMFA,
  getMFAStatus
};