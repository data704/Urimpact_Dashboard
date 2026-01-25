// Employee Service - Handle employee database operations
import pool from '../config/database.js';

/**
 * Get all employees
 */
export const getAllEmployees = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        e.id,
        e.name,
        e.department_id,
        e.created_at,
        d.name_english as department_name_english,
        d.name_arabic as department_name_arabic
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY e.created_at DESC
    `);
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      departmentId: row.department_id,
      departmentNameEnglish: row.department_name_english,
      departmentNameArabic: row.department_name_arabic,
      createdAt: row.created_at,
    }));
  } finally {
    client.release();
  }
};

/**
 * Get employee by ID
 */
export const getEmployeeById = async (id) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        e.id,
        e.name,
        e.department_id,
        e.created_at,
        d.name_english as department_name_english,
        d.name_arabic as department_name_arabic
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      departmentId: row.department_id,
      departmentNameEnglish: row.department_name_english,
      departmentNameArabic: row.department_name_arabic,
      createdAt: row.created_at,
    };
  } finally {
    client.release();
  }
};

/**
 * Create a new employee
 */
export const createEmployee = async ({ name, departmentId }) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      INSERT INTO employees (name, department_id, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING *
    `, [name, departmentId || null]);
    
    // Fetch with department info
    const employee = await getEmployeeById(result.rows[0].id);
    return employee;
  } finally {
    client.release();
  }
};

/**
 * Update an employee
 */
export const updateEmployee = async (id, { name, departmentId }) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      UPDATE employees 
      SET name = $1, department_id = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING id
    `, [name, departmentId || null, id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return await getEmployeeById(id);
  } finally {
    client.release();
  }
};

/**
 * Delete an employee
 */
export const deleteEmployee = async (id) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'DELETE FROM employees WHERE id = $1 RETURNING id',
      [id]
    );
    
    return result.rows.length > 0;
  } finally {
    client.release();
  }
};
