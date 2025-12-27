// User Roles (matching Laravel exactly)
export enum UserRole {
  SUPER_ADMIN = 'Super Admin',
  ADMIN = 'URIMPACT Internal Team',
  FIELDCREW = 'Planting Team',
  PUBLICVIEWER = 'Public Viewer',
  BASICCLIENT = 'Basic Client',
  ADVANCEDCLIENT = 'Advanced Client',
  ENTREPRISECLIENT = 'Enterprise Client',
}

export enum PlantingRecordStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
}

export interface Tree {
  id: string;
  tree_id?: string;
  species: string;
  coordinates: [number, number];
  health: string;
  health_condition?: string;
}

export interface DashboardStats {
  totalTrees: number;
  totalProjects: number;
  totalClients: number;
  carbonSequestered: number;
  survivalRate: number;
  speciesRichness: number;
  canopyCoverage: number;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface NavigationItem {
  name: string;
  path?: string;
  icon: any;
  group?: boolean;
  items?: NavigationItem[];
  badge?: string | number;
}

