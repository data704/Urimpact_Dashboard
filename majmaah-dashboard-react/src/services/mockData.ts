// Mock data for development (matching Laravel data structure)

export const mockMajmaahTrees = Array.from({ length: 100 }, (_, i) => ({
  id: `TREE-${String(i + 1).padStart(5, '0')}`,
  tree_id: `TREE-${String(i + 1).padStart(5, '0')}`,
  species: ['Acacia', 'Palm', 'Olive', 'Cedar', 'Pine'][Math.floor(Math.random() * 5)],
  coordinates: [
    45.41665259330084 + (Math.random() - 0.5) * 0.05,
    25.864738692117708 + (Math.random() - 0.5) * 0.05,
  ] as [number, number],
  health: ['Excellent', 'Good', 'Fair'][Math.floor(Math.random() * 3)],
  health_condition: ['Excellent', 'Good', 'Fair'][Math.floor(Math.random() * 3)],
}));

export const mockAdvancedClientStats = {
  treesPlanted: 1000,
  carbonSequestration: 18,
  survivalRate: 87,
  communitiesSupported: 12,
};

export const mockAdminStats = {
  plantingRecords: 192100,
  speciesLibraries: 360,
  crewMembers: 45,
};

export const mockCarbonSequestrationData = [
  { month: 'Jan', value: 180 },
  { month: 'Feb', value: 210 },
  { month: 'Mar', value: 245 },
  { month: 'Apr', value: 280 },
  { month: 'May', value: 320 },
  { month: 'Jun', value: 365 },
  { month: 'Jul', value: 410 },
  { month: 'Aug', value: 455 },
  { month: 'Sep', value: 495 },
  { month: 'Oct', value: 540 },
  { month: 'Nov', value: 585 },
  { month: 'Dec', value: 630 },
];

export const mockCanopyCoverageData = [
  { name: '0-25%', value: 12 },
  { name: '25-50%', value: 28 },
  { name: '50-75%', value: 35 },
  { name: '75-100%', value: 25 },
];

export const mockSpeciesRichnessData = [
  { species: 'Acacia', count: 3250 },
  { species: 'Palm', count: 2800 },
  { species: 'Olive', count: 2150 },
  { species: 'Cedar', count: 1850 },
  { species: 'Pine', count: 1500 },
  { species: 'Others', count: 997 },
];

export const mockEcosystemServicesData = [
  { service: 'Air Quality', value: 92 },
  { service: 'Water Retention', value: 85 },
  { service: 'Biodiversity', value: 78 },
  { service: 'Soil Health', value: 88 },
  { service: 'Carbon Storage', value: 94 },
];

export const mockVegetationHealthData = [
  { condition: 'Excellent', percentage: 65 },
  { condition: 'Good', percentage: 28 },
  { condition: 'Fair', percentage: 7 },
];

export const mockSurvivalRateData = [
  { year: '2021', rate: 89 },
  { year: '2022', rate: 91 },
  { year: '2023', rate: 93 },
  { year: '2024', rate: 94 },
  { year: '2025', rate: 94.5 },
];

export const mockGrowthCarbonImpactData = [
  { month: 'Jan', growth: 2.1, carbon: 45 },
  { month: 'Feb', growth: 2.3, carbon: 52 },
  { month: 'Mar', growth: 2.8, carbon: 68 },
  { month: 'Apr', growth: 3.2, carbon: 85 },
  { month: 'May', growth: 3.8, carbon: 105 },
  { month: 'Jun', growth: 4.2, carbon: 125 },
  { month: 'Jul', growth: 4.5, carbon: 142 },
  { month: 'Aug', growth: 4.8, carbon: 158 },
  { month: 'Sep', growth: 4.5, carbon: 145 },
  { month: 'Oct', growth: 3.9, carbon: 120 },
  { month: 'Nov', growth: 3.2, carbon: 95 },
  { month: 'Dec', growth: 2.5, carbon: 65 },
];

export const mockNDVITrendsData = [
  { month: 'Jan', value: 0.35 },
  { month: 'Feb', value: 0.38 },
  { month: 'Mar', value: 0.42 },
  { month: 'Apr', value: 0.45 },
  { month: 'May', value: 0.48 },
  { month: 'Jun', value: 0.52 },
  { month: 'Jul', value: 0.55 },
  { month: 'Aug', value: 0.58 },
  { month: 'Sep', value: 0.56 },
  { month: 'Oct', value: 0.53 },
  { month: 'Nov', value: 0.49 },
  { month: 'Dec', value: 0.44 },
];

export const mockEVITrendsData = [
  { month: 'Jan', value: 0.28 },
  { month: 'Feb', value: 0.31 },
  { month: 'Mar', value: 0.35 },
  { month: 'Apr', value: 0.38 },
  { month: 'May', value: 0.42 },
  { month: 'Jun', value: 0.45 },
  { month: 'Jul', value: 0.48 },
  { month: 'Aug', value: 0.50 },
  { month: 'Sep', value: 0.47 },
  { month: 'Oct', value: 0.43 },
  { month: 'Nov', value: 0.39 },
  { month: 'Dec', value: 0.34 },
];

export const mockVegetationHealthIndexData = [
  { category: 'Excellent', value: 35 },
  { category: 'Good', value: 28 },
  { category: 'Moderate', value: 22 },
  { category: 'Fair', value: 10 },
  { category: 'Poor', value: 5 },
];

export const mockAGCTrendsData = [
  { month: 'Jan', value: 45.2 },
  { month: 'Feb', value: 48.5 },
  { month: 'Mar', value: 52.1 },
  { month: 'Apr', value: 56.8 },
  { month: 'May', value: 61.3 },
  { month: 'Jun', value: 65.9 },
  { month: 'Jul', value: 70.4 },
  { month: 'Aug', value: 74.2 },
  { month: 'Sep', value: 72.8 },
  { month: 'Oct', value: 69.5 },
  { month: 'Nov', value: 64.1 },
  { month: 'Dec', value: 58.7 },
];

export const mockPlantingRecordsData = [
  { month: 'Jan', records: 850 },
  { month: 'Feb', records: 920 },
  { month: 'Mar', records: 1150 },
  { month: 'Apr', records: 1350 },
  { month: 'May', records: 1250 },
  { month: 'Jun', records: 980 },
];

