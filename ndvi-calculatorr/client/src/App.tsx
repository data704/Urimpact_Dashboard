import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import BaselineAssessment from './components/BaselineAssessment';
import AdminAssignments from './components/AdminAssignments';
import UserManagement from './components/UserManagement';
import UserAssignments from './components/UserAssignments';
import { LogOut, User } from 'lucide-react';
import './App.css';

function App() {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'analysis' | 'admin' | 'users' | 'user-assignments'>('analysis');

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Protected admin tabs
  const adminTabs = ['admin', 'users', 'user-assignments'];
  const isAdminTab = adminTabs.includes(activeTab);

  return (
    <div className="app">
      {/* Top Bar with User Info */}
      <div className="app-topbar">
        <div className="topbar-left">
          <h2 className="app-title">NDVI Calculator Admin</h2>
        </div>
        <div className="topbar-right">
          <div className="user-info">
            <User size={18} />
            <span className="user-name">{user?.name}</span>
            <span className="user-email">({user?.email})</span>
          </div>
          <button className="logout-button" onClick={logout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="app-tabs">
        <button
          onClick={() => setActiveTab('analysis')}
          className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
        >
          🛰️ GEE Analysis
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`}
        >
          📊 Admin Assignments
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
        >
          👥 User Management
        </button>
        <button
          onClick={() => setActiveTab('user-assignments')}
          className={`tab-button ${activeTab === 'user-assignments' ? 'active' : ''}`}
        >
          🔗 User Assignments
        </button>
      </div>

      {/* Content */}
      {activeTab === 'analysis' && <BaselineAssessment />}
      {activeTab === 'admin' && <AdminAssignments />}
      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'user-assignments' && <UserAssignments />}
    </div>
  );
}

export default App;