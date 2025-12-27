// src/controllers/socController.js
import { calculateSOC } from '../services/earthEngineService.js';

export const processSOC = async (req, res) => {
  try {
    const { coordinates } = req.body;
    const results = await calculateSOC(coordinates);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};