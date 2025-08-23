const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function addTasksTable() {
  try {
    console.log('🚀 Adding tasks table to database...');
    
    // Create tasks table
    const createTasksTableQuery = `
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(20) DEFAULT 'medium',
        due_date DATE,
        tenant_id VARCHAR(255) NOT NULL,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await pool.query(createTasksTableQuery);
    console.log('✅ Tasks table created successfully');
    
    // Insert sample tasks
    const insertSampleTasksQuery = `
      INSERT INTO tasks (title, description, status, priority, tenant_id, created_by) VALUES 
      ('Review Menu Items', 'Check and update the restaurant menu for the new season', 'pending', 'high', 'eathealthy', 2),
      ('Update Website', 'Refresh the company website with new content', 'in_progress', 'medium', 'techsolutions', 3),
      ('Inventory Check', 'Conduct monthly inventory audit', 'completed', 'low', 'eathealthy', 2),
      ('Client Meeting', 'Prepare presentation for client meeting', 'pending', 'high', 'techsolutions', 3)
      ON CONFLICT DO NOTHING;
    `;
    
    await pool.query(insertSampleTasksQuery);
    console.log('✅ Sample tasks inserted successfully');
    
    console.log('🎉 Tasks table setup completed!');
  } catch (error) {
    console.error('❌ Error adding tasks table:', error);
  } finally {
    await pool.end();
  }
}

addTasksTable();
