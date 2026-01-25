-- Departments and Employees Schema
-- Allows managing departments and employees in the Majmaah dashboard

-- Table: departments
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name_english VARCHAR(255) NOT NULL,
  name_arabic VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: employees
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_departments_name_english ON departments(name_english);

-- Function to count employees in a department
CREATE OR REPLACE FUNCTION get_department_employee_count(dept_id INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM employees WHERE department_id = dept_id);
END;
$$ LANGUAGE plpgsql;

-- Function to count trees planted by department (placeholder for future integration)
CREATE OR REPLACE FUNCTION get_department_trees_planted(dept_id INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- This is a placeholder - can be integrated with analysis_results later
  RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE departments IS 'Departments in the Majmaah organization';
COMMENT ON TABLE employees IS 'Employees assigned to departments';
