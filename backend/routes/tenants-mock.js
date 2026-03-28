const express = require('express');
const { mockTenants } = require('./mock-data');
const router = express.Router();

// Get all tenants
router.get('/', (req, res) => {
  res.json(mockTenants);
});

// Get tenant by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const tenant = mockTenants.find(t => t.id === parseInt(id));
  
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  
  res.json(tenant);
});

// Create new tenant
router.post('/', (req, res) => {
  const { name, type, status } = req.body;
  
  const newTenant = {
    id: mockTenants.length,
    name,
    type: type || 'client',
    status: status || 'active',
    user_count: 0,
    created_at: new Date().toISOString()
  };
  
  mockTenants.push(newTenant);
  res.status(201).json({
    message: 'Tenant created successfully',
    tenant: newTenant
  });
});

module.exports = router;
