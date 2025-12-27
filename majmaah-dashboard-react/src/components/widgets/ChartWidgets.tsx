// All chart widgets in one file for efficiency
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { WidgetCard } from './WidgetCard';
import {
  mockCarbonSequestrationData,
  mockCanopyCoverageData,
  mockSpeciesRichnessData,
  mockEcosystemServicesData,
  mockVegetationHealthData,
  mockSurvivalRateData,
  mockGrowthCarbonImpactData,
  mockPlantingRecordsData,
  mockNDVITrendsData,
  mockEVITrendsData,
  mockVegetationHealthIndexData,
  mockAGCTrendsData,
} from '@/services/mockData';
import apiService from '@/services/api';
import { config } from '@/config';

const COLORS = ['#10b981', '#22c55e', '#3b82f6', '#f59e0b'];

// Carbon Sequestration Chart
export const CarbonSequestrationChart: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(mockCarbonSequestrationData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiService.getCarbonTrends(config.app.projectId, 12);
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          setData(response.data as typeof mockCarbonSequestrationData);
          console.log('✅ Using real GEE data for carbon trends');
        }
      } catch (error) {
        console.warn('⚠️  Using mock carbon trends data (backend not available)');
        setData(mockCarbonSequestrationData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <WidgetCard title={t('dashboard.carbonSequestrationChart')}>
        <div className="h-[300px] animate-pulse bg-gray-100 rounded-xl" />
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title={t('dashboard.carbonSequestrationChart')}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} name={t('dashboard.chartLabels.co2')} />
        </LineChart>
      </ResponsiveContainer>
    </WidgetCard>
  );
};

// Canopy Coverage Chart
export const CanopyCoverageChart: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(mockCanopyCoverageData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiService.getCanopyCoverage(config.app.projectId);
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          setData(response.data as typeof mockCanopyCoverageData);
          console.log('✅ Using real GEE data for canopy coverage');
        }
      } catch (error) {
        console.warn('⚠️  Using mock canopy coverage data (backend not available)');
        setData(mockCanopyCoverageData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <WidgetCard title={t('dashboard.canopyCoverageChart')}>
        <div className="h-[300px] animate-pulse bg-gray-100 rounded-xl" />
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title={t('dashboard.canopyCoverageChart')}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </WidgetCard>
  );
};

// Species Richness Chart
export const SpeciesRichnessChart: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(mockSpeciesRichnessData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiService.getSpeciesRichness(config.app.projectId);
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          setData(response.data as typeof mockSpeciesRichnessData);
          console.log('✅ Using real GEE data for species richness');
        }
      } catch (error) {
        console.warn('⚠️  Using mock species richness data (backend not available)');
        setData(mockSpeciesRichnessData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <WidgetCard title={t('dashboard.speciesRichnessChart')}>
        <div className="h-[300px] animate-pulse bg-gray-100 rounded-xl" />
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title={t('dashboard.speciesRichnessChart')}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="species" stroke="#6b7280" angle={-45} textAnchor="end" height={100} />
          <YAxis stroke="#6b7280" />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#13c5bc" name={t('dashboard.chartLabels.treeCount')} />
        </BarChart>
      </ResponsiveContainer>
    </WidgetCard>
  );
};

// Ecosystem Services Chart
export const EcosystemServicesChart: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(mockEcosystemServicesData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiService.getEcosystemServices(config.app.projectId);
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          setData(response.data as typeof mockEcosystemServicesData);
          console.log('✅ Using real GEE data for ecosystem services');
        }
      } catch (error) {
        console.warn('⚠️  Using mock ecosystem services data (backend not available)');
        setData(mockEcosystemServicesData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <WidgetCard title={t('dashboard.ecosystemServicesChart')}>
        <div className="h-[300px] animate-pulse bg-gray-100 rounded-xl" />
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title={t('dashboard.ecosystemServicesChart')}>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="service" stroke="#6b7280" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" />
          <Radar name={t('dashboard.chartLabels.impactScore')} dataKey="value" stroke="#13c5bc" fill="#13c5bc" fillOpacity={0.6} />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </WidgetCard>
  );
};

