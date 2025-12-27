import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Login } from '@/pages/auth/Login';
import { Dashboard } from '@/pages/Dashboard';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// App Routes
const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/admin" replace /> : <Login />}
      />

      {/* Protected routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        {/* Content Management */}
        <Route path="planting-records-certificates" element={<PlaceholderPage title="Planting Records Certificates" />} />
        <Route path="departments" element={<PlaceholderPage title="Departments" />} />
        <Route path="employees" element={<PlaceholderPage title="Employees" />} />
        <Route path="planting-record-assignments" element={<PlaceholderPage title="Planting Record Assignments" />} />
        <Route path="certifications-history" element={<PlaceholderPage title="Certifications History" />} />
        {/* Company Certificate */}
        <Route path="trees-certificate" element={<PlaceholderPage title="Trees Certificate" />} />
        <Route path="basic-certificate" element={<PlaceholderPage title="Basic Certificate" />} />
        {/* Profile */}
        <Route path="my-profile" element={<PlaceholderPage title="My Profile" />} />
      </Route>

      {/* Redirect root to admin */}
      <Route path="/" element={<Navigate to="/admin" replace />} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

// Placeholder component for resource pages
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="widget-card">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600">
        This page is under construction. The full CRUD interface for {title.toLowerCase()} will be implemented here.
      </p>
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> Connect this to your Node.js backend to enable full functionality.
        </p>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;

