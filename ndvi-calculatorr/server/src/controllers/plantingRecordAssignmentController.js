// Planting Record Assignment Controller - Handle assignment HTTP requests
import * as assignmentService from '../services/plantingRecordAssignmentService.js';

/**
 * Get all assignments
 */
export const getAllAssignments = async (req, res) => {
  try {
    const { type } = req.query; // 'department' or 'employee'
    const assignments = await assignmentService.getAllAssignments(type || null);
    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error('Error getting assignments:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get assignments',
    });
  }
};

/**
 * Get assignment statistics
 */
export const getAssignmentStatistics = async (req, res) => {
  try {
    // Get user ID from token if available
    const userId = req.user?.userId || req.user?.id || null;
    const stats = await assignmentService.getAssignmentStatistics(userId);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting assignment statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get statistics',
    });
  }
};

/**
 * Get assignment by ID
 */
export const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await assignmentService.getAssignmentById(parseInt(id));

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found',
      });
    }

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error('Error getting assignment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get assignment',
    });
  }
};

/**
 * Create a new assignment
 */
export const createAssignment = async (req, res) => {
  try {
    const {
      analysisId,
      assignToType,
      departmentId,
      employeeId,
      treesAssigned,
      plantingType,
      notes,
    } = req.body;

    if (!analysisId) {
      return res.status(400).json({
        success: false,
        error: 'Planting Record (Analysis ID) is required',
      });
    }

    if (!assignToType || !['department', 'employee'].includes(assignToType)) {
      return res.status(400).json({
        success: false,
        error: 'Assign To type is required and must be "department" or "employee"',
      });
    }

    if (assignToType === 'department' && !departmentId) {
      return res.status(400).json({
        success: false,
        error: 'Department is required when assigning to department',
      });
    }

    if (assignToType === 'employee' && !employeeId) {
      return res.status(400).json({
        success: false,
        error: 'Employee is required when assigning to employee',
      });
    }

    if (!treesAssigned || treesAssigned <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Number of trees must be greater than 0',
      });
    }

    const userId = req.user?.userId || req.user?.id || null;

    const assignment = await assignmentService.createAssignment({
      analysisId: parseInt(analysisId),
      assignToType,
      departmentId: departmentId ? parseInt(departmentId) : null,
      employeeId: employeeId ? parseInt(employeeId) : null,
      treesAssigned: parseInt(treesAssigned),
      plantingType: plantingType || null,
      notes: notes || null,
      assignedBy: userId,
    });

    res.status(201).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create assignment',
    });
  }
};

/**
 * Update an assignment
 */
export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      analysisId,
      assignToType,
      departmentId,
      employeeId,
      treesAssigned,
      plantingType,
      notes,
    } = req.body;

    const assignment = await assignmentService.updateAssignment(parseInt(id), {
      analysisId: analysisId ? parseInt(analysisId) : undefined,
      assignToType,
      departmentId: departmentId ? parseInt(departmentId) : undefined,
      employeeId: employeeId ? parseInt(employeeId) : undefined,
      treesAssigned: treesAssigned ? parseInt(treesAssigned) : undefined,
      plantingType,
      notes,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found',
      });
    }

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update assignment',
    });
  }
};

/**
 * Delete an assignment
 */
export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await assignmentService.deleteAssignment(parseInt(id));

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found',
      });
    }

    res.json({
      success: true,
      message: 'Assignment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete assignment',
    });
  }
};

/**
 * Get available analyses for assignment
 */
export const getAvailableAnalyses = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || null;
    const analyses = await assignmentService.getAvailableAnalyses(userId);
    res.json({
      success: true,
      data: analyses,
    });
  } catch (error) {
    console.error('Error getting available analyses:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get available analyses',
    });
  }
};