// Vegetation Health Chart
export const VegetationHealthChart: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(mockVegetationHealthData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiService.getVegetationHealth(config.app.projectId);
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          setData(response.data as typeof mockVegetationHealthData);
          console.log('✅ Using real GEE data for vegetation health');
        }
      } catch (error) {
        console.warn('⚠️  Using mock vegetation health data (backend not available)');
        setData(mockVegetationHealthData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <WidgetCard title={t('dashboard.vegetationHealthChart')}>
        <div className="h-[300px] animate-pulse bg-gray-100 rounded-xl" />
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title={t('dashboard.vegetationHealthChart')}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="percentage" label>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </WidgetCard>
  );
};

// Survival Rate Chart
export const SurvivalRateChart: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(mockSurvivalRateData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiService.getSurvivalRate(config.app.projectId);
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          setData(response.data as typeof mockSurvivalRateData);
          console.log('✅ Using real GEE data for survival rate');
        }
      } catch (error) {
        console.warn('⚠️  Using mock survival rate data (backend not available)');
        setData(mockSurvivalRateData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <WidgetCard title={t('dashboard.survivalRateChart')}>
        <div className="h-[300px] animate-pulse bg-gray-100 rounded-xl" />
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title={t('dashboard.survivalRateChart')}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="year" stroke="#6b7280" />
          <YAxis stroke="#6b7280" domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={3} name={t('dashboard.chartLabels.survivalRate')} />
        </LineChart>
      </ResponsiveContainer>
    </WidgetCard>
  );
};

// Growth & Carbon Impact Chart
export const GrowthCarbonImpactChart: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(mockGrowthCarbonImpactData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiService.getGrowthCarbonImpact(config.app.projectId, 12);
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          setData(response.data as typeof mockGrowthCarbonImpactData);
          console.log('✅ Using real GEE data for growth & carbon impact');
        }
      } catch (error) {
        console.warn('⚠️  Using mock growth & carbon impact data (backend not available)');
        setData(mockGrowthCarbonImpactData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <WidgetCard title={t('dashboard.growthCarbonImpactChart')}>
        <div className="h-[300px] animate-pulse bg-gray-100 rounded-xl" />
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title={t('dashboard.growthCarbonImpactChart')}>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#6b7280" />
          <YAxis yAxisId="left" stroke="#6b7280" />
          <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="carbon" fill="#3b82f6" name={t('dashboard.chartLabels.carbon')} />
          <Line yAxisId="right" type="monotone" dataKey="growth" stroke="#10b981" strokeWidth={2} name={t('dashboard.chartLabels.growth')} />
        </ComposedChart>
      </ResponsiveContainer>
    </WidgetCard>
  );
};

// Planting Records Chart
export const PlantingRecordsChart: React.FC = () => {
  const { t } = useTranslation();
  const [data] = useState(mockPlantingRecordsData);

  // Currently no dedicated backend endpoint for planting records chart,
  // so we keep using mock data while the rest of the dashboard is real.

  return (
    <WidgetCard title={t('dashboard.plantingRecordsOverview', { defaultValue: 'Planting Records Overview' })}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip />
          <Legend />
          <Bar dataKey="records" fill="#13c5bc" name={t('dashboard.chartLabels.records')} />
        </BarChart>
      </ResponsiveContainer>
    </WidgetCard>
  );
};

// NDVI Trends Chart (replacing Species Distribution)
export const NDVITrendsChart: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(mockNDVITrendsData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiService.getNDVITrends(config.app.projectId, 12);
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          setData(response.data as typeof mockNDVITrendsData);
          console.log('✅ Using real GEE data for NDVI trends');
        }
      } catch (error) {
        console.warn('⚠️  Using mock NDVI trends data (backend not available)');
        setData(mockNDVITrendsData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <WidgetCard title={t('dashboard.ndviTrendsChart')}>
        <div className="h-[300px] animate-pulse bg-gray-100 rounded-xl" />
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title={t('dashboard.ndviTrendsChart')}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#6b7280" />
          <YAxis stroke="#6b7280" domain={[-1, 1]} />
          <Tooltip 
            formatter={(value: number) => [value.toFixed(3), t('dashboard.chartLabels.ndvi')]}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#10b981" 
            strokeWidth={2} 
            name={t('dashboard.chartLabels.ndvi')} 
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </WidgetCard>
  );
};

