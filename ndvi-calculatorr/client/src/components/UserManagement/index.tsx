// User Management Component
// Interface for admins to manage users (create, edit, delete)

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, User, Mail, Lock, Shield, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './styles.css';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'client';
  is_active: boolean;
  created_at: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'client' as 'admin' | 'client',
    is_active: true
  });

  const API_BASE = 'http://localhost:3000/api';
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchUsers(token);
    }
  }, [token]);

  const fetchUsers = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
      } else if (response.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      alert('Please fill in all required fields');
      return;
    }

    if (!token) {
      alert('Please login first');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
      });

      if (response.ok) {
        alert('✅ User created successfully!');
        setShowCreateForm(false);
        resetForm();
        fetchUsers(token);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }
    } catch (err) {
      alert('❌ Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleUpdate = async (userId: number) => {
    if (!token) return;

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        is_active: formData.is_active
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        alert('✅ User updated successfully!');
        setEditingId(null);
        resetForm();
        fetchUsers(token);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
    } catch (err) {
      alert('❌ Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDelete = async (userId: number, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"?`)) return;
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('✅ User deleted successfully!');
        fetchUsers(token);
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (err) {
      alert('❌ Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't pre-fill password
      role: user.role,
      is_active: user.is_active
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowCreateForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'client',
      is_active: true
    });
  };

  if (!token) {
    return (
      <div className="user-container">
        <div className="loading-message">Please login to continue...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="user-container">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="user-container">
        <div className="loading-message">Please login to continue...</div>
      </div>
    );
  }

  return (
    <div className="user-container">
      <div className="user-header">
        <div>
          <h1>👥 User Management</h1>
          <p>Create and manage users for Majmaah Dashboard</p>
        </div>
      </div>

      {error && (
        <div className="error-banner">{error}</div>
      )}

      {/* Create User Button */}
      <div className="action-bar">
        <button 
          className="btn-create"
          onClick={() => {
            resetForm();
            setShowCreateForm(true);
            setEditingId(null);
          }}
        >
          <Plus size={18} />
          Create New User
        </button>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingId) && (
        <div className="form-card">
          <h3>{editingId ? 'Edit User' : 'Create New User'}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>
                <User size={16} />
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="User full name"
              />
            </div>

            <div className="form-group">
              <label>
                <Mail size={16} />
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>

            <div className="form-group">
              <label>
                <Lock size={16} />
                Password {editingId ? '(leave blank to keep current)' : '*'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingId ? "New password (optional)" : "Password"}
              />
            </div>

            <div className="form-group">
              <label>
                <Shield size={16} />
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'client' })}
              >
                <option value="client">Client</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {editingId && (
              <div className="form-group">
                <label>
                  <UserCheck size={16} />
                  Status
                </label>
                <select
                  value={formData.is_active ? 'active' : 'inactive'}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              className="btn-save"
              onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
            >
              <Save size={16} />
              {editingId ? 'Update User' : 'Create User'}
            </button>
            <button
              className="btn-cancel"
              onClick={cancelEdit}
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="users-section">
        <h2>
          <User size={20} />
          All Users ({users.length})
        </h2>

        {users.length === 0 ? (
          <div className="empty-state">
            <p>No users found. Create your first user above.</p>
          </div>
        ) : (
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className={!user.is_active ? 'inactive' : ''}>
                    <td>
                      <div className="user-info">
                        <User size={18} />
                        {user.name}
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role === 'admin' ? 'Admin' : 'Client'}
                      </span>
                    </td>
                    <td>
                      {user.is_active ? (
                        <span className="status-badge active">
                          <UserCheck size={14} />
                          Active
                        </span>
                      ) : (
                        <span className="status-badge inactive">
                          <UserX size={14} />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-edit-small"
                          onClick={() => startEdit(user)}
                          title="Edit user"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-delete-small"
                          onClick={() => handleDelete(user.id, user.name)}
                          title="Delete user"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="info-box">
        <h3>ℹ️ User Management Guide:</h3>
        <ul>
          <li><strong>Admin</strong> users have full access to manage users and analyses</li>
          <li><strong>Client</strong> users can only view analyses assigned to them</li>
          <li>Inactive users cannot login to the dashboard</li>
          <li>After creating a user, assign analyses to them in the "User Assignments" tab</li>
        </ul>
      </div>
    </div>
  );
};

export default UserManagement;

