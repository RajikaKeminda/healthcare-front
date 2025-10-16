'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { medicalRecordsAPI, usersAPI, hospitalsAPI } from '../../../../../lib/api';
import { useAuth } from '../../../../../contexts/AuthContext';
import LoadingSpinner from '../../../../../components/ui/LoadingSpinner';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';

export default function EditMedicalRecordPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    patientID: '',
    appointmentID: '',
    hospitalID: '',
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

  const id = Array.isArray(params?.id) ? params?.id[0] : (params as any)?.id;

  useEffect(() => {
    if (!authLoading && user && user.role !== 'healthcare_professional') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (id && user) {
      fetchMedicalRecord();
      fetchHospitals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const fetchMedicalRecord = async () => {
    try {
      setLoading(true);
      const res = await medicalRecordsAPI.getById(id as string);
      const record = res.data.data.medicalRecord;
      
      // Populate form with existing data
      setFormData({
        patientID: record.patientID?._id || record.patientID || '',
        appointmentID: record.appointmentID?._id || record.appointmentID || '',
        hospitalID: record.hospitalID?._id || record.hospitalID || '',
        chiefComplaint: record.chiefComplaint || '',
        historyOfPresentIllness: record.historyOfPresentIllness || record.history?.presentIllness || '',
        physicalExamination: {
          vitalSigns: {
            bloodPressure: record.physicalExamination?.vitalSigns?.bloodPressure || '',
            heartRate: record.physicalExamination?.vitalSigns?.heartRate || '',
            temperature: record.physicalExamination?.vitalSigns?.temperature || '',
            respiratoryRate: record.physicalExamination?.vitalSigns?.respiratoryRate || '',
            oxygenSaturation: record.physicalExamination?.vitalSigns?.oxygenSaturation || '',
            weight: record.physicalExamination?.vitalSigns?.weight || '',
            height: record.physicalExamination?.vitalSigns?.height || ''
          },
          generalAppearance: record.physicalExamination?.generalAppearance || '',
          cardiovascular: record.physicalExamination?.cardiovascular || '',
          respiratory: record.physicalExamination?.respiratory || '',
          gastrointestinal: record.physicalExamination?.gastrointestinal || '',
          neurological: record.physicalExamination?.neurological || '',
          musculoskeletal: record.physicalExamination?.musculoskeletal || '',
          skin: record.physicalExamination?.skin || '',
          other: record.physicalExamination?.other || ''
        },
        diagnosis: record.diagnosis || [],
        treatmentPlan: {
          medications: record.treatmentPlan?.medications || [],
          procedures: record.treatmentPlan?.procedures || [],
          lifestyleRecommendations: record.treatmentPlan?.lifestyleRecommendations || [],
          followUpInstructions: record.treatmentPlan?.followUpInstructions || '',
          nextAppointment: record.treatmentPlan?.nextAppointment || ''
        },
        labResults: record.labResults || [],
        imagingResults: record.imagingResults || [],
        allergies: record.allergies || []
      });

      setSelectedPatient(record.patientID);
    } catch (err) {
      toast.error('Failed to load medical record');
      router.push('/doctor/medical-records');
    } finally {
      setLoading(false);
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
    setFormData((prev: any) => ({
      ...prev,
      treatmentPlan: {
        ...prev.treatmentPlan,
        medications: prev.treatmentPlan.medications.filter((_: any, i: number) => i !== index)
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientID || !formData.hospitalID || !formData.chiefComplaint) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await medicalRecordsAPI.update(id as string, formData);
      toast.success('Medical record updated successfully!');
      router.push(`/doctor/medical-records/${id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update medical record');
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              href={`/doctor/medical-records/${id}`}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Cancel
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Edit Medical Record</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Patient Information (Read-only) */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h2>
            {selectedPatient && (
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-900">Patient Details</h3>
                <p className="text-sm text-gray-600">Name: {selectedPatient.userName}</p>
                <p className="text-sm text-gray-600">Email: {selectedPatient.email}</p>
                <p className="text-sm text-gray-600">Phone: {selectedPatient.phone}</p>
                {selectedPatient.bloodType && (
                  <p className="text-sm text-gray-600">Blood Type: {selectedPatient.bloodType}</p>
                )}
              </div>
            )}
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hospital *
              </label>
              <select
                value={formData.hospitalID}
                onChange={(e) => handleInputChange('hospitalID', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a hospital</option>
                {hospitals.map((hospital) => (
                  <option key={hospital._id} value={hospital._id}>
                    {hospital.name}
                  </option>
                ))}
              </select>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.physicalExamination.vitalSigns.temperature}
                    onChange={(e) => handleVitalSignsChange('temperature', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="37.0"
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
                href={`/doctor/medical-records/${id}`}
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span className="ml-2">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

