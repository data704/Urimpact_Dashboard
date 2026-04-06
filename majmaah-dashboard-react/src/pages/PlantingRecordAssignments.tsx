import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Trash2, X, Loader2, CheckCircle, Percent, TrendingUp, Building2, Briefcase, Download, TreePine, Leaf, Globe } from 'lucide-react';
import apiService from '@/services/api';
import html2pdf from 'html2pdf.js';

interface AssignmentStatistics {
  totalTreesPlanted: number;
  totalTreesAssigned: number;
  carbonEstimate: number;
  averageGrowthRate: number;
}

interface AvailableAnalysis {
  id: number;
  name: string;
  displayName?: string;
  analysisDate: string;
  analysisType: string;
  treeCount: number;
  carbonTonnes: number;
  treesAssigned: number;
  treesAvailable: number;
}

interface Assignment {
  id: number;
  analysisId: number;
  plantingRecordName: string;
  plantingType: string;
  assignToType: 'department' | 'employee';
  departmentId?: number;
  departmentName?: string;
  departmentNameArabic?: string;
  employeeId?: number;
  employeeName?: string;
  treesAssigned: number;
  assignedCarbonEmission: number;
  notes?: string;
  createdAt: string;
}

interface Department {
  id: number;
  nameEnglish: string;
  nameArabic?: string;
}

interface Employee {
  id: number;
  name: string;
  departmentId?: number;
}

interface AssignmentCertificatePreview {
  recipientName: string;
  partyType: 'department' | 'employee';
  treesAssigned: number;
  carbonTonnes: number;
  plantingRecordName: string;
  certificationId: string;
  dateLabel: string;
}

