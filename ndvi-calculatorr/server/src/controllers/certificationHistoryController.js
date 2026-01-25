// Certification History Controller - Handle certification HTTP requests
import * as certificationService from '../services/certificationHistoryService.js';

/**
 * Get all certifications
 */
export const getAllCertifications = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || null;
    const certifications = await certificationService.getAllCertifications(userId);
    res.json({
      success: true,
      data: certifications,
    });
  } catch (error) {
    console.error('Error getting certifications:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get certifications',
    });
  }
};

/**
 * Get certification by ID
 */
export const getCertificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const certification = await certificationService.getCertificationById(parseInt(id));

    if (!certification) {
      return res.status(404).json({
        success: false,
        error: 'Certification not found',
      });
    }

    res.json({
      success: true,
      data: certification,
    });
  } catch (error) {
    console.error('Error getting certification:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get certification',
    });
  }
};

/**
 * Create a new certification
 */
export const createCertification = async (req, res) => {
  try {
    const {
      certificateType,
      receivingPartyType,
      departmentId,
      employeeId,
      awardedToName,
      treesCount,
      carbonSequestered,
      notes,
    } = req.body;

    if (!receivingPartyType || !['department', 'employee'].includes(receivingPartyType)) {
      return res.status(400).json({
        success: false,
        error: 'Receiving party type is required and must be "department" or "employee"',
      });
    }

    if (!awardedToName) {
      return res.status(400).json({
        success: false,
        error: 'Awarded to name is required',
      });
    }

    const userId = req.user?.userId || req.user?.id || null;

    const certification = await certificationService.createCertification({
      certificateType: certificateType || 'trees',
      receivingPartyType,
      departmentId: departmentId ? parseInt(departmentId) : null,
      employeeId: employeeId ? parseInt(employeeId) : null,
      awardedToName,
      treesCount: treesCount ? parseInt(treesCount) : 0,
      carbonSequestered: carbonSequestered ? parseFloat(carbonSequestered) : 0,
      issuedBy: userId,
      notes: notes || null,
    });

    res.status(201).json({
      success: true,
      data: certification,
    });
  } catch (error) {
    console.error('Error creating certification:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create certification',
    });
  }
};
