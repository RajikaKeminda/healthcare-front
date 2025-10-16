'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { appointmentsAPI, paymentsAPI, usersAPI } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { ArrowLeft, Download, FileText, Calendar, DollarSign, Users } from 'lucide-react';

export default function StaffReportsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth() as any;
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('appointments');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && user && user.role !== 'hospital_staff') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const generateReport = async () => {
    try {
      setGenerating(true);
      setReportData(null);

      if (reportType === 'appointments') {
        const res = await appointmentsAPI.getAll({ limit: 100 });
        const appointments = res.data.data.appointments.filter((apt: any) => {
          const aptDate = new Date(apt.date);
          return aptDate >= new Date(dateRange.start) && aptDate <= new Date(dateRange.end);
        });

        const stats = {
          total: appointments.length,
          scheduled: appointments.filter((apt: any) => apt.status === 'scheduled').length,
          confirmed: appointments.filter((apt: any) => apt.status === 'confirmed').length,
          completed: appointments.filter((apt: any) => apt.status === 'completed').length,
          cancelled: appointments.filter((apt: any) => apt.status === 'cancelled').length,
        };

        setReportData({
          type: 'Appointments Report',
          dateRange,
          stats,
          data: appointments
        });
      } else if (reportType === 'payments') {
        const res = await paymentsAPI.getAll({ limit: 100 });
        const payments = res.data.data.payments.filter((pmt: any) => {
          const pmtDate = new Date(pmt.createdAt);
          return pmtDate >= new Date(dateRange.start) && pmtDate <= new Date(dateRange.end);
        });

        const totalRevenue = payments
          .filter((pmt: any) => pmt.status === 'completed')
          .reduce((sum: number, pmt: any) => sum + pmt.amount, 0);

        const stats = {
          total: payments.length,
          completed: payments.filter((pmt: any) => pmt.status === 'completed').length,
          pending: payments.filter((pmt: any) => pmt.status === 'pending').length,
          failed: payments.filter((pmt: any) => pmt.status === 'failed').length,
          totalRevenue
        };

        setReportData({
          type: 'Payments Report',
          dateRange,
          stats,
          data: payments
        });
      } else if (reportType === 'patients') {
        const res = await usersAPI.getAll({ role: 'patient', limit: 100 });
        const patients = res.data.data.users.filter((pt: any) => {
          const regDate = new Date(pt.createdAt);
          return regDate >= new Date(dateRange.start) && regDate <= new Date(dateRange.end);
        });

        const stats = {
          total: patients.length,
          active: patients.filter((pt: any) => pt.isActive).length,
          inactive: patients.filter((pt: any) => !pt.isActive).length,
        };

        setReportData({
          type: 'Patients Report',
          dateRange,
          stats,
          data: patients
        });
      }

      toast.success('Report generated successfully');
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData || !reportData.data.length) {
      toast.error('No data to export');
      return;
    }

    let csv = '';
    if (reportType === 'appointments') {
      csv = 'Date,Time,Patient,Doctor,Type,Status\n';
      reportData.data.forEach((apt: any) => {
        csv += `${new Date(apt.date).toLocaleDateString()},${apt.time},${apt.patientID?.userName || 'N/A'},${apt.doctorID?.userName || 'N/A'},${apt.type},${apt.status}\n`;
      });
    } else if (reportType === 'payments') {
      csv = 'Date,Patient,Amount,Method,Status\n';
      reportData.data.forEach((pmt: any) => {
        csv += `${new Date(pmt.createdAt).toLocaleDateString()},${pmt.patientID?.userName || 'N/A'},${pmt.amount},${pmt.method},${pmt.status}\n`;
      });
    } else if (reportType === 'patients') {
      csv = 'Name,Email,Phone,Blood Type,Registration Date\n';
      reportData.data.forEach((pt: any) => {
        csv += `${pt.userName},${pt.email},${pt.phone},${pt.bloodType || 'N/A'},${new Date(pt.createdAt).toLocaleDateString()}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  if (authLoading) {
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
            <Link href="/staff/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Generate Reports</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Report Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="appointments">Appointments Report</option>
                <option value="payments">Payments Report</option>
                <option value="patients">Patients Report</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={generateReport}
              disabled={generating}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 inline-flex items-center"
            >
              {generating ? (
                <LoadingSpinner size="small" />
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" /> Generate Report
                </>
              )}
            </button>
          </div>
        </div>

        {reportData && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">{reportData.type}</h2>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 inline-flex items-center"
              >
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Date Range: {new Date(reportData.dateRange.start).toLocaleDateString()} - {new Date(reportData.dateRange.end).toLocaleDateString()}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {Object.keys(reportData.stats).map((key) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {key === 'totalRevenue' ? `LKR ${reportData.stats[key].toFixed(2)}` : reportData.stats[key]}
                  </p>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {reportType === 'appointments' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </>
                    )}
                    {reportType === 'payments' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </>
                    )}
                    {reportType === 'patients' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.data.map((item: any, idx: number) => (
                    <tr key={idx}>
                      {reportType === 'appointments' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.time}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.patientID?.userName || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.doctorID?.userName || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{item.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{item.status}</td>
                        </>
                      )}
                      {reportType === 'payments' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.patientID?.userName || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">LKR {item.amount.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{item.method.replace('_', ' ')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{item.status}</td>
                        </>
                      )}
                      {reportType === 'patients' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.userName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.phone}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.bloodType || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.createdAt).toLocaleDateString()}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

