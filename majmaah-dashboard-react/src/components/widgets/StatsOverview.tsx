import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatCard } from './StatCard';
import { Sprout, Cloud, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { mockAdvancedClientStats, mockAdminStats } from '@/services/mockData';
import apiService from '@/services/api';
import { config } from '@/config';
import { StatDetailModal } from '@/components/StatDetailModal';

export const StatsOverview: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState(mockAdvancedClientStats);
  const [loading, setLoading] = useState(true);
  const [useRealData, setUseRealData] = useState(false);
  const [selectedStat, setSelectedStat] = useState<'trees' | 'carbon' | 'survival' | 'communities' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    fetchRealStats();
  }, []);

  const fetchRealStats = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDashboardStats(config.app.projectId);
      
      if (response.success && response.data) {
        const realStats = {
          treesPlanted: response.data.totalTrees || 0,
          carbonSequestration: parseFloat(response.data.carbonSequestered) || 0,
          survivalRate: parseFloat(response.data.survivalRate) || 0,
          communitiesSupported: response.data.communitiesSupported || 0
        };
        
        setStats(realStats);
        setUseRealData(true);
        console.log('✅ Using real GEE data for stats');
      }
    } catch (error) {
      console.warn('⚠️  Using mock data (backend not available)');
      setStats(mockAdvancedClientStats);
      setUseRealData(false);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }
  
  const handleStatClick = async (statType: 'trees' | 'carbon' | 'survival' | 'communities') => {
    setSelectedStat(statType);
    setIsModalOpen(true);
  };

  // Show different stats based on user role
  if (user?.role === UserRole.ADVANCEDCLIENT) {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            label={t('dashboard.treesPlanted')}
            value={stats.treesPlanted.toLocaleString()}
            description={useRealData ? t('dashboard.fromSatelliteDetection') : t('dashboard.totalPlantedTrees')}
            descriptionIcon={<Sprout size={16} />}
            chart={[7, 12, 18, 15, 22, 28, 35]}
            chartColor="#10b981"
            clickable={true}
            onClick={() => handleStatClick('trees')}
          />
          <StatCard
            label={t('dashboard.carbonSequestration')}
            value={`${stats.carbonSequestration.toFixed(2)} ${t('common.tons')}`}
            description={useRealData ? t('dashboard.geeAgcSocCalculation') : t('dashboard.annualCarbonSequestration')}
            descriptionIcon={<Cloud size={16} />}
            chart={[5, 10, 15, 20, 25, 30, 35]}
            chartColor="#3b82f6"
            clickable={true}
            onClick={() => handleStatClick('carbon')}
          />
          <StatCard
            label={t('dashboard.survivalRate')}
            value={`${stats.survivalRate.toFixed(1)}%`}
            description={t('dashboard.fromLastMonth')}
            descriptionIcon={<TrendingUp size={16} />}
            chart={[3, 5, 8, 6, 9, 12, 15]}
            chartColor="#f59e0b"
            clickable={true}
            onClick={() => handleStatClick('survival')}
          />
          <StatCard
            label={t('dashboard.communitiesSupported')}
            value={stats.communitiesSupported}
            description={t('dashboard.localJobs')}
            descriptionIcon={<Users size={16} />}
            chart={[1, 2, 3, 5, 6, 7, 8]}
            chartColor="#13c5bc"
            clickable={true}
            onClick={() => handleStatClick('communities')}
          />
        </div>

        {/* Stat Detail Modal */}
        <StatDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedStat(null);
          }}
          statType={selectedStat}
          data={stats}
        />
      </>
    );
  }

  // Admin stats (still using mock for now)
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <StatCard
        label={t('dashboard.plantingRecords', { defaultValue: 'Planting Records' })}
        value={mockAdminStats.plantingRecords.toLocaleString()}
        description={t('dashboard.totalPlantedTreesAdmin')}
        chart={[7, 12, 18, 15, 22, 28, 35]}
        chartColor="#10b981"
      />
      <StatCard
        label={t('dashboard.speciesLibraries', { defaultValue: 'Species Libraries' })}
        value={mockAdminStats.speciesLibraries}
        description={t('dashboard.speciesInLibrary')}
        chart={[5, 10, 15, 20, 25, 30, 35]}
        chartColor="#3b82f6"
      />
      <StatCard
        label={t('dashboard.crew', { defaultValue: 'Crew' })}
        value={mockAdminStats.crewMembers}
        description={t('dashboard.specializedFieldCrew')}
        chart={[3, 5, 8, 6, 9, 12, 15]}
        chartColor="#f59e0b"
      />
    </div>
  );
};

