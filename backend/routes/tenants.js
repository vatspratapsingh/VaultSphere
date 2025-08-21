const express = require('express');
const db = require('../config/database');

const router = express.Router();

// Get all tenants
router.get('/', async (req, res) => {
  try {
    const tenants = await db.query(`
      SELECT t.*, COUNT(u.id) as user_count 
      FROM tenants t 
      LEFT JOIN users u ON t.id = u.tenant_id 
      GROUP BY t.id 
      ORDER BY t.created_at DESC
    `);
    
    res.json(tenants.rows);
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tenant by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await db.query(`
      SELECT t.*, COUNT(u.id) as user_count 
      FROM tenants t 
      LEFT JOIN users u ON t.id = u.tenant_id 
      WHERE t.id = $1 
      GROUP BY t.id
    `, [id]);
    
    if (tenant.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    res.json(tenant.rows[0]);
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new tenant
router.post('/', async (req, res) => {
  try {
    const { name, domain, status } = req.body;
    
    // Check if tenant with same domain already exists
    if (domain) {
      const existingTenant = await db.query('SELECT * FROM tenants WHERE domain = $1', [domain]);
      if (existingTenant.rows.length > 0) {
        return res.status(400).json({ error: 'Tenant with this domain already exists' });
      }
    }
    
    // Create tenant
    const newTenant = await db.query(
      'INSERT INTO tenants (name, domain, status) VALUES ($1, $2, $3) RETURNING *',
      [name, domain, status || 'active']
    );
    
    res.status(201).json({
      message: 'Tenant created successfully',
      tenant: newTenant.rows[0]
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update tenant
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, domain, status } = req.body;
    
    // Check if domain is being changed and if it conflicts
    if (domain) {
      const existingTenant = await db.query('SELECT * FROM tenants WHERE domain = $1 AND id != $2', [domain, id]);
      if (existingTenant.rows.length > 0) {
        return res.status(400).json({ error: 'Tenant with this domain already exists' });
      }
    }
    
    const updatedTenant = await db.query(
      'UPDATE tenants SET name = $1, domain = $2, status = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, domain, status, id]
    );
    
    if (updatedTenant.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    res.json({
      message: 'Tenant updated successfully',
      tenant: updatedTenant.rows[0]
    });
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete tenant
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if tenant has users
    const users = await db.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [id]);
    if (parseInt(users.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete tenant with existing users' });
    }
    
    const deletedTenant = await db.query('DELETE FROM tenants WHERE id = $1 RETURNING id', [id]);
    
    if (deletedTenant.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get users for a specific tenant
router.get('/:id/users', async (req, res) => {
  try {
    const { id } = req.params;
    const users = await db.query(
      'SELECT id, email, name, role, created_at FROM users WHERE tenant_id = $1 ORDER BY created_at DESC',
      [id]
    );
    
    res.json(users.rows);
  } catch (error) {
    console.error('Get tenant users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;