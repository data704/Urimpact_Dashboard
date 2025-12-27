-- Users and User Analysis Assignments Schema
-- Allows admin to manage users and assign specific analyses to them

-- Table: users (for Majmaah dashboard authentication)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'client', -- 'admin', 'client'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: user_analysis_assignments (which analyses each user can see)
CREATE TABLE IF NOT EXISTS user_analysis_assignments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  analysis_id INTEGER REFERENCES analysis_results(id) ON DELETE CASCADE,
  assigned_by INTEGER REFERENCES users(id), -- Admin who assigned it
  assigned_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, analysis_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_assignments_user ON user_analysis_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assignments_analysis ON user_analysis_assignments(analysis_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Insert default admin user (password: admin123 - should be changed in production)
-- Password hash for 'admin123' using bcrypt (10 rounds)
INSERT INTO users (name, email, password_hash, role, is_active)
VALUES (
  'Admin User',
  'admin@urimpact.com',
  '$2b$10$TKkTfytvbLcza369MYiCFuzXqRZLTYUOjzm0ugXxrGXZZu/Z0dRs2',
  'admin',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Comments
COMMENT ON TABLE users IS 'Users who can access the Majmaah dashboard';
COMMENT ON TABLE user_analysis_assignments IS 'Assignments of analyses to specific users';

