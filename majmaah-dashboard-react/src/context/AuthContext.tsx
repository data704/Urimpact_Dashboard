import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@/types';
import { config } from '@/config';

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Get API base URL from config (uses VITE_API_BASE_URL env variable)
    const apiBaseUrl = config.api.baseUrl;
    const isProduction = !apiBaseUrl.includes('localhost');
    
    try {
      // Call real authentication API using config base URL
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(errorData.error || `Login failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data?.token) {
        const token = data.data.token;
        const userData = data.data.user;

        const user: User = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role === 'admin' ? UserRole.ADMIN : UserRole.ADVANCEDCLIENT,
          avatar_url: '/assets/img/URIMPACT_LOGO.png',
        };

        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        return; // Success - exit early
      } else {
        throw new Error(data.error || 'Login failed: Invalid response');
      }
    } catch (error) {
      // In production, throw the error instead of silently falling back to demo mode
      if (isProduction) {
        console.error('Authentication failed:', error);
        throw error; // Re-throw to let the Login component handle it
      }
      
      // Only fallback to demo mode in development
      console.warn('Real auth failed, using demo mode (development only):', error);
      
      // Determine role based on email for demo mode
      let role = UserRole.ADVANCEDCLIENT;
      if (email.toLowerCase().includes('admin') || email.toLowerCase() === 'admin@urimpact.com') {
        role = UserRole.ADMIN;
      } else if (email.toLowerCase().includes('super')) {
        role = UserRole.SUPER_ADMIN;
      }
      
      const mockUser: User = {
        id: 1,
        name: role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN ? 'Admin User' : 'Majmaah University',
        email: email,
        role: role,
        avatar_url: '/assets/img/URIMPACT_LOGO.png',
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('token', 'demo-token');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

