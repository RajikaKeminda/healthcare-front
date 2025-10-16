'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { appointmentsAPI, paymentsAPI, medicalRecordsAPI, hospitalsAPI } from '../../../lib/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Calendar, Clock, CreditCard, FileText, User, LogOut, Plus, Eye, Download } from 'lucide-react';
import Link from 'next/link';

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    totalAppointments: 0,
    totalPayments: 0,
    medicalRecords: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch appointments
      const appointmentsResponse = await appointmentsAPI.getAll({ limit: 10 });
      const appointments = appointmentsResponse.data.data.appointments;
      setRecentAppointments(appointments);
      
      // Filter upcoming appointments
      const upcoming = appointments.filter(apt => 
        new Date(apt.date) > new Date() && apt.status === 'scheduled'
      );
      setUpcomingAppointments(upcoming);
      
      // Fetch payments
      const paymentsResponse = await paymentsAPI.getAll({ limit: 10 });
      const payments = paymentsResponse.data.data.payments;
      setRecentPayments(payments);
      
      // Fetch medical records count
      const recordsResponse = await medicalRecordsAPI.getAll({ limit: 1 });
      const recordsCount = recordsResponse.data.data.pagination.totalItems;
      
      // Calculate stats
      setStats({
        upcomingAppointments: upcoming.length,
        totalAppointments: appointments.length,
        totalPayments: payments.length,
        medicalRecords: recordsCount,
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const cancelAppointment = async (appointmentId) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      await appointmentsAPI.cancel(appointmentId, 'Cancelled by patient');
      toast.success('Appointment cancelled successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to cancel appointment');
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
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{user?.userName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Upcoming Appointments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.upcomingAppointments}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Appointments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalAppointments}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCard className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Payments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalPayments}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Medical Records
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.medicalRecords}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/patient/appointments/book"
                className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Book Appointment
              </Link>
              <Link
                href="/patient/medical-records"
                className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Medical Records
              </Link>
              <Link
                href="/patient/payments"
                className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Payment History
              </Link>
              <Link
                href="/patient/profile"
                className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <User className="w-4 h-4 mr-2" />
                Update Profile
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Appointments */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Upcoming Appointments
                </h3>
                <Link
                  href="/patient/appointments"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((appointment) => (
                    <div key={appointment._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Dr. {appointment.doctorID?.userName || 'Unknown Doctor'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {appointment.doctorID?.specialization || 'Unknown Specialization'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                          </p>
                          <p className="text-sm text-gray-500">
                            {appointment.hospitalID?.name || 'Unknown Hospital'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {appointment.status}
                          </span>
                          <button
                            onClick={() => cancelAppointment(appointment._id)}
                            className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No upcoming appointments</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recent Payments
                </h3>
                <Link
                  href="/patient/payments"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {recentPayments.length > 0 ? (
                  recentPayments.map((payment) => (
                    <div key={payment._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            LKR {payment.amount.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {payment.method.replace('_', ' ').toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </p>
                          {payment.appointmentID && (
                            <p className="text-sm text-gray-500">
                              Appointment: {payment.appointmentID.appointmentID}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {payment.status}
                          </span>
                          {payment.status === 'completed' && (
                            <button
                              onClick={() => {
                                // Generate receipt
                                paymentsAPI.generateReceipt(payment._id, 'pdf')
                                  .then(() => toast.success('Receipt generated'))
                                  .catch(() => toast.error('Failed to generate receipt'));
                              }}
                              className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                            >
                              <Download className="w-3 h-3 inline mr-1" />
                              Receipt
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No payments found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
