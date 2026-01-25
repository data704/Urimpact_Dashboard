// API Service - Connect to NDVI Calculator Backend
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  // Generic GET request
  async get<T>(url: string): Promise<T> {
    const response = await this.client.get<T>(url);
    return response.data;
  }

  // Generic POST request
  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  // Generic PUT request
  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  // Generic DELETE request
  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }

  // ==================================================
  // MAJMAAH DASHBOARD ENDPOINTS (Real GEE Data)
  // ==================================================

  /**
   * Get user's assigned analyses (for dropdown selection)
   */
  async getMyAnalyses() {
    return this.get<{
      success: boolean;
      data: Array<{
        id: number;
        analysisId: number;
        displayName: string;
        analysisDate: string;
        treeCount?: number;
        carbonTonnes?: number;
        assignedAt?: string;
      }>;
    }>('/majmaah/my-analyses');
  }

  /**
   * Get dashboard stats (for 4 stat cards)
   */
  async getDashboardStats(projectId = 1, analysisId?: number | null) {
    const url = `/majmaah/dashboard-stats?projectId=${projectId}${analysisId ? `&analysisId=${analysisId}` : ''}`;
    return this.get<{
      success: boolean;
      data: {
        totalTrees: number;
        carbonSequestered: string;
        survivalRate: string;
        communitiesSupported: number;
      };
    }>(url);
  }

  /**
   * Get latest analysis details
   */
  async getLatestAnalysis(projectId = 1) {
    return this.get<{ success: boolean; data: any }>(`/majmaah/latest-analysis?projectId=${projectId}`);
  }

  /**
   * Get analysis by ID
   */
  async getAnalysisById(analysisId: number) {
    return this.get<{ success: boolean; data: any }>(`/majmaah/analysis/${analysisId}`);
  }

  /**
   * Get carbon sequestration trends (for Carbon Chart)
   */
  async getCarbonTrends(projectId = 1, months = 12, analysisId?: number | null) {
    const url = `/majmaah/carbon-trends?projectId=${projectId}&months=${months}${analysisId ? `&analysisId=${analysisId}` : ''}`;
    return this.get<{ success: boolean; data: Array<{ month: string; value: number }> }>(url);
  }

  /**
   * Get canopy coverage distribution (for Pie Chart)
   */
  async getCanopyCoverage(projectId = 1, analysisId?: number | null) {
    const url = `/majmaah/canopy-coverage?projectId=${projectId}${analysisId ? `&analysisId=${analysisId}` : ''}`;
    return this.get<{ success: boolean; data: Array<{ name: string; value: number }> }>(url);
  }

  /**
   * Get species richness data (for Bar Chart)
   */
  async getSpeciesRichness(projectId = 1, analysisId?: number | null) {
    const url = `/majmaah/species-richness?projectId=${projectId}${analysisId ? `&analysisId=${analysisId}` : ''}`;
    return this.get<{ success: boolean; data: Array<{ species: string; count: number }> }>(url);
  }

  /**
   * Get ecosystem services scores (for Radar Chart)
   */
  async getEcosystemServices(projectId = 1, analysisId?: number | null) {
    const url = `/majmaah/ecosystem-services?projectId=${projectId}${analysisId ? `&analysisId=${analysisId}` : ''}`;
    return this.get<{ success: boolean; data: Array<{ service: string; value: number }> }>(url);
  }

  /**
   * Get vegetation health distribution (for Pie Chart)
   */
  async getVegetationHealth(projectId = 1, analysisId?: number | null) {
    const url = `/majmaah/vegetation-health?projectId=${projectId}${analysisId ? `&analysisId=${analysisId}` : ''}`;
    return this.get<{ success: boolean; data: Array<{ condition: string; percentage: number }> }>(url);
  }

  /**
   * Get survival rate data (for Line Chart)
   */
  async getSurvivalRate(projectId = 1, analysisId?: number | null) {
    const url = `/majmaah/survival-rate?projectId=${projectId}${analysisId ? `&analysisId=${analysisId}` : ''}`;
    return this.get<{ success: boolean; data: Array<{ year: string; rate: number }> }>(url);
  }

  /**
   * Get growth and carbon impact (for Composed Chart)
   */
  async getGrowthCarbonImpact(projectId = 1, months = 12, analysisId?: number | null) {
    const url = `/majmaah/growth-carbon-impact?projectId=${projectId}&months=${months}${analysisId ? `&analysisId=${analysisId}` : ''}`;
    return this.get<{ success: boolean; data: Array<{ month: string; growth: number; carbon: number }> }>(url);
  }

  /**
   * Get tree data for map widget
   */
  async getTreesForMap(projectId = 1, analysisId?: number | null) {
    const url = `/majmaah/trees-for-map?projectId=${projectId}${analysisId ? `&analysisId=${analysisId}` : ''}`;
    return this.get<{ success: boolean; data: Array<any> }>(url);
  }

  /**
   * Get analysis history
   */
  async getAnalysisHistory(projectId = 1, limit = 10) {
    return this.get<{ success: boolean; data: Array<any> }>(
      `/majmaah/analysis-history?projectId=${projectId}&limit=${limit}`
    );
  }

  /**
   * Get NDVI trends over time (for Line Chart)
   */
  async getNDVITrends(projectId = 1, months = 12, analysisId?: number | null) {
    const url = `/majmaah/ndvi-trends?projectId=${projectId}&months=${months}${analysisId ? `&analysisId=${analysisId}` : ''}`;
    return this.get<{ success: boolean; data: Array<{ month: string; value: number }> }>(url);
  }

  /**
   * Get EVI trends over time (for Line Chart)
   */
  async getEVITrends(projectId = 1, months = 12, analysisId?: number | null) {
    const url = `/majmaah/evi-trends?projectId=${projectId}&months=${months}${analysisId ? `&analysisId=${analysisId}` : ''}`;
    return this.get<{ success: boolean; data: Array<{ month: string; value: number }> }>(url);
  }

  /**
   * Get Vegetation Health Index distribution (for Bar Chart)
   */
  async getVegetationHealthIndex(projectId = 1, analysisId?: number | null) {
    const url = `/majmaah/vegetation-health-index?projectId=${projectId}${analysisId ? `&analysisId=${analysisId}` : ''}`;
    return this.get<{ success: boolean; data: Array<{ category: string; value: number }> }>(url);
  }

  /**
   * Get Above Ground Carbon (AGC) trends over time (for Line Chart)
   */
  async getAGCTrends(projectId = 1, months = 12, analysisId?: number | null) {
    const url = `/majmaah/agc-trends?projectId=${projectId}&months=${months}${analysisId ? `&analysisId=${analysisId}` : ''}`;
    return this.get<{ success: boolean; data: Array<{ month: string; value: number }> }>(url);
  }

  // ==================================================
  // DEPARTMENT ENDPOINTS
  // ==================================================

  /**
   * Get all departments
   */
  async getDepartments() {
    return this.get<{
      success: boolean;
      data: Array<{
        id: number;
        nameEnglish: string;
        nameArabic?: string;
        employeesCount: number;
        treesPlanted: number;
        createdAt: string;
      }>;
    }>('/departments');
  }

  /**
   * Get department by ID
   */
  async getDepartmentById(id: number) {
    return this.get<{
      success: boolean;
      data: {
        id: number;
        nameEnglish: string;
        nameArabic?: string;
        employeesCount: number;
        treesPlanted: number;
        createdAt: string;
      };
    }>(`/departments/${id}`);
  }

  /**
   * Create a new department
   */
  async createDepartment(nameEnglish: string, nameArabic?: string) {
    return this.post<{
      success: boolean;
      data: {
        id: number;
        nameEnglish: string;
        nameArabic?: string;
        employeesCount: number;
        treesPlanted: number;
        createdAt: string;
      };
    }>('/departments', { nameEnglish, nameArabic });
  }

  /**
   * Update a department
   */
  async updateDepartment(id: number, nameEnglish: string, nameArabic?: string) {
    return this.put<{
      success: boolean;
      data: {
        id: number;
        nameEnglish: string;
        nameArabic?: string;
        employeesCount: number;
        treesPlanted: number;
        createdAt: string;
      };
    }>(`/departments/${id}`, { nameEnglish, nameArabic });
  }

  /**
   * Delete a department
   */
  async deleteDepartment(id: number) {
    return this.delete<{
      success: boolean;
      message: string;
    }>(`/departments/${id}`);
  }

  // ==================================================
  // EMPLOYEE ENDPOINTS
  // ==================================================

  /**
   * Get all employees
   */
  async getEmployees() {
    return this.get<{
      success: boolean;
      data: Array<{
        id: number;
        name: string;
        departmentId?: number;
        departmentNameEnglish?: string;
        departmentNameArabic?: string;
        createdAt: string;
      }>;
    }>('/employees');
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id: number) {
    return this.get<{
      success: boolean;
      data: {
        id: number;
        name: string;
        departmentId?: number;
        departmentNameEnglish?: string;
        departmentNameArabic?: string;
        createdAt: string;
      };
    }>(`/employees/${id}`);
  }

  /**
   * Create a new employee
   */
  async createEmployee(name: string, departmentId?: number) {
    return this.post<{
      success: boolean;
      data: {
        id: number;
        name: string;
        departmentId?: number;
        departmentNameEnglish?: string;
        departmentNameArabic?: string;
        createdAt: string;
      };
    }>('/employees', { name, departmentId });
  }

  /**
   * Update an employee
   */
  async updateEmployee(id: number, name: string, departmentId?: number) {
    return this.put<{
      success: boolean;
      data: {
        id: number;
        name: string;
        departmentId?: number;
        departmentNameEnglish?: string;
        departmentNameArabic?: string;
        createdAt: string;
      };
    }>(`/employees/${id}`, { name, departmentId });
  }

  /**
   * Delete an employee
   */
  async deleteEmployee(id: number) {
    return this.delete<{
      success: boolean;
      message: string;
    }>(`/employees/${id}`);
  }

  // ==================================================
  // PLANTING RECORD ASSIGNMENT ENDPOINTS
  // ==================================================

  /**
   * Get assignment statistics
   */
  async getAssignmentStatistics() {
    return this.get<{
      success: boolean;
      data: {
        totalTreesPlanted: number;
        totalTreesAssigned: number;
        carbonEstimate: number;
        averageGrowthRate: number;
      };
    }>('/planting-record-assignments/statistics');
  }

  /**
   * Get available analyses for assignment
   */
  async getAvailableAnalyses() {
    return this.get<{
      success: boolean;
      data: Array<{
        id: number;
        name: string;
        displayName?: string;
        analysisDate: string;
        analysisType: string;
        treeCount: number;
        carbonTonnes: number;
        treesAssigned: number;
        treesAvailable: number;
      }>;
    }>('/planting-record-assignments/available-analyses');
  }

  /**
   * Get all assignments
   */
  async getPlantingRecordAssignments(type?: 'department' | 'employee') {
    const url = type 
      ? `/planting-record-assignments?type=${type}`
      : '/planting-record-assignments';
    return this.get<{
      success: boolean;
      data: Array<{
        id: number;
        analysisId: number;
        plantingRecordName: string;
        plantingType: string;
        assignToType: 'department' | 'employee';
        departmentId?: number;
        departmentName?: string;
        departmentNameArabic?: string;
        employeeId?: number;
        employeeName?: string;
        treesAssigned: number;
        assignedCarbonEmission: number;
        notes?: string;
        createdAt: string;
      }>;
    }>(url);
  }

  /**
   * Get assignment by ID
   */
  async getPlantingRecordAssignmentById(id: number) {
    return this.get<{
      success: boolean;
      data: {
        id: number;
        analysisId: number;
        plantingRecordName: string;
        plantingType: string;
        assignToType: 'department' | 'employee';
        departmentId?: number;
        departmentName?: string;
        employeeId?: number;
        employeeName?: string;
        treesAssigned: number;
        assignedCarbonEmission: number;
        notes?: string;
        createdAt: string;
      };
    }>(`/planting-record-assignments/${id}`);
  }

  /**
   * Create a new assignment
   */
  async createPlantingRecordAssignment(data: {
    analysisId: number;
    assignToType: 'department' | 'employee';
    departmentId?: number;
    employeeId?: number;
    treesAssigned: number;
    plantingType?: string;
    notes?: string;
  }) {
    return this.post<{
      success: boolean;
      data: {
        id: number;
        analysisId: number;
        plantingRecordName: string;
        plantingType: string;
        assignToType: 'department' | 'employee';
        departmentId?: number;
        departmentName?: string;
        employeeId?: number;
        employeeName?: string;
        treesAssigned: number;
        assignedCarbonEmission: number;
        notes?: string;
        createdAt: string;
      };
    }>('/planting-record-assignments', data);
  }

  /**
   * Update an assignment
   */
  async updatePlantingRecordAssignment(
    id: number,
    data: {
      analysisId?: number;
      assignToType?: 'department' | 'employee';
      departmentId?: number;
      employeeId?: number;
      treesAssigned?: number;
      plantingType?: string;
      notes?: string;
    }
  ) {
    return this.put<{
      success: boolean;
      data: {
        id: number;
        analysisId: number;
        plantingRecordName: string;
        plantingType: string;
        assignToType: 'department' | 'employee';
        departmentId?: number;
        departmentName?: string;
        employeeId?: number;
        employeeName?: string;
        treesAssigned: number;
        assignedCarbonEmission: number;
        notes?: string;
        createdAt: string;
      };
    }>(`/planting-record-assignments/${id}`, data);
  }

  /**
   * Delete an assignment
   */
  async deletePlantingRecordAssignment(id: number) {
    return this.delete<{
      success: boolean;
      message: string;
    }>(`/planting-record-assignments/${id}`);
  }

  // ==================================================
  // CERTIFICATION HISTORY ENDPOINTS
  // ==================================================

  /**
   * Get all certifications
   */
  async getCertificationsHistory() {
    return this.get<{
      success: boolean;
      data: Array<{
        id: number;
        certificationId: string;
        certificateType: string;
        receivingPartyType: 'department' | 'employee';
        departmentId?: number;
        departmentName?: string;
        employeeId?: number;
        employeeName?: string;
        awardedToName: string;
        treesCount: number;
        carbonSequestered: number;
        dateAwarded: string;
        notes?: string;
        createdAt: string;
      }>;
    }>('/certifications-history');
  }

  /**
   * Get certification by ID
   */
  async getCertificationById(id: number) {
    return this.get<{
      success: boolean;
      data: {
        id: number;
        certificationId: string;
        certificateType: string;
        receivingPartyType: 'department' | 'employee';
        departmentId?: number;
        departmentName?: string;
        employeeId?: number;
        employeeName?: string;
        awardedToName: string;
        treesCount: number;
        carbonSequestered: number;
        dateAwarded: string;
        notes?: string;
        createdAt: string;
      };
    }>(`/certifications-history/${id}`);
  }
}

export const apiService = new ApiService();
export default apiService;

