'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { medicalRecordsAPI, usersAPI, appointmentsAPI, hospitalsAPI } from '../../../../lib/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import { FileText, User, ArrowLeft, Plus, X, Upload } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function CreateMedicalRecordContent() {
  const { user } = useAuth() as any;
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [formData, setFormData] = useState({
    patientID: '',
    appointmentID: '',
    hospitalID: user?.hospitalID || '',
    chiefComplaint: '',
    historyOfPresentIllness: '',
    physicalExamination: {
      vitalSigns: {
        bloodPressure: '',
        heartRate: '',
        temperature: '',
        respiratoryRate: '',
        oxygenSaturation: '',
        weight: '',
        height: ''
      },
      generalAppearance: '',
      cardiovascular: '',
      respiratory: '',
      gastrointestinal: '',
      neurological: '',
      musculoskeletal: '',
      skin: '',
      other: ''
    },
    diagnosis: [],
    treatmentPlan: {
      medications: [],
      procedures: [],
      lifestyleRecommendations: [],
      followUpInstructions: '',
      nextAppointment: ''
    },
    labResults: [],
    imagingResults: [],
    allergies: []
  });

  const [newDiagnosis, setNewDiagnosis] = useState({
    description: '',
    code: '',
    type: 'primary'
  });

  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });

  const [newLabResult, setNewLabResult] = useState({
    testName: '',
    testDate: '',
    results: '',
    normalRange: '',
    status: 'normal',
    notes: ''
  });

  const [newAllergy, setNewAllergy] = useState({
    allergen: '',
    reaction: '',
    severity: 'mild'
  });

  useEffect(() => {
    fetchPatients();
    fetchHospitals();
    fetchDoctorAppointments();
    
    // Pre-fill form if patientId and appointmentId are provided
    const patientId = searchParams.get('patientId');
    const appointmentId = searchParams.get('appointmentId');
    
    if (patientId) {
      setFormData(prev => ({ ...prev, patientID: patientId }));
      fetchPatient(patientId);
    }
    
    if (appointmentId) {
      setFormData(prev => ({ ...prev, appointmentID: appointmentId }));
      fetchAppointment(appointmentId);
    }
  }, [searchParams]);

  const fetchPatients = async () => {
    try {
      const response = await usersAPI.getAll({ role: 'patient', limit: 100 });
      setPatients(response.data.data.users);
    } catch (error) {
      toast.error('Failed to load patients');
    }
  };

  const fetchHospitals = async () => {
    try {
      const response = await hospitalsAPI.getAll({ limit: 100 });
      setHospitals(response.data.data.hospitals);
    } catch (error) {
      toast.error('Failed to load hospitals');
    }
  };

  const fetchDoctorAppointments = async () => {
    try {
      const response = await appointmentsAPI.getAll({ 
        doctorID: user?._id,
        status: 'completed',
        limit: 100 
      });
      setAppointments(response.data.data.appointments);
    } catch (error) {
      console.error('Failed to load appointments');
    }
  };

  const fetchPatient = async (patientId: string) => {
    try {
      const response = await usersAPI.getById(patientId);
      setSelectedPatient(response.data.data.user);
    } catch (error) {
      toast.error('Failed to load patient details');
    }
  };

  const fetchAppointment = async (appointmentId: string) => {
    try {
      const response = await appointmentsAPI.getById(appointmentId);
      const appointment = response.data.data.appointment;
      setSelectedAppointment(appointment);
      
      // Auto-fill patient and hospital from appointment
      if (appointment.patientID) {
        const patientId = appointment.patientID._id || appointment.patientID;
        setFormData(prev => ({ ...prev, patientID: patientId }));
        fetchPatient(patientId);
      }
      
      if (appointment.hospitalID) {
        setFormData(prev => ({ ...prev, hospitalID: appointment.hospitalID._id || appointment.hospitalID }));
      }
    } catch (error) {
      toast.error('Failed to load appointment details');
    }
  };

  const handlePatientSelect = (patientId: string) => {
    setFormData(prev => ({ ...prev, patientID: patientId }));
    fetchPatient(patientId);
  };

  const handleAppointmentSelect = (appointmentId: string) => {
    setFormData(prev => ({ ...prev, appointmentID: appointmentId }));
    if (appointmentId) {
      fetchAppointment(appointmentId);
    } else {
      setSelectedAppointment(null);
    }
  };

  const addDiagnosis = () => {
    if (newDiagnosis.description.trim()) {
      setFormData((prev: any) => ({
        ...prev,
        diagnosis: [...prev.diagnosis, { ...newDiagnosis }]
      }));
      setNewDiagnosis({ description: '', code: '', type: 'primary' });
    }
  };

  const removeDiagnosis = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      diagnosis: prev.diagnosis.filter((_: any, i: number) => i !== index)
    }));
  };

  const addMedication = () => {
    if (newMedication.name.trim()) {
      setFormData((prev: any) => ({
        ...prev,
        treatmentPlan: {
          ...prev.treatmentPlan,
          medications: [...prev.treatmentPlan.medications, { ...newMedication }]
        }
      }));
      setNewMedication({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });
    }
  };

  const removeMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      treatmentPlan: {
        ...prev.treatmentPlan,
        medications: prev.treatmentPlan.medications.filter((_: any, i: number) => i !== index)
      }
    }));
  };

  const addLabResult = () => {
    if (newLabResult.testName.trim()) {
      setFormData((prev: any) => ({
        ...prev,
        labResults: [...prev.labResults, { ...newLabResult }]
      }));
      setNewLabResult({ testName: '', testDate: '', results: '', normalRange: '', status: 'normal', notes: '' });
    }
  };

  const removeLabResult = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      labResults: prev.labResults.filter((_: any, i: number) => i !== index)
    }));
  };

  const addAllergy = () => {
    if (newAllergy.allergen.trim()) {
      setFormData((prev: any) => ({
        ...prev,
        allergies: [...prev.allergies, { ...newAllergy }]
      }));
      setNewAllergy({ allergen: '', reaction: '', severity: 'mild' });
    }
  };

  const removeAllergy = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      allergies: prev.allergies.filter((_: any, i: number) => i !== index)
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData((prev: any) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData((prev: any) => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleVitalSignsChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      physicalExamination: {
        ...prev.physicalExamination,
        vitalSigns: {
          ...prev.physicalExamination.vitalSigns,
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    if (!formData.patientID || !formData.hospitalID || !formData.chiefComplaint) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await medicalRecordsAPI.create(formData);
      
      if (response.data.success) {
        toast.success('Medical record created successfully!');
        // Redirect to medical records list
        window.location.href = '/doctor/medical-records';
      }
    } catch (error) {
      toast.error((error as any).response?.data?.message || 'Failed to create medical record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              href="/doctor/dashboard"
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Create Medical Record</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Patient Selection */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h2>
            
            {/* Quick Select from Appointment */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Select from Appointment (Optional)
              </label>
              <select
                value={formData.appointmentID}
                onChange={(e) => handleAppointmentSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select an appointment to auto-fill patient & hospital</option>
                {appointments.map((appointment: any) => (
                  <option key={appointment._id} value={appointment._id}>
                    {appointment.appointmentID} - {appointment.patientID?.userName} - {new Date(appointment.date).toLocaleDateString()} {appointment.time}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Selecting an appointment will automatically fill patient and hospital information below
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Patient *
                </label>
                <select
                  value={formData.patientID}
                  onChange={(e) => handlePatientSelect(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select a patient</option>
                  {patients.map((patient: any) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.userName} - {patient.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Hospital *
                </label>
                <select
                  value={formData.hospitalID}
                  onChange={(e) => handleInputChange('hospitalID', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select a hospital</option>
                  {hospitals.map((hospital: any) => (
                    <option key={hospital._id} value={hospital._id}>
                      {hospital.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedPatient && (
                <div className="bg-gray-50 p-4 rounded-md md:col-span-2">
                  <h3 className="font-medium text-gray-900">Patient Details</h3>
                  <p className="text-sm text-gray-600">Name: {selectedPatient.userName}</p>
                  <p className="text-sm text-gray-600">Email: {selectedPatient.email}</p>
                  <p className="text-sm text-gray-600">Phone: {selectedPatient.phone}</p>
                  {selectedPatient.bloodType && (
                    <p className="text-sm text-gray-600">Blood Type: {selectedPatient.bloodType}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chief Complaint */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Chief Complaint *</h2>
            <textarea
              value={formData.chiefComplaint}
              onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Describe the patient's main complaint..."
            />
          </div>

          {/* History of Present Illness */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">History of Present Illness</h2>
            <textarea
              value={formData.historyOfPresentIllness}
              onChange={(e) => handleInputChange('historyOfPresentIllness', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Detailed history of the present illness..."
            />
          </div>

          {/* Physical Examination */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Physical Examination</h2>
            
            {/* Vital Signs */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-800 mb-3">Vital Signs</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure</label>
                  <input
                    type="text"
                    value={formData.physicalExamination.vitalSigns.bloodPressure}
                    onChange={(e) => handleVitalSignsChange('bloodPressure', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="120/80"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heart Rate</label>
                  <input
                    type="number"
                    value={formData.physicalExamination.vitalSigns.heartRate}
                    onChange={(e) => handleVitalSignsChange('heartRate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="72"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.physicalExamination.vitalSigns.temperature}
                    onChange={(e) => handleVitalSignsChange('temperature', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="98.6"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Respiratory Rate</label>
                  <input
                    type="number"
                    value={formData.physicalExamination.vitalSigns.respiratoryRate}
                    onChange={(e) => handleVitalSignsChange('respiratoryRate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="16"
                  />
                </div>
              </div>
            </div>

            {/* System Examination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">General Appearance</label>
                <textarea
                  value={formData.physicalExamination.generalAppearance}
                  onChange={(e) => handleInputChange('physicalExamination.generalAppearance', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cardiovascular</label>
                <textarea
                  value={formData.physicalExamination.cardiovascular}
                  onChange={(e) => handleInputChange('physicalExamination.cardiovascular', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Respiratory</label>
                <textarea
                  value={formData.physicalExamination.respiratory}
                  onChange={(e) => handleInputChange('physicalExamination.respiratory', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gastrointestinal</label>
                <textarea
                  value={formData.physicalExamination.gastrointestinal}
                  onChange={(e) => handleInputChange('physicalExamination.gastrointestinal', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Diagnosis */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Diagnosis</h2>
            
            {/* Add Diagnosis */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <input
                  type="text"
                  value={newDiagnosis.description}
                  onChange={(e) => setNewDiagnosis(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Diagnosis description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ICD Code</label>
                <input
                  type="text"
                  value={newDiagnosis.code}
                  onChange={(e) => setNewDiagnosis(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="ICD-10 code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newDiagnosis.type}
                  onChange={(e) => setNewDiagnosis(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="differential">Differential</option>
                  <option value="rule_out">Rule Out</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addDiagnosis}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add
                </button>
              </div>
            </div>

            {/* Diagnosis List */}
            {formData.diagnosis.length > 0 && (
              <div className="space-y-2">
                {formData.diagnosis.map((diagnosis: any, index: number) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <div>
                      <span className="font-medium">{diagnosis.description}</span>
                      {diagnosis.code && <span className="text-gray-500 ml-2">({diagnosis.code})</span>}
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">
                        {diagnosis.type}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDiagnosis(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Treatment Plan */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Treatment Plan</h2>
            
            {/* Medications */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-800 mb-3">Medications</h3>
              
              {/* Add Medication */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newMedication.name}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Medication name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dosage *</label>
                  <input
                    type="text"
                    value={newMedication.dosage}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 500mg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
                  <input
                    type="text"
                    value={newMedication.frequency}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 3 times daily"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration *</label>
                  <input
                    type="text"
                    value={newMedication.duration}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 7 days"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                  <input
                    type="text"
                    value={newMedication.instructions}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, instructions: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Special instructions"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addMedication}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Add
                  </button>
                </div>
              </div>

              {/* Medications List */}
              {formData.treatmentPlan.medications.length > 0 && (
                <div className="space-y-2">
                  {formData.treatmentPlan.medications.map((medication: any, index: number) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                      <div>
                        <span className="font-medium">{medication.name}</span>
                        <span className="text-gray-500 ml-2">{medication.dosage}</span>
                        <span className="text-gray-500 ml-2">{medication.frequency}</span>
                        <span className="text-gray-500 ml-2">{medication.duration}</span>
                        {medication.instructions && (
                          <span className="text-gray-500 ml-2">- {medication.instructions}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMedication(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Follow-up Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Instructions</label>
              <textarea
                value={formData.treatmentPlan.followUpInstructions}
                onChange={(e) => handleInputChange('treatmentPlan.followUpInstructions', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Follow-up instructions for the patient..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-end space-x-4">
              <Link
                href="/doctor/dashboard"
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="small" className="mr-2" />
                    Creating...
                  </div>
                ) : (
                  'Create Medical Record'
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function CreateMedicalRecord() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CreateMedicalRecordContent />
    </Suspense>
  );
}

