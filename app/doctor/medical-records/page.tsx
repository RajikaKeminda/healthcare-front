'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { medicalRecordsAPI } from '../../../lib/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { FileText, Calendar, User, ArrowLeft, Plus, Eye, Edit, Trash2, Filter } from 'lucide-react';
import Link from 'next/link';

export default function DoctorMedicalRecords() {
  const { user } = useAuth() as any;
  const [loading, setLoading] = useState(true);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    patient: ''
  });

  useEffect(() => {
    fetchMedicalRecords();
  }, [pagination.currentPage]);

  useEffect(() => {
    filterRecords();
  }, [medicalRecords, filters]);

  const fetchMedicalRecords = async () => {
    try {
      setLoading(true);
      const response = await medicalRecordsAPI.getAll({
        doctorID: user._id,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage
      });
      
      setMedicalRecords(response.data.data.medicalRecords);
      setPagination(response.data.data.pagination);
    } catch (error) {
      toast.error('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...medicalRecords];

    if (filters.dateFrom) {
      filtered = filtered.filter((record: any) => new Date(record.visitDate) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      filtered = filtered.filter((record: any) => new Date(record.visitDate) <= new Date(filters.dateTo));
    }

    if (filters.patient) {
      filtered = filtered.filter((record: any) => 
        record.patientID?.userName?.toLowerCase().includes(filters.patient.toLowerCase())
      );
    }

    setFilteredRecords(filtered);
  };

  const deleteRecord = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this medical record? This action cannot be undone.')) {
      return;
    }

    try {
      await medicalRecordsAPI.delete(recordId);
      toast.success('Medical record deleted successfully');
      fetchMedicalRecords();
    } catch (error) {
      toast.error('Failed to delete medical record');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link
                href="/doctor/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Medical Records</h1>
            </div>
            <Link
              href="/doctor/medical-records/create"
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Record
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <Filter className="w-5 h-5 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient Name
              </label>
              <input
                type="text"
                value={filters.patient}
                onChange={(e) => setFilters(prev => ({ ...prev, patient: e.target.value }))}
                placeholder="Search by patient name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ dateFrom: '', dateTo: '', patient: '' })}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Medical Records List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Medical Records ({filteredRecords.length})
            </h2>
            
            {filteredRecords.length > 0 ? (
              <div className="space-y-4">
                {filteredRecords.map((record: any) => (
                  <div key={record._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <FileText className="w-8 h-8 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              {record.patientID?.userName || 'Unknown Patient'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Visit on {new Date(record.visitDate).toLocaleDateString()}
                            </p>
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">
                                <strong>Chief Complaint:</strong> {record.chiefComplaint}
                              </p>
                              {record.diagnosis && record.diagnosis.length > 0 && (
                                <p className="text-sm text-gray-600 mt-1">
                                  <strong>Diagnosis:</strong> {record.diagnosis.map((d: any) => d.description).join(', ')}
                                </p>
                              )}
                            </div>
                            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(record.visitDate).toLocaleDateString()}
                              </div>
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-1" />
                                {record.hospitalID?.name || 'Unknown Hospital'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <div className="flex space-x-2">
                          <Link
                            href={`/doctor/medical-records/${record._id}`}
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Link>
                          <Link
                            href={`/doctor/medical-records/${record._id}/edit`}
                            className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 flex items-center"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Link>
                          <button
                            onClick={() => deleteRecord(record._id)}
                            className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 flex items-center"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </button>
                        </div>
                        
                        {record.attachments && record.attachments.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {record.attachments.length} attachment(s)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No medical records found</h3>
                <p className="text-gray-500 mb-4">
                  {medicalRecords.length === 0 
                    ? "You haven't created any medical records yet."
                    : "No records match your current filters."
                  }
                </p>
                {medicalRecords.length === 0 && (
                  <Link
                    href="/doctor/medical-records/create"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Medical Record
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={pagination.currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={pagination.currentPage === pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                  </span> of{' '}
                  <span className="font-medium">{pagination.totalItems}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                    disabled={pagination.currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

