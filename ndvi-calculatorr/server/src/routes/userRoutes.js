// User Management Routes
import express from 'express';
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  login,
  getCurrentUser,
  assignAnalysisToUser,
  getUserAssignedAnalyses,
  unassignAnalysisFromUser,
  bulkAssignAnalysesToUser
} from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/auth/login', login);
router.get('/auth/me', authenticateToken, getCurrentUser);

// User CRUD (Admin only - add admin check middleware if needed)
router.post('/users', authenticateToken, createUser);
router.get('/users', authenticateToken, getAllUsers);
router.get('/users/:userId', authenticateToken, getUserById);
router.put('/users/:userId', authenticateToken, updateUser);
router.delete('/users/:userId', authenticateToken, deleteUser);

// User Analysis Assignments
router.post('/users/:userId/assign-analysis', authenticateToken, assignAnalysisToUser);
router.get('/users/:userId/assigned-analyses', authenticateToken, getUserAssignedAnalyses);
router.delete('/users/:userId/assignments/:analysisId', authenticateToken, unassignAnalysisFromUser);
router.post('/users/:userId/bulk-assign', authenticateToken, bulkAssignAnalysesToUser);

export default router;

