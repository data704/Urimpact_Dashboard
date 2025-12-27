import { calculateMHI } from '../services/earthEngineService.js';

export const processMHI = async (req, res) => {
  try {
    const { coordinates } = req.body;
    const results = await calculateMHI(coordinates);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};