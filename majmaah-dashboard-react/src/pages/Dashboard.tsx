import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { StatsOverview } from '@/components/widgets/StatsOverview';
import { ProjectImpactWidget } from '@/components/widgets/ProjectImpactWidget';
import {
  CarbonSequestrationChart,
  CanopyCoverageChart,
  NDVITrendsChart,
  EVITrendsChart,
  VegetationHealthChart,
  SurvivalRateChart,
  GrowthCarbonImpactChart,
  VegetationHealthIndexChart,
  AGCTrendsChart,
} from '@/components/widgets/ChartWidgets';
import { Download, RefreshCw, ChevronDown } from 'lucide-react';
import apiService from '@/services/api';
import { DynamicReportModal } from '@/components/DynamicReportModal';

interface Analysis {
  id: number;
  analysisId: number;
  displayName: string;
  analysisDate: string;
  treeCount?: number;
  carbonTonnes?: number;
}

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdvancedClient = user?.role === UserRole.ADVANCEDCLIENT;
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'real' | 'mock'>('mock');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<number | null>(null);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);

  // Fetch real data from NDVI backend
  const fetchRealData = async () => {
    setLoading(true);
    try {
      // Test connection to NDVI backend
      const response = await apiService.getDashboardStats();
      if (response.success) {
        setDataSource('real');
        setLastUpdated(new Date());
        console.log('✅ Connected to NDVI backend - using real GEE data');
      }
    } catch (error) {
      console.warn('⚠️  NDVI backend not available, using mock data');
      console.error('Connection error:', error);
      setDataSource('mock');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's assigned analyses
  const fetchUserAnalyses = async () => {
    setLoadingAnalyses(true);
    try {
      const response = await apiService.getMyAnalyses();
      if (response.success && response.data) {
        setAnalyses(response.data);
        // Auto-select first analysis if available
        if (response.data.length > 0 && !selectedAnalysisId) {
          setSelectedAnalysisId(response.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching user analyses:', error);
    } finally {
      setLoadingAnalyses(false);
    }
  };

  useEffect(() => {
    // Try to connect to real backend on mount
    fetchRealData();
    // Fetch user's assigned analyses
    fetchUserAnalyses();
  }, []);

  // When selected analysis changes, refresh dashboard data
  useEffect(() => {
    if (selectedAnalysisId) {
      fetchRealData();
    }
  }, [selectedAnalysisId]);

  const handleDownloadReport = () => {
    // Open modal to view PDF
    setIsReportModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header - Exact Filament Style (matching screenshot) */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
            {/* Analysis Selector Dropdown */}
            {analyses.length > 0 && (
              <div className="relative">
                <select
                  value={selectedAnalysisId || ''}
                  onChange={(e) => setSelectedAnalysisId(e.target.value ? parseInt(e.target.value) : null)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  disabled={loadingAnalyses}
                >
                  {analyses.map((analysis) => (
                    <option key={analysis.id} value={analysis.id}>
                      {analysis.displayName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>
          {/* Data Source Indicator */}
          <div className="flex items-center gap-2 mt-2">
            {loading ? (
              <span className="text-xs text-gray-500">{t('dashboard.connectingToBackend')}</span>
            ) : (
              <>
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                  dataSource === 'real' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    dataSource === 'real' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></span>
                  {dataSource === 'real' ? t('dashboard.liveGeeData') : t('dashboard.demoData')}
                </span>
                {lastUpdated && (
                  <span className="text-xs text-gray-500">
                    {t('common.updated')}: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
                <button
                  onClick={fetchRealData}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  title={t('common.refresh')}
                >
                  <RefreshCw size={12} />
                  {t('common.refresh')}
                </button>
              </>
            )}
          </div>
        </div>
        
        {isAdvancedClient && (
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors shadow-sm"
            style={{ background: '#3b82f6' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
          >
            <Download size={18} />
            {t('dashboard.generateDetailedReport')}
          </button>
        )}
      </div>

      {/* Stats Overview */}
      <StatsOverview selectedAnalysisId={selectedAnalysisId} />

      {/* Widgets for Advanced Client */}
      {isAdvancedClient && (
        <>
          {/* Project Impact Map (Full Width) */}
          <ProjectImpactWidget selectedAnalysisId={selectedAnalysisId} />

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GrowthCarbonImpactChart selectedAnalysisId={selectedAnalysisId} />
            <CarbonSequestrationChart selectedAnalysisId={selectedAnalysisId} />
            <CanopyCoverageChart selectedAnalysisId={selectedAnalysisId} />
            <NDVITrendsChart selectedAnalysisId={selectedAnalysisId} />
            <EVITrendsChart selectedAnalysisId={selectedAnalysisId} />
            <VegetationHealthChart selectedAnalysisId={selectedAnalysisId} />
            <SurvivalRateChart selectedAnalysisId={selectedAnalysisId} />
            <VegetationHealthIndexChart selectedAnalysisId={selectedAnalysisId} />
            <AGCTrendsChart selectedAnalysisId={selectedAnalysisId} />
          </div>

        </>
      )}

      {/* Widgets for Admin/Super Admin */}
      {!isAdvancedClient && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VegetationHealthIndexChart selectedAnalysisId={selectedAnalysisId} />
          <NDVITrendsChart selectedAnalysisId={selectedAnalysisId} />
          <CarbonSequestrationChart selectedAnalysisId={selectedAnalysisId} />
          <SurvivalRateChart selectedAnalysisId={selectedAnalysisId} />
        </div>
      )}

      {/* Dynamic Report Modal - Generates report with live dashboard data */}
      <DynamicReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        selectedAnalysisId={selectedAnalysisId}
      />
    </div>
  );
};

