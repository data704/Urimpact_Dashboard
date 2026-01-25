// Planting Record Assignment Service - Handle assignment database operations
import pool from '../config/database.js';

/**
 * Get all planting record assignments
 */
export const getAllAssignments = async (assignToType = null) => {
  const client = await pool.connect();
  try {
    let query = `
      SELECT 
        pra.id,
        pra.analysis_id,
        pra.assign_to_type,
        pra.department_id,
        pra.employee_id,
        pra.trees_assigned,
        pra.assigned_carbon_emission,
        pra.planting_type,
        pra.notes,
        pra.created_at,
        ar.display_name as planting_record_name,
        ar.analysis_date,
        ar.analysis_type,
        d.name_english as department_name_english,
        d.name_arabic as department_name_arabic,
        e.name as employee_name
      FROM planting_record_assignments pra
      INNER JOIN analysis_results ar ON pra.analysis_id = ar.id
      LEFT JOIN departments d ON pra.department_id = d.id
      LEFT JOIN employees e ON pra.employee_id = e.id
      WHERE 1=1
    `;

    const params = [];
    if (assignToType) {
      query += ` AND pra.assign_to_type = $${params.length + 1}`;
      params.push(assignToType);
    }

    query += ` ORDER BY pra.created_at DESC`;

    const result = await client.query(query, params);
    return result.rows.map(row => ({
      id: row.id,
      analysisId: row.analysis_id,
      plantingRecordName: row.planting_record_name || `Analysis ${row.analysis_id}`,
      plantingType: row.planting_type || row.analysis_type || 'Standard',
      assignToType: row.assign_to_type,
      departmentId: row.department_id,
      departmentName: row.department_name_english,
      departmentNameArabic: row.department_name_arabic,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      treesAssigned: parseInt(row.trees_assigned) || 0,
      assignedCarbonEmission: parseFloat(row.assigned_carbon_emission) || 0,
      notes: row.notes,
      createdAt: row.created_at,
    }));
  } finally {
    client.release();
  }
};

/**
 * Get assignment statistics for a user
 */
export const getAssignmentStatistics = async (userId = null) => {
  const client = await pool.connect();
  try {
    // Get total trees available from all analyses assigned to Majmaah
    // If userId is provided, filter to user's assigned analyses
    let analysesQuery = `
      SELECT 
        COALESCE(SUM(ar.tree_count), 0) as total_trees,
        COALESCE(SUM(ar.co2_equivalent_tonnes), 0) as total_carbon
      FROM analysis_results ar
      WHERE ar.assigned_to_majmaah = true
    `;
    
    let analysesParams = [];
    if (userId) {
      analysesQuery += `
        AND EXISTS (
          SELECT 1 FROM user_analysis_assignments uaa 
          WHERE uaa.analysis_id = ar.id AND uaa.user_id = $1
        )
      `;
      analysesParams = [userId];
    }

    const analysesResult = await client.query(analysesQuery, analysesParams);
    const totalTreesAvailable = parseInt(analysesResult.rows[0]?.total_trees) || 0;
    const totalCarbonAvailable = parseFloat(analysesResult.rows[0]?.total_carbon) || 0;

    // Get assigned trees and carbon from all assignments
    // If userId is provided, only count assignments from user's assigned analyses
    let assignmentsQuery = `
      SELECT 
        COALESCE(SUM(pra.trees_assigned), 0) as total_assigned_trees,
        COALESCE(SUM(pra.assigned_carbon_emission), 0) as total_assigned_carbon
      FROM planting_record_assignments pra
      INNER JOIN analysis_results ar ON pra.analysis_id = ar.id
      WHERE ar.assigned_to_majmaah = true
    `;

    let assignmentsParams = [];
    if (userId) {
      assignmentsQuery += `
        AND EXISTS (
          SELECT 1 FROM user_analysis_assignments uaa 
          WHERE uaa.analysis_id = ar.id AND uaa.user_id = $1
        )
      `;
      assignmentsParams = [userId];
    }

    const assignmentsResult = await client.query(assignmentsQuery, assignmentsParams);
    
    const totalTreesAssigned = parseInt(assignmentsResult.rows[0]?.total_assigned_trees) || 0;
    const totalCarbonAssigned = parseFloat(assignmentsResult.rows[0]?.total_assigned_carbon) || 0;

    // Calculate average growth rate (percentage of trees assigned vs available)
    const averageGrowthRate = totalTreesAvailable > 0 
      ? ((totalTreesAssigned / totalTreesAvailable) * 100)
      : 0;

    return {
      totalTreesPlanted: totalTreesAvailable,
      totalTreesAssigned,
      carbonEstimate: totalCarbonAssigned,
      averageGrowthRate: parseFloat(averageGrowthRate.toFixed(1)),
    };
  } catch (error) {
    console.error('Error calculating assignment statistics:', error);
    // Return default values on error
    return {
      totalTreesPlanted: 0,
      totalTreesAssigned: 0,
      carbonEstimate: 0,
      averageGrowthRate: 0,
    };
  } finally {
    client.release();
  }
};

