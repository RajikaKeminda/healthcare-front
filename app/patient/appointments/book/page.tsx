'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { hospitalsAPI, appointmentsAPI, paymentsAPI } from '../../../../lib/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import { Calendar, Clock, MapPin, User, ArrowLeft, CreditCard } from 'lucide-react';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function BookAppointment() {
  const { user } = useAuth() as any;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [formData, setFormData] = useState({
    type: 'regular',
    symptoms: [],
    notes: '',
    newSymptom: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  
  // Reservation fee is typically 20% of consultation fee or a fixed amount
  const RESERVATION_FEE_PERCENTAGE = 0.2;

  useEffect(() => {
    fetchHospitals();
  }, []);

  useEffect(() => {
    if (selectedHospital) {
      fetchDoctors();
    }
  }, [selectedHospital]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const fetchHospitals = async () => {
    try {
      const response = await hospitalsAPI.getAll();
      setHospitals(response.data.data.hospitals);
    } catch (error) {
      toast.error('Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await hospitalsAPI.getDoctors(selectedHospital?._id);
      setDoctors(response.data.data.doctors);
    } catch (error) {
      toast.error('Failed to load doctors');
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const response = await appointmentsAPI.getAvailability(
        selectedDoctor._id,
        selectedDate.toISOString().split('T')[0]
      );
      setAvailableSlots(response.data.data.availableSlots);
    } catch (error) {
      toast.error('Failed to load available slots');
    }
  };

  const handleHospitalSelect = (hospital: any) => {
    setSelectedHospital(hospital);
    setSelectedDoctor(null);
    setAvailableSlots([]);
    setSelectedTime('');
  };

  const handleDoctorSelect = (doctor: any) => {
    setSelectedDoctor(doctor);
    setAvailableSlots([]);
    setSelectedTime('');
  };

  const addSymptom = () => {
    if (formData.newSymptom.trim()) {
      setFormData((prev: any) => ({
        ...prev,
        symptoms: [...prev.symptoms, prev.newSymptom.trim()],
        newSymptom: ''
      }));
    }
  };

  const removeSymptom = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      symptoms: prev.symptoms.filter((_: any, i: number) => i !== index)
    }));
  };

  const calculateReservationFee = () => {
    if (!selectedDoctor?.consultationFee) return 0;
    return selectedDoctor.consultationFee * RESERVATION_FEE_PERCENTAGE;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    if (!selectedHospital || !selectedDoctor || !selectedTime) {
      toast.error('Please select hospital, doctor, and time slot');
      return;
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    try {
      setSubmitting(true);
      
      const appointmentData = {
        doctorID: selectedDoctor._id,
        hospitalID: selectedHospital._id,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        type: formData.type,
        symptoms: formData.symptoms,
        notes: formData.notes
      };

      // Create appointment first
      const appointmentResponse = await appointmentsAPI.create(appointmentData);
      
      if (appointmentResponse.data.success) {
        const appointment = appointmentResponse.data.data.appointment;
        const reservationFee = calculateReservationFee();

        // Process reservation fee payment
        const paymentData = {
          appointmentID: appointment._id,
          hospitalID: selectedHospital._id,
          amount: reservationFee,
          method: paymentMethod,
          billingDetails: {
            services: [
              {
                serviceName: 'Appointment Reservation Fee',
                unitPrice: reservationFee,
                quantity: 1,
                totalPrice: reservationFee
              }
            ]
          }
        };

        await paymentsAPI.process(paymentData);
        
        toast.success('Appointment booked and reservation fee paid successfully!');
        // Redirect to appointments page
        window.location.href = '/patient/appointments';
      }
    } catch (error) {
      toast.error((error as any).response?.data?.message || 'Failed to book appointment or process payment');
    } finally {
      setSubmitting(false);
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
          <div className="flex items-center py-6">
            <Link
              href="/patient/dashboard"
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Hospital Selection */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Select Hospital</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hospitals.map((hospital: any) => (
                <div
                  key={hospital._id}
                  onClick={() => handleHospitalSelect(hospital)}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedHospital?._id === hospital._id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <h3 className="font-medium text-gray-900">{hospital.name}</h3>
                  <p className="text-sm text-gray-500 flex items-center mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {hospital.address.city}, {hospital.address.state}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">{hospital.type}</p>
                  <div className="mt-2">
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      {hospital.specializations.length} specializations
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Doctor Selection */}
          {selectedHospital && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Select Doctor</h2>
              {doctors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.map((doctor: any) => (
                    <div
                      key={doctor._id}
                      onClick={() => handleDoctorSelect(doctor)}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedDoctor?._id === doctor._id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center">
                        <User className="w-8 h-8 text-gray-400 mr-3" />
                        <div>
                          <h3 className="font-medium text-gray-900">Dr. {doctor.userName}</h3>
                          <p className="text-sm text-gray-500">{doctor.specialization}</p>
                          <p className="text-sm text-gray-500">LKR {doctor.consultationFee}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          doctor.isAvailable
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {doctor.isAvailable ? 'Available' : 'Not Available'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No doctors available at this hospital</p>
              )}
            </div>
          )}

          {/* Date and Time Selection */}
          {selectedDoctor && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Select Date & Time</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date: Date) => setSelectedDate(date)}
                    minDate={new Date()}
                    maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // 30 days from now
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Time Slots
                  </label>
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot: any) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                            selectedTime === slot
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No available slots for this date</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Appointment Details */}
          {selectedTime && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Appointment Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="regular">Regular</option>
                    <option value="urgent">Urgent</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="consultation">Consultation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Symptoms
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={formData.newSymptom}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, newSymptom: e.target.value }))}
                      placeholder="Add a symptom"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSymptom())}
                    />
                    <button
                      type="button"
                      onClick={addSymptom}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Add
                    </button>
                  </div>
                  {formData.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.symptoms.map((symptom: any, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                        >
                          {symptom}
                          <button
                            type="button"
                            onClick={() => removeSymptom(index)}
                            className="ml-2 text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Any additional information..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Payment Section */}
          {selectedTime && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <CreditCard className="w-5 h-5 text-indigo-600 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Reservation Fee Payment</h2>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> A reservation fee of LKR {calculateReservationFee().toFixed(2)} 
                  ({(RESERVATION_FEE_PERCENTAGE * 100).toFixed(0)}% of consultation fee) is required to confirm your appointment.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`p-4 border rounded-md transition-colors ${
                      paymentMethod === 'credit_card'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm font-medium text-center">Credit Card</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('debit_card')}
                    className={`p-4 border rounded-md transition-colors ${
                      paymentMethod === 'debit_card'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm font-medium text-center">Debit Card</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('digital_wallet')}
                    className={`p-4 border rounded-md transition-colors ${
                      paymentMethod === 'digital_wallet'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm font-medium text-center">Digital Wallet</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-4 border rounded-md transition-colors ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm font-medium text-center">Bank Transfer</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {selectedTime && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Appointment Summary</h3>
                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    <p><strong>Hospital:</strong> {selectedHospital?.name}</p>
                    <p><strong>Doctor:</strong> Dr. {selectedDoctor?.userName} ({selectedDoctor?.specialization})</p>
                    <p><strong>Date:</strong> {selectedDate.toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {selectedTime}</p>
                    <p><strong>Type:</strong> {formData.type}</p>
                    <div className="pt-2 border-t border-gray-200 mt-2">
                      <p><strong>Consultation Fee:</strong> LKR {selectedDoctor?.consultationFee?.toFixed(2)}</p>
                      <p className="text-indigo-600"><strong>Reservation Fee (Now):</strong> LKR {calculateReservationFee().toFixed(2)}</p>
                      <p className="text-gray-500"><strong>Remaining (At Clinic):</strong> LKR {(selectedDoctor?.consultationFee - calculateReservationFee()).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <LoadingSpinner size="small" className="mr-2" />
                      Processing...
                    </div>
                  ) : (
                    `Pay LKR ${calculateReservationFee().toFixed(2)} & Book`
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
