// Majmaah Dashboard API Routes
// Endpoints for fetching analysis data to display in Majmaah dashboard
import express from 'express';
import * as db from '../services/databaseService.js';
import {
  getUnassignedAnalyses,
  assignAnalysisToMajmaah,
  unassignAnalysisFromMajmaah,
  getAssignedAnalyses,
  bulkAssignAnalyses,
  updateAssignment,
  deleteAnalysis
} from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// ADMIN ROUTES (for managing assignments)
// ============================================

// Get all unassigned analyses
router.get('/admin/unassigned-analyses', getUnassignedAnalyses);

// Get all assigned analyses
router.get('/admin/assigned-analyses', getAssignedAnalyses);

// Assign single analysis to Majmaah
router.post('/admin/assign-to-majmaah', assignAnalysisToMajmaah);

// Bulk assign multiple analyses
router.post('/admin/bulk-assign', bulkAssignAnalyses);

// Unassign analysis from Majmaah
router.delete('/admin/unassign/:analysisId', unassignAnalysisFromMajmaah);

// Update assignment details
router.patch('/admin/assignment/:analysisId', updateAssignment);

// Delete analysis completely
router.delete('/admin/analysis/:analysisId', authenticateToken, deleteAnalysis);

// ============================================
// MAJMAAH DASHBOARD ROUTES (for displaying data)
// ============================================

/**
 * Get dashboard stats for stat cards
 * Returns: Trees Planted, Carbon, Survival Rate, Communities
 * Filters by user assignments if user is authenticated
 */
router.get('/majmaah/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    const { projectId = 1 } = req.query;
    const userId = req.user?.userId || null; // Get user ID from token
    
    const stats = await db.getMajmaahDashboardStats(parseInt(projectId), userId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get latest analysis details
 */
router.get('/majmaah/latest-analysis', authenticateToken, async (req, res) => {
  try {
    const { projectId = 1 } = req.query;
    const userId = req.user?.userId || null;
    const analysis = await db.getLatestAnalysis(parseInt(projectId), userId);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error getting latest analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get analysis history
 */
router.get('/majmaah/analysis-history', authenticateToken, async (req, res) => {
  try {
    const { projectId = 1, limit = 10 } = req.query;
    const userId = req.user?.userId || null;
    const analyses = await db.getMajmaahAnalyses(parseInt(projectId), userId);
    
    res.json({
      success: true,
      data: analyses.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error('Error getting analysis history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get carbon sequestration trends (for Carbon Chart)
 */
router.get('/majmaah/carbon-trends', authenticateToken, async (req, res) => {
  try {
    const { projectId = 1, months = 12 } = req.query;
    const userId = req.user?.userId || null;
    const trends = await db.getCarbonTrends(parseInt(projectId), parseInt(months), userId);
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error getting carbon trends:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get canopy coverage distribution (for Pie Chart)
 */
router.get('/majmaah/canopy-coverage', authenticateToken, async (req, res) => {
  try {
    const { projectId = 1 } = req.query;
    const userId = req.user?.userId || null;
    const data = await db.getCanopyCoverageDistribution(parseInt(projectId), userId);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting canopy coverage:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get species richness data (for Bar Chart)
 */
router.get('/majmaah/species-richness', authenticateToken, async (req, res) => {
  try {
    const { projectId = 1 } = req.query;
    const userId = req.user?.userId || null;
    const data = await db.getSpeciesRichnessData(parseInt(projectId), userId);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting species data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get ecosystem services scores (for Radar Chart)
 */
router.get('/majmaah/ecosystem-services', async (req, res) => {
  try {
    const { projectId = 1 } = req.query;
    const data = await db.getEcosystemServices(parseInt(projectId));
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting ecosystem services:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get vegetation health distribution (for Pie Chart)
 */
router.get('/majmaah/vegetation-health', async (req, res) => {
  try {
    const { projectId = 1 } = req.query;
    const data = await db.getVegetationHealthDistribution(parseInt(projectId));
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting vegetation health:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get survival rate trends (for Line Chart)
 */
router.get('/majmaah/survival-rate', async (req, res) => {
  try {
    const { projectId = 1 } = req.query;
    const data = await db.getSurvivalRateData(parseInt(projectId));
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting survival rate:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get growth and carbon impact data (for Composed Chart)
 */
router.get('/majmaah/growth-carbon-impact', async (req, res) => {
  try {
    const { projectId = 1, months = 12 } = req.query;
    const data = await db.getGrowthCarbonImpact(parseInt(projectId), parseInt(months));
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting growth carbon impact:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get tree data for map widget
 */
router.get('/majmaah/trees-for-map', authenticateToken, async (req, res) => {
  try {
    const { projectId = 1 } = req.query;
    const userId = req.user?.userId || null;
    const trees = await db.getMajmaahTreesForMap(parseInt(projectId), userId);
    
    res.json({
      success: true,
      data: trees
    });
  } catch (error) {
    console.error('Error getting trees for map:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get specific analysis by ID
 */
router.get('/majmaah/analysis/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;
    const analysis = await db.getAnalysisById(parseInt(analysisId));

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error getting analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get NDVI trends over time (for Line Chart)
 */
router.get('/majmaah/ndvi-trends', async (req, res) => {
  try {
    const { projectId = 1, months = 12 } = req.query;
    const trends = await db.getNDVITrends(parseInt(projectId), parseInt(months));
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error getting NDVI trends:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get EVI trends over time (for Line Chart)
 */
router.get('/majmaah/evi-trends', async (req, res) => {
  try {
    const { projectId = 1, months = 12 } = req.query;
    const trends = await db.getEVITrends(parseInt(projectId), parseInt(months));
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error getting EVI trends:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get Vegetation Health Index distribution (for Bar/Pie Chart)
 */
router.get('/majmaah/vegetation-health-index', async (req, res) => {
  try {
    const { projectId = 1 } = req.query;
    const data = await db.getVegetationHealthIndex(parseInt(projectId));
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting vegetation health index:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get Above Ground Carbon (AGC) trends over time (for Line Chart)
 */
router.get('/majmaah/agc-trends', async (req, res) => {
  try {
    const { projectId = 1, months = 12 } = req.query;
    const trends = await db.getAGCTrends(parseInt(projectId), parseInt(months));
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error getting AGC trends:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

