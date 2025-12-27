-- NDVI + Majmaah Integration Database Schema
-- Complete schema for storing GEE analysis results and Majmaah dashboard data

-- Table 1: Projects (Majmaah University projects)
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255),
  location_name VARCHAR(255),
  coordinates JSONB,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table 2: Analysis Results (All GEE analysis data)
CREATE TABLE IF NOT EXISTS analysis_results (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  analysis_type VARCHAR(50) NOT NULL, -- 'baseline', 'ndvi', 'agc', 'soc', 'mhi'
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  coordinates JSONB NOT NULL,
  
  -- Site Definition
  total_area_ha NUMERIC(10, 2),
  candidate_area_ha NUMERIC(10, 2),
  candidate_area_percent NUMERIC(5, 2),
  constraint_area_ha NUMERIC(10, 2),
  constraint_area_percent NUMERIC(5, 2),
  
  -- Vegetation Metrics
  tree_count INTEGER DEFAULT 0,
  canopy_cover_percent NUMERIC(5, 2) DEFAULT 0,
  average_health_score NUMERIC(3, 2),
  ndvi_mean NUMERIC(5, 3),
  ndvi_min NUMERIC(5, 3),
  ndvi_max NUMERIC(5, 3),
  evi_mean NUMERIC(5, 3),
  evi_min NUMERIC(5, 3),
  evi_max NUMERIC(5, 3),
  
  -- Biomass & Carbon Metrics
  total_agb_kg NUMERIC(12, 2),
  total_agb_tonnes NUMERIC(10, 2),
  average_agb_kg NUMERIC(10, 2),
  total_agc_tonnes NUMERIC(10, 2),
  total_soc_tonnes NUMERIC(10, 2),
  total_carbon_tonnes NUMERIC(10, 2),
  co2_equivalent_tonnes NUMERIC(10, 2),
  
  -- Tree Data (GeoJSON)
  trees_geojson JSONB,
  
  -- Visualization Data (GEE Map IDs)
  ndvi_map_id VARCHAR(500),
  ndvi_url_format TEXT,
  evi_map_id VARCHAR(500),
  evi_url_format TEXT,
  canopy_map_id VARCHAR(500),
  canopy_url_format TEXT,
  agb_map_id VARCHAR(500),
  agb_url_format TEXT,
  
  -- Full Results (for reference)
  full_results JSONB,
  
  -- Assignment to Majmaah Dashboard
  assigned_to_majmaah BOOLEAN DEFAULT false,
  visible_to_client BOOLEAN DEFAULT false,
  display_name VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_date ON analysis_results(project_id, analysis_date);
CREATE INDEX IF NOT EXISTS idx_assigned ON analysis_results(assigned_to_majmaah, visible_to_client);
CREATE INDEX IF NOT EXISTS idx_analysis_type ON analysis_results(analysis_type);

-- Table 3: Majmaah Assignments (Admin control)
CREATE TABLE IF NOT EXISTS majmaah_assignments (
  id SERIAL PRIMARY KEY,
  analysis_id INTEGER REFERENCES analysis_results(id) ON DELETE CASCADE,
  assigned_by_admin INTEGER,
  assigned_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false
);

-- Table 4: Calculated Metrics (Pre-calculated for dashboard performance)
CREATE TABLE IF NOT EXISTS calculated_metrics (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  analysis_id INTEGER REFERENCES analysis_results(id),
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Dashboard Stats
  total_trees INTEGER DEFAULT 0,
  carbon_sequestered_tonnes NUMERIC(10, 2) DEFAULT 0,
  survival_rate_percent NUMERIC(5, 2) DEFAULT 100,
  canopy_coverage_percent NUMERIC(5, 2) DEFAULT 0,
  
  -- Growth Metrics (for Growth & Carbon Chart)
  tree_growth_cm NUMERIC(6, 2) DEFAULT 0,
  carbon_growth_kg NUMERIC(10, 2) DEFAULT 0,
  
  -- Ecosystem Services Scores (0-100)
  air_quality_score NUMERIC(5, 2) DEFAULT 0,
  water_retention_score NUMERIC(5, 2) DEFAULT 0,
  biodiversity_score NUMERIC(5, 2) DEFAULT 0,
  soil_health_score NUMERIC(5, 2) DEFAULT 0,
  carbon_storage_score NUMERIC(5, 2) DEFAULT 0,
  
  -- Community Impact
  estimated_volunteers INTEGER DEFAULT 0,
  estimated_workshops INTEGER DEFAULT 0,
  research_contributions INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_metric_date ON calculated_metrics(project_id, metric_date);

-- Table 5: Species Data (for Species Richness Chart)
CREATE TABLE IF NOT EXISTS species_data (
  id SERIAL PRIMARY KEY,
  analysis_id INTEGER REFERENCES analysis_results(id),
  species_name VARCHAR(255),
  tree_count INTEGER DEFAULT 0,
  average_health NUMERIC(3, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default Majmaah project
INSERT INTO projects (name, client_name, location_name, status)
VALUES ('Majmaah University Tree Planting', 'Majmaah University', 'Majmaah, Saudi Arabia', 'active')
ON CONFLICT DO NOTHING;

-- Create view for Majmaah Dashboard data
CREATE OR REPLACE VIEW majmaah_dashboard_view AS
SELECT 
  p.id as project_id,
  p.name as project_name,
  ar.analysis_date,
  ar.tree_count,
  ar.co2_equivalent_tonnes,
  ar.canopy_cover_percent,
  ar.ndvi_mean,
  ar.evi_mean,
  cm.survival_rate_percent,
  cm.air_quality_score,
  cm.water_retention_score,
  cm.biodiversity_score,
  cm.soil_health_score,
  cm.carbon_storage_score,
  ma.display_name,
  ma.display_order
FROM projects p
LEFT JOIN analysis_results ar ON p.id = ar.project_id
LEFT JOIN calculated_metrics cm ON ar.id = cm.analysis_id
LEFT JOIN majmaah_assignments ma ON ar.id = ma.analysis_id
WHERE ar.assigned_to_majmaah = true
AND ar.visible_to_client = true
ORDER BY ma.display_order ASC, ar.analysis_date DESC;

-- Function to calculate survival rate automatically
CREATE OR REPLACE FUNCTION calculate_survival_rate(p_project_id INTEGER)
RETURNS NUMERIC AS $$
DECLARE
  initial_count INTEGER;
  latest_count INTEGER;
  initial_ndvi NUMERIC;
  latest_ndvi NUMERIC;
  survival NUMERIC;
BEGIN
  -- Get first analysis
  SELECT tree_count, ndvi_mean INTO initial_count, initial_ndvi
  FROM analysis_results
  WHERE project_id = p_project_id
  AND assigned_to_majmaah = true
  ORDER BY analysis_date ASC
  LIMIT 1;
  
  -- Get latest analysis
  SELECT tree_count, ndvi_mean INTO latest_count, latest_ndvi
  FROM analysis_results
  WHERE project_id = p_project_id
  AND assigned_to_majmaah = true
  ORDER BY analysis_date DESC
  LIMIT 1;
  
  -- Calculate survival rate
  IF initial_count IS NULL OR initial_count = 0 THEN
    RETURN 100.0;
  END IF;
  
  survival := ((latest_count::NUMERIC / initial_count::NUMERIC) * 0.6 +
               (latest_ndvi::NUMERIC / NULLIF(initial_ndvi, 0)::NUMERIC) * 0.4) * 100;
  
  RETURN LEAST(100, GREATEST(0, survival));
END;
$$ LANGUAGE plpgsql;

-- Trigger to update calculated metrics after analysis insert
CREATE OR REPLACE FUNCTION update_calculated_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate ecosystem service scores
  INSERT INTO calculated_metrics (
    project_id, analysis_id, metric_date,
    total_trees, carbon_sequestered_tonnes,
    survival_rate_percent, canopy_coverage_percent,
    air_quality_score, water_retention_score,
    biodiversity_score, soil_health_score, carbon_storage_score,
    estimated_volunteers, estimated_workshops, research_contributions
  ) VALUES (
    NEW.project_id, NEW.id, NEW.analysis_date,
    NEW.tree_count, NEW.co2_equivalent_tonnes,
    calculate_survival_rate(NEW.project_id), NEW.canopy_cover_percent,
    ROUND(((NEW.ndvi_mean + 1) / 2) * 100, 2),
    ROUND(NEW.canopy_cover_percent, 2),
    ROUND(LEAST(100, LOG(NEW.tree_count + 1) * 25), 2),
    ROUND(((NEW.evi_mean + 1) / 2) * 100, 2),
    ROUND(LEAST(100, (NEW.co2_equivalent_tonnes / 500) * 100), 2),
    FLOOR(NEW.tree_count / 10),
    FLOOR(NEW.total_area_ha / 5),
    FLOOR(NEW.tree_count / 100)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_metrics
AFTER INSERT ON analysis_results
FOR EACH ROW
EXECUTE FUNCTION update_calculated_metrics();

-- Comments for documentation
COMMENT ON TABLE projects IS 'Majmaah University tree planting projects';
COMMENT ON TABLE analysis_results IS 'All GEE analysis results with complete metrics';
COMMENT ON TABLE majmaah_assignments IS 'Admin control - which analyses appear on Majmaah dashboard';
COMMENT ON TABLE calculated_metrics IS 'Pre-calculated metrics for fast dashboard loading';
COMMENT ON TABLE species_data IS 'Tree species distribution data';

