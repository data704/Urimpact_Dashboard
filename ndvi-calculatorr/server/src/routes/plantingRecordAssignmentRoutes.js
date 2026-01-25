// Planting Record Assignment Routes
import express from 'express';
import {
  getAllAssignments,
  getAssignmentStatistics,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAvailableAnalyses,
} from '../controllers/plantingRecordAssignmentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get assignment statistics
router.get('/planting-record-assignments/statistics', getAssignmentStatistics);

// Get available analyses
router.get('/planting-record-assignments/available-analyses', getAvailableAnalyses);

// Get all assignments
router.get('/planting-record-assignments', getAllAssignments);

// Get assignment by ID
router.get('/planting-record-assignments/:id', getAssignmentById);

// Create a new assignment
router.post('/planting-record-assignments', createAssignment);

// Update an assignment
router.put('/planting-record-assignments/:id', updateAssignment);
router.patch('/planting-record-assignments/:id', updateAssignment);

// Delete an assignment
router.delete('/planting-record-assignments/:id', deleteAssignment);

export default router;
