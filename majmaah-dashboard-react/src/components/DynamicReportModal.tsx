import React, { useEffect, useState, useRef } from 'react';
import { X, Download, Loader2, FileText, TrendingUp, Users, Droplets, FlaskConical, Leaf, Bug, Bird, Sprout, CheckCircle2, Target, GraduationCap, Satellite, BarChart3, TreePine } from 'lucide-react';
import apiService from '@/services/api';
import { config } from '@/config';
import html2pdf from 'html2pdf.js';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

interface DashboardData {
  stats: {
    totalTrees: number;
    carbonSequestered: string;
    survivalRate: string;
    communitiesSupported: number;
  };
  carbonTrends: Array<{ month: string; value: number }>;
  canopyCoverage: Array<{ name: string; value: number }>;
  speciesRichness: Array<{ species: string; count: number }>;
  ecosystemServices: Array<{ service: string; value: number }>;
  vegetationHealth: Array<{ condition: string; percentage: number }>;
  survivalRate: Array<{ year: string; rate: number }>;
  growthCarbonImpact: Array<{ month: string; growth: number; carbon: number }>;
  ndviTrends?: Array<{ month: string; value: number }>;
  eviTrends?: Array<{ month: string; value: number }>;
  vegetationHealthIndex?: Array<{ category: string; value: number }>;
  agcTrends?: Array<{ month: string; value: number }>;
}

interface DynamicReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Color constants matching PDF design
const COLORS = {
  primary: '#13c5bc',
  primaryDark: '#0ea5a0',
  primaryLight: '#e0f7f6',
  primaryLighter: '#f0fdf9',
  text: '#1f2937',
  textLight: '#6b7280',
  textMuted: '#9ca3af',
  background: '#ffffff',
  backgroundLight: '#f8fafc',
  backgroundCard: '#f1f5f9',
  border: '#e5e7eb',
  success: '#10b981',
  successLight: '#d1fae5',
};

const nativeSpeciesList = [
  'Phoenix dactylifera (Date Palm)',
  'Acacia gerrardii (Talh)',
  'Ziziphus spina-christi (Sidr)',
  'Prosopis cineraria (Ghaf)',
  'Olea europaea (Olive)',
];

// Reusable style objects
const styles = {
  page: {
    backgroundColor: COLORS.background,
    padding: '40px 50px',
    pageBreakAfter: 'always' as const,
    minHeight: '100%',
  },
  sectionTitle: {
    fontSize: '32px',
    fontWeight: '700' as const,
    color: COLORS.primary,
    marginBottom: '8px',
    letterSpacing: '-0.5px',
  },
  sectionUnderline: {
    width: '60px',
    height: '4px',
    backgroundColor: COLORS.primary,
    marginBottom: '24px',
    borderRadius: '2px',
  },
  sectionSubtitle: {
    fontSize: '18px',
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: '16px',
  },
  sectionDescription: {
    fontSize: '14px',
    color: COLORS.textLight,
    marginBottom: '24px',
    lineHeight: '1.6',
  },
  card: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '20px',
  },
  statValue: {
    fontSize: '36px',
    fontWeight: '700' as const,
    color: COLORS.primary,
    lineHeight: '1.2',
  },
  statLabel: {
    fontSize: '13px',
    color: COLORS.textLight,
    marginTop: '4px',
  },
  highlightBox: {
    backgroundColor: COLORS.primaryLighter,
    borderLeft: `4px solid ${COLORS.primary}`,
    padding: '16px 20px',
    borderRadius: '0 8px 8px 0',
    marginBottom: '20px',
  },
  highlightTitle: {
    fontSize: '15px',
    fontWeight: '600' as const,
    color: COLORS.primary,
    marginBottom: '12px',
  },
  tag: {
    display: 'inline-block',
    padding: '8px 16px',
    border: `1px solid ${COLORS.primaryLight}`,
    borderRadius: '20px',
    fontSize: '13px',
    color: COLORS.primary,
    marginRight: '10px',
    marginBottom: '10px',
    backgroundColor: COLORS.background,
  },
  tableHeader: {
    fontSize: '13px',
    fontWeight: '600' as const,
    color: COLORS.primary,
    padding: '12px 16px',
    textAlign: 'left' as const,
    borderBottom: `2px solid ${COLORS.border}`,
    backgroundColor: COLORS.backgroundLight,
  },
  tableCell: {
    fontSize: '13px',
    color: COLORS.text,
    padding: '12px 16px',
    borderBottom: `1px solid ${COLORS.border}`,
  },
  iconCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: COLORS.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  twoColumnGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  chartCard: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: '8px',
    padding: '20px',
  },
  chartTitle: {
    fontSize: '15px',
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: '16px',
  },
};

