'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { analyticsAPI } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { ArrowLeft, Download, FileText, DollarSign, Users } from 'lucide-react';

export default function ManagerReportsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!authLoading && user && user.role !== 'healthcare_manager') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleExport = async (type: string, format: string) => {
    setDownloading(`${type}-${format}`);
    try {
      const response = await analyticsAPI.export({
        type,
        format,
        dateFrom: new Date(dateRange.from).toISOString(),
        dateTo: new Date(dateRange.to).toISOString()
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_report_${dateRange.from}_to_${dateRange.to}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setDownloading(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const reports = [
    {
      title: 'Appointments Report',
      description: 'Comprehensive report of all appointments including status, doctors, and patients',
      icon: FileText,
      type: 'appointments',
      color: 'indigo'
    },
    {
      title: 'Financial Report',
      description: 'Detailed financial data including revenue, payments, and transactions',
      icon: DollarSign,
      type: 'financial',
      color: 'green'
    },
    {
      title: 'Patients Report',
      description: 'Patient registration data, demographics, and activity history',
      icon: Users,
      type: 'patients',
      color: 'blue'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <Link href="/manager/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Export</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Date Range Selector */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Select Date Range</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <div key={report.type} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-lg bg-${report.color}-100`}>
                    <Icon className={`w-6 h-6 text-${report.color}-600`} />
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">{report.title}</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">{report.description}</p>
                
                <div className="space-y-2">
                  <button
                    onClick={() => handleExport(report.type, 'json')}
                    disabled={downloading === `${report.type}-json`}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {downloading === `${report.type}-json` ? 'Exporting...' : 'Export as JSON'}
                  </button>
                  <button
                    onClick={() => handleExport(report.type, 'csv')}
                    disabled={downloading === `${report.type}-csv`}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {downloading === `${report.type}-csv` ? 'Exporting...' : 'Export as CSV'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h4 className="text-lg font-medium text-blue-900 mb-2">About Reports</h4>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            <li>Reports are generated based on the selected date range</li>
            <li>JSON format provides detailed structured data for further processing</li>
            <li>CSV format is suitable for spreadsheet applications like Excel</li>
            <li>Large date ranges may take longer to process</li>
            <li>All reports respect user access permissions and data privacy</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

