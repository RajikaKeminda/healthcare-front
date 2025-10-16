'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { paymentsAPI, appointmentsAPI } from '../../../lib/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { CreditCard, Calendar, User, ArrowLeft, Plus, Eye, Filter, Download, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function StaffPayments() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [filters, setFilters] = useState({
    status: '',
    method: '',
    dateFrom: '',
    dateTo: '',
    patient: ''
  });

  useEffect(() => {
    fetchPayments();
  }, [pagination.currentPage]);

  useEffect(() => {
    filterPayments();
  }, [payments, filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentsAPI.getAll({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage
      });
      
      setPayments(response.data.data.payments);
      setPagination(response.data.data.pagination);
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    if (filters.status) {
      filtered = filtered.filter(payment => payment.status === filters.status);
    }

    if (filters.method) {
      filtered = filtered.filter(payment => payment.method === filters.method);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(payment => new Date(payment.createdAt) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      filtered = filtered.filter(payment => new Date(payment.createdAt) <= new Date(filters.dateTo));
    }

    if (filters.patient) {
      filtered = filtered.filter(payment => 
        payment.patientID?.userName?.toLowerCase().includes(filters.patient.toLowerCase())
      );
    }

    setFilteredPayments(filtered);
  };

  const processPayment = async (paymentId, status) => {
    try {
      await paymentsAPI.update(paymentId, { status });
      toast.success(`Payment ${status} successfully`);
      fetchPayments();
    } catch (error) {
      toast.error('Failed to update payment status');
    }
  };

  const generateReceipt = async (paymentId) => {
    try {
      const response = await paymentsAPI.generateReceipt(paymentId, 'pdf');
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt_${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate receipt');
    }
  };

  const processRefund = async (paymentId, refundAmount, reason) => {
    try {
      await paymentsAPI.processRefund(paymentId, {
        refundAmount: parseFloat(refundAmount),
        refundReason: reason,
        refundMethod: 'original'
      });
      toast.success('Refund processed successfully');
      fetchPayments();
    } catch (error) {
      toast.error('Failed to process refund');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
                href="/staff/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
            </div>
            <Link
              href="/staff/payments/create"
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Process Payment
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
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Method
              </label>
              <select
                value={filters.method}
                onChange={(e) => setFilters(prev => ({ ...prev, method: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Methods</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="cash">Cash</option>
                <option value="insurance">Insurance</option>
                <option value="government">Government</option>
                <option value="bank_transfer">Bank Transfer</option>
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
                onClick={() => setFilters({ status: '', method: '', dateFrom: '', dateTo: '', patient: '' })}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Payments List */}
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
                          <div className="flex-shrink-0">
                            <CreditCard className="w-8 h-8 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              {payment.patientID?.userName || 'Unknown Patient'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Payment ID: {payment.paymentID}
                            </p>
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">
                                <strong>Amount:</strong> LKR {payment.amount.toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Method:</strong> {payment.method.replace('_', ' ').toUpperCase()}
                              </p>
                              {payment.appointmentID && (
                                <p className="text-sm text-gray-600">
                                  <strong>Appointment:</strong> {payment.appointmentID.appointmentID}
                                </p>
                              )}
                            </div>
                            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(payment.createdAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-1" />
                                {payment.hospitalID?.name || 'Unknown Hospital'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                          {payment.status.toUpperCase()}
                        </span>
                        
                        <div className="flex space-x-2">
                          {payment.status === 'pending' && (
                            <>
                              <button
                                onClick={() => processPayment(payment._id, 'completed')}
                                className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 flex items-center"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() => processPayment(payment._id, 'failed')}
                                className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 flex items-center"
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Reject
                              </button>
                            </>
                          )}
                          
                          {payment.status === 'completed' && (
                            <>
                              <button
                                onClick={() => generateReceipt(payment._id)}
                                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 flex items-center"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Receipt
                              </button>
                              <button
                                onClick={() => {
                                  const refundAmount = prompt('Enter refund amount:');
                                  const reason = prompt('Enter refund reason:');
                                  if (refundAmount && reason) {
                                    processRefund(payment._id, refundAmount, reason);
                                  }
                                }}
                                className="text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700"
                              >
                                Refund
                              </button>
                            </>
                          )}
                          
                          <Link
                            href={`/staff/payments/${payment._id}`}
                            className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 flex items-center"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Link>
                        </div>
                        
                        {payment.transactionReference && (
                          <div className="text-xs text-gray-500">
                            Ref: {payment.transactionReference}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
                <p className="text-gray-500">
                  {payments.length === 0 
                    ? "No payments have been processed yet."
                    : "No payments match your current filters."
                  }
                </p>
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
