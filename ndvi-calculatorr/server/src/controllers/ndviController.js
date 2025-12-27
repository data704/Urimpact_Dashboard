import { calculateNDVI } from '../services/earthEngineService.js';

export const processNDVI = async (req, res) => {
  try {
    const { coordinates } = req.body;
    const mapId = await calculateNDVI(coordinates);
    res.json(mapId);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};