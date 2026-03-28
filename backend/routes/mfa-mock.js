const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { mockUsers } = require('./mock-data');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Get MFA status
router.get('/status', authenticateToken, (req, res) => {
  try {
    const user = mockUsers.find(u => u.id === req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ mfaEnabled: user.mfa_enabled || false });
  } catch (error) {
    console.error('Get MFA status error:', error);
    res.status(500).json({ error: 'Failed to get MFA status' });
  }
});

// Generate MFA secret and QR code
router.post('/setup', authenticateToken, async (req, res) => {
  try {
    const user = mockUsers.find(u => u.id === req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const secret = speakeasy.generateSecret({
      name: `VaultSphere (${user.email})`,
      issuer: 'VaultSphere',
      length: 32
    });
    
    // Store secret in memory
    user.mfa_secret = secret.base32;
    user.mfa_enabled = false;
    
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
});

// Verify MFA token and enable MFA
router.post('/enable', authenticateToken, (req, res) => {
  try {
    const { token } = req.body;
    const user = mockUsers.find(u => u.id === req.user.userId);
    
    if (!user || !user.mfa_secret) {
      return res.status(400).json({ error: 'MFA not set up for this user' });
    }
    
    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: token,
      window: 2
    });
    
    if (!verified) {
      return res.status(400).json({ error: 'Invalid MFA token' });
    }
    
    user.mfa_enabled = true;
    res.json({
      message: 'MFA enabled successfully',
      mfaEnabled: true
    });
  } catch (error) {
    console.error('Verify MFA error:', error);
    res.status(500).json({ error: 'Failed to verify MFA token' });
  }
});

// Disable MFA
router.post('/disable', authenticateToken, async (req, res) => {
  try {
    const { password, mfaToken } = req.body;
    const user = mockUsers.find(u => u.id === req.user.userId);
    
    if (!user || !user.mfa_enabled) {
      return res.status(400).json({ error: 'MFA is not enabled for this user' });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    
    // Verify MFA token
    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: mfaToken,
      window: 2
    });
    
    if (!verified) {
      return res.status(400).json({ error: 'Invalid MFA token' });
    }
    
    user.mfa_enabled = false;
    user.mfa_secret = null;
    
    res.json({
      message: 'MFA disabled successfully',
      mfaEnabled: false
    });
  } catch (error) {
    console.error('Disable MFA error:', error);
    res.status(500).json({ error: 'Failed to disable MFA' });
  }
});

module.exports = router;
