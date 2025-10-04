const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Creating database tables...');
    await db.query(schema);
    console.log('✅ Database tables created successfully');
    
    // Create initial admin tenant
    console.log('👑 Creating admin tenant...');
    const adminTenant = await db.query(
      'INSERT INTO tenants (name, domain, status) VALUES ($1, $2, $3) RETURNING *',
      ['VaultSphere Admin', 'admin.vaultsphere.com', 'active']
    );
    console.log('✅ Admin tenant created');
    
    // Create initial admin user
    console.log('👤 Creating admin user...');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await db.query(
      'INSERT INTO users (email, password, name, role, tenant_id) VALUES ($1, $2, $3, $4, $5)',
      ['admin@vaultsphere.com', hashedPassword, 'System Admin', 'admin', adminTenant.rows[0].id]
    );
    console.log('✅ Admin user created');
    
    // Create demo tenants
    console.log('🏢 Creating demo tenants...');
    const demoTenants = [
      ['Fresh Foods Inc', 'food.vaultsphere.com', 'active'],
      ['Tech Solutions Pro', 'tech.vaultsphere.com', 'active']
    ];
    
    for (const [name, domain, status] of demoTenants) {
      await db.query(
        'INSERT INTO tenants (name, domain, status) VALUES ($1, $2, $3)',
        [name, domain, status]
      );
    }
    console.log('✅ Demo tenants created');
    
    console.log('🎉 Database initialization completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();