/**
 * Get assignment by ID
 */
export const getAssignmentById = async (id) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        pra.*,
        ar.display_name as planting_record_name,
        ar.analysis_type,
        d.name_english as department_name_english,
        e.name as employee_name
      FROM planting_record_assignments pra
      INNER JOIN analysis_results ar ON pra.analysis_id = ar.id
      LEFT JOIN departments d ON pra.department_id = d.id
      LEFT JOIN employees e ON pra.employee_id = e.id
      WHERE pra.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      analysisId: row.analysis_id,
      plantingRecordName: row.planting_record_name || `Analysis ${row.analysis_id}`,
      plantingType: row.planting_type || row.analysis_type || 'Standard',
      assignToType: row.assign_to_type,
      departmentId: row.department_id,
      departmentName: row.department_name_english,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      treesAssigned: parseInt(row.trees_assigned) || 0,
      assignedCarbonEmission: parseFloat(row.assigned_carbon_emission) || 0,
      notes: row.notes,
      createdAt: row.created_at,
    };
  } finally {
    client.release();
  }
};

/**
 * Create a new assignment
 */
export const createAssignment = async ({
  analysisId,
  assignToType,
  departmentId,
  employeeId,
  treesAssigned,
  plantingType,
  notes,
  assignedBy,
}) => {
  const client = await pool.connect();
  try {
    // Verify available trees
    const analysisResult = await client.query(
      'SELECT tree_count FROM analysis_results WHERE id = $1',
      [analysisId]
    );

    if (analysisResult.rows.length === 0) {
      throw new Error('Analysis not found');
    }

    const totalTrees = parseInt(analysisResult.rows[0].tree_count) || 0;

    // Check if we're assigning more trees than available
    const existingAssignmentsResult = await client.query(
      `SELECT COALESCE(SUM(trees_assigned), 0) as total_assigned
       FROM planting_record_assignments
       WHERE analysis_id = $1`,
      [analysisId]
    );

    const totalAssigned = parseInt(existingAssignmentsResult.rows[0].total_assigned) || 0;
    const availableTrees = totalTrees - totalAssigned;

    if (treesAssigned > availableTrees) {
      throw new Error(`Not enough trees available. Available: ${availableTrees}, Requested: ${treesAssigned}`);
    }

    const result = await client.query(`
      INSERT INTO planting_record_assignments (
        analysis_id, assign_to_type, department_id, employee_id,
        trees_assigned, planting_type, notes, assigned_by, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `, [
      analysisId,
      assignToType,
      assignToType === 'department' ? departmentId : null,
      assignToType === 'employee' ? employeeId : null,
      treesAssigned,
      plantingType || null,
      notes || null,
      assignedBy || null,
    ]);

    const assignment = await getAssignmentById(result.rows[0].id);

    // Automatically create a certification record when assignment is created
    try {
      let awardedToName = '';
      if (assignToType === 'department') {
        const deptResult = await client.query('SELECT name_english FROM departments WHERE id = $1', [departmentId]);
        awardedToName = deptResult.rows[0]?.name_english || 'Unknown Department';
      } else {
        const empResult = await client.query('SELECT name FROM employees WHERE id = $1', [employeeId]);
        awardedToName = empResult.rows[0]?.name || 'Unknown Employee';
      }

      // Get analysis data to calculate carbon
      const analysisDataResult = await client.query(
        'SELECT co2_equivalent_tonnes, tree_count FROM analysis_results WHERE id = $1',
        [analysisId]
      );

      let assignedCarbon = 0;
      if (analysisDataResult.rows[0]) {
        const totalCarbon = parseFloat(analysisDataResult.rows[0].co2_equivalent_tonnes) || 0;
        const analysisTreeCount = parseInt(analysisDataResult.rows[0].tree_count) || 1;
        if (analysisTreeCount > 0) {
          const carbonPerTree = totalCarbon / analysisTreeCount;
          assignedCarbon = carbonPerTree * treesAssigned;
        }
      }

      // Generate certification ID
      const certIdResult = await client.query(`
        SELECT 'CERT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((COALESCE((SELECT MAX(id) FROM certifications_history), 0) + 1)::TEXT, 6, '0') as cert_id
      `);
      const certificationId = certIdResult.rows[0].cert_id;

      await client.query(`
        INSERT INTO certifications_history (
          certification_id, certificate_type, receiving_party_type,
          department_id, employee_id, awarded_to_name,
          trees_count, carbon_sequestered, issued_by,
          date_awarded, created_at, updated_at
        )
        VALUES ($1, 'trees', $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), NOW())
      `, [
        certificationId,
        assignToType,
        assignToType === 'department' ? departmentId : null,
        assignToType === 'employee' ? employeeId : null,
        awardedToName,
        treesAssigned,
        assignedCarbon,
        assignedBy || null,
      ]);
    } catch (certError) {
      // Log but don't fail the assignment if certification creation fails
      console.error('Error creating certification record:', certError);
    }

    return assignment;
  } finally {
    client.release();
  }
};

