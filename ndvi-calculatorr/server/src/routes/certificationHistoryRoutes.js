// Certification History Routes
import express from 'express';
import {
  getAllCertifications,
  getCertificationById,
  createCertification,
} from '../controllers/certificationHistoryController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all certifications
router.get('/certifications-history', getAllCertifications);

// Get certification by ID
router.get('/certifications-history/:id', getCertificationById);

// Create a new certification (usually done when certificates are generated)
router.post('/certifications-history', createCertification);

export default router;
