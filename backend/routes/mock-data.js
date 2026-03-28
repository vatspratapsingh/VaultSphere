const bcrypt = require('bcryptjs');

// Mock tenants
const mockTenants = [
  { id: 0, name: 'VaultSphere Admin', type: 'admin', status: 'active', user_count: 1, created_at: new Date().toISOString() },
  { id: 1, name: 'Healthy Foods Inc.', type: 'food', status: 'active', user_count: 2, created_at: new Date().toISOString() },
  { id: 2, name: 'Tech Solutions Ltd.', type: 'it', status: 'active', user_count: 1, created_at: new Date().toISOString() }
];

// Mock users for testing
const mockUsers = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@vaultsphere.com',
    password: 'admin123',
    role: 'admin',
    company: 'VaultSphere Admin',
    tenant_id: 0,
    mfa_enabled: false,
    mfa_secret: null,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Food Company User',
    email: 'food@vaultsphere.com',
    password: 'food123',
    role: 'food',
    company: 'Healthy Foods Inc.',
    tenant_id: 1,
    mfa_enabled: false,
    mfa_secret: null,
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    name: 'IT Company User',
    email: 'it@vaultsphere.com',
    password: 'it123',
    role: 'it',
    company: 'Tech Solutions Ltd.',
    tenant_id: 2,
    mfa_enabled: false,
    mfa_secret: null,
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    name: 'Test User',
    email: 'eathealthy@gmail.com',
    password: 'food123',
    role: 'food',
    company: 'Test Company',
    tenant_id: 1,
    mfa_enabled: false,
    mfa_secret: null,
    created_at: new Date().toISOString()
  }
];

// Mock tasks
const mockTasks = [
  {
    id: 1,
    title: 'Security Audit',
    description: 'Perform a full security audit of the backend API',
    status: 'pending',
    priority: 'high',
    tenant_id: 2,
    created_by: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Inventory Check',
    description: 'Check food inventory levels for the upcoming week',
    status: 'completed',
    priority: 'medium',
    tenant_id: 1,
    created_by: 2,
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    title: 'System Maintenance',
    description: 'Scheduled maintenance for the primary database',
    status: 'in-progress',
    priority: 'high',
    tenant_id: 0,
    created_by: 1,
    created_at: new Date().toISOString()
  }
];

// Initialize password hashes
const initializeHashes = async () => {
  for (let user of mockUsers) {
    if (!user.password_hash) {
      user.password_hash = await bcrypt.hash(user.password, 10);
    }
  }
};

initializeHashes();

module.exports = {
  mockUsers,
  mockTenants,
  mockTasks,
  initializeHashes
};
