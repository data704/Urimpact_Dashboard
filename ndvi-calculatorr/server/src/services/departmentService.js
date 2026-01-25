// Department Service - Handle department database operations
import pool from '../config/database.js';

/**
 * Get all departments
 */
export const getAllDepartments = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        d.id,
        d.name_english,
        d.name_arabic,
        d.created_at,
        COUNT(e.id) as employees_count
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id
      GROUP BY d.id, d.name_english, d.name_arabic, d.created_at
      ORDER BY d.created_at DESC
    `);
    return result.rows.map(row => ({
      id: row.id,
      nameEnglish: row.name_english,
      nameArabic: row.name_arabic,
      employeesCount: parseInt(row.employees_count) || 0,
      treesPlanted: 0, // Placeholder - can be integrated later
      createdAt: row.created_at,
    }));
  } finally {
    client.release();
  }
};

/**
 * Get department by ID
 */
export const getDepartmentById = async (id) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        d.id,
        d.name_english,
        d.name_arabic,
        d.created_at,
        COUNT(e.id) as employees_count
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id
      WHERE d.id = $1
      GROUP BY d.id, d.name_english, d.name_arabic, d.created_at
    `, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      nameEnglish: row.name_english,
      nameArabic: row.name_arabic,
      employeesCount: parseInt(row.employees_count) || 0,
      treesPlanted: 0,
      createdAt: row.created_at,
    };
  } finally {
    client.release();
  }
};

/**
 * Create a new department
 */
export const createDepartment = async ({ nameEnglish, nameArabic }) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      INSERT INTO departments (name_english, name_arabic, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING *
    `, [nameEnglish, nameArabic || null]);
    
    const row = result.rows[0];
    return {
      id: row.id,
      nameEnglish: row.name_english,
      nameArabic: row.name_arabic,
      employeesCount: 0,
      treesPlanted: 0,
      createdAt: row.created_at,
    };
  } finally {
    client.release();
  }
};

/**
 * Update a department
 */
export const updateDepartment = async (id, { nameEnglish, nameArabic }) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      UPDATE departments 
      SET name_english = $1, name_arabic = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [nameEnglish, nameArabic || null, id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    // Get employee count
    const empResult = await client.query(
      'SELECT COUNT(*) as count FROM employees WHERE department_id = $1',
      [id]
    );
    
    return {
      id: row.id,
      nameEnglish: row.name_english,
      nameArabic: row.name_arabic,
      employeesCount: parseInt(empResult.rows[0].count) || 0,
      treesPlanted: 0,
      createdAt: row.created_at,
    };
  } finally {
    client.release();
  }
};

/**
 * Delete a department
 */
export const deleteDepartment = async (id) => {
  const client = await pool.connect();
  try {
    // First, set employees' department_id to NULL
    await client.query(
      'UPDATE employees SET department_id = NULL WHERE department_id = $1',
      [id]
    );
    
    // Then delete the department
    const result = await client.query(
      'DELETE FROM departments WHERE id = $1 RETURNING id',
      [id]
    );
    
    return result.rows.length > 0;
  } finally {
    client.release();
  }
};
