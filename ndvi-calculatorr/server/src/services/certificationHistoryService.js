// Certification History Service - Handle certification database operations
import pool from '../config/database.js';

/**
 * Get all certifications
 */
export const getAllCertifications = async (userId = null) => {
  const client = await pool.connect();
  try {
    let query = `
      SELECT 
        ch.id,
        ch.certification_id,
        ch.certificate_type,
        ch.receiving_party_type,
        ch.department_id,
        ch.employee_id,
        ch.awarded_to_name,
        ch.trees_count,
        ch.carbon_sequestered,
        ch.date_awarded,
        ch.notes,
        ch.created_at,
        d.name_english as department_name_english,
        d.name_arabic as department_name_arabic,
        e.name as employee_name
      FROM certifications_history ch
      LEFT JOIN departments d ON ch.department_id = d.id
      LEFT JOIN employees e ON ch.employee_id = e.id
      WHERE 1=1
    `;

    const params = [];
    // Filter by user if provided (show only their department/employee certifications)
    if (userId) {
      // This would need user-department/employee relationship
      // For now, show all if user is admin, or filter by assignments
    }

    query += ` ORDER BY ch.date_awarded DESC`;

    const result = await client.query(query, params);
    return result.rows.map(row => ({
      id: row.id,
      certificationId: row.certification_id,
      certificateType: row.certificate_type,
      receivingPartyType: row.receiving_party_type,
      departmentId: row.department_id,
      departmentName: row.department_name_english,
      departmentNameArabic: row.department_name_arabic,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      awardedToName: row.awarded_to_name,
      treesCount: parseInt(row.trees_count) || 0,
      carbonSequestered: parseFloat(row.carbon_sequestered) || 0,
      dateAwarded: row.date_awarded,
      notes: row.notes,
      createdAt: row.created_at,
    }));
  } finally {
    client.release();
  }
};

/**
 * Get certification by ID
 */
export const getCertificationById = async (id) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        ch.*,
        d.name_english as department_name_english,
        e.name as employee_name
      FROM certifications_history ch
      LEFT JOIN departments d ON ch.department_id = d.id
      LEFT JOIN employees e ON ch.employee_id = e.id
      WHERE ch.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      certificationId: row.certification_id,
      certificateType: row.certificate_type,
      receivingPartyType: row.receiving_party_type,
      departmentId: row.department_id,
      departmentName: row.department_name_english,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      awardedToName: row.awarded_to_name,
      treesCount: parseInt(row.trees_count) || 0,
      carbonSequestered: parseFloat(row.carbon_sequestered) || 0,
      dateAwarded: row.date_awarded,
      notes: row.notes,
      createdAt: row.created_at,
    };
  } finally {
    client.release();
  }
};

/**
 * Create a new certification record
 */
export const createCertification = async ({
  certificateType,
  receivingPartyType,
  departmentId,
  employeeId,
  awardedToName,
  treesCount,
  carbonSequestered,
  issuedBy,
  notes,
}) => {
  const client = await pool.connect();
  try {
    // Generate certification ID
    const certIdResult = await client.query(`
      SELECT 'CERT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((COALESCE(MAX(id), 0) + 1)::TEXT, 6, '0') as cert_id
      FROM certifications_history
    `);
    const certificationId = certIdResult.rows[0].cert_id;

    const result = await client.query(`
      INSERT INTO certifications_history (
        certification_id, certificate_type, receiving_party_type,
        department_id, employee_id, awarded_to_name,
        trees_count, carbon_sequestered, issued_by, notes,
        date_awarded, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW())
      RETURNING *
    `, [
      certificationId,
      certificateType || 'trees',
      receivingPartyType,
      receivingPartyType === 'department' ? departmentId : null,
      receivingPartyType === 'employee' ? employeeId : null,
      awardedToName,
      treesCount || 0,
      carbonSequestered || 0,
      issuedBy || null,
      notes || null,
    ]);

    return await getCertificationById(result.rows[0].id);
  } finally {
    client.release();
  }
};
