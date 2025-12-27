// mhiRoutes.js
import express from 'express';
import { calculateMHI } from '../services/earthEngineService.js';

const router = express.Router();

router.post('/calculate-mhi', async (req, res) => {
  try {
    console.log('Received MHI calculation request');
    const { coordinates } = req.body;
    
    if (!coordinates || !Array.isArray(coordinates)) {
      throw new Error('Invalid coordinates format');
    }

    console.log('Processing coordinates:', coordinates.length, 'points');
    console.log('Coordinate bounds:', {
      minLon: Math.min(...coordinates.map(c => c[0])),
      maxLon: Math.max(...coordinates.map(c => c[0])),
      minLat: Math.min(...coordinates.map(c => c[1])),
      maxLat: Math.max(...coordinates.map(c => c[1])),
    });

    const results = await calculateMHI(coordinates);
    console.log('MHI calculation completed with results:', results);
    res.json(results);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

export default router;