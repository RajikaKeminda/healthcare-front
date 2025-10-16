'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { appointmentsAPI, paymentsAPI, medicalRecordsAPI, hospitalsAPI } from '../../../lib/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Calendar, Clock, CreditCard, FileText, User, LogOut, Plus, Eye, Download } from 'lucide-react';
import Link from 'next/link';

export default function PatientDashboard() {
  const { user, logout } = useAuth() as any;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    totalAppointments: 0,
    totalPayments: 0,
    medicalRecords: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);

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
      const upcoming = appointments.filter((apt: any) => 
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

  const generateReceipt = async (payment: any) => {
    try {
      // Generate receipt number if not exists
      const response = await paymentsAPI.generateReceipt(payment._id, 'pdf');
      const receiptData = response.data.data.receipt;

      // Create printable receipt HTML
      const receiptContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${receiptData.receiptNumber || payment.transactionReference}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            .receipt-header { text-align: center; border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .receipt-header h1 { margin: 0; color: #333; font-size: 28px; }
            .receipt-header p { margin: 5px 0; color: #666; }
            .receipt-number { font-size: 20px; font-weight: bold; color: #4F46E5; margin: 15px 0; }
            .section { margin-bottom: 25px; }
            .section h2 { color: #555; border-bottom: 2px solid #ddd; padding-bottom: 8px; margin-bottom: 15px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .info-row { margin: 8px 0; }
            .label { font-weight: bold; color: #666; display: inline-block; width: 150px; }
            .value { color: #333; }
            .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            .items-table th { background: #f3f4f6; padding: 12px; text-align: left; border-bottom: 2px solid #333; }
            .items-table td { padding: 10px; border-bottom: 1px solid #ddd; }
            .total-section { margin-top: 20px; padding-top: 20px; border-top: 2px solid #333; }
            .total-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 16px; }
            .grand-total { font-size: 20px; font-weight: bold; color: #4F46E5; }
            .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
            .status-completed { background: #10B981; color: white; }
            .status-pending { background: #F59E0B; color: white; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="receipt-header">
            <h1>PAYMENT RECEIPT</h1>
            <p>${payment.hospitalID?.name || 'Healthcare System'}</p>
            ${payment.hospitalID?.address ? `<p>${payment.hospitalID.address.street}, ${payment.hospitalID.address.city}</p>` : ''}
            <div class="receipt-number">Receipt #: ${receiptData.receiptNumber || payment.transactionReference}</div>
            <span class="status-badge status-${payment.status}">${payment.status.toUpperCase()}</span>
          </div>

          <div class="section">
            <h2>Payment Information</h2>
            <div class="info-grid">
              <div>
                <div class="info-row">
                  <span class="label">Patient Name:</span>
                  <span class="value">${user?.userName || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Transaction Ref:</span>
                  <span class="value">${payment.transactionReference || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Payment Method:</span>
                  <span class="value">${payment.method.replace('_', ' ').toUpperCase()}</span>
                </div>
              </div>
              <div>
                <div class="info-row">
                  <span class="label">Payment Date:</span>
                  <span class="value">${new Date(payment.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="info-row">
                  <span class="label">Payment Time:</span>
                  <span class="value">${new Date(payment.createdAt).toLocaleTimeString()}</span>
                </div>
                ${payment.appointmentID ? `
                <div class="info-row">
                  <span class="label">Appointment ID:</span>
                  <span class="value">${payment.appointmentID.appointmentID || 'N/A'}</span>
                </div>
                ` : ''}
              </div>
            </div>
          </div>

          ${payment.billingDetails?.services && payment.billingDetails.services.length > 0 ? `
          <div class="section">
            <h2>Services / Items</h2>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: center;">Quantity</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${payment.billingDetails.services.map((service: any) => `
                  <tr>
                    <td>${service.serviceName}</td>
                    <td style="text-align: center;">${service.quantity}</td>
                    <td style="text-align: right;">LKR ${service.unitPrice.toFixed(2)}</td>
                    <td style="text-align: right;">LKR ${(service.unitPrice * service.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="total-section">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>LKR ${payment.billingDetails.subtotal.toFixed(2)}</span>
              </div>
              ${payment.billingDetails.tax > 0 ? `
              <div class="total-row">
                <span>Tax:</span>
                <span>LKR ${payment.billingDetails.tax.toFixed(2)}</span>
              </div>
              ` : ''}
              ${payment.billingDetails.discount > 0 ? `
              <div class="total-row">
                <span>Discount:</span>
                <span>- LKR ${payment.billingDetails.discount.toFixed(2)}</span>
              </div>
              ` : ''}
              <div class="total-row grand-total">
                <span>TOTAL PAID:</span>
                <span>LKR ${payment.billingDetails.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          ` : `
          <div class="section">
            <h2>Payment Amount</h2>
            <div class="total-row grand-total">
              <span>TOTAL PAID:</span>
              <span>LKR ${payment.amount.toFixed(2)}</span>
            </div>
          </div>
          `}

          ${payment.insuranceInfo && payment.method === 'insurance' ? `
          <div class="section">
            <h2>Insurance Information</h2>
            <div class="info-row">
              <span class="label">Provider:</span>
              <span class="value">${payment.insuranceInfo.provider || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Policy Number:</span>
              <span class="value">${payment.insuranceInfo.policyNumber || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Claim Number:</span>
              <span class="value">${payment.insuranceInfo.claimNumber || 'N/A'}</span>
            </div>
          </div>
          ` : ''}

          <div class="footer">
            <p><strong>Thank you for your payment!</strong></p>
            <p>This is a computer-generated receipt. No signature required.</p>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            ${payment.hospitalID?.contactInfo?.phone ? `<p>For inquiries, please contact: ${payment.hospitalID.contactInfo.phone}</p>` : ''}
          </div>
        </body>
        </html>
      `;

      // Open print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(receiptContent);
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
          printWindow.print();
          toast.success('Receipt ready for download');
        }, 250);
      } else {
        toast.error('Please allow pop-ups to download the receipt');
      }
    } catch (err) {
      console.error('Receipt generation error:', err);
      toast.error('Failed to generate receipt');
    }
  };

  const cancelAppointment = async (appointmentId: any) => {
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
                              onClick={() => generateReceipt(payment)}
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
