import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Filter, Edit, Trash2, X, Loader2 } from 'lucide-react';
import apiService from '@/services/api';

interface Department {
  id: number;
  nameEnglish: string;
  nameArabic?: string;
  employeesCount: number;
  treesPlanted: number;
  createdAt: string;
}

const Departments: React.FC = () => {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ nameEnglish: '', nameArabic: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDepartments();
      if (response.success) {
        setDepartments(response.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        nameEnglish: department.nameEnglish,
        nameArabic: department.nameArabic || '',
      });
    } else {
      setEditingDepartment(null);
      setFormData({ nameEnglish: '', nameArabic: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDepartment(null);
    setFormData({ nameEnglish: '', nameArabic: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nameEnglish.trim()) {
      alert('Name (English) is required');
      return;
    }

    try {
      setSubmitting(true);
      if (editingDepartment) {
        await apiService.updateDepartment(
          editingDepartment.id,
          formData.nameEnglish,
          formData.nameArabic || undefined
        );
      } else {
        await apiService.createDepartment(
          formData.nameEnglish,
          formData.nameArabic || undefined
        );
      }
      await fetchDepartments();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving department:', error);
      alert(error.response?.data?.error || 'Failed to save department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this department?')) {
      return;
    }

    try {
      await apiService.deleteDepartment(id);
      await fetchDepartments();
      setDeleteConfirm(null);
    } catch (error: any) {
      console.error('Error deleting department:', error);
      alert(error.response?.data?.error || 'Failed to delete department');
    }
  };

  const filteredDepartments = departments.filter((dept) =>
    dept.nameEnglish.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.nameArabic && dept.nameArabic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="p-6">
      {/* Breadcrumbs */}
      <div className="mb-4 text-sm text-gray-600">
        {t('sidebar.departments')} &gt; List
      </div>

      {/* Page Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('sidebar.departments')}</h1>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13c5bc] focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <button className="relative p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter size={20} className="text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-[#13c5bc] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              0
            </span>
          </button>
        </div>

        {/* New Department Button */}
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-[#13c5bc] text-white rounded-lg hover:bg-[#0ea5a0] transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          New department
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-[#13c5bc]" size={32} />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name (English)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name (Arabic)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employees Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trees Planted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                  Created At
                  <span className="ml-1">▼</span>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No departments found
                  </td>
                </tr>
              ) : (
                filteredDepartments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {dept.nameEnglish}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {dept.nameArabic || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {dept.employeesCount} {dept.employeesCount === 1 ? 'Employee' : 'Employees'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {dept.treesPlanted} {dept.treesPlanted === 1 ? 'Tree' : 'Trees'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(dept.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleOpenModal(dept)}
                          className="text-[#13c5bc] hover:text-[#0ea5a0] flex items-center gap-1"
                        >
                          <Edit size={16} />
                          {t('common.edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(dept.id)}
                          className="text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                          <Trash2 size={16} />
                          {t('common.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {filteredDepartments.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing 1 to {filteredDepartments.length} of {filteredDepartments.length} results
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Per page</span>
                <select className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
                  <option>10</option>
                  <option>25</option>
                  <option>50</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingDepartment ? 'Edit Department' : 'Create Department'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name (English)*
                </label>
                <input
                  type="text"
                  value={formData.nameEnglish}
                  onChange={(e) => setFormData({ ...formData, nameEnglish: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13c5bc] focus:border-transparent"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name (Arabic)
                </label>
                <input
                  type="text"
                  value={formData.nameArabic}
                  onChange={(e) => setFormData({ ...formData, nameArabic: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13c5bc] focus:border-transparent"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-[#13c5bc] text-white rounded-lg hover:bg-[#0ea5a0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      {editingDepartment ? 'Updating...' : 'Creating...'}
                    </span>
                  ) : (
                    editingDepartment ? 'Update' : 'Create'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
