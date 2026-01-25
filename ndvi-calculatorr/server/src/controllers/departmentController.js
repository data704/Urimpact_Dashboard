// Department Controller - Handle department HTTP requests
import * as departmentService from '../services/departmentService.js';

/**
 * Get all departments
 */
export const getAllDepartments = async (req, res) => {
  try {
    const departments = await departmentService.getAllDepartments();
    res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error('Error getting departments:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get departments',
    });
  }
};

/**
 * Get department by ID
 */
export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await departmentService.getDepartmentById(parseInt(id));
    
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found',
      });
    }
    
    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Error getting department:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get department',
    });
  }
};

/**
 * Create a new department
 */
export const createDepartment = async (req, res) => {
  try {
    const { nameEnglish, nameArabic } = req.body;
    
    if (!nameEnglish || nameEnglish.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Name (English) is required',
      });
    }
    
    const department = await departmentService.createDepartment({
      nameEnglish: nameEnglish.trim(),
      nameArabic: nameArabic?.trim() || null,
    });
    
    res.status(201).json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create department',
    });
  }
};

/**
 * Update a department
 */
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { nameEnglish, nameArabic } = req.body;
    
    if (!nameEnglish || nameEnglish.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Name (English) is required',
      });
    }
    
    const department = await departmentService.updateDepartment(parseInt(id), {
      nameEnglish: nameEnglish.trim(),
      nameArabic: nameArabic?.trim() || null,
    });
    
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found',
      });
    }
    
    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update department',
    });
  }
};

/**
 * Delete a department
 */
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await departmentService.deleteDepartment(parseInt(id));
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Department not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete department',
    });
  }
};
