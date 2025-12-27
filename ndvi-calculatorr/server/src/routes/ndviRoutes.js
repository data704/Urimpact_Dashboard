import express from 'express';
import { calculateNDVI } from '../services/earthEngineService.js';

const router = express.Router();

router.post('/calculate-ndvi', async (req, res) => {
  try {
    console.log('Received NDVI calculation request');
    const { coordinates } = req.body;
    const mapId = await calculateNDVI(coordinates);
    console.log('Sending response:', mapId);
    res.json(mapId);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;