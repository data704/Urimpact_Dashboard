// Database Service - All database operations for NDVI + Majmaah integration
import pool from '../config/database.js';

// ============================================
// SAVE ANALYSIS RESULTS
// ============================================

/**
 * Get the actual date range of available historical data for a project
 * Returns the number of months of data available, up to the requested max
 */
export const getAvailableHistoricalMonths = async (projectId = 1, maxMonths = 24, userId = null) => {
  try {
    let query = `
      SELECT 
        MIN(analysis_date) as earliest_date,
        MAX(analysis_date) as latest_date,
        COUNT(DISTINCT DATE_TRUNC('month', analysis_date)) as month_count
      FROM analysis_results ar
      WHERE ar.project_id = $1
      AND ar.assigned_to_majmaah = true
      AND ar.analysis_type IN ('baseline', 'historical_monthly')
    `;
    
    const params = [projectId];
    
    if (userId) {
      query += ` AND ar.id IN (
        SELECT analysis_id FROM user_analysis_assignments WHERE user_id = $2
      )`;
      params.push(userId);
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0 || !result.rows[0].earliest_date) {
      return { availableMonths: 0, earliestDate: null, latestDate: null };
    }
    
    const row = result.rows[0];
    const earliestDate = new Date(row.earliest_date);
    const latestDate = new Date(row.latest_date);
    const monthCount = parseInt(row.month_count) || 0;
    
    // Calculate months between earliest and latest
    const monthsDiff = (latestDate.getFullYear() - earliestDate.getFullYear()) * 12 + 
                       (latestDate.getMonth() - earliestDate.getMonth()) + 1;
    
    // Return the smaller of: actual months available, month count from DB, or maxMonths
    const availableMonths = Math.min(monthsDiff, monthCount, maxMonths);
    
    return {
      availableMonths,
      earliestDate: earliestDate.toISOString().split('T')[0],
      latestDate: latestDate.toISOString().split('T')[0],
      monthCount
    };
  } catch (error) {
    console.error('Error getting available historical months:', error);
    return { availableMonths: 0, earliestDate: null, latestDate: null };
  }
};

// ============================================
// SAVE ANALYSIS RESULTS
// ============================================

/**
 * Save complete baseline assessment to database
 * This captures ALL data needed for Majmaah dashboard widgets
 */