export const DynamicReportModal: React.FC<DynamicReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDashboardData();
    }
  }, [isOpen]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [
        statsResponse,
        carbonTrendsResponse,
        canopyCoverageResponse,
        speciesRichnessResponse,
        ecosystemServicesResponse,
        vegetationHealthResponse,
        survivalRateResponse,
        growthCarbonImpactResponse,
        ndviTrendsResponse,
        eviTrendsResponse,
        vegetationHealthIndexResponse,
        agcTrendsResponse,
      ] = await Promise.allSettled([
        apiService.getDashboardStats(config.app.projectId),
        apiService.getCarbonTrends(config.app.projectId, 12),
        apiService.getCanopyCoverage(config.app.projectId),
        apiService.getSpeciesRichness(config.app.projectId),
        apiService.getEcosystemServices(config.app.projectId),
        apiService.getVegetationHealth(config.app.projectId),
        apiService.getSurvivalRate(config.app.projectId),
        apiService.getGrowthCarbonImpact(config.app.projectId, 12),
        apiService.getNDVITrends(config.app.projectId, 12).catch(() => null),
        apiService.getEVITrends(config.app.projectId, 12).catch(() => null),
        apiService.getVegetationHealthIndex(config.app.projectId).catch(() => null),
        apiService.getAGCTrends(config.app.projectId, 12).catch(() => null),
      ]);

      const dashboardData: DashboardData = {
        stats: statsResponse.status === 'fulfilled' && statsResponse.value.success
          ? statsResponse.value.data
          : { totalTrees: 0, carbonSequestered: '0.00', survivalRate: '0.0', communitiesSupported: 0 },
        carbonTrends: carbonTrendsResponse.status === 'fulfilled' && carbonTrendsResponse.value.success
          ? carbonTrendsResponse.value.data
          : [],
        canopyCoverage: canopyCoverageResponse.status === 'fulfilled' && canopyCoverageResponse.value.success
          ? canopyCoverageResponse.value.data
          : [],
        speciesRichness: speciesRichnessResponse.status === 'fulfilled' && speciesRichnessResponse.value.success
          ? speciesRichnessResponse.value.data
          : [],
        ecosystemServices: ecosystemServicesResponse.status === 'fulfilled' && ecosystemServicesResponse.value.success
          ? ecosystemServicesResponse.value.data
          : [],
        vegetationHealth: vegetationHealthResponse.status === 'fulfilled' && vegetationHealthResponse.value.success
          ? vegetationHealthResponse.value.data
          : [],
        survivalRate: survivalRateResponse.status === 'fulfilled' && survivalRateResponse.value.success
          ? survivalRateResponse.value.data
          : [],
        growthCarbonImpact: growthCarbonImpactResponse.status === 'fulfilled' && growthCarbonImpactResponse.value.success
          ? growthCarbonImpactResponse.value.data
          : [],
        ndviTrends: ndviTrendsResponse.status === 'fulfilled' && ndviTrendsResponse.value?.success
          ? ndviTrendsResponse.value.data
          : undefined,
        eviTrends: eviTrendsResponse.status === 'fulfilled' && eviTrendsResponse.value?.success
          ? eviTrendsResponse.value.data
          : undefined,
        vegetationHealthIndex: vegetationHealthIndexResponse.status === 'fulfilled' && vegetationHealthIndexResponse.value?.success
          ? vegetationHealthIndexResponse.value.data
          : undefined,
        agcTrends: agcTrendsResponse.status === 'fulfilled' && agcTrendsResponse.value?.success
          ? agcTrendsResponse.value.data
          : undefined,
      };

      setData(dashboardData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current || !data) return;

    try {
      setLoading(true);
      
      const opt = {
        margin: [0, 0, 0, 0] as [number, number, number, number],
        filename: `URIMPACT_Advanced_Tier_Report_Majmaah_University_Tree_Planting_Project_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak: { mode: 'css' as const },
      };

      await html2pdf().set(opt).from(reportRef.current).save();
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!reportRef.current) return;
    window.print();
  };

  // Calculate derived metrics
  const getAnnualCarbon = () => {
    if (!data || !data.carbonTrends.length) return '18';
    const latest = data.carbonTrends[data.carbonTrends.length - 1];
    return parseFloat(latest.value.toString()).toFixed(0);
  };

  const getLifetimeCarbon = () => {
    const annual = parseFloat(getAnnualCarbon());
    return (annual * 25).toFixed(0);
  };

  const getCarbonBySpecies = () => {
    if (!data || !data.speciesRichness.length) return [];
    const totalTrees = data.speciesRichness.reduce((sum, s) => sum + s.count, 0);
    const annualCarbon = parseFloat(getAnnualCarbon());
    return data.speciesRichness.map(s => ({
      name: s.species,
      value: parseFloat(((s.count / totalTrees) * annualCarbon).toFixed(1)),
    }));
  };

  const getAverageHeightGrowth = () => {
    if (!data || !data.growthCarbonImpact || !data.growthCarbonImpact.length) return '0';
    const avgGrowth = data.growthCarbonImpact.reduce((sum, g) => sum + (g.growth || 0), 0) / data.growthCarbonImpact.length;
    return avgGrowth.toFixed(1);
  };

  const getBiodiversityScore = () => {
    if (!data || !data.ecosystemServices.length) return 78;
    const avgScore = data.ecosystemServices.reduce((sum, e) => sum + e.value, 0) / data.ecosystemServices.length;
    return Math.round(avgScore);
  };

  const getImpactSummaryData = () => {
    if (!data) return [];
    const summary = [];
    
    const annualCarbon = parseFloat(getAnnualCarbon());
    const carbonScore = Math.min(100, Math.round((annualCarbon / 20) * 100));
    summary.push({ name: 'Carbon Sequestration', value: carbonScore });
    
    const biodiversityScore = getBiodiversityScore();
    summary.push({ name: 'Biodiversity', value: biodiversityScore });
    
    const survivalRateNum = parseFloat(data.stats.survivalRate || '0');
    summary.push({ name: 'Survival Rate', value: Math.round(survivalRateNum) });
    
    if (data.ecosystemServices && data.ecosystemServices.length > 0) {
      const avgEcoService = Math.round(data.ecosystemServices.reduce((sum, e) => sum + e.value, 0) / data.ecosystemServices.length);
      summary.push({ name: 'Ecosystem Health', value: avgEcoService });
    }
    
    return summary;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 overflow-y-auto">
      <div className="relative w-full max-w-6xl mx-4 my-8 bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex items-center gap-3">
            <FileText className="text-[#13c5bc]" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">URIMPACT Advanced Tier Report</h2>
              <p className="text-sm text-gray-500">Majmaah University Tree Planting Project</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!loading && data && (
              <>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Print
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#13c5bc] rounded-lg hover:bg-[#0ea5a0] transition-colors"
                >
                  <Download size={18} />
                  Download PDF
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-[#13c5bc] mb-4" size={48} />
              <p className="text-gray-600">Loading dashboard data...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">{error}</p>
              <button
                onClick={fetchDashboardData}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && data && (
            <div ref={reportRef} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: COLORS.text, lineHeight: '1.6', backgroundColor: COLORS.background }}>
              
              {/* ==================== PAGE 1: COVER PAGE ==================== */}
              <div style={{ 
                background: 'linear-gradient(180deg, #e6f4f3 0%, #eef7f6 25%, #f3f9f9 50%, #f7fbfb 75%, #fafcfc 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                minHeight: '1120px',
                padding: '80px 60px',
                pageBreakAfter: 'always',
                boxSizing: 'border-box',
              }}>
                {/* Logo - Large centered */}
                <div style={{ marginBottom: '60px' }}>
                  <img 
                    src="/assets/img/URIMPACT_LOGO.png" 
                    alt="URIMPACT Logo"
                    style={{ 
                      width: '500px', 
                      height: 'auto',
                      maxWidth: '100%',
                    }}
                  />
                </div>

                {/* Main Title */}
                <h1 style={{ 
                  fontSize: '44px', 
                  fontWeight: '700', 
                  color: COLORS.primary,
                  marginBottom: '20px',
                  letterSpacing: '-0.5px',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}>
                  URIMPACT Sample Report
                </h1>

                {/* Underline */}
                <div style={{ 
                  width: '80px', 
                  height: '4px', 
                  backgroundColor: COLORS.primary, 
                  marginBottom: '50px',
                  borderRadius: '2px',
                }} />

                {/* Project Name */}
                <h2 style={{ 
                  fontSize: '26px', 
                  fontWeight: '600', 
                  color: COLORS.text,
                  marginBottom: '30px',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}>
                  Majmaah University Tree Planting Project
                </h2>

                {/* Description */}
                <p style={{ 
                  fontSize: '16px', 
                  color: COLORS.textLight,
                  maxWidth: '600px',
                  marginBottom: '100px',
                  lineHeight: '1.7',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}>
                  Analysis and impact assessment of{' '}
                  <span style={{ color: COLORS.primary, fontWeight: '600' }}>{data.stats.totalTrees.toLocaleString()} trees</span>
                  {' '}planted at{' '}
                  <span style={{ color: COLORS.primary, fontWeight: '600' }}>Majmaah University</span>
                  {' '}in Saudi Arabia
                </p>

                {/* Date */}
                <p style={{ 
                  fontSize: '15px', 
                  color: COLORS.textMuted,
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}>
                  {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </p>
              </div>

              {/* ==================== PAGE 2: PROJECT OVERVIEW ==================== */}
              <div style={styles.page}>
                <h1 style={styles.sectionTitle}>Project Overview</h1>
                <div style={styles.sectionUnderline} />

                <div style={styles.twoColumnGrid}>
                  {/* Left Column */}
                  <div>
                    <h2 style={{ ...styles.sectionSubtitle, fontSize: '20px', marginBottom: '16px' }}>
                      Majmaah University Tree Planting Initiative
                    </h2>
                    
                    <p style={{ fontSize: '14px', color: COLORS.textLight, lineHeight: '1.8', marginBottom: '24px' }}>
                      The Majmaah University Tree Planting Project is a strategic environmental initiative aimed at enhancing the campus ecosystem while contributing to Saudi Arabia's broader sustainability goals. This project has successfully planted {data.stats.totalTrees.toLocaleString()} native trees across the university grounds.
                    </p>

                    {/* Project Highlights */}
                    <div style={styles.highlightBox}>
                      <h3 style={styles.highlightTitle}>Project Highlights</h3>
                      <div style={{ fontSize: '14px', color: COLORS.text, lineHeight: '2' }}>
                        <div>Implementation period: March - June 2025</div>
                        <div>Total area covered: 2.5 hectares across campus</div>
                        <div>Water source: Treated wastewater recycling system</div>
                        <div>Student involvement: 120+ student volunteers</div>
                      </div>
                    </div>

                    {/* Native Species */}
                    <h3 style={{ ...styles.sectionSubtitle, fontSize: '16px', marginTop: '24px', marginBottom: '16px' }}>
                      Native Species Planted
                    </h3>
                    <div>
                      {nativeSpeciesList.map((species, idx) => (
                        <span key={idx} style={styles.tag}>{species}</span>
                      ))}
                    </div>
                  </div>

                  {/* Right Column - Key Metrics */}
                  <div>
                    <h3 style={{ ...styles.sectionSubtitle, fontSize: '16px', marginBottom: '16px' }}>
                      Key Project Metrics
                    </h3>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr 1fr', 
                      gap: '12px',
                    }}>
                      <div style={{ ...styles.card, padding: '20px', textAlign: 'center' }}>
                        <div style={styles.statValue}>{data.stats.totalTrees.toLocaleString()}</div>
                        <div style={styles.statLabel}>Trees Planted</div>
                      </div>
                      <div style={{ ...styles.card, padding: '20px', textAlign: 'center' }}>
                        <div style={styles.statValue}>{data.stats.survivalRate}%</div>
                        <div style={styles.statLabel}>Survival Rate</div>
                      </div>
                      <div style={{ ...styles.card, padding: '20px', textAlign: 'center' }}>
                        <div style={styles.statValue}>{getAnnualCarbon()} tons</div>
                        <div style={styles.statLabel}>CO₂ Sequestered</div>
                      </div>
                      <div style={{ ...styles.card, padding: '20px', textAlign: 'center' }}>
                        <div style={styles.statValue}>12</div>
                        <div style={styles.statLabel}>Local Jobs</div>
                      </div>
                      <div style={{ ...styles.card, padding: '20px', textAlign: 'center' }}>
                        <div style={styles.statValue}>{nativeSpeciesList.length}</div>
                        <div style={styles.statLabel}>Native Species</div>
                      </div>
                      <div style={{ ...styles.card, padding: '20px', textAlign: 'center' }}>
                        <div style={styles.statValue}>{getBiodiversityScore()}/100</div>
                        <div style={styles.statLabel}>Biodiversity Score</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ==================== PAGE 3: CARBON IMPACT ANALYSIS ==================== */}
              <div style={styles.page}>
                <h1 style={styles.sectionTitle}>Carbon Impact Analysis</h1>
                <div style={styles.sectionUnderline} />
                <p style={styles.sectionDescription}>
                  <strong>Quantifying the environmental benefits of {data.stats.totalTrees.toLocaleString()} trees at Majmaah University</strong>
                </p>

                {/* Big Stats Row */}
                <div style={{ ...styles.twoColumnGrid, marginBottom: '24px' }}>
                  <div style={{ ...styles.card, textAlign: 'center', padding: '30px' }}>
                    <div style={{ ...styles.statValue, fontSize: '42px' }}>{getAnnualCarbon()} tons</div>
                    <div style={{ ...styles.statLabel, fontSize: '14px' }}>Annual CO₂ Sequestration</div>
                  </div>
                  <div style={{ ...styles.card, textAlign: 'center', padding: '30px' }}>
                    <div style={{ ...styles.statValue, fontSize: '42px' }}>{getLifetimeCarbon()} tons</div>
                    <div style={{ ...styles.statLabel, fontSize: '14px' }}>Lifetime CO₂ Sequestration Potential</div>
                  </div>
                </div>

                {/* Charts Row */}
                <div style={styles.twoColumnGrid}>
                  {getCarbonBySpecies().length > 0 && (
                    <div style={styles.chartCard}>
                      <h4 style={styles.chartTitle}>Annual Carbon Sequestration by Species</h4>
                      <div style={{ height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getCarbonBySpecies()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: COLORS.textLight }} />
                            <YAxis tick={{ fontSize: 11, fill: COLORS.textLight }} label={{ value: 'Tons CO₂', angle: -90, position: 'insideLeft', fontSize: 11, fill: COLORS.textLight }} />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                  {data.carbonTrends && data.carbonTrends.length > 0 && (
                    <div style={styles.chartCard}>
                      <h4 style={styles.chartTitle}>Carbon Sequestration Trends</h4>
                      <div style={{ height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.carbonTrends}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.textLight }} />
                            <YAxis tick={{ fontSize: 11, fill: COLORS.textLight }} label={{ value: 'Tons of CO₂', angle: -90, position: 'insideLeft', fontSize: 11, fill: COLORS.textLight }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" name="Carbon (tons)" stroke={COLORS.primary} strokeWidth={2} dot={{ fill: COLORS.primary, r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>

                {/* Key Insight & Table Row */}
                <div style={{ ...styles.twoColumnGrid, marginTop: '24px' }}>
                  <div style={styles.highlightBox}>
                    <h4 style={styles.highlightTitle}>Key Insight</h4>
                    <p style={{ fontSize: '13px', color: COLORS.text, lineHeight: '1.7', margin: 0 }}>
                      Date Palm trees account for 35% of the total plantation but contribute 42% of the carbon sequestration due to their higher carbon capture efficiency in the local climate conditions.
                    </p>
                  </div>
                  <div>
                    <h4 style={styles.chartTitle}>Carbon Impact Equivalents</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={styles.tableHeader}>Equivalent To</th>
                          <th style={styles.tableHeader}>Annual Impact</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={styles.tableCell}>Passenger vehicles removed from road</td>
                          <td style={styles.tableCell}>{Math.round(parseFloat(getAnnualCarbon()) / 4.6)} cars</td>
                        </tr>
                        <tr>
                          <td style={styles.tableCell}>Household electricity offset</td>
                          <td style={styles.tableCell}>{Math.round(parseFloat(getAnnualCarbon()) / 6.2)} homes</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ==================== PAGE 4: TREE GROWTH METRICS ==================== */}
              <div style={styles.page}>
                <h1 style={styles.sectionTitle}>Tree Growth Metrics</h1>
                <div style={styles.sectionUnderline} />
                <p style={styles.sectionDescription}>
                  <strong>Monitoring growth rates and survival statistics at Majmaah University</strong>
                </p>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ ...styles.card, textAlign: 'center', padding: '24px' }}>
                    <div style={styles.statValue}>{data.stats.totalTrees.toLocaleString()}</div>
                    <div style={styles.statLabel}>Total Trees Planted</div>
                    <div style={{ fontSize: '12px', color: COLORS.success, marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <span>↑</span> 100% complete
                    </div>
                  </div>
                  <div style={{ ...styles.card, textAlign: 'center', padding: '24px' }}>
                    <div style={styles.statValue}>{data.stats.survivalRate}%</div>
                    <div style={styles.statLabel}>Average Survival Rate</div>
                    <div style={{ fontSize: '12px', color: COLORS.success, marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <span>↑</span> 5% from last month
                    </div>
                  </div>
                  <div style={{ ...styles.card, textAlign: 'center', padding: '24px' }}>
                    <div style={styles.statValue}>{getAverageHeightGrowth()} cm</div>
                    <div style={styles.statLabel}>Average Height Growth</div>
                    <div style={{ fontSize: '12px', color: COLORS.success, marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <span>↑</span> 8% from last month
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div style={styles.twoColumnGrid}>
                  {data.growthCarbonImpact && data.growthCarbonImpact.length > 0 && (
                    <div style={styles.chartCard}>
                      <h4 style={styles.chartTitle}>Growth & Carbon Impact</h4>
                      <div style={{ height: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={data.growthCarbonImpact}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.textLight }} />
                            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: COLORS.textLight }} label={{ value: 'Carbon (tons)', angle: -90, position: 'insideLeft', fontSize: 11, fill: COLORS.textLight }} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: COLORS.textLight }} label={{ value: 'Growth (cm)', angle: -90, position: 'insideRight', fontSize: 11, fill: COLORS.textLight }} />
                            <Tooltip />
                            <Legend />
                            <Bar yAxisId="left" dataKey="carbon" fill={COLORS.primary} name="Carbon (tons)" />
                            <Line yAxisId="right" type="monotone" dataKey="growth" stroke={COLORS.success} strokeWidth={2} name="Growth (cm)" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                  {data.survivalRate && data.survivalRate.length > 0 && (
                    <div style={styles.chartCard}>
                      <h4 style={styles.chartTitle}>Survival Rate Trends</h4>
                      <div style={{ height: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.survivalRate}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="year" tick={{ fontSize: 10, fill: COLORS.textLight }} />
                            <YAxis tick={{ fontSize: 11, fill: COLORS.textLight }} label={{ value: 'Survival Rate (%)', angle: -90, position: 'insideLeft', fontSize: 11, fill: COLORS.textLight }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="rate" name="Survival Rate" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ==================== PAGE 5: COMMUNITY IMPACT ==================== */}
              <div style={styles.page}>
                <h1 style={styles.sectionTitle}>Community Impact</h1>
                <div style={styles.sectionUnderline} />
                <p style={styles.sectionDescription}>
                  <strong>Social and economic benefits to the Majmaah University community</strong>
                </p>

                <div style={styles.twoColumnGrid}>
                  {/* Left Column - Stats Only */}
                  <div>
                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                      <div style={{ ...styles.card, textAlign: 'center', padding: '20px' }}>
                        <div style={styles.statValue}>12</div>
                        <div style={styles.statLabel}>Local Jobs Created</div>
                      </div>
                      <div style={{ ...styles.card, textAlign: 'center', padding: '20px' }}>
                        <div style={styles.statValue}>$8,500</div>
                        <div style={styles.statLabel}>Economic Value Generated</div>
                      </div>
                      <div style={{ ...styles.card, textAlign: 'center', padding: '20px' }}>
                        <div style={styles.statValue}>4</div>
                        <div style={styles.statLabel}>Research Projects Initiated</div>
                      </div>
                      <div style={{ ...styles.card, textAlign: 'center', padding: '20px' }}>
                        <div style={styles.statValue}>15%</div>
                        <div style={styles.statLabel}>Campus Temperature Reduction</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Impact Items */}
                  <div>
                    {[
                      { icon: GraduationCap, title: 'Educational Opportunities', text: 'The project has created hands-on learning experiences for environmental science and agriculture students, with 3 new course modules developed around the initiative.' },
                      { icon: Users, title: 'Community Engagement', text: 'Over 120 student volunteers participated in planting activities, with community workshops on sustainable landscaping reaching 250+ participants from the university and surrounding areas.' },
                      { icon: Target, title: 'Wellbeing Benefits', text: 'Campus surveys indicate a 35% increase in student satisfaction with outdoor spaces, with 68% reporting improved mental wellbeing from access to new green areas.' },
                      { icon: FlaskConical, title: 'Research Advancement', text: 'The project has enabled 4 new research initiatives on desert-adapted species and water conservation techniques, strengthening the university\'s environmental research profile.' },
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                        <div style={styles.iconCircle}>
                          <item.icon size={20} color="white" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '600', color: COLORS.text, marginBottom: '6px' }}>{item.title}</h4>
                          <p style={{ fontSize: '13px', color: COLORS.textLight, lineHeight: '1.6', margin: 0 }}>{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ==================== PAGE 6: SATELLITE MONITORING ==================== */}
              <div style={styles.page}>
                <h1 style={styles.sectionTitle}>Satellite Monitoring</h1>
                <div style={styles.sectionUnderline} />
                <p style={styles.sectionDescription}>
                  <strong>Remote sensing verification for Majmaah University planting site</strong>
                </p>

                <div style={styles.twoColumnGrid}>
                  {/* Left Column */}
                  <div>
                    <div style={styles.card}>
                      <h4 style={styles.chartTitle}>Satellite Monitoring System</h4>
                      
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                        <div style={styles.iconCircle}>
                          <Satellite size={20} color="white" />
                        </div>
                        <div>
                          <h5 style={{ fontSize: '14px', fontWeight: '600', color: COLORS.text, marginBottom: '4px' }}>Sentinel-2 Multispectral Imaging</h5>
                          <p style={{ fontSize: '13px', color: COLORS.textLight, margin: 0, lineHeight: '1.5' }}>
                            10-meter resolution imagery capturing vegetation health through NDVI analysis at bi-weekly intervals.
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                        <div style={styles.iconCircle}>
                          <TrendingUp size={20} color="white" />
                        </div>
                        <div>
                          <h5 style={{ fontSize: '14px', fontWeight: '600', color: COLORS.text, marginBottom: '4px' }}>Vegetation Health Tracking</h5>
                          <p style={{ fontSize: '13px', color: COLORS.textLight, margin: 0, lineHeight: '1.5' }}>
                            Monitoring tree establishment across the 2.5 hectare planting site at Majmaah University campus.
                          </p>
                        </div>
                      </div>

                      {/* Table */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
                        <thead>
                          <tr>
                            <th style={styles.tableHeader}>Satellite Source</th>
                            <th style={styles.tableHeader}>Resolution</th>
                            <th style={styles.tableHeader}>Frequency</th>
                            <th style={styles.tableHeader}>Key Metrics</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={styles.tableCell}>Sentinel-2</td>
                            <td style={styles.tableCell}>10m</td>
                            <td style={styles.tableCell}>Bi-weekly</td>
                            <td style={styles.tableCell}>NDVI, Canopy Cover</td>
                          </tr>
                          <tr>
                            <td style={styles.tableCell}>Planet SkySat</td>
                            <td style={styles.tableCell}>0.5m</td>
                            <td style={styles.tableCell}>Quarterly</td>
                            <td style={styles.tableCell}>Tree Count Verification</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Monitoring Timeline */}
                    <h4 style={{ ...styles.chartTitle, marginTop: '24px' }}>Monitoring Timeline</h4>
                    {[
                      { date: 'March 2025', text: 'Baseline imagery captured before planting', verified: false },
                      { date: 'April 2025', text: `Initial planting verification confirming ${data.stats.totalTrees.toLocaleString()} trees`, verified: true },
                      { date: 'September 2025', text: `Quarterly assessment confirming ${data.stats.survivalRate}% survival rate`, verified: true },
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                        <div style={{ width: '100px', fontSize: '13px', fontWeight: '600', color: COLORS.primary }}>{item.date}</div>
                        <div style={{ flex: 1, fontSize: '13px', color: COLORS.textLight }}>{item.text}</div>
                        {item.verified && (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px', 
                            fontSize: '12px', 
                            color: COLORS.success,
                            backgroundColor: COLORS.successLight,
                            padding: '4px 10px',
                            borderRadius: '12px',
                          }}>
                            <CheckCircle2 size={14} /> Verified
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Right Column - Charts */}
                  <div>
                    {data.ndviTrends && data.ndviTrends.length > 0 && (
                      <div style={styles.chartCard}>
                        <h4 style={styles.chartTitle}>NDVI Trends</h4>
                        <div style={{ height: '220px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.ndviTrends}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.textLight }} />
                              <YAxis tick={{ fontSize: 11, fill: COLORS.textLight }} label={{ value: 'NDVI Value', angle: -90, position: 'insideLeft', fontSize: 11, fill: COLORS.textLight }} />
                              <Tooltip />
                              <Line type="monotone" dataKey="value" name="NDVI" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <p style={{ fontSize: '12px', color: COLORS.textLight, marginTop: '8px' }}>
                          NDVI values range from -1 to 1, with higher values indicating healthier vegetation
                        </p>
                      </div>
                    )}

                    {data.canopyCoverage && data.canopyCoverage.length > 0 && (
                      <div style={{ ...styles.chartCard, marginTop: '16px' }}>
                        <h4 style={styles.chartTitle}>Canopy Coverage Distribution</h4>
                        <div style={{ height: '250px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={data.canopyCoverage}
                                cx="40%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, value, percent }) => {
                                  // Only show label if slice is large enough (> 5%)
                                  if (percent < 0.05) return '';
                                  return `${name}: ${value}`;
                                }}
                                outerRadius={70}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {data.canopyCoverage.map((_entry, index) => (
                                  <Cell key={`cell-${index}`} fill={['#13c5bc', '#10b981', '#3b82f6', '#f59e0b'][index % 4]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value: number, name: string) => {
                                  const total = data.canopyCoverage.reduce((sum, item) => sum + item.value, 0);
                                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                                  return [`${value} (${percentage}%)`, name];
                                }}
                              />
                              <Legend 
                                align="right"
                                verticalAlign="middle"
                                layout="vertical"
                                formatter={(value) => {
                                  const item = data.canopyCoverage.find(d => d.name === value);
                                  if (!item) return value;
                                  const total = data.canopyCoverage.reduce((sum, d) => sum + d.value, 0);
                                  const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
                                  return `${value}: ${percentage}%`;
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ==================== PAGE 7: BIODIVERSITY IMPACT ==================== */}
              <div style={styles.page}>
                <h1 style={styles.sectionTitle}>Biodiversity Impact</h1>
                <div style={styles.sectionUnderline} />
                <p style={styles.sectionDescription}>
                  <strong>Ecosystem health assessment at Majmaah University</strong>
                </p>

                <div style={styles.twoColumnGrid}>
                  {/* Left Column */}
                  <div>
                    <div style={styles.card}>
                      <h4 style={styles.chartTitle}>Biodiversity Health Assessment</h4>
                      
                      {/* Circular Score */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                        <div style={{
                          width: '100px',
                          height: '100px',
                          borderRadius: '50%',
                          border: `6px solid ${COLORS.text}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                        }}>
                          <span style={{ fontSize: '32px', fontWeight: '700', color: COLORS.primary }}>{getBiodiversityScore()}</span>
                        </div>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: '600', color: COLORS.text }}>Biodiversity</div>
                          <div style={{ fontSize: '14px', color: COLORS.textLight }}>Health Score</div>
                        </div>
                      </div>

                      {/* Icon Items */}
                      {[
                        { icon: Bug, title: 'Insect Population', text: '35% increase in beneficial insect species, including pollinators' },
                        { icon: Bird, title: 'Bird Species', text: '8 new bird species observed nesting in the planted areas' },
                        { icon: Sprout, title: 'Plant Diversity', text: '12 native understory plant species establishing beneath canopy' },
                      ].map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                          <div style={{ ...styles.iconCircle, width: '36px', height: '36px' }}>
                            <item.icon size={18} color="white" />
                          </div>
                          <div>
                            <h5 style={{ fontSize: '14px', fontWeight: '600', color: COLORS.text, marginBottom: '2px' }}>{item.title}</h5>
                            <p style={{ fontSize: '12px', color: COLORS.textLight, margin: 0 }}>{item.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Key Findings */}
                    <div style={styles.highlightBox}>
                      <h4 style={styles.highlightTitle}>Key Findings</h4>
                      <div style={{ fontSize: '13px', color: COLORS.text, lineHeight: '1.8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <CheckCircle2 size={16} color={COLORS.success} />
                          Soil health improved with 22% increase in organic matter
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CheckCircle2 size={16} color={COLORS.success} />
                          Microclimate benefits with 2-3°C temperature reduction
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Charts */}
                  <div>
                    {data.speciesRichness && data.speciesRichness.length > 0 && (
                      <div style={styles.chartCard}>
                        <h4 style={styles.chartTitle}>Species Richness</h4>
                        <div style={{ height: '220px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.speciesRichness}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="species" tick={{ fontSize: 11, fill: COLORS.textLight }} angle={-45} textAnchor="end" height={100} />
                              <YAxis tick={{ fontSize: 11, fill: COLORS.textLight }} label={{ value: 'Tree Count', angle: -90, position: 'insideLeft', fontSize: 11, fill: COLORS.textLight }} />
                              <Tooltip />
                              <Bar dataKey="count" fill={COLORS.primary} name="Tree Count" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {data.ecosystemServices && data.ecosystemServices.length > 0 && (
                      <div style={{ ...styles.chartCard, marginTop: '16px' }}>
                        <h4 style={styles.chartTitle}>Ecosystem Services</h4>
                        <div style={{ height: '220px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.ecosystemServices}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="service" tick={{ fontSize: 11, fill: COLORS.textLight }} angle={-45} textAnchor="end" height={100} />
                              <YAxis tick={{ fontSize: 11, fill: COLORS.textLight }} label={{ value: 'Score', angle: -90, position: 'insideLeft', fontSize: 11, fill: COLORS.textLight }} />
                              <Tooltip />
                              <Bar dataKey="value" fill={COLORS.primary} name="Score" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ==================== PAGE 8: FUTURE IMPACT PROJECTIONS ==================== */}
              <div style={styles.page}>
                <h1 style={styles.sectionTitle}>Future Impact Projections</h1>
                <div style={styles.sectionUnderline} />
                <p style={styles.sectionDescription}>
                  <strong>Long-term environmental and social impact forecasting for Majmaah University</strong>
                </p>

                {/* Charts Row */}
                <div style={styles.twoColumnGrid}>
                  {data.eviTrends && data.eviTrends.length > 0 && (
                    <div style={styles.chartCard}>
                      <h4 style={styles.chartTitle}>EVI Trends</h4>
                      <div style={{ height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.eviTrends}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.textLight }} />
                            <YAxis tick={{ fontSize: 11, fill: COLORS.textLight }} label={{ value: 'EVI Value', angle: -90, position: 'insideLeft', fontSize: 11, fill: COLORS.textLight }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" name="EVI" stroke={COLORS.primary} strokeWidth={2} dot={{ fill: COLORS.primary, r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                  {data.agcTrends && data.agcTrends.length > 0 && (
                    <div style={styles.chartCard}>
                      <h4 style={styles.chartTitle}>Above Ground Carbon (AGC) Trends</h4>
                      <div style={{ height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.agcTrends}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.textLight }} />
                            <YAxis tick={{ fontSize: 11, fill: COLORS.textLight }} label={{ value: 'AGC (tons)', angle: -90, position: 'insideLeft', fontSize: 11, fill: COLORS.textLight }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" name="AGC (tons)" stroke={COLORS.primary} strokeWidth={2} dot={{ fill: COLORS.primary, r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Charts Row */}
                {(data.vegetationHealth && data.vegetationHealth.length > 0) || (data.vegetationHealthIndex && data.vegetationHealthIndex.length > 0) ? (
                  <div style={{ ...styles.twoColumnGrid, marginTop: '24px' }}>
                    {data.vegetationHealth && data.vegetationHealth.length > 0 && (
                      <div style={styles.chartCard}>
                        <h4 style={styles.chartTitle}>Vegetation Health Distribution</h4>
                        <div style={{ height: '250px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.vegetationHealth}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="condition" tick={{ fontSize: 11, fill: COLORS.textLight }} />
                              <YAxis tick={{ fontSize: 11, fill: COLORS.textLight }} label={{ value: 'Percentage', angle: -90, position: 'insideLeft', fontSize: 11, fill: COLORS.textLight }} />
                              <Tooltip />
                              <Bar dataKey="percentage" fill={COLORS.primary} name="Percentage (%)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                    {data.vegetationHealthIndex && data.vegetationHealthIndex.length > 0 && (
                      <div style={styles.chartCard}>
                        <h4 style={styles.chartTitle}>Vegetation Health Index</h4>
                        <div style={{ height: '250px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.vegetationHealthIndex}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="category" tick={{ fontSize: 11, fill: COLORS.textLight }} />
                              <YAxis tick={{ fontSize: 11, fill: COLORS.textLight }} label={{ value: 'Value', angle: -90, position: 'insideLeft', fontSize: 11, fill: COLORS.textLight }} />
                              <Tooltip />
                              <Bar dataKey="value" fill={COLORS.primary} name="Value" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Bottom Row */}
                <div style={{ ...styles.twoColumnGrid, marginTop: '24px' }}>
                  {/* Key Milestones */}
                  <div style={styles.card}>
                    <h4 style={{ ...styles.highlightTitle, marginBottom: '20px' }}>Key Milestones</h4>
                    {[
                      { year: '2026', progress: 40, text: '45 tons CO₂ sequestered' },
                      { year: '2027', progress: 60, text: '870 trees reaching maturity' },
                      { year: '2030', progress: 100, text: '120 tons CO₂ sequestered annually' },
                    ].map((item, idx) => (
                      <div key={idx} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '16px', fontWeight: '600', color: COLORS.primary, width: '50px' }}>{item.year}</span>
                          <div style={{ flex: 1, height: '8px', backgroundColor: COLORS.backgroundCard, borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${item.progress}%`, height: '100%', backgroundColor: COLORS.primary, borderRadius: '4px' }} />
                          </div>
                          <span style={{ fontSize: '13px', color: COLORS.textLight, minWidth: '180px' }}>{item.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Projection Methodology */}
                  <div style={styles.card}>
                    <h4 style={{ ...styles.highlightTitle, marginBottom: '20px' }}>Projection Methodology</h4>
                    {[
                      { icon: TrendingUp, title: 'Growth Rate Modeling:', text: 'Species-specific growth curves based on historical data from similar arid climate projects.' },
                      { icon: Leaf, title: 'Carbon Calculation:', text: 'Allometric equations with species-specific carbon factors for native Saudi Arabian trees.' },
                      { icon: BarChart3, title: 'Confidence Level:', text: '85% based on Monte Carlo simulations accounting for climate variability and maintenance factors.' },
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ ...styles.iconCircle, width: '36px', height: '36px' }}>
                          <item.icon size={18} color="white" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: COLORS.text }}>{item.title}</span>
                          <span style={{ fontSize: '13px', color: COLORS.textLight }}> {item.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ==================== PAGE 9: CONCLUSION & RECOMMENDATIONS ==================== */}
              <div style={{ ...styles.page, pageBreakAfter: 'auto' }}>
                <h1 style={styles.sectionTitle}>Conclusion & Recommendations</h1>
                <div style={styles.sectionUnderline} />
                <p style={styles.sectionDescription}>
                  <strong>Key insights and next steps for Majmaah University tree planting initiative</strong>
                </p>

                <div style={styles.twoColumnGrid}>
                  {/* Left Column - Key Insights */}
                  <div>
                    <div style={styles.card}>
                      <h4 style={{ ...styles.highlightTitle, marginBottom: '20px' }}>Key Insights</h4>
                      {[
                        `The ${data.stats.totalTrees.toLocaleString()} trees planted at Majmaah University are sequestering ${getAnnualCarbon()} tons of CO₂ annually, with Date Palm species showing the highest carbon capture efficiency.`,
                        'Community impact metrics show significant educational benefits with 120+ student volunteers engaged and 4 new research initiatives launched.',
                        `Biodiversity health score of ${getBiodiversityScore()}/100 indicates positive ecosystem development, with notable increases in beneficial insect populations.`,
                        `Sentinel-2 satellite monitoring confirms ${data.stats.survivalRate}% average tree survival rate across all planting sites at the university campus.`,
                      ].map((text, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '16px', backgroundColor: COLORS.backgroundLight, padding: '16px', borderRadius: '8px' }}>
                          <span style={{ fontSize: '18px', fontWeight: '700', color: COLORS.primary, minWidth: '24px' }}>{idx + 1}</span>
                          <p style={{ fontSize: '13px', color: COLORS.text, lineHeight: '1.6', margin: 0 }}>{text}</p>
                        </div>
                      ))}
                    </div>

                    {/* Impact Summary Chart */}
                    {getImpactSummaryData().length > 0 && (
                      <div style={{ ...styles.card, marginTop: '16px' }}>
                        <h4 style={{ ...styles.highlightTitle, marginBottom: '16px' }}>Impact Summary</h4>
                        <div style={{ height: '180px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getImpactSummaryData()} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: COLORS.textLight }} />
                              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: COLORS.textLight }} width={120} />
                              <Tooltip />
                              <Bar dataKey="value" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Recommendations */}
                  <div>
                    <div style={styles.card}>
                      <h4 style={{ ...styles.highlightTitle, marginBottom: '20px' }}>Recommendations</h4>
                      {[
                        { icon: TreePine, title: 'Optimize Species Mix', text: 'Increase the proportion of Date Palm and Acacia species in future plantings to maximize carbon sequestration while maintaining biodiversity.' },
                        { icon: GraduationCap, title: 'Expand Academic Integration', text: 'Develop formal curriculum connections to leverage the planting site as a living laboratory for environmental science and sustainability courses.' },
                        { icon: Droplets, title: 'Enhance Water Management', text: 'Deploy smart irrigation systems to improve water efficiency and survival rates, particularly during summer months.' },
                      ].map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                          <div style={styles.iconCircle}>
                            <item.icon size={20} color="white" />
                          </div>
                          <div>
                            <h5 style={{ fontSize: '15px', fontWeight: '600', color: COLORS.text, marginBottom: '4px' }}>{item.title}</h5>
                            <p style={{ fontSize: '13px', color: COLORS.textLight, lineHeight: '1.6', margin: 0 }}>{item.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Next Steps */}
                    <div style={{ ...styles.card, marginTop: '16px' }}>
                      <h4 style={{ ...styles.highlightTitle, marginBottom: '16px' }}>Next Steps</h4>
                      {[
                        { bold: 'Schedule quarterly monitoring', text: 'to track growth progress and adjust maintenance as needed' },
                        { bold: 'Implement ground sensors', text: 'to complement satellite data for more detailed environmental monitoring' },
                      ].map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                          <CheckCircle2 size={20} color={COLORS.success} style={{ marginTop: '2px', flexShrink: 0 }} />
                          <p style={{ fontSize: '13px', color: COLORS.text, lineHeight: '1.6', margin: 0 }}>
                            <strong>{item.bold}</strong> {item.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{
                  marginTop: '40px',
                  paddingTop: '20px',
                  borderTop: `1px solid ${COLORS.border}`,
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: '12px', color: COLORS.textMuted, margin: '4px 0' }}>
                    This report was generated automatically from live data in the Majmaah Dashboard.
                  </p>
                  <p style={{ fontSize: '12px', color: COLORS.textMuted, margin: '4px 0' }}>
                    For questions or more information, please contact the project administrator.
                  </p>
                  <p style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: '12px' }}>
                    © {new Date().getFullYear()} URIMPACT. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};