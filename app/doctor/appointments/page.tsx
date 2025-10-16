'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { appointmentsAPI } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { ArrowLeft, Calendar, Clock, User, Filter, Search } from 'lucide-react';

export default function DoctorAppointmentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth() as any;
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [filters, setFilters] = useState({
    status: '',
    date: '',
    search: ''
  });

  useEffect(() => {
    if (!authLoading && user && user.role !== 'healthcare_professional') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pagination.currentPage, filters.status, filters.date]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        doctorID: user._id
      };
      if (filters.status) params.status = filters.status;
      if (filters.date) params.date = filters.date;

      const res = await appointmentsAPI.getAll(params);
      setAppointments(res.data.data.appointments);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      await appointmentsAPI.update(id, { status });
      toast.success('Appointment status updated');
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (!filters.search) return true;
    const query = filters.search.toLowerCase();
    return (
      apt.patientID?.userName?.toLowerCase().includes(query) ||
      apt.patientID?.email?.toLowerCase().includes(query)
    );
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <Link href="/doctor/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Patient</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Name or email"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: '', date: '', search: '' })}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Appointments ({filteredAppointments.length})
            </h2>
            {filteredAppointments.length > 0 ? (
              <div className="space-y-4">
                {filteredAppointments.map((apt) => (
                  <div key={apt._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <User className="w-8 h-8 text-gray-400" />
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              {apt.patientID?.userName || 'Unknown'}
                            </h3>
                            <p className="text-sm text-gray-500">{apt.patientID?.email}</p>
                            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(apt.date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {apt.time}
                              </div>
                              <span className="capitalize">{apt.type}</span>
                            </div>
                            {apt.symptoms && apt.symptoms.length > 0 && (
                              <p className="mt-2 text-sm text-gray-500">
                                Symptoms: {apt.symptoms.join(', ')}
                              </p>
                            )}
                            {apt.notes && (
                              <p className="mt-2 text-sm text-gray-500">Notes: {apt.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            apt.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            apt.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            apt.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {apt.status}
                        </span>
                        <div className="flex space-x-2">
                          {apt.status === 'scheduled' && (
                            <button
                              onClick={() => updateAppointmentStatus(apt._id, 'in_progress')}
                              className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                            >
                              Start
                            </button>
                          )}
                          {apt.status === 'in_progress' && (
                            <button
                              onClick={() => updateAppointmentStatus(apt._id, 'completed')}
                              className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                            >
                              Complete
                            </button>
                          )}
                          <Link
                            href={`/doctor/medical-records/create?patientId=${apt.patientID?._id}&appointmentId=${apt._id}`}
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            Add Record
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No appointments found</p>
            )}
          </div>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              disabled={pagination.currentPage === 1}
              className="px-4 py-2 mr-2 border border-gray-300 rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-4 py-2 ml-2 border border-gray-300 rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