export const saveBaselineAssessment = async (data) => {
  const {
    projectId = 1, // Default to Majmaah project
    coordinates,
    siteDefinition,
    existingVegetation,
    agbEstimation,
    baselineImagery,
    historicalMonthly = [],
    fullResults
  } = data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Helper function to clamp NDVI/EVI values
    // Note: EVI values outside -1 to 1 are typically artifacts from:
    // - Monthly composite edge cases (median of mixed pixels)
    // - Very bright surfaces (sand, water, buildings)  
    // - Calculation artifacts when denominator approaches zero
    // Clamping these values is safe and doesn't significantly affect vegetation analysis accuracy
    // Most vegetation EVI values are between 0.1-0.8, so extreme values are usually non-vegetation pixels
    const clampNDVI = (value, name = 'value') => {
      if (value === null || value === undefined) return 0;
      const num = parseFloat(value);
      if (isNaN(num)) return 0;
      const clamped = Math.max(-1, Math.min(1, num));
      // Only warn if the value is significantly outside range (more than 0.1 difference)
      // Small differences are likely just rounding/calculation artifacts
      if (Math.abs(clamped - num) > 0.1) {
        console.warn(`⚠️  Clamped ${name} from ${num.toFixed(3)} to ${clamped} (NDVI/EVI should be -1 to 1). This is expected for non-vegetation pixels and doesn't affect accuracy.`);
      }
      return clamped;
    };

    // 1. Save the main baseline assessment (current snapshot)
    const totalCarbonTonnes = ((agbEstimation?.totalAGBTonnes || 0) * 0.47) || 0;
    const co2EquivalentTonnes = totalCarbonTonnes * 3.67;

    const ndviMean = clampNDVI(baselineImagery?.ndviStats?.mean, 'NDVI mean');
    const ndviMin = clampNDVI(baselineImagery?.ndviStats?.min, 'NDVI min');
    const ndviMax = clampNDVI(baselineImagery?.ndviStats?.max, 'NDVI max');
    const eviMean = clampNDVI(baselineImagery?.eviStats?.mean, 'EVI mean');
    const eviMin = clampNDVI(baselineImagery?.eviStats?.min, 'EVI min');
    const eviMax = clampNDVI(baselineImagery?.eviStats?.max, 'EVI max');

    const result = await client.query(`
      INSERT INTO analysis_results (
        project_id, analysis_type, analysis_date, coordinates,
        total_area_ha, candidate_area_ha, candidate_area_percent,
        constraint_area_ha, constraint_area_percent,
        tree_count, canopy_cover_percent, average_health_score,
        ndvi_mean, ndvi_min, ndvi_max,
        evi_mean, evi_min, evi_max,
        total_agb_kg, total_agb_tonnes, average_agb_kg,
        total_carbon_tonnes, co2_equivalent_tonnes, total_agc_tonnes,
        trees_geojson,
        ndvi_map_id, ndvi_url_format,
        evi_map_id, evi_url_format,
        canopy_map_id, canopy_url_format,
        full_results,
        assigned_to_majmaah,
        visible_to_client
      ) VALUES (
        $1, 'baseline', CURRENT_DATE, $2,
        $3, $4, $5, $6, $7,
        $8, $9, $10,
        $11, $12, $13,
        $14, $15, $16,
        $17, $18, $19,
        $20, $21, $20,
        $22,
        $23, $24,
        $25, $26,
        $27, $28,
        $29,
        false,
        false
      ) RETURNING id
    `, [
      projectId,
      JSON.stringify(coordinates),
      siteDefinition?.totalArea || 0,
      siteDefinition?.candidatePlantingArea || 0,
      siteDefinition?.candidateAreaPercent || 0,
      siteDefinition?.constraintArea || 0,
      siteDefinition?.constraintAreaPercent || 0,
      existingVegetation?.treeCount || 0,
      existingVegetation?.canopyCoverPercent || 0,
      existingVegetation?.averageHealthScore || 0,
      ndviMean,
      ndviMin,
      ndviMax,
      eviMean,
      eviMin,
      eviMax,
      agbEstimation?.totalAGB || 0,
      agbEstimation?.totalAGBTonnes || 0,
      agbEstimation?.averageAGB || 0,
      totalCarbonTonnes,
      co2EquivalentTonnes,
      JSON.stringify(existingVegetation?.trees || []),
      baselineImagery?.ndviMapId || null,
      baselineImagery?.ndviUrlFormat || null,
      baselineImagery?.eviMapId || null,
      baselineImagery?.eviUrlFormat || null,
      existingVegetation?.canopyMapId || null,
      existingVegetation?.canopyUrlFormat || null,
      JSON.stringify(fullResults)
    ]);

    const mainAnalysisId = result.rows[0].id;
    console.log(`✅ Main baseline assessment saved to database (ID: ${mainAnalysisId})`);

    // 2. Save historical monthly data (one record per month)
    if (historicalMonthly && historicalMonthly.length > 0) {
      console.log(`📅 Saving ${historicalMonthly.length} months of historical data...`);
      
      let savedMonths = 0;
      for (const monthData of historicalMonthly) {
        try {
          const monthNDVIMean = clampNDVI(monthData.ndviMean, 'Monthly NDVI mean');
          const monthNDVIMin = clampNDVI(monthData.ndviMin, 'Monthly NDVI min');
          const monthNDVIMax = clampNDVI(monthData.ndviMax, 'Monthly NDVI max');
          const monthEVIMean = clampNDVI(monthData.eviMean, 'Monthly EVI mean');
          const monthEVIMin = clampNDVI(monthData.eviMin, 'Monthly EVI min');
          const monthEVIMax = clampNDVI(monthData.eviMax, 'Monthly EVI max');

          await client.query(`
            INSERT INTO analysis_results (
              project_id, analysis_type, analysis_date, coordinates,
              total_area_ha,
              canopy_cover_percent,
              ndvi_mean, ndvi_min, ndvi_max,
              evi_mean, evi_min, evi_max,
              total_agb_tonnes, total_agc_tonnes,
              total_carbon_tonnes, co2_equivalent_tonnes,
              full_results,
              assigned_to_majmaah,
              visible_to_client
            ) VALUES (
              $1, 'historical_monthly', $2::DATE, $3,
              $4,
              $5,
              $6, $7, $8,
              $9, $10, $11,
              $12, $13,
              $14, $15,
              $16,
              false,
              false
            )
          `, [
            projectId,
            monthData.analysisDate, // YYYY-MM-DD format
            JSON.stringify(coordinates),
            siteDefinition?.totalArea || 0,
            monthData.canopyCoverPercent || 0,
            monthNDVIMean,
            monthNDVIMin,
            monthNDVIMax,
            monthEVIMean,
            monthEVIMin,
            monthEVIMax,
            monthData.totalAGBTonnes || 0,
            monthData.totalAGCTonnes || 0,
            monthData.totalCarbonTonnes || 0,
            monthData.co2EquivalentTonnes || 0,
            JSON.stringify({ ...monthData, historical: true })
          ]);

          savedMonths++;
        } catch (monthError) {
          console.error(`  ❌ Error saving month ${monthData.monthKey}:`, monthError.message);
          // Continue with other months
        }
      }
      console.log(`✅ Saved ${savedMonths}/${historicalMonthly.length} months of historical data`);
    }

    await client.query('COMMIT');
    return mainAnalysisId;

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error saving baseline assessment:', error);
    throw error;
  } finally {
    client.release();
  }
};

// ============================================
// ADMIN ASSIGNMENT CONTROLS
// ============================================

/**
 * Assign an analysis to Majmaah dashboard
 * This makes the analysis visible to clients
 */
export const assignToMajmaah = async (analysisId, adminId, displayName, notes) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update analysis as assigned and visible
    await client.query(`
      UPDATE analysis_results 
      SET assigned_to_majmaah = true, 
          visible_to_client = true,
          display_name = $2,
          updated_at = NOW()
      WHERE id = $1
    `, [analysisId, displayName]);

    // Create assignment record
    await client.query(`
      INSERT INTO majmaah_assignments (
        analysis_id, assigned_by_admin, notes
      ) VALUES ($1, $2, $3)
    `, [analysisId, adminId, notes]);

    await client.query('COMMIT');
    console.log(`✅ Analysis ${analysisId} assigned to Majmaah dashboard`);
    
    return { success: true, analysisId };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Unassign analysis from Majmaah dashboard
 */
