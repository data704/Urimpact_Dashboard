// Baseline Assessment Routes
import express from 'express';
import {
  getBaselineAssessment,
  getSiteDefinition,
  getExistingVegetation,
  getAGBEstimation,
  getBaselineImagery,
  getDefaultAOI
} from '../controllers/baselineController.js';

const router = express.Router();

router.post('/baseline-assessment', getBaselineAssessment);
router.post('/site-definition', getSiteDefinition);
router.post('/existing-vegetation', getExistingVegetation);
router.post('/agb-estimation', getAGBEstimation);
router.post('/baseline-imagery', getBaselineImagery);
router.get('/default-aoi', getDefaultAOI);

export default router;

