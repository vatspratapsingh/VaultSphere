const express = require('express');
const { mockTasks } = require('./mock-data');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Map user role to tenant ID for mock purposes
const getMockTenantId = (role) => {
  if (role === 'admin') return 0;
  if (role === 'food') return 1;
  if (role === 'it') return 2;
  return -1;
};

// GET /api/tasks - Get all tasks for the authenticated user's tenant
router.get('/', authenticateToken, (req, res) => {
  const tenantId = getMockTenantId(req.user.role);
  
  if (tenantId === -1) {
    return res.status(400).json({ error: 'Invalid user role' });
  }
  
  const tasks = mockTasks.filter(t => t.tenant_id === tenantId);
  res.json(tasks);
});

// GET /api/tasks/:id - Get a specific task
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const tenantId = getMockTenantId(req.user.role);
  
  const task = mockTasks.find(t => t.id === parseInt(id) && t.tenant_id === tenantId);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  res.json(task);
});

// POST /api/tasks - Create a new task
router.post('/', authenticateToken, (req, res) => {
  const { title, description, status, priority, due_date } = req.body;
  const tenantId = getMockTenantId(req.user.role);
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  if (tenantId === -1) {
    return res.status(400).json({ error: 'Invalid user role' });
  }
  
  const newTask = {
    id: mockTasks.length + 1,
    title,
    description,
    status: status || 'pending',
    priority: priority || 'medium',
    due_date,
    tenant_id: tenantId,
    created_by: req.user.userId,
    created_at: new Date().toISOString()
  };
  
  mockTasks.push(newTask);
  res.status(201).json(newTask);
});

// PUT /api/tasks/:id - Update a task
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, due_date } = req.body;
  const tenantId = getMockTenantId(req.user.role);
  
  const taskIndex = mockTasks.findIndex(t => t.id === parseInt(id) && t.tenant_id === tenantId);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  const updatedTask = {
    ...mockTasks[taskIndex],
    title: title || mockTasks[taskIndex].title,
    description: description || mockTasks[taskIndex].description,
    status: status || mockTasks[taskIndex].status,
    priority: priority || mockTasks[taskIndex].priority,
    due_date: due_date || mockTasks[taskIndex].due_date,
    updated_at: new Date().toISOString()
  };
  
  mockTasks[taskIndex] = updatedTask;
  res.json(updatedTask);
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const tenantId = getMockTenantId(req.user.role);
  
  const taskIndex = mockTasks.findIndex(t => t.id === parseInt(id) && t.tenant_id === tenantId);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  mockTasks.splice(taskIndex, 1);
  res.json({ message: 'Task deleted successfully' });
});

module.exports = router;
