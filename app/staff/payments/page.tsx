'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { paymentsAPI, usersAPI } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { ArrowLeft, CreditCard, Search, Filter, Plus, Eye } from 'lucide-react';

export default function StaffPaymentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth() as any;
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    method: '',
    search: ''
  });

  useEffect(() => {
    if (!authLoading && user && user.role !== 'hospital_staff') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filters.status, filters.method]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      if (filters.status) params.status = filters.status;
      if (filters.method) params.method = filters.method;

      const res = await paymentsAPI.getAll(params);
      setPayments(res.data.data.payments);
    } catch (err) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (id: string, status: string) => {
    try {
      await paymentsAPI.update(id, { status });
      toast.success('Payment updated successfully');
      fetchPayments();
    } catch (err) {
      toast.error('Failed to update payment');
    }
  };

  const filteredPayments = payments.filter((payment) => {
    if (!filters.search) return true;
    const query = filters.search.toLowerCase();
    return (
      payment.patientID?.userName?.toLowerCase().includes(query) ||
      payment.transactionReference?.toLowerCase().includes(query)
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
            <Link href="/staff/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
            <Link
              href="/staff/payments/create"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" /> New Payment
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
              <select
                value={filters.method}
                onChange={(e) => setFilters(prev => ({ ...prev, method: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All</option>
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="insurance">Insurance</option>
                <option value="government">Government</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="digital_wallet">Digital Wallet</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Patient name or ref"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: '', method: '', search: '' })}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Payments ({filteredPayments.length})
            </h2>
            {filteredPayments.length > 0 ? (
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div key={payment._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <CreditCard className="w-8 h-8 text-gray-400" />
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              {payment.patientID?.userName || 'Unknown Patient'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Ref: {payment.transactionReference || 'N/A'}
                            </p>
                            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              <div>
                                <span className="text-gray-500">Amount:</span>
                                <span className="ml-1 font-medium text-gray-900">
                                  LKR {payment.amount.toFixed(2)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Method:</span>
                                <span className="ml-1 font-medium text-gray-900 capitalize">
                                  {payment.method.replace('_', ' ')}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Date:</span>
                                <span className="ml-1 font-medium text-gray-900">
                                  {new Date(payment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Time:</span>
                                <span className="ml-1 font-medium text-gray-900">
                                  {new Date(payment.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            payment.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {payment.status}
                        </span>
                        <div className="flex space-x-2">
                          {payment.status === 'pending' && (
                            <button
                              onClick={() => updatePaymentStatus(payment._id, 'completed')}
                              className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                            >
                              Complete
                            </button>
                          )}
                          <Link
                            href={`/staff/payments/${payment._id}`}
                            className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 flex items-center"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No payments found</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
