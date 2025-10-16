'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { paymentsAPI } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { ArrowLeft, CreditCard, Download, Eye, Filter, Calendar } from 'lucide-react';

export default function PatientPaymentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    method: '',
    startDate: '',
    endDate: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    totalAmount: 0
  });

  useEffect(() => {
    if (!authLoading && user && user.role !== 'patient') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments, filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await paymentsAPI.getAll({ limit: 100 });
      setPayments(res.data.data.payments);
      calculateStats(res.data.data.payments);
    } catch (err) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (paymentsData: any[]) => {
    const total = paymentsData.length;
    const completed = paymentsData.filter((p) => p.status === 'completed').length;
    const pending = paymentsData.filter((p) => p.status === 'pending').length;
    const totalAmount = paymentsData
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    setStats({ total, completed, pending, totalAmount });
  };

  const applyFilters = () => {
    let filtered = [...payments];

    if (filters.status) {
      filtered = filtered.filter((p) => p.status === filters.status);
    }

    if (filters.method) {
      filtered = filtered.filter((p) => p.method === filters.method);
    }

    if (filters.startDate) {
      filtered = filtered.filter(
        (p) => new Date(p.createdAt) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(
        (p) => new Date(p.createdAt) <= new Date(filters.endDate)
      );
    }

    setFilteredPayments(filtered);
  };

  const generateReceipt = async (paymentId: string) => {
    try {
      await paymentsAPI.generateReceipt(paymentId, 'pdf');
      toast.success('Receipt generated successfully');
    } catch (err) {
      toast.error('Failed to generate receipt');
    }
  };

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
            <Link href="/patient/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">My Payments</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCard className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Payments</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.completed}</dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.pending}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Paid</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      LKR {stats.totalAmount.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                value={filters.method}
                onChange={(e) => setFilters((prev) => ({ ...prev, method: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All</option>
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="insurance">Insurance</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="digital_wallet">Digital Wallet</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => setFilters({ status: '', method: '', startDate: '', endDate: '' })}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Payments List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Payment History ({filteredPayments.length})
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
                              LKR {payment.amount.toFixed(2)}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Ref: {payment.transactionReference || 'N/A'}
                            </p>
                            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
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
                              <div>
                                <span className="text-gray-500">Hospital:</span>
                                <span className="ml-1 font-medium text-gray-900">
                                  {payment.hospitalID?.name || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            payment.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : payment.status === 'processing'
                              ? 'bg-blue-100 text-blue-800'
                              : payment.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {payment.status}
                        </span>
                        <div className="flex space-x-2">
                          {payment.status === 'completed' && (
                            <button
                              onClick={() => generateReceipt(payment._id)}
                              className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex items-center"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Receipt
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Payment Details */}
                    {payment.billingDetails?.services && payment.billingDetails.services.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Services:</h4>
                        <div className="space-y-1">
                          {payment.billingDetails.services.map((service: any, idx: number) => (
                            <div key={idx} className="text-sm text-gray-600 flex justify-between">
                              <span>
                                {service.serviceName} x {service.quantity}
                              </span>
                              <span>LKR {(service.unitPrice * service.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filters.status || filters.method || filters.startDate || filters.endDate
                    ? 'Try adjusting your filters'
                    : 'You have not made any payments yet'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

