require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./config/database');

const demoUsers = [
  {
    name: 'Admin User',
    email: 'admin@vaultsphere.com',
    password: 'admin123',
    role: 'admin',
    company: 'VaultSphere Admin'
  },
  {
    name: 'Food Company User',
    email: 'food@vaultsphere.com',
    password: 'food123',
    role: 'client',
    company: 'Healthy Foods Inc.'
  },
  {
    name: 'IT Company User',
    email: 'it@vaultsphere.com',
    password: 'it123',
    role: 'client',
    company: 'Tech Solutions Ltd.'
  },
  {
    name: 'Test User',
    email: 'eathealthy@gmail.com',
    password: 'food123',
    role: 'client',
    company: 'Test Company'
  }
];

async function createDemoUsers() {
  try {
    console.log('🚀 Creating demo users...');
    
    for (const user of demoUsers) {
      // Check if user already exists
      const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [user.email]);
      
      if (existingUser.rows.length > 0) {
        // Update existing user's password and role
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await db.query(
          'UPDATE users SET password_hash = $1, role = $2, company = $3 WHERE email = $4',
          [hashedPassword, user.role, user.company, user.email]
        );
        console.log(`🔄 Updated user: ${user.name} (${user.email})`);
        continue;
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      // Create user
      const newUser = await db.query(
        'INSERT INTO users (name, email, password_hash, role, company) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, company',
        [user.name, user.email, hashedPassword, user.role, user.company]
      );
      
      console.log(`✅ Created user: ${user.name} (${user.email})`);
    }
    
    console.log('\n🎉 Demo users created successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    demoUsers.forEach(user => {
      console.log(`👤 ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Company: ${user.company}`);
      console.log('');
    });
    
    console.log('🌐 Login at: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Error creating demo users:', error);
  } finally {
    process.exit(0);
  }
}

createDemoUsers();
