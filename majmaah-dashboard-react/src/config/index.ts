// Configuration file for Majmaah Dashboard

export const config = {
  // Mapbox configuration
  mapbox: {
    accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '',
    defaultCenter: [45.41665259330084, 25.864738692117708] as [number, number],
    defaultZoom: 12,
    clusterMaxZoom: 15,
    clusterRadius: 40,
  },

  // API configuration - Points to NDVI Calculator backend
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    timeout: 30000,
  },

  // App configuration
  app: {
    name: 'URIMPACT',
    title: 'Majmaah University - Tree Planting Dashboard',
    locale: 'en',
    projectId: 1, // Default Majmaah project ID
  },
} as const;

