'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { usersAPI } from '../../../../lib/api';
import { useAuth } from '../../../../contexts/AuthContext';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import { ArrowLeft, Edit, User, Phone, Mail, MapPin, Heart } from 'lucide-react';

export default function ViewPatientPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);

  const id = Array.isArray(params?.id) ? params?.id[0] : (params as any)?.id;

  useEffect(() => {
    if (!authLoading && user && user.role !== 'hospital_staff') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (id && user) fetchPatient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const res = await usersAPI.getById(id as string);
      setPatient(res.data.data.user);
    } catch (err) {
      toast.error('Failed to load patient');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading || !patient) {
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
            <Link href="/staff/patients" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Patients
            </Link>
            <Link
              href={`/staff/patients/${id}/edit`}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 inline-flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" /> Edit
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <User className="w-12 h-12 text-indigo-600" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{patient.userName}</h2>
              <p className="text-sm text-gray-500 mt-1">Patient ID: {patient.patientID}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
          <div className="space-y-2">
            <div className="flex items-center text-gray-700">
              <Mail className="w-4 h-4 mr-2" />
              <span>{patient.email}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Phone className="w-4 h-4 mr-2" />
              <span>{patient.phone}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <MapPin className="w-4 h-4 mr-2" />
              <span>
                {patient.address?.street}, {patient.address?.city}, {patient.address?.state} {patient.address?.zipCode}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Medical Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-gray-500">Blood Type</span>
              <p className="text-gray-900 font-medium">{patient.bloodType || 'N/A'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Height</span>
              <p className="text-gray-900">{patient.height ? `${patient.height} cm` : 'N/A'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Weight</span>
              <p className="text-gray-900">{patient.weight ? `${patient.weight} kg` : 'N/A'}</p>
            </div>
          </div>
        </div>

        {patient.emergencyContact && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-3">
              <Heart className="w-5 h-5 text-red-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Emergency Contact</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Name</span>
                <p className="text-gray-900">{patient.emergencyContact.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Relationship</span>
                <p className="text-gray-900">{patient.emergencyContact.relationship}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Phone</span>
                <p className="text-gray-900">{patient.emergencyContact.phone}</p>
              </div>
              {patient.emergencyContact.email && (
                <div>
                  <span className="text-sm text-gray-500">Email</span>
                  <p className="text-gray-900">{patient.emergencyContact.email}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

