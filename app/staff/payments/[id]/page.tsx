'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { paymentsAPI } from '../../../../lib/api';
import { useAuth } from '../../../../contexts/AuthContext';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import { ArrowLeft, CreditCard, FileText, Download } from 'lucide-react';

export default function ViewPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth() as any;
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<any>(null);

  const id = Array.isArray(params?.id) ? params?.id[0] : (params as any)?.id;

  useEffect(() => {
    if (!authLoading && user && user.role !== 'hospital_staff') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (id && user) fetchPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const fetchPayment = async () => {
    try {
      setLoading(true);
      const res = await paymentsAPI.getById(id as string);
      setPayment(res.data.data.payment);
    } catch (err) {
      toast.error('Failed to load payment');
    } finally {
      setLoading(false);
    }
  };

  const generateReceipt = async () => {
    try {
      await paymentsAPI.generateReceipt(id as string, 'pdf');
      toast.success('Receipt generated successfully');
      fetchPayment();
    } catch (err) {
      toast.error('Failed to generate receipt');
    }
  };

  if (authLoading || loading || !payment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <Link href="/staff/payments" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Payments
            </Link>
            <button
              onClick={generateReceipt}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 inline-flex items-center"
            >
              <Download className="w-4 h-4 mr-2" /> Generate Receipt
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <CreditCard className="w-12 h-12 text-indigo-600" />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
                  <p className="text-sm text-gray-500 mt-1">Transaction: {payment.transactionReference}</p>
                </div>
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    payment.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  {payment.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500">Patient</span>
              <p className="text-gray-900 font-medium">{payment.patientID?.userName || 'N/A'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Hospital</span>
              <p className="text-gray-900">{payment.hospitalID?.name || 'N/A'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Amount</span>
              <p className="text-gray-900 font-bold text-lg">LKR {payment.amount.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Payment Method</span>
              <p className="text-gray-900 capitalize">{payment.method.replace('_', ' ')}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Date</span>
              <p className="text-gray-900">{new Date(payment.createdAt).toLocaleString()}</p>
            </div>
            {payment.appointmentID && (
              <div>
                <span className="text-sm text-gray-500">Appointment</span>
                <p className="text-gray-900">{payment.appointmentID.appointmentID}</p>
              </div>
            )}
          </div>
        </div>

        {payment.billingDetails?.services && payment.billingDetails.services.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <FileText className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Services / Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payment.billingDetails.services.map((service: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{service.serviceName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">LKR {service.unitPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{service.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        LKR {(service.unitPrice * service.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Total</span>
                <span className="text-lg font-bold text-indigo-600">LKR {payment.billingDetails.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {payment.insuranceInfo && payment.method === 'insurance' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Insurance Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Provider</span>
                <p className="text-gray-900">{payment.insuranceInfo.provider || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Policy Number</span>
                <p className="text-gray-900">{payment.insuranceInfo.policyNumber || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Coverage Amount</span>
                <p className="text-gray-900">LKR {payment.insuranceInfo.coverageAmount?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Claim Number</span>
                <p className="text-gray-900">{payment.insuranceInfo.claimNumber || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status</span>
                <p className="text-gray-900 capitalize">{payment.insuranceInfo.status || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {payment.receipt?.receiptNumber && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Receipt Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Receipt Number</span>
                <p className="text-gray-900 font-medium">{payment.receipt.receiptNumber}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Generated At</span>
                <p className="text-gray-900">{new Date(payment.receipt.generatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

