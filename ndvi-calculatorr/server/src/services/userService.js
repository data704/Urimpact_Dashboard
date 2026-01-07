// User Service - User management and authentication
import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ============================================
// USER CRUD OPERATIONS
// ============================================

/**
 * Create a new user
 */
export const createUser = async (userData) => {
  const { name, email, password, role = 'client' } = userData;

  const client = await pool.connect();
  try {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Auto-generate username from email (part before @)
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

    const result = await client.query(`
      INSERT INTO users (username, name, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id, username, name, email, role, is_active, created_at
    `, [username, name, email, passwordHash, role]);

    return result.rows[0];
  } finally {
    client.release();
  }
};
/**
 * Get all users
 */
export const getAllUsers = async () => {
  const result = await pool.query(`
    SELECT id, name, email, role, is_active, created_at, updated_at
    FROM users
    ORDER BY created_at DESC
  `);
  
  return result.rows;
};

/**
 * Get user by ID
 */
export const getUserById = async (userId) => {
  const result = await pool.query(`
    SELECT id, name, email, role, is_active, created_at, updated_at
    FROM users
    WHERE id = $1
  `, [userId]);
  
  return result.rows[0];
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email) => {
  const result = await pool.query(`
    SELECT id, name, email, password_hash, role, is_active
    FROM users
    WHERE email = $1
  `, [email]);
  
  return result.rows[0];
};

/**
 * Update user
 */
