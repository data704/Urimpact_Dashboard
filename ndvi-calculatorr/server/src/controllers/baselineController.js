// Baseline Assessment Controller
import { 
  performBaselineAssessment,
  analyzeSiteDefinition,
  analyzeExistingVegetation,
  estimateAGB,
  generateBaselineImagery,
  getWadiAlBathaAOI
} from '../services/baselineAssessmentService.js';
import { saveBaselineAssessment } from '../services/databaseService.js';

export const getBaselineAssessment = async (req, res) => {
  try {
    const { coordinates, vegetationMode, projectId = 1 } = req.body;
    
    // Perform GEE analysis (existing functionality)
    const results = await performBaselineAssessment(coordinates, { vegetationMode });
    
    // NEW: Save results to PostgreSQL database
    try {
      const analysisId = await saveBaselineAssessment({
        projectId,
        coordinates,
        siteDefinition: results.siteDefinition,
        existingVegetation: results.existingVegetation,
        agbEstimation: results.agbEstimation,
        baselineImagery: results.baselineImagery,
        fullResults: results
      });
      
      console.log(`✅ Baseline assessment saved to database (ID: ${analysisId})`);
      
      // Add analysis ID to response
      results.analysisId = analysisId;
      results.saved = true;
      
    } catch (dbError) {
      console.error('⚠️  Failed to save to database:', dbError);
      // Don't fail the request, just log the error
      results.saved = false;
      results.saveError = dbError.message;
    }
    
    res.json(results);
  } catch (error) {
    console.error('Baseline assessment error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getSiteDefinition = async (req, res) => {
  try {
    const { coordinates } = req.body;
    const results = await analyzeSiteDefinition(coordinates);
    res.json(results);
  } catch (error) {
    console.error('Site definition error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getExistingVegetation = async (req, res) => {
  try {
    const { coordinates } = req.body;
    const results = await analyzeExistingVegetation(coordinates);
    res.json(results);
  } catch (error) {
    console.error('Vegetation analysis error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAGBEstimation = async (req, res) => {
  try {
    const { coordinates } = req.body;
    const results = await estimateAGB(coordinates);
    res.json(results);
  } catch (error) {
    console.error('AGB estimation error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getBaselineImagery = async (req, res) => {
  try {
    const { coordinates } = req.body;
    const results = await generateBaselineImagery(coordinates);
    res.json(results);
  } catch (error) {
    console.error('Baseline imagery error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getDefaultAOI = async (req, res) => {
  try {
    const { getWadiAlBathaAOI } = await import('../services/baselineAssessmentService.js');
    const aoi = getWadiAlBathaAOI();
    res.json({ aoi });
  } catch (error) {
    console.error('Get AOI error:', error);
    res.status(500).json({ error: error.message });
  }
};

