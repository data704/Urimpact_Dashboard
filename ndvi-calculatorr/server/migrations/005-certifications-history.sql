-- Certifications History Schema
-- Tracks all certificates awarded to departments or employees

-- Table: certifications_history
CREATE TABLE IF NOT EXISTS certifications_history (
  id SERIAL PRIMARY KEY,
  certification_id VARCHAR(100) UNIQUE NOT NULL,
  certificate_type VARCHAR(50) NOT NULL DEFAULT 'trees', -- 'trees', 'basic', etc.
  receiving_party_type VARCHAR(20) NOT NULL CHECK (receiving_party_type IN ('department', 'employee')),
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  awarded_to_name VARCHAR(255) NOT NULL, -- Store name for historical record
  trees_count INTEGER DEFAULT 0,
  carbon_sequestered NUMERIC(10, 2) DEFAULT 0,
  date_awarded TIMESTAMP DEFAULT NOW(),
  issued_by INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT check_receiving_party CHECK (
    (receiving_party_type = 'department' AND department_id IS NOT NULL AND employee_id IS NULL) OR
    (receiving_party_type = 'employee' AND employee_id IS NOT NULL AND department_id IS NULL)
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_certifications_date ON certifications_history(date_awarded DESC);
CREATE INDEX IF NOT EXISTS idx_certifications_type ON certifications_history(certificate_type);
CREATE INDEX IF NOT EXISTS idx_certifications_department ON certifications_history(department_id);
CREATE INDEX IF NOT EXISTS idx_certifications_employee ON certifications_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_certifications_id ON certifications_history(certification_id);

-- Function to generate certification ID
CREATE OR REPLACE FUNCTION generate_certification_id()
RETURNS VARCHAR AS $$
BEGIN
  RETURN 'CERT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('certifications_history_id_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE certifications_history IS 'History of all certificates awarded to departments or employees';
