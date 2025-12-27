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

  // ==================================================
  // MAJMAAH DASHBOARD ENDPOINTS (Real GEE Data)
  // ==================================================

  /**
   * Get dashboard stats (for 4 stat cards)
   */
  async getDashboardStats(projectId = 1) {
    return this.get<{
      success: boolean;
      data: {
        totalTrees: number;
        carbonSequestered: string;
        survivalRate: string;
        communitiesSupported: number;
      };
    }>(`/majmaah/dashboard-stats?projectId=${projectId}`);
  }

  /**
   * Get latest analysis details
   */
  async getLatestAnalysis(projectId = 1) {
    return this.get<{ success: boolean; data: any }>(`/majmaah/latest-analysis?projectId=${projectId}`);
  }

  /**
   * Get carbon sequestration trends (for Carbon Chart)
   */
  async getCarbonTrends(projectId = 1, months = 12) {
    return this.get<{ success: boolean; data: Array<{ month: string; value: number }> }>(
      `/majmaah/carbon-trends?projectId=${projectId}&months=${months}`
    );
  }

  /**
   * Get canopy coverage distribution (for Pie Chart)
   */
  async getCanopyCoverage(projectId = 1) {
    return this.get<{ success: boolean; data: Array<{ name: string; value: number }> }>(
      `/majmaah/canopy-coverage?projectId=${projectId}`
    );
  }

  /**
   * Get species richness data (for Bar Chart)
   */
  async getSpeciesRichness(projectId = 1) {
    return this.get<{ success: boolean; data: Array<{ species: string; count: number }> }>(
      `/majmaah/species-richness?projectId=${projectId}`
    );
  }

  /**
   * Get ecosystem services scores (for Radar Chart)
   */
  async getEcosystemServices(projectId = 1) {
    return this.get<{ success: boolean; data: Array<{ service: string; value: number }> }>(
      `/majmaah/ecosystem-services?projectId=${projectId}`
    );
  }

  /**
   * Get vegetation health distribution (for Pie Chart)
   */
  async getVegetationHealth(projectId = 1) {
    return this.get<{ success: boolean; data: Array<{ condition: string; percentage: number }> }>(
      `/majmaah/vegetation-health?projectId=${projectId}`
    );
  }

  /**
   * Get survival rate data (for Line Chart)
   */
  async getSurvivalRate(projectId = 1) {
    return this.get<{ success: boolean; data: Array<{ year: string; rate: number }> }>(
      `/majmaah/survival-rate?projectId=${projectId}`
    );
  }

  /**
   * Get growth and carbon impact (for Composed Chart)
   */
  async getGrowthCarbonImpact(projectId = 1, months = 12) {
    return this.get<{ success: boolean; data: Array<{ month: string; growth: number; carbon: number }> }>(
      `/majmaah/growth-carbon-impact?projectId=${projectId}&months=${months}`
    );
  }

  /**
   * Get tree data for map widget
   */
  async getTreesForMap(projectId = 1) {
    return this.get<{ success: boolean; data: Array<any> }>(
      `/majmaah/trees-for-map?projectId=${projectId}`
    );
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
  async getNDVITrends(projectId = 1, months = 12) {
    return this.get<{ success: boolean; data: Array<{ month: string; value: number }> }>(
      `/majmaah/ndvi-trends?projectId=${projectId}&months=${months}`
    );
  }

  /**
   * Get EVI trends over time (for Line Chart)
   */
  async getEVITrends(projectId = 1, months = 12) {
    return this.get<{ success: boolean; data: Array<{ month: string; value: number }> }>(
      `/majmaah/evi-trends?projectId=${projectId}&months=${months}`
    );
  }

  /**
   * Get Vegetation Health Index distribution (for Bar Chart)
   */
  async getVegetationHealthIndex(projectId = 1) {
    return this.get<{ success: boolean; data: Array<{ category: string; value: number }> }>(
      `/majmaah/vegetation-health-index?projectId=${projectId}`
    );
  }

  /**
   * Get Above Ground Carbon (AGC) trends over time (for Line Chart)
   */
  async getAGCTrends(projectId = 1, months = 12) {
    return this.get<{ success: boolean; data: Array<{ month: string; value: number }> }>(
      `/majmaah/agc-trends?projectId=${projectId}&months=${months}`
    );
  }
}

export const apiService = new ApiService();
export default apiService;