export const updateUser = async (userId, userData) => {
  const { name, email, password, role, is_active } = userData;
  const client = await pool.connect();
  
  try {
    let query = 'UPDATE users SET name = $1, email = $2';
    let params = [name, email];
    let paramIndex = 3;
    
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      query += `, password_hash = $${paramIndex}`;
      params.push(passwordHash);
      paramIndex++;
    }
    
    if (role !== undefined) {
      query += `, role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }
    
    if (is_active !== undefined) {
      query += `, is_active = $${paramIndex}`;
      params.push(is_active);
      paramIndex++;
    }
    
    query += `, updated_at = NOW() WHERE id = $${paramIndex} RETURNING id, name, email, role, is_active, created_at, updated_at`;
    params.push(userId);
    
    const result = await client.query(query, params);
    return result.rows[0];
  } finally {
    client.release();
  }
};

/**
 * Delete user
 */
export const deleteUser = async (userId) => {
  const result = await pool.query(`
    DELETE FROM users WHERE id = $1 RETURNING id
  `, [userId]);
  
  return result.rows[0];
};

// ============================================
// AUTHENTICATION
// ============================================

/**
 * Authenticate user and return JWT token
 */
export const authenticateUser = async (email, password) => {
  const user = await getUserByEmail(email);
  
  if (!user || !user.is_active) {
    throw new Error('Invalid credentials');
  }
  
  const isValid = await bcrypt.compare(password, user.password_hash);
  
  if (!isValid) {
    throw new Error('Invalid credentials');
  }
  
  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// ============================================
// USER ANALYSIS ASSIGNMENTS
// ============================================

/**
 * Assign analysis to user
 * IMPORTANT: A user can only have ONE analysis assigned at a time
 * If user already has an analysis assigned, the old assignment is removed and replaced with the new one
 */
export const assignAnalysisToUser = async (userId, analysisId, assignedBy, notes = null) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if user already has an analysis assigned
    const existingAssignment = await client.query(`
      SELECT id, analysis_id 
      FROM user_analysis_assignments 
      WHERE user_id = $1
    `, [userId]);
    
    // If user has an existing assignment (different analysis), remove it first
    if (existingAssignment.rows.length > 0) {
      const existingAnalysisId = existingAssignment.rows[0].analysis_id;
      
      // If trying to assign the same analysis, just update it
      if (existingAnalysisId === analysisId) {
        const result = await client.query(`
          UPDATE user_analysis_assignments
          SET assigned_at = NOW(), notes = $3, assigned_by = $4
          WHERE user_id = $1 AND analysis_id = $2
          RETURNING *
        `, [userId, analysisId, notes, assignedBy]);
        
        await client.query('COMMIT');
        return result.rows[0];
      }
      
      // Remove existing assignment (user can only have 1 analysis at a time)
      await client.query(`
        DELETE FROM user_analysis_assignments
        WHERE user_id = $1 AND analysis_id = $2
      `, [userId, existingAnalysisId]);
    }
    
    // Insert new assignment
    const result = await client.query(`
      INSERT INTO user_analysis_assignments (user_id, analysis_id, assigned_by, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [userId, analysisId, assignedBy, notes]);
    
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get all analyses assigned to a user
 */
export const getUserAssignedAnalyses = async (userId) => {
  const result = await pool.query(`
    SELECT 
      ua.id,
      ua.analysis_id,
      ua.assigned_at,
      ua.notes,
      ar.analysis_date,
      ar.analysis_type,
      ar.tree_count,
      ar.co2_equivalent_tonnes,
      ar.display_name,
      p.name as project_name
    FROM user_analysis_assignments ua
    JOIN analysis_results ar ON ua.analysis_id = ar.id
    JOIN projects p ON ar.project_id = p.id
    WHERE ua.user_id = $1
    ORDER BY ua.assigned_at DESC
  `, [userId]);
  
  return result.rows;
};

/**
 * Get all users assigned to an analysis
 */
export const getAnalysisAssignedUsers = async (analysisId) => {
  const result = await pool.query(`
    SELECT 
      ua.id,
      ua.user_id,
      ua.assigned_at,
      ua.notes,
      u.name,
      u.email,
      u.role
    FROM user_analysis_assignments ua
    JOIN users u ON ua.user_id = u.id
    WHERE ua.analysis_id = $1
    ORDER BY ua.assigned_at DESC
  `, [analysisId]);
  
  return result.rows;
};

/**
 * Remove analysis assignment from user
 */
export const unassignAnalysisFromUser = async (userId, analysisId) => {
  const result = await pool.query(`
    DELETE FROM user_analysis_assignments
    WHERE user_id = $1 AND analysis_id = $2
    RETURNING id
  `, [userId, analysisId]);
  
  return result.rows[0];
};

/**
 * Bulk assign analyses to user
 * IMPORTANT: A user can only have ONE analysis assigned at a time
 * This function will assign only the FIRST analysis and remove any existing assignments
 */
export const bulkAssignAnalysesToUser = async (userId, analysisIds, assignedBy) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Remove all existing assignments (user can only have 1 analysis)
    await client.query(`
      DELETE FROM user_analysis_assignments
      WHERE user_id = $1
    `, [userId]);
    
    // Assign only the first analysis (if provided)
    if (analysisIds.length > 0) {
      const analysisId = analysisIds[0]; // Only assign the first one
      const result = await client.query(`
        INSERT INTO user_analysis_assignments (user_id, analysis_id, assigned_by)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [userId, analysisId, assignedBy]);
      
      await client.query('COMMIT');
      return [result.rows[0]]; // Return array with single assignment
    }
    
    await client.query('COMMIT');
    return []; // No assignments made
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get analyses available to user (assigned analyses)
 */
export const getAnalysesForUser = async (userId) => {
  const result = await pool.query(`
    SELECT DISTINCT
      ar.id,
      ar.analysis_date,
      ar.analysis_type,
      ar.tree_count,
      ar.co2_equivalent_tonnes,
      ar.canopy_cover_percent,
      ar.ndvi_mean,
      ar.evi_mean,
      ar.display_name,
      p.name as project_name,
      p.id as project_id
    FROM user_analysis_assignments ua
    JOIN analysis_results ar ON ua.analysis_id = ar.id
    JOIN projects p ON ar.project_id = p.id
    WHERE ua.user_id = $1
    AND ar.assigned_to_majmaah = true
    ORDER BY ar.analysis_date DESC
  `, [userId]);
  
  return result.rows;
};

