// Department Routes
import express from 'express';
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all departments
router.get('/departments', getAllDepartments);

// Get department by ID
router.get('/departments/:id', getDepartmentById);

// Create a new department
router.post('/departments', createDepartment);

// Update a department
router.put('/departments/:id', updateDepartment);
router.patch('/departments/:id', updateDepartment);

// Delete a department
router.delete('/departments/:id', deleteDepartment);

export default router;
