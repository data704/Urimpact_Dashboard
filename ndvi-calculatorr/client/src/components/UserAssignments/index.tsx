// User Analysis Assignments Component
// Interface for admins to assign analyses to specific users

import React, { useState, useEffect } from 'react';
import { User, Search, CheckCircle, XCircle, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './styles.css';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Analysis {
  id: number;
  analysis_date: string;
  tree_count: number;
  co2_equivalent_tonnes: number;
  ndvi_mean: number;
  canopy_cover_percent: number;
  display_name?: string;
}

interface Assignment {
  id: number;
  analysis_id: number;
  assigned_at: string;
  notes?: string;
  analysis?: Analysis;
}

const UserAssignments: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [assignedAnalyses, setAssignedAnalyses] = useState<Assignment[]>([]);
  const [availableAnalyses, setAvailableAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { token } = useAuth();

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  useEffect(() => {
    if (token) {
      fetchUsers(token);
    }
  }, [token]);

  useEffect(() => {
    if (selectedUserId && token) {
      fetchUserAssignments(selectedUserId, token);
      fetchAvailableAnalyses(token);
    }
  }, [selectedUserId, token]);

  const fetchUsers = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter to show only client users (admins don't need assignments)
        const clientUsers = (data.data || []).filter((u: User) => u.role === 'client');
        setUsers(clientUsers);
        if (clientUsers.length > 0 && !selectedUserId) {
          setSelectedUserId(clientUsers[0].id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAssignments = async (userId: number, token: string) => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}/assigned-analyses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAssignedAnalyses(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
    }
  };

  const fetchAvailableAnalyses = async (token: string) => {
    try {
      // Get all analyses assigned to Majmaah (these are available to assign to users)
      const response = await fetch(`${API_BASE}/admin/assigned-analyses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Map the response to match our Analysis interface
        const analyses = (data.data || []).map((item: any) => ({
          id: item.id,
          analysis_date: item.analysis_date,
          tree_count: item.tree_count || 0,
          co2_equivalent_tonnes: item.co2_equivalent_tonnes || item.carbon_tonnes || 0,
          ndvi_mean: item.ndvi_mean || 0,
          canopy_cover_percent: item.canopy_cover_percent || 0,
          display_name: item.display_name
        }));
        setAvailableAnalyses(analyses);
      }
    } catch (err) {
      console.error('Error fetching analyses:', err);
    }
  };

  const handleAssignAnalysis = async (analysisId: number) => {
    if (!selectedUserId || !token) return;

    const notes = prompt('Add notes (optional):');
    
    try {
      const response = await fetch(`${API_BASE}/users/${selectedUserId}/assign-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          analysisId,
          notes: notes || null
        })
      });

      if (response.ok) {
        alert('✅ Analysis assigned to user successfully!');
        fetchUserAssignments(selectedUserId, token);
        fetchAvailableAnalyses(token);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign analysis');
      }
    } catch (err) {
      alert('❌ Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleUnassignAnalysis = async (analysisId: number) => {
    if (!selectedUserId || !token) return;
    if (!confirm('Remove this analysis from user?')) return;

    try {
      const response = await fetch(`${API_BASE}/users/${selectedUserId}/assignments/${analysisId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('✅ Analysis removed from user');
        fetchUserAssignments(selectedUserId, token);
      } else {
        throw new Error('Failed to unassign analysis');
      }
    } catch (err) {
      alert('❌ Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleBulkAssign = async (analysisIds: number[]) => {
    if (!selectedUserId || !token || analysisIds.length === 0) return;

    try {
      const response = await fetch(`${API_BASE}/users/${selectedUserId}/bulk-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ analysisIds })
      });

      if (response.ok) {
        alert(`✅ ${analysisIds.length} analyses assigned successfully!`);
        fetchUserAssignments(selectedUserId, token);
        fetchAvailableAnalyses(token);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign analyses');
      }
    } catch (err) {
      alert('❌ Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const filteredAvailableAnalyses = availableAnalyses.filter(analysis => {
    const assignedIds = assignedAnalyses.map(a => a.analysis_id);
    const isAssigned = assignedIds.includes(analysis.id);
    const matchesSearch = searchTerm === '' || 
      analysis.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.id.toString().includes(searchTerm);
    
    return !isAssigned && matchesSearch;
  });

  if (loading) {
    return (
      <div className="assignment-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="assignment-container">
        <div className="loading-message">Please login to continue...</div>
      </div>
    );
  }

  return (
    <div className="assignment-container">
      <div className="assignment-header">
        <div>
          <h1>🔗 User Analysis Assignments</h1>
          <p>Assign analyses to specific users for personalized dashboard views</p>
        </div>
      </div>

      {error && (
        <div className="error-banner">{error}</div>
      )}

      {/* User Selection */}
      <div className="user-selector">
        <label>
          <User size={18} />
          Select User:
        </label>
        <select
          value={selectedUserId || ''}
          onChange={(e) => setSelectedUserId(parseInt(e.target.value))}
          className="user-select"
        >
          <option value="">-- Select a user --</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>

      {selectedUserId && (
        <>
          {/* Assigned Analyses */}
          <div className="section">
            <h2>
              <CheckCircle className="section-icon success" />
              Assigned Analyses ({assignedAnalyses.length})
            </h2>
            <p className="section-subtitle">Analyses visible to this user on their dashboard</p>

            {assignedAnalyses.length === 0 ? (
              <div className="empty-state">
                <p>No analyses assigned to this user yet.</p>
              </div>
            ) : (
              <div className="analysis-grid">
                {assignedAnalyses.map((assignment) => {
                  const analysis = assignment.analysis || availableAnalyses.find(a => a.id === assignment.analysis_id);
                  if (!analysis) return null;

                  return (
                    <div key={assignment.id} className="analysis-card assigned">
                      <div className="card-header">
                        <h3>{analysis.display_name || `Analysis #${analysis.id}`}</h3>
                        <span className="date-badge success">
                          {new Date(analysis.analysis_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="card-body">
                        <div className="metrics">
                          <div className="metric">
                            <span className="metric-label">Trees:</span>
                            <span className="metric-value">{Number(analysis.tree_count || 0)}</span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">Carbon:</span>
                            <span className="metric-value">{Number(analysis.co2_equivalent_tonnes || 0).toFixed(2)} t</span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">NDVI:</span>
                            <span className="metric-value">{Number(analysis.ndvi_mean || 0).toFixed(3)}</span>
                          </div>
                        </div>
                        {assignment.notes && (
                          <div className="notes">{assignment.notes}</div>
                        )}
                      </div>
                      <div className="card-footer">
                        <button
                          className="btn-remove"
                          onClick={() => handleUnassignAnalysis(analysis.id)}
                        >
                          <Trash2 size={16} />
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Available Analyses */}
          <div className="section">
            <div className="section-header-with-search">
              <div>
                <h2>
                  <XCircle className="section-icon" />
                  Available Analyses ({filteredAvailableAnalyses.length})
                </h2>
                <p className="section-subtitle">Assign these analyses to the selected user</p>
              </div>
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search analyses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {filteredAvailableAnalyses.length === 0 ? (
              <div className="empty-state">
                <p>No available analyses to assign.</p>
                <p className="empty-hint">All analyses are already assigned, or no analyses are available.</p>
              </div>
            ) : (
              <>
                <div className="bulk-actions">
                  <button
                    className="btn-bulk-assign"
                    onClick={() => {
                      const selectedIds = filteredAvailableAnalyses.map(a => a.id);
                      if (selectedIds.length > 0) {
                        handleBulkAssign(selectedIds);
                      }
                    }}
                  >
                    <Plus size={16} />
                    Assign All Available ({filteredAvailableAnalyses.length})
                  </button>
                </div>
                <div className="analysis-grid">
                  {filteredAvailableAnalyses.map((analysis) => (
                    <div key={analysis.id} className="analysis-card">
                      <div className="card-header">
                        <h3>{analysis.display_name || `Analysis #${analysis.id}`}</h3>
                        <span className="date-badge">
                          {new Date(analysis.analysis_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="card-body">
                        <div className="metrics">
                          <div className="metric">
                            <span className="metric-label">Trees:</span>
                            <span className="metric-value">{Number(analysis.tree_count || 0)}</span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">Carbon:</span>
                            <span className="metric-value">{Number(analysis.co2_equivalent_tonnes || 0).toFixed(2)} t</span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">NDVI:</span>
                            <span className="metric-value">{Number(analysis.ndvi_mean || 0).toFixed(3)}</span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">Canopy:</span>
                            <span className="metric-value">{Number(analysis.canopy_cover_percent || 0).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="card-footer">
                        <button
                          className="btn-assign"
                          onClick={() => handleAssignAnalysis(analysis.id)}
                        >
                          <Plus size={16} />
                          Assign to User
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Info Box */}
      <div className="info-box">
        <h3>ℹ️ How User Assignments Work:</h3>
        <ol>
          <li>Select a user from the dropdown above</li>
          <li>View analyses already assigned to that user</li>
          <li>Assign new analyses from the "Available Analyses" section</li>
          <li>When the user logs into Majmaah Dashboard, they will only see analyses assigned to them</li>
          <li>You can remove assignments at any time</li>
        </ol>
      </div>
    </div>
  );
};

export default UserAssignments;

