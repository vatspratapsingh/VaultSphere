const express = require('express');
const { mockUsers, mockTenants } = require('./mock-data');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Get all users (admin only)
router.get('/', (req, res) => {
  try {
    const usersWithTenant = mockUsers.map(user => {
      const tenant = mockTenants.find(t => t.id === user.tenant_id);
      return {
        ...user,
        tenant_name: tenant ? tenant.name : 'Unknown'
      };
    });
    
    // Remove sensitive data
    const safeUsers = usersWithTenant.map(({ password, password_hash, mfa_secret, ...u }) => u);
    res.json(safeUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = mockUsers.find(u => u.id === parseInt(id));
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const tenant = mockTenants.find(t => t.id === user.tenant_id);
    const { password, password_hash, mfa_secret, ...safeUser } = user;
    
    res.json({
      ...safeUser,
      tenant_name: tenant ? tenant.name : 'Unknown'
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    const { email, password, name, role, tenant_id } = req.body;
    
    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = {
      id: mockUsers.length + 1,
      email: email.toLowerCase(),
      password,
      password_hash: hashedPassword,
      name,
      role: role || 'food',
      tenant_id: tenant_id || 1,
      mfa_enabled: false,
      mfa_secret: null,
      created_at: new Date().toISOString()
    };
    
    mockUsers.push(newUser);
    
    const { password: p, password_hash: ph, mfa_secret: ms, ...safeUser } = newUser;
    res.status(201).json({
      message: 'User created successfully',
      user: safeUser
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, role, tenant_id } = req.body;
    
    const userIndex = mockUsers.findIndex(u => u.id === parseInt(id));
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      email: email ? email.toLowerCase() : mockUsers[userIndex].email,
      name: name || mockUsers[userIndex].name,
      role: role || mockUsers[userIndex].role,
      tenant_id: tenant_id !== undefined ? tenant_id : mockUsers[userIndex].tenant_id,
      updated_at: new Date().toISOString()
    };
    
    const { password, password_hash, mfa_secret, ...safeUser } = mockUsers[userIndex];
    res.json({
      message: 'User updated successfully',
      user: safeUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const userIndex = mockUsers.findIndex(u => u.id === parseInt(id));
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    mockUsers.splice(userIndex, 1);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
