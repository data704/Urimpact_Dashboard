import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import apiService from '@/services/api';

interface Certification {
  id: number;
  certificationId: string;
  certificateType: string;
  receivingPartyType: 'department' | 'employee';
  departmentId?: number;
  departmentName?: string;
  employeeId?: number;
  employeeName?: string;
  awardedToName: string;
  treesCount: number;
  carbonSequestered: number;
  dateAwarded: string;
  notes?: string;
  createdAt: string;
}

const CertificationsHistory: React.FC = () => {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCertifications();
  }, []);

  const fetchCertifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCertificationsHistory();
      if (response.success) {
        setCertifications(response.data);
      }
    } catch (error) {
      console.error('Error fetching certifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCertifications = certifications.filter((cert) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      cert.certificationId.toLowerCase().includes(searchLower) ||
      cert.awardedToName.toLowerCase().includes(searchLower) ||
      (cert.departmentName && cert.departmentName.toLowerCase().includes(searchLower)) ||
      (cert.employeeName && cert.employeeName.toLowerCase().includes(searchLower))
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">All Certifications History</h1>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex justify-end">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13c5bc] focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#13c5bc]"></div>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certification ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                    Date Awarded
                    <ChevronDown className="inline ml-1 w-4 h-4" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receiving party
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Awarded To
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCertifications.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                          <X className="text-gray-400" size={32} />
                        </div>
                        <p className="text-lg font-semibold text-gray-900">No awarded certifications found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCertifications.map((cert) => (
                    <tr key={cert.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {cert.certificationId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(cert.dateAwarded)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {cert.receivingPartyType === 'department' ? 'Department' : 'Employee'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cert.awardedToName}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

export default CertificationsHistory;
