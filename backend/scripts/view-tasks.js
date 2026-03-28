const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function viewTasks() {
  try {
    console.log('📋 Viewing all tasks in the database...\n');
    
    // Get all tasks with user and tenant information
    const query = `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.due_date,
        t.tenant_id,
        t.created_by,
        t.created_at,
        t.updated_at,
        u.name as created_by_name,
        u.email as created_by_email
      FROM tasks t
      LEFT JOIN users u ON t.created_by = u.id
      ORDER BY t.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      console.log('❌ No tasks found in the database.');
    } else {
      console.log(`✅ Found ${result.rows.length} task(s):\n`);
      
      result.rows.forEach((task, index) => {
        console.log(`📝 Task #${index + 1}:`);
        console.log(`   ID: ${task.id}`);
        console.log(`   Title: ${task.title}`);
        console.log(`   Description: ${task.description || 'N/A'}`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Priority: ${task.priority}`);
        console.log(`   Due Date: ${task.due_date || 'Not set'}`);
        console.log(`   Tenant ID: ${task.tenant_id}`);
        console.log(`   Created By: ${task.created_by_name} (${task.created_by_email})`);
        console.log(`   Created At: ${task.created_at}`);
        console.log(`   Updated At: ${task.updated_at}`);
        console.log('   ' + '─'.repeat(50));
      });
    }
    
    // Also show task count by tenant
    console.log('\n📊 Task Summary by Tenant:');
    const summaryQuery = `
      SELECT 
        t.tenant_id,
        COUNT(*) as task_count,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_count
      FROM tasks t
      GROUP BY t.tenant_id
      ORDER BY t.tenant_id
    `;
    
    const summaryResult = await pool.query(summaryQuery);
    summaryResult.rows.forEach(row => {
      console.log(`   Tenant ${row.tenant_id}: ${row.task_count} tasks (${row.completed_count} completed, ${row.pending_count} pending, ${row.in_progress_count} in progress)`);
    });
    
  } catch (error) {
    console.error('❌ Error viewing tasks:', error);
  } finally {
    await pool.end();
  }
}

viewTasks();
