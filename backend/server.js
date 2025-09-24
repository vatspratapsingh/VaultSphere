const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://vaultsphere-frontend-2024-vats.s3-website.eu-north-1.amazonaws.com',
    'https://vaultsphere-frontend-2024-vats.s3-website.eu-north-1.amazonaws.com'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const tenantRoutes = require('./routes/tenants');
const taskRoutes = require('./routes/tasks');

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: 'VaultSphere Backend API',
    status: 'running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Connect routes to app
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/tasks', taskRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 VaultSphere Backend Server running on port ${PORT}`);
  console.log(`�� Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
  console.log(`👥 User routes: http://localhost:${PORT}/api/users`);
  console.log(`🏢 Tenant routes: http://localhost:${PORT}/api/tenants`);
  console.log(`📋 Task routes: http://localhost:${PORT}/api/tasks`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;