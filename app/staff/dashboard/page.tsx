'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { appointmentsAPI, paymentsAPI, usersAPI } from '../../../lib/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Calendar, Clock, CreditCard, Users, User, LogOut, Building2, Plus, Eye, Edit } from 'lucide-react';
import Link from 'next/link';

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingPayments: 0,
    totalPatients: 0,
    completedAppointments: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's appointments
      const appointmentsResponse = await appointmentsAPI.getAll({ 
        date: today,
        limit: 10
      });
      const appointments = appointmentsResponse.data.data.appointments;
      setTodayAppointments(appointments);
      
      // Fetch pending payments
      const paymentsResponse = await paymentsAPI.getAll({ 
        status: 'pending',
        limit: 10
      });
      const payments = paymentsResponse.data.data.payments;
      setPendingPayments(payments);
      
      // Fetch recent patients
      const patientsResponse = await usersAPI.getAll({ 
        role: 'patient',
        limit: 5
      });
      const patients = patientsResponse.data.data.users;
      setRecentPatients(patients);
      
      // Calculate stats
      const todayAppointmentsCount = appointments.filter(apt => 
        new Date(apt.date).toDateString() === new Date().toDateString()
      ).length;
      
      const completedAppointments = appointments.filter(apt => 
        apt.status === 'completed'
      ).length;
      
      setStats({
        todayAppointments: todayAppointmentsCount,
        pendingPayments: payments.length,
        totalPatients: patients.length,
        completedAppointments,
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

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      await appointmentsAPI.update(appointmentId, { status });
      toast.success('Appointment status updated');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to update appointment status');
    }
  };

  const processPayment = async (paymentId, status) => {
    try {
      // This would typically be a separate API endpoint
      await paymentsAPI.update(paymentId, { status });
      toast.success('Payment processed');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to process payment');
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
              <Building2 className="w-8 h-8 text-indigo-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{user?.userName}</span>
                <span className="text-sm text-gray-500">({user?.staffRole})</span>
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
                      Today's Appointments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.todayAppointments}
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
                      Pending Payments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.pendingPayments}
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
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Patients
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalPatients}
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
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed Today
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.completedAppointments}
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
                href="/staff/appointments"
                className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Manage Appointments
              </Link>
              <Link
                href="/staff/payments"
                className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Process Payments
              </Link>
              <Link
                href="/staff/patients"
                className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Users className="w-4 h-4 mr-2" />
                Patient Registration
              </Link>
              <Link
                href="/staff/reports"
                className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Eye className="w-4 h-4 mr-2" />
                Generate Reports
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Appointments */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Today's Appointments
                </h3>
                <Link
                  href="/staff/appointments"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {todayAppointments.length > 0 ? (
                  todayAppointments.map((appointment) => (
                    <div key={appointment._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {appointment.patientID?.userName || 'Unknown Patient'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Dr. {appointment.doctorID?.userName || 'Unknown Doctor'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {appointment.time} - {appointment.type}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {appointment.status}
                          </span>
                          {appointment.status === 'scheduled' && (
                            <button
                              onClick={() => updateAppointmentStatus(appointment._id, 'confirmed')}
                              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                            >
                              Confirm
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No appointments scheduled for today</p>
                )}
              </div>
            </div>
          </div>

          {/* Pending Payments */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Pending Payments
                </h3>
                <Link
                  href="/staff/payments"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {pendingPayments.length > 0 ? (
                  pendingPayments.map((payment) => (
                    <div key={payment._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {payment.patientID?.userName || 'Unknown Patient'}
                          </p>
                          <p className="text-sm text-gray-500">
                            LKR {payment.amount.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {payment.method.replace('_', ' ').toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            {payment.status}
                          </span>
                          <button
                            onClick={() => processPayment(payment._id, 'completed')}
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                          >
                            Process
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No pending payments</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Patients */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recent Patients
                </h3>
                <Link
                  href="/staff/patients"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {recentPatients.length > 0 ? (
                  recentPatients.map((patient) => (
                    <div key={patient._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {patient.userName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {patient.email}
                          </p>
                          <p className="text-sm text-gray-500">
                            {patient.phone}
                          </p>
                          <p className="text-sm text-gray-500">
                            Registered: {new Date(patient.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            href={`/staff/patients/${patient._id}`}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                          >
                            <Eye className="w-3 h-3 inline mr-1" />
                            View
                          </Link>
                          <Link
                            href={`/staff/patients/${patient._id}/edit`}
                            className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                          >
                            <Edit className="w-3 h-3 inline mr-1" />
                            Edit
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No patients found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

