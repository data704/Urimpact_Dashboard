// Employee Routes
import express from 'express';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employeeController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all employees
router.get('/employees', getAllEmployees);

// Get employee by ID
router.get('/employees/:id', getEmployeeById);

// Create a new employee
router.post('/employees', createEmployee);

// Update an employee
router.put('/employees/:id', updateEmployee);
router.patch('/employees/:id', updateEmployee);

// Delete an employee
router.delete('/employees/:id', deleteEmployee);

export default router;
