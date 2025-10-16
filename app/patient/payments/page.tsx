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
  const { user, loading: authLoading } = useAuth() as any;
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
      const payment = payments.find((p: any) => p._id === paymentId);
      if (!payment) {
        toast.error('Payment not found');
        return;
      }

      // Generate receipt number if not exists
      const response = await paymentsAPI.generateReceipt(paymentId, 'pdf');
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

