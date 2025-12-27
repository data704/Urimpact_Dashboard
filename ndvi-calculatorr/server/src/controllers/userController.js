// User Controller - Handle user management requests
import * as userService from '../services/userService.js';

/**
 * Create new user
 */
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required'
      });
    }
    
    const user = await userService.createUser({ name, email, password, role });
    
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create user'
    });
  }
};

/**
 * Get all users
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get users'
    });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await userService.getUserById(parseInt(userId));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user'
    });
  }
};

/**
 * Update user
 */
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = req.body;
    
    const user = await userService.updateUser(parseInt(userId), userData);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update user'
    });
  }
};

/**
 * Delete user
 */
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await userService.deleteUser(parseInt(userId));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete user'
    });
  }
};

/**
 * Authenticate user (login)
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    const authResult = await userService.authenticateUser(email, password);
    
    res.json({
      success: true,
      data: authResult
    });
  } catch (error) {
    console.error('Error authenticating user:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Invalid credentials'
    });
  }
};

/**
 * Get current user (from token)
 */
export const getCurrentUser = async (req, res) => {
  try {
    // User is already decoded by authenticateToken middleware
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const user = await userService.getUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active
      }
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user'
    });
  }
};

// ============================================
// USER ANALYSIS ASSIGNMENTS
// ============================================

/**
 * Assign analysis to user
 */
export const assignAnalysisToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { analysisId, notes } = req.body;
    const assignedBy = req.user?.userId || 1; // From auth middleware
    
    if (!analysisId) {
      return res.status(400).json({
        success: false,
        error: 'Analysis ID is required'
      });
    }
    
    const assignment = await userService.assignAnalysisToUser(
      parseInt(userId),
      parseInt(analysisId),
      assignedBy,
      notes
    );
    
    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Error assigning analysis to user:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to assign analysis'
    });
  }
};

/**
 * Get analyses assigned to user
 */
export const getUserAssignedAnalyses = async (req, res) => {
  try {
    const { userId } = req.params;
    const analyses = await userService.getUserAssignedAnalyses(parseInt(userId));
    
    res.json({
      success: true,
      data: analyses
    });
  } catch (error) {
    console.error('Error getting user assigned analyses:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get assigned analyses'
    });
  }
};

/**
 * Remove analysis assignment from user
 */
export const unassignAnalysisFromUser = async (req, res) => {
  try {
    const { userId, analysisId } = req.params;
    
    const result = await userService.unassignAnalysisFromUser(
      parseInt(userId),
      parseInt(analysisId)
    );
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Analysis unassigned successfully'
    });
  } catch (error) {
    console.error('Error unassigning analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to unassign analysis'
    });
  }
};

/**
 * Bulk assign analyses to user
 */
export const bulkAssignAnalysesToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { analysisIds } = req.body;
    const assignedBy = req.user?.userId || 1;
    
    if (!analysisIds || !Array.isArray(analysisIds)) {
      return res.status(400).json({
        success: false,
        error: 'Analysis IDs array is required'
      });
    }
    
    const assignments = await userService.bulkAssignAnalysesToUser(
      parseInt(userId),
      analysisIds,
      assignedBy
    );
    
    res.json({
      success: true,
      data: assignments,
      message: `${assignments.length} analyses assigned successfully`
    });
  } catch (error) {
    console.error('Error bulk assigning analyses:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to assign analyses'
    });
  }
};