const PlantingRecordAssignments: React.FC = () => {
  const { t } = useTranslation();
  const [statistics, setStatistics] = useState<AssignmentStatistics>({
    totalTreesPlanted: 0,
    totalTreesAssigned: 0,
    carbonEstimate: 0,
    averageGrowthRate: 0,
  });
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableAnalyses, setAvailableAnalyses] = useState<AvailableAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'department' | 'employee'>('department');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    analysisId: '',
    treesAssigned: '',
    assignToType: 'department' as 'department' | 'employee',
    departmentId: '',
    employeeId: '',
    plantingType: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [certificatePreview, setCertificatePreview] = useState<AssignmentCertificatePreview | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsResponse, assignmentsResponse, departmentsResponse, employeesResponse, analysesResponse] = await Promise.all([
        apiService.getAssignmentStatistics(),
        apiService.getPlantingRecordAssignments(activeTab),
        apiService.getDepartments(),
        apiService.getEmployees(),
        apiService.getAvailableAnalyses(),
      ]);

      if (statsResponse.success) {
        setStatistics(statsResponse.data);
      }

      if (assignmentsResponse.success) {
        setAssignments(assignmentsResponse.data);
      }

      if (departmentsResponse.success) {
        setDepartments(departmentsResponse.data);
      }

      if (employeesResponse.success) {
        setEmployees(employeesResponse.data);
      }

      if (analysesResponse.success) {
        setAvailableAnalyses(analysesResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      analysisId: '',
      treesAssigned: '',
      assignToType: 'department',
      departmentId: '',
      employeeId: '',
      plantingType: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      analysisId: '',
      treesAssigned: '',
      assignToType: 'department',
      departmentId: '',
      employeeId: '',
      plantingType: '',
      notes: '',
    });
  };

  const validateAssignmentForm = (): boolean => {
    if (!formData.analysisId) {
      alert('Planting Record is required');
      return false;
    }
    if (!formData.treesAssigned || parseInt(formData.treesAssigned, 10) <= 0) {
      alert('Number of trees must be greater than 0');
      return false;
    }
    if (formData.assignToType === 'department' && !formData.departmentId) {
      alert('Department is required');
      return false;
    }
    if (formData.assignToType === 'employee' && !formData.employeeId) {
      alert('Employee is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAssignmentForm()) return;

    try {
      setSubmitting(true);
      await apiService.createPlantingRecordAssignment({
        analysisId: parseInt(formData.analysisId, 10),
        assignToType: formData.assignToType,
        departmentId: formData.departmentId ? parseInt(formData.departmentId, 10) : undefined,
        employeeId: formData.employeeId ? parseInt(formData.employeeId, 10) : undefined,
        treesAssigned: parseInt(formData.treesAssigned, 10),
        plantingType: formData.plantingType || undefined,
        notes: formData.notes || undefined,
      });
      await fetchData();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      alert(error.response?.data?.error || 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCertificate = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!validateAssignmentForm()) return;

    try {
      setSubmitting(true);
      const response = await apiService.createPlantingRecordAssignment({
        analysisId: parseInt(formData.analysisId, 10),
        assignToType: formData.assignToType,
        departmentId: formData.departmentId ? parseInt(formData.departmentId, 10) : undefined,
        employeeId: formData.employeeId ? parseInt(formData.employeeId, 10) : undefined,
        treesAssigned: parseInt(formData.treesAssigned, 10),
        plantingType: formData.plantingType || undefined,
        notes: formData.notes || undefined,
      });

      await fetchData();
      handleCloseModal();

      if (response.success && response.data) {
        const d = response.data;
        const recipientName =
          d.assignToType === 'department'
            ? d.departmentName || 'Department'
            : d.employeeName || 'Employee';
        const carbon = Math.round((d.assignedCarbonEmission || 0) * 100) / 100;
        const certId =
          d.certificationId ||
          `PRT-${d.id}-${new Date().toISOString().slice(0, 10)}`;

        setCertificatePreview({
          recipientName,
          partyType: d.assignToType,
          treesAssigned: d.treesAssigned,
          carbonTonnes: carbon,
          plantingRecordName: d.plantingRecordName || 'Planting record',
          certificationId: certId,
          dateLabel: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        });
      }
    } catch (error: any) {
      console.error('Error creating assignment with certificate:', error);
      alert(error.response?.data?.error || 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseCertificateModal = () => {
    setCertificatePreview(null);
  };

  const handleDownloadAssignmentCertificatePdf = () => {
    if (!certificateRef.current || !certificatePreview) return;
    const safeName = certificatePreview.recipientName.toLowerCase().replace(/\s+/g, '-');
    const opt = {
      margin: 0,
      filename: `planting-assignment-certificate-${safeName}-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'landscape' as const,
      },
    };
    html2pdf().set(opt).from(certificateRef.current).save();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      await apiService.deletePlantingRecordAssignment(id);
      await fetchData();
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      alert(error.response?.data?.error || 'Failed to delete assignment');
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      assignment.plantingRecordName?.toLowerCase().includes(searchLower) ||
      (assignment.departmentName && assignment.departmentName.toLowerCase().includes(searchLower)) ||
      (assignment.employeeName && assignment.employeeName.toLowerCase().includes(searchLower))
    );
  });

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

  const selectedAnalysis = availableAnalyses.find(a => a.id.toString() === formData.analysisId);
  const maxTreesAvailable = selectedAnalysis?.treesAvailable || 0;

  return (
    <div className="p-6">
      {/* Breadcrumbs */}
      <div className="mb-4 text-sm text-gray-600">
        {t('sidebar.plantingRecordAssignments')} &gt; List
      </div>

      {/* Page Title */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('sidebar.plantingRecordAssignments')}</h1>
        <button
          onClick={handleOpenModal}
          className="px-4 py-2 bg-[#13c5bc] text-white rounded-lg hover:bg-[#0ea5a0] transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          New Planting Record Assignment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Trees Planted Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-full">
                <CheckCircle className="text-gray-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total of planted trees</p>
                <p className="text-3xl font-bold text-[#13c5bc]">{statistics.totalTreesPlanted.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Carbon Estimate Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-full">
                <Percent className="text-gray-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">TONS OF CO₂ per year</p>
                <p className="text-3xl font-bold text-[#13c5bc]">{statistics.carbonEstimate.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Average Growth Rate Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-full">
                <TrendingUp className="text-gray-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Growth Rate per year</p>
                <p className="text-3xl font-bold text-[#13c5bc]">{statistics.averageGrowthRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('department')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'department'
              ? 'bg-[#13c5bc] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Building2 size={20} />
          Departments
        </button>
        <button
          onClick={() => setActiveTab('employee')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'employee'
              ? 'bg-[#13c5bc] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Briefcase size={20} />
          Employees
        </button>
      </div>

      {/* Search and Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13c5bc] focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-[#13c5bc]" size={32} />
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {activeTab === 'department' ? (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                  ) : (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Planting Record
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Planting Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trees Assigned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Carbon Emission
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
                {filteredAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'department' ? 8 : 8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                          <X className="text-gray-400" size={32} />
                        </div>
                        <p className="text-lg font-semibold text-gray-900">No Planting Record Assignments</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAssignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {activeTab === 'department'
                          ? assignment.departmentName || '-'
                          : assignment.employeeName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {assignment.plantingRecordName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {assignment.plantingType || 'Standard'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {assignment.treesAssigned.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {assignment.assignedCarbonEmission.toFixed(2)} tons
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(assignment.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(assignment.id)}
                          className="text-red-600 hover:text-red-700 flex items-center gap-1 ml-auto"
                        >
                          <Trash2 size={16} />
                          {t('common.delete')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Create Assignment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-900">Create Planting Record Assignment</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              {/* Planting Record */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Planting Record*
                </label>
                <select
                  value={formData.analysisId}
                  onChange={(e) => setFormData({ ...formData, analysisId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13c5bc] focus:border-transparent"
                  required
                >
                  <option value="">Select an option</option>
                  {availableAnalyses.map((analysis) => (
                    <option key={analysis.id} value={analysis.id}>
                      {analysis.name} ({analysis.treesAvailable} trees available)
                    </option>
                  ))}
                </select>
              </div>

              {/* Number of Trees */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Trees
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={maxTreesAvailable}
                    value={formData.treesAssigned}
                    onChange={(e) => setFormData({ ...formData, treesAssigned: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13c5bc] focus:border-transparent"
                    required
                  />
                  <span className="text-gray-600">Trees</span>
                </div>
                {selectedAnalysis && (
                  <p className="mt-1 text-sm text-gray-500">
                    Available: {maxTreesAvailable} trees
                  </p>
                )}
              </div>

              {/* Assign To Toggle */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To ?*
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, assignToType: 'department', employeeId: '' });
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                      formData.assignToType === 'department'
                        ? 'border-[#13c5bc] bg-[#13c5bc] text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Building2 size={20} />
                    department
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, assignToType: 'employee', departmentId: '' });
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                      formData.assignToType === 'employee'
                        ? 'border-[#13c5bc] bg-[#13c5bc] text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Briefcase size={20} />
                    employee
                  </button>
                </div>
              </div>

              {/* Department/Employee Selection */}
              {formData.assignToType === 'department' ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department*
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13c5bc] focus:border-transparent"
                    required={formData.assignToType === 'department'}
                  >
                    <option value="">Select an option</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id.toString()}>
                        {dept.nameEnglish}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee*
                  </label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13c5bc] focus:border-transparent"
                    required={formData.assignToType === 'employee'}
                  >
                    <option value="">Select an option</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id.toString()}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Planting Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Planting Type
                </label>
                <input
                  type="text"
                  value={formData.plantingType}
                  onChange={(e) => setFormData({ ...formData, plantingType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13c5bc] focus:border-transparent"
                  placeholder="e.g., Standard, Organic, etc."
                />
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13c5bc] focus:border-transparent"
                  placeholder="Additional notes..."
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
                      Creating...
                    </span>
                  ) : (
                    'Create'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCreateCertificate}
                  disabled={submitting}
                  className="px-4 py-2 bg-white text-[#13c5bc] border-2 border-[#13c5bc] rounded-lg hover:bg-teal-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Create certificate
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

      {/* Assignment certificate (after Create certificate) */}
      {certificatePreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl my-8 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-900">Planting assignment certificate</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadAssignmentCertificatePdf}
                  className="flex items-center gap-2 px-4 py-2 bg-[#13c5bc] text-white rounded-lg hover:bg-[#0ea5a0] text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={handleCloseCertificateModal}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  <X size={22} />
                </button>
              </div>
            </div>
            <div className="p-6 bg-gray-50">
              <div
                ref={certificateRef}
                className="assignment-certificate-print"
                style={{
                  width: '297mm',
                  minHeight: '210mm',
                  margin: '0 auto',
                  background: '#ffffff',
                  padding: 0,
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                }}
              >
                <div
                  style={{
                    background: 'linear-gradient(to right, #13c5bc, #059669)',
                    padding: '50px 80px',
                    textAlign: 'center',
                    width: '100%',
                  }}
                >
                  <h1
                    style={{
                      fontSize: '32pt',
                      fontWeight: 'bold',
                      margin: '0 0 12px 0',
                      color: '#ffffff',
                      lineHeight: '1.2',
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                      fontFamily: 'Arial, Helvetica, sans-serif',
                    }}
                  >
                    CERTIFICATE OF TREE ASSIGNMENT
                  </h1>
                  <p
                    style={{
                      fontSize: '16pt',
                      margin: 0,
                      color: '#ffffff',
                      fontFamily: 'Arial, Helvetica, sans-serif',
                    }}
                  >
                    Issued to {certificatePreview.partyType === 'department' ? 'Department' : 'Employee'}
                  </p>
                </div>

                <div
                  style={{
                    padding: '48px 72px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <p
                      style={{
                        fontSize: '15pt',
                        lineHeight: 1.75,
                        color: '#000000',
                        margin: '0 auto',
                        maxWidth: '90%',
                        fontFamily: 'Arial, Helvetica, sans-serif',
                      }}
                    >
                      This certificate is issued to{' '}
                      <strong style={{ color: '#13c5bc' }}>{certificatePreview.recipientName}</strong> for the assignment
                      of trees under the planting record{' '}
                      <strong>{certificatePreview.plantingRecordName}</strong>, in support of the Saudi Green Initiative
                      and environmental sustainability.
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
                      gap: 0,
                      marginTop: '28px',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                      <TreePine
                        size={56}
                        strokeWidth={1.5}
                        style={{ margin: '0 auto 16px', color: '#000000' }}
                      />
                      <div
                        style={{
                          fontSize: '48pt',
                          fontWeight: 'bold',
                          lineHeight: 1,
                          marginBottom: '12px',
                          color: '#13c5bc',
                          fontFamily: 'Arial, Helvetica, sans-serif',
                        }}
                      >
                        {certificatePreview.treesAssigned.toLocaleString()}
                      </div>
                      <div
                        style={{
                          fontSize: '13pt',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          color: '#000000',
                          fontFamily: 'Arial, Helvetica, sans-serif',
                        }}
                      >
                        Trees assigned
                      </div>
                    </div>
                    <div
                      style={{
                        width: '1px',
                        height: '100%',
                        background: '#13c5bc',
                        margin: '0 16px',
                      }}
                    />
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                      <Leaf size={56} strokeWidth={1.5} style={{ margin: '0 auto 16px', color: '#000000' }} />
                      <div
                        style={{
                          fontSize: '22pt',
                          fontWeight: 'normal',
                          lineHeight: 1.35,
                          color: '#13c5bc',
                          fontFamily: 'Arial, Helvetica, sans-serif',
                          marginTop: '8px',
                        }}
                      >
                        {certificatePreview.recipientName}
                      </div>
                      <div
                        style={{
                          fontSize: '13pt',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          color: '#000000',
                          marginTop: '14px',
                          fontFamily: 'Arial, Helvetica, sans-serif',
                        }}
                      >
                        {certificatePreview.partyType === 'department' ? 'Department' : 'Employee'}
                      </div>
                    </div>
                    <div
                      style={{
                        width: '1px',
                        height: '100%',
                        background: '#13c5bc',
                        margin: '0 16px',
                      }}
                    />
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                      <Globe size={56} strokeWidth={1.5} style={{ margin: '0 auto 16px', color: '#000000' }} />
                      <div
                        style={{
                          fontSize: '48pt',
                          fontWeight: 'bold',
                          lineHeight: 1,
                          marginBottom: '12px',
                          color: '#13c5bc',
                          fontFamily: 'Arial, Helvetica, sans-serif',
                        }}
                      >
                        {certificatePreview.carbonTonnes.toLocaleString()}
                      </div>
                      <div
                        style={{
                          fontSize: '13pt',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          color: '#000000',
                          fontFamily: 'Arial, Helvetica, sans-serif',
                        }}
                      >
                        Tons CO₂ (assigned share)
                      </div>
                    </div>
                  </div>

                  <p
                    style={{
                      textAlign: 'center',
                      marginTop: '36px',
                      fontSize: '12pt',
                      color: '#374151',
                      fontFamily: 'Arial, Helvetica, sans-serif',
                    }}
                  >
                    Date of issue: {certificatePreview.dateLabel}
                  </p>
                </div>

                <div
                  style={{
                    padding: '24px 72px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    borderTop: '1px solid #e5e7eb',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '10pt', margin: '2px 0', color: '#000000', fontFamily: 'Arial, Helvetica, sans-serif' }}>
                      Certificate ID: {certificatePreview.certificationId}
                    </p>
                    <p style={{ fontSize: '10pt', margin: '2px 0', color: '#000000', fontFamily: 'Arial, Helvetica, sans-serif' }}>
                      Verify at urimpact.com/verify
                    </p>
                  </div>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <img
                      src="/assets/img/URIMPACT_LOGO.png"
                      alt=""
                      style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      border: '1px solid #ddd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      color: '#666',
                    }}
                  >
                    QR Code
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantingRecordAssignments;
