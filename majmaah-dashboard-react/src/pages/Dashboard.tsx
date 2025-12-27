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
import { Download, RefreshCw } from 'lucide-react';
import apiService from '@/services/api';
import { DynamicReportModal } from '@/components/DynamicReportModal';

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdvancedClient = user?.role === UserRole.ADVANCEDCLIENT;
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'real' | 'mock'>('mock');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

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

  useEffect(() => {
    // Try to connect to real backend on mount
    fetchRealData();
  }, []);

  const handleDownloadReport = () => {
    // Open modal to view PDF
    setIsReportModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header - Exact Filament Style (matching screenshot) */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
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
      <StatsOverview />

      {/* Widgets for Advanced Client */}
      {isAdvancedClient && (
        <>
          {/* Project Impact Map (Full Width) */}
          <ProjectImpactWidget />

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GrowthCarbonImpactChart />
            <CarbonSequestrationChart />
            <CanopyCoverageChart />
            <NDVITrendsChart />
            <EVITrendsChart />
            <VegetationHealthChart />
            <SurvivalRateChart />
            <VegetationHealthIndexChart />
            <AGCTrendsChart />
          </div>

          {/* Community Impact Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="widget-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.communityEngagement')}</h3>
              <p className="text-3xl font-bold text-primary-600">1,254</p>
              <p className="text-sm text-gray-600 mt-2">{t('dashboard.volunteersParticipated')}</p>
            </div>
            <div className="widget-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.educationalPrograms')}</h3>
              <p className="text-3xl font-bold text-primary-600">48</p>
              <p className="text-sm text-gray-600 mt-2">{t('dashboard.workshopsConducted')}</p>
            </div>
            <div className="widget-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.researchPublications')}</h3>
              <p className="text-3xl font-bold text-primary-600">12</p>
              <p className="text-sm text-gray-600 mt-2">{t('dashboard.papersPublished')}</p>
            </div>
          </div>
        </>
      )}

      {/* Widgets for Admin/Super Admin */}
      {!isAdvancedClient && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VegetationHealthIndexChart />
          <NDVITrendsChart />
          <CarbonSequestrationChart />
          <SurvivalRateChart />
        </div>
      )}

      {/* Dynamic Report Modal - Generates report with live dashboard data */}
      <DynamicReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};

