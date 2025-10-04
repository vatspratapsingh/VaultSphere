require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./config/database');

const testAccounts = [
  {
    name: 'Admin Test User',
    email: 'admin@test.com',
    password: 'test123',
    role: 'admin',
    company: 'VaultSphere Admin'
  },
  {
    name: 'EatHealthy Test User',
    email: 'eathealthy@test.com',
    password: 'test123',
    role: 'food',
    company: 'EatHealthy Foods Inc.'
  },
  {
    name: 'Tech Demo User',
    email: 'tech@test.com',
    password: 'test123',
    role: 'it',
    company: 'Tech Solutions Demo'
  }
];

async function createTestAccounts() {
  try {
    console.log('🚀 Creating test accounts for CI/CD pipeline...');
    
    for (const user of testAccounts) {
      // Check if user already exists
      const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [user.email]);
      
      if (existingUser.rows.length > 0) {
        console.log(`⚠️  Test user ${user.email} already exists, updating...`);
        
        // Update existing user
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await db.query(
          'UPDATE users SET name = $1, password_hash = $2, role = $3, company = $4 WHERE email = $5',
          [user.name, hashedPassword, user.role, user.company, user.email]
        );
        console.log(`✅ Updated test user: ${user.name} (${user.email})`);
      } else {
        // Create new user
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const newUser = await db.query(
          'INSERT INTO users (name, email, password_hash, role, company) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, company',
          [user.name, user.email, hashedPassword, user.role, user.company]
        );
        console.log(`✅ Created test user: ${user.name} (${user.email})`);
      }
    }
    
    console.log('\n🎉 Test accounts created successfully!');
    console.log('\n📋 Test Credentials for CI/CD Pipeline:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    testAccounts.forEach(user => {
      console.log(`👤 ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Company: ${user.company}`);
      console.log('');
    });
    
    console.log('🌐 Test Login URLs:');
    console.log('   Admin Dashboard: http://localhost:3000/admin');
    console.log('   Food Dashboard: http://localhost:3000/food-company');
    console.log('   IT Dashboard: http://localhost:3000/it-company');
    console.log('');
    console.log('🔧 CI/CD Pipeline Test:');
    console.log('   These accounts can be used to test the CI/CD pipeline');
    console.log('   and verify that all dashboards work correctly.');
    
  } catch (error) {
    console.error('❌ Error creating test accounts:', error);
  } finally {
    process.exit(0);
  }
}

createTestAccounts();