export const unassignFromMajmaah = async (analysisId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      UPDATE analysis_results 
      SET assigned_to_majmaah = false, 
          visible_to_client = false,
          updated_at = NOW()
      WHERE id = $1
    `, [analysisId]);

    await client.query(`
      DELETE FROM majmaah_assignments 
      WHERE analysis_id = $1
    `, [analysisId]);

    await client.query('COMMIT');
    console.log(`✅ Analysis ${analysisId} unassigned from Majmaah`);
    
    return { success: true };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get all unassigned analyses (for admin interface)
 * These are analyses that haven't been assigned to Majmaah dashboard yet
 */
export const getUnassignedAnalyses = async (projectId = null) => {
  let query = `
    SELECT 
      id, project_id, analysis_type, analysis_date,
      tree_count, co2_equivalent_tonnes as carbon_tonnes,
      ndvi_mean, canopy_cover_percent,
      total_area_ha, created_at,
      coordinates
    FROM analysis_results
    WHERE assigned_to_majmaah = false
  `;
  
  const params = [];
  if (projectId) {
    query += ` AND project_id = $1`;
    params.push(projectId);
  }
  
  query += ` ORDER BY created_at DESC`;
  
  const result = params.length > 0
    ? await pool.query(query, params)
    : await pool.query(query);

  return result.rows;
};

/**
 * Get all analyses assigned to Majmaah
 * Filters by user assignments if userId is provided
 */
export const getMajmaahAnalyses = async (projectId = null, userId = null) => {
  let query = `SELECT ar.*, ar.display_name AS display_name, ma.assigned_at, ma.notes, ma.display_order
       FROM analysis_results ar
       LEFT JOIN majmaah_assignments ma ON ar.id = ma.analysis_id
       WHERE ar.assigned_to_majmaah = true 
       AND ar.visible_to_client = true`;
  
  const params = [];
  
  if (projectId) {
    query += ` AND ar.project_id = $${params.length + 1}`;
    params.push(projectId);
  }
  
  // If userId is provided, filter by user assignments
  if (userId) {
    query += ` AND ar.id IN (
      SELECT analysis_id FROM user_analysis_assignments WHERE user_id = $${params.length + 1}
    )`;
    params.push(userId);
  }
  
  query += ` ORDER BY ma.display_order ASC, ar.analysis_date DESC`;

  const result = params.length > 0
    ? await pool.query(query, params)
    : await pool.query(query);

  return result.rows;
};

// ============================================
// MAJMAAH DASHBOARD DATA QUERIES
// ============================================

/**
 * Get aggregated stats for Majmaah dashboard
 * Returns data for the 4 stat cards
 * Filters by analysisId if provided, otherwise by user assignments if userId is provided
 */
export const getMajmaahDashboardStats = async (projectId = 1, userId = null, analysisId = null) => {
  // Build query with optional filtering
  let query = `
    SELECT 
      COALESCE(SUM(ar.tree_count), 0) as total_trees,
      COALESCE(SUM(ar.co2_equivalent_tonnes), 0) as total_carbon_co2,
      COALESCE(AVG(ar.canopy_cover_percent), 0) as avg_canopy_coverage,
      COUNT(DISTINCT ar.analysis_date) as total_analyses,
      MAX(ar.analysis_date) as latest_analysis_date,
      COALESCE(AVG(cm.survival_rate_percent), 95.0) as avg_survival_rate,
      COALESCE(SUM(cm.estimated_volunteers), 0) as total_volunteers
    FROM analysis_results ar
    LEFT JOIN calculated_metrics cm ON ar.id = cm.analysis_id
    WHERE ar.assigned_to_majmaah = true 
    AND ar.visible_to_client = true
    AND ar.project_id = $1
  `;
  
  const params = [projectId];
  
  // Priority: analysisId > userId
  if (analysisId) {
    query += ` AND ar.id = $2`;
    params.push(analysisId);
  } else if (userId) {
    query += ` AND ar.id IN (
      SELECT analysis_id FROM user_analysis_assignments WHERE user_id = $2
    )`;
    params.push(userId);
  }
  
  const result = await pool.query(query, params);

  const stats = result.rows[0];

  // Calculate communities supported (based on tree count and area)
  const communitiesSupported = Math.floor(parseInt(stats.total_trees || 0) / 100) + 
                                Math.floor(parseInt(stats.total_volunteers || 0) / 50);

  return {
    totalTrees: parseInt(stats.total_trees) || 0,
    carbonSequestered: parseFloat(stats.total_carbon_co2).toFixed(2) || '0.00',
    survivalRate: parseFloat(stats.avg_survival_rate).toFixed(1) || '95.0',
    communitiesSupported: Math.max(1, communitiesSupported),
    canopyCoverage: parseFloat(stats.avg_canopy_coverage).toFixed(1) || '0.0',
    totalAnalyses: parseInt(stats.total_analyses) || 0,
    latestAnalysisDate: stats.latest_analysis_date
  };
};

/**
 * Get carbon sequestration data over time (for chart)
 * Filters by user assignments if userId is provided
 */
export const getCarbonTrends = async (projectId = 1, months = 12, userId = null, analysisId = null) => {
  // If analysisId is provided, use it directly (single analysis)
  // Otherwise, check available months for user's assignments
  const availableData = analysisId ? { availableMonths: months } : await getAvailableHistoricalMonths(projectId, months, userId);
  const actualMonths = availableData.availableMonths > 0 ? availableData.availableMonths : months;
  
  let query = `
    SELECT 
      DATE_TRUNC('month', ar.analysis_date) as month_date,
      TO_CHAR(ar.analysis_date, 'Mon') as month,
      COALESCE(SUM(ar.co2_equivalent_tonnes), 0) as value
    FROM analysis_results ar
    WHERE ar.project_id = $1
    AND ar.assigned_to_majmaah = true
    AND ar.analysis_type IN ('baseline', 'historical_monthly')
    AND ar.analysis_date >= CURRENT_DATE - INTERVAL '${actualMonths} months'
  `;
  
  const params = [projectId];
  
  // Priority: analysisId > userId
  if (analysisId) {
    query += ` AND ar.id = $2`;
    params.push(analysisId);
  } else if (userId) {
    query += ` AND ar.id IN (
      SELECT analysis_id FROM user_analysis_assignments WHERE user_id = $2
    )`;
    params.push(userId);
  }
  
  query += ` GROUP BY DATE_TRUNC('month', ar.analysis_date), TO_CHAR(ar.analysis_date, 'Mon')
    ORDER BY month_date ASC`;
  
  const result = await pool.query(query, params);

  // If no data, return empty array
  if (result.rows.length === 0) {
    return [];
  }

  const dataMap = new Map();
  result.rows.forEach(row => {
    const monthKey = row.month_date.toISOString().substring(0, 7); // YYYY-MM format
    dataMap.set(monthKey, {
      month: row.month,
      value: parseFloat(row.value) || 0,
      date: row.month_date
    });
  });

  // Generate 12 months of data, filling gaps with interpolation
  const monthlyData = [];
  const currentDate = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = months - 1; i >= 0; i--) {
    const targetDate = new Date(currentDate);
    targetDate.setMonth(targetDate.getMonth() - i);
    const monthKey = targetDate.toISOString().substring(0, 7);
    const monthName = monthNames[targetDate.getMonth()];
    
    if (dataMap.has(monthKey)) {
      monthlyData.push({
        month: monthName,
        value: dataMap.get(monthKey).value
      });
    } else {
      // Interpolate or use last known value
      const lastValue = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].value : 0;
      monthlyData.push({
        month: monthName,
        value: lastValue
      });
    }
  }

  return monthlyData;
};

/**
 * Get canopy coverage distribution (for pie chart)
 * Filters by user assignments if userId is provided
 */
export const getCanopyCoverageDistribution = async (projectId = 1, userId = null, analysisId = null) => {
  let query = `
    SELECT canopy_cover_percent
    FROM analysis_results ar
    WHERE ar.project_id = $1
    AND ar.assigned_to_majmaah = true
  `;
  
  const params = [projectId];
  
  // Priority: analysisId > userId
  if (analysisId) {
    query += ` AND ar.id = $2`;
    params.push(analysisId);
  } else if (userId) {
    query += ` AND ar.id IN (
      SELECT analysis_id FROM user_analysis_assignments WHERE user_id = $2
    )`;
    params.push(userId);
  }
  
  query += ` ORDER BY ar.analysis_date DESC LIMIT 1`;
  
  const result = await pool.query(query, params);

  if (result.rows.length === 0) {
    return [
      { name: '0-25%', value: 0 },
      { name: '25-50%', value: 0 },
      { name: '50-75%', value: 0 },
      { name: '75-100%', value: 0 }
    ];
  }

  const canopy = parseFloat(result.rows[0].canopy_cover_percent) || 0;

  // Calculate distribution
  return [
    { name: '0-25%', value: canopy <= 25 ? Math.round(canopy) : Math.min(25, canopy) },
    { name: '25-50%', value: canopy > 25 && canopy <= 50 ? Math.round(canopy - 25) : canopy > 50 ? 25 : 0 },
    { name: '50-75%', value: canopy > 50 && canopy <= 75 ? Math.round(canopy - 50) : canopy > 75 ? 25 : 0 },
    { name: '75-100%', value: canopy > 75 ? Math.round(canopy - 75) : 0 }
  ];
};

/**
 * Get species richness data (for bar chart)
 * Filters by user assignments if userId is provided
 */
export const getSpeciesRichnessData = async (projectId = 1, userId = null, analysisId = null) => {
  // Build subquery for analysis IDs
  let analysisSubquery = `
    SELECT id FROM analysis_results ar
    WHERE ar.project_id = $1 
    AND ar.assigned_to_majmaah = true
  `;
  
  const params = [projectId];
  
  // Priority: analysisId > userId
  if (analysisId) {
    analysisSubquery += ` AND ar.id = $2`;
    params.push(analysisId);
  } else if (userId) {
    analysisSubquery += ` AND ar.id IN (
      SELECT analysis_id FROM user_analysis_assignments WHERE user_id = $2
    )`;
    params.push(userId);
  }
  
  // Check if we have species data
  const result = await pool.query(`
    SELECT species_name, tree_count
    FROM species_data
    WHERE analysis_id IN (${analysisSubquery})
    ORDER BY tree_count DESC
  `, params);

  if (result.rows.length > 0) {
    return result.rows.map(row => ({
      species: row.species_name,
      count: row.tree_count
    }));
  }

  // Fallback: Generic distribution based on tree count
  let treeQuery = `
    SELECT tree_count
    FROM analysis_results ar
    WHERE ar.project_id = $1
    AND ar.assigned_to_majmaah = true
  `;
  
  const treeParams = [projectId];
  
  // Priority: analysisId > userId (for fallback tree query)
  if (analysisId) {
    treeQuery += ` AND ar.id = $2`;
    treeParams.push(analysisId);
  } else if (userId) {
    treeQuery += ` AND ar.id IN (
      SELECT analysis_id FROM user_analysis_assignments WHERE user_id = $2
    )`;
    treeParams.push(userId);
  }
  
  treeQuery += ` ORDER BY ar.analysis_date DESC LIMIT 1`;
  
  const treeResult = await pool.query(treeQuery, treeParams);

  if (treeResult.rows.length === 0) return [];

  const totalTrees = treeResult.rows[0].tree_count || 0;

  // Generic species distribution (can be replaced with real data later)
  return [
    { species: 'Acacia', count: Math.floor(totalTrees * 0.30) },
    { species: 'Palm', count: Math.floor(totalTrees * 0.25) },
    { species: 'Olive', count: Math.floor(totalTrees * 0.20) },
    { species: 'Cedar', count: Math.floor(totalTrees * 0.15) },
    { species: 'Pine', count: Math.floor(totalTrees * 0.10) }
  ];
};

/**
 * Get ecosystem services scores (for radar chart)
 * Filters by user assignments if userId is provided
 */
export const getEcosystemServices = async (projectId = 1, userId = null, analysisId = null) => {
  let query = `
    SELECT 
      cm.air_quality_score,
      cm.water_retention_score,
      cm.biodiversity_score,
      cm.soil_health_score,
      cm.carbon_storage_score
    FROM calculated_metrics cm
    JOIN analysis_results ar ON cm.analysis_id = ar.id
    WHERE ar.project_id = $1
    AND ar.assigned_to_majmaah = true
  `;
  
  const params = [projectId];
  
  // Priority: analysisId > userId
  if (analysisId) {
    query += ` AND ar.id = $2`;
    params.push(analysisId);
  } else if (userId) {
    query += ` AND ar.id IN (
      SELECT analysis_id FROM user_analysis_assignments WHERE user_id = $2
    )`;
    params.push(userId);
  }
  
  query += ` ORDER BY cm.metric_date DESC LIMIT 1`;
  
  const result = await pool.query(query, params);

  if (result.rows.length === 0) {
    return [
      { service: 'Air Quality', value: 0 },
      { service: 'Water Retention', value: 0 },
      { service: 'Biodiversity', value: 0 },
      { service: 'Soil Health', value: 0 },
      { service: 'Carbon Storage', value: 0 }
    ];
  }

  const scores = result.rows[0];
  return [
    { service: 'Air Quality', value: parseFloat(scores.air_quality_score) || 0 },
    { service: 'Water Retention', value: parseFloat(scores.water_retention_score) || 0 },
    { service: 'Biodiversity', value: parseFloat(scores.biodiversity_score) || 0 },
    { service: 'Soil Health', value: parseFloat(scores.soil_health_score) || 0 },
    { service: 'Carbon Storage', value: parseFloat(scores.carbon_storage_score) || 0 }
  ];
};

/**
 * Get vegetation health distribution (for pie chart)
 * Filters by user assignments if userId is provided
 */
export const getVegetationHealthDistribution = async (projectId = 1, userId = null, analysisId = null) => {
  let query = `
    SELECT trees_geojson
    FROM analysis_results ar
    WHERE ar.project_id = $1
    AND ar.assigned_to_majmaah = true
  `;
  
  const params = [projectId];
  
  // Priority: analysisId > userId
  if (analysisId) {
    query += ` AND ar.id = $2`;
    params.push(analysisId);
  } else if (userId) {
    query += ` AND ar.id IN (
      SELECT analysis_id FROM user_analysis_assignments WHERE user_id = $2
    )`;
    params.push(userId);
  }
  
  query += ` ORDER BY ar.analysis_date DESC LIMIT 1`;
  
  const result = await pool.query(query, params);

  if (result.rows.length === 0 || !result.rows[0].trees_geojson) {
    return [
      { condition: 'Excellent', percentage: 0 },
      { condition: 'Good', percentage: 0 },
      { condition: 'Fair', percentage: 0 }
    ];
  }

  const trees = result.rows[0].trees_geojson;

  // Count trees by health score
  const excellent = trees.filter(t => t.healthScore >= 4.5).length;
  const good = trees.filter(t => t.healthScore >= 3.5 && t.healthScore < 4.5).length;
  const fair = trees.filter(t => t.healthScore < 3.5).length;

  const total = trees.length || 1;

  return [
    { condition: 'Excellent', percentage: parseFloat(((excellent / total) * 100).toFixed(1)) },
    { condition: 'Good', percentage: parseFloat(((good / total) * 100).toFixed(1)) },
    { condition: 'Fair', percentage: parseFloat(((fair / total) * 100).toFixed(1)) }
  ];
};

/**
 * Get survival rate data over years (for line chart)
 * Filters by user assignments if userId is provided
 */
export const getSurvivalRateData = async (projectId = 1, userId = null, analysisId = null) => {
  let query = `
    SELECT 
      EXTRACT(YEAR FROM cm.metric_date)::INTEGER as year,
      AVG(cm.survival_rate_percent) as rate
    FROM calculated_metrics cm
    JOIN analysis_results ar ON cm.analysis_id = ar.id
    WHERE ar.project_id = $1
    AND ar.assigned_to_majmaah = true
  `;
  
  const params = [projectId];
  
  // Priority: analysisId > userId
  if (analysisId) {
    query += ` AND ar.id = $2`;
    params.push(analysisId);
  } else if (userId) {
    query += ` AND ar.id IN (
      SELECT analysis_id FROM user_analysis_assignments WHERE user_id = $2
    )`;
    params.push(userId);
  }
  
  query += ` GROUP BY EXTRACT(YEAR FROM cm.metric_date)
    ORDER BY year ASC`;
  
  const result = await pool.query(query, params);

  if (result.rows.length === 0) {
    // Return default progression
    return [
      { year: '2021', rate: 89 },
      { year: '2022', rate: 91 },
      { year: '2023', rate: 93 },
      { year: '2024', rate: 94 },
      { year: '2025', rate: 94.5 }
    ];
  }

  return result.rows.map(row => ({
    year: row.year.toString(),
    rate: parseFloat(row.rate) || 0
  }));
};

/**
 * Get growth and carbon impact data (for composed chart)
 * Filters by user assignments if userId is provided
 */
export const getGrowthCarbonImpact = async (projectId = 1, months = 12, userId = null, analysisId = null) => {
  // If analysisId is provided, use it directly
  const availableData = analysisId ? { availableMonths: months } : await getAvailableHistoricalMonths(projectId, months, userId);
  const actualMonths = availableData.availableMonths > 0 ? availableData.availableMonths : months;
  
  // Use analysis_results directly for historical_monthly data, fallback to calculated_metrics
  let query = `
    SELECT 
      DATE_TRUNC('month', COALESCE(cm.metric_date, ar.analysis_date)) as metric_date,
      TO_CHAR(COALESCE(cm.metric_date, ar.analysis_date), 'Mon') as month,
      COALESCE(AVG(cm.tree_growth_cm), 2.0) as growth,
      COALESCE(AVG(ar.co2_equivalent_tonnes / 12), AVG(cm.carbon_growth_kg / 1000)) as carbon
    FROM analysis_results ar
    LEFT JOIN calculated_metrics cm ON cm.analysis_id = ar.id
    WHERE ar.project_id = $1
    AND ar.assigned_to_majmaah = true
    AND ar.analysis_type IN ('baseline', 'historical_monthly')
    AND ar.analysis_date >= CURRENT_DATE - INTERVAL '${actualMonths} months'
  `;
  
  const params = [projectId];
  
  // Priority: analysisId > userId
  if (analysisId) {
    query += ` AND ar.id = $2`;
    params.push(analysisId);
  } else if (userId) {
    query += ` AND ar.id IN (
      SELECT analysis_id FROM user_analysis_assignments WHERE user_id = $2
    )`;
    params.push(userId);
  }
  
  query += ` GROUP BY DATE_TRUNC('month', COALESCE(cm.metric_date, ar.analysis_date)), TO_CHAR(COALESCE(cm.metric_date, ar.analysis_date), 'Mon')
    ORDER BY metric_date ASC`;
  
  const result = await pool.query(query, params);

    // If no data, return projections based on latest analysis
    if (result.rows.length === 0) {
      let latestQuery = `
        SELECT tree_count, co2_equivalent_tonnes
        FROM analysis_results ar
        WHERE ar.project_id = $1
        AND ar.assigned_to_majmaah = true
      `;
      const latestParams = [projectId];
      
      if (userId) {
        latestQuery += ` AND ar.id IN (
          SELECT analysis_id FROM user_analysis_assignments WHERE user_id = $2
        )`;
        latestParams.push(userId);
      }
      
      latestQuery += ` ORDER BY ar.analysis_date DESC LIMIT 1`;
      
      const latest = await pool.query(latestQuery, latestParams);

    if (latest.rows.length === 0) {
      return [];
    }

    const baseCarbon = parseFloat(latest.rows[0].co2_equivalent_tonnes) || 0;
    const monthsArr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return monthsArr.map((month, idx) => ({
      month,
      growth: 2.0 + (idx * 0.3), // Simulated growth progression
      carbon: baseCarbon * (1 + idx * 0.08) / 12 // Monthly carbon
    }));
  }

  return result.rows.map(row => ({
    month: row.month,
    growth: parseFloat(row.growth) || 0,
    carbon: parseFloat(row.carbon) || 0
  }));
};

/**
 * Get tree data for map widget
 * Filters by user assignments if userId is provided
 */
export const getMajmaahTreesForMap = async (projectId = 1, userId = null, analysisId = null) => {
  let query = `
    SELECT trees_geojson
    FROM analysis_results ar
    WHERE ar.project_id = $1
    AND ar.assigned_to_majmaah = true
  `;
  
  const params = [projectId];
  
  // Priority: analysisId > userId
  if (analysisId) {
    query += ` AND ar.id = $2`;
    params.push(analysisId);
  } else if (userId) {
    query += ` AND ar.id IN (
      SELECT analysis_id FROM user_analysis_assignments WHERE user_id = $2
    )`;
    params.push(userId);
  }
  
  query += ` ORDER BY ar.analysis_date DESC LIMIT 1`;
  
  const result = await pool.query(query, params);

  if (result.rows.length === 0 || !result.rows[0].trees_geojson) {
    return [];
  }

  const trees = result.rows[0].trees_geojson;

  // Convert to format expected by Majmaah map
  return trees.map(tree => ({
    id: `TREE-${tree.id}`,
    tree_id: `TREE-${tree.id}`,
    species: 'Detected', // Generic until species data available
    coordinates: tree.coordinates,
    health: tree.healthScore >= 4.5 ? 'Excellent' : 
            tree.healthScore >= 3.5 ? 'Good' : 'Fair',
    health_condition: tree.healthScore >= 4.5 ? 'Excellent' : 
                     tree.healthScore >= 3.5 ? 'Good' : 'Fair'
  }));
};

/**
 * Get NDVI trends over time (for line chart)
 * Filters by user assignments if userId is provided
 */
export const getNDVITrends = async (projectId = 1, months = 12, userId = null, analysisId = null) => {
  // If analysisId is provided, use it directly
  const availableData = analysisId ? { availableMonths: months } : await getAvailableHistoricalMonths(projectId, months, userId);
  const actualMonths = availableData.availableMonths > 0 ? availableData.availableMonths : months;
  
  let query = `
    SELECT 
      DATE_TRUNC('month', ar.analysis_date) as month_date,
      TO_CHAR(ar.analysis_date, 'Mon') as month,
      AVG(ar.ndvi_mean) as value,
      MIN(ar.ndvi_min) as min_value,
      MAX(ar.ndvi_max) as max_value
    FROM analysis_results ar
    WHERE ar.project_id = $1
    AND ar.assigned_to_majmaah = true
    AND ar.analysis_type IN ('baseline', 'historical_monthly')
    AND ar.analysis_date >= CURRENT_DATE - INTERVAL '${actualMonths} months'
    AND ar.ndvi_mean IS NOT NULL
  `;
  
  const params = [projectId];
  
  // Priority: analysisId > userId
  if (analysisId) {
    query += ` AND ar.id = $2`;
    params.push(analysisId);
  } else if (userId) {
    query += ` AND ar.id IN (
      SELECT analysis_id FROM user_analysis_assignments WHERE user_id = $2
    )`;
    params.push(userId);
  }
  
  query += ` GROUP BY DATE_TRUNC('month', ar.analysis_date), TO_CHAR(ar.analysis_date, 'Mon')
    ORDER BY month_date ASC`;
  
  const result = await pool.query(query, params);

  // If no data, return empty array
  if (result.rows.length === 0) {
    return [];
  }

  const dataMap = new Map();
  result.rows.forEach(row => {
    const monthKey = row.month_date.toISOString().substring(0, 7); // YYYY-MM format
    dataMap.set(monthKey, {
      month: row.month,
      value: parseFloat(row.value) || 0,
      date: row.month_date
    });
  });

  // Generate N months of data based on actual available data
  const monthlyData = [];
  const currentDate = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = actualMonths - 1; i >= 0; i--) {
    const targetDate = new Date(currentDate);
    targetDate.setMonth(targetDate.getMonth() - i);
    const monthKey = targetDate.toISOString().substring(0, 7);
    const monthName = monthNames[targetDate.getMonth()];
    
    if (dataMap.has(monthKey)) {
      monthlyData.push({
        month: monthName,
        value: dataMap.get(monthKey).value
      });
    } else {
      // Interpolate or use last known value
      const lastValue = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].value : 0;
      monthlyData.push({
        month: monthName,
        value: lastValue
      });
    }
  }

  return monthlyData;
};

/**
 * Get EVI trends over time (for line chart)
 * Filters by user assignments if userId is provided
 */
export const getEVITrends = async (projectId = 1, months = 12, userId = null, analysisId = null) => {
  // If analysisId is provided, use it directly
  const availableData = analysisId ? { availableMonths: months } : await getAvailableHistoricalMonths(projectId, months, userId);
  const actualMonths = availableData.availableMonths > 0 ? availableData.availableMonths : months;
  
  let query = `
    SELECT 
      DATE_TRUNC('month', ar.analysis_date) as month_date,
      TO_CHAR(ar.analysis_date, 'Mon') as month,
      AVG(ar.evi_mean) as value,
      MIN(ar.evi_min) as min_value,
      MAX(ar.evi_max) as max_value
    FROM analysis_results ar
    WHERE ar.project_id = $1
    AND ar.assigned_to_majmaah = true
    AND ar.analysis_type IN ('baseline', 'historical_monthly')
    AND ar.analysis_date >= CURRENT_DATE - INTERVAL '${actualMonths} months'
    AND ar.evi_mean IS NOT NULL
  `;
  
  const params = [projectId];
  
  // Priority: analysisId > userId
  if (analysisId) {
    query += ` AND ar.id = $2`;
    params.push(analysisId);
  } else if (userId) {
    query += ` AND ar.id IN (
      SELECT analysis_id FROM user_analysis_assignments WHERE user_id = $2
    )`;
    params.push(userId);
  }
  
  query += ` GROUP BY DATE_TRUNC('month', ar.analysis_date), TO_CHAR(ar.analysis_date, 'Mon')
    ORDER BY month_date ASC`;
  
  const result = await pool.query(query, params);

  // If no data, return empty array
  if (result.rows.length === 0) {
    return [];
  }

  const dataMap = new Map();
  result.rows.forEach(row => {
    const monthKey = row.month_date.toISOString().substring(0, 7); // YYYY-MM format
    dataMap.set(monthKey, {
      month: row.month,
      value: parseFloat(row.value) || 0,
      date: row.month_date
    });
  });

  // Generate N months of data based on actual available data
  const monthlyData = [];
  const currentDate = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = actualMonths - 1; i >= 0; i--) {
    const targetDate = new Date(currentDate);
    targetDate.setMonth(targetDate.getMonth() - i);
    const monthKey = targetDate.toISOString().substring(0, 7);
    const monthName = monthNames[targetDate.getMonth()];
    
    if (dataMap.has(monthKey)) {
      monthlyData.push({
        month: monthName,
        value: dataMap.get(monthKey).value
      });
    } else {
      // Interpolate or use last known value
      const lastValue = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].value : 0;
      monthlyData.push({
        month: monthName,
        value: lastValue
      });
    }
  }

  return monthlyData;
};

/**
 * Get Above Ground Carbon (AGC) trends over time (for line chart)
 * Filters by user assignments if userId is provided
 */
export const getAGCTrends = async (projectId = 1, months = 12, userId = null, analysisId = null) => {
  // If analysisId is provided, use it directly
  const availableData = analysisId ? { availableMonths: months } : await getAvailableHistoricalMonths(projectId, months, userId);
  const actualMonths = availableData.availableMonths > 0 ? availableData.availableMonths : months;
  
  let query = `
    SELECT 
      DATE_TRUNC('month', ar.analysis_date) as month_date,
      TO_CHAR(ar.analysis_date, 'Mon') as month,
      COALESCE(SUM(ar.total_agc_tonnes), SUM(ar.total_agb_tonnes * 0.47), 0) as value
    FROM analysis_results ar
    WHERE ar.project_id = $1
    AND ar.assigned_to_majmaah = true
    AND ar.analysis_type IN ('baseline', 'historical_monthly')
    AND ar.analysis_date >= CURRENT_DATE - INTERVAL '${actualMonths} months'
    AND (ar.total_agc_tonnes IS NOT NULL OR ar.total_agb_tonnes IS NOT NULL)
  `;
  
  const params = [projectId];
  
  // Priority: analysisId > userId
  if (analysisId) {
    query += ` AND ar.id = $2`;
    params.push(analysisId);
  } else if (userId) {
    query += ` AND ar.id IN (
      SELECT analysis_id FROM user_analysis_assignments WHERE user_id = $2
    )`;
    params.push(userId);
  }
  
  query += ` GROUP BY DATE_TRUNC('month', ar.analysis_date), TO_CHAR(ar.analysis_date, 'Mon')
    ORDER BY month_date ASC`;
  
  const result = await pool.query(query, params);

  // If no data, return empty array
  if (result.rows.length === 0) {
    return [];
  }

  const dataMap = new Map();
  result.rows.forEach(row => {
    const monthKey = row.month_date.toISOString().substring(0, 7); // YYYY-MM format
    dataMap.set(monthKey, {
      month: row.month,
      value: parseFloat(row.value) || 0,
      date: row.month_date
    });
  });

  // Generate 12 months of data, filling gaps with interpolation
  const monthlyData = [];
  const currentDate = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = months - 1; i >= 0; i--) {
    const targetDate = new Date(currentDate);
    targetDate.setMonth(targetDate.getMonth() - i);
    const monthKey = targetDate.toISOString().substring(0, 7);
    const monthName = monthNames[targetDate.getMonth()];
    
    if (dataMap.has(monthKey)) {
      monthlyData.push({
        month: monthName,
        value: dataMap.get(monthKey).value
      });
    } else {
      // Interpolate or use last known value
      const lastValue = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].value : 0;
      monthlyData.push({
        month: monthName,
        value: lastValue
      });
    }
  }

  return monthlyData;
};

/**
 * Get Vegetation Health Index distribution (for bar/pie chart)
 * Based on average health scores and NDVI values
 * Filters by user assignments if userId is provided
 */
export const getVegetationHealthIndex = async (projectId = 1, userId = null, analysisId = null) => {
  let query = `
    SELECT 
      ar.trees_geojson,
      ar.average_health_score,
      ar.ndvi_mean,
      ar.canopy_cover_percent
    FROM analysis_results ar
    WHERE ar.project_id = $1
    AND ar.assigned_to_majmaah = true
  `;
  
  const params = [projectId];
  
  // Priority: analysisId > userId
  if (analysisId) {
    query += ` AND ar.id = $2`;
    params.push(analysisId);
  } else if (userId) {
    query += ` AND ar.id IN (
      SELECT analysis_id FROM user_analysis_assignments WHERE user_id = $2
    )`;
    params.push(userId);
  }
  
  query += ` ORDER BY ar.analysis_date DESC LIMIT 1`;
  
  const result = await pool.query(query, params);

  if (result.rows.length === 0) {
    return [
      { category: 'Excellent', value: 0 },
      { category: 'Good', value: 0 },
      { category: 'Moderate', value: 0 },
      { category: 'Fair', value: 0 },
      { category: 'Poor', value: 0 }
    ];
  }

  const row = result.rows[0];
  const trees = row.trees_geojson || [];
  const avgHealthScore = parseFloat(row.average_health_score) || 0;
  const ndviMean = parseFloat(row.ndvi_mean) || 0;
  const canopyCover = parseFloat(row.canopy_cover_percent) || 0;

  // Calculate distribution based on tree health scores if available
  if (trees.length > 0) {
    const excellent = trees.filter(t => (t.healthScore || 0) >= 4.5).length;
    const good = trees.filter(t => (t.healthScore || 0) >= 3.5 && (t.healthScore || 0) < 4.5).length;
    const moderate = trees.filter(t => (t.healthScore || 0) >= 2.5 && (t.healthScore || 0) < 3.5).length;
    const fair = trees.filter(t => (t.healthScore || 0) >= 1.5 && (t.healthScore || 0) < 2.5).length;
    const poor = trees.filter(t => (t.healthScore || 0) < 1.5).length;

    const total = trees.length || 1;
    return [
      { category: 'Excellent', value: Math.round((excellent / total) * 100) },
      { category: 'Good', value: Math.round((good / total) * 100) },
      { category: 'Moderate', value: Math.round((moderate / total) * 100) },
      { category: 'Fair', value: Math.round((fair / total) * 100) },
      { category: 'Poor', value: Math.round((poor / total) * 100) }
    ];
  }

  // Fallback: Calculate based on NDVI and canopy cover
  let excellent = 0, good = 0, moderate = 0, fair = 0, poor = 0;
  
  if (ndviMean >= 0.7 && canopyCover >= 70) {
    excellent = 40;
    good = 35;
    moderate = 15;
    fair = 10;
    poor = 0;
  } else if (ndviMean >= 0.6 && canopyCover >= 50) {
    excellent = 20;
    good = 40;
    moderate = 25;
    fair = 10;
    poor = 5;
  } else if (ndviMean >= 0.4 && canopyCover >= 30) {
    excellent = 5;
    good = 25;
    moderate = 35;
    fair = 25;
    poor = 10;
  } else if (ndviMean >= 0.2 && canopyCover >= 10) {
    excellent = 0;
    good = 10;
    moderate = 25;
    fair = 35;
    poor = 30;
  } else {
    excellent = 0;
    good = 0;
    moderate = 10;
    fair = 25;
    poor = 65;
  }

  return [
    { category: 'Excellent', value: excellent },
    { category: 'Good', value: good },
    { category: 'Moderate', value: moderate },
    { category: 'Fair', value: fair },
    { category: 'Poor', value: poor }
  ];
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get latest analysis for a project
 */
export const getLatestAnalysis = async (projectId = 1, userId = null) => {
  const analyses = await getMajmaahAnalyses(projectId, userId);
  return analyses.length > 0 ? analyses[0] : null;
};

/**
 * Get analysis by ID
 */
export const getAnalysisById = async (analysisId) => {
  const result = await pool.query(`
    SELECT ar.*, ar.display_name AS display_name, ma.notes
    FROM analysis_results ar
    LEFT JOIN majmaah_assignments ma ON ar.id = ma.analysis_id
    WHERE ar.id = $1
  `, [analysisId]);

  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Delete analysis completely
 * Removes analysis and all related records (assignments, user assignments, etc.)
 */
export const deleteAnalysis = async (analysisId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // First, delete all related assignments
    await client.query(`
      DELETE FROM user_analysis_assignments 
      WHERE analysis_id = $1
    `, [analysisId]);

    await client.query(`
      DELETE FROM majmaah_assignments 
      WHERE analysis_id = $1
    `, [analysisId]);

    // Delete related calculated metrics
    await client.query(`
      DELETE FROM calculated_metrics 
      WHERE analysis_id = $1
    `, [analysisId]);

    // Delete related species data
    await client.query(`
      DELETE FROM species_data 
      WHERE analysis_id = $1
    `, [analysisId]);

    // Finally, delete the analysis itself
    const result = await client.query(`
      DELETE FROM analysis_results 
      WHERE id = $1 
      RETURNING id, analysis_date
    `, [analysisId]);

    await client.query('COMMIT');

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default {
  saveBaselineAssessment,
  assignToMajmaah,
  unassignFromMajmaah,
  getUnassignedAnalyses,
  getMajmaahAnalyses,
  getMajmaahDashboardStats,
  getCarbonTrends,
  getCanopyCoverageDistribution,
  getSpeciesRichnessData,
  getEcosystemServices,
  getVegetationHealthDistribution,
  getSurvivalRateData,
  getGrowthCarbonImpact,
  getMajmaahTreesForMap,
  getLatestAnalysis,
  getAnalysisById,
  getNDVITrends,
  getEVITrends,
  getVegetationHealthIndex,
  getAGCTrends,
  deleteAnalysis,
  pool
};