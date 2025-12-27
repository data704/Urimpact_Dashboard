import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiService from '@/services/api';
import { config } from '@/config';

interface StatDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  statType: 'trees' | 'carbon' | 'survival' | 'communities' | null;
  data: any;
}

export const StatDetailModal: React.FC<StatDetailModalProps> = ({
  isOpen,
  onClose,
  statType,
  data,
}) => {
  const [loading, setLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && statType) {
      fetchDetailData();
    }
  }, [isOpen, statType]);

  const fetchDetailData = async () => {
    setLoading(true);
    try {
      // Fetch relevant data based on stat type
      switch (statType) {
        case 'trees':
          const speciesData = await apiService.getSpeciesRichness(config.app.projectId);
          const latestAnalysis = await apiService.getLatestAnalysis(config.app.projectId);
          setDetailData({
            ...data,
            speciesCount: speciesData.success ? speciesData.data.length : 'N/A',
            avgHealth: latestAnalysis.success ? latestAnalysis.data?.average_health_score || 'N/A' : 'N/A',
            treesChartData: speciesData.success ? speciesData.data.map((s: any) => ({ month: s.species, value: s.count })) : [],
          });
          break;
        case 'carbon':
          const carbonTrends = await apiService.getCarbonTrends(config.app.projectId, 12);
          setDetailData({
            ...data,
            carbonChartData: carbonTrends.success ? carbonTrends.data : [],
            annualRate: data?.carbonSequestration || data?.carbonSequestered || 'N/A',
          });
          break;
        case 'survival':
          const survivalData = await apiService.getSurvivalRate(config.app.projectId);
          setDetailData({
            ...data,
            survivalChartData: survivalData.success ? survivalData.data.map((s: any) => ({ month: s.year, value: s.rate })) : [],
            treesMonitored: data?.totalTrees || 'N/A',
          });
          break;
        case 'communities':
          setDetailData({
            ...data,
            localJobs: 12,
            communitiesChartData: [{ month: 'Jan', value: 8 }, { month: 'Feb', value: 9 }, { month: 'Mar', value: 10 }, { month: 'Apr', value: 11 }, { month: 'May', value: 12 }],
          });
          break;
      }
    } catch (error) {
      console.error('Error fetching detail data:', error);
      // Use provided data as fallback
      setDetailData(data);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !statType) return null;

  const getStatDetails = () => {
    const currentData = detailData || data;
    switch (statType) {
      case 'trees':
        return {
          title: 'Trees Planted - Detailed Information',
          description: 'Comprehensive breakdown of tree planting data',
          sections: [
            {
              label: 'Total Trees Detected',
              value: currentData?.treesPlanted || currentData?.totalTrees || 0,
              unit: 'trees',
            },
            {
              label: 'Trees by Species',
              value: currentData?.speciesCount || 'N/A',
              unit: 'species',
            },
            {
              label: 'Average Health Score',
              value: currentData?.avgHealth || 'N/A',
              unit: '/5.0',
            },
            {
              label: 'Detection Method',
              value: 'Satellite Imagery (GEE)',
              unit: '',
            },
          ],
          chartData: currentData?.treesChartData || [],
          chartLabel: 'Trees by Species',
        };
      case 'carbon':
        return {
          title: 'Carbon Sequestration - Detailed Information',
          description: 'Comprehensive carbon capture and storage analysis',
          sections: [
            {
              label: 'Total Carbon Sequestered',
              value: currentData?.carbonSequestration || currentData?.carbonSequestered || 0,
              unit: 'tons CO₂',
            },
            {
              label: 'Annual Rate',
              value: currentData?.annualRate || currentData?.carbonSequestration || 'N/A',
              unit: 'tons/year',
            },
            {
              label: 'Calculation Method',
              value: 'GEE AGC + SOC',
              unit: '',
            },
            {
              label: 'Equivalent to',
              value: `${((parseFloat(currentData?.carbonSequestration || currentData?.carbonSequestered || 0)) * 3.67).toFixed(2)}`,
              unit: 'tons CO₂ equivalent',
            },
          ],
          chartData: currentData?.carbonChartData || [],
          chartLabel: 'Carbon Sequestration Trends',
        };
      case 'survival':
        return {
          title: 'Survival Rate - Detailed Information',
          description: 'Tree survival and health monitoring data',
          sections: [
            {
              label: 'Current Survival Rate',
              value: `${currentData?.survivalRate || 0}%`,
              unit: '',
            },
            {
              label: 'Change from Last Month',
              value: '+5%',
              unit: '',
            },
            {
              label: 'Trees Monitored',
              value: currentData?.treesMonitored || currentData?.treesPlanted || currentData?.totalTrees || 'N/A',
              unit: 'trees',
            },
            {
              label: 'Monitoring Period',
              value: '12 months',
              unit: '',
            },
          ],
          chartData: currentData?.survivalChartData || [],
          chartLabel: 'Survival Rate Over Time',
        };
      case 'communities':
        return {
          title: 'Communities Supported - Detailed Information',
          description: 'Social and economic impact metrics',
          sections: [
            {
              label: 'Communities Supported',
              value: currentData?.communitiesSupported || 0,
              unit: 'communities',
            },
            {
              label: 'Local Jobs Created',
              value: currentData?.localJobs || '12',
              unit: 'jobs',
            },
            {
              label: 'Economic Value',
              value: '$8,500',
              unit: 'USD',
            },
            {
              label: 'Research Projects',
              value: '4',
              unit: 'projects',
            },
          ],
          chartData: currentData?.communitiesChartData || [],
          chartLabel: 'Community Impact Over Time',
        };
      default:
        return null;
    }
  };

  const details = getStatDetails();
  if (!details) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-4xl mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{details.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{details.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
              <p className="text-gray-600 ml-4">Loading detailed information...</p>
            </div>
          )}

          {!loading && details && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {details.sections.map((section, idx) => (
              <div
                key={idx}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <p className="text-xs font-medium text-gray-600 mb-1">{section.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {typeof section.value === 'number' ? section.value.toLocaleString() : section.value}
                </p>
                {section.unit && (
                  <p className="text-xs text-gray-500 mt-1">{section.unit}</p>
                )}
              </div>
            ))}
          </div>

          {/* Chart */}
          {details.chartData.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{details.chartLabel}</h3>
              <ResponsiveContainer width="100%" height={300}>
                {statType === 'survival' ? (
                  <LineChart data={details.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} name="Survival Rate (%)" />
                  </LineChart>
                ) : (
                  <BarChart data={details.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#3b82f6" name={statType === 'trees' ? 'Trees' : statType === 'carbon' ? 'CO₂ (tons)' : 'Count'} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

              {/* Additional Information */}
              <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Additional Information</h4>
                <p className="text-sm text-blue-800">
                  {statType === 'trees' && 'Tree detection is performed using Google Earth Engine (GEE) satellite imagery analysis. The system identifies individual trees and calculates health metrics based on NDVI and other vegetation indices.'}
                  {statType === 'carbon' && 'Carbon sequestration is calculated using Above Ground Carbon (AGC) and Soil Organic Carbon (SOC) estimates from GEE analysis. Values are converted to CO₂ equivalent using standard conversion factors.'}
                  {statType === 'survival' && 'Survival rate is monitored through regular satellite analysis and field verification. The rate reflects the percentage of trees that remain healthy and growing over the monitoring period.'}
                  {statType === 'communities' && 'Community impact metrics include local employment opportunities, economic value generation, and research collaboration projects initiated through the tree planting program.'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

