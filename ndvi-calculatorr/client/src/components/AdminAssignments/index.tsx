// Admin Assignments Component
// Interface for admins to assign analyses to Majmaah dashboard

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, EyeOff, Edit2, Trash2, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './styles.css';

interface Analysis {
  id: number;
  analysis_date: string;
  tree_count: number;
  carbon_tonnes: number;
  ndvi_mean: number;
  canopy_cover_percent: number;
  total_area_ha: number;
  created_at: string;
  display_name?: string;
  notes?: string;
}

const AdminAssignments: React.FC = () => {
  const [unassigned, setUnassigned] = useState<Analysis[]>([]);
  const [assigned, setAssigned] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchAnalyses(token);
    }
  }, [token]);

  const fetchAnalyses = async (token?: string) => {
    setLoading(true);
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const [unassignedRes, assignedRes] = await Promise.all([
        fetch(`${API_BASE}/admin/unassigned-analyses`, { headers }),
        fetch(`${API_BASE}/admin/assigned-analyses`, { headers })
      ]);

      if (unassignedRes.ok && assignedRes.ok) {
        const unassignedData = await unassignedRes.json();
        const assignedData = await assignedRes.json();
        
        setUnassigned(unassignedData.data || []);
        setAssigned(assignedData.data || []);
      } else {
        throw new Error('Failed to fetch analyses');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (analysisId: number) => {
    const displayName = prompt('Enter display name for Majmaah dashboard:', `Assessment ${analysisId}`);
    if (!displayName) return;

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/assign-to-majmaah`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          analysisId,
          displayName,
          notes: 'Assigned from Admin Panel'
        })
      });

      if (response.ok) {
        alert('✅ Analysis assigned to Majmaah dashboard!');
        fetchAnalyses(token || undefined);
      } else {
        throw new Error('Assignment failed');
      }
    } catch (err) {
      alert('❌ Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleUnassign = async (analysisId: number) => {
    if (!confirm('Remove this analysis from Majmaah dashboard?')) return;

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/unassign/${analysisId}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        alert('✅ Analysis removed from Majmaah dashboard');
        fetchAnalyses(token || undefined);
      } else {
        throw new Error('Unassignment failed');
      }
    } catch (err) {
      alert('❌ Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const startEdit = (analysis: Analysis) => {
    setEditingId(analysis.id);
    setEditName(analysis.display_name || '');
    setEditNotes(analysis.notes || '');
  };

  const saveEdit = async (analysisId: number) => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/assignment/${analysisId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          displayName: editName,
          notes: editNotes
        })
      });

      if (response.ok) {
        setEditingId(null);
        fetchAnalyses(token || undefined);
      } else {
        throw new Error('Update failed');
      }
    } catch (err) {
      alert('❌ Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDelete = async (analysisId: number, isAssigned: boolean) => {
    const confirmMessage = isAssigned
      ? `⚠️ WARNING: This will permanently delete this analysis and remove it from Majmaah dashboard and all user assignments.\n\nAre you sure you want to delete Analysis #${analysisId}?`
      : `⚠️ WARNING: This will permanently delete Analysis #${analysisId}.\n\nAre you sure you want to proceed?`;
    
    if (!confirm(confirmMessage)) return;

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/analysis/${analysisId}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        alert('✅ Analysis deleted successfully');
        fetchAnalyses(token || undefined);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }
    } catch (err) {
      alert('❌ Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading">Loading analyses...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>📊 Analysis Manager</h1>
        <p>Assign GEE analyses to Majmaah Dashboard</p>
      </div>

      {error && (
        <div className="error-banner">{error}</div>
      )}

      {/* Unassigned Analyses */}
      <div className="section">
        <h2>
          <XCircle className="section-icon" />
          Unassigned Analyses ({unassigned.length})
        </h2>
        <p className="section-subtitle">These analyses are not visible on Majmaah dashboard</p>

        {unassigned.length === 0 ? (
          <div className="empty-state">
            <p>No unassigned analyses found.</p>
            <p className="empty-hint">Run a baseline assessment in the NDVI Calculator to see results here.</p>
          </div>
        ) : (
          <div className="analysis-grid">
            {unassigned.map((analysis) => (
              <div key={analysis.id} className="analysis-card">
                <div className="card-header">
                  <h3>Analysis #{analysis.id}</h3>
                  <span className="date-badge">{new Date(analysis.analysis_date).toLocaleDateString()}</span>
                </div>
                <div className="card-body">
                  <div className="metrics">
                    <div className="metric">
                      <span className="metric-label">Trees:</span>
                      <span className="metric-value">{Number(analysis.tree_count || 0)}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Carbon:</span>
                      <span className="metric-value">{Number(analysis.carbon_tonnes || 0).toFixed(2)} t</span>
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
                    onClick={() => handleAssign(analysis.id)}
                  >
                    <Eye size={16} />
                    Assign to Majmaah
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDelete(analysis.id, false)}
                    title="Delete this analysis permanently"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assigned Analyses */}
      <div className="section">
        <h2>
          <CheckCircle className="section-icon success" />
          Assigned to Majmaah Dashboard ({assigned.length})
        </h2>
        <p className="section-subtitle">These analyses are visible to clients on Majmaah dashboard</p>

        {assigned.length === 0 ? (
          <div className="empty-state">
            <p>No analyses assigned to Majmaah dashboard yet.</p>
          </div>
        ) : (
          <div className="analysis-grid">
            {assigned.map((analysis) => (
              <div key={analysis.id} className="analysis-card assigned">
                <div className="card-header">
                  {editingId === analysis.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="edit-input"
                      placeholder="Display name"
                    />
                  ) : (
                    <h3>{analysis.display_name || `Analysis #${analysis.id}`}</h3>
                  )}
                  <span className="date-badge success">{new Date(analysis.analysis_date).toLocaleDateString()}</span>
                </div>
                <div className="card-body">
                  {editingId === analysis.id ? (
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="edit-textarea"
                      placeholder="Notes"
                      rows={2}
                    />
                  ) : (
                    <>
                      <div className="metrics">
                        <div className="metric">
                          <span className="metric-label">Trees:</span>
                          <span className="metric-value">{Number(analysis.tree_count || 0)}</span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">Carbon:</span>
                          <span className="metric-value">{Number(analysis.carbon_tonnes || 0).toFixed(2)} t</span>
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
                      {analysis.notes && (
                        <div className="notes">{analysis.notes}</div>
                      )}
                    </>
                  )}
                </div>
                <div className="card-footer">
                  {editingId === analysis.id ? (
                    <>
                      <button 
                        className="btn-save"
                        onClick={() => saveEdit(analysis.id)}
                      >
                        <Save size={16} />
                        Save
                      </button>
                      <button 
                        className="btn-cancel"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className="btn-edit"
                        onClick={() => startEdit(analysis)}
                      >
                        <Edit2 size={16} />
                        Edit
                      </button>
                      <button 
                        className="btn-remove"
                        onClick={() => handleUnassign(analysis.id)}
                      >
                        <EyeOff size={16} />
                        Unassign
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDelete(analysis.id, true)}
                        title="Delete this analysis permanently"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="info-box">
        <h3>ℹ️ How it works:</h3>
        <ol>
          <li>Run baseline assessments in the NDVI Calculator</li>
          <li>Completed analyses appear in "Unassigned" section above</li>
          <li>Click "Assign to Majmaah" to make it visible to clients</li>
          <li>Assigned analyses will appear in the Majmaah Dashboard</li>
          <li>You can edit display names and remove assignments anytime</li>
        </ol>
      </div>
    </div>
  );
};

export default AdminAssignments;