// EVI Trends Chart (replacing Ecosystem Services Impact)
export const EVITrendsChart: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(mockEVITrendsData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiService.getEVITrends(config.app.projectId, 12);
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          setData(response.data as typeof mockEVITrendsData);
          console.log('✅ Using real GEE data for EVI trends');
        }
      } catch (error) {
        console.warn('⚠️  Using mock EVI trends data (backend not available)');
        setData(mockEVITrendsData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <WidgetCard title={t('dashboard.eviTrendsChart')}>
        <div className="h-[300px] animate-pulse bg-gray-100 rounded-xl" />
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title={t('dashboard.eviTrendsChart')}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#6b7280" />
          <YAxis stroke="#6b7280" domain={[-1, 1]} />
          <Tooltip 
            formatter={(value: number) => [value.toFixed(3), t('dashboard.chartLabels.evi')]}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#3b82f6" 
            strokeWidth={2} 
            name={t('dashboard.chartLabels.evi')} 
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </WidgetCard>
  );
};

// Vegetation Health Index Chart (replacing Planting Records Overview)
export const VegetationHealthIndexChart: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(mockVegetationHealthIndexData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiService.getVegetationHealthIndex(config.app.projectId);
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          setData(response.data as typeof mockVegetationHealthIndexData);
          console.log('✅ Using real GEE data for vegetation health index');
        }
      } catch (error) {
        console.warn('⚠️  Using mock vegetation health index data (backend not available)');
        setData(mockVegetationHealthIndexData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <WidgetCard title={t('dashboard.vegetationHealthIndexChart')}>
        <div className="h-[300px] animate-pulse bg-gray-100 rounded-xl" />
      </WidgetCard>
    );
  }

  // Color mapping for health categories
  const healthColors: { [key: string]: string } = {
    'Excellent': '#10b981',
    'Good': '#22c55e',
    'Moderate': '#f59e0b',
    'Fair': '#f97316',
    'Poor': '#ef4444',
  };

  // Translate category names
  const translatedData = data.map(entry => ({
    ...entry,
    category: t(`dashboard.healthCategories.${entry.category.toLowerCase()}`)
  }));

  return (
    <WidgetCard title={t('dashboard.vegetationHealthIndexChart')}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={translatedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="category" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip 
            formatter={(value: number) => [`${value}%`, t('dashboard.chartLabels.coverage')]}
          />
          <Legend />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} name={t('dashboard.chartLabels.percentage')}>
            {translatedData.map((entry, index) => {
              const originalCategory = data[index]?.category || entry.category;
              return (
                <Cell key={`cell-${index}`} fill={healthColors[originalCategory] || '#13c5bc'} />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </WidgetCard>
  );
};

// Above Ground Carbon (AGC) Trends Chart
export const AGCTrendsChart: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(mockAGCTrendsData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiService.getAGCTrends(config.app.projectId, 12);
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          setData(response.data as typeof mockAGCTrendsData);
          console.log('✅ Using real GEE data for AGC trends');
        }
      } catch (error) {
        console.warn('⚠️  Using mock AGC trends data (backend not available)');
        setData(mockAGCTrendsData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <WidgetCard title={t('dashboard.agcTrendsChart')}>
        <div className="h-[300px] animate-pulse bg-gray-100 rounded-xl" />
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title={t('dashboard.agcTrendsChart')}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip 
            formatter={(value: number) => [`${value.toFixed(2)} ${t('common.tons')}`, t('dashboard.chartLabels.agc')]}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#f59e0b" 
            strokeWidth={2} 
            name={t('dashboard.chartLabels.agc')} 
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </WidgetCard>
  );
};

