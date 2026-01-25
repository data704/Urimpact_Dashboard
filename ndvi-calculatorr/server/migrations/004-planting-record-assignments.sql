-- Planting Record Assignments Schema
-- Allows assigning planting records (analyses) to departments or employees

-- Table: planting_record_assignments
CREATE TABLE IF NOT EXISTS planting_record_assignments (
  id SERIAL PRIMARY KEY,
  analysis_id INTEGER REFERENCES analysis_results(id) ON DELETE CASCADE,
  assign_to_type VARCHAR(20) NOT NULL CHECK (assign_to_type IN ('department', 'employee')),
  department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  trees_assigned INTEGER NOT NULL DEFAULT 0,
  assigned_carbon_emission NUMERIC(10, 2) DEFAULT 0,
  planting_type VARCHAR(100),
  notes TEXT,
  assigned_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT check_assign_to CHECK (
    (assign_to_type = 'department' AND department_id IS NOT NULL AND employee_id IS NULL) OR
    (assign_to_type = 'employee' AND employee_id IS NOT NULL AND department_id IS NULL)
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignments_analysis ON planting_record_assignments(analysis_id);
CREATE INDEX IF NOT EXISTS idx_assignments_department ON planting_record_assignments(department_id);
CREATE INDEX IF NOT EXISTS idx_assignments_employee ON planting_record_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_assignments_type ON planting_record_assignments(assign_to_type);
CREATE INDEX IF NOT EXISTS idx_assignments_created ON planting_record_assignments(created_at DESC);

-- Function to calculate assigned carbon emission based on trees assigned
CREATE OR REPLACE FUNCTION calculate_assigned_carbon(
  p_analysis_id INTEGER,
  p_trees_assigned INTEGER
)
RETURNS NUMERIC AS $$
DECLARE
  v_total_trees INTEGER;
  v_total_carbon NUMERIC;
  v_carbon_per_tree NUMERIC;
BEGIN
  -- Get total trees and carbon from analysis
  SELECT tree_count, COALESCE(co2_equivalent_tonnes, 0)
  INTO v_total_trees, v_total_carbon
  FROM analysis_results
  WHERE id = p_analysis_id;

  -- If no trees in analysis, return 0
  IF v_total_trees = 0 OR v_total_trees IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate carbon per tree and multiply by assigned trees
  v_carbon_per_tree := v_total_carbon / v_total_trees;
  RETURN ROUND((v_carbon_per_tree * p_trees_assigned)::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate assigned carbon emission
CREATE OR REPLACE FUNCTION update_assigned_carbon()
RETURNS TRIGGER AS $$
BEGIN
  NEW.assigned_carbon_emission := calculate_assigned_carbon(NEW.analysis_id, NEW.trees_assigned);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_assigned_carbon
BEFORE INSERT OR UPDATE ON planting_record_assignments
FOR EACH ROW
EXECUTE FUNCTION update_assigned_carbon();

-- Comments
COMMENT ON TABLE planting_record_assignments IS 'Assignments of planting records (analyses) to departments or employees';
COMMENT ON FUNCTION calculate_assigned_carbon IS 'Calculates carbon emission based on number of trees assigned from an analysis';
