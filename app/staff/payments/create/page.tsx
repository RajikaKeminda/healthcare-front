'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { paymentsAPI, usersAPI, hospitalsAPI, appointmentsAPI } from '../../../../lib/api';
import { useAuth } from '../../../../contexts/AuthContext';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';

export default function CreatePaymentPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    patientID: '',
    appointmentID: '',
    hospitalID: '',
    amount: '',
    method: 'cash',
    services: [
      { serviceName: '', unitPrice: '', quantity: '1', totalPrice: '' }
    ],
    insuranceInfo: {
      provider: '',
      policyNumber: '',
      coverageAmount: '',
      claimNumber: ''
    }
  });

  useEffect(() => {
    if (!authLoading && user && user.role !== 'hospital_staff') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [patientsRes, hospitalsRes] = await Promise.all([
        usersAPI.getAll({ role: 'patient', limit: 100 }),
        hospitalsAPI.getAll({ limit: 100 })
      ]);
      setPatients(patientsRes.data.data.users);
      setHospitals(hospitalsRes.data.data.hospitals);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.patientID) {
      fetchPatientAppointments(formData.patientID);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.patientID]);

  const fetchPatientAppointments = async (patientID: string) => {
    try {
      const res = await appointmentsAPI.getAll({ patientID, limit: 100 });
      setAppointments(res.data.data.appointments);
    } catch (err) {
      console.error('Failed to load appointments');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev: any) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleServiceChange = (index: number, field: string, value: string) => {
    const newServices = [...formData.services];
    newServices[index] = { ...newServices[index], [field]: value };
    setFormData((prev: any) => ({ ...prev, services: newServices }));
  };

  const addService = () => {
    setFormData((prev: any) => ({
      ...prev,
      services: [...prev.services, { serviceName: '', unitPrice: '', quantity: '1' }]
    }));
  };

  const removeService = (index: number) => {
    if (formData.services.length > 1) {
      const newServices = formData.services.filter((_, i) => i !== index);
      setFormData((prev: any) => ({ ...prev, services: newServices }));
    }
  };

  const calculateTotal = () => {
    return formData.services.reduce((total, service) => {
      const price = parseFloat(service.unitPrice) || 0;
      const qty = parseInt(service.quantity) || 0;
      return total + (price * qty);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientID || !formData.hospitalID) {
      toast.error('Please select patient and hospital');
      return;
    }

    if (formData.services.some(s => !s.serviceName || !s.unitPrice || !s.quantity)) {
      toast.error('Please fill in all service details');
      return;
    }

    try {
      setSubmitting(true);

      const paymentData = {
        patientID: formData.patientID,
        appointmentID: formData.appointmentID || undefined,
        hospitalID: formData.hospitalID,
        amount: calculateTotal(),
        method: formData.method,
        billingDetails: {
          services: formData.services.map(s => ({
            serviceName: s.serviceName,
            unitPrice: parseFloat(s.unitPrice),
            quantity: parseInt(s.quantity),
            totalPrice: parseFloat(s.unitPrice) * parseInt(s.quantity)
          }))
        },
        insuranceInfo: formData.method === 'insurance' ? formData.insuranceInfo : undefined
      };

      await paymentsAPI.process(paymentData);
      toast.success('Payment processed successfully');
      router.push('/staff/payments');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process payment');
    } finally {
      setSubmitting(false);
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <Link href="/staff/payments" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" /> Cancel
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Process Payment</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                <select
                  name="patientID"
                  value={formData.patientID}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Patient</option>
                  {patients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.userName} - {patient.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital *</label>
                <select
                  name="hospitalID"
                  value={formData.hospitalID}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Hospital</option>
                  {hospitals.map((hospital) => (
                    <option key={hospital._id} value={hospital._id}>
                      {hospital.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Appointment (Optional)</label>
                <select
                  name="appointmentID"
                  value={formData.appointmentID}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">No Appointment</option>
                  {appointments.map((apt) => (
                    <option key={apt._id} value={apt._id}>
                      {apt.appointmentID} - {new Date(apt.date).toLocaleDateString()} {apt.time}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                <select
                  name="method"
                  value={formData.method}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="insurance">Insurance</option>
                  <option value="government">Government</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="digital_wallet">Digital Wallet</option>
                </select>
              </div>
            </div>
          </div>

          {formData.method === 'insurance' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Insurance Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                  <input
                    type="text"
                    name="insuranceInfo.provider"
                    value={formData.insuranceInfo.provider}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number</label>
                  <input
                    type="text"
                    name="insuranceInfo.policyNumber"
                    value={formData.insuranceInfo.policyNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coverage Amount</label>
                  <input
                    type="number"
                    name="insuranceInfo.coverageAmount"
                    value={formData.insuranceInfo.coverageAmount}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Claim Number</label>
                  <input
                    type="text"
                    name="insuranceInfo.claimNumber"
                    value={formData.insuranceInfo.claimNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Services / Items</h3>
              <button
                type="button"
                onClick={addService}
                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 inline-flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Service
              </button>
            </div>
            <div className="space-y-3">
              {formData.services.map((service, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
                    <input
                      type="text"
                      value={service.serviceName}
                      onChange={(e) => handleServiceChange(index, 'serviceName', e.target.value)}
                      placeholder="e.g., Consultation"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (LKR) *</label>
                    <input
                      type="number"
                      value={service.unitPrice}
                      onChange={(e) => handleServiceChange(index, 'unitPrice', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qty *</label>
                    <input
                      type="number"
                      value={service.quantity}
                      onChange={(e) => handleServiceChange(index, 'quantity', e.target.value)}
                      min="1"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="col-span-2">
                    {formData.services.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeService(index)}
                        className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 inline-flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total Amount:</span>
              <span className="text-indigo-600">LKR {calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              href="/staff/payments"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 inline-flex items-center"
            >
              {submitting ? (
                <LoadingSpinner size="small" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Process Payment
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

