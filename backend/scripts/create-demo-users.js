const db = require('../config/database');
const bcrypt = require('bcryptjs');

async function createDemoUsers() {
  try {
    console.log('🚀 Creating demo users...');
    
    // Get tenant IDs
    const foodTenant = await db.query('SELECT id FROM tenants WHERE name = $1', ['Fresh Foods Inc']);
    const techTenant = await db.query('SELECT id FROM tenants WHERE name = $1', ['Tech Solutions Pro']);
    
    if (foodTenant.rows.length === 0 || techTenant.rows.length === 0) {
      console.error('❌ Demo tenants not found. Please run npm run init-db first.');
      process.exit(1);
    }
    
    // Create demo users
    const demoUsers = [
      {
        email: 'eathealthy@gmail.com',
        password: 'food123',
        name: 'Food Company Manager',
        role: 'food',
        tenant_id: foodTenant.rows[0].id
      },
      {
        email: 'techsolutions@gmail.com',
        password: 'tech123',
        name: 'IT Solutions Manager',
        role: 'it',
        tenant_id: techTenant.rows[0].id
      }
    ];
    
    for (const user of demoUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      await db.query(
        'INSERT INTO users (email, password, name, role, tenant_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING',
        [user.email, hashedPassword, user.name, user.role, user.tenant_id]
      );
      
      console.log(`✅ Created user: ${user.email} (password: ${user.password})`);
    }
    
    console.log('🎉 Demo users created successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Failed to create demo users:', error);
    process.exit(1);
  }
}

createDemoUsers();
