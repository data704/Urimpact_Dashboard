// Admin Controller - Manage analysis assignments to Majmaah dashboard
import * as db from '../services/databaseService.js';

/**
 * Get all unassigned analyses
 * These are analyses that haven't been assigned to Majmaah dashboard yet
 */
export const getUnassignedAnalyses = async (req, res) => {
  try {
    const { projectId } = req.query;
    const analyses = await db.getUnassignedAnalyses(projectId ? parseInt(projectId) : null);
    
    console.log(`📊 Found ${analyses.length} unassigned analyses${projectId ? ` for project ${projectId}` : ''}`);
    
    res.json({
      success: true,
      data: analyses,
      count: analyses.length
    });
  } catch (error) {
    console.error('Error getting unassigned analyses:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

/**
 * Assign analysis to Majmaah dashboard
 * Makes the analysis visible to clients on Majmaah dashboard
 */
export const assignAnalysisToMajmaah = async (req, res) => {
  try {
    const { analysisId, displayName, notes } = req.body;
    
    if (!analysisId) {
      return res.status(400).json({
        success: false,
        error: 'Analysis ID is required'
      });
    }

    const adminId = req.user?.id || 1; // From auth middleware (or default)

    const result = await db.assignToMajmaah(
      analysisId,
      adminId,
      displayName || `Analysis ${analysisId}`,
      notes || ''
    );

    res.json({
      success: true,
      message: 'Analysis successfully assigned to Majmaah dashboard',
      data: result
    });
  } catch (error) {
    console.error('Error assigning analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Unassign analysis from Majmaah dashboard
 * Removes analysis from client view
 */
export const unassignAnalysisFromMajmaah = async (req, res) => {
  try {
    const { analysisId } = req.params;

    if (!analysisId) {
      return res.status(400).json({
        success: false,
        error: 'Analysis ID is required'
      });
    }

    const result = await db.unassignFromMajmaah(parseInt(analysisId));

    res.json({
      success: true,
      message: 'Analysis removed from Majmaah dashboard',
      data: result
    });
  } catch (error) {
    console.error('Error unassigning analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all analyses currently assigned to Majmaah
 */
export const getAssignedAnalyses = async (req, res) => {
  try {
    const { projectId } = req.query;
    const analyses = await db.getMajmaahAnalyses(projectId ? parseInt(projectId) : null);

    res.json({
      success: true,
      data: analyses,
      count: analyses.length
    });
  } catch (error) {
    console.error('Error getting assigned analyses:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Bulk assign multiple analyses
 */
export const bulkAssignAnalyses = async (req, res) => {
  try {
    const { analysisIds, displayPrefix = 'Assessment' } = req.body;

    if (!Array.isArray(analysisIds) || analysisIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'analysisIds array is required'
      });
    }

    const adminId = req.user?.id || 1;
    const results = [];

    for (let i = 0; i < analysisIds.length; i++) {
      const result = await db.assignToMajmaah(
        analysisIds[i],
        adminId,
        `${displayPrefix} ${i + 1}`,
        `Bulk assigned on ${new Date().toLocaleDateString()}`
      );
      results.push(result);
    }

    res.json({
      success: true,
      message: `${results.length} analyses assigned to Majmaah dashboard`,
      data: results
    });
  } catch (error) {
    console.error('Error in bulk assign:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update assignment details
 */
export const updateAssignment = async (req, res) => {
  try {
    const { analysisId } = req.params;
    const { displayName, notes, displayOrder } = req.body;

    const client = await db.pool.connect();
    try {
      if (displayName) {
        await client.query(`
          UPDATE analysis_results 
          SET display_name = $1, updated_at = NOW()
          WHERE id = $2
        `, [displayName, analysisId]);
      }

      if (notes !== undefined || displayOrder !== undefined) {
        await client.query(`
          UPDATE majmaah_assignments 
          SET notes = COALESCE($1, notes),
              display_order = COALESCE($2, display_order)
          WHERE analysis_id = $3
        `, [notes, displayOrder, analysisId]);
      }

      res.json({
        success: true,
        message: 'Assignment updated successfully'
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete analysis completely
 * Removes analysis from database and all related assignments
 */
export const deleteAnalysis = async (req, res) => {
  try {
    const { analysisId } = req.params;

    if (!analysisId) {
      return res.status(400).json({
        success: false,
        error: 'Analysis ID is required'
      });
    }

    const result = await db.deleteAnalysis(parseInt(analysisId));

    res.json({
      success: true,
      message: 'Analysis deleted successfully',
      data: result
    });
  } catch (error) {
    console.error('Error deleting analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

