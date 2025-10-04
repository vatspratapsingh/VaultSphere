const db = require('../config/database');

async function addMFASupport() {
  try {
    console.log('Adding MFA support to users table...');
    
    // Add MFA columns to users table
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS mfa_secret TEXT,
      ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
      ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP,
      ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    
    console.log('✅ MFA columns added successfully');
    
    // Create security_events table for logging
    await db.query(`
      CREATE TABLE IF NOT EXISTS security_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        event_type VARCHAR(50) NOT NULL,
        event_description TEXT,
        ip_address INET,
        user_agent TEXT,
        success BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Security events table created successfully');
    
    // Create login_attempts table for rate limiting
    await db.query(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id SERIAL PRIMARY KEY,
        ip_address INET NOT NULL,
        email VARCHAR(255),
        attempts INTEGER DEFAULT 1,
        last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        blocked_until TIMESTAMP
      )
    `);
    
    console.log('✅ Login attempts table created successfully');
    
    // Create sessions table for session management
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        session_token VARCHAR(255) UNIQUE NOT NULL,
        ip_address INET,
        user_agent TEXT,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ User sessions table created successfully');
    
    // Add indexes for performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
      CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
      CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
    `);
    
    console.log('✅ Indexes created successfully');
    
    console.log('🎉 MFA support setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up MFA support:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  addMFASupport()
    .then(() => {
      console.log('MFA setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('MFA setup failed:', error);
      process.exit(1);
    });
}

module.exports = addMFASupport;