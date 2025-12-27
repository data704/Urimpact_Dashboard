import {calculateAGC} from '../services/earthEngineService.js';

export const processAGC = async (req, res) => {
  try {
    const { coordinates } = req.body;
    const results = await calculateAGC(coordinates);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};