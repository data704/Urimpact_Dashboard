// Employee Controller - Handle employee HTTP requests
import * as employeeService from '../services/employeeService.js';

/**
 * Get all employees
 */
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await employeeService.getAllEmployees();
    res.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error('Error getting employees:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get employees',
    });
  }
};

/**
 * Get employee by ID
 */
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await employeeService.getEmployeeById(parseInt(id));
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }
    
    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error('Error getting employee:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get employee',
    });
  }
};

/**
 * Create a new employee
 */
export const createEmployee = async (req, res) => {
  try {
    const { name, departmentId } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Employee name is required',
      });
    }
    
    const employee = await employeeService.createEmployee({
      name: name.trim(),
      departmentId: departmentId ? parseInt(departmentId) : null,
    });
    
    res.status(201).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create employee',
    });
  }
};

/**
 * Update an employee
 */
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, departmentId } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Employee name is required',
      });
    }
    
    const employee = await employeeService.updateEmployee(parseInt(id), {
      name: name.trim(),
      departmentId: departmentId ? parseInt(departmentId) : null,
    });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }
    
    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update employee',
    });
  }
};

/**
 * Delete an employee
 */
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await employeeService.deleteEmployee(parseInt(id));
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Employee deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete employee',
    });
  }
};
