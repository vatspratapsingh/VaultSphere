const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { mockUsers } = require('./mock-data');
const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    let isValidPassword = false;
    if (user.password_hash) {
      isValidPassword = await bcrypt.compare(password, user.password_hash);
    } else {
      // Fallback for when hashing hasn't finished in mock-data.js
      isValidPassword = password === user.password;
    }
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        company: user.company
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Signup endpoint (mock)
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, company, tenant_id } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Determine role based on tenant_id or company name
    let role = 'food'; // Default for mock
    if (tenant_id === 'it' || (company && company.toLowerCase().includes('it'))) {
      role = 'it';
    } else if (tenant_id === 'admin' || (name && name.toLowerCase().includes('admin'))) {
      role = 'admin';
    }

    // Create new user
    const newUser = {
      id: mockUsers.length + 1,
      name,
      email: email.toLowerCase(),
      password,
      password_hash: await bcrypt.hash(password, 10),
      role,
      company: company || tenant_id || 'Default Company'
    };

    mockUsers.push(newUser);

    // Generate JWT token for auto-login
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email, 
        role: newUser.role,
        company: newUser.company
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        company: newUser.company
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get current user
router.get('/me', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = mockUsers.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

module.exports = router;