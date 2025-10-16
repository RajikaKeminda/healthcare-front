'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { appointmentsAPI, medicalRecordsAPI } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { ArrowLeft, User, Search, FileText, Calendar } from 'lucide-react';

export default function DoctorPatientsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth() as any;
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && user && user.role !== 'healthcare_professional') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      // Get all appointments for this doctor to find unique patients
      const aptsRes = await appointmentsAPI.getAll({ doctorID: user._id, limit: 100 });
      const appointments = aptsRes.data.data.appointments;

      // Extract unique patients
      const uniquePatientsMap = new Map();
      appointments.forEach((apt: any) => {
        if (apt.patientID && !uniquePatientsMap.has(apt.patientID._id)) {
          uniquePatientsMap.set(apt.patientID._id, {
            ...apt.patientID,
            appointmentsCount: 0,
            lastAppointment: null
          });
        }
      });

      // Count appointments per patient and find last appointment
      appointments.forEach((apt: any) => {
        if (apt.patientID) {
          const patient = uniquePatientsMap.get(apt.patientID._id);
          patient.appointmentsCount++;
          if (!patient.lastAppointment || new Date(apt.date) > new Date(patient.lastAppointment)) {
            patient.lastAppointment = apt.date;
          }
        }
      });

      // Fetch medical records count for each patient
      const patientsArray = Array.from(uniquePatientsMap.values());
      for (const patient of patientsArray) {
        try {
          const recordsRes = await medicalRecordsAPI.getAll({ 
            patientID: patient._id, 
            doctorID: user._id,
            limit: 1000 
          });
          patient.recordsCount = recordsRes.data.data.medicalRecords.length;
        } catch {
          patient.recordsCount = 0;
        }
      }

      setPatients(patientsArray);
    } catch (err) {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      patient.userName?.toLowerCase().includes(query) ||
      patient.email?.toLowerCase().includes(query) ||
      patient.phone?.toLowerCase().includes(query)
    );
  });

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
            <Link href="/doctor/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">My Patients</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Search */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Patients List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Patients ({filteredPatients.length})
            </h2>
            {filteredPatients.length > 0 ? (
              <div className="space-y-4">
                {filteredPatients.map((patient) => (
                  <div key={patient._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-4 flex-1">
                        <User className="w-10 h-10 text-gray-400" />
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {patient.userName}
                          </h3>
                          <p className="text-sm text-gray-500">{patient.email}</p>
                          <p className="text-sm text-gray-500">{patient.phone}</p>
                          <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {patient.appointmentsCount} appointments
                            </div>
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 mr-1" />
                              {patient.recordsCount || 0} records
                            </div>
                          </div>
                          {patient.lastAppointment && (
                            <p className="mt-1 text-sm text-gray-500">
                              Last visit: {new Date(patient.lastAppointment).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Link
                          href={`/doctor/medical-records?patientID=${patient._id}`}
                          className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 text-center"
                        >
                          View Records
                        </Link>
                        <Link
                          href={`/doctor/medical-records/create?patientId=${patient._id}`}
                          className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-center"
                        >
                          Add Record
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                {searchQuery ? 'No patients found matching your search' : 'No patients yet'}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

