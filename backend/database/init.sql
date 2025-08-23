-- Create database
CREATE DATABASE vaultsphere;

-- Connect to the database
\c vaultsphere;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'client',
    tenant_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tenants table
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tasks table for CRUD feature
CREATE TABLE tasks (
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

-- Insert sample tenants
INSERT INTO tenants (name, domain) VALUES 
('EatHealthy', 'eathealthy.com'),
('TechSolutions', 'techsolutions.com');

-- Insert sample users
INSERT INTO users (name, email, password_hash, role, tenant_id) VALUES 
('Admin User', 'admin@vaultsphere.com', '$2b$10$rQZ8K9vX8K9vX8K9vX8K9O', 'admin', 'admin'),
('John Doe', 'john@eathealthy.com', '$2b$10$rQZ8K9vX8K9vX8K9vX8K9O', 'client', 'eathealthy'),
('Jane Smith', 'jane@techsolutions.com', '$2b$10$rQZ8K9vX8K9vX8K9vX8K9O', 'client', 'techsolutions');

-- Insert sample tasks
INSERT INTO tasks (title, description, status, priority, tenant_id, created_by) VALUES 
('Review Menu Items', 'Check and update the restaurant menu for the new season', 'pending', 'high', 'eathealthy', 2),
('Update Website', 'Refresh the company website with new content', 'in_progress', 'medium', 'techsolutions', 3),
('Inventory Check', 'Conduct monthly inventory audit', 'completed', 'low', 'eathealthy', 2),
('Client Meeting', 'Prepare presentation for client meeting', 'pending', 'high', 'techsolutions', 3);
