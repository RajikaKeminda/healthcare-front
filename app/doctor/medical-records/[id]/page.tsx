'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { medicalRecordsAPI } from '../../../../lib/api';
import { useAuth } from '../../../../contexts/AuthContext';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import { ArrowLeft, User, Calendar, FileText, Pill, Activity, Edit, Trash2 } from 'lucide-react';

export default function ViewMedicalRecordPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth() as any;
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<any>(null);

  const id = Array.isArray(params?.id) ? params?.id[0] : (params as any)?.id;

  useEffect(() => {
    if (!authLoading && user && user.role !== 'healthcare_professional') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (id && user) fetchRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const res = await medicalRecordsAPI.getById(id as string);
      setRecord(res.data.data.medicalRecord);
    } catch (err) {
      toast.error('Failed to load medical record');
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async () => {
    if (!confirm('Delete this medical record? This cannot be undone.')) return;
    try {
      await medicalRecordsAPI.delete(id as string);
      toast.success('Medical record deleted');
      router.push('/doctor/medical-records');
    } catch (err) {
      toast.error('Failed to delete record');
    }
  };

  if (authLoading || loading || !record) {
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
            <Link href="/doctor/medical-records" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Records
            </Link>
            <div className="flex space-x-2">
              <Link
                href={`/doctor/medical-records/${id}/edit`}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 inline-flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" /> Edit
              </Link>
              <button
                onClick={deleteRecord}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 inline-flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Patient Info */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <User className="w-10 h-10 text-gray-400" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {record.patientID?.userName || 'Unknown Patient'}
              </h2>
              <p className="text-sm text-gray-500">{record.patientID?.email}</p>
              <p className="text-sm text-gray-500">{record.patientID?.phone}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Visit Date:</span>
              <p className="font-medium">{new Date(record.visitDate).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-gray-500">Hospital:</span>
              <p className="font-medium">{record.hospitalID?.name || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Chief Complaint */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center mb-3">
            <FileText className="w-5 h-5 text-indigo-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Chief Complaint</h3>
          </div>
          <p className="text-gray-700">{record.chiefComplaint}</p>
        </div>

        {/* History */}
        {record.history && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center mb-3">
              <FileText className="w-5 h-5 text-indigo-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">History</h3>
            </div>
            <div className="space-y-2 text-sm">
              {record.history.presentIllness && (
                <div>
                  <span className="font-medium">Present Illness:</span>
                  <p className="text-gray-700">{record.history.presentIllness}</p>
                </div>
              )}
              {record.history.pastMedical && (
                <div>
                  <span className="font-medium">Past Medical:</span>
                  <p className="text-gray-700">{record.history.pastMedical}</p>
                </div>
              )}
              {record.history.familyHistory && (
                <div>
                  <span className="font-medium">Family History:</span>
                  <p className="text-gray-700">{record.history.familyHistory}</p>
                </div>
              )}
              {record.history.allergies && record.history.allergies.length > 0 && (
                <div>
                  <span className="font-medium">Allergies:</span>
                  <p className="text-gray-700">{record.history.allergies.join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Physical Examination */}
        {record.physicalExamination && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center mb-3">
              <Activity className="w-5 h-5 text-indigo-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Physical Examination</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {record.physicalExamination.vitalSigns && (
                <div className="col-span-2">
                  <span className="font-medium">Vital Signs:</span>
                  <div className="mt-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {record.physicalExamination.vitalSigns.bloodPressure && (
                      <div>BP: {record.physicalExamination.vitalSigns.bloodPressure}</div>
                    )}
                    {record.physicalExamination.vitalSigns.heartRate && (
                      <div>HR: {record.physicalExamination.vitalSigns.heartRate} bpm</div>
                    )}
                    {record.physicalExamination.vitalSigns.temperature && (
                      <div>Temp: {record.physicalExamination.vitalSigns.temperature}°C</div>
                    )}
                    {record.physicalExamination.vitalSigns.respiratoryRate && (
                      <div>RR: {record.physicalExamination.vitalSigns.respiratoryRate} /min</div>
                    )}
                  </div>
                </div>
              )}
              {record.physicalExamination.generalExamination && (
                <div className="col-span-2">
                  <span className="font-medium">General Examination:</span>
                  <p className="text-gray-700">{record.physicalExamination.generalExamination}</p>
                </div>
              )}
              {record.physicalExamination.systemicExamination && (
                <div className="col-span-2">
                  <span className="font-medium">Systemic Examination:</span>
                  <p className="text-gray-700">{record.physicalExamination.systemicExamination}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Diagnosis */}
        {record.diagnosis && record.diagnosis.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center mb-3">
              <FileText className="w-5 h-5 text-indigo-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Diagnosis</h3>
            </div>
            <div className="space-y-2">
              {record.diagnosis.map((diag: any, idx: number) => (
                <div key={idx} className="border-l-4 border-indigo-500 pl-3">
                  <p className="font-medium">{diag.description}</p>
                  {diag.code && <p className="text-sm text-gray-500">Code: {diag.code}</p>}
                  {diag.notes && <p className="text-sm text-gray-600">{diag.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Treatment Plan */}
        {record.treatmentPlan && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center mb-3">
              <Pill className="w-5 h-5 text-indigo-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Treatment Plan</h3>
            </div>
            <div className="space-y-4">
              {record.treatmentPlan.medications && record.treatmentPlan.medications.length > 0 && (
                <div>
                  <span className="font-medium">Medications:</span>
                  <div className="mt-2 space-y-2">
                    {record.treatmentPlan.medications.map((med: any, idx: number) => (
                      <div key={idx} className="border border-gray-200 rounded p-3">
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-gray-600">
                          {med.dosage} - {med.frequency} - {med.duration}
                        </p>
                        {med.instructions && <p className="text-sm text-gray-500">{med.instructions}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {record.treatmentPlan.procedures && record.treatmentPlan.procedures.length > 0 && (
                <div>
                  <span className="font-medium">Procedures:</span>
                  <ul className="mt-1 list-disc list-inside text-sm text-gray-700">
                    {record.treatmentPlan.procedures.map((proc: string, idx: number) => (
                      <li key={idx}>{proc}</li>
                    ))}
                  </ul>
                </div>
              )}
              {record.treatmentPlan.recommendations && (
                <div>
                  <span className="font-medium">Recommendations:</span>
                  <p className="text-sm text-gray-700">{record.treatmentPlan.recommendations}</p>
                </div>
              )}
              {record.treatmentPlan.followUpDate && (
                <div>
                  <span className="font-medium">Follow-up Date:</span>
                  <p className="text-sm text-gray-700">
                    {new Date(record.treatmentPlan.followUpDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress Notes */}
        {record.progressNotes && record.progressNotes.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center mb-3">
              <FileText className="w-5 h-5 text-indigo-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Progress Notes</h3>
            </div>
            <div className="space-y-3">
              {record.progressNotes.map((note: any, idx: number) => (
                <div key={idx} className="border-l-2 border-gray-300 pl-3">
                  <p className="text-sm text-gray-500">{new Date(note.date).toLocaleDateString()}</p>
                  <p className="text-gray-700">{note.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

