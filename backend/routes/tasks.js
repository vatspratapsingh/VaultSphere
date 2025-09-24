const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/tasks - Get all tasks for the authenticated user's tenant
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    
    // Map user role to tenant type
    let tenantType;
    if (userRole === 'admin') {
      tenantType = 'admin';
    } else if (userRole === 'food') {
      tenantType = 'food';
    } else if (userRole === 'it') {
      tenantType = 'it';
    } else {
      return res.status(400).json({ error: 'Invalid user role' });
    }
    
    // Get tenant ID based on type
    const tenantQuery = 'SELECT id FROM tenants WHERE type = $1';
    const tenantResult = await db.query(tenantQuery, [tenantType]);
    
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const tenantId = tenantResult.rows[0].id;
    
    const query = `
      SELECT t.*, u.name as created_by_name 
      FROM tasks t 
      LEFT JOIN users u ON t.created_by = u.id 
      WHERE t.tenant_id = $1 
      ORDER BY t.created_at DESC
    `;
    
    const result = await db.query(query, [tenantId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tasks/:id - Get a specific task
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    
    // Map user role to tenant type
    let tenantType;
    if (userRole === 'admin') {
      tenantType = 'admin';
    } else if (userRole === 'food') {
      tenantType = 'food';
    } else if (userRole === 'it') {
      tenantType = 'it';
    } else {
      return res.status(400).json({ error: 'Invalid user role' });
    }
    
    // Get tenant ID based on type
    const tenantQuery = 'SELECT id FROM tenants WHERE type = $1';
    const tenantResult = await db.query(tenantQuery, [tenantType]);
    
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const tenantId = tenantResult.rows[0].id;
    
    const query = `
      SELECT t.*, u.name as created_by_name 
      FROM tasks t 
      LEFT JOIN users u ON t.created_by = u.id 
      WHERE t.id = $1 AND t.tenant_id = $2
    `;
    
    const result = await db.query(query, [id, tenantId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tasks - Create a new task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, status, priority, due_date } = req.body;
    const userRole = req.user.role;
    const createdBy = req.user.userId;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    // Map user role to tenant type
    let tenantType;
    if (userRole === 'admin') {
      tenantType = 'admin';
    } else if (userRole === 'food') {
      tenantType = 'food';
    } else if (userRole === 'it') {
      tenantType = 'it';
    } else {
      return res.status(400).json({ error: 'Invalid user role' });
    }
    
    // Get tenant ID based on type
    const tenantQuery = 'SELECT id FROM tenants WHERE type = $1';
    const tenantResult = await db.query(tenantQuery, [tenantType]);
    
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const tenantId = tenantResult.rows[0].id;
    
    const query = `
      INSERT INTO tasks (title, description, status, priority, due_date, tenant_id, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    // Handle empty due_date - convert empty string to null
    const processedDueDate = due_date && due_date.trim() !== '' ? due_date : null;
    const values = [title, description, status || 'pending', priority || 'medium', processedDueDate, tenantId, createdBy];
    const result = await db.query(query, values);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tasks/:id - Update a task
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, due_date } = req.body;
    const userRole = req.user.role;
    
    // Map user role to tenant type
    let tenantType;
    if (userRole === 'admin') {
      tenantType = 'admin';
    } else if (userRole === 'food') {
      tenantType = 'food';
    } else if (userRole === 'it') {
      tenantType = 'it';
    } else {
      return res.status(400).json({ error: 'Invalid user role' });
    }
    
    // Get tenant ID based on type
    const tenantQuery = 'SELECT id FROM tenants WHERE type = $1';
    const tenantResult = await db.query(tenantQuery, [tenantType]);
    
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const tenantId = tenantResult.rows[0].id;
    
    // First check if task exists and belongs to user's tenant
    const checkQuery = 'SELECT id FROM tasks WHERE id = $1 AND tenant_id = $2';
    const checkResult = await db.query(checkQuery, [id, tenantId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const query = `
      UPDATE tasks 
      SET title = $1, description = $2, status = $3, priority = $4, due_date = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 AND tenant_id = $7
      RETURNING *
    `;
    
    // Handle empty due_date - convert empty string to null
    const processedDueDate = due_date && due_date.trim() !== '' ? due_date : null;
    const values = [title, description, status, priority, processedDueDate, id, tenantId];
    const result = await db.query(query, values);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    
    // Map user role to tenant type
    let tenantType;
    if (userRole === 'admin') {
      tenantType = 'admin';
    } else if (userRole === 'food') {
      tenantType = 'food';
    } else if (userRole === 'it') {
      tenantType = 'it';
    } else {
      return res.status(400).json({ error: 'Invalid user role' });
    }
    
    // Get tenant ID based on type
    const tenantQuery = 'SELECT id FROM tenants WHERE type = $1';
    const tenantResult = await db.query(tenantQuery, [tenantType]);
    
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const tenantId = tenantResult.rows[0].id;
    
    const query = 'DELETE FROM tasks WHERE id = $1 AND tenant_id = $2 RETURNING *';
    const result = await db.query(query, [id, tenantId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
