'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { appointmentsAPI } from '../../../lib/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Calendar, Clock, MapPin, User, ArrowLeft, Plus, Filter } from 'lucide-react';
import Link from 'next/link';

export default function PatientAppointments() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    fetchAppointments();
  }, [pagination.currentPage]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, filters]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentsAPI.getAll({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage
      });
      
      setAppointments(response.data.data.appointments);
      setPagination(response.data.data.pagination);
    } catch (error) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    if (filters.status) {
      filtered = filtered.filter(apt => apt.status === filters.status);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(apt => new Date(apt.date) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      filtered = filtered.filter(apt => new Date(apt.date) <= new Date(filters.dateTo));
    }

    setFilteredAppointments(filtered);
  };

  const cancelAppointment = async (appointmentId) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      await appointmentsAPI.cancel(appointmentId, 'Cancelled by patient');
      toast.success('Appointment cancelled successfully');
      fetchAppointments();
    } catch (error) {
      toast.error('Failed to cancel appointment');
    }
  };

  const rescheduleAppointment = (appointmentId) => {
    // Redirect to booking page with appointment ID for rescheduling
    window.location.href = `/patient/appointments/book?reschedule=${appointmentId}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canCancel = (appointment) => {
    const appointmentDate = new Date(appointment.date);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);
    
    return appointment.status === 'scheduled' && hoursUntilAppointment > 24;
  };

  const canReschedule = (appointment) => {
    const appointmentDate = new Date(appointment.date);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);
    
    return appointment.status === 'scheduled' && hoursUntilAppointment > 24;
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
                href="/patient/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
            </div>
            <Link
              href="/patient/appointments/book"
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Book New Appointment
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
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>
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
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: '', dateFrom: '', dateTo: '' })}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Filters
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
                {filteredAppointments.map((appointment) => (
                  <div key={appointment._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <User className="w-8 h-8 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              Dr. {appointment.doctorID?.userName || 'Unknown Doctor'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {appointment.doctorID?.specialization || 'Unknown Specialization'}
                            </p>
                            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(appointment.date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {appointment.time}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {appointment.hospitalID?.name || 'Unknown Hospital'}
                              </div>
                            </div>
                            {appointment.symptoms && appointment.symptoms.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-600">
                                  <strong>Symptoms:</strong> {appointment.symptoms.join(', ')}
                                </p>
                              </div>
                            )}
                            {appointment.notes && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-600">
                                  <strong>Notes:</strong> {appointment.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                          {appointment.status.replace('_', ' ').toUpperCase()}
                        </span>
                        
                        <div className="flex space-x-2">
                          {canReschedule(appointment) && (
                            <button
                              onClick={() => rescheduleAppointment(appointment._id)}
                              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                            >
                              Reschedule
                            </button>
                          )}
                          {canCancel(appointment) && (
                            <button
                              onClick={() => cancelAppointment(appointment._id)}
                              className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                        
                        {appointment.reservationFee && (
                          <div className="text-xs text-gray-500">
                            <p>Reservation Fee: LKR {appointment.reservationFee.amount}</p>
                            <p className={appointment.reservationFee.paid ? 'text-green-600' : 'text-red-600'}>
                              {appointment.reservationFee.paid ? 'Paid' : 'Pending'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
                <p className="text-gray-500 mb-4">
                  {appointments.length === 0 
                    ? "You haven't booked any appointments yet."
                    : "No appointments match your current filters."
                  }
                </p>
                {appointments.length === 0 && (
                  <Link
                    href="/patient/appointments/book"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Book Your First Appointment
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
