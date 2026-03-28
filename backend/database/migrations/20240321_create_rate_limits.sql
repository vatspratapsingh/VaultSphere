CREATE TABLE tenant_rate_limits (
  tenant_id SERIAL PRIMARY KEY,
  tier VARCHAR(50) DEFAULT 'basic', -- basic, standard, enterprise
  requests_per_hour INT,           -- Custom override for hour
  requests_per_minute INT,         -- Custom override for minute
  custom_overrides JSONB DEFAULT '{}', -- e.g., {"/api/tasks": 500}
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert demo data
INSERT INTO tenant_rate_limits (tenant_id, tier) VALUES (1, 'enterprise');
INSERT INTO tenant_rate_limits (tenant_id, tier) VALUES (2, 'standard');