/**
 * Update an assignment
 */
export const updateAssignment = async (id, {
  analysisId,
  assignToType,
  departmentId,
  employeeId,
  treesAssigned,
  plantingType,
  notes,
}) => {
  const client = await pool.connect();
  try {
    // Verify available trees (excluding current assignment)
    if (treesAssigned) {
      const analysisResult = await client.query(
        'SELECT tree_count FROM analysis_results WHERE id = $1',
        [analysisId]
      );

      if (analysisResult.rows.length === 0) {
        throw new Error('Analysis not found');
      }

      const totalTrees = parseInt(analysisResult.rows[0].tree_count) || 0;

      const existingAssignmentsResult = await client.query(
        `SELECT COALESCE(SUM(trees_assigned), 0) as total_assigned
         FROM planting_record_assignments
         WHERE analysis_id = $1 AND id != $2`,
        [analysisId, id]
      );

      const totalAssigned = parseInt(existingAssignmentsResult.rows[0].total_assigned) || 0;
      const availableTrees = totalTrees - totalAssigned;

      if (treesAssigned > availableTrees) {
        throw new Error(`Not enough trees available. Available: ${availableTrees}, Requested: ${treesAssigned}`);
      }
    }

    const result = await client.query(`
      UPDATE planting_record_assignments 
      SET 
        analysis_id = COALESCE($1, analysis_id),
        assign_to_type = COALESCE($2, assign_to_type),
        department_id = CASE WHEN $2 = 'department' THEN $3 ELSE NULL END,
        employee_id = CASE WHEN $2 = 'employee' THEN $4 ELSE NULL END,
        trees_assigned = COALESCE($5, trees_assigned),
        planting_type = COALESCE($6, planting_type),
        notes = COALESCE($7, notes),
        updated_at = NOW()
      WHERE id = $8
      RETURNING id
    `, [
      analysisId || null,
      assignToType || null,
      assignToType === 'department' ? departmentId : null,
      assignToType === 'employee' ? employeeId : null,
      treesAssigned || null,
      plantingType || null,
      notes || null,
      id,
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    return await getAssignmentById(id);
  } finally {
    client.release();
  }
};

/**
 * Delete an assignment
 */
export const deleteAssignment = async (id) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'DELETE FROM planting_record_assignments WHERE id = $1 RETURNING id',
      [id]
    );

    return result.rows.length > 0;
  } finally {
    client.release();
  }
};

/**
 * Get available analyses for assignment
 */
export const getAvailableAnalyses = async (userId = null) => {
  const client = await pool.connect();
  try {
    let query = `
      SELECT 
        ar.id,
        ar.display_name,
        COALESCE(ar.display_name, 'Analysis ' || ar.id::text) as name,
        ar.analysis_date,
        ar.analysis_type,
        COALESCE(ar.tree_count, 0) as tree_count,
        COALESCE(ar.co2_equivalent_tonnes, 0) as co2_equivalent_tonnes,
        COALESCE(
          (SELECT SUM(trees_assigned) FROM planting_record_assignments WHERE analysis_id = ar.id),
          0
        ) as trees_assigned,
        COALESCE(ar.tree_count, 0) - COALESCE(
          (SELECT SUM(trees_assigned) FROM planting_record_assignments WHERE analysis_id = ar.id),
          0
        ) as trees_available
      FROM analysis_results ar
      WHERE ar.assigned_to_majmaah = true
        AND COALESCE(ar.tree_count, 0) > 0
    `;

    const params = [];
    if (userId) {
      query += `
        AND EXISTS (
          SELECT 1 FROM user_analysis_assignments uaa 
          WHERE uaa.analysis_id = ar.id AND uaa.user_id = $1
        )
      `;
      params.push(userId);
    }

    query += ` ORDER BY ar.analysis_date DESC, ar.id DESC`;

    const result = await client.query(query, params);
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      displayName: row.display_name,
      analysisDate: row.analysis_date,
      analysisType: row.analysis_type || 'Standard',
      treeCount: parseInt(row.tree_count) || 0,
      carbonTonnes: parseFloat(row.co2_equivalent_tonnes) || 0,
      treesAssigned: parseInt(row.trees_assigned) || 0,
      treesAvailable: Math.max(0, parseInt(row.trees_available) || 0),
    }));
  } catch (error) {
    console.error('Error getting available analyses:', error);
    return [];
  } finally {
    client.release();
  }
